import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoEntity } from './todo.entity';
import { Todo } from './todo.model';
import { UserEntity } from '../user/user.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TodoService {
  private static readonly USER_TODOS_TTL_SECONDS = 300;

  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const user = await this.userRepository.findOneBy({
      id: createTodoDto.userId,
    });
    if (!user) {
      throw new NotFoundException(`User ${createTodoDto.userId} was not found`);
    }

    const todo = this.todoRepository.create({
      title: createTodoDto.title,
      description: createTodoDto.description ?? null,
      user,
    });

    const savedTodo = await this.todoRepository.save(todo);
    await this.redisService.delete(this.getUserTodosCacheKey(user.id));
    return this.toResponse(savedTodo);
  }

  async findAll(): Promise<Todo[]> {
    const todos = await this.todoRepository.find({
      order: { id: 'ASC' },
    });

    return todos.map((todo) => this.toResponse(todo));
  }

  async findByUser(userId: number): Promise<Todo[]> {
    const cacheKey = this.getUserTodosCacheKey(userId);
    const cachedTodos = await this.redisService.get(cacheKey);
    if (cachedTodos !== null) {
      return JSON.parse(cachedTodos) as Todo[];
    }

    const todos = await this.todoRepository.find({
      where: { user: { id: userId } },
      order: { id: 'ASC' },
    });
    const response = todos.map((todo) => this.toResponse(todo));

    await this.redisService.set(
      cacheKey,
      JSON.stringify(response),
      TodoService.USER_TODOS_TTL_SECONDS,
    );

    return response;
  }

  async findOne(id: number): Promise<Todo> {
    const todo = await this.findEntity(id);
    return this.toResponse(todo);
  }

  async update(id: number, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findEntity(id);

    if (updateTodoDto.title !== undefined) {
      todo.title = updateTodoDto.title;
    }

    if (updateTodoDto.description !== undefined) {
      todo.description = updateTodoDto.description;
    }

    const savedTodo = await this.todoRepository.save(todo);
    await this.redisService.delete(
      this.getUserTodosCacheKey(todo.user.id),
    );
    return this.toResponse(savedTodo);
  }

  async remove(id: number): Promise<Todo> {
    const todo = await this.findEntity(id);
    const response = this.toResponse(todo);
    await this.todoRepository.remove(todo);
    await this.redisService.delete(
      this.getUserTodosCacheKey(todo.user.id),
    );
    return response;
  }

  private getUserTodosCacheKey(userId: number): string {
    return `todos:user:${userId}`;
  }

  private async findEntity(id: number): Promise<TodoEntity> {
    const todo = await this.todoRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!todo) {
      throw new NotFoundException(`Todo ${id} was not found`);
    }

    return todo;
  }

  private toResponse(entity: TodoEntity): Todo {
    return {
      id: entity.id,
      title: entity.title,
      ...(entity.description === null
        ? {}
        : { description: entity.description }),
    };
  }
}

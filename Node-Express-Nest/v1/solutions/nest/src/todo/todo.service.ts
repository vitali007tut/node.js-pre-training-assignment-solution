import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoEntity } from './todo.entity';
import { Todo } from './todo.model';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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

    return this.toResponse(await this.todoRepository.save(todo));
  }

  async findAll(): Promise<Todo[]> {
    const todos = await this.todoRepository.find({
      order: { id: 'ASC' },
    });

    return todos.map((todo) => this.toResponse(todo));
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

    return this.toResponse(await this.todoRepository.save(todo));
  }

  async remove(id: number): Promise<Todo> {
    const todo = await this.findEntity(id);
    const response = this.toResponse(todo);
    await this.todoRepository.remove(todo);
    return response;
  }

  private async findEntity(id: number): Promise<TodoEntity> {
    const todo = await this.todoRepository.findOneBy({ id });
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

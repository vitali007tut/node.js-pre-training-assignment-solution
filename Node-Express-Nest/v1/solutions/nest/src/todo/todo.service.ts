import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoEntity } from './todo.entity';
import { Todo } from './todo.model';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create({
      title: createTodoDto.title,
      description: createTodoDto.description ?? null,
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
    await this.todoRepository.remove(todo);
    return this.toResponse(todo);
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

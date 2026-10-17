import { Todo, NewTodo } from './types';
import { createTodo } from './todo-factory';
import { InMemoryRepository } from './repository';

export class TodoNotFoundError extends Error {
  constructor(public readonly id: number) {
    super(`Todo with id ${id} not found`);
    this.name = 'TodoNotFoundError';
  }
}

export class TodoApi {
  constructor(private readonly repo = new InMemoryRepository<Todo>()) {}

  private delay(ms = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getAll(): Promise<Todo[]> {
    await this.delay();
    return this.repo.findAll();
  }

  async add(newTodo: NewTodo): Promise<Todo> {
    await this.delay();

    const todo = createTodo(newTodo);
    return this.repo.add(todo);
  }

  async update(id: number, update: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<Todo> {
    await this.delay();

    if (this.repo.findById(id) === undefined) {
      throw new TodoNotFoundError(id);
    }

    return this.repo.update(id, update);
  }

  async remove(id: number): Promise<void> {
    await this.delay();

    if (this.repo.findById(id) === undefined) {
      throw new TodoNotFoundError(id);
    }

    this.repo.remove(id);
  }
}

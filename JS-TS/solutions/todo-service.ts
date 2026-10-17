import { TodoApi } from './todo-api';
import { Todo, TodoStatus } from './types';

const STATUS_CYCLE: Record<TodoStatus, TodoStatus> = {
  [TodoStatus.PENDING]: TodoStatus.IN_PROGRESS,
  [TodoStatus.IN_PROGRESS]: TodoStatus.COMPLETED,
  [TodoStatus.COMPLETED]: TodoStatus.PENDING,
};

export class TodoService {
  constructor(private readonly api: TodoApi) {}

  async create(title: string, description?: string): Promise<Todo> {
    const normalizedTitle = title.trim();
    if (normalizedTitle.length === 0) {
      throw new Error('Title must not be empty');
    }

    return this.api.add({ title: normalizedTitle, description });
  }

  async toggleStatus(id: number): Promise<Todo> {
    const todos = await this.api.getAll();
    const todo = todos.find((item) => item.id === id);
    if (todo === undefined) {
      throw new Error(`Todo with id ${id} not found`);
    }

    const nextStatus = STATUS_CYCLE[todo.status];
    return this.api.update(id, { status: nextStatus });
  }

  async setStatus(id: number, status: TodoStatus): Promise<Todo> {
    return this.api.update(id, { status });
  }

  async search(keyword: string): Promise<Todo[]> {
    const query = keyword.trim().toLowerCase();
    const todos = await this.api.getAll();

    return todos.filter((todo) => {
      const title = todo.title.toLowerCase();
      const description = (todo.description ?? '').toLowerCase();
      return title.includes(query) || description.includes(query);
    });
  }
}

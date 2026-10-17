import { TodoApi } from '../JS-TS/solutions/todo-api';
import { TodoService } from '../JS-TS/solutions/todo-service';
import { InMemoryRepository } from '../JS-TS/solutions/repository';
import { TodoStatus } from '../JS-TS/solutions/types';

describe('Task 09: TodoService and repository', () => {
  beforeAll(() => {
    jest.spyOn(global, 'setTimeout').mockImplementation(((callback: () => void) => {
      callback();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('TodoService', () => {
    let service: TodoService;

    beforeEach(() => {
      service = new TodoService(new TodoApi());
    });

    it('creates a todo with id, createdAt and PENDING status', async () => {
      const todo = await service.create('Buy milk', 'From the store');

      expect(todo.id).toBeGreaterThan(0);
      expect(todo.title).toBe('Buy milk');
      expect(todo.description).toBe('From the store');
      expect(todo.status).toBe(TodoStatus.PENDING);
      expect(todo.createdAt).toBeInstanceOf(Date);
    });

    it('trims the title when creating', async () => {
      const todo = await service.create('  Buy milk  ');

      expect(todo.title).toBe('Buy milk');
    });

    it('rejects an empty or whitespace-only title', async () => {
      await expect(service.create('')).rejects.toThrow('Title must not be empty');
      await expect(service.create('   ')).rejects.toThrow('Title must not be empty');
    });

    it('toggles status through the full cycle', async () => {
      const todo = await service.create('Cycle');

      const inProgress = await service.toggleStatus(todo.id);
      expect(inProgress.status).toBe(TodoStatus.IN_PROGRESS);

      const completed = await service.toggleStatus(todo.id);
      expect(completed.status).toBe(TodoStatus.COMPLETED);

      const pending = await service.toggleStatus(todo.id);
      expect(pending.status).toBe(TodoStatus.PENDING);
    });

    it('throws when toggling a non-existing id', async () => {
      await expect(service.toggleStatus(-1)).rejects.toThrow();
    });

    it('sets a specific status', async () => {
      const todo = await service.create('Set status');

      const updated = await service.setStatus(todo.id, TodoStatus.COMPLETED);
      expect(updated.status).toBe(TodoStatus.COMPLETED);
    });

    it('throws when setStatus is called with a non-existing id', async () => {
      await expect(service.setStatus(-1, TodoStatus.COMPLETED)).rejects.toThrow();
    });

    it('searches by title and description case-insensitively', async () => {
      await service.create('Grocery list', 'milk and BREAD');
      await service.create('Workout', 'go to the gym');

      const byTitle = await service.search('GROCERY');
      expect(byTitle).toHaveLength(1);
      expect(byTitle[0].title).toBe('Grocery list');

      const byDescription = await service.search('bread');
      expect(byDescription).toHaveLength(1);
      expect(byDescription[0].title).toBe('Grocery list');
    });

    it('returns an empty array when nothing matches', async () => {
      await service.create('Only one');

      const result = await service.search('zzz-nothing');
      expect(result).toEqual([]);
    });
  });

  describe('InMemoryRepository', () => {
    interface Entity {
      id: number;
      value: string;
    }

    let repo: InMemoryRepository<Entity>;

    beforeEach(() => {
      repo = new InMemoryRepository<Entity>();
      repo.add({ id: 1, value: 'A' });
      repo.add({ id: 2, value: 'B' });
    });

    it('adds an entity and findAll returns a copy', () => {
      const added = repo.add({ id: 3, value: 'C' });
      expect(added).toEqual({ id: 3, value: 'C' });

      const all = repo.findAll();
      expect(all).toHaveLength(3);

      all.push({ id: 4, value: 'D' });
      expect(repo.findAll()).toHaveLength(3);
    });

    it('finds by id and returns undefined when missing', () => {
      expect(repo.findById(1)?.value).toBe('A');
      expect(repo.findById(99)).toBeUndefined();
    });

    it('updates an existing entity', () => {
      const updated = repo.update(1, { value: 'AA' });

      expect(updated.value).toBe('AA');
      expect(repo.findById(1)?.value).toBe('AA');
    });

    it('throws when updating a non-existing entity', () => {
      expect(() => repo.update(99, { value: 'X' })).toThrow();
    });

    it('removes an existing entity', () => {
      repo.remove(2);

      expect(repo.findById(2)).toBeUndefined();
      expect(repo.findAll()).toHaveLength(1);
    });

    it('throws when removing a non-existing entity', () => {
      expect(() => repo.remove(99)).toThrow();
    });
  });
});

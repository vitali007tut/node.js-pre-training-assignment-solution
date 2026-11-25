import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoEntity } from './todo.entity';
import { TodoService } from './todo.service';
import { UserEntity } from '../user/user.entity';
import { RedisService } from '../redis/redis.service';

describe('TodoService', () => {
  let service: TodoService;
  let repository: jest.Mocked<
    Pick<
      Repository<TodoEntity>,
      'create' | 'save' | 'find' | 'findOne' | 'remove'
    >
  >;
  let userRepository: jest.Mocked<Pick<Repository<UserEntity>, 'findOneBy'>>;
  let redisService: jest.Mocked<
    Pick<RedisService, 'get' | 'set' | 'delete'>
  >;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    userRepository = {
      findOneBy: jest.fn(),
    };
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        {
          provide: getRepositoryToken(TodoEntity),
          useValue: repository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: userRepository,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get(TodoService);
  });

  it('maps DTOs through the repository and returns API response objects', async () => {
    const user: UserEntity = {
      id: 1,
      name: 'Test User',
      email: 'test.user@example.com',
      createdAt: new Date(),
      todos: [],
    };
    const entity: TodoEntity = {
      id: 1,
      title: 'Learn NestJS',
      description: null,
      status: 'active',
      createdAt: new Date(),
      user,
    };
    const updatedEntity = {
      ...entity,
      description: 'Study modules and DTOs',
    };

    repository.create.mockReturnValue(entity);
    repository.save
      .mockResolvedValueOnce(entity)
      .mockResolvedValueOnce(updatedEntity);
    repository.find.mockResolvedValue([entity]);
    repository.findOne.mockResolvedValue(entity);
    repository.remove.mockImplementation(async (removedTodo) => {
      Object.defineProperty(removedTodo, 'id', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      return removedTodo;
    });
    userRepository.findOneBy.mockResolvedValue(user);

    const createDto: CreateTodoDto = { title: 'Learn NestJS', userId: 1 };
    const created = await service.create(createDto);
    expect(repository.create).toHaveBeenCalledWith({
      title: 'Learn NestJS',
      description: null,
      user,
    });
    expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(redisService.delete).toHaveBeenNthCalledWith(1, 'todos:user:1');
    expect(created).toEqual({ id: 1, title: 'Learn NestJS' });

    expect(await service.findAll()).toEqual([created]);
    expect(repository.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });

    expect(await service.findOne(1)).toEqual(created);

    const updateDto: UpdateTodoDto = {
      description: 'Study modules and DTOs',
    };
    const updated = await service.update(1, updateDto);
    expect(redisService.delete).toHaveBeenNthCalledWith(2, 'todos:user:1');
    expect(updated).toEqual({
      id: 1,
      title: 'Learn NestJS',
      description: 'Study modules and DTOs',
    });

    expect(await service.remove(1)).toEqual(updated);
    expect(repository.remove).toHaveBeenCalledWith(entity);
    expect(redisService.delete).toHaveBeenNthCalledWith(3, 'todos:user:1');
  });

  it('throws NotFoundException for missing todos', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(404)).rejects.toThrow(NotFoundException);
    await expect(service.update(404, { title: 'missing' })).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.remove(404)).rejects.toThrow(NotFoundException);
  });

  it('caches a user todo list and serves a cache hit without querying the database', async () => {
    const user: UserEntity = {
      id: 1,
      name: 'Test User',
      email: 'test.user@example.com',
      createdAt: new Date(),
      todos: [],
    };
    const entity: TodoEntity = {
      id: 1,
      title: 'Learn NestJS',
      description: null,
      status: 'active',
      createdAt: new Date(),
      user,
    };
    const expected = [{ id: 1, title: 'Learn NestJS' }];

    redisService.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(JSON.stringify(expected));
    repository.find.mockResolvedValue([entity]);

    expect(await service.findByUser(1)).toEqual(expected);
    expect(repository.find).toHaveBeenCalledWith({
      where: { user: { id: 1 } },
      order: { id: 'ASC' },
    });
    expect(redisService.set).toHaveBeenCalledWith(
      'todos:user:1',
      JSON.stringify(expected),
      300,
    );

    expect(await service.findByUser(1)).toEqual(expected);
    expect(repository.find).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when creating a todo for a missing user', async () => {
    userRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({ title: 'Learn SQL', userId: 404 }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});

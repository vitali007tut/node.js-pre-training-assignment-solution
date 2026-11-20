import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../logger/logger.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let logger: { log: jest.Mock };

  beforeEach(async () => {
    logger = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: LoggerService,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  it('returns a user and logs the lookup', () => {
    expect(service.findById(1)).toEqual({
      id: 1,
      name: 'Alice',
      role: 'admin',
    });
    expect(logger.log).toHaveBeenNthCalledWith(
      1,
      'UserService',
      'Looking for user 1',
    );
    expect(logger.log).toHaveBeenNthCalledWith(
      2,
      'UserService',
      'Found user 1: Alice',
    );
  });

  it('throws when the user does not exist', () => {
    expect(() => service.findById(999)).toThrow('User 999 was not found');
  });
});

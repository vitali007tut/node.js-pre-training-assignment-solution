import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { User } from './user.model';

@Injectable()
export class UserService {
  private readonly users: User[] = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'member' },
  ];

  constructor(private readonly logger: LoggerService) {}

  findById(id: number): User {
    this.logger.log('UserService', `Looking for user ${id}`);

    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException(`User ${id} was not found`);
    }

    this.logger.log('UserService', `Found user ${id}: ${user.name}`);
    return user;
  }
}

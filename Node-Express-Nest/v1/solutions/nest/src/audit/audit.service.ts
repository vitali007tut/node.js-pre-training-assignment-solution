import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { AuditRecord } from './audit.model';

@Injectable()
export class AuditService {
  constructor(private readonly userService: UserService) {}

  auditUser(userId: number): AuditRecord {
    const user = this.userService.findById(userId);

    return {
      checkedAt: new Date().toISOString(),
      user,
      action: 'user-lookup',
    };
  }
}

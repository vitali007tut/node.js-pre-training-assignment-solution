import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let userService: { findById: jest.Mock };

  beforeEach(async () => {
    userService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  it('looks up the user and creates an audit record', () => {
    const user = { id: 2, name: 'Bob', role: 'member' as const };
    userService.findById.mockReturnValue(user);

    const record = service.auditUser(2);

    expect(userService.findById).toHaveBeenCalledWith(2);
    expect(record).toEqual({
      checkedAt: expect.any(String),
      user,
      action: 'user-lookup',
    });
  });
});

import { User } from '../user/user.model';

export interface AuditRecord {
  checkedAt: string;
  user: User;
  action: 'user-lookup';
}

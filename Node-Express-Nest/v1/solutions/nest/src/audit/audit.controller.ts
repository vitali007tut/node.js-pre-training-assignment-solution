import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':userId')
  auditUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.auditService.auditUser(userId);
  }
}

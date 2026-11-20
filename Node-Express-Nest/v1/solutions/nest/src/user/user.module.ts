import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { UserService } from './user.service';

@Module({
  imports: [LoggerModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

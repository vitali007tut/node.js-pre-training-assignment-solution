import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/audit.module';
import { databaseOptions } from './database/database.config';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { MathModule } from './math/math.module';
import { TodoModule } from './todo/todo.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions),
    MathModule,
    AuditModule,
    LifecycleModule,
    TodoModule,
  ],
})
export class AppModule {}

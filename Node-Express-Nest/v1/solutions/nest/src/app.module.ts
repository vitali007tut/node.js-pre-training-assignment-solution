import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { AuditModule } from './audit/audit.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { MathModule } from './math/math.module';
import { TodoEntity } from './todo/todo.entity';
import { TodoModule } from './todo/todo.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, '..', 'todos.sqlite'),
      entities: [TodoEntity],
      synchronize: true,
    }),
    MathModule,
    AuditModule,
    LifecycleModule,
    TodoModule,
  ],
})
export class AppModule {}

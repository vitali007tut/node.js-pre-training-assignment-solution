import 'dotenv/config';
import { DataSourceOptions } from 'typeorm';
import { TodoEntity } from '../todo/todo.entity';
import { UserEntity } from '../user/user.entity';

const port = Number(process.env.DB_PORT ?? 5432);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be an integer between 1 and 65535');
}

export const databaseOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port,
  username: process.env.DB_USERNAME ?? 'postgres',
  ...(process.env.DB_PASSWORD ? { password: process.env.DB_PASSWORD } : {}),
  database: process.env.DB_DATABASE ?? 'todo_app',
  entities: [TodoEntity, UserEntity],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
};

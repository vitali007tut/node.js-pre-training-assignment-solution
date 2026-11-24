import { DataSource } from 'typeorm';
import { databaseOptions } from './database.config';
import { TodoEntity } from '../todo/todo.entity';
import { UserEntity } from '../user/user.entity';

const seedUsers = [
  {
    name: 'Task 7 User One',
    email: 'task7.user.one@example.com',
    todos: ['Learn TypeORM', 'Practice PostgreSQL', 'Review migrations'],
  },
  {
    name: 'Task 7 User Two',
    email: 'task7.user.two@example.com',
    todos: ['Build a todo app', 'Write a seed script', 'Study relations'],
  },
];

async function seed(): Promise<void> {
  const dataSource = new DataSource(databaseOptions);
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const users = manager.getRepository(UserEntity);
      const todos = manager.getRepository(TodoEntity);

      for (const seedUser of seedUsers) {
        let user = await users.findOneBy({ email: seedUser.email });
        if (!user) {
          user = await users.save(
            users.create({ name: seedUser.name, email: seedUser.email }),
          );
        }

        for (const title of seedUser.todos) {
          const existingTodo = await todos.findOne({
            where: { title, user: { id: user.id } },
          });
          if (!existingTodo) {
            await todos.save(todos.create({ title, user }));
          }
        }
      }
    });
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('Failed to seed the database:', error);
  process.exitCode = 1;
});

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndTodos1795478400000
  implements MigrationInterface
{
  name = 'CreateUsersAndTodos1795478400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name text NOT NULL CHECK (length(trim(name)) > 0),
        email text NOT NULL UNIQUE CHECK (length(trim(email)) > 0),
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        title text NOT NULL CHECK (length(trim(title)) > 0),
        description text,
        status text NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'completed')),
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id integer NOT NULL,
        CONSTRAINT todos_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'todos_user_id_fkey'
            AND conrelid = 'todos'::regclass
        ) THEN
          ALTER TABLE todos
          ADD CONSTRAINT todos_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id);
        END IF;
      END;
      $$
    `);
  }

  async down(): Promise<void> {
    throw new Error(
      'This migration adopts the existing todo_app schema and will not drop its data.',
    );
  }
}

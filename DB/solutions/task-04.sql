CREATE TABLE users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  email text NOT NULL UNIQUE CHECK (length(trim(email)) > 0),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email)
VALUES ('Test User', 'test.user@example.com')
RETURNING id;

ALTER TABLE todos
ADD CONSTRAINT todos_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id);

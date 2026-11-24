INSERT INTO todos (title, description, status, user_id)
VALUES (
  'Practice SQL CRUD',
  'Practice INSERT, SELECT, UPDATE, and DELETE',
  'active',
  1
)
RETURNING id;

SELECT * FROM todos;

UPDATE todos
SET status = 'completed'
WHERE id = (
  SELECT id
  FROM todos
  WHERE title = 'Practice SQL CRUD'
  ORDER BY id DESC
  LIMIT 1
)
RETURNING *;

DELETE FROM todos
WHERE id = (
  SELECT id
  FROM todos
  WHERE title = 'Practice SQL CRUD'
  ORDER BY id DESC
  LIMIT 1
)
RETURNING *;

SELECT * FROM todos;

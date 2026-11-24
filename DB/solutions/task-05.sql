INSERT INTO users (name, email)
VALUES ('No Todo User', 'no.todos@example.com')
ON CONFLICT (email) DO NOTHING;

SELECT status, COUNT(*) AS todo_count
FROM todos
GROUP BY status
ORDER BY status;

SELECT u.name, COUNT(t.id) AS todo_count
FROM users u
LEFT JOIN todos t ON t.user_id = u.id
GROUP BY u.id, u.name
ORDER BY u.id;

SELECT u.id, u.name, u.email
FROM users u
WHERE NOT EXISTS (
  SELECT 1
  FROM todos t
  WHERE t.user_id = u.id
);

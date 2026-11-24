INSERT INTO todos (title, description, status, created_at, user_id)
VALUES
  (
    'Prepare agenda',
    'Discuss release plan during meeting',
    'active',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    1
  ),
  (
    'Schedule team meeting',
    'Review sprint goals',
    'active',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    1
  ),
  (
    'Buy groceries',
    'Milk and bread',
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    1
  ),
  (
    'Read SQL chapter',
    'Study ILIKE patterns',
    'completed',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    1
  ),
  (
    'Submit timesheet',
    'Update work log',
    'active',
    CURRENT_TIMESTAMP,
    1
  );

SELECT * FROM todos WHERE status = 'active';

SELECT * FROM todos WHERE status = 'completed';

SELECT * FROM todos ORDER BY created_at ASC;

SELECT * FROM todos ORDER BY created_at DESC;

SELECT *
FROM todos
WHERE title ILIKE '%meeting%'
   OR description ILIKE '%meeting%';

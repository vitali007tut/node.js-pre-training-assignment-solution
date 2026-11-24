CREATE INDEX IF NOT EXISTS idx_todos_status
ON todos (status);

EXPLAIN ANALYZE
SELECT *
FROM todos
WHERE status = 'active';

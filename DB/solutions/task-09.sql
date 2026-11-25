BEGIN;

CREATE TABLE IF NOT EXISTS audit_log (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  todo_id integer NOT NULL,
  action text NOT NULL CHECK (action IN ('UPDATE', 'DELETE')),
  changed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION log_todo_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_log (todo_id, action)
  VALUES (OLD.id, TG_OP);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS todos_audit_update ON todos;
CREATE TRIGGER todos_audit_update
AFTER UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION log_todo_change();

DROP TRIGGER IF EXISTS todos_audit_delete ON todos;
CREATE TRIGGER todos_audit_delete
AFTER DELETE ON todos
FOR EACH ROW
EXECUTE FUNCTION log_todo_change();

COMMIT;

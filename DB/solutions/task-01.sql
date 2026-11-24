CREATE TABLE todos (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id integer NOT NULL
);

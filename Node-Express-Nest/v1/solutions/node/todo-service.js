class TodoValidationError extends Error {
  constructor(errors) {
    super("Validation failed");
    this.name = "TodoValidationError";
    this.errors = errors;
  }
}

function validateTodo(todoData, isUpdate = false) {
  const errors = [];
  const isObject =
    todoData !== null && typeof todoData === "object" && !Array.isArray(todoData);

  if (!isObject) {
    return { isValid: false, errors: ["Request body must be a JSON object"] };
  }

  if (!isUpdate && !Object.prototype.hasOwnProperty.call(todoData, "title")) {
    errors.push("Title is required");
  } else if (Object.prototype.hasOwnProperty.call(todoData, "title")) {
    if (typeof todoData.title !== "string") {
      errors.push("Title must be a string");
    } else if (!todoData.title.trim()) {
      errors.push("Title cannot be empty");
    } else if (todoData.title.length > 100) {
      errors.push("Title must be 100 characters or fewer");
    }
  }

  if (Object.prototype.hasOwnProperty.call(todoData, "description")) {
    if (typeof todoData.description !== "string") {
      errors.push("Description must be a string");
    } else if (todoData.description.length > 500) {
      errors.push("Description must be 500 characters or fewer");
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(todoData, "completed") &&
    typeof todoData.completed !== "boolean"
  ) {
    errors.push("Completed must be a boolean");
  }

  return { isValid: errors.length === 0, errors };
}

function createSampleTodos() {
  const now = new Date();
  return [
    {
      id: 1,
      title: "Learn Node.js",
      description: "Practice building a small HTTP server",
      completed: false,
      createdAt: new Date(now.getTime() - 86400000),
      updatedAt: new Date(now.getTime() - 86400000),
    },
    {
      id: 2,
      title: "Read the task description",
      description: "Review the requirements for Task 04",
      completed: true,
      createdAt: new Date(now.getTime() - 172800000),
      updatedAt: new Date(now.getTime() - 86400000),
    },
  ];
}

class TodoService {
  constructor(todos = createSampleTodos()) {
    this.todos = todos;
    this.nextId = Math.max(0, ...todos.map((todo) => todo.id)) + 1;
  }

  list(completed) {
    if (completed === undefined) {
      return this.todos;
    }
    return this.todos.filter((todo) => todo.completed === completed);
  }

  findById(id) {
    if (!/^\d+$/.test(String(id))) {
      return null;
    }

    const numericId = Number(id);
    return this.todos.find((todo) => todo.id === numericId) || null;
  }

  create(todoData) {
    const validation = validateTodo(todoData);
    if (!validation.isValid) {
      throw new TodoValidationError(validation.errors);
    }

    const now = new Date();
    const todo = {
      id: this.nextId++,
      title: todoData.title.trim(),
      description: todoData.description === undefined ? "" : todoData.description,
      completed: todoData.completed === undefined ? false : todoData.completed,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.push(todo);
    return todo;
  }

  update(id, updates) {
    const todo = this.findById(id);
    if (!todo) {
      return null;
    }

    const validation = validateTodo(updates, true);
    if (!validation.isValid) {
      throw new TodoValidationError(validation.errors);
    }

    if (Object.prototype.hasOwnProperty.call(updates, "title")) {
      todo.title = updates.title.trim();
    }
    if (Object.prototype.hasOwnProperty.call(updates, "description")) {
      todo.description = updates.description;
    }
    if (Object.prototype.hasOwnProperty.call(updates, "completed")) {
      todo.completed = updates.completed;
    }
    todo.updatedAt = new Date();

    return todo;
  }

  delete(id) {
    const todo = this.findById(id);
    if (!todo) {
      return null;
    }

    const index = this.todos.indexOf(todo);
    if (index === -1) {
      return null;
    }

    return this.todos.splice(index, 1)[0];
  }
}

module.exports = { TodoService, TodoValidationError, validateTodo };

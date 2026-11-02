const http = require("http");

/**
 * Todo REST API Server
 * Built with Node.js built-in HTTP module
 * Supports full CRUD operations with in-memory storage
 */

/**
 * Parse JSON request body from HTTP request
 * @param {IncomingMessage} req - HTTP request object
 * @returns {Promise<Object>} Parsed JSON data
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Extract path parameters from URL pattern
 * @param {string} pattern - URL pattern like '/todos/:id'
 * @param {string} path - Actual path like '/todos/123'
 * @returns {Object} Extracted parameters like { id: "123" }
 */
function parsePathParams(pattern, path) {
  const params = {};
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return params;
  }

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (patternPart.startsWith(":")) {
      try {
        params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      } catch {
        return {};
      }
    } else if (patternPart !== pathPart) {
      return {};
    }
  }

  return params;
}

/**
 * Send consistent JSON response
 * @param {ServerResponse} res - HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Response data
 */
function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  if (statusCode === 204) {
    res.end();
    return;
  }

  res.end(JSON.stringify(data));
}

/**
 * Validate todo data according to business rules
 * @param {Object} todoData - Todo data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} Validation result with errors array
 */
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

/**
 * TodoServer Class - Main HTTP server for Todo API
 */
class TodoServer {
  constructor(port = 3000) {
    this.port = port;
    this.todos = [];
    this.nextId = 1;

    // Sample todos for testing
    this.initializeSampleData();
  }

  /**
   * Initialize server with sample todo data
   */
  initializeSampleData() {
    const now = new Date();
    this.todos = [
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
    this.nextId = 3;
  }

  /**
   * Start the HTTP server
   */
  start() {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
    });

    this.server.listen(this.port, () => {
      const address = this.server.address();
      const port = typeof address === "object" && address ? address.port : this.port;
      console.log("=== Todo Server Started ===");
      console.log(`Server running on http://localhost:${port}`);
    });

    return this.server;
  }

  /**
   * Main request handler - routes requests to appropriate methods
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   */
  async handleRequest(req, res) {
    try {
      const requestUrl = new URL(req.url, "http://localhost");
      const pathname = requestUrl.pathname;
      const query = Object.fromEntries(requestUrl.searchParams);
      const method = req.method;

      if (method === "OPTIONS") {
        this.handleCORS(req, res);
        return;
      }

      if (pathname === "/todos") {
        if (method === "GET") {
          await this.getAllTodos(req, res, query);
        } else if (method === "POST") {
          await this.createTodo(req, res);
        } else {
          sendResponse(res, 405, { success: false, error: "Method not allowed" });
        }
        return;
      }

      const params = parsePathParams("/todos/:id", pathname);
      if (Object.prototype.hasOwnProperty.call(params, "id")) {
        if (method === "GET") {
          await this.getTodoById(req, res, params);
        } else if (method === "PUT") {
          await this.updateTodo(req, res, params);
        } else if (method === "DELETE") {
          await this.deleteTodo(req, res, params);
        } else {
          sendResponse(res, 405, { success: false, error: "Method not allowed" });
        }
        return;
      }

      sendResponse(res, 404, { success: false, error: "Route not found" });
    } catch (error) {
      if (error.message !== "Invalid JSON") {
        console.error("Request handling error:", error);
      }

      const isBadRequest = error.message === "Invalid JSON";
      sendResponse(res, isBadRequest ? 400 : 500, {
        success: false,
        error: isBadRequest ? error.message : "Internal server error",
      });
    }
  }

  /**
   * Handle GET /todos - Get all todos with optional filtering
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} query - URL query parameters
   */
  async getAllTodos(req, res, query) {
    let todos = this.todos;

    if (query.completed !== undefined) {
      if (query.completed !== "true" && query.completed !== "false") {
        sendResponse(res, 400, {
          success: false,
          error: "completed must be true or false",
        });
        return;
      }
      const completed = query.completed === "true";
      todos = todos.filter((todo) => todo.completed === completed);
    }

    sendResponse(res, 200, {
      success: true,
      data: todos,
      count: todos.length,
    });
  }

  /**
   * Handle GET /todos/:id - Get specific todo by ID
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} params - Path parameters
   */
  async getTodoById(req, res, params) {
    const todo = this.findTodoById(params.id);
    if (!todo) {
      const status = /^\d+$/.test(params.id) ? 404 : 400;
      sendResponse(res, status, {
        success: false,
        error: status === 404 ? "Todo not found" : "Invalid todo ID",
      });
      return;
    }

    sendResponse(res, 200, { success: true, data: todo });
  }

  /**
   * Handle POST /todos - Create new todo
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   */
  async createTodo(req, res) {
    const todoData = await parseBody(req);
    const validation = validateTodo(todoData);
    if (!validation.isValid) {
      sendResponse(res, 400, {
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
      return;
    }

    const now = new Date();
    const todo = {
      id: this.generateNextId(),
      title: todoData.title.trim(),
      description: todoData.description === undefined ? "" : todoData.description,
      completed: todoData.completed === undefined ? false : todoData.completed,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.push(todo);
    sendResponse(res, 201, { success: true, data: todo });
  }

  /**
   * Handle PUT /todos/:id - Update existing todo
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} params - Path parameters
   */
  async updateTodo(req, res, params) {
    const todo = this.findTodoById(params.id);
    if (!todo) {
      const status = /^\d+$/.test(params.id) ? 404 : 400;
      sendResponse(res, status, {
        success: false,
        error: status === 404 ? "Todo not found" : "Invalid todo ID",
      });
      return;
    }

    const updates = await parseBody(req);
    const validation = validateTodo(updates, true);
    if (!validation.isValid) {
      sendResponse(res, 400, {
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
      return;
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

    sendResponse(res, 200, { success: true, data: todo });
  }

  /**
   * Handle DELETE /todos/:id - Delete todo
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} params - Path parameters
   */
  async deleteTodo(req, res, params) {
    const index = this.findTodoIndexById(params.id);
    if (index === -1) {
      const status = /^\d+$/.test(params.id) ? 404 : 400;
      sendResponse(res, status, {
        success: false,
        error: status === 404 ? "Todo not found" : "Invalid todo ID",
      });
      return;
    }

    this.todos.splice(index, 1);
    sendResponse(res, 200, {
      success: true,
      message: "Todo deleted successfully",
    });
  }

  /**
   * Handle CORS preflight requests
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   */
  handleCORS(req, res) {
    sendResponse(res, 204);
  }

  /**
   * Find todo by ID in storage
   * @param {number|string} id - Todo ID
   * @returns {Object|null} Found todo or null
   */
  findTodoById(id) {
    if (!/^\d+$/.test(String(id))) {
      return null;
    }

    const numId = Number(id);
    return this.todos.find((todo) => todo.id === numId) || null;
  }

  /**
   * Find todo index by ID in storage
   * @param {number|string} id - Todo ID
   * @returns {number} Todo index or -1 if not found
   */
  findTodoIndexById(id) {
    if (!/^\d+$/.test(String(id))) {
      return -1;
    }

    const numId = Number(id);
    return this.todos.findIndex((todo) => todo.id === numId);
  }

  /**
   * Generate next available ID
   * @returns {number} Next ID
   */
  generateNextId() {
    return this.nextId++;
  }
}

// Export the TodoServer class
module.exports = TodoServer;

// Example usage (for testing):
const isReadyToTest = false;

if (isReadyToTest) {
  const server = new TodoServer(3000);
  server.start();
  console.log("🚀 Todo Server starting...");
  console.log("🧪 Run task-04-test.js to verify functionality");
}

// If this file is run directly, start the server
if (require.main === module) {
  const server = new TodoServer(3000);
  server.start();
}

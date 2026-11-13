const http = require("http");
const { TodoService, TodoValidationError } = require("./todo-service");

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
 * TodoServer Class - Main HTTP server for Todo API
 */
class TodoServer {
  constructor(port = 3000) {
    this.port = port;
    this.todoService = new TodoService();
    this.todos = this.todoService.todos;
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
    if (query.completed !== undefined) {
      if (query.completed !== "true" && query.completed !== "false") {
        sendResponse(res, 400, {
          success: false,
          error: "completed must be true or false",
        });
        return;
      }
    }

    const completed =
      query.completed === undefined ? undefined : query.completed === "true";
    const todos = this.todoService.list(completed);
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
    const todo = this.todoService.findById(params.id);
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
    let todo;
    try {
      todo = this.todoService.create(todoData);
    } catch (error) {
      if (!(error instanceof TodoValidationError)) {
        throw error;
      }

      sendResponse(res, 400, {
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
      return;
    }

    sendResponse(res, 201, { success: true, data: todo });
  }

  /**
   * Handle PUT /todos/:id - Update existing todo
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} params - Path parameters
   */
  async updateTodo(req, res, params) {
    const existingTodo = this.todoService.findById(params.id);
    if (!existingTodo) {
      const status = /^\d+$/.test(params.id) ? 404 : 400;
      sendResponse(res, status, {
        success: false,
        error: status === 404 ? "Todo not found" : "Invalid todo ID",
      });
      return;
    }

    const updates = await parseBody(req);
    let todo;
    try {
      todo = this.todoService.update(params.id, updates);
    } catch (error) {
      if (!(error instanceof TodoValidationError)) {
        throw error;
      }

      sendResponse(res, 400, {
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
      return;
    }

    sendResponse(res, 200, { success: true, data: todo });
  }

  /**
   * Handle DELETE /todos/:id - Delete todo
   * @param {IncomingMessage} req - HTTP request
   * @param {ServerResponse} res - HTTP response
   * @param {Object} params - Path parameters
   */
  async deleteTodo(req, res, params) {
    const todo = this.todoService.delete(params.id);
    if (!todo) {
      const status = /^\d+$/.test(params.id) ? 404 : 400;
      sendResponse(res, status, {
        success: false,
        error: status === 404 ? "Todo not found" : "Invalid todo ID",
      });
      return;
    }

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
    return this.todoService.findById(id);
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

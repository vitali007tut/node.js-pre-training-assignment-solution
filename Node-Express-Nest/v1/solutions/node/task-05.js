/**
 * task-05.js
 * Extend your Task 04 server by adding EventEmitter functionality,
 * logging, analytics, and new endpoints.
 *
 * Implement all TODOs below.
 */

const http = require("http");
const { EventEmitter } = require("events");

// ---------- Utilities ----------

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(data);
}

function parseIdFromPath(pathname) {
  const match = pathname.match(/^\/todos\/([^/]+)$/);
  if (!match || !/^\d+$/.test(match[1])) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const data = Buffer.concat(chunks).toString("utf8");
      if (!data.trim()) return resolve({});
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function nowISO() {
  return new Date().toISOString();
}

// ---------- Analytics ----------

class AnalyticsTracker {
  constructor() {
    this.stats = {
      totalCreated: 0,
      totalUpdated: 0,
      totalDeleted: 0,
      totalViews: 0,
      errors: 0,
      dailyStats: {},
    };
  }
  _bumpDaily(field, timestamp) {
    const day = new Date(timestamp).toISOString().slice(0, 10);
    if (!this.stats.dailyStats[day]) {
      this.stats.dailyStats[day] = {
        created: 0,
        updated: 0,
        deleted: 0,
        views: 0,
      };
    }
    this.stats.dailyStats[day][field] += 1;
  }
  trackCreated(timestamp = new Date()) {
    this.stats.totalCreated += 1;
    this._bumpDaily("created", timestamp);
  }
  trackUpdated(timestamp = new Date()) {
    this.stats.totalUpdated += 1;
    this._bumpDaily("updated", timestamp);
  }
  trackDeleted(timestamp = new Date()) {
    this.stats.totalDeleted += 1;
    this._bumpDaily("deleted", timestamp);
  }
  trackViewed(timestamp = new Date()) {
    this.stats.totalViews += 1;
    this._bumpDaily("views", timestamp);
  }
  trackError() {
    this.stats.errors += 1;
  }
  getStats() {
    return JSON.parse(JSON.stringify(this.stats));
  }
}

// ---------- Console Logger ----------
class ConsoleLogger {
  todoCreated(data) {
    console.log(
      `📝 [${data.timestamp}] Created "${data.todo.title}" (ID: ${data.todo.id})`
    );
  }
  todoUpdated(data) {
    console.log(
      `✏️  [${data.timestamp}] Updated ID ${
        data.newTodo.id
      }; changed: ${data.changes.join(", ")}`
    );
  }
  todoDeleted(data) {
    console.log(
      `🗑️  [${data.timestamp}] Deleted "${data.todo.title}" (ID: ${data.todo.id})`
    );
  }
  todoViewed(data) {
    console.log(`👁️  [${data.timestamp}] Viewed ID ${data.todo.id}`);
  }
  todosListed(data) {
    console.log(`📃 [${data.timestamp}] Listed todos count=${data.count}`);
  }
  todoNotFound(data) {
    console.warn(
      `⚠️  [${data.timestamp}] Not found: id=${data.todoId} op=${data.operation}`
    );
  }
  validationError(data) {
    console.error(
      `❌ [${data.timestamp}] Validation error: ${data.errors.join(", ")}`
    );
  }
  serverError(data) {
    console.error(
      `💥 [${data.timestamp}] Server error in ${data.operation}: ${
        data.error && data.error.message
      }`
    );
  }
}

// ---------- Validation ----------
function validateTodoPayload(payload, isCreate = false) {
  const errors = [];
  const out = {};
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return { errors: ["Request body must be a JSON object"], values: out };
  }

  if (isCreate && !Object.prototype.hasOwnProperty.call(payload, "title")) {
    errors.push("Title is required");
  }
  if (Object.prototype.hasOwnProperty.call(payload, "title")) {
    if (typeof payload.title !== "string") {
      errors.push("Title must be a string");
    } else if (!payload.title.trim()) {
      errors.push("Title cannot be empty");
    } else if (payload.title.trim().length > 100) {
      errors.push("Title must be 100 characters or fewer");
    } else {
      out.title = payload.title.trim();
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "description")) {
    if (typeof payload.description !== "string") {
      errors.push("Description must be a string");
    } else if (payload.description.length > 500) {
      errors.push("Description must be 500 characters or fewer");
    } else {
      out.description = payload.description;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "completed")) {
    if (typeof payload.completed !== "boolean") {
      errors.push("Completed must be a boolean");
    } else {
      out.completed = payload.completed;
    }
  }

  if (!isCreate && Object.keys(out).length === 0 && errors.length === 0) {
    errors.push("At least one todo field must be provided");
  }

  return { errors, values: out };
}

class TodoServer extends EventEmitter {
  constructor(port = 3000) {
    super();
    this.port = port;
    this.todos = [];
    this.nextId = 1;
    this.analytics = new AnalyticsTracker();
    this.logger = new ConsoleLogger();
    this.recentEvents = [];
    this.server = null;

    this._wireDefaultListeners();
  }

  _wireDefaultListeners() {
    const remember = (eventType) => (data) => {
      this.recentEvents.push({ eventType, timestamp: data.timestamp, data });
      if (this.recentEvents.length > 100) this.recentEvents.shift();
    };
    // Remember all key events for /events
    [
      "todoCreated",
      "todoUpdated",
      "todoDeleted",
      "todoViewed",
      "todosListed",
      "todoNotFound",
      "validationError",
      "serverError",
    ].forEach((evt) => this.on(evt, remember(evt)));

    // Logging
    this.on("todoCreated", (d) => this.logger.todoCreated(d));
    this.on("todoUpdated", (d) => this.logger.todoUpdated(d));
    this.on("todoDeleted", (d) => this.logger.todoDeleted(d));
    this.on("todoViewed", (d) => this.logger.todoViewed(d));
    this.on("todosListed", (d) => this.logger.todosListed(d));
    this.on("todoNotFound", (d) => this.logger.todoNotFound(d));
    this.on("validationError", (d) => this.logger.validationError(d));
    this.on("serverError", (d) => this.logger.serverError(d));

    // Analytics
    this.on("todoCreated", (d) => this.analytics.trackCreated(d.timestamp));
    this.on("todoUpdated", (d) => this.analytics.trackUpdated(d.timestamp));
    this.on("todoDeleted", (d) => this.analytics.trackDeleted(d.timestamp));
    this.on("todoViewed", (d) => this.analytics.trackViewed(d.timestamp));
    this.on("todoNotFound", () => this.analytics.trackError());
    this.on("validationError", () => this.analytics.trackError());
    this.on("serverError", () => this.analytics.trackError());
  }

  /**
   * Start the server
   */
  async start() {
    if (this.server?.listening) return this.server;

    this.server = http.createServer((req, res) => {
      this._handleRequest(req, res);
    });

    await new Promise((resolve, reject) => {
      const onError = (error) => {
        this.server.removeListener("listening", onListening);
        reject(error);
      };
      const onListening = () => {
        this.server.removeListener("error", onError);
        resolve();
      };

      this.server.once("error", onError);
      this.server.once("listening", onListening);
      this.server.listen(this.port);
    });

    return this.server;
  }

  /**
   * Stop the server
   */
  async stop() {
    if (!this.server?.listening) return;

    await new Promise((resolve, reject) => {
      this.server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  /**
   * Handle incoming requests
   */
  async _handleRequest(req, res) {
    const requestInfo = {
      method: req.method,
      url: req.url,
      userAgent: req.headers["user-agent"] || "",
      ip: req.socket.remoteAddress || "",
    };
    let operation = "request";

    try {
      const requestUrl = new URL(req.url, "http://localhost");
      const { pathname, searchParams } = requestUrl;

      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
        res.end();
        return;
      }

      if (pathname === "/analytics") {
        if (req.method !== "GET") {
          sendJson(res, 405, { success: false, error: "Method not allowed" });
          return;
        }
        sendJson(res, 200, { success: true, data: this.analytics.getStats() });
        return;
      }

      if (pathname === "/events") {
        if (req.method !== "GET") {
          sendJson(res, 405, { success: false, error: "Method not allowed" });
          return;
        }

        const lastValue = searchParams.get("last");
        let last = 10;
        if (lastValue !== null) {
          if (!/^\d+$/.test(lastValue)) {
            sendJson(res, 400, {
              success: false,
              error: "last must be a non-negative integer",
            });
            return;
          }
          last = Math.min(Number(lastValue), 100);
        }

        sendJson(res, 200, {
          success: true,
          data: last === 0 ? [] : this.recentEvents.slice(-last),
        });
        return;
      }

      if (pathname === "/todos") {
        if (req.method === "GET") {
          operation = "todosListed";
          const completedFilter = searchParams.get("completed");
          if (
            completedFilter !== null &&
            completedFilter !== "true" &&
            completedFilter !== "false"
          ) {
            const errors = ["completed must be true or false"];
            this._emitValidationError(
              errors,
              { completed: completedFilter },
              requestInfo
            );
            sendJson(res, 400, { success: false, error: errors[0] });
            return;
          }

          const filters =
            completedFilter === null
              ? {}
              : { completed: completedFilter === "true" };
          const todos =
            filters.completed === undefined
              ? this.todos
              : this.todos.filter(
                  (todo) => todo.completed === filters.completed
                );
          const data = {
            todos: todos.map((todo) => ({ ...todo })),
            count: todos.length,
            filters,
            timestamp: nowISO(),
            requestInfo,
          };
          this.emit("todosListed", data);
          sendJson(res, 200, { success: true, data: todos, count: todos.length });
          return;
        }

        if (req.method === "POST") {
          operation = "todoCreated";
          let payload;
          try {
            payload = await parseBody(req);
          } catch (error) {
            this._emitValidationError([error.message], null, requestInfo);
            sendJson(res, 400, { success: false, error: error.message });
            return;
          }

          const validation = validateTodoPayload(payload, true);
          if (validation.errors.length) {
            this._emitValidationError(validation.errors, payload, requestInfo);
            sendJson(res, 400, {
              success: false,
              error: "Validation failed",
              details: validation.errors,
            });
            return;
          }

          const timestamp = nowISO();
          const todo = {
            id: this.nextId++,
            title: validation.values.title,
            description: validation.values.description || "",
            completed: validation.values.completed ?? false,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          this.todos.push(todo);
          this.emit("todoCreated", {
            todo: { ...todo },
            timestamp,
            requestInfo,
          });
          sendJson(res, 201, { success: true, data: todo });
          return;
        }

        sendJson(res, 405, { success: false, error: "Method not allowed" });
        return;
      }

      const idMatch = pathname.match(/^\/todos\/([^/]+)$/);
      if (idMatch) {
        let rawId;
        try {
          rawId = decodeURIComponent(idMatch[1]);
        } catch {
          rawId = idMatch[1];
        }

        const id = parseIdFromPath(`/todos/${rawId}`);

        if (!["GET", "PUT", "DELETE"].includes(req.method)) {
          sendJson(res, 405, { success: false, error: "Method not allowed" });
          return;
        }

        const todo =
          id === null ? null : this.todos.find((item) => item.id === id);
        if (!todo) {
          const eventData = {
            todoId: id ?? rawId,
            operation: req.method,
            timestamp: nowISO(),
            requestInfo,
          };
          this.emit("todoNotFound", eventData);
          sendJson(res, id === null ? 400 : 404, {
            success: false,
            error: id === null ? "Invalid todo ID" : "Todo not found",
          });
          return;
        }

        if (req.method === "GET") {
          operation = "todoViewed";
          this.emit("todoViewed", {
            todo: { ...todo },
            timestamp: nowISO(),
            requestInfo,
          });
          sendJson(res, 200, { success: true, data: todo });
          return;
        }

        if (req.method === "PUT") {
          operation = "todoUpdated";
          let payload;
          try {
            payload = await parseBody(req);
          } catch (error) {
            this._emitValidationError([error.message], null, requestInfo);
            sendJson(res, 400, { success: false, error: error.message });
            return;
          }

          const validation = validateTodoPayload(payload);
          if (validation.errors.length) {
            this._emitValidationError(validation.errors, payload, requestInfo);
            sendJson(res, 400, {
              success: false,
              error: "Validation failed",
              details: validation.errors,
            });
            return;
          }

          const oldTodo = { ...todo };
          const changes = Object.keys(validation.values).filter(
            (key) => todo[key] !== validation.values[key]
          );
          Object.assign(todo, validation.values, { updatedAt: nowISO() });
          this.emit("todoUpdated", {
            oldTodo,
            newTodo: { ...todo },
            changes,
            timestamp: nowISO(),
            requestInfo,
          });
          sendJson(res, 200, { success: true, data: todo });
          return;
        }

        operation = "todoDeleted";
        this.todos = this.todos.filter((item) => item.id !== id);
        this.emit("todoDeleted", {
          todo: { ...todo },
          timestamp: nowISO(),
          requestInfo,
        });
        sendJson(res, 200, {
          success: true,
          message: "Todo deleted successfully",
        });
        return;
      }

      sendJson(res, 404, { success: false, error: "Route not found" });
    } catch (error) {
      const data = {
        error: { message: error.message },
        operation,
        timestamp: nowISO(),
        requestInfo,
      };
      this.emit("serverError", data);
      if (!res.headersSent) {
        sendJson(res, 500, {
          success: false,
          error: "Internal server error",
        });
      } else {
        res.end();
      }
    }
  }

  _emitValidationError(errors, data, requestInfo) {
    this.emit("validationError", {
      errors,
      data,
      timestamp: nowISO(),
      requestInfo,
    });
  }
}

module.exports = { TodoServer };

const express = require("express");
const {
  TodoService,
  TodoValidationError,
  validateTodo,
} = require("../node/todo-service");

function createTodoApp({ withMetrics = false } = {}) {
  const app = express();
  const todoService = new TodoService();
  const metrics = {
    totalRequests: 0,
    totalResponseTimeMs: 0,
  };

  if (withMetrics) {
    app.use((req, res, next) => {
      const startedAt = process.hrtime.bigint();

      res.once("finish", () => {
        const durationMs =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        metrics.totalRequests += 1;
        metrics.totalResponseTimeMs += durationMs;
        console.log(
          `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(2)} ms`
        );
      });

      next();
    });
  }

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json());

  if (withMetrics) {
    app.get("/metrics", (req, res) => {
      const averageResponseTimeMs =
        metrics.totalRequests === 0
          ? 0
          : metrics.totalResponseTimeMs / metrics.totalRequests;

      res.status(200).json({
        totalRequests: metrics.totalRequests,
        averageResponseTimeMs: Number(averageResponseTimeMs.toFixed(2)),
      });
    });
  }

  function validateCreateTodo(req, res, next) {
    const validation = validateTodo(req.body);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
      return;
    }

    next();
  }

  app
    .route("/todos")
    .get((req, res) => {
      const completedFilter = req.query.completed;
      if (
        completedFilter !== undefined &&
        completedFilter !== "true" &&
        completedFilter !== "false"
      ) {
        res.status(400).json({
          success: false,
          error: "completed must be true or false",
        });
        return;
      }

      const completed =
        completedFilter === undefined ? undefined : completedFilter === "true";
      const todos = todoService.list(completed);
      res.status(200).json({
        success: true,
        data: todos,
        count: todos.length,
      });
    })
    .post(validateCreateTodo, (req, res) => {
      const todo = todoService.create(req.body);
      res.status(201).json({ success: true, data: todo });
    })
    .all((req, res) => {
      res.status(405).json({ success: false, error: "Method not allowed" });
    });

  app
    .route("/todos/:id")
    .get((req, res) => {
      const todo = todoService.findById(req.params.id);
      if (!todo) {
        const isNumericId = /^\d+$/.test(req.params.id);
        res.status(isNumericId ? 404 : 400).json({
          success: false,
          error: isNumericId ? "Todo not found" : "Invalid todo ID",
        });
        return;
      }

      res.status(200).json({ success: true, data: todo });
    })
    .put((req, res) => {
      const todo = todoService.update(req.params.id, req.body);
      if (!todo) {
        const isNumericId = /^\d+$/.test(req.params.id);
        res.status(isNumericId ? 404 : 400).json({
          success: false,
          error: isNumericId ? "Todo not found" : "Invalid todo ID",
        });
        return;
      }

      res.status(200).json({ success: true, data: todo });
    })
    .delete((req, res) => {
      const todo = todoService.delete(req.params.id);
      if (!todo) {
        const isNumericId = /^\d+$/.test(req.params.id);
        res.status(isNumericId ? 404 : 400).json({
          success: false,
          error: isNumericId ? "Todo not found" : "Invalid todo ID",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Todo deleted successfully",
      });
    })
    .all((req, res) => {
      res.status(405).json({ success: false, error: "Method not allowed" });
    });

  app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
  });

  app.use((error, req, res, next) => {
    if (error instanceof TodoValidationError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors,
      });
      return;
    }

    if (error.type === "entity.parse.failed") {
      res.status(400).json({ success: false, error: "Invalid JSON" });
      return;
    }

    console.error("Request handling error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  });

  return app;
}

module.exports = createTodoApp;

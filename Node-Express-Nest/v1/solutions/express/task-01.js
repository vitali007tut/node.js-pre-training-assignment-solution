const express = require("express");

const app = express();

function requestLogger(req, res, next) {
  console.log(`[1] Logger: ${req.method} ${req.originalUrl}`);
  next();
}

function requestTimer(req, res, next) {
  const startedAt = process.hrtime.bigint();
  console.log("[2] Timer: started");

  res.once("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(`[4] Timer: finished in ${elapsedMs.toFixed(2)} ms`);
  });

  next();
}

function customHeaderInjector(req, res, next) {
  res.setHeader("X-Course-Middleware", "active");
  console.log("[3] Header injector: added X-Course-Middleware");
  next();
}

app.use(requestLogger);
app.use(requestTimer);
app.use(customHeaderInjector);

app.get("/", (req, res) => {
  res.json({ message: "Express middleware playground" });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Express middleware playground listening on port ${port}`);
  });
}

module.exports = app;

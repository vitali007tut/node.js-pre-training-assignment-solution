const express = require("express");

const app = express();

app.get("/error", (req, res) => {
  throw new Error("Example route error");
});

app.use((error, req, res, next) => {
  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 600
      ? error.status
      : 500;

  res.status(status).json({
    status,
    message: error.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Express Task 3 listening on port ${port}`);
});

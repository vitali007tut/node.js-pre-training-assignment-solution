const express = require("express");

const app = express();

app.get("/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(userId) || userId < 1) {
    res.status(400).json({
      success: false,
      error: "id must be a positive integer",
    });
    return;
  }

  const active = req.query.active;
  if (active !== "true" && active !== "false") {
    res.status(400).json({
      success: false,
      error: 'active must be "true" or "false"',
    });
    return;
  }

  res.send(`User ${userId} is ${active === "true" ? "active" : "inactive"}.`);
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Express Task 2 listening on port ${port}`);
  });
}

module.exports = app;

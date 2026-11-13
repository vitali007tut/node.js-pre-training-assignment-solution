const createTodoApp = require("./todo-app");

const app = createTodoApp({ withMetrics: true });
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express Task 5 listening on port ${port}`);
});

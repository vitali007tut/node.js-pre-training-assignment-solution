const createTodoApp = require("./todo-app");

const app = createTodoApp();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express Task 4 listening on port ${port}`);
});

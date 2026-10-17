#!/usr/bin/env ts-node
import { ToDoManager } from './todo-manager';

async function main(): Promise<void> {
  const manager = new ToDoManager();
  const [command, ...args] = process.argv.slice(2);

  await manager.init();

  switch (command) {
    case 'add':
      if (args.length === 0) {
        throw new Error('Usage: add <title>');
      }
      await manager.add(args.join(' '));
      break;
    case 'complete':
      await manager.complete(Number(args[0]));
      break;
    case 'list':
    case undefined:
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  const todos = await manager.list();
  console.log('Todos:');
  for (const todo of todos) {
    console.log(`  #${todo.id} [${todo.status}] ${todo.title}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

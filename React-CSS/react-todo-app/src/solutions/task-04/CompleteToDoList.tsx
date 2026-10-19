import React, { useState } from 'react';
import { Todo } from '../../types';

/**
 * Task 4: CompleteToDoList Component
 *
 * Theory: State Updates and Immutability
 *
 * React state updates must be immutable. This means you cannot directly modify the existing state
 * object or array. Instead, you must create a new object/array with the updated values.
 *
 * Why Immutability Matters:
 * 1. React uses reference equality to determine if state has changed
 * 2. Direct mutations don't trigger re-renders
 * 3. It enables time-travel debugging and undo/redo features
 * 4. It makes state changes predictable and traceable
 *
 * Common State Update Patterns:
 *
 * For Arrays:
 * - Adding: [...array, newItem]
 * - Removing: array.filter(item => item.id !== id)
 * - Updating: array.map(item => item.id === id ? {...item, updated: true} : item)
 *
 * For Objects:
 * - Updating: {...object, newProperty: value}
 * - Nested updates: {...object, nested: {...object.nested, updated: true}}
 *
 * Event Handling with Parameters:
 * - Use arrow functions to pass parameters to event handlers
 * - Example: onClick={() => handleClick(id)}
 * - Or use bind: onClick={handleClick.bind(null, id)}
 *
 * Key Concepts:
 * - Always create new objects/arrays when updating state
 * - Use spread operator (...) for shallow copies
 * - Consider using libraries like Immer for complex updates
 * - Think about state structure before implementing
 */
export const CompleteToDoList: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const title = inputValue.trim();

        if (!title) {
            return;
        }

        setTodos((currentTodos) => {
            const nextId = currentTodos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1;

            return [...currentTodos, { id: nextId, title, completed: false }];
        });
        setInputValue('');
    };

    const markCompleted = (id: number) => {
        setTodos((currentTodos) =>
            currentTodos.map((todo) => (todo.id === id ? { ...todo, completed: true } : todo)),
        );
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type='text'
                    placeholder='Add todo'
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                />
                <button type='submit'>Add</button>
            </form>
            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}>
                        <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                            {todo.title}
                        </span>{' '}
                        <span>{todo.completed ? 'completed' : 'not completed'}</span>{' '}
                        <button
                            type='button'
                            onClick={() => markCompleted(todo.id)}
                            disabled={todo.completed}
                        >
                            Complete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

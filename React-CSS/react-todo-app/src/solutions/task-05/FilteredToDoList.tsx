import React, { useState } from 'react';
import { Todo } from '../../types';

/**
 * Task 5: FilteredToDoList Component
 *
 * Theory: Derived State and Computed Values
 *
 * In React, you often need to compute values based on your state. These are called "derived state"
 * or "computed values" and should be calculated during render rather than stored in state.
 *
 * Why Use Derived State:
 * 1. Avoids state synchronization issues
 * 2. Reduces complexity by having a single source of truth
 * 3. Automatically updates when source data changes
 * 4. Prevents stale state bugs
 *
 * Common Derived State Patterns:
 *
 * Filtering:
 * - const activeTodos = todos.filter(todo => !todo.completed)
 * - const completedTodos = todos.filter(todo => todo.completed)
 *
 * Searching:
 * - const filteredTodos = todos.filter(todo =>
 *     todo.title.toLowerCase().includes(searchTerm.toLowerCase())
 *   )
 *
 * Sorting:
 * - const sortedTodos = [...todos].sort((a, b) => a.title.localeCompare(b.title))
 *
 * Aggregations:
 * - const completedCount = todos.filter(todo => todo.completed).length
 * - const totalCount = todos.length
 *
 * Multiple Filters:
 * - Use multiple filter conditions or combine them
 * - Consider using useMemo for expensive computations
 *
 * Key Concepts:
 * - Calculate derived values during render
 * - Don't store computed values in state
 * - Use useMemo for expensive calculations
 * - Keep state minimal and derive the rest
 */
export const FilteredToDoList: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

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

    const filteredTodos = todos.filter((todo) => {
        if (filter === 'active') {
            return !todo.completed;
        }
        if (filter === 'completed') {
            return todo.completed;
        }
        return true;
    });

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
            <div>
                <button type='button' onClick={() => setFilter('all')} aria-pressed={filter === 'all'}>
                    All
                </button>
                <button type='button' onClick={() => setFilter('active')} aria-pressed={filter === 'active'}>
                    Active
                </button>
                <button
                    type='button'
                    onClick={() => setFilter('completed')}
                    aria-pressed={filter === 'completed'}
                >
                    Completed
                </button>
            </div>
            <ul>
                {filteredTodos.map((todo) => (
                    <li key={todo.id}>
                        <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                            {todo.title}
                        </span>{' '}
                        <span>({todo.completed ? 'completed' : 'not completed'})</span>{' '}
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

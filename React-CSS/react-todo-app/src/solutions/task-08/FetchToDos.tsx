import React, { useState, useEffect } from 'react';
import { Todo } from '../../types';

/**
 * Task 8: FetchToDos Component
 *
 * Theory: React Hooks - useEffect and Side Effects
 *
 * useEffect is a React Hook that lets you perform side effects in function components.
 * Side effects are operations that happen outside of the normal render cycle, such as:
 * - Data fetching
 * - Subscriptions
 * - Manual DOM manipulations
 * - Timers
 *
 * useEffect Hook Structure:
 * useEffect(() => {
 *   // Side effect code
 *   return () => {
 *     // Cleanup code (optional)
 *   };
 * }, [dependencies]);
 *
 * useEffect Dependencies:
 *
 * Empty Array []:
 * - Runs only once after initial render
 * - Good for one-time setup (fetching initial data)
 * - Example: useEffect(() => fetchData(), [])
 *
 * No Dependencies:
 * - Runs after every render
 * - Usually not what you want
 * - Can cause infinite loops
 *
 * With Dependencies [dep1, dep2]:
 * - Runs when dependencies change
 * - Good for reactive effects
 * - Example: useEffect(() => fetchData(id), [id])
 *
 * Data Fetching Patterns:
 *
 * 1. Loading States:
 *    - Track loading state with useState
 *    - Show loading indicator while fetching
 *    - Handle errors gracefully
 *
 * 2. Error Handling:
 *    - Catch and handle fetch errors
 *    - Display user-friendly error messages
 *    - Provide retry mechanisms
 *
 * 3. Cleanup:
 *    - Cancel requests if component unmounts
 *    - Clear timers and subscriptions
 *    - Prevent memory leaks
 *
 * Key Concepts:
 * - useEffect runs after render
 * - Always consider cleanup for side effects
 * - Use dependencies array to control when effect runs
 * - Handle loading and error states
 */
export const FetchToDos: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTodos = async () => {
            try {
                const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const data: Todo[] = await response.json();
                setTodos(data);
            } catch (fetchError) {
                setError(fetchError instanceof Error ? fetchError.message : 'Unable to load todos.');
            } finally {
                setLoading(false);
            }
        };

        void loadTodos();
    }, []);

    if (loading) {
        return <p>Loading todos...</p>;
    }

    if (error) {
        return <p role='alert'>Unable to load todos: {error}</p>;
    }

    return (
        <ul>
            {todos.map((todo) => (
                <li key={todo.id}>
                    {todo.title} - {todo.completed ? 'completed' : 'not completed'}
                </li>
            ))}
        </ul>
    );
};

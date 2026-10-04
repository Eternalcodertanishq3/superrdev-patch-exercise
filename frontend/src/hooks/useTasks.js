import { useState, useEffect } from 'react';
import { fetchTasks } from '../api';

/**
 * Custom React hook for fetching and managing task data with request cancellation and loading lifecycle.
 *
 * @param {string} query - Text search term
 * @param {string} status - Task lifecycle status filter
 * @param {number} page - Current active page number
 * @param {number} pageSize - Number of records per page
 * @returns {{tasks: Array, total: number, loading: boolean, error: string|null}}
 */
export function useTasks(query, status, priority = '', page = 1, pageSize = 10) {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = () => setRefreshIndex((prev) => prev + 1);

  useEffect(() => {
    // Fix (Bug #7): Integrated AbortController to cancel in-flight HTTP requests when search query or filters change rapidly.
    // Prevents race conditions where a slower prior request overwrites newer data.
    const controller = new AbortController();
    setLoading(true);

    fetchTasks({ query, status, priority, page, pageSize }, controller.signal)
      .then((data) => {
        setTasks(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => {
        // Do not update error state if the abort was intentionally triggered by a subsequent query
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      })
      .finally(() => {
        // Fix (Bug #8): Guaranteed that loading state is cleared on both success and error.
        // Previously, the catch block omitted setLoading(false), locking the UI indefinitely in a "Loading..." state on API failure.
        setLoading(false);
      });
      
    return () => controller.abort();
  }, [query, status, priority, page, pageSize, refreshIndex]);

  return { tasks, total, loading, error, refetch };
}


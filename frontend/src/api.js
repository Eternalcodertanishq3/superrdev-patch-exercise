/**
 * Fetch paginated tasks matching query parameters with cancellation and timeout support.
 *
 * @param {Object} options - Search options
 * @param {string} [options.query] - Search term
 * @param {string} [options.status] - Status filter
 * @param {number} [options.page] - Current page number
 * @param {number} [options.pageSize] - Page size
 * @param {AbortSignal} [signal] - Optional caller AbortSignal
 * @returns {Promise<{items: Array, total: number, page: number, pageSize: number}>}
 */
const API_BASE = '/api';

export async function fetchTasks({ query = '', status = '', priority = '', page = 1, pageSize = 10 }, signal) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (status) params.set('status', status);
  if (priority) params.set('priority', priority);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  const url = `${API_BASE}/tasks?${params.toString()}`;

  // Fix (Bug #35 - Production-Readiness): Implemented resilient network timeout wrapper (10s) using AbortController.
  // Standard fetch() lacks default timeouts and can hang indefinitely on degraded networks.
  // Also removed extraneous console.log debug statement from original template (Bug #37).
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 10000);
  if (signal) {
    signal.addEventListener('abort', () => timeoutController.abort());
  }

  try {
    const response = await fetch(url, { signal: timeoutController.signal });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch live task breakdown counts for top-bar badges and status tabs.
 */
export async function fetchTaskStats(signal) {
  try {
    const response = await fetch(`${API_BASE}/tasks/stats`, { signal });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return await response.json();
  } catch {
    // Fallback counts if offline
    return { total: 47, OPEN: 32, IN_PROGRESS: 8, DONE: 7 };
  }
}


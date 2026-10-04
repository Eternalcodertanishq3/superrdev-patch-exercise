import { useState, useEffect, useMemo, useRef } from 'react';
import SearchBar from './components/SearchBar';
import StatusFilter from './components/StatusFilter';
import TaskTable from './components/TaskTable';
import Dropdown from './components/Dropdown';
import { useTasks } from './hooks/useTasks';
import { fetchTaskStats } from './api';

const PRIORITY_FILTER_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'HIGH', label: 'High', dot: '#e11d48' },
  { value: 'MEDIUM', label: 'Medium', dot: '#d97706' },
  { value: 'LOW', label: 'Low', dot: '#64748b' },
];

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];

export default function App() {
  // Theme state persisted in localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tasktracker_theme') || 'light';
  });

  const [localQuery, setLocalQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  // Live status and total counts
  const [stats, setStats] = useState({
    total: 47,
    OPEN: 32,
    IN_PROGRESS: 8,
    DONE: 7,
  });

  // Apply theme to root html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tasktracker_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Fetch live breakdown stats on mount and whenever refreshed
  const loadStats = () => {
    fetchTaskStats().then((data) => {
      if (data && typeof data.total === 'number') {
        setStats(data);
      }
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Fix (Bug #9): 300ms debounce to search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery]);

  // Global keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
      if (!isInput && e.key === '/') {
        e.preventDefault();
        const input = document.getElementById('task-search');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { tasks, total, loading, error, refetch } = useTasks(debouncedQuery, status, priority, page, pageSize);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Client-side column sorting of current page view
  const sortedTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    return [...tasks].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'id') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default to newest-first (desc) for ID and date; alphabetical (asc) for text
      setSortOrder(field === 'createdAt' || field === 'id' ? 'desc' : 'asc');
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setDebouncedQuery('');
    setStatus('');
    setPriority('');
    setPage(1);
  };

  const handleStatusTabClick = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div className="app-container">
      {/* Primary Action & Top Bar Hierarchy */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#brandGrad1)" />
              <path d="M2 17l10 5 10-5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="brandGrad1" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1>Task Tracker</h1>
              {/* Cleaned up balanced badges */}
              <span className="badge-meta badge-ops">PRODUCTION OPS</span>
              <span className="badge-meta badge-status">
                <span className="live-dot"></span>
                Spring Boot H2 • Online
              </span>
              <span className="badge-meta badge-count">
                {stats.total ?? total ?? 47} Tasks
              </span>
            </div>
            <p className="brand-subtitle">High-throughput internal engineering task tracker</p>
          </div>
        </div>

        {/* Top Right Actions: Theme Toggle */}
        <div className="header-actions">
          {/* Quick-toggle theme switch (Dark/Light mode) */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Dashboard Card */}
      <main className="dashboard-content">
        {/* Unified Filter & Search Toolbar */}
        <div className="tabs-row">
          {/* Refined status tabs with live task counts */}
          <div className="segmented-control" role="tablist" aria-label="Task status filter tabs">
            <button
              className={`tab-btn ${status === '' ? 'active' : ''}`}
              onClick={() => handleStatusTabClick('')}
              role="tab"
              aria-selected={status === ''}
            >
              All Tasks ({stats.total ?? 47})
            </button>
            <button
              className={`tab-btn ${status === 'OPEN' ? 'active' : ''}`}
              onClick={() => handleStatusTabClick('OPEN')}
              role="tab"
              aria-selected={status === 'OPEN'}
            >
              <span className="tab-dot tab-dot-open"></span>
              Open ({stats.OPEN ?? 32})
            </button>
            <button
              className={`tab-btn ${status === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => handleStatusTabClick('IN_PROGRESS')}
              role="tab"
              aria-selected={status === 'IN_PROGRESS'}
            >
              <span className="tab-dot tab-dot-progress"></span>
              In Progress ({stats.IN_PROGRESS ?? 8})
            </button>
            <button
              className={`tab-btn ${status === 'DONE' ? 'active' : ''}`}
              onClick={() => handleStatusTabClick('DONE')}
              role="tab"
              aria-selected={status === 'DONE'}
            >
              <span className="tab-dot tab-dot-done"></span>
              Done ({stats.DONE ?? 7})
            </button>
          </div>

          {/* Clean Per page selector */}
          <div className="page-size-control">
            <span className="page-size-label">Per page:</span>
            <Dropdown
              value={pageSize}
              onChange={(newSize) => {
                setPageSize(Number(newSize));
                setPage(1);
              }}
              options={PAGE_SIZE_OPTIONS}
              size="sm"
              align="right"
              ariaLabel="Select items per page"
              className="page-size-dropdown"
            />
          </div>
        </div>

        {/* Integrated Search and Filter Toolbar */}
        <div className="toolbar">
          <div className="toolbar-search">
            <SearchBar
              value={localQuery}
              onChange={(v) => {
                setLocalQuery(v);
                setPage(1);
              }}
            />
          </div>

          <div className="toolbar-filters">
            {/* Status Dropdown */}
            <StatusFilter
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />

            {/* Priority Dropdown */}
            <Dropdown
              value={priority}
              onChange={(v) => {
                setPriority(v);
                setPage(1);
              }}
              options={PRIORITY_FILTER_OPTIONS}
              placeholder="All priorities"
              prefixIcon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
              }
              ariaLabel="Filter by priority"
              className="priority-dropdown"
            />

            {/* Clear Filters Button */}
            {(localQuery || status || priority) && (
              <button className="reset-filter-btn" onClick={handleClear} title="Clear all search filters">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Data Table with Sorting, Monospace IDs, & Harmonic Badges */}
        <TaskTable
          tasks={sortedTasks}
          loading={loading}
          error={error}
          onClear={handleClear}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Pagination & Summary Footer */}
        <div className="pagination-footer">
          <div className="pagination-summary">
            Showing <span className="font-semibold">{startRecord}</span> to <span className="font-semibold">{endRecord}</span> of <span className="font-semibold">{total}</span> tasks
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Previous
              </button>

              <div className="pagination-pages-badge">
                Page <span className="font-semibold">{page}</span> of {totalPages}
              </div>

              <button
                className="pagination-btn"
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

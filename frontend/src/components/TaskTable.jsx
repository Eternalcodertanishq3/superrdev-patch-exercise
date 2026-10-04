import React from 'react';

const ASSIGNEE_PALETTE = {
  Alice: { bg: 'rgba(99, 102, 241, 0.12)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.25)' },
  Bob: { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706', border: 'rgba(245, 158, 11, 0.25)' },
  Carol: { bg: 'rgba(16, 185, 129, 0.12)', text: '#059669', border: 'rgba(16, 185, 129, 0.25)' },
  Dave: { bg: 'rgba(14, 165, 233, 0.12)', text: '#0284c7', border: 'rgba(14, 165, 233, 0.25)' },
  Eve: { bg: 'rgba(244, 63, 94, 0.12)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.25)' },
};

function getAssigneeStyle(name) {
  if (!name) return { bg: 'rgba(148, 163, 184, 0.1)', text: '#64748b', border: 'rgba(148, 163, 184, 0.2)' };
  return ASSIGNEE_PALETTE[name] || { bg: 'rgba(148, 163, 184, 0.1)', text: '#64748b', border: 'rgba(148, 163, 184, 0.2)' };
}

function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export default function TaskTable({ tasks, loading, error, onClear, sortField, sortOrder, onSort }) {
  if (loading) {
    // Animated table skeleton loader matching exact columns
    return (
      <div className="table-card">
        <div className="skeleton-table">
          <div className="skeleton-header"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton-cell skeleton-cell-id"></div>
              <div className="skeleton-cell skeleton-cell-main">
                <div className="skeleton-bar title-bar"></div>
                <div className="skeleton-bar desc-bar"></div>
              </div>
              <div className="skeleton-cell skeleton-cell-badge"></div>
              <div className="skeleton-cell skeleton-cell-badge"></div>
              <div className="skeleton-cell skeleton-cell-user"></div>
              <div className="skeleton-cell skeleton-cell-date"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-card state-card error-card">
        <div className="state-icon error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3>Failed to load tasks</h3>
        <p className="state-description">{error}</p>
        {onClear && (
          <button className="primary-btn" onClick={onClear}>Retry & Clear Filters</button>
        )}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="table-card state-card empty-card">
        <div className="state-icon empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </div>
        <h3>No matching tasks found</h3>
        <p className="state-description">Try adjusting your search query, clearing filters, or switching statuses.</p>
        {onClear && (
          <button className="secondary-btn" onClick={onClear}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Reset search & filters
          </button>
        )}
      </div>
    );
  }

  const renderSortableHeader = (field, label, titleText) => {
    const isCurrent = sortField === field;
    return (
      <th
        className={`th-sortable th-${field} ${isCurrent ? 'th-sorted-active' : ''}`}
        onClick={() => onSort && onSort(field)}
        tabIndex={0}
        title={titleText}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSort && onSort(field);
          }
        }}
        role="columnheader"
        aria-sort={isCurrent ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <div className="th-content-wrapper">
          <span className="th-label-text">{label}</span>
          <span className={`th-sort-badge ${isCurrent ? 'is-active' : ''}`}>
            {isCurrent ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="table-card">
      <div className="table-responsive-wrapper">
        <table className="task-table">
          <thead>
            <tr>
              {renderSortableHeader('id', 'TASK ID', 'Permanent unique ticket identifier')}
              {renderSortableHeader('title', 'Task & Details')}
              {renderSortableHeader('status', 'Status')}
              {renderSortableHeader('priority', 'Priority')}
              {renderSortableHeader('assignee', 'Assignee')}
              {renderSortableHeader('createdAt', 'Created')}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const statusClean = (task.status ?? 'UNKNOWN').toUpperCase();
              const priorityClean = (task.priority ?? 'MEDIUM').toUpperCase();
              const assigneeStyle = getAssigneeStyle(task.assignee);

              return (
                <tr key={task.id} className="task-row">
                  {/* Subtle Monospace Task ID (#49, #48) */}
                  <td className="td-id">
                    <span className="task-id-mono" title={`Ticket #${task.id}`}>#{task.id}</span>
                  </td>

                  {/* Two-tier Title & Description Hierarchy */}
                  <td className="td-main">
                    <div className="task-title-cell">
                      <div className="task-title">{task.title}</div>
                      {task.description && (
                        <p className="task-desc">{task.description}</p>
                      )}
                    </div>
                  </td>

                  {/* Standardized Harmonic Status Chip */}
                  <td className="td-status">
                    <span className={`badge-chip status-chip status-${statusClean.toLowerCase()}`}>
                      <span className="chip-dot"></span>
                      <span className="chip-text">
                        {statusClean === 'IN_PROGRESS' ? 'In Progress' : statusClean.charAt(0) + statusClean.slice(1).toLowerCase()}
                      </span>
                    </span>
                  </td>

                  {/* Standardized Harmonic Priority Chip */}
                  <td className="td-priority">
                    <span className={`badge-chip priority-chip priority-${priorityClean.toLowerCase()}`}>
                      <span className="chip-dot"></span>
                      <span className="chip-text">
                        {priorityClean.charAt(0) + priorityClean.slice(1).toLowerCase()}
                      </span>
                    </span>
                  </td>

                  {/* Soft Color-Coded Assignee Avatar & Token */}
                  <td className="td-assignee">
                    {task.assignee ? (
                      <div
                        className="assignee-token"
                        style={{
                          backgroundColor: assigneeStyle.bg,
                          color: assigneeStyle.text,
                          borderColor: assigneeStyle.border,
                        }}
                      >
                        <span className="assignee-avatar">
                          {task.assignee.charAt(0).toUpperCase()}
                        </span>
                        <span className="assignee-name">{task.assignee}</span>
                      </div>
                    ) : (
                      <span className="unassigned-token">Unassigned</span>
                    )}
                  </td>

                  {/* Date Column */}
                  <td className="td-date">
                    <span className="date-label">{formatDate(task.createdAt)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

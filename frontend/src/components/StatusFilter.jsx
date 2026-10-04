import { useState, useEffect } from 'react';
import Dropdown from './Dropdown';

// Fix (Bug #11 & Bug #36 - Production-Readiness):
// - Bug #11: Added keyboard accessible custom dropdown with ARIA role
// - Bug #36: Dynamically fetch valid statuses from backend API to prevent client-server contract drift,
//   with fallback to standard statuses if network is offline.
export default function StatusFilter({ value, onChange }) {
  const [statuses, setStatuses] = useState(['OPEN', 'IN_PROGRESS', 'DONE']);

  useEffect(() => {
    fetch('/api/tasks/statuses')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setStatuses(data);
        }
      })
      .catch(() => {});
  }, []);

  const options = [
    {
      value: '',
      label: 'All statuses',
    },
    ...statuses.map((s) => ({
      value: s,
      label: s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase(),
      dot: s === 'OPEN' ? '#3b82f6' : s === 'IN_PROGRESS' ? '#f59e0b' : '#22c55e',
    })),
  ];

  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All statuses"
      prefixIcon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
      }
      ariaLabel="Filter by status"
      className="status-dropdown"
    />
  );
}

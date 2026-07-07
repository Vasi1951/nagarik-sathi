import { useState } from 'react';

const MOCK_COMPLAINTS = [
  {
    id: 'NS-2024-00142',
    issue: 'Overflowing garbage bin near market area',
    department: 'Municipal Solid Waste Management',
    severity: 'High',
    submittedAt: '2024-07-06T09:15:00Z',
    steps: [
      { label: 'Complaint Filed', status: 'done', time: '2024-07-06 9:15 AM' },
      { label: 'Received by Municipal Office', status: 'done', time: '2024-07-06 10:03 AM' },
      { label: 'Assigned to Field Inspector', status: 'done', time: '2024-07-06 12:45 PM' },
      { label: 'Field Inspection Completed', status: 'active', time: 'In Progress' },
      { label: 'Issue Resolved', status: 'pending', time: 'Pending' },
      { label: 'Complaint Closed', status: 'pending', time: 'Pending' },
    ],
  },
  {
    id: 'NS-2024-00137',
    issue: 'Broken street light on Main Road',
    department: 'Electricity & Street Lighting',
    severity: 'Medium',
    submittedAt: '2024-07-04T14:30:00Z',
    steps: [
      { label: 'Complaint Filed', status: 'done', time: '2024-07-04 2:30 PM' },
      { label: 'Received by Municipal Office', status: 'done', time: '2024-07-04 3:10 PM' },
      { label: 'Assigned to Field Inspector', status: 'done', time: '2024-07-05 9:00 AM' },
      { label: 'Field Inspection Completed', status: 'done', time: '2024-07-05 11:30 AM' },
      { label: 'Issue Resolved', status: 'done', time: '2024-07-06 5:00 PM' },
      { label: 'Complaint Closed', status: 'done', time: '2024-07-06 5:30 PM' },
    ],
  },
];



/**
 * ComplaintTracker component - Shows status of previously filed complaints.
 *
 * Demonstrates realistic complaint lifecycle tracking with a visual timeline.
 * Accessible with keyboard navigation and semantic HTML article/section elements.
 */
export default function ComplaintTracker() {
  const [selectedId, setSelectedId] = useState(null);
  const [searchId, setSearchId] = useState('');

  const displayList = searchId
    ? MOCK_COMPLAINTS.filter((c) =>
        c.id.toLowerCase().includes(searchId.toLowerCase()) ||
        c.issue.toLowerCase().includes(searchId.toLowerCase())
      )
    : MOCK_COMPLAINTS;



  const getOverallStatus = (steps) => {
    const done = steps.filter((s) => s.status === 'done').length;
    if (done === steps.length) return { label: 'Resolved', color: 'var(--color-success)', badge: 'badge-success' };
    if (done === 0) return { label: 'Filed', color: 'var(--color-accent-primary)', badge: 'badge-primary' };
    return { label: 'In Progress', color: 'var(--color-warning)', badge: 'badge-warning' };
  };

  return (
    <div className="flex-col" role="region" aria-label="Complaint Status Tracker">
      <div className="page-header">
        <h2 className="page-title">
          <span className="text-gradient">Complaint Tracker</span>
        </h2>
        <p className="page-subtitle">Track the real-time status of your filed complaints.</p>
      </div>

      {/* Search */}
      <div className="form-group">
        <label htmlFor="complaint-search" className="form-label">Search by Complaint ID or Issue</label>
        <input
          id="complaint-search"
          type="search"
          className="form-input"
          placeholder="e.g. NS-2024-00142 or garbage..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          aria-label="Search complaint by ID or description"
        />
      </div>

      {/* Complaint list */}
      <div
        className="flex-col"
        role="list"
        aria-label={`${displayList.length} complaints found`}
      >
        {displayList.length === 0 && (
          <div className="alert alert-info" role="status">
            <span>🔍</span>
            <span>No complaints match your search. Try a different ID or keyword.</span>
          </div>
        )}

        {displayList.map((complaint) => {
          const status = getOverallStatus(complaint.steps);
          const isSelected = selectedId === complaint.id;

          return (
            <article
              key={complaint.id}
              className="card"
              role="listitem"
              aria-label={`Complaint ${complaint.id}: ${complaint.issue}`}
              style={{ cursor: 'pointer', borderColor: isSelected ? 'var(--color-border-active)' : undefined }}
              onClick={() => setSelectedId(isSelected ? null : complaint.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedId(isSelected ? null : complaint.id);
                }
              }}
              tabIndex={0}
              aria-expanded={isSelected}
            >
              <div className="flex-between">
                <div>
                  <div className="flex-row" style={{ marginBottom: 'var(--space-2)' }}>
                    <code style={{ fontSize: '0.75rem', color: 'var(--color-accent-secondary)', fontFamily: 'monospace' }}>
                      {complaint.id}
                    </code>
                    <span className={`badge ${status.badge}`}>{status.label}</span>
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{complaint.issue}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    🏛️ {complaint.department} &nbsp;·&nbsp; ⚡ {complaint.severity}
                  </p>
                </div>
                <div style={{ fontSize: 20, color: 'var(--color-text-muted)' }}>
                  {isSelected ? '▲' : '▼'}
                </div>
              </div>

              {/* Timeline - shown when expanded */}
              {isSelected && (
                <div
                  className="timeline animate-in"
                  style={{ marginTop: 'var(--space-6)' }}
                  role="list"
                  aria-label={`Status timeline for complaint ${complaint.id}`}
                >
                  {complaint.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="timeline-item"
                      role="listitem"
                      aria-label={`Step ${idx + 1}: ${step.label} - ${step.status === 'done' ? 'Completed' : step.status === 'active' ? 'In progress' : 'Pending'}`}
                    >
                      <div className="timeline-dot-wrap">
                        <div
                          className={`timeline-dot ${step.status}`}
                          aria-hidden="true"
                        />
                        {idx < complaint.steps.length - 1 && (
                          <div className={`timeline-line ${step.status === 'done' ? 'done' : ''}`} aria-hidden="true" />
                        )}
                      </div>
                      <div style={{ paddingTop: 0 }}>
                        <p style={{
                          fontWeight: step.status === 'active' ? 700 : 500,
                          color: step.status === 'pending' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                          fontSize: 'calc(0.875rem * var(--font-scale))',
                        }}>
                          {step.label}
                          {step.status === 'active' && (
                            <span className="badge badge-primary" style={{ marginLeft: 8 }}>Live</span>
                          )}
                        </p>
                        <p style={{ fontSize: 'calc(0.75rem * var(--font-scale))', color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {step.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

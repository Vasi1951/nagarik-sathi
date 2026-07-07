import { useEffect, useState } from 'react';
import { checkHealth } from '../services/api.js';

const STATS = [
  { value: '1,200+', label: 'Active Schemes', icon: '📋' },
  { value: '28+', label: 'States Covered', icon: '🗺️' },
  { value: '7', label: 'Languages', icon: '🗣️' },
  { value: 'AI', label: 'Powered by Gemini', icon: '🤖' },
];

/**
 * Dashboard component - Landing overview for NagarikSathi.
 * Shows stats, API health, and quick action cards.
 * @param {{ onNavigate: (view: string) => void }} props
 */
export default function Dashboard({ onNavigate }) {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let cancelled = false;
    checkHealth().then((data) => {
      if (!cancelled) setHealth(data);
    }).catch(() => {
      if (!cancelled) setHealth({ status: 'degraded' });
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex-col animate-in" role="region" aria-label="NagarikSathi Dashboard">
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: 'var(--space-10) 0 var(--space-8)' }}>
        <div style={{ fontSize: 64, marginBottom: 'var(--space-4)' }} aria-hidden="true">🇮🇳</div>
        <h1 className="page-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: 'var(--space-4)' }}>
          Welcome to <span className="text-gradient">NagarikSathi</span>
        </h1>
        <p className="page-subtitle" style={{ maxWidth: 560, margin: '0 auto var(--space-6)', textAlign: 'center' }}>
          Your AI-powered civic companion — navigate government schemes, file complaints with intelligence, and access public services in your language.
        </p>

        {/* API Health Indicator */}
        {health && (
          <div
            className="flex-row"
            style={{ justifyContent: 'center', marginBottom: 'var(--space-6)' }}
            role="status"
            aria-label={`API Status: ${health.status}`}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: health.status === 'ok' ? 'var(--color-success)' : 'var(--color-warning)',
                boxShadow: health.status === 'ok'
                  ? '0 0 8px var(--color-success)'
                  : '0 0 8px var(--color-warning)',
              }}
              aria-hidden="true"
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              AI Engine: {health.status === 'ok' ? `Online · ${health.model}` : 'Connecting...'}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-6)' }}>
        {STATS.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ fontSize: 28 }} aria-hidden="true">{stat.icon}</div>
            <div className="stat-value text-gradient">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Quick Actions</h2>
      <div className="grid-2">
        {[
          {
            id: 'chat',
            icon: '💬',
            title: 'AI Chat Companion',
            description: 'Ask anything about government schemes, documents, and public services in your preferred Indian language.',
            color: 'var(--color-accent-primary)',
            badge: 'Multilingual',
          },
          {
            id: 'schemes',
            icon: '📋',
            title: 'Scheme Finder',
            description: 'Fill a quick form and get AI-matched Central & State government schemes based on your exact profile.',
            color: 'var(--color-accent-secondary)',
            badge: 'AI Matched',
          },
          {
            id: 'issues',
            icon: '📸',
            title: 'Report Civic Issue',
            description: 'Upload a photo of a public problem. AI detects it, routes it to the right department, and drafts your complaint.',
            color: 'var(--color-accent-saffron)',
            badge: 'Vision AI',
          },
          {
            id: 'tracker',
            icon: '📍',
            title: 'Track Complaint',
            description: 'Check the live status of your filed complaints with a step-by-step resolution timeline.',
            color: 'var(--color-accent-india-green)',
            badge: 'Live Status',
          },
        ].map((action) => (
          <button
            key={action.id}
            className="card"
            onClick={() => onNavigate(action.id)}
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              borderLeft: `3px solid ${action.color}`,
              background: 'var(--color-bg-card)',
            }}
            aria-label={`Go to ${action.title}`}
          >
            <div className="flex-row" style={{ marginBottom: 'var(--space-3)' }}>
              <span style={{ fontSize: 28 }} aria-hidden="true">{action.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'calc(1rem * var(--font-scale))' }}>
                  {action.title}
                </div>
                <span className="badge badge-primary" style={{ marginTop: 4 }}>
                  {action.badge}
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'calc(0.875rem * var(--font-scale))', lineHeight: 1.6 }}>
              {action.description}
            </p>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <div className="alert alert-info" style={{ marginTop: 'var(--space-4)' }}>
        <span aria-hidden="true">ℹ️</span>
        <span style={{ fontSize: '0.875rem' }}>
          NagarikSathi uses Google Gemini AI. Information provided is for guidance only — always verify with official government portals.
        </span>
      </div>
    </div>
  );
}

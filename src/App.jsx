import { useState, useEffect } from 'react';
import { useAccessibility } from './hooks/useAccessibility.js';
import AIChat from './components/AIChat.jsx';
import SchemeFinder from './components/SchemeFinder.jsx';
import IssueReporter from './components/IssueReporter.jsx';
import ComplaintTracker from './components/ComplaintTracker.jsx';
import Dashboard from './components/Dashboard.jsx';

const NAV_ITEMS = [
  { id: 'home',    label: 'Dashboard',       icon: '🏠' },
  { id: 'chat',    label: 'AI Companion',    icon: '💬' },
  { id: 'schemes', label: 'Scheme Finder',   icon: '📋' },
  { id: 'issues',  label: 'Report Issue',    icon: '📸' },
  { id: 'tracker', label: 'Track Complaint', icon: '📍' },
];

/**
 * Root application component.
 *
 * Manages:
 *  - Active view / navigation state
 *  - Global accessibility settings (font size, high contrast, TTS)
 *  - Applies design token classes to document root for global theming
 */
export default function App() {
  const [activeView, setActiveView] = useState('home');
  const { settings, setFontSize, toggleHighContrast, toggleTts } = useAccessibility();

  // Apply accessibility classes to the document root
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    root.classList.remove('font-large', 'font-xlarge');
    if (settings.fontSize === 'large') root.classList.add('font-large');
    if (settings.fontSize === 'xlarge') root.classList.add('font-xlarge');

    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);
  }, [settings]);

  // Map view ID to the component
  const renderView = () => {
    switch (activeView) {
      case 'home':    return <Dashboard onNavigate={setActiveView} />;
      case 'chat':    return <AIChat ttsEnabled={settings.ttsEnabled} />;
      case 'schemes': return <SchemeFinder />;
      case 'issues':  return <IssueReporter />;
      case 'tracker': return <ComplaintTracker />;
      default:        return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <nav
        className="sidebar"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="brand" aria-label="NagarikSathi Home">
          <div className="brand-icon" aria-hidden="true">🙏</div>
          <div className="brand-text">
            <span className="brand-name text-gradient">NagarikSathi</span>
            <span className="brand-tagline">Citizen AI Companion</span>
          </div>
        </div>

        <div className="divider" aria-hidden="true" />

        {/* Nav Links */}
        <div role="list" aria-label="Navigation menu">
          <p className="nav-section-label" id="main-nav-label">Menu</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              role="listitem"
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              aria-current={activeView === item.id ? 'page' : undefined}
              aria-label={item.label}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Accessibility Panel */}
        <div className="a11y-panel" role="region" aria-label="Accessibility Settings">
          <p className="nav-section-label" style={{ marginBottom: 'var(--space-2)' }}>
            ♿ Accessibility
          </p>

          {/* High Contrast */}
          <div className="a11y-row">
            <label htmlFor="toggle-hc" className="a11y-label">High Contrast</label>
            <label className="toggle" htmlFor="toggle-hc">
              <input
                id="toggle-hc"
                type="checkbox"
                checked={settings.highContrast}
                onChange={toggleHighContrast}
                aria-label="Toggle high contrast mode"
              />
              <span className="toggle-track" />
            </label>
          </div>

          {/* Text to Speech */}
          <div className="a11y-row">
            <label htmlFor="toggle-tts" className="a11y-label">Text-to-Speech</label>
            <label className="toggle" htmlFor="toggle-tts">
              <input
                id="toggle-tts"
                type="checkbox"
                checked={settings.ttsEnabled}
                onChange={toggleTts}
                aria-label="Toggle text-to-speech for AI responses"
              />
              <span className="toggle-track" />
            </label>
          </div>

          {/* Font Size */}
          <div className="form-group">
            <label htmlFor="font-size-select" className="a11y-label">Font Size</label>
            <select
              id="font-size-select"
              className="form-select"
              value={settings.fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              aria-label="Select font size"
              style={{ fontSize: '0.8rem', padding: '4px 28px 4px 8px' }}
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="main-content" tabIndex={-1}>
        <div className="container">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

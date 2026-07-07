import { useState } from 'react';
import { getSchemeRecommendations } from '../services/api.js';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','J&K','Ladakh','Puducherry'
];

const ExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/**
 * SchemeFinder component - AI-powered personalized government scheme discovery.
 *
 * Users fill a brief eligibility form. The backend queries Gemini to match
 * Central and State government schemes and returns ranked results with details.
 *
 * Accessibility: Form labels linked to inputs, ARIA live region for results.
 */
export default function SchemeFinder() {
  const [profile, setProfile] = useState({
    age: '',
    state: '',
    gender: '',
    income: '',
    occupation: '',
    category: '',
  });
  const [schemes, setSchemes] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSchemes(null);
    setIsLoading(true);

    try {
      const result = await getSchemeRecommendations(profile);
      setSchemes(result.schemes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = profile.age && profile.state && profile.gender && profile.occupation;

  return (
    <div className="flex-col" role="region" aria-label="Government Scheme Finder">
      <div className="page-header">
        <h2 className="page-title">
          <span className="text-gradient">Scheme Finder</span>
        </h2>
        <p className="page-subtitle">
          Tell us about yourself. Our AI will match the best Central and State government schemes for your profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-label="Eligibility profile form">
        <div className="card">
          <div className="form-grid">
            {/* Age */}
            <div className="form-group">
              <label htmlFor="age" className="form-label">
                Age <span aria-hidden="true" style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="age"
                type="number"
                className="form-input"
                placeholder="e.g. 32"
                min="0"
                max="120"
                value={profile.age}
                onChange={handleChange('age')}
                required
                aria-required="true"
                aria-label="Your age in years"
              />
            </div>

            {/* State */}
            <div className="form-group">
              <label htmlFor="state" className="form-label">
                State <span aria-hidden="true" style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                id="state"
                className="form-select"
                value={profile.state}
                onChange={handleChange('state')}
                required
                aria-required="true"
              >
                <option value="">Select your state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div className="form-group">
              <label htmlFor="gender" className="form-label">
                Gender <span aria-hidden="true" style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                id="gender"
                className="form-select"
                value={profile.gender}
                onChange={handleChange('gender')}
                required
                aria-required="true"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="transgender">Transgender</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            {/* Annual Income */}
            <div className="form-group">
              <label htmlFor="income" className="form-label">Annual Family Income</label>
              <select
                id="income"
                className="form-select"
                value={profile.income}
                onChange={handleChange('income')}
                aria-label="Annual family income bracket"
              >
                <option value="">Select income range</option>
                <option value="below-1L">Below ₹1 Lakh</option>
                <option value="1L-3L">₹1L – ₹3L</option>
                <option value="3L-6L">₹3L – ₹6L</option>
                <option value="6L-10L">₹6L – ₹10L</option>
                <option value="above-10L">Above ₹10L</option>
              </select>
            </div>

            {/* Occupation */}
            <div className="form-group">
              <label htmlFor="occupation" className="form-label">
                Occupation <span aria-hidden="true" style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                id="occupation"
                className="form-select"
                value={profile.occupation}
                onChange={handleChange('occupation')}
                required
                aria-required="true"
              >
                <option value="">Select occupation</option>
                <option value="farmer">Farmer / Agricultural Worker</option>
                <option value="student">Student</option>
                <option value="salaried">Salaried Employee</option>
                <option value="self-employed">Self-Employed / Business</option>
                <option value="unemployed">Currently Unemployed</option>
                <option value="daily-wage">Daily Wage Worker</option>
                <option value="disabled">Person with Disability</option>
                <option value="senior-citizen">Senior Citizen (60+)</option>
              </select>
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">Social Category</label>
              <select
                id="category"
                className="form-select"
                value={profile.category}
                onChange={handleChange('category')}
              >
                <option value="">General</option>
                <option value="sc">SC (Scheduled Caste)</option>
                <option value="st">ST (Scheduled Tribe)</option>
                <option value="obc">OBC (Other Backward Class)</option>
                <option value="ews">EWS (Economically Weaker Section)</option>
                <option value="minority">Minority</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)', textAlign: 'right' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!isFormValid || isLoading}
              aria-label="Find matching government schemes"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-dot" style={{ width: 6, height: 6 }} />
                  <span className="loading-dot" style={{ width: 6, height: 6 }} />
                  Analyzing...
                </>
              ) : (
                '🔍 Find My Schemes'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="alert alert-warning" role="alert" aria-live="assertive">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {schemes !== null && (
        <div
          className="flex-col animate-in"
          role="region"
          aria-live="polite"
          aria-label={`${schemes.length} schemes found for your profile`}
        >
          <div className="flex-between">
            <h3 className="card-title">
              ✅ {schemes.length} Schemes Found for You
            </h3>
            <span className="badge badge-success">
              <CheckIcon /> AI Matched
            </span>
          </div>

          {schemes.length === 0 && (
            <div className="alert alert-info">
              <span>ℹ️</span>
              <span>No specific schemes matched your exact profile. Try broadening your income range or contact your district welfare office.</span>
            </div>
          )}

          <div className="flex-col">
            {schemes.map((scheme, index) => (
              <SchemeCard key={index} scheme={scheme} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual scheme card component.
 * @param {{ scheme: object, index: number }} props
 */
function SchemeCard({ scheme, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="card animate-in"
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`Scheme: ${scheme.name}`}
    >
      <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
        <div>
          <h4 style={{ fontSize: 'calc(1rem * var(--font-scale))', fontWeight: 700 }}>
            {scheme.name}
          </h4>
          <p style={{ fontSize: 'calc(0.8rem * var(--font-scale))', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {scheme.ministry}
          </p>
        </div>
        <span className="badge badge-primary">{scheme.type || 'Central'}</span>
      </div>

      <div className="alert alert-success" style={{ marginBottom: 'var(--space-3)' }}>
        <span>💰</span>
        <span style={{ fontSize: 'calc(0.875rem * var(--font-scale))' }}>
          <strong>Benefit:</strong> {scheme.benefit}
        </span>
      </div>

      {expanded && (
        <div className="flex-col animate-in" style={{ marginTop: 'var(--space-3)' }}>
          <div style={{ fontSize: 'calc(0.875rem * var(--font-scale))', color: 'var(--color-text-secondary)' }}>
            <strong>Why you qualify:</strong> {scheme.eligibility}
          </div>
          <div style={{ fontSize: 'calc(0.875rem * var(--font-scale))', color: 'var(--color-text-secondary)' }}>
            <strong>How to apply:</strong> {scheme.howToApply}
          </div>
        </div>
      )}

      <div className="flex-row" style={{ marginTop: 'var(--space-4)' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls={`scheme-details-${index}`}
        >
          {expanded ? '▲ Show Less' : '▼ More Details'}
        </button>
        {scheme.link && (
          <a
            href={scheme.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            aria-label={`Apply for ${scheme.name} (opens in new tab)`}
          >
            Apply Now <ExternalLink />
          </a>
        )}
      </div>
    </article>
  );
}

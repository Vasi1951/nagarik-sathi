import { useState, useRef } from 'react';
import { analyzeIssueImage } from '../services/api.js';

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * IssueReporter component - AI-powered civic issue detection & complaint filing.
 *
 * Users upload a photo of a public issue (e.g., garbage, pothole, broken pipe).
 * Gemini Vision analyzes the image and:
 *   - Identifies the type of issue
 *   - Routes it to the correct government department
 *   - Assigns a severity level
 *   - Generates a formal complaint letter
 *
 * Security: File type and size validation before upload.
 * Efficiency: Image preview from local URL (no re-upload for preview).
 * Accessibility: Full keyboard support, drag-and-drop with ARIA, status announcements.
 */
export default function IssueReporter() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Validates the selected file for type and size.
   * @param {File} f - File to validate.
   * @returns {{ valid: boolean, message?: string }}
   */
  function validateFile(f) {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return { valid: false, message: 'Please upload a JPG, PNG, or WebP image.' };
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return { valid: false, message: `File must be under ${MAX_FILE_SIZE_MB}MB.` };
    }
    return { valid: true };
  }

  const processFile = (f) => {
    if (!f) return;
    const validation = validateFile(f);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    setError(null);
    setResult(null);
    setFile(f);
    // Create local URL for preview without re-uploading
    const objectUrl = URL.createObjectURL(f);
    setPreview(objectUrl);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await analyzeIssueImage(file);
      setResult(data);
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyComplaint = () => {
    if (!result?.complaint) return;
    navigator.clipboard.writeText(result.complaint).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const SEVERITY_COLORS = {
    low: 'var(--color-success)',
    medium: 'var(--color-warning)',
    high: 'var(--color-error)',
    critical: 'var(--color-error)',
  };

  return (
    <div className="flex-col" role="region" aria-label="Civic Issue Reporter">
      <div className="page-header">
        <h2 className="page-title">
          <span className="text-saffron">Issue Reporter</span>
        </h2>
        <p className="page-subtitle">
          Photograph a public issue — AI will identify it, route it to the right department, and draft a formal complaint for you.
        </p>
      </div>

      {/* Upload area */}
      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Upload image of civic issue. Click or drag and drop a photo here."
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        style={{ position: 'relative' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        />

        {preview ? (
          <div>
            <img
              src={preview}
              alt="Preview of uploaded civic issue"
              style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}
            />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              📸 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB) — click to change
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 48, marginBottom: 'var(--space-4)' }} aria-hidden="true">📷</div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
              <strong>Drag & drop</strong> or click to upload
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              JPG, PNG, WebP — max {MAX_FILE_SIZE_MB}MB
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: 8 }}>
              Example: garbage dump, broken road, water logging, damaged street light
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-warning" role="alert" aria-live="assertive">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Analyze button */}
      {file && !result && (
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            aria-label="Analyze the uploaded image with AI"
            aria-busy={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="loading-dot" style={{ width: 6, height: 6 }} />
                <span className="loading-dot" style={{ width: 6, height: 6 }} />
                Analyzing with AI...
              </>
            ) : (
              '🔍 Analyze Issue'
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex-col animate-in" role="region" aria-live="polite" aria-label="Issue analysis results">

          {/* Issue summary cards */}
          <div className="grid-3" style={{ gap: 'var(--space-4)' }}>
            <div className="stat-card">
              <div style={{ fontSize: 28 }}>🏷️</div>
              <div className="stat-label">Issue Type</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                {result.issue}
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 28 }}>🏛️</div>
              <div className="stat-label">Route To Department</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-accent-secondary)' }}>
                {result.department}
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: 28 }}>⚡</div>
              <div className="stat-label">Severity</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: SEVERITY_COLORS[result.severity?.toLowerCase()] || 'var(--color-warning)' }}>
                {result.severity}
              </div>
            </div>
          </div>

          {/* Generated Complaint Letter */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 className="card-title">📄 Generated Complaint Letter</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleCopyComplaint}
                aria-label="Copy complaint letter to clipboard"
                aria-live="polite"
              >
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            <pre
              style={{
                background: 'rgba(0,0,0,0.25)',
                padding: 'var(--space-5)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-secondary)',
                fontSize: 'calc(0.875rem * var(--font-scale))',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                border: '1px solid var(--color-border)',
              }}
              role="textbox"
              aria-label="Generated complaint letter content"
              aria-readonly="true"
            >
              {result.complaint}
            </pre>
          </div>

          {/* Reset */}
          <div style={{ textAlign: 'center' }}>
            <button
              className="btn btn-ghost"
              onClick={() => { setFile(null); setPreview(null); setResult(null); setError(null); }}
              aria-label="Report another issue"
            >
              📷 Report Another Issue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

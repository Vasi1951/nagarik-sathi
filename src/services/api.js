/**
 * API service layer for NagarikSathi.
 *
 * Routing strategy:
 *  - When VITE_GEMINI_API_KEY is set (GitHub Pages deployment):
 *      → Calls Gemini API directly from the browser via geminiDirect.js
 *  - When running with Express backend (local / Cloud Run):
 *      → Calls /api/* routes on the Express server
 *
 * This dual-mode approach makes the app fully functional on both:
 *  1. GitHub Pages (static hosting, no backend)
 *  2. Cloud Run / local Node.js (full backend)
 *
 * No API keys are ever committed to the repository.
 * Keys are injected at build time via environment variables / GitHub Secrets.
 */

import {
  isClientSideMode,
  sendChatDirect,
  getSchemesDirect,
  analyzeIssueDirect,
} from './geminiDirect.js';

const BASE_URL = '/api';


/**
 * Base fetch wrapper with error handling.
 * @param {string} path - API path (relative to /api).
 * @param {RequestInit} options - Fetch options.
 * @returns {Promise<any>} - Parsed JSON response.
 */
async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Send a chat message to the AI companion.
 * @param {string} message - User's message.
 * @param {Array<{role: string, parts: Array<{text: string}>}>} history - Conversation history.
 * @param {string} language - Language code (e.g., 'en', 'hi').
 * @returns {Promise<{reply: string}>}
 */
export async function sendChatMessage(message, history = [], language = 'en') {
  // GitHub Pages: call Gemini directly from browser
  if (isClientSideMode) return sendChatDirect(message, history, language);
  // Local / Cloud Run: call backend API
  return apiFetch('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history, language }),
  });
}

/**
 * Get personalized government scheme recommendations.
 * @param {{ age: number, state: string, gender: string, income: string, occupation: string }} profile - User profile.
 * @returns {Promise<{schemes: Array<{name: string, ministry: string, benefit: string, eligibility: string, link: string}>}>}
 */
export async function getSchemeRecommendations(profile) {
  if (isClientSideMode) return getSchemesDirect(profile);
  return apiFetch('/recommend-schemes', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

/**
 * Analyze a public issue image using Gemini Vision.
 * @param {File} imageFile - The image file to analyze.
 * @returns {Promise<{issue: string, department: string, severity: string, complaint: string}>}
 */
export async function analyzeIssueImage(imageFile) {
  // GitHub Pages: process image client-side with Gemini Vision
  if (isClientSideMode) return analyzeIssueDirect(imageFile);

  // Local / Cloud Run: send to backend via multipart upload
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await fetch(`${BASE_URL}/analyze-issue`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Image analysis failed' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * Health check for the API server.
 * @returns {Promise<{status: string, model: string, timestamp: string}>}
 */
export async function checkHealth() {
  // In GitHub Pages mode, return mock health since no backend exists
  if (isClientSideMode) {
    return { status: 'ok', model: 'gemini-1.5-flash (client-side)', timestamp: new Date().toISOString() };
  }
  return apiFetch('/health');
}

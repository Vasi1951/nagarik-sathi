/**
 * Gemini Direct API Service
 * ==========================
 * Client-side Gemini API integration using @google/generative-ai.
 *
 * Used when the app is deployed on GitHub Pages (no backend available).
 * Falls back to this when VITE_GEMINI_API_KEY is set as a build-time variable.
 *
 * Security note: API key is injected at build time via GitHub Secrets.
 * It is NOT hardcoded and NOT committed to the repository.
 *
 * @module geminiDirect
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Injected at build time from GitHub Secrets (VITE_GEMINI_API_KEY)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/** Singleton Gemini client */
let genAI = null;

function getClient() {
  if (!genAI && API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

/** Check if client-side Gemini is available */
export const isClientSideMode = Boolean(API_KEY);

export async function sendChatDirect(message, history = [], language = 'en') {
  const client = getClient();
  if (!client) throw new Error('Gemini API key not configured.');

  const LANGUAGE_NAMES = {
    en: 'English', hi: 'Hindi', te: 'Telugu',
    ta: 'Tamil', mr: 'Marathi', bn: 'Bengali', gu: 'Gujarati',
  };
  const langName = LANGUAGE_NAMES[language] || 'English';

  // Use stable v1 API version for maximum compatibility across GCP/AI Studio tiers
  const model = client.getGenerativeModel(
    { model: 'gemini-flash-latest' },
    { apiVersion: 'v1beta' }
  );

  // Format first message to include the system prompt when history is empty
  let finalMessage = message;
  if (history.length === 0) {
    finalMessage = `[System Instructions: You are NagarikSathi, an AI-powered civic companion for Indian citizens. Help with government schemes, civic processes, and public services. Respond in ${langName}. Keep answers concise (3-5 sentences or short bullet list). Never provide legal or medical advice. Always recommend checking official government portals.]\n\nUser Request: ${message}`;
  }

  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role,
      parts: h.parts,
    })),
  });

  const result = await chat.sendMessage(finalMessage);
  const reply = result.response.text() || 'Sorry, I could not generate a response.';
  return { reply };
}

/**
 * Get scheme recommendations directly from Gemini.
 * @param {object} profile - User profile object.
 * @returns {Promise<{schemes: Array}>}
 */
export async function getSchemesDirect(profile) {
  const client = getClient();
  if (!client) throw new Error('Gemini API key not configured.');

  const model = client.getGenerativeModel(
    { model: 'gemini-flash-latest' },
    { apiVersion: 'v1beta' }
  );

  const prompt = `You are an expert on Indian government welfare schemes.
A citizen has: Age: ${profile.age}, State: ${profile.state}, Gender: ${profile.gender}, 
Income: ${profile.income || 'not specified'}, Occupation: ${profile.occupation}, Category: ${profile.category || 'general'}.
List top 5-7 relevant Indian government schemes they qualify for.
Return ONLY a valid JSON array (no markdown, no explanation):
[{"name":"","ministry":"","type":"Central or State","benefit":"","eligibility":"","howToApply":"","link":""}]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    const schemes = JSON.parse(cleaned);
    return { schemes: Array.isArray(schemes) ? schemes : [] };
  } catch {
    return { schemes: [] };
  }
}

/**
 * Analyze an issue image directly from the browser.
 * Converts file to base64 and sends to Gemini Vision.
 * @param {File} imageFile
 * @returns {Promise<{issue: string, department: string, severity: string, complaint: string}>}
 */
export async function analyzeIssueDirect(imageFile) {
  const client = getClient();
  if (!client) throw new Error('Gemini API key not configured.');

  const model = client.getGenerativeModel(
    { model: 'gemini-flash-latest' },
    { apiVersion: 'v1beta' }
  );

  // Convert File to base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });

  const prompt = `Analyze this image for civic/public infrastructure problems.
Return ONLY valid JSON (no markdown):
{"issue":"","department":"","severity":"Low|Medium|High|Critical","complaint":"formal complaint letter 150-200 words addressed to The Concerned Officer with [Your Name], [Your Address], [Date] placeholders"}
If no civic issue visible, set issue to 'No Issue Detected'.`;

  const result = await model.generateContent([
    { inlineData: { mimeType: imageFile.type, data: base64 } },
    { text: prompt },
  ]);

  const text = result.response.text();
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      issue: 'Analysis Unavailable',
      department: 'Unknown',
      severity: 'Unknown',
      complaint: 'Could not analyze image. Please try again with a clearer photo.',
    };
  }
}

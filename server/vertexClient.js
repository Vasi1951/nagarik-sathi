/**
 * Vertex AI client factory.
 *
 * Centralizes all Vertex AI initialization.
 * Uses Application Default Credentials (ADC) — no API key needed.
 * Works locally via `gcloud auth application-default login`
 * and on Cloud Run via the attached service account.
 *
 * @module vertexClient
 */

import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'carbon-vasi-951';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';

// Lazily instantiated (module-level singleton)
let vertexInstance = null;

/**
 * Returns the singleton Vertex AI client.
 * @returns {VertexAI}
 */
function getVertexAI() {
  if (!vertexInstance) {
    vertexInstance = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  }
  return vertexInstance;
}

/**
 * Gets a Generative Model instance.
 *
 * @param {string} [modelId='gemini-1.5-flash-002'] - Model ID to use.
 * @param {object} [systemInstruction] - Optional system instruction.
 * @returns {import('@google-cloud/vertexai').GenerativeModel}
 */
export function getModel(modelId = 'gemini-1.5-flash-002', systemInstruction = null) {
  const vertex = getVertexAI();
  const config = { model: modelId };
  if (systemInstruction) config.systemInstruction = systemInstruction;
  return vertex.getGenerativeModel(config);
}

export const PROJECT = PROJECT_ID;
export const LOCATION_ID = LOCATION;

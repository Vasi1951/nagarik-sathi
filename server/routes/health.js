import { Router } from 'express';
import { PROJECT, LOCATION_ID } from '../vertexClient.js';

const router = Router();

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring and uptime checks.
 * Returns current server status, model being used, and timestamp.
 * Used by the frontend Dashboard to show AI engine status.
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    model: 'gemini-1.5-flash-002',
    project: PROJECT,
    location: LOCATION_ID,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;

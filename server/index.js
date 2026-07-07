/**
 * NagarikSathi Express Server
 * ============================
 *
 * Security measures implemented:
 *  - Helmet.js: Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
 *  - CORS: Restricted to same origin in production
 *  - Rate limiting: Per-IP limits on all API routes to prevent abuse
 *  - Input sanitization: Validates all request body fields before processing
 *  - File validation: MIME type and size checks on multipart uploads
 *  - Error handling: Never exposes raw stack traces to clients
 *  - No API keys in client-side code: All Vertex AI calls stay server-side
 *
 * Efficiency measures:
 *  - Compression middleware: gzip for all responses
 *  - Static asset caching headers
 *  - Multer memory storage: No disk I/O for image uploads
 *
 * @module server
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import chatRouter from './routes/chat.js';
import schemesRouter from './routes/schemes.js';
import issuesRouter from './routes/issues.js';
import healthRouter from './routes/health.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const app = express();

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────

// Helmet sets secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Required for Vite-built assets
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],       // blob: for image preview
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for blob URLs
}));

// CORS: only allow same-origin in production
const corsOptions = {
  origin: IS_PRODUCTION ? false : 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// ─── PERFORMANCE MIDDLEWARE ───────────────────────────────────────────────────

// gzip compression for all responses
app.use(compression());

// HTTP request logging (combined in production, dev in development)
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev'));

// JSON body parser with size limit to prevent payload attacks
app.use(express.json({ limit: '1mb' }));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────

/**
 * General API rate limiter: 100 requests per 15 minutes per IP.
 * Prevents abuse and runaway AI costs.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a few minutes and try again.' },
});

/**
 * Stricter limiter for AI endpoints: 30 requests per 15 minutes per IP.
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI request limit reached. Please wait before making more requests.' },
});

app.use('/api', apiLimiter);
app.use('/api/chat', aiLimiter);
app.use('/api/recommend-schemes', aiLimiter);
app.use('/api/analyze-issue', aiLimiter);

// ─── API ROUTES ───────────────────────────────────────────────────────────────

app.use('/api/health', healthRouter);
app.use('/api/chat', chatRouter);
app.use('/api/recommend-schemes', schemesRouter);
app.use('/api/analyze-issue', issuesRouter);

// ─── STATIC ASSETS (Production) ──────────────────────────────────────────────

const distPath = path.join(__dirname, '..', 'dist');

// Serve built frontend with long cache for hashed assets
app.use(express.static(distPath, {
  maxAge: '1y',
  etag: true,
}));

// SPA fallback: serve index.html for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────

/**
 * Centralized error handler.
 * NEVER exposes raw error messages or stack traces in production.
 *
 * @param {Error} err
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const isDev = !IS_PRODUCTION;

  // Log full error on server for debugging
  console.error('[ERROR]', err.message);
  if (isDev) console.error(err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: isDev ? err.message : 'An internal server error occurred. Please try again.',
    ...(isDev && { stack: err.stack }),
  });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ NagarikSathi server running on port ${PORT} [${IS_PRODUCTION ? 'production' : 'development'}]`);
});

export default app;

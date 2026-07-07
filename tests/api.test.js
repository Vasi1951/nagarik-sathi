/**
 * Tests: API Routes Integration Tests
 *
 * Tests the Express API endpoints using supertest.
 * Vertex AI calls are mocked to avoid real API calls during testing.
 *
 * @group integration
 */

import { jest } from '@jest/globals';

// Mock the Vertex AI client BEFORE importing the server
jest.unstable_mockModule('../server/vertexClient.js', () => ({
  getModel: jest.fn(() => ({
    startChat: jest.fn(() => ({
      sendMessage: jest.fn(async () => ({
        response: {
          candidates: [{ content: { parts: [{ text: 'Mock AI response about PM Kisan Yojana.' }] } }]
        }
      }))
    })),
    generateContent: jest.fn(async (prompt) => {
      // Check if it's the schemes prompt or issues prompt
      const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
      if (promptText.includes('recommend-schemes') || promptText.includes('welfare schemes')) {
        return {
          response: {
            candidates: [{ content: { parts: [{ text: '[{"name":"PM Kisan","ministry":"Ministry of Agriculture","type":"Central","benefit":"₹6000/year","eligibility":"Farmer","howToApply":"pmkisan.gov.in","link":"https://pmkisan.gov.in"}]' }] } }]
          }
        };
      }
      return {
        response: {
          candidates: [{ content: { parts: [{ text: '{"issue":"Overflowing Garbage","department":"Municipal","severity":"High","complaint":"Dear Officer, There is garbage overflow..."}' }] } }]
        }
      };
    }),
  })),
  PROJECT: 'test-project',
  LOCATION_ID: 'us-central1',
}));

// Dynamically import server after mocks are set up
const { default: supertest } = await import('supertest');
const { default: app } = await import('../server/index.js');
const request = supertest(app);

// ─── /api/health ─────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.model).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });
});

// ─── /api/chat ────────────────────────────────────────────────────────────────

describe('POST /api/chat', () => {
  test('returns 200 with a reply for valid input', async () => {
    const res = await request.post('/api/chat').send({
      message: 'What is PM Kisan Yojana?',
      history: [],
      language: 'en',
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(0);
  });

  test('returns 400 for empty message', async () => {
    const res = await request.post('/api/chat').send({
      message: '',
      history: [],
      language: 'en',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/message/i);
  });

  test('returns 400 for missing message field', async () => {
    const res = await request.post('/api/chat').send({ history: [], language: 'en' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid language', async () => {
    const res = await request.post('/api/chat').send({
      message: 'Hello',
      history: [],
      language: 'zzz',
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 for message exceeding character limit', async () => {
    const res = await request.post('/api/chat').send({
      message: 'x'.repeat(2001),
      history: [],
      language: 'en',
    });
    expect(res.status).toBe(400);
  });

  test('accepts Hindi language code', async () => {
    const res = await request.post('/api/chat').send({
      message: 'नमस्ते',
      history: [],
      language: 'hi',
    });
    expect(res.status).toBe(200);
  });
});

// ─── /api/recommend-schemes ──────────────────────────────────────────────────

describe('POST /api/recommend-schemes', () => {
  const validProfile = {
    age: 45,
    state: 'Andhra Pradesh',
    gender: 'female',
    income: '1L-3L',
    occupation: 'farmer',
    category: 'sc',
  };

  test('returns 200 with schemes array for valid profile', async () => {
    const res = await request.post('/api/recommend-schemes').send(validProfile);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.schemes)).toBe(true);
  });

  test('returns 400 for missing age', async () => {
    const res = await request.post('/api/recommend-schemes').send({ ...validProfile, age: undefined });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid gender', async () => {
    const res = await request.post('/api/recommend-schemes').send({ ...validProfile, gender: 'unknown' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for missing state', async () => {
    const res = await request.post('/api/recommend-schemes').send({ ...validProfile, state: '' });
    expect(res.status).toBe(400);
  });
});

// ─── /api/analyze-issue ──────────────────────────────────────────────────────

describe('POST /api/analyze-issue', () => {
  test('returns 400 when no file is uploaded', async () => {
    const res = await request.post('/api/analyze-issue');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No image/i);
  });

  test('returns 400 for non-image file type', async () => {
    const res = await request
      .post('/api/analyze-issue')
      .attach('image', Buffer.from('fake-pdf'), {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/JPEG|PNG|WebP/);
  });

  test('returns 200 with analysis for valid image', async () => {
    // Create a minimal valid JPEG header (FFD8FFE0)
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const res = await request
      .post('/api/analyze-issue')
      .attach('image', jpegHeader, {
        filename: 'issue.jpg',
        contentType: 'image/jpeg',
      });
    expect(res.status).toBe(200);
    expect(res.body.issue).toBeDefined();
    expect(res.body.department).toBeDefined();
    expect(res.body.severity).toBeDefined();
    expect(res.body.complaint).toBeDefined();
  });
});

// ─── Security: Rate Limiting headers ─────────────────────────────────────────

describe('Security Headers', () => {
  test('response includes X-Content-Type-Options header', async () => {
    const res = await request.get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('response includes X-Frame-Options header', async () => {
    const res = await request.get('/api/health');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

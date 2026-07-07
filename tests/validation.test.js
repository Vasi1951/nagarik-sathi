/**
 * Tests: Input Validation Module
 *
 * Tests all validation functions for correctness, edge cases,
 * and security (oversized inputs, wrong types, invalid enums).
 *
 * @group unit
 */

import {
  validateChatRequest,
  validateSchemeRequest,
  validateImageFile,
} from '../server/validation.js';

// ─── validateChatRequest ──────────────────────────────────────────────────────

describe('validateChatRequest', () => {
  test('accepts a valid request', () => {
    const result = validateChatRequest({
      message: 'Tell me about PM Kisan Yojana',
      history: [],
      language: 'en',
    });
    expect(result.valid).toBe(true);
    expect(result.data.message).toBe('Tell me about PM Kisan Yojana');
    expect(result.data.language).toBe('en');
  });

  test('rejects empty message', () => {
    const result = validateChatRequest({ message: '   ', history: [], language: 'en' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/message/i);
  });

  test('rejects non-string message', () => {
    const result = validateChatRequest({ message: 42, history: [], language: 'en' });
    expect(result.valid).toBe(false);
  });

  test('rejects message exceeding 2000 characters', () => {
    const result = validateChatRequest({
      message: 'x'.repeat(2001),
      history: [],
      language: 'en',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/2000/);
  });

  test('rejects non-array history', () => {
    const result = validateChatRequest({ message: 'Hello', history: 'bad', language: 'en' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/history/i);
  });

  test('rejects history exceeding 20 items', () => {
    const history = Array(21).fill({ role: 'user', parts: [{ text: 'hi' }] });
    const result = validateChatRequest({ message: 'hi', history, language: 'en' });
    expect(result.valid).toBe(false);
  });

  test('defaults to English for unknown language', () => {
    const result = validateChatRequest({ message: 'hello', history: [], language: 'klingon' });
    expect(result.valid).toBe(false);
  });

  test('accepts all supported languages', () => {
    const langs = ['en', 'hi', 'te', 'ta', 'mr', 'bn', 'gu'];
    langs.forEach((lang) => {
      const result = validateChatRequest({ message: 'hello', history: [], language: lang });
      expect(result.valid).toBe(true);
    });
  });

  test('trims whitespace from message', () => {
    const result = validateChatRequest({ message: '  hello  ', history: [], language: 'en' });
    expect(result.valid).toBe(true);
    expect(result.data.message).toBe('hello');
  });
});

// ─── validateSchemeRequest ────────────────────────────────────────────────────

describe('validateSchemeRequest', () => {
  const validBody = {
    age: 35,
    state: 'Telangana',
    gender: 'female',
    income: '1L-3L',
    occupation: 'farmer',
    category: 'obc',
  };

  test('accepts a valid request', () => {
    const result = validateSchemeRequest(validBody);
    expect(result.valid).toBe(true);
    expect(result.data.age).toBe(35);
  });

  test('rejects missing age', () => {
    const result = validateSchemeRequest({ ...validBody, age: undefined });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/age/i);
  });

  test('rejects age > 120', () => {
    const result = validateSchemeRequest({ ...validBody, age: 200 });
    expect(result.valid).toBe(false);
  });

  test('rejects negative age', () => {
    const result = validateSchemeRequest({ ...validBody, age: -1 });
    expect(result.valid).toBe(false);
  });

  test('rejects missing state', () => {
    const result = validateSchemeRequest({ ...validBody, state: '' });
    expect(result.valid).toBe(false);
  });

  test('rejects invalid gender', () => {
    const result = validateSchemeRequest({ ...validBody, gender: 'attack-helicopter' });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/gender/i);
  });

  test('accepts all valid genders', () => {
    ['male', 'female', 'transgender', 'prefer-not-to-say'].forEach((g) => {
      const result = validateSchemeRequest({ ...validBody, gender: g });
      expect(result.valid).toBe(true);
    });
  });

  test('rejects missing occupation', () => {
    const result = validateSchemeRequest({ ...validBody, occupation: '' });
    expect(result.valid).toBe(false);
  });

  test('trims whitespace from state and occupation', () => {
    const result = validateSchemeRequest({ ...validBody, state: ' Goa ', occupation: ' farmer ' });
    expect(result.valid).toBe(true);
    expect(result.data.state).toBe('Goa');
    expect(result.data.occupation).toBe('farmer');
  });
});

// ─── validateImageFile ────────────────────────────────────────────────────────

describe('validateImageFile', () => {
  const validFile = {
    mimetype: 'image/jpeg',
    size: 1 * 1024 * 1024, // 1MB
    originalname: 'test.jpg',
    buffer: Buffer.from('fake-image-data'),
  };

  test('accepts a valid JPEG file', () => {
    const result = validateImageFile(validFile);
    expect(result.valid).toBe(true);
  });

  test('accepts PNG and WebP', () => {
    ['image/png', 'image/webp'].forEach((mime) => {
      const result = validateImageFile({ ...validFile, mimetype: mime });
      expect(result.valid).toBe(true);
    });
  });

  test('rejects null/undefined file', () => {
    expect(validateImageFile(null).valid).toBe(false);
    expect(validateImageFile(undefined).valid).toBe(false);
  });

  test('rejects non-image MIME types', () => {
    ['application/pdf', 'text/html', 'video/mp4', 'application/javascript'].forEach((mime) => {
      const result = validateImageFile({ ...validFile, mimetype: mime });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/JPEG|PNG|WebP/);
    });
  });

  test('rejects files over 10MB', () => {
    const result = validateImageFile({ ...validFile, size: 11 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/10MB/);
  });

  test('accepts files exactly at the 10MB limit', () => {
    const result = validateImageFile({ ...validFile, size: 10 * 1024 * 1024 });
    expect(result.valid).toBe(true);
  });
});

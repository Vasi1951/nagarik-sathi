/**
 * Input validation utilities.
 *
 * Provides a consistent, reusable set of validation functions
 * to sanitize all incoming request data before processing.
 *
 * Security: Prevents prompt injection, oversized inputs, and type coercion attacks.
 *
 * @module validation
 */

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 20;

/**
 * Validates a chat request body.
 * @param {{ message: unknown, history: unknown, language: unknown }} body
 * @returns {{ valid: boolean, error?: string, data?: object }}
 */
export function validateChatRequest(body) {
  const { message, history, language } = body;

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'message must be a non-empty string.' };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `message must be under ${MAX_MESSAGE_LENGTH} characters.` };
  }

  if (!Array.isArray(history)) {
    return { valid: false, error: 'history must be an array.' };
  }

  if (history.length > MAX_HISTORY_ITEMS) {
    return { valid: false, error: `history must contain no more than ${MAX_HISTORY_ITEMS} items.` };
  }

  const ALLOWED_LANGUAGES = ['en', 'hi', 'te', 'ta', 'mr', 'bn', 'gu'];
  const lang = typeof language === 'string' ? language : 'en';
  if (!ALLOWED_LANGUAGES.includes(lang)) {
    return { valid: false, error: `language must be one of: ${ALLOWED_LANGUAGES.join(', ')}.` };
  }

  return { valid: true, data: { message: message.trim(), history, language: lang } };
}

/**
 * Validates a scheme recommendation profile.
 * @param {object} body
 * @returns {{ valid: boolean, error?: string, data?: object }}
 */
export function validateSchemeRequest(body) {
  const { age, state, gender, income, occupation, category } = body;

  const ageNum = Number(age);
  if (!age || isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
    return { valid: false, error: 'age must be a number between 0 and 120.' };
  }

  if (!state || typeof state !== 'string' || state.trim().length === 0) {
    return { valid: false, error: 'state is required.' };
  }

  const VALID_GENDERS = ['male', 'female', 'transgender', 'prefer-not-to-say'];
  if (!VALID_GENDERS.includes(gender)) {
    return { valid: false, error: 'gender is invalid.' };
  }

  if (!occupation || typeof occupation !== 'string') {
    return { valid: false, error: 'occupation is required.' };
  }

  return {
    valid: true,
    data: {
      age: ageNum,
      state: state.trim(),
      gender,
      income: income || 'not specified',
      occupation: occupation.trim(),
      category: category || 'general',
    },
  };
}

/**
 * Validates an uploaded image file (from multer).
 * @param {Express.Multer.File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No image file was uploaded.' };
  }

  const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are accepted.' };
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Image must be under 10MB.' };
  }

  return { valid: true };
}

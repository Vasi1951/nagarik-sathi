import { Router } from 'express';
import { getModel } from '../vertexClient.js';
import { validateChatRequest } from '../validation.js';

const router = Router();

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  mr: 'Marathi',
  bn: 'Bengali',
  gu: 'Gujarati',
};

/**
 * POST /api/chat
 *
 * Sends a user message to Gemini and returns the AI reply.
 * Maintains conversation history for multi-turn context.
 *
 * Body: { message: string, history: ChatMessage[], language: string }
 * Response: { reply: string }
 */
router.post('/', async (req, res, next) => {
  try {
    // Validate and sanitize input
    const validation = validateChatRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const { message, history, language } = validation.data;
    const languageName = LANGUAGE_NAMES[language] || 'English';

    // System instruction that defines the AI's role and safety boundaries
    const systemInstruction = {
      parts: [{
        text: `You are NagarikSathi, an AI-powered civic companion for Indian citizens.
Your role is to:
- Help citizens understand and find Indian government schemes (Central and State)
- Guide them through civic processes (ration card, aadhar, PAN, caste certificate, etc.)
- Answer questions about public services, grievance systems, and digital India initiatives
- Provide information in ${languageName} when requested

Rules:
- Always be helpful, respectful, and factual
- If unsure about a specific scheme's current status, recommend the user check official government portals
- Never provide legal or medical advice
- Never generate harmful, political, or divisive content
- Keep responses concise but complete (3-5 sentences or a short bullet list)
- Respond in ${languageName} as requested by the user`
      }]
    };

    const model = getModel('gemini-1.5-flash-002', systemInstruction);

    // Build chat session with provided history
    const chat = model.startChat({
      history: history.map((turn) => ({
        role: turn.role,
        parts: turn.parts,
      })),
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const reply = result.response.candidates?.[0]?.content?.parts?.[0]?.text
      || 'I apologize — I could not generate a response. Please try again.';

    return res.json({ reply });
  } catch (err) {
    return next(err);
  }
});

export default router;

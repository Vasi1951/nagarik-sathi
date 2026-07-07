import { Router } from 'express';
import { getModel } from '../vertexClient.js';
import { validateSchemeRequest } from '../validation.js';

const router = Router();

/**
 * POST /api/recommend-schemes
 *
 * Generates personalized government scheme recommendations using Gemini.
 *
 * Body: { age: number, state: string, gender: string, income: string, occupation: string, category: string }
 * Response: { schemes: Array<SchemeObject> }
 */
router.post('/', async (req, res, next) => {
  try {
    const validation = validateSchemeRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const { age, state, gender, income, occupation, category } = validation.data;

    const prompt = `You are an expert on Indian government welfare schemes for citizens.

A citizen has the following profile:
- Age: ${age} years
- State: ${state}
- Gender: ${gender}
- Annual Family Income: ${income}
- Occupation: ${occupation}
- Social Category: ${category}

Based on this profile, list the top 5-7 most relevant Indian Central and/or State government schemes they would qualify for.

Return a JSON array ONLY (no markdown, no explanation, just valid JSON) with this exact structure:
[
  {
    "name": "Scheme Name",
    "ministry": "Ministry / Department Name",
    "type": "Central or State",
    "benefit": "Concise description of what the beneficiary gets (max 2 sentences)",
    "eligibility": "Why this person qualifies based on their profile (1-2 sentences)",
    "howToApply": "Simple steps or portal to apply (1-2 sentences)",
    "link": "https://official-government-url.gov.in or empty string"
  }
]

Include only schemes with reliable, official information. If a scheme is state-specific, specify ${state} context.`;

    const model = getModel('gemini-1.5-flash-002');
    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    // Safely parse the JSON response from Gemini
    let schemes;
    try {
      // Remove any potential markdown code fences Gemini might add
      const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
      schemes = JSON.parse(cleaned);
      if (!Array.isArray(schemes)) schemes = [];
    } catch {
      // If parsing fails, return a helpful fallback
      console.error('[schemes] Failed to parse Gemini response as JSON:', text.substring(0, 200));
      schemes = [];
    }

    return res.json({ schemes });
  } catch (err) {
    return next(err);
  }
});

export default router;

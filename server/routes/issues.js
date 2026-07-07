import { Router } from 'express';
import multer from 'multer';
import { getModel } from '../vertexClient.js';
import { validateImageFile } from '../validation.js';

const router = Router();

/**
 * Multer configured for in-memory storage.
 * Files are held as Buffer objects, never written to disk.
 * Limits: 10MB max file size.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * POST /api/analyze-issue
 *
 * Accepts a multipart image upload, analyzes it with Gemini Vision,
 * and returns:
 *   - Issue type detected
 *   - Government department to route to
 *   - Severity level
 *   - A formal complaint letter draft
 *
 * Security:
 *   - File type validated before processing
 *   - Buffer processed in memory (no temp files)
 *   - Multer limits enforce file size before handler runs
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    // Validate uploaded file
    const validation = validateImageFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const file = req.file;

    // Convert buffer to base64 for Gemini inline data
    const imageBase64 = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    const prompt = `You are an AI civic assistant helping Indian citizens report public infrastructure issues.

Analyze this image and identify any civic or public infrastructure problem.

Return a JSON object ONLY (no markdown, no explanation) with this exact structure:
{
  "issue": "Short name of the identified issue (e.g., 'Overflowing Garbage Bin', 'Broken Streetlight', 'Waterlogged Road', 'Damaged Footpath')",
  "department": "The exact Indian government department or authority responsible (e.g., 'Municipal Solid Waste Management', 'Public Works Department', 'Jal Board / Water Authority')",
  "severity": "One of: Low, Medium, High, Critical",
  "complaint": "A formal complaint letter in professional English addressed to 'The Concerned Officer', describing the issue clearly, requesting immediate action, and leaving [Your Name], [Your Address], and [Date] as placeholders. 150-200 words."
}

If no civic issue is visible, set issue to 'No Issue Detected' and complaint to 'No complaint required.'`;

    const model = getModel('gemini-1.5-flash-002');

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      }],
    });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Safely parse
    let analysis;
    try {
      const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      console.error('[issues] Failed to parse Gemini response:', text.substring(0, 200));
      analysis = {
        issue: 'Analysis Unavailable',
        department: 'Unknown',
        severity: 'Unknown',
        complaint: 'We were unable to analyze this image. Please try again with a clearer photo.',
      };
    }

    return res.json(analysis);
  } catch (err) {
    return next(err);
  }
});

export default router;

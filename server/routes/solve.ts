import { Router, Request, Response } from 'express';
import { getGeminiClient, recordQuotaError, GeminiServiceError } from '../gemini.js';
import { SolverResponseSchema } from '../schemas.js';
import { activeRequestManager } from '../activeRequests.js';
import { CONFIG } from '../config.js';

export const solveRouter = Router();

/**
 * POST /api/solve
 * Solves homework, STEM, and exam questions from photos with step-by-step reasoning.
 * Handles clear questions, blurry photos, and non-question images.
 */
solveRouter.post('/', async (req: Request, res: Response) => {
  const {
    imageBase64,
    mimeType = 'image/jpeg',
    additionalNotes,
    requestId = `solve_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  } = req.body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    res.status(400).json({ error: 'imageBase64 string is required.', code: 'MISSING_IMAGE' });
    return;
  }

  if (!activeRequestManager.acquire(requestId)) {
    res.status(409).json({ error: 'Solver request already in flight.', code: 'DUPLICATE_REQUEST' });
    return;
  }

  try {
    const ai = getGeminiClient();

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    const safeMime = allowedMimes.includes(mimeType.toLowerCase()) ? mimeType : 'image/jpeg';

    const promptText = `Analyze this uploaded image:
1. Determine if this image contains a test, homework question, math problem, or educational exercise.
   - If it is NOT a study/exam question (e.g. selfie, landscape, car, random object): set isQuestion: false, message: "No question was detected in this image. Please upload an image of a study problem or assignment."
   - If it IS a question, but blurry/partially obscured: set isQuestion: true, isBlurry: true, provide clarification on what was inferred, and solve to the best ability.
   - If it IS a clear question: set isQuestion: true, isBlurry: false, extract questionText, provide clear stepByStep breakdown, finalAnswer, and study tips.
${additionalNotes ? `Student notes: ${additionalNotes}` : ''}

Output strictly valid JSON conforming to the schema.`;

    const response = await ai.models.generateContent({
      model: CONFIG.GEMINI_MODEL_FAST,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: imageBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          'You are Crema Problem Solver. Provide rigorous mathematical, scientific, and humanities solutions step-by-step.',
        responseMimeType: 'application/json',
      },
    });

    const raw = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Single repair pass
      const repair = await ai.models.generateContent({
        model: CONFIG.GEMINI_MODEL_FAST,
        contents: [{ role: 'user', parts: [{ text: `Repair this into valid JSON:\n${raw.slice(0, 4000)}` }] }],
        config: { responseMimeType: 'application/json' },
      });
      parsed = JSON.parse((repair.text || '').replace(/```json/g, '').replace(/```/g, '').trim());
    }

    const validated = SolverResponseSchema.parse(parsed);
    res.json({ success: true, solution: validated });
  } catch (err) {
    const msg = (err as Error).message || '';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      const cooldown = recordQuotaError();
      res.status(429).json({ error: 'Quota exceeded', code: 'RATE_LIMITED', retryAfterSeconds: cooldown });
      return;
    }
    if (err instanceof GeminiServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code, retryAfterSeconds: err.retryAfterSeconds });
      return;
    }
    res.status(500).json({ error: msg || 'Question solving failed.', code: 'SOLVER_ERROR' });
  } finally {
    activeRequestManager.release(requestId);
  }
});

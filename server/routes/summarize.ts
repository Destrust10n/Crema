import { Router, Request, Response } from 'express';
import { getGeminiClient, recordQuotaError, GeminiServiceError } from '../gemini.js';
import { SummaryResponseSchema } from '../schemas.js';
import { activeRequestManager } from '../activeRequests.js';
import { CONFIG } from '../config.js';

export const summarizeRouter = Router();

/**
 * POST /api/summarize
 * Summarizes text notes, uploaded documents (PDF/TXT), images, or Google Drive items.
 */
summarizeRouter.post('/', async (req: Request, res: Response) => {
  const {
    content,
    fileData,
    length = 'detailed',
    focus,
    requestId = `sum_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  } = req.body;

  if (!content && !fileData) {
    res.status(400).json({ error: 'Either text content or fileData must be provided.', code: 'MISSING_CONTENT' });
    return;
  }

  if (!activeRequestManager.acquire(requestId)) {
    res.status(409).json({ error: 'Summarization request already in flight.', code: 'DUPLICATE_REQUEST' });
    return;
  }

  try {
    const ai = getGeminiClient();

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (fileData && fileData.base64 && fileData.mimeType) {
      // Validate MIME type
      const allowedMimes = [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'text/csv',
        'image/png',
        'image/jpeg',
        'image/webp',
      ];
      if (!allowedMimes.includes(fileData.mimeType.toLowerCase())) {
        res.status(400).json({
          error: `Unsupported file type: ${fileData.mimeType}. Supported types: PDF, Text, Markdown, CSV, PNG, JPG, WEBP.`,
          code: 'UNSUPPORTED_MIME',
        });
        return;
      }

      // If text/markdown, pass as text part, else inlineData
      if (fileData.mimeType.startsWith('text/')) {
        const decoded = Buffer.from(fileData.base64, 'base64').toString('utf-8');
        parts.push({ text: `Document Name: ${fileData.name || 'Document'}\nContent:\n${decoded.slice(0, 50000)}` });
      } else {
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.base64,
          },
        });
      }
    }

    if (content) {
      parts.push({ text: `Study Content to summarize:\n${content.slice(0, 50000)}` });
    }

    const instruction = `You are Crema Summarizer. Create an educational, high-yield summary.
Summary style: ${length} (options: brief, detailed, bullet_points).
${focus ? `Focus specifically on: ${focus}` : ''}

Output strictly valid JSON with:
- title: concise descriptive title
- summary: comprehensive and coherent summary
- keyTakeaways: array of 4-8 bullet points of high-yield exam facts
- glossary: array of key terminology { term: string, definition: string }`;

    parts.push({ text: instruction });

    const response = await ai.models.generateContent({
      model: CONFIG.GEMINI_MODEL_FAST,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: 'Output valid JSON matching the summary schema. Do not wrap in markdown.',
        responseMimeType: 'application/json',
      },
    });

    const raw = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      // Single repair
      const repair = await ai.models.generateContent({
        model: CONFIG.GEMINI_MODEL_FAST,
        contents: [{ role: 'user', parts: [{ text: `Repair this into valid JSON:\n${raw.slice(0, 4000)}` }] }],
        config: { responseMimeType: 'application/json' },
      });
      parsedJson = JSON.parse((repair.text || '').replace(/```json/g, '').replace(/```/g, '').trim());
    }

    const validated = SummaryResponseSchema.parse(parsedJson);
    res.json({ success: true, summary: validated });
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
    res.status(500).json({ error: msg || 'Summarization failed.', code: 'SUMMARIZE_ERROR' });
  } finally {
    activeRequestManager.release(requestId);
  }
});

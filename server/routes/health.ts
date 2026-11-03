import { Router, Request, Response } from 'express';
import { CONFIG, isGeminiConfigured } from '../config.js';
import { activeRequestManager } from '../activeRequests.js';

export const healthRouter = Router();

/**
 * GET /api/health
 * System diagnostics and configuration health
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  const configured = isGeminiConfigured();

  res.json({
    status: configured ? 'healthy' : 'degraded',
    app: 'Crema - AI Study Buddy',
    geminiConfigured: configured,
    activeRequests: activeRequestManager.getActiveCount(),
    models: {
      fast: CONFIG.GEMINI_MODEL_FAST,
      deep: CONFIG.GEMINI_MODEL_DEEP,
    },
    googleFormsConfigured: !!CONFIG.GOOGLE_FORMS_EXAMS_CSV_URL,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

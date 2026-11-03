import { Router, Request, Response } from 'express';
import { CONFIG } from '../config.js';
import { activeRequestManager } from '../activeRequests.js';
import {
  getGeminiClient,
  normalizeHistory,
  recordQuotaError,
  GeminiServiceError,
} from '../gemini.js';

export const chatRouter = Router();

/**
 * POST /api/chat/stream
 * Real-time SSE streaming study-buddy chat
 */
chatRouter.post('/stream', async (req: Request, res: Response) => {
  const prompt = (req.body.prompt || req.body.message || '').toString();
  const {
    history = [],
    systemInstruction,
    model = CONFIG.GEMINI_MODEL_FAST,
    conversationId,
    requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Prompt or message is required and must be non-empty.', code: 'INVALID_PROMPT' });
    return;
  }

  // Rule 3: Reject duplicate ID only while the first is still running
  if (!activeRequestManager.acquire(requestId)) {
    res.status(409).json({
      error: `Request with ID "${requestId}" is already currently active.`,
      code: 'DUPLICATE_ACTIVE_REQUEST',
    });
    return;
  }

  // Setup Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  let firstTokenReceived = false;
  let isAborted = false;
  const abortController = new AbortController();

  // Rule 4: Detect disconnect with res.on('close') and !res.writableFinished
  res.on('close', () => {
    if (!res.writableFinished) {
      isAborted = true;
      abortController.abort();
    }
    activeRequestManager.release(requestId);
  });

  // Rule 5: 15s first-token timeout, 60s total timeout
  const firstTokenTimer = setTimeout(() => {
    if (!firstTokenReceived && !isAborted && !res.writableFinished) {
      isAborted = true;
      abortController.abort();
      res.write(`data: ${JSON.stringify({ error: 'First token timeout exceeded (15s)', code: 'FIRST_TOKEN_TIMEOUT' })}\n\n`);
      res.end();
    }
  }, CONFIG.FIRST_TOKEN_TIMEOUT_MS);

  const totalRequestTimer = setTimeout(() => {
    if (!isAborted && !res.writableFinished) {
      isAborted = true;
      abortController.abort();
      res.write(`data: ${JSON.stringify({ error: 'Total request timeout exceeded (60s)', code: 'TOTAL_TIMEOUT' })}\n\n`);
      res.end();
    }
  }, CONFIG.TOTAL_REQUEST_TIMEOUT_MS);

  try {
    const ai = getGeminiClient();

    // Rule 2: Gemini roles are "user" and "model". Merge same-role neighbors, drop empties, drop duplicate trailing
    const normalizedContents = normalizeHistory(history, prompt);
    normalizedContents.push({
      role: 'user',
      parts: [{ text: prompt.trim() }],
    });

    const defaultSysInstruction =
      'You are Crema, an elite, patient, and encouraging AI study buddy. Break down complex concepts simply, explain step-by-step, test student comprehension, and provide actionable tips.';

    const responseStream = await ai.models.generateContentStream({
      model: model || CONFIG.GEMINI_MODEL_FAST,
      contents: normalizedContents,
      config: {
        systemInstruction: systemInstruction ? `${defaultSysInstruction}\n\n${systemInstruction}` : defaultSysInstruction,
      },
    });

    // Send initial metadata event
    res.write(`data: ${JSON.stringify({ type: 'metadata', model, requestId, conversationId })}\n\n`);

    for await (const chunk of responseStream) {
      if (isAborted || res.writableFinished) break;

      const chunkText = chunk.text || '';
      if (chunkText) {
        if (!firstTokenReceived) {
          firstTokenReceived = true;
          clearTimeout(firstTokenTimer);
        }
        res.write(`data: ${JSON.stringify({ chunk: chunkText, text: chunkText, model, requestId, conversationId, done: false })}\n\n`);
      }
    }

    if (!isAborted && !res.writableFinished) {
      res.write(`data: ${JSON.stringify({ done: true, requestId, conversationId })}\n\n`);
      res.end();
    }
  } catch (err) {
    if (isAborted) return; // Client abort is not a failure

    const message = (err as Error).message || '';
    if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
      const cooldown = recordQuotaError();
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Rate limit/quota exceeded', code: 'RATE_LIMITED', retryAfterSeconds: cooldown, requestId, conversationId })}\n\n`);
    } else if (err instanceof GeminiServiceError) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message, code: err.code, retryAfterSeconds: err.retryAfterSeconds, requestId, conversationId })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: `Streaming failed: ${message}`, code: 'STREAM_ERROR', requestId, conversationId })}\n\n`);
    }
    res.end();
  } finally {
    clearTimeout(firstTokenTimer);
    clearTimeout(totalRequestTimer);
    activeRequestManager.release(requestId);
  }
});

/**
 * POST /api/chat/title
 * Generates a crisp 3-5 word study session title
 */
chatRouter.post('/title', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    res.json({ title: 'New Study Session' });
    return;
  }

  const clean = prompt.trim().replace(/[#*`_]/g, '');
  const words = clean.split(/\s+/).slice(0, 5);
  let title = words.join(' ');
  if (title.length > 32) {
    title = title.slice(0, 32) + '...';
  }
  res.json({ title: title || 'New Study Session' });
});

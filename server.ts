import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';

import { CONFIG } from './server/config.js';
import { authenticate } from './server/auth.js';
import { chatRouter } from './server/routes/chat.js';
import { quizRouter } from './server/routes/quiz.js';
import { summarizeRouter } from './server/routes/summarize.js';
import { solveRouter } from './server/routes/solve.js';
import { plannerRouter } from './server/routes/planner.js';
import { examsRouter } from './server/routes/exams.js';
import { authRouter } from './server/routes/auth.js';
import { healthRouter } from './server/routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security: Helmet HTTP Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Vite development and inline module loading friendly
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: Same-origin in production, lenient for dev preview
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);
      // In dev or on AI Studio domains, allow
      return callback(null, true);
    },
    credentials: true,
  })
);

// 25 MB payload limits for photo solving, PDF uploads, and large summaries
app.use(express.json({ limit: CONFIG.MAX_BODY_SIZE }));
app.use(express.urlencoded({ limit: CONFIG.MAX_BODY_SIZE, extended: true }));

// Per-IP Rate Limiting
const apiLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
  max: CONFIG.RATE_LIMIT_MAX_PER_IP,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please wait a few minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use('/api/', apiLimiter);

import { gateway } from './server/gateway.js';
import { ProviderId } from './server/types.js';

// Public Routes (no authentication required)
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Provider Catalog & Diagnostics Routes (Used by ApiManagementModal)
app.get('/api/providers', async (req, res) => {
  try {
    const customKeysHeader = req.headers['x-custom-keys'];
    let customKeys: Partial<Record<ProviderId, string>> = {};
    if (typeof customKeysHeader === 'string') {
      try {
        customKeys = JSON.parse(customKeysHeader);
      } catch {}
    }
    const catalog = await gateway.getCatalog(customKeys);
    res.json({ success: true, providers: catalog });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/providers/test', async (req, res) => {
  try {
    const { providerId, customKey, customEndpoint, model } = req.body;
    if (!providerId) return res.status(400).json({ error: 'providerId is required' });
    const result = await gateway.testProvider(providerId as ProviderId, customKey, customEndpoint, model);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/providers/telemetry', (_req, res) => {
  res.json({ success: true, events: gateway.getTelemetry() });
});

app.get('/api/providers/gemini/models', (_req, res) => {
  res.json({ success: true, models: gateway.getModelLatencyProfiles() });
});

app.get('/api/gateway/cache', (_req, res) => {
  res.json({ success: true, cache: gateway.getCacheStats() });
});

app.post('/api/gateway/cache/clear', (_req, res) => {
  gateway.clearCache();
  res.json({ success: true, message: 'Gateway cache purged successfully.', cache: gateway.getCacheStats() });
});

app.post('/api/gateway/benchmark', async (req, res) => {
  try {
    const { customKeys } = req.body || {};
    const report = await gateway.runBenchmarkSuite(customKeys);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Protected AI Routes (Firebase Auth ID Token or Crema Guest Token required)
app.use('/api/chat', authenticate, chatRouter);
app.use('/api/quiz', authenticate, quizRouter);
app.use('/api/summarize', authenticate, summarizeRouter);
app.use('/api/solve', authenticate, solveRouter);
app.use('/api/planner', authenticate, plannerRouter);
app.use('/api/exams', authenticate, examsRouter);

// Central Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  });
});

// Start Server: Vite middleware in dev (hmr: false), static dist in production
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`[Crema] Backend server running on http://0.0.0.0:${CONFIG.PORT}`);
    console.log(`[Crema] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error('[Crema] Server failed to start:', err);
  process.exit(1);
});

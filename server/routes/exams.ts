import { Router, Request, Response } from 'express';
import { CONFIG } from '../config.js';
import { generateStructuredOutput, GeminiServiceError } from '../gemini.js';
import { ExamsListResponseSchema } from '../schemas.js';

export const examsRouter = Router();

/**
 * Parses simple CSV rows into records
 */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.replace(/^["']|["']$/g, '').trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    records.push(row);
  }
  return records;
}

/**
 * POST /api/exams/import
 * Imports exam dates, topics, and syllabus from Google Forms published CSV response sheet or raw CSV
 */
examsRouter.post('/import', async (req: Request, res: Response) => {
  const { csvContent } = req.body;
  const configuredUrl = CONFIG.GOOGLE_FORMS_EXAMS_CSV_URL;

  // If neither CSV content nor configured URL exists, return graceful unavailable status (no crash)
  if (!csvContent && (!configuredUrl || configuredUrl.trim() === '')) {
    res.json({
      success: true,
      available: false,
      message: 'Google Forms exam sync is not configured. Set GOOGLE_FORMS_EXAMS_CSV_URL in .env or provide CSV content.',
      exams: [],
    });
    return;
  }

  let rawCsv = csvContent || '';

  if (!rawCsv && configuredUrl) {
    try {
      const response = await fetch(configuredUrl);
      if (!response.ok) {
        res.status(502).json({
          success: false,
          error: `Failed to fetch CSV from Google Forms URL: HTTP ${response.status}`,
          code: 'FETCH_CSV_FAILED',
        });
        return;
      }
      rawCsv = await response.text();
    } catch (err) {
      res.status(502).json({
        success: false,
        error: `Network error connecting to Google Forms CSV URL: ${(err as Error).message}`,
        code: 'NETWORK_CSV_FAILED',
      });
      return;
    }
  }

  try {
    const records = parseCsv(rawCsv);

    if (records.length === 0 && rawCsv.trim()) {
      // Parse with Gemini if headers are irregular or non-standard
      const prompt = `Extract all exams, test dates, and syllabus topics from this raw CSV data:
${rawCsv.slice(0, 8000)}

Output valid JSON matching ExamsListResponseSchema with array of:
- id: unique string e.g. "exam_1"
- title: course or exam title
- date: date string (e.g. YYYY-MM-DD or readable format)
- syllabus: main topics covered
- source: "Google Forms CSV"`;

      const parsed = await generateStructuredOutput(
        prompt,
        ExamsListResponseSchema,
        'Extract exam schedules accurately from user spreadsheet data.',
        CONFIG.GEMINI_MODEL_FAST
      );

      res.json({ success: true, available: true, exams: parsed.exams });
      return;
    }

    // Direct mapping from standard fields
    const exams = records.map((r, index) => {
      const keys = Object.keys(r);
      const titleKey = keys.find((k) => /exam|subject|course|title|name/i.test(k)) || keys[0];
      const dateKey = keys.find((k) => /date|time|deadline|when/i.test(k)) || keys[1] || '';
      const syllabusKey = keys.find((k) => /syllabus|topic|portion|chapters|notes/i.test(k)) || keys[2] || '';

      return {
        id: `exam_${index + 1}_${Date.now()}`,
        title: r[titleKey] || `Exam ${index + 1}`,
        date: r[dateKey] || 'TBD',
        syllabus: r[syllabusKey] || 'General syllabus',
        source: 'Google Forms CSV',
      };
    });

    res.json({
      success: true,
      available: true,
      exams,
    });
  } catch (err) {
    if (err instanceof GeminiServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code, retryAfterSeconds: err.retryAfterSeconds });
      return;
    }
    res.status(500).json({ error: (err as Error).message || 'Failed to parse exams.', code: 'EXAMS_PARSE_ERROR' });
  }
});

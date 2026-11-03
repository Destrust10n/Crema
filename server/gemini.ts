import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { CONFIG, isGeminiConfigured } from './config.js';

// Cooldown state for 429/quota errors
let quotaCooldownUntil = 0;

export interface NormalizedMessage {
  role: 'user' | 'model';
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

export class GeminiServiceError extends Error {
  public statusCode: number;
  public code: string;
  public retryAfterSeconds?: number;

  constructor(message: string, statusCode = 500, code = 'GEMINI_ERROR', retryAfterSeconds?: number) {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Initializes and returns a GoogleGenAI client using the server-side GEMINI_API_KEY.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!isGeminiConfigured()) {
    throw new GeminiServiceError(
      'Gemini API is not configured on the server. Please configure GEMINI_API_KEY.',
      503,
      'NOT_CONFIGURED'
    );
  }

  // Check 429 quota cooldown
  const now = Date.now();
  if (now < quotaCooldownUntil) {
    const remainingSeconds = Math.ceil((quotaCooldownUntil - now) / 1000);
    throw new GeminiServiceError(
      `Gemini quota limit exceeded. Cooldown active.`,
      429,
      'RATE_LIMITED',
      remainingSeconds
    );
  }

  return new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
}

/**
 * Records a 429/quota error to enforce the mandatory 15-second cooldown.
 */
export function recordQuotaError(): number {
  quotaCooldownUntil = Date.now() + CONFIG.QUOTA_COOLDOWN_SECONDS * 1000;
  return CONFIG.QUOTA_COOLDOWN_SECONDS;
}

/**
 * Normalizes chat message history according to Rule 2:
 * - Gemini roles must be "user" or "model" (convert "assistant" -> "model")
 * - Instructions go in systemInstruction, not in history
 * - Merge same-role neighbors
 * - Drop empty messages
 * - Drop a trailing history item that equals the new user message
 */
export function normalizeHistory(
  rawHistory: Array<{ role: string; content?: string; text?: string }>,
  newPrompt?: string
): NormalizedMessage[] {
  if (!rawHistory || !Array.isArray(rawHistory)) {
    return [];
  }

  const cleaned: Array<{ role: 'user' | 'model'; text: string }> = [];

  for (const item of rawHistory) {
    const rawRole = (item.role || '').toLowerCase();
    const role: 'user' | 'model' = rawRole === 'assistant' || rawRole === 'model' ? 'model' : 'user';
    const text = (item.text || item.content || '').trim();

    // Drop empty messages
    if (!text) continue;

    // Merge same-role neighbors
    if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === role) {
      cleaned[cleaned.length - 1].text += `\n\n${text}`;
    } else {
      cleaned.push({ role, text });
    }
  }

  // Drop a trailing history item that equals the new message
  if (newPrompt && cleaned.length > 0) {
    const lastItem = cleaned[cleaned.length - 1];
    if (lastItem.role === 'user' && lastItem.text.trim() === newPrompt.trim()) {
      cleaned.pop();
    }
  }

  return cleaned.map((item) => ({
    role: item.role,
    parts: [{ text: item.text }],
  }));
}

/**
 * Rule 8: Generates structured output using Gemini JSON mode and validates with Zod.
 * If JSON parsing or Zod validation fails, repairs once with Gemini before returning an error.
 */
export async function generateStructuredOutput<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  systemInstruction?: string,
  modelName: string = CONFIG.GEMINI_MODEL_FAST
): Promise<T> {
  const ai = getGeminiClient();

  const primaryInstruction = `${systemInstruction ? systemInstruction + '\n\n' : ''}You must reply strictly in valid JSON format matching the schema. Do not wrap in markdown or backticks.`;

  let rawText = '';
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: primaryInstruction,
        responseMimeType: 'application/json',
      },
    });

    rawText = response.text || '';
  } catch (err) {
    const message = (err as Error).message || '';
    if (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
      const cooldown = recordQuotaError();
      throw new GeminiServiceError('Gemini API quota exceeded. Please wait.', 429, 'RATE_LIMITED', cooldown);
    }
    throw new GeminiServiceError(`Gemini generation failed: ${message}`, 502, 'GEMINI_UPSTREAM_ERROR');
  }

  // First validation attempt
  try {
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return schema.parse(parsed);
  } catch (firstError) {
    console.warn('Initial structured output parsing failed, attempting repair pass:', (firstError as Error).message);

    // Repair pass (Rule 8: repair once)
    try {
      const repairPrompt = `The previous JSON output was invalid or failed validation:
Error: ${(firstError as Error).message}
Original Output:
${rawText.slice(0, 4000)}

Fix all issues and output ONLY the valid JSON:`;

      const repairResponse = await ai.models.generateContent({
        model: CONFIG.GEMINI_MODEL_FAST,
        contents: [{ role: 'user', parts: [{ text: repairPrompt }] }],
        config: {
          systemInstruction: 'You are a JSON repair specialist. Output only raw valid JSON without markdown.',
          responseMimeType: 'application/json',
        },
      });

      const repairedRaw = (repairResponse.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const repairedParsed = JSON.parse(repairedRaw);
      return schema.parse(repairedParsed);
    } catch (repairError) {
      throw new GeminiServiceError(
        `Failed to generate valid structured data: ${(repairError as Error).message}`,
        500,
        'SCHEMA_VALIDATION_FAILED'
      );
    }
  }
}

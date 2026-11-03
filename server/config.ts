import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL_FAST: process.env.GEMINI_MODEL_FAST && process.env.GEMINI_MODEL_FAST !== 'gemini-2.5-flash'
    ? process.env.GEMINI_MODEL_FAST
    : 'gemini-3.8-flash',
  GEMINI_MODEL_DEEP: process.env.GEMINI_MODEL_DEEP && process.env.GEMINI_MODEL_DEEP !== 'gemini-2.5-pro'
    ? process.env.GEMINI_MODEL_DEEP
    : 'gemini-3.8-flash',
  GUEST_JWT_SECRET: process.env.GUEST_JWT_SECRET || 'crema-secret-jwt-key-study-buddy-2026',
  GOOGLE_FORMS_EXAMS_CSV_URL: process.env.GOOGLE_FORMS_EXAMS_CSV_URL || '',
  // Rate Limits
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_PER_IP: 200, // Standard API rate limit
  RATE_LIMIT_GUEST_MAX: 50, // Stricter guest rate limit
  FIRST_TOKEN_TIMEOUT_MS: 15000, // 15 seconds
  TOTAL_REQUEST_TIMEOUT_MS: 60000, // 60 seconds
  QUOTA_COOLDOWN_SECONDS: 15,
  MAX_BODY_SIZE: '25mb',
};

export function isGeminiConfigured(): boolean {
  return !!CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY.trim() !== '' && CONFIG.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
}

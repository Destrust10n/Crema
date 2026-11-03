/**
 * Crema API Client Service
 * Connects the frontend to all backend AI study-buddy routes.
 * Supports Firebase ID tokens and Guest session JWTs.
 */

import { auth } from '../lib/firebase';
import { SITE_CONFIG } from '../config/site';

let cachedGuestToken: string | null = null;

export async function getAuthHeader(): Promise<Record<string, string>> {
  // 1. Check if user is signed in with Firebase
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      return { Authorization: `Bearer ${idToken}` };
    } catch {
      // Token fetch failed, try guest
    }
  }

  // 2. Check local guest token
  if (!cachedGuestToken) {
    try {
      cachedGuestToken = localStorage.getItem(SITE_CONFIG.storageKeyGuestToken);
    } catch {
      // LocalStorage inaccessible
    }
  }

  // 3. If no guest token, create one
  if (!cachedGuestToken) {
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        cachedGuestToken = data.token;
        if (cachedGuestToken) {
          localStorage.setItem(SITE_CONFIG.storageKeyGuestToken, cachedGuestToken);
        }
      }
    } catch (err) {
      console.warn('Failed to generate guest token:', err);
    }
  }

  return cachedGuestToken ? { Authorization: `Bearer ${cachedGuestToken}` } : {};
}

export interface StreamChatOptions {
  prompt: string;
  history?: Array<{ role: string; content?: string; text?: string }>;
  systemInstruction?: string;
  model?: string;
  requestId?: string;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (error: string, retryAfterSeconds?: number) => void;
}

/**
 * Streams chat response via Server-Sent Events (SSE)
 */
export async function streamStudyChat(options: StreamChatOptions): Promise<void> {
  const { prompt, history = [], systemInstruction, model, requestId, signal, onChunk, onDone, onError } = options;

  try {
    const authHeaders = await getAuthHeader();
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        prompt,
        history,
        systemInstruction,
        model,
        requestId,
      }),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      onError(errJson.error || `Server returned ${response.status}`, errJson.retryAfterSeconds);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('Readable stream not supported.');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.slice(5).trim();
        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            onError(parsed.error, parsed.retryAfterSeconds);
            return;
          }
          if (parsed.chunk) {
            onChunk(parsed.chunk);
          }
          if (parsed.done) {
            onDone();
            return;
          }
        } catch {
          // Incomplete chunk
        }
      }
    }

    onDone();
  } catch (err) {
    if (signal?.aborted) return;
    onError((err as Error).message || 'Connection error.');
  }
}

/**
 * Synthesizes a fast 3-5 word dialogue title
 */
export async function fetchTitle(prompt: string): Promise<string> {
  try {
    const res = await fetch('/api/chat/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.title || 'Study Session';
  } catch {
    return 'Study Session';
  }
}

/**
 * Generates an interactive multi-question quiz
 */
export async function generateQuizApi(payload: {
  topic: string;
  questionCount?: number;
  difficulty?: string;
  questionTypes?: string[];
  contextText?: string;
}) {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/quiz/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate quiz');
  }
  return data.quiz;
}

/**
 * Grades student quiz answers
 */
export async function gradeQuizApi(payload: { quiz: any; userAnswers: Record<string, string> }) {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/quiz/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to grade quiz');
  }
  return data.result;
}

/**
 * Summarizes text notes or documents
 */
export async function summarizeApi(payload: {
  content?: string;
  fileData?: { base64: string; mimeType: string; name?: string };
  length?: string;
  focus?: string;
}) {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to summarize content');
  }
  return data.summary;
}

/**
 * Solves a homework or exam problem from an image
 */
export async function solveQuestionApi(payload: {
  imageBase64: string;
  mimeType: string;
  additionalNotes?: string;
}) {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/solve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to solve question');
  }
  return data.solution;
}

/**
 * Generates an adaptive study planner schedule
 */
export async function generateStudyPlanApi(payload: {
  targetExam: string;
  examDate?: string;
  hoursPerDay?: number;
  focusAreas?: string[];
  commitments?: string;
}) {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/planner/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate study plan');
  }
  return data.plan;
}

/**
 * Reschedules a study plan after missed or completed tasks
 */
export async function rescheduleStudyPlanApi(payload: {
  currentPlan: any;
  completedTasks?: string[];
  missedTasks?: string[];
  remainingDays?: number;
  adjustmentReason?: string;
}) {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/planner/reschedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to reschedule study plan');
  }
  return data.plan;
}

/**
 * Imports exam schedules from Google Forms published CSV or raw CSV string
 */
export async function importExamsApi(csvContent?: string) {
  const authHeaders = await getAuthHeader();
  const res = await fetch('/api/exams/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ csvContent }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to import exams');
  }
  return data;
}

/**
 * System Health & Config Check
 */
export async function checkHealthApi() {
  const res = await fetch('/api/health');
  return res.json();
}

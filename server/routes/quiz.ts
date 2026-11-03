import { Router, Request, Response } from 'express';
import { generateStructuredOutput, GeminiServiceError } from '../gemini.js';
import { QuizGenerateResponseSchema, QuizGradeResponseSchema } from '../schemas.js';
import { activeRequestManager } from '../activeRequests.js';
import { CONFIG } from '../config.js';

export const quizRouter = Router();

/**
 * POST /api/quiz/generate
 * Generates an interactive multi-format study quiz
 */
quizRouter.post('/generate', async (req: Request, res: Response) => {
  const {
    topic,
    questionCount = 5,
    difficulty = 'intermediate',
    questionTypes = ['multiple_choice', 'true_false', 'fill_in_the_blank', 'short_answer'],
    contextText,
    requestId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  } = req.body;

  if (!topic || typeof topic !== 'string') {
    res.status(400).json({ error: 'Topic is required and must be a string.', code: 'INVALID_TOPIC' });
    return;
  }

  if (!activeRequestManager.acquire(requestId)) {
    res.status(409).json({ error: 'Quiz generation request already in flight.', code: 'DUPLICATE_REQUEST' });
    return;
  }

  try {
    const prompt = `Create a ${difficulty} quiz about: "${topic.trim()}" with ${questionCount} questions.
Allowed question types: ${Array.isArray(questionTypes) ? questionTypes.join(', ') : 'multiple_choice, true_false'}.
${contextText ? `Based on this study material:\n${contextText.slice(0, 5000)}\n` : ''}

Format requirement:
Return a JSON object with:
- topic: "${topic.trim()}"
- questions: array of questions, where each question has:
  - id: unique string e.g. "q1", "q2"
  - type: one of "multiple_choice", "true_false", "fill_in_the_blank", "short_answer"
  - question: clear question text
  - options: array of 4 choices for multiple_choice, or ["True", "False"] for true_false, or omit/empty for short_answer
  - correctAnswer: the correct answer string (must match one option for multiple choice)
  - explanation: concise explanation of why the answer is correct`;

    const quiz = await generateStructuredOutput(
      prompt,
      QuizGenerateResponseSchema,
      'You are Crema Quiz Master. Generate rigorous, educational questions testing deep understanding.',
      CONFIG.GEMINI_MODEL_FAST
    );

    res.json({ success: true, quiz });
  } catch (err) {
    if (err instanceof GeminiServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code, retryAfterSeconds: err.retryAfterSeconds });
      return;
    }
    res.status(500).json({ error: (err as Error).message || 'Failed to generate quiz.', code: 'QUIZ_GEN_ERROR' });
  } finally {
    activeRequestManager.release(requestId);
  }
});

/**
 * POST /api/quiz/grade
 * Grades user quiz responses with constructive feedback
 */
quizRouter.post('/grade', async (req: Request, res: Response) => {
  const {
    quiz,
    userAnswers,
    requestId = `grade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  } = req.body;

  if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) {
    res.status(400).json({ error: 'Valid quiz structure is required.', code: 'INVALID_QUIZ' });
    return;
  }

  if (!userAnswers || typeof userAnswers !== 'object') {
    res.status(400).json({ error: 'User answers map is required.', code: 'INVALID_ANSWERS' });
    return;
  }

  if (!activeRequestManager.acquire(requestId)) {
    res.status(409).json({ error: 'Quiz grading request already in flight.', code: 'DUPLICATE_REQUEST' });
    return;
  }

  try {
    const prompt = `Grade this student's quiz answers:
Quiz topic: ${quiz.topic}
Questions and correct answers:
${JSON.stringify(quiz.questions, null, 2)}

Student's submitted answers:
${JSON.stringify(userAnswers, null, 2)}

Provide grading JSON with:
- score: total correct answers (number)
- total: total number of questions (number)
- percentage: round(score / total * 100)
- feedback: 2-3 encouraging sentences with review advice
- questionReviews: array of objects for EACH question:
  - questionId: string
  - isCorrect: boolean
  - userAnswer: student's answer
  - correctAnswer: standard correct answer
  - explanation: brief explanation`;

    const gradeResult = await generateStructuredOutput(
      prompt,
      QuizGradeResponseSchema,
      'You are Crema Examiner. Grade accurately, offering partial credit or semantic acceptance for fill-in-the-blank and short answers.',
      CONFIG.GEMINI_MODEL_FAST
    );

    res.json({ success: true, result: gradeResult });
  } catch (err) {
    if (err instanceof GeminiServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code, retryAfterSeconds: err.retryAfterSeconds });
      return;
    }
    res.status(500).json({ error: (err as Error).message || 'Failed to grade quiz.', code: 'QUIZ_GRADE_ERROR' });
  } finally {
    activeRequestManager.release(requestId);
  }
});

import { Router, Request, Response } from 'express';
import { generateStructuredOutput, GeminiServiceError } from '../gemini.js';
import { StudyPlanResponseSchema } from '../schemas.js';
import { activeRequestManager } from '../activeRequests.js';
import { CONFIG } from '../config.js';

export const plannerRouter = Router();

/**
 * POST /api/planner/generate
 * Creates an optimal personalized study schedule tailored to exam timeline and daily hours
 */
plannerRouter.post('/generate', async (req: Request, res: Response) => {
  const {
    targetExam,
    examDate,
    hoursPerDay = 3,
    focusAreas = [],
    commitments = '',
    requestId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  } = req.body;

  if (!targetExam || typeof targetExam !== 'string') {
    res.status(400).json({ error: 'targetExam string is required.', code: 'MISSING_EXAM_NAME' });
    return;
  }

  if (!activeRequestManager.acquire(requestId)) {
    res.status(409).json({ error: 'Planner request already in flight.', code: 'DUPLICATE_REQUEST' });
    return;
  }

  try {
    const prompt = `Create a realistic study plan for: "${targetExam}"
Target Exam Date / Horizon: ${examDate || '4 weeks from today'}
Daily Commitment: ${hoursPerDay} hours/day
Priority Focus Areas: ${Array.isArray(focusAreas) ? focusAreas.join(', ') : focusAreas}
Known Constraints/Commitments: ${commitments || 'Standard schedule'}

Return a structured JSON study plan with:
- targetExam: "${targetExam}"
- totalDays: integer days
- dailyCommitmentHours: ${hoursPerDay}
- weeklyPlan: array of weeks, each containing:
  - weekNumber: number
  - focus: weekly theme/goal
  - dailyTasks: array of days (Monday through Sunday) with day: string, tasks: string[] (3-5 specific actionable topics), estimatedHours: number
- revisionMilestones: array of milestones with dateOrDay: string, milestone: string`;

    const plan = await generateStructuredOutput(
      prompt,
      StudyPlanResponseSchema,
      'You are Crema Study Planner. Build sustainable, scientifically proven spaced-repetition study blocks.',
      CONFIG.GEMINI_MODEL_FAST
    );

    res.json({ success: true, plan });
  } catch (err) {
    if (err instanceof GeminiServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code, retryAfterSeconds: err.retryAfterSeconds });
      return;
    }
    res.status(500).json({ error: (err as Error).message || 'Failed to generate plan.', code: 'PLANNER_ERROR' });
  } finally {
    activeRequestManager.release(requestId);
  }
});

/**
 * POST /api/planner/reschedule
 * Dynamically reallocates missed tasks across remaining days to prevent burnout
 */
plannerRouter.post('/reschedule', async (req: Request, res: Response) => {
  const {
    currentPlan,
    completedTasks = [],
    missedTasks = [],
    remainingDays,
    adjustmentReason = 'Catch up on missed topics',
    requestId = `resched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  } = req.body;

  if (!currentPlan) {
    res.status(400).json({ error: 'currentPlan object is required.', code: 'MISSING_PLAN' });
    return;
  }

  if (!activeRequestManager.acquire(requestId)) {
    res.status(409).json({ error: 'Reschedule request already in flight.', code: 'DUPLICATE_REQUEST' });
    return;
  }

  try {
    const prompt = `Reschedule this study plan:
Current Plan:
${JSON.stringify(currentPlan, null, 2)}

Completed Tasks:
${JSON.stringify(completedTasks, null, 2)}

Missed Tasks that need catching up:
${JSON.stringify(missedTasks, null, 2)}

Remaining days: ${remainingDays || currentPlan.totalDays || 14}
Reason: ${adjustmentReason}

Redistribute the missed tasks into the remaining days without overwhelming the student. Maintain a healthy pace.
Return the updated JSON matching StudyPlanResponseSchema.`;

    const updatedPlan = await generateStructuredOutput(
      prompt,
      StudyPlanResponseSchema,
      'You are Crema Adaptive Planner. Seamlessly redistribute workload to keep student on track.',
      CONFIG.GEMINI_MODEL_FAST
    );

    res.json({ success: true, plan: updatedPlan });
  } catch (err) {
    if (err instanceof GeminiServiceError) {
      res.status(err.statusCode).json({ error: err.message, code: err.code, retryAfterSeconds: err.retryAfterSeconds });
      return;
    }
    res.status(500).json({ error: (err as Error).message || 'Failed to reschedule plan.', code: 'RESCHEDULE_ERROR' });
  } finally {
    activeRequestManager.release(requestId);
  }
});

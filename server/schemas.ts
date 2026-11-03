import { z } from 'zod';

// Quiz Schemas
export const QuestionTypeSchema = z.enum([
  'multiple_choice',
  'true_false',
  'fill_in_the_blank',
  'short_answer',
]);

export const QuizQuestionSchema = z.object({
  id: z.string(),
  type: QuestionTypeSchema,
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string(),
});

export const QuizGenerateResponseSchema = z.object({
  topic: z.string(),
  questions: z.array(QuizQuestionSchema).min(1),
});

export const QuizGradeResponseSchema = z.object({
  score: z.number(),
  total: z.number(),
  percentage: z.number(),
  feedback: z.string(),
  questionReviews: z.array(
    z.object({
      questionId: z.string(),
      isCorrect: z.boolean(),
      userAnswer: z.string(),
      correctAnswer: z.string(),
      explanation: z.string(),
    })
  ),
});

// Summary Schemas
export const SummaryResponseSchema = z.object({
  title: z.string(),
  summary: z.string().min(1),
  keyTakeaways: z.array(z.string()).min(1),
  glossary: z
    .array(
      z.object({
        term: z.string(),
        definition: z.string(),
      })
    )
    .optional(),
});

// Solver Schemas
export const SolverResponseSchema = z.object({
  isQuestion: z.boolean(),
  isBlurry: z.boolean().optional(),
  clarification: z.string().optional(),
  message: z.string().optional(),
  questionText: z.string().optional(),
  stepByStep: z.array(z.string()).optional(),
  finalAnswer: z.string().optional(),
  tips: z.array(z.string()).optional(),
});

// Planner Schemas
export const PlannerTaskSchema = z.object({
  day: z.string(),
  tasks: z.array(z.string()),
  estimatedHours: z.number(),
});

export const PlannerWeekSchema = z.object({
  weekNumber: z.number(),
  focus: z.string(),
  dailyTasks: z.array(PlannerTaskSchema),
});

export const StudyPlanResponseSchema = z.object({
  targetExam: z.string(),
  totalDays: z.number(),
  dailyCommitmentHours: z.number(),
  weeklyPlan: z.array(PlannerWeekSchema),
  revisionMilestones: z.array(
    z.object({
      dateOrDay: z.string(),
      milestone: z.string(),
    })
  ),
});

// Exams Schema
export const ExamItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  syllabus: z.string(),
  source: z.string().optional(),
});

export const ExamsListResponseSchema = z.object({
  exams: z.array(ExamItemSchema),
});

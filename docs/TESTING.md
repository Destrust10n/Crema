# Crema End-to-End Quality Gate & Testing Checklist

This checklist verifies all backend rules, reliability guarantees, and frontend integrations.

---

## 1. Chat Continuity & Reliability
- [x] **8 Consecutive Messages**: Send 8 messages in a single dialogue. Verify that turn 8 responds with equal depth and context as turn 1, without duplicated turns or orphaned messages.
- [x] **Stop & Immediate Re-send**: While an SSE response is streaming, click **Stop** (square icon), and immediately submit another query. Verify that the previous request aborts cleanly, the request ID lock releases, and no circuit breakers trip.
- [x] **Missing API Key State**: When `GEMINI_API_KEY` is empty, API returns `503` with code `NOT_CONFIGURED`.
- [x] **429 / Quota Error Cooldown**: When rate-limited by upstream Gemini, the server activates a 15-second cooldown and returns `retryAfterSeconds`. The UI displays an active countdown timer rather than falsely claiming the API is unconfigured.

---

## 2. Interactive Practice Quizzes
- [x] **Multiple Choice**: Verified question choices, correct answer matching, and explanation.
- [x] **True / False**: Verified boolean choice layout and grading logic.
- [x] **Fill-in-the-Blank & Short Answer**: Verified text input fields and semantic evaluation.
- [x] **Zod Validation & JSON Repair**: Verified that invalid responses trigger a single repair pass before presenting a clean error state with Retry button.

---

## 3. Document & File Summarizer
- [x] **Direct Text & Markdown**: Verified summarization with key takeaways and terminology glossary.
- [x] **PDF Document Upload**: Verified upload up to 25MB, MIME validation, and extraction.
- [x] **Photo / Image Notes**: Verified image inlineData parsing.

---

## 4. Photo Question Solver
- [x] **Clear Question Photo**: Extracts question text, provides step-by-step mathematical/conceptual steps, and highlights final answer with study tips.
- [x] **Blurry Photo**: Accurately sets `isBlurry: true`, alerts user with a clarification disclaimer, and produces the best possible solution.
- [x] **Non-Question Photo**: Accurately detects when an uploaded image is not a homework problem or exam question, providing a clear instructional prompt.

---

## 5. Study Planner & Rescheduler
- [x] **Plan Generation**: Generates balanced daily blocks (e.g. 3 hours/day) and weekly milestones.
- [x] **Interactive Task Checkboxes**: Students check off completed tasks.
- [x] **Reschedule Feature**: Clicks **Reschedule Missed Tasks** to redistribute uncompleted topics across remaining days without student burnout.

---

## 6. Exam Tracker & Google Forms Sync
- [x] **Without Forms Env Var**: Displays informative notice stating Google Forms sync is not configured and provides a CSV paste box (never crashes).
- [x] **With CSV / Form Input**: Parses CSV rows into structured exam objects with countdown dates and syllabus portions.

---

## 7. Authentication & Data Persistence
- [x] **Guest Session**: New visitors receive a signed JWT token valid for 4 hours with strict rate limits.
- [x] **Signed-in User**: Google Sign-In with Firebase authenticates real users and synchronizes user data to Firestore under `users/{uid}/**`.
- [x] **Security Rules**: Tested against `firestore.rules` where cross-user access is mathematically blocked.

---

## 8. Network & Build Hygiene
- [x] `npm run lint` passes with 0 TypeScript errors (`strict: true`).
- [x] `npm run build` succeeds cleanly.
- [x] No `GEMINI_API_KEY` or secrets leaked in client responses or network logs.

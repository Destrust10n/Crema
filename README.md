# Crema — AI Study Buddy Workspace

Crema is an elite, Apple-inspired AI study-buddy workspace designed for deep learning, active recall, exam planning, and interactive homework problem solving.

## Features
- **Streaming Study Chat**: Low-latency Server-Sent Events (SSE) dialogue with multi-turn context normalization, 3-5 word title synthesis, and strict client abort safety.
- **Interactive Practice Quizzes**: Generates multi-format tests (multiple choice, true/false, fill-in-the-blank, short answer) with instant grading and explanatory feedback.
- **Document & File Summarizer**: Summarizes uploaded textbooks, lecture notes, PDFs, code, and Google Drive docs with key takeaways and terminology glossaries.
- **Photo Question Solver**: Computer-vision analysis of homework problems and math equations. Detects clear questions, blurry photos, and non-question images with step-by-step solutions.
- **Adaptive Study Planner & Rescheduler**: Personalized study calendars that dynamically redistribute missed tasks across remaining days to prevent student burnout.
- **Exam Tracker & Google Forms Sync**: Live syllabus milestones with Google Forms / Sheets published CSV sync.
- **Spaced Repetition Flashcards**: Interactive flip flashcard deck with mastery progress tracking.
- **Firebase Authentication & Guest Sessions**: Secure Google Sign-In with Firestore synchronization, plus short-lived guest session tokens for instant onboarding.

---

## Quickstart & Scripts

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Starts the Express server with Vite middleware mounted (port 3000):
```bash
npm run dev
```

### 3. Build for Production
Compiles the React frontend into `dist/`:
```bash
npm run build
```

### 4. Run in Production Mode
Sets `NODE_ENV=production` and serves static assets from `dist/` alongside the full API:
```bash
npm start
```

### 5. Type Checking & Linting
Runs strict TypeScript compilation with zero emitted errors:
```bash
npm run lint
```

---

## Environment Variables
Defined in `.env.example`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-only Google Gemini API key (never exposed to client) | Required |
| `GEMINI_MODEL_FAST` | Fast model for interactive quizzes, summaries, and chat | `gemini-3.8-flash` |
| `GEMINI_MODEL_DEEP` | Cognitive reasoning model for complex STEM problems | `gemini-3.8-flash` |
| `PORT` | Local dev and production HTTP port | `3000` |
| `NODE_ENV` | Environment (`development` or `production`) | `development` |
| `GUEST_JWT_SECRET` | Secret key used to sign guest JWT sessions | `crema-secret-key` |
| `GOOGLE_FORMS_EXAMS_CSV_URL` | Published CSV URL for Google Forms / Sheets exam syllabus | Optional |
| `VITE_GOOGLE_DRIVE_API_KEY` | Optional Google Drive Picker API key | Optional |
| `VITE_GOOGLE_CLIENT_ID` | Optional OAuth client ID for Drive | Optional |

---

## Production Deployment
1. Build the production client bundle: `npm run build`.
2. Deploy the Node container to Google Cloud Run or any standard Node host.
3. Ensure `GEMINI_API_KEY` is configured in the container secrets.
4. Run `npm start`.

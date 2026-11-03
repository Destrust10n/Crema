# Crema Backend API Reference

All AI routes are protected and accept either a Firebase Auth ID token or a Crema Guest session token in the `Authorization: Bearer <token>` header. If omitted in dev/sandbox, the server defaults to an anonymous guest session with guest rate limits.

---

## 1. System Health & Diagnostics
### `GET /api/health`
Checks server status, uptime, Gemini configuration state, active request count, and model configuration.
- **Request**: `GET /api/health`
- **Response** (`200 OK`):
```json
{
  "status": "healthy",
  "app": "Crema - AI Study Buddy",
  "geminiConfigured": true,
  "activeRequests": 0,
  "models": {
    "fast": "gemini-3.8-flash",
    "deep": "gemini-3.8-flash"
  },
  "googleFormsConfigured": false,
  "uptimeSeconds": 142,
  "timestamp": "2026-11-03T06:00:00.000Z"
}
```

---

## 2. Authentication
### `POST /api/auth/guest`
Generates a short-lived signed JWT token (valid for 4 hours) with strict rate limits.
- **Request**: `POST /api/auth/guest`
- **Response** (`200 OK`):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "uid": "guest_1793685792_abc123",
    "displayName": "Guest Scholar",
    "isGuest": true,
    "createdAt": "2026-11-03T06:00:00.000Z"
  }
}
```

---

## 3. Streaming Study Chat
### `POST /api/chat/stream`
Real-time Server-Sent Events (SSE) chat dialogue with context normalization, abort detection, and duplicate lock enforcement.
- **Request Body**:
```json
{
  "prompt": "Explain the difference between DNA transcription and translation.",
  "history": [
    { "role": "user", "content": "What is RNA?" },
    { "role": "assistant", "content": "RNA is ribonucleic acid..." }
  ],
  "systemInstruction": "Keep answers focused on AP Biology.",
  "requestId": "req_12345"
}
```
- **Response (SSE Stream)**:
```text
data: {"type":"metadata","model":"gemini-3.8-flash","requestId":"req_12345"}

data: {"chunk":"Transcription ","text":"Transcription ","done":false}

data: {"chunk":"is the synthesis of RNA...","text":"is the synthesis of RNA...","done":false}

data: {"done":true,"requestId":"req_12345"}
```
- **Error Codes**:
  - `400 INVALID_PROMPT`: Missing or empty prompt.
  - `409 DUPLICATE_ACTIVE_REQUEST`: Request with this `requestId` is currently in flight.
  - `429 RATE_LIMITED`: Quota cooldown active (returns `retryAfterSeconds`).
  - `503 NOT_CONFIGURED`: Server `GEMINI_API_KEY` is missing.

### `POST /api/chat/title`
Fast title synthesis generating a concise 3-5 word dialogue label.
- **Request**: `POST /api/chat/title` `{ "prompt": "Can you explain eigenvectors and eigenvalues?" }`
- **Response**: `{ "title": "Eigenvectors and Eigenvalues" }`

---

## 4. Practice Quizzes
### `POST /api/quiz/generate`
Generates multi-question quizzes validated by Zod schema with a single automatic JSON repair pass.
- **Request Body**:
```json
{
  "topic": "Cellular Respiration",
  "questionCount": 3,
  "difficulty": "intermediate",
  "questionTypes": ["multiple_choice", "true_false", "fill_in_the_blank"]
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "quiz": {
    "topic": "Cellular Respiration",
    "questions": [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "Where does the Krebs cycle occur inside eukaryotic cells?",
        "options": ["Cytoplasm", "Mitochondrial Matrix", "Inner Mitochondrial Membrane", "Nucleus"],
        "correctAnswer": "Mitochondrial Matrix",
        "explanation": "The Krebs cycle enzymes are localized in the mitochondrial matrix."
      }
    ]
  }
}
```

### `POST /api/quiz/grade`
Grades user submissions, calculating score, percentage, and individualized question reviews.
- **Request Body**:
```json
{
  "quiz": { ... },
  "userAnswers": {
    "q1": "Mitochondrial Matrix"
  }
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "result": {
    "score": 1,
    "total": 1,
    "percentage": 100,
    "feedback": "Outstanding mastery of cellular organelles!",
    "questionReviews": [
      {
        "questionId": "q1",
        "isCorrect": true,
        "userAnswer": "Mitochondrial Matrix",
        "correctAnswer": "Mitochondrial Matrix",
        "explanation": "Correctly identified mitochondrial matrix."
      }
    ]
  }
}
```

---

## 5. Document & File Summarizer
### `POST /api/summarize`
Summarizes text notes, uploaded files (PDF, TXT, CSV, MD, images up to 25MB), or Google Drive docs.
- **Request Body**:
```json
{
  "content": "Paste text notes...",
  "fileData": {
    "name": "lecture_04.pdf",
    "mimeType": "application/pdf",
    "base64": "JVBERi0xLj..."
  },
  "length": "detailed",
  "focus": "Formulas and proof steps"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "summary": {
    "title": "Quantum Mechanics & Wavepackets",
    "summary": "This document explores the time-dependent Schrödinger equation...",
    "keyTakeaways": [
      "Probability density is given by |Ψ(x,t)|².",
      "Wave packet dispersion depends on the group velocity."
    ],
    "glossary": [
      { "term": "Wavefunction", "definition": "A mathematical description of the quantum state of an isolated quantum system." }
    ]
  }
}
```

---

## 6. Photo Question Solver
### `POST /api/solve`
Computer-vision problem solving from photos. Accurately handles clear questions, blurry photos, and non-question photos.
- **Request Body**:
```json
{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "mimeType": "image/jpeg",
  "additionalNotes": "Solve part b only"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "solution": {
    "isQuestion": true,
    "isBlurry": false,
    "questionText": "Find the derivative of f(x) = x³ * ln(x)",
    "stepByStep": [
      "Apply the product rule: (u * v)' = u' * v + u * v'",
      "Let u = x³, so u' = 3x²",
      "Let v = ln(x), so v' = 1/x",
      "f'(x) = 3x² * ln(x) + x³ * (1/x) = 3x² ln(x) + x² = x²(3 ln(x) + 1)"
    ],
    "finalAnswer": "x²(3 ln(x) + 1)",
    "tips": [
      "Remember that ln(x) is only defined for x > 0.",
      "Factor out common powers of x for cleanest simplified form."
    ]
  }
}
```

---

## 7. Study Planner & Rescheduling
### `POST /api/planner/generate`
Generates personalized study schedules with weekly milestones and daily task blocks.
- **Request**:
```json
{
  "targetExam": "Calculus 2 Final",
  "examDate": "2026-12-10",
  "hoursPerDay": 3,
  "focusAreas": ["Integration by Parts", "Taylor Series"]
}
```

### `POST /api/planner/reschedule`
Dynamically redistributes missed tasks across remaining days to keep students on track.
- **Request**:
```json
{
  "currentPlan": { ... },
  "completedTasks": ["Week 1 Day 1", "Week 1 Day 2"],
  "missedTasks": ["Week 1 Day 3: Series convergence tests"],
  "remainingDays": 12
}
```

---

## 8. Exam Tracker & Google Forms CSV Sync
### `POST /api/exams/import`
Imports exam schedules from Google Forms published responses sheet or raw CSV data.
- **Request**:
```json
{
  "csvContent": "Course,Date,Syllabus\nOrganic Chemistry,2026-12-05,Reactions"
}
```
- **Response (when configured or CSV provided)**:
```json
{
  "success": true,
  "available": true,
  "exams": [
    {
      "id": "exam_1_17936858",
      "title": "Organic Chemistry",
      "date": "2026-12-05",
      "syllabus": "Reactions",
      "source": "Google Forms CSV"
    }
  ]
}
```
- **Response (when unconfigured)**:
```json
{
  "success": true,
  "available": false,
  "message": "Google Forms exam sync is not configured. Set GOOGLE_FORMS_EXAMS_CSV_URL in .env or provide CSV content.",
  "exams": []
}
```

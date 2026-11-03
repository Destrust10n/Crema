# Crema Architecture & Data Flow

Crema is built as a single-origin, full-stack TypeScript application with an Express backend running Vite middleware in development and serving static production assets in production.

---

## Directory Structure

```text
/
├── index.html                   # Entry point HTML with SEO & Crema branding
├── metadata.json                # AI Studio application metadata
├── package.json                 # Scripts: dev, build, start, lint
├── tsconfig.json                # TypeScript strict mode configuration
├── firestore.rules              # ABAC security rules (users/{uid}/** only)
├── firebase-blueprint.json      # Schema Intermediate Representation (IR)
├── firebase-applet-config.json  # Client Firebase configuration
├── server.ts                    # Express server entry point & middleware mounting
│
├── server/                      # Backend Architecture
│   ├── config.ts                # Configuration & environment variables
│   ├── auth.ts                  # Firebase Admin & Guest JWT verification
│   ├── gemini.ts                # Google Gen AI engine, normalization, 429 cooldown & JSON repair
│   ├── activeRequests.ts        # Request ID locking & abort safety tracking
│   ├── schemas.ts               # Zod validation schemas for all structured outputs
│   └── routes/                  # Express API Route Controllers
│       ├── chat.ts              # Real-time SSE streaming & title synthesis
│       ├── quiz.ts              # Quiz generation & student response grading
│       ├── summarize.ts         # Multi-format document summarization
│       ├── solve.ts             # Vision problem solving from photos
│       ├── planner.ts           # Adaptive study planning & rescheduling
│       ├── exams.ts             # Google Forms CSV sync & exam tracking
│       ├── auth.ts              # Guest session issuance
│       └── health.ts            # System health diagnostics
│
├── src/                         # Frontend Application (React + Tailwind CSS)
│   ├── App.tsx                  # Main orchestration container & modal management
│   ├── main.tsx                 # React DOM root entry
│   ├── index.css                # Global Tailwind CSS styles
│   ├── components/              # UI Components
│   │   ├── study/               # Dedicated Study Buddy Tools
│   │   │   ├── QuizModal.tsx    # Interactive multi-type quiz interface
│   │   │   ├── SummarizeModal.tsx # Document & Drive summarizer
│   │   │   ├── QuestionSolverModal.tsx # Photo question solver
│   │   │   ├── StudyPlannerModal.tsx # Adaptive study planner & rescheduler
│   │   │   ├── ExamsModal.tsx   # Exam tracker & Google Forms CSV sync
│   │   │   └── FlashcardsModal.tsx # Spaced repetition flashcards
│   │   ├── composer/            # Floating Chat Composer dock
│   │   ├── chat/                # Streaming message items
│   │   ├── glass/               # Liquid-glass design primitives
│   │   └── Sidebar.tsx          # Study tools & session navigation sidebar
│   ├── services/
│   │   ├── cremaApi.ts          # Crema backend API client
│   │   ├── firestoreService.ts  # Real-time Firestore user-scoped synchronization
│   │   └── apiGatewayService.ts # Diagnostics & speed test service
│   ├── lib/
│   │   └── firebase.ts          # Firebase SDK client initialization
│   └── types/                   # Frontend TypeScript interfaces
│
└── docs/                        # Project Documentation
    ├── API.md                   # API specification with request/response payloads
    ├── ARCHITECTURE.md          # Architecture diagram and system design
    ├── GOOGLE_SETUP.md          # Firebase, Google Forms & Drive setup guide
    └── TESTING.md               # End-to-end verification checklist
```

---

## System Architecture Diagram

```mermaid
graph TD
    Client[Browser / React Client] -->|HTTP / SSE| Server[Express Server on Port 3000]

    subgraph Security Layer
        Server --> Helmet[Helmet Security Headers]
        Server --> CORS[Same-Origin CORS]
        Server --> RateLimit[IP & Guest Rate Limiting]
        Server --> PayloadLimit[25MB Body & MIME Check]
        Server --> AuthGuard[Firebase Admin & Guest JWT Auth]
    end

    subgraph Backend Engine
        AuthGuard --> ChatRoute[/api/chat/stream]
        AuthGuard --> QuizRoute[/api/quiz/generate & grade]
        AuthGuard --> SumRoute[/api/summarize]
        AuthGuard --> SolveRoute[/api/solve]
        AuthGuard --> PlanRoute[/api/planner/generate & reschedule]
        AuthGuard --> ExamRoute[/api/exams/import]

        ChatRoute --> ActiveReq[Active Request Manager - Fresh ID Locks]
        QuizRoute --> ZodVal[Zod Validation & JSON Repair]
        SumRoute --> ZodVal
        SolveRoute --> ZodVal
        PlanRoute --> ZodVal

        ActiveReq --> GeminiSDK[@google/genai SDK - Server Only]
        ZodVal --> GeminiSDK
    end

    subgraph Cloud Integrations
        GeminiSDK -->|API Key Auth| GoogleGemini[Google Gemini API]
        Client -->|Direct SDK| FirestoreDB[(Firestore Cloud DB)]
        ExamRoute -->|HTTP Fetch| GoogleForms[Google Forms Published CSV Sheet]
    end

    subgraph Data Isolation
        FirestoreDB --> RuleCheck{Firestore Security Rules}
        RuleCheck -->|UID Match Only| UserScope[users/{uid}/** Documents]
    end
```

---

## Core Security & Reliability Principles

1. **Server-Side AI Secrets**: The `GEMINI_API_KEY` is loaded strictly on the backend and is never exposed to the client, logged, or returned in HTTP payloads.
2. **Context Normalization**: Conversation histories sent to Gemini normalize roles (`user` / `model`), drop empty messages, merge adjacent same-role messages, and place instructions into `systemInstruction`.
3. **Structured Outputs & Self-Repair**: All structured operations (quizzes, plans, summaries, solutions) use Gemini JSON mode validated by Zod schemas. If the model outputs imperfect JSON, an automatic repair pass fixes the structure before returning a clean error.
4. **Client Disconnect Protection**: Streaming endpoints monitor `res.on('close')`. If the client aborts or disconnects, the connection terminates gracefully without triggering circuit breaker penalties.
5. **Zero-Trust Firestore Partitioning**: All database paths are isolated to `users/{uid}/**`. Cross-user reads or writes are mathematically rejected at the security rules level.

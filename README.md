# Code-Rift

## Project Structure

```
Coderift/
└── client/
    ├── next.config.js
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── globals.css
        │   ├── layout.tsx
        │   ├── page.tsx
        │   ├── dashboard/
        │   │   └── page.tsx
        │   ├── github/
        │   │   └── page.tsx
        │   ├── login/
        │   │   └── page.tsx
        │   ├── review/
        │   │   ├── page.tsx
        │   │   └── [id]/
        │   │       └── page.tsx
        │   └── api/
        │       ├── health/
        │       │   └── route.ts
        │       ├── auth/
        │       │   ├── me/
        │       │   │   └── route.ts
        │       │   └── sync/
        │       │       └── route.ts
        │       ├── review/
        │       │   ├── analyze/
        │       │   │   └── route.ts
        │       │   └── [id]/
        │       │       └── route.ts
        │       ├── dashboard/
        │       │   ├── reviews/
        │       │   │   └── route.ts
        │       │   ├── stats/
        │       │   │   └── route.ts
        │       │   └── languages/
        │       │       └── route.ts
        │       └── github/
        │           ├── analyze/
        │           │   └── route.ts
        │           ├── auth-url/
        │           │   └── route.ts
        │           ├── callback/
        │           │   └── route.ts
        │           ├── disconnect/
        │           │   └── route.ts
        │           ├── status/
        │           │   └── route.ts
        │           └── repos/
        │               ├── route.ts
        │               └── [owner]/
        │                   └── [repo]/
        │                       ├── tree/
        │                       │   └── route.ts
        │                       └── file/
        │                           └── route.ts
        ├── components/
        │   ├── CodeEditor.tsx
        │   ├── ErrorBoundary.tsx
        │   ├── GitHubResultsPanel.tsx
        │   ├── LoadingSkeleton.tsx
        │   ├── MagneticButton.tsx
        │   ├── Navbar.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── RepoTree.tsx
        │   ├── ResultsPanel.tsx
        │   └── ScoreGauge.tsx
        ├── context/
        │   └── AuthContext.tsx
        ├── lib/
        │   ├── api.ts
        │   ├── auth.ts
        │   ├── firebase.ts
        │   ├── firebaseAdmin.ts
        │   ├── mongodb.ts
        │   └── redis.ts
        ├── models/
        │   ├── CodeReview.ts
        │   └── User.ts
        └── services/
            ├── cacheService.ts
            ├── githubService.ts
            └── groqService.ts
```

## Overview

Code-Rift is an AI-powered code review platform built as a single Next.js application deployable on Vercel. It uses serverless API routes for the backend, Firebase for authentication, MongoDB for storage, and Groq for AI-driven code analysis.

### Frontend
- Built with Next.js (App Router) and TypeScript
- Tailwind CSS for styling
- Firebase Auth (Google + email/password)
- Reusable components and auth context

### Backend (Serverless API Routes)
- Next.js API routes under `src/app/api/`
- MongoDB with cached connection pattern for serverless
- Redis for caching and rate limiting (optional)
- Groq AI for code review analysis
- GitHub OAuth integration for repo browsing and file analysis
- Firebase Admin SDK for token verification

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or Atlas)
- Redis instance (optional, for caching)

### Setup

1. Install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `MONGODB_URI` — MongoDB connection string
   - `GROQ_API_KEY` — Groq API key for AI analysis
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase Admin SDK
   - `NEXT_PUBLIC_FIREBASE_*` — Firebase client config
   - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — GitHub OAuth (optional)
   - `REDIS_URL` — Redis connection string (optional)

3. Run in development:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm start
   ```

### Deploying to Vercel

1. Push the `client/` directory as your project root (or set the root directory in Vercel settings).
2. Add all environment variables from `.env.local` to Vercel's Environment Variables settings.
3. Set `GITHUB_CALLBACK_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL.
4. Deploy.

## License

MIT

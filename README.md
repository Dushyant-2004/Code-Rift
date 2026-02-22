# Code-Rift

## Project Structure

```
Coderift/
├── client/
│   ├── next-env.d.ts
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── dashboard/
│       │   │   └── page.tsx
│       │   ├── login/
│       │   │   └── page.tsx
│       │   └── review/
│       │       ├── page.tsx
│       │       └── [id]/
│       │           └── page.tsx
│       ├── components/
│       │   ├── CodeEditor.tsx
│       │   ├── LoadingSkeleton.tsx
│       │   ├── MagneticButton.tsx
│       │   ├── Navbar.tsx
│       │   ├── ProtectedRoute.tsx
│       │   ├── ResultsPanel.tsx
│       │   └── ScoreGauge.tsx
│       ├── context/
│       │   └── AuthContext.tsx
│       └── lib/
│           ├── api.ts
│           └── firebase.ts
├── server/
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── config/
│       │   ├── database.js
│       │   ├── firebase.js
│       │   └── redis.js
│       ├── middleware/
│       │   ├── auth.js
│       │   └── errorHandler.js
│       ├── models/
│       │   ├── CodeReview.js
│       │   └── User.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── dashboard.js
│       │   └── review.js
│       └── services/
│           ├── cacheService.js
│           └── groqService.js
└── README.md
```

## Overview

Code-Rift is a full-stack application with a Next.js client and a Node.js/Express server. It features authentication, code review, dashboard, and integration with Firebase and Redis.

### Client
- Built with Next.js and TypeScript
- Uses Tailwind CSS for styling
- Contains reusable components and context for authentication

### Server
- Node.js with Express
- Handles authentication, dashboard, and review routes
- Integrates with Firebase and Redis for storage and caching

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### Setup

1. Install dependencies for both client and server:
	```bash
	cd client
	npm install
	cd ../server
	npm install
	```
2. Configure environment variables as needed for Firebase, Redis, etc.
3. Start the server:
	```bash
	npm start
	```
4. Start the client:
	```bash
	cd ../client
	npm run dev
	```

## License

MIT

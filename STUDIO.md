# Tarsify Studio - Developer Portal Build Guide

> **Copy this entire file to your tarsify-studio repository**  
> This is a comprehensive prompt for building the developer portal from scratch.

---

## Project Overview

**Tarsify Studio** is the developer portal where AI developers can:

- Sign up and manage their developer profile
- Create, edit, and publish AI notebooks
- Upload .ipynb files
- Track analytics (views, runs, earnings)
- Request payouts

**API Base URL:** `https://api.tarsify.com` (or `http://localhost:3001` for local dev)

---

## Tech Stack

| Technology                 | Purpose          | Why                                    |
| -------------------------- | ---------------- | -------------------------------------- |
| **Next.js 15**             | Framework        | App Router, RSC, SSR/SSG for SEO       |
| **TypeScript 5**           | Language         | Type safety, better DX                 |
| **Tailwind CSS 4**         | Styling          | Utility-first, fast iteration          |
| **shadcn/ui**              | Components       | Accessible, customizable, no lock-in   |
| **React Query (TanStack)** | Data fetching    | Caching, mutations, optimistic updates |
| **Zustand**                | State management | Lightweight, simple, no boilerplate    |
| **React Hook Form**        | Forms            | Performance, validation integration    |
| **Zod**                    | Validation       | Schema validation, type inference      |
| **Firebase Auth**          | Authentication   | Firebase Project B (tarsify-devs)      |
| **Vitest**                 | Unit testing     | Fast, ESM native, Jest compatible      |
| **Playwright**             | E2E testing      | Cross-browser, reliable                |
| **ESLint + Prettier**      | Code quality     | Consistent formatting                  |

---

## Project Structure

```
tarsify-studio/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth routes (no sidebar)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/          # Protected routes (with sidebar)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── notebooks/
│   │   │   │   ├── page.tsx           # List notebooks
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Create notebook
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # View/edit notebook
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   ├── earnings/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx             # Dashboard layout with sidebar
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page (redirect to dashboard or login)
│   │   ├── error.tsx             # Error boundary
│   │   ├── not-found.tsx         # 404 page
│   │   └── loading.tsx           # Loading state
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── user-menu.tsx
│   │   │
│   │   ├── notebooks/            # Notebook-specific components
│   │   │   ├── notebook-card.tsx
│   │   │   ├── notebook-form.tsx
│   │   │   ├── notebook-list.tsx
│   │   │   ├── notebook-status-badge.tsx
│   │   │   ├── file-upload.tsx
│   │   │   └── publish-dialog.tsx
│   │   │
│   │   ├── analytics/            # Analytics components
│   │   │   ├── stats-card.tsx
│   │   │   ├── chart.tsx
│   │   │   └── recent-runs.tsx
│   │   │
│   │   └── shared/               # Shared components
│   │       ├── loading-spinner.tsx
│   │       ├── empty-state.tsx
│   │       ├── error-message.tsx
│   │       ├── confirm-dialog.tsx
│   │       └── page-header.tsx
│   │
│   ├── lib/                      # Utilities and configs
│   │   ├── api/                  # API client
│   │   │   ├── client.ts         # Fetch wrapper with auth
│   │   │   ├── endpoints.ts      # API endpoint definitions
│   │   │   └── types.ts          # API response types
│   │   │
│   │   ├── firebase/             # Firebase configuration
│   │   │   ├── config.ts         # Firebase app init
│   │   │   ├── auth.ts           # Auth helpers
│   │   │   └── types.ts          # Firebase types
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   ├── cn.ts             # className merger
│   │   │   ├── format.ts         # Date, currency formatters
│   │   │   └── validation.ts     # Shared Zod schemas
│   │   │
│   │   └── constants.ts          # App constants
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.ts           # Auth state hook
│   │   ├── use-notebooks.ts      # Notebooks queries/mutations
│   │   ├── use-analytics.ts      # Analytics queries
│   │   ├── use-earnings.ts       # Earnings queries
│   │   └── use-toast.ts          # Toast notifications
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── auth-store.ts         # Auth state
│   │   └── ui-store.ts           # UI state (sidebar, modals)
│   │
│   ├── providers/                # React context providers
│   │   ├── auth-provider.tsx     # Firebase auth provider
│   │   ├── query-provider.tsx    # React Query provider
│   │   └── theme-provider.tsx    # Theme provider
│   │
│   └── types/                    # TypeScript types
│       ├── api.ts                # API types
│       ├── notebook.ts           # Notebook types
│       └── developer.ts          # Developer types
│
├── tests/
│   ├── unit/                     # Unit tests (Vitest)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   └── e2e/                      # E2E tests (Playwright)
│       ├── auth.spec.ts
│       ├── notebooks.spec.ts
│       └── fixtures/
│
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── .env.local                    # Local environment
├── .env.example                  # Environment template
├── .eslintrc.json
├── .prettierrc
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── next.config.ts
├── package.json
└── README.md
```

---

## Task Breakdown

### Phase 1: Project Setup (Day 1)

#### Task 1.1: Initialize Next.js Project

```bash
npx create-next-app@latest tarsify-studio --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd tarsify-studio
```

#### Task 1.2: Install Core Dependencies

```bash
# UI Components
npx shadcn@latest init
npx shadcn@latest add button card input form label select dialog dropdown-menu table toast avatar badge tabs separator skeleton

# Data Fetching & State
npm install @tanstack/react-query zustand

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Firebase
npm install firebase

# Utilities
npm install clsx tailwind-merge lucide-react date-fns

# Dev Dependencies
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
npm install -D prettier eslint-config-prettier
```

#### Task 1.3: Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Task 1.4: Configure ESLint & Prettier

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

Update `.eslintrc.json`:

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

#### Task 1.5: Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### Task 1.6: Create Environment Template

Create `.env.example`:

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Firebase (Developer Auth - Project B)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tarsify-devs.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tarsify-devs
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

### Phase 2: Core Infrastructure (Day 1-2)

#### Task 2.1: Create API Client

```typescript
// src/lib/api/client.ts
// - Fetch wrapper with base URL from env
// - Automatic auth token injection from Firebase
// - Error handling and response parsing
// - Request/response interceptors
```

#### Task 2.2: Create Firebase Auth Module

```typescript
// src/lib/firebase/config.ts - Firebase app initialization
// src/lib/firebase/auth.ts - signIn, signUp, signOut, getCurrentUser
// src/stores/auth-store.ts - Zustand store for auth state
// src/providers/auth-provider.tsx - Provider with onAuthStateChanged listener
// src/hooks/use-auth.ts - Hook to access auth state and methods
```

#### Task 2.3: Create Query Provider

```typescript
// src/providers/query-provider.tsx
// - React Query provider with default options
// - Retry logic configuration
// - Error handling
```

#### Task 2.4: Create Root Layout with Providers

```typescript
// src/app/layout.tsx
// - Wrap app with AuthProvider, QueryProvider, ThemeProvider
// - Add Toaster component
// - Configure metadata for SEO
```

---

### Phase 3: Authentication Pages (Day 2-3)

#### Task 3.1: Create Auth Layout

```typescript
// src/app/(auth)/layout.tsx
// - Centered card layout for auth pages
// - Redirect to dashboard if already logged in
// - Logo and branding
```

#### Task 3.2: Create Login Page

```typescript
// src/app/(auth)/login/page.tsx
// Features:
// - Email/password form
// - Google sign-in button
// - "Forgot password" link
// - Link to register page
// - Form validation with Zod
// - Loading states
// - Error messages
```

#### Task 3.3: Create Register Page

```typescript
// src/app/(auth)/register/page.tsx
// Features:
// - Name, email, password form
// - Google sign-up button
// - Terms acceptance checkbox
// - Link to login page
// - After Firebase signup, call POST /api/studio/auth/register
```

#### Task 3.4: Create Auth Middleware

```typescript
// src/middleware.ts
// - Protect /dashboard/* routes
// - Redirect unauthenticated users to /login
// - Redirect authenticated users from /login to /dashboard
```

---

### Phase 4: Dashboard Layout (Day 3-4)

#### Task 4.1: Create Dashboard Layout

```typescript
// src/app/(dashboard)/layout.tsx
// - Sidebar navigation
// - Mobile responsive (hamburger menu)
// - User menu dropdown
// - Breadcrumbs (optional)
```

#### Task 4.2: Create Sidebar Component

```typescript
// src/components/layout/sidebar.tsx
// Navigation items:
// - Dashboard (overview)
// - Notebooks
// - Analytics
// - Earnings
// - Settings
// Features:
// - Active state highlighting
// - Collapse on mobile
// - Logo at top
```

#### Task 4.3: Create Header Component

```typescript
// src/components/layout/header.tsx
// - Page title
// - Mobile menu toggle
// - User avatar dropdown
// - Notifications (future)
```

#### Task 4.4: Create Dashboard Home Page

```typescript
// src/app/(dashboard)/dashboard/page.tsx
// - Welcome message with developer name
// - Quick stats cards (total notebooks, total runs, earnings)
// - Recent activity
// - Quick actions (create notebook)
```

---

### Phase 5: Notebooks Module (Day 4-6)

#### Task 5.1: Create Notebooks Hooks

```typescript
// src/hooks/use-notebooks.ts
// Queries:
// - useNotebooks() - list with pagination
// - useNotebook(id) - single notebook
// Mutations:
// - useCreateNotebook()
// - useUpdateNotebook()
// - useDeleteNotebook()
// - useUploadNotebookFile()
// - useDeleteNotebookFile()
// - usePublishNotebook()
// - useUnpublishNotebook()
```

#### Task 5.2: Create Notebooks List Page

```typescript
// src/app/(dashboard)/notebooks/page.tsx
// Features:
// - Table/grid view toggle
// - Search/filter by status
// - Pagination
// - Empty state for no notebooks
// - "Create notebook" button
// - Quick actions (edit, delete, publish)
```

#### Task 5.3: Create Notebook Card Component

```typescript
// src/components/notebooks/notebook-card.tsx
// - Thumbnail
// - Title, description
// - Status badge (draft/published)
// - Category, GPU tier
// - Created/updated date
// - Action menu (edit, publish, delete)
```

#### Task 5.4: Create New Notebook Page

```typescript
// src/app/(dashboard)/notebooks/new/page.tsx
// Form fields:
// - Title (required)
// - Short description (required)
// - Full description (markdown editor)
// - Category dropdown
// - GPU tier dropdown
// - Price in credits
// - Thumbnail upload (optional)
// Validation:
// - Title min 3 chars
// - Description min 10 chars
// - Price min 1
```

#### Task 5.5: Create Notebook Edit Page

```typescript
// src/app/(dashboard)/notebooks/[id]/edit/page.tsx
// - Same form as create but pre-filled
// - File upload section
// - Publish/unpublish actions
// - Delete with confirmation
// - View on marketplace link (if published)
```

#### Task 5.6: Create File Upload Component

```typescript
// src/components/notebooks/file-upload.tsx
// Features:
// - Drag and drop zone
// - File picker button
// - .ipynb only validation
// - Upload progress
// - Replace existing file
// - Delete file option
```

#### Task 5.7: Create Publish Dialog

```typescript
// src/components/notebooks/publish-dialog.tsx
// - Show publishing requirements checklist
// - Confirm action
// - Loading state
// - Success/error feedback
```

---

### Phase 6: Analytics & Earnings (Day 6-7)

#### Task 6.1: Create Analytics Page

```typescript
// src/app/(dashboard)/analytics/page.tsx
// Stats:
// - Total views (all notebooks)
// - Total runs (all notebooks)
// - Total earnings
// Charts:
// - Runs over time (line chart)
// - Top notebooks by runs (bar chart)
// Tables:
// - Recent runs with details
```

#### Task 6.2: Create Earnings Page

```typescript
// src/app/(dashboard)/earnings/page.tsx
// Stats:
// - Available balance
// - Pending balance
// - Total earned
// Tables:
// - Earnings breakdown by notebook
// - Payout history
// Actions:
// - Request payout (if balance > threshold)
```

#### Task 6.3: Create Chart Components

```typescript
// src/components/analytics/chart.tsx
// - Use lightweight chart library (recharts or chart.js)
// - Responsive design
// - Loading skeletons
```

---

### Phase 7: Settings (Day 7)

#### Task 7.1: Create Settings Page

```typescript
// src/app/(dashboard)/settings/page.tsx
// Sections:
// - Profile (name, avatar, bio)
// - Account (email, change password)
// - Payout settings (payout email, Stripe connect)
// - Notifications (email preferences)
// - Danger zone (delete account)
```

---

### Phase 8: Testing (Day 8)

#### Task 8.1: Unit Tests

```typescript
// tests/unit/components/notebook-card.test.tsx
// tests/unit/hooks/use-notebooks.test.ts
// tests/unit/utils/format.test.ts
// Test coverage targets:
// - Components: render, user interactions
// - Hooks: query states, mutation calls
// - Utils: pure function testing
```

#### Task 8.2: E2E Tests

```typescript
// tests/e2e/auth.spec.ts - Login, register, logout flows
// tests/e2e/notebooks.spec.ts - CRUD operations
// tests/e2e/navigation.spec.ts - Page navigation
```

---

### Phase 9: Polish & Optimization (Day 9)

#### Task 9.1: SEO Optimization

```typescript
// - Add metadata to all pages
// - Create sitemap.xml
// - Create robots.txt
// - Add Open Graph tags
```

#### Task 9.2: Performance Optimization

```typescript
// - Add loading skeletons everywhere
// - Implement optimistic updates
// - Add image optimization
// - Lazy load heavy components
// - Add prefetching for navigation
```

#### Task 9.3: Accessibility

```typescript
// - Keyboard navigation
// - Focus management
// - ARIA labels
// - Color contrast
// - Screen reader testing
```

---

### Phase 10: Documentation & Deployment Prep (Day 10)

#### Task 10.1: Write README

```markdown
// - Project overview
// - Getting started
// - Available scripts
// - Environment variables
// - Folder structure
// - Contributing guidelines
```

#### Task 10.2: Create Dockerfile

```dockerfile
// Multi-stage build for production
// Firebase Hosting compatible
```

#### Task 10.3: Create firebase.json

```json
// Hosting configuration
// Redirect rules
// Headers
```

---

## API Endpoints Reference

The studio will consume these endpoints from tarsify-api:

### Authentication

| Method | Endpoint                    | Description                    |
| ------ | --------------------------- | ------------------------------ |
| POST   | `/api/studio/auth/register` | Register after Firebase signup |
| GET    | `/api/studio/auth/me`       | Get current developer profile  |
| PUT    | `/api/studio/auth/profile`  | Update profile                 |

### Notebooks

| Method | Endpoint                              | Description                |
| ------ | ------------------------------------- | -------------------------- |
| GET    | `/api/studio/notebooks`               | List developer's notebooks |
| POST   | `/api/studio/notebooks`               | Create notebook            |
| GET    | `/api/studio/notebooks/:id`           | Get notebook details       |
| PUT    | `/api/studio/notebooks/:id`           | Update notebook            |
| DELETE | `/api/studio/notebooks/:id`           | Delete notebook            |
| POST   | `/api/studio/notebooks/:id/file`      | Upload .ipynb              |
| GET    | `/api/studio/notebooks/:id/file`      | Download .ipynb            |
| DELETE | `/api/studio/notebooks/:id/file`      | Delete .ipynb              |
| POST   | `/api/studio/notebooks/:id/publish`   | Publish                    |
| POST   | `/api/studio/notebooks/:id/unpublish` | Unpublish                  |

### Analytics (Future)

| Method | Endpoint                              | Description        |
| ------ | ------------------------------------- | ------------------ |
| GET    | `/api/studio/analytics`               | Overall stats      |
| GET    | `/api/studio/analytics/notebooks/:id` | Per-notebook stats |

### Earnings (Future)

| Method | Endpoint                      | Description      |
| ------ | ----------------------------- | ---------------- |
| GET    | `/api/studio/earnings`        | Earnings summary |
| POST   | `/api/studio/payouts/request` | Request payout   |
| GET    | `/api/studio/payouts`         | Payout history   |

---

## Design Guidelines

### Colors (Tailwind)

```
Primary: blue-600 (#2563eb)
Secondary: slate-600 (#475569)
Success: green-600 (#16a34a)
Warning: amber-600 (#d97706)
Error: red-600 (#dc2626)
Background: slate-50 (#f8fafc)
Card: white
Border: slate-200 (#e2e8f0)
```

### Typography

```
Headings: font-semibold
Body: font-normal
Small: text-sm text-slate-500
```

### Components Style

```
Buttons: Rounded-lg, consistent padding
Cards: Rounded-lg, subtle shadow, border
Inputs: Rounded-md, focus ring
Tables: Clean borders, hover states
```

### Spacing

```
Page padding: p-6 lg:p-8
Card padding: p-4 lg:p-6
Section gap: space-y-6
Element gap: space-y-4
```

---

## Important Notes

### ESM Imports

**CRITICAL:** This project uses ESM. Never use `require()`:

```typescript
// ✅ CORRECT
import { something } from './module';

// ❌ WRONG
const { something } = require('./module');
```

### API Client Pattern

Always use the API client for requests:

```typescript
// ✅ CORRECT
import { api } from '@/lib/api/client';
const data = await api.get('/studio/notebooks');

// ❌ WRONG - Direct fetch without auth
fetch('/api/studio/notebooks');
```

### Error Handling

Handle loading, error, and empty states:

```typescript
// ✅ CORRECT
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
if (data.length === 0) return <EmptyState />;
return <NotebookList data={data} />;
```

### Type Safety

Always type API responses:

```typescript
// ✅ CORRECT
interface NotebookResponse {
  id: string;
  title: string;
  status: 'draft' | 'published';
}
const { data } = useQuery<NotebookResponse[]>(...);

// ❌ WRONG - any type
const { data } = useQuery<any>(...);
```

---

## Getting Started Commands

```bash
# 1. Create the project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Install dependencies (copy from Task 1.2)

# 3. Copy .env.example to .env.local and fill in values

# 4. Run development server
npm run dev

# 5. Run tests
npm test

# 6. Build for production
npm run build
```

---

## Success Criteria

Before considering each phase complete:

- [ ] All TypeScript compiles without errors
- [ ] All ESLint rules pass
- [ ] All tests pass
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Empty states implemented
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Console has no errors/warnings

---

_Start with Phase 1 and proceed sequentially. Ask for clarification if any task is unclear._

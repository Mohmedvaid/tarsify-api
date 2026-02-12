# Tarsify API — Architecture

> **Last Updated:** February 12, 2026
> **Repo:** tarsify-api
> **Runtime:** Node.js 20+ | Fastify 5 | TypeScript 5 | ESM
> **Test Coverage:** 86%+ (726 tests)

---

## What Is Tarsify

Tarsify is a two-sided AI marketplace ("Amazon of AI models"):

- **Developers** pick from platform-managed base models (SDXL, Whisper, TTS, etc.), configure/brand them, and publish to the marketplace
- **Consumers** browse the marketplace and run AI models without knowing the underlying infrastructure
- **Platform (you)** deploys AI models on RunPod Serverless and manages everything behind the scenes

Three services: `tarsify-api` (this repo), `tarsify-studio` (developer portal), `tarsify-web` (consumer marketplace). All on GCP Cloud Run.

---

## Architecture Status ✅

Phase 3 (Engine Integration) is **complete**. The codebase now has:

### Engine Model (Active)

- Platform deploys AI models on RunPod Serverless (real GPUs)
- Developers pick base models, configure/brand them as "Tars Models"
- Consumers run Tars Models → hits RunPod endpoints → gets results
- Tables: `runpod_endpoints`, `base_models`, `tars_models`, `executions`
- Routes: `/api/admin/*`, `/api/studio/tars-models/*`, `/api/marketplace/models/*`, `/api/marketplace/runs/*`
- Engine module: `src/engine/`

### Legacy Notebook Model (Deprecated)

- Developers uploaded `.ipynb` Jupyter notebook files
- Routes: `/api/studio/notebooks/*`, `/api/marketplace/notebooks/*`
- Tables: `notebooks` (still in DB, will be removed)
- **Status:** Code still compiles but deprecated. Do not extend.

---

## Tech Stack

| Technology               | Purpose            |
| ------------------------ | ------------------ |
| **Fastify 5**            | HTTP framework     |
| **TypeScript 5 (ESM)**   | Language           |
| **Prisma 6**             | ORM + migrations   |
| **PostgreSQL**           | Database           |
| **Firebase Admin SDK**   | Auth (2 projects)  |
| **Zod**                  | Input validation   |
| **Google Cloud Storage** | File storage       |
| **RunPod Serverless**    | GPU execution      |
| **Vitest**               | Testing (86%+ cov) |
| **pino**                 | Logging            |
| **Husky**                | Git hooks          |
| **GitHub Actions**       | CI/CD pipeline     |

---

## Repository Structure

```
tarsify-api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── secrets/                   # Service account keys (gitignored)
├── src/
│   ├── config/                # Env vars, route constants, app constants
│   ├── core/                  # Error classes, responses, middleware
│   │   ├── errors/            # AppError, error codes
│   │   ├── responses/         # Standardized API responses
│   │   └── middleware/        # Auth middleware (consumer, developer, admin)
│   ├── plugins/               # Fastify plugins (CORS, Helmet, etc.)
│   ├── routes/                # API route modules
│   │   ├── health/
│   │   ├── marketplace/       # Consumer routes (old notebook browse + new engine)
│   │   ├── studio/            # Developer routes (old notebooks)
│   │   ├── admin/             # NEW — Admin routes (endpoints, base models)
│   │   ├── consumer/          # NEW — Consumer execution routes
│   │   ├── developer/         # NEW — Developer tars model routes
│   │   ├── public/            # Unauthenticated routes
│   │   └── webhooks/          # External webhooks
│   ├── engine/                # NEW — RunPod execution engine module
│   │   ├── index.ts           # Public API (createEngine factory)
│   │   ├── runpod-client.ts   # RunPod HTTP wrapper
│   │   ├── input-merger.ts    # Merges user inputs + developer config
│   │   ├── types.ts           # Engine types
│   │   ├── errors.ts          # Engine error classes
│   │   └── __tests__/         # Engine unit tests
│   ├── services/              # External service clients (firebase)
│   ├── lib/                   # Shared libraries (prisma, storage)
│   ├── repositories/          # Data access layer
│   ├── shared/                # Shared types, schemas, utils
│   ├── app.ts                 # Fastify app factory
│   └── server.ts              # Entry point
├── tests/                     # Integration tests
├── docs/
│   └── archive/               # Old docs (notebook-era, for reference only)
├── docker-compose.yml         # Local PostgreSQL
└── package.json
```

---

## Database Schema

### Active Tables

| Table              | Purpose                                     | Status                              |
| ------------------ | ------------------------------------------- | ----------------------------------- |
| `consumers`        | End users (Firebase Project A)              | ✅ Active                           |
| `developers`       | AI devs (Firebase Project B)                | ✅ Active                           |
| `runpod_endpoints` | RunPod endpoints deployed by platform       | 🆕 New                              |
| `base_models`      | AI capabilities devs can build on           | 🆕 New                              |
| `tars_models`      | What developers publish (configured models) | 🆕 New                              |
| `executions`       | Job runs by consumers                       | 🆕 New (old mocked version deleted) |
| `purchases`        | Credit purchases                            | ✅ Active                           |
| `payouts`          | Developer withdrawals                       | ✅ Active                           |

### Deprecated Tables (still in DB, will be removed later)

| Table       | Replaced By                   |
| ----------- | ----------------------------- |
| `notebooks` | `base_models` + `tars_models` |

### Table Relationships

```
runpod_endpoints  1──M  base_models     (endpoint powers base models)
base_models       1──M  tars_models     (devs build on base models)
developers        1──M  tars_models     (developer owns their models)
tars_models       1──M  executions      (consumers run tars models)
runpod_endpoints  1──M  executions      (denormalized for quick lookup)
consumers         1──M  executions      (consumer owns their runs)
```

### Key Design: configOverrides

The `tars_models.config_overrides` JSON is how developers customize base models:

```json
{
  "defaultInputs": { "style": "anime" },
  "lockedInputs": { "width": 1024, "height": 1024 },
  "hiddenFields": ["negative_prompt", "guidance_scale"],
  "promptPrefix": "anime style, ",
  "promptSuffix": ", high quality, detailed"
}
```

One SDXL endpoint → powers "Anime Generator," "Logo Maker," "Portrait Studio" — all different developer apps with different configs hitting the same GPU.

---

## Authentication

### Two Firebase Projects (Complete Isolation)

| Firebase Project | User Type  | Route Prefix       | Domain             |
| ---------------- | ---------- | ------------------ | ------------------ |
| `tarsify-users`  | Consumers  | `/api/marketplace` | tarsify.com        |
| `tarsify-devs`   | Developers | `/api/studio`      | studio.tarsify.com |

All protected endpoints require `Authorization: Bearer <firebase-jwt-token>`.

### Admin Auth

Admin routes (`/api/admin/*`) use developer auth + `ADMIN_UIDS` env var check. Only Firebase UIDs in that comma-separated list can access admin endpoints.

---

## GPU Execution (RunPod)

### How It Works

- All GPU work runs on RunPod Serverless. RunPod is invisible to developers and consumers.
- Endpoints deployed via RunPod Hub (1-click) or custom Docker images.
- API: `POST https://api.runpod.ai/v2/{endpointId}/run` (async) or `/runsync` (sync, 30s timeout)
- Auth: `Authorization: Bearer {RUNPOD_API_KEY}`
- Rate limit: 2000 requests per 10 seconds per endpoint
- Cost: per-second billing, $0 when idle (min workers = 0)
- Cold start: 15-50s first run, 3-8s with warm worker

### Execution Flow

```
Consumer clicks Run on "Anime Art Generator"
  → API loads tars_model → base_model → runpod_endpoint
  → Merges user inputs with developer's configOverrides
  → Creates execution row (PENDING)
  → POST to RunPod /run → gets job ID
  → Updates execution (QUEUED)
  → Consumer polls GET /executions/:id
  → API checks RunPod /status/{jobId}
  → When COMPLETED, stores output, returns to consumer
```

### Available RunPod Hub Models

| Hub Repo       | Category | Base Model Name    | Endpoint Status           |
| -------------- | -------- | ------------------ | ------------------------- |
| Chatterbox TTS | AUDIO    | Text to Speech     | ✅ Live: `9ib1e8vvtjxrwh` |
| SDXL           | IMAGE    | Image Generator    | ⏳ Deploy next            |
| Faster Whisper | AUDIO    | Speech to Text     | ⏳ Deploy next            |
| vLLM           | TEXT     | AI Chat / Text Gen | ⏳ Deploy next            |
| ComfyUI        | IMAGE    | Pro Image Studio   | 🔮 Later                  |
| Mochi 1        | VIDEO    | Video Generator    | 🔮 Later                  |

---

## Coding Conventions

### File Structure Per Route Module

```
routes/
└── module-name/
    ├── index.ts              # Re-exports
    ├── module.schemas.ts     # Zod schemas + JSON schemas + types
    ├── module.service.ts     # Business logic (NO Fastify imports)
    ├── module.controller.ts  # Request handlers (Fastify req/reply)
    ├── module.routes.ts      # Route definitions
    └── module.test.ts        # Tests
```

### Naming Conventions

| Type             | Convention             | Example                       |
| ---------------- | ---------------------- | ----------------------------- |
| Files            | kebab-case             | `tars-model.service.ts`       |
| Functions        | camelCase              | `getTarsModelById()`          |
| Classes          | PascalCase             | `AppError`                    |
| Constants        | UPPER_SNAKE            | `ERROR_CODES`                 |
| Types/Interfaces | PascalCase             | `TarsModelResponse`           |
| Zod schemas      | camelCase + Schema     | `createTarsModelSchema`       |
| JSON schemas     | camelCase + JsonSchema | `tarsModelResponseJsonSchema` |
| Route handlers   | camelCase + Handler    | `createTarsModelHandler`      |
| Services         | camelCase + Service    | `tarsModelService`            |

### Import Style

```typescript
// ✅ Path aliases
import { prisma } from '@/lib/prisma';
import { AppError } from '@/core/errors';

// ❌ Deep relative imports
import { prisma } from '../../../lib/prisma';
```

### ESM Only

```typescript
// ✅ ESM
import { something } from './module';

// ❌ Never
const { something } = require('./module');
```

### Service Pattern

Services contain business logic. No Fastify imports. Return `{ data: ... }`.

```typescript
export const tarsModelService = {
  async create(
    input: CreateTarsModelInput
  ): Promise<{ data: TarsModelResponse }> {
    const model = await prisma.tarsModel.create({ data: input });
    return { data: model };
  },
};
```

### Controller Pattern

Controllers validate with Zod, call services, send responses.

```typescript
export async function createTarsModelHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const parseResult = createTarsModelSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid input', 400);
  }
  const result = await tarsModelService.create(parseResult.data);
  createResponse(reply).created(result.data);
}
```

### Error Handling

```typescript
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';

throw new AppError(ERROR_CODES.NOT_FOUND, 'Model not found', 404);
```

### Reference Files

When building new modules, follow patterns in these existing files:

| Task                   | Reference                                               |
| ---------------------- | ------------------------------------------------------- |
| Route module structure | `src/routes/studio/notebooks/`                          |
| Auth middleware        | `src/core/middleware/auth/developerAuth.ts`             |
| Consumer auth          | `src/core/middleware/auth/consumerAuth.ts`              |
| Zod + JSON schemas     | `src/routes/marketplace/notebooks/notebooks.schemas.ts` |
| Service with Prisma    | `src/routes/studio/notebooks/notebook.service.ts`       |
| Controller handlers    | `src/routes/studio/notebooks/notebook.controller.ts`    |
| Route definitions      | `src/routes/studio/notebooks/notebook.routes.ts`        |
| Tests                  | `src/routes/studio/notebooks/notebook.test.ts`          |
| Error classes          | `src/core/errors/AppError.ts`                           |
| API responses          | `src/core/responses/ApiResponse.ts`                     |

---

## Environment Variables

```bash
# Server
NODE_ENV=development
PORT=8080

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/tarsify

# Firebase (Consumers)
FIREBASE_USERS_PROJECT_ID=tarsify-users
FIREBASE_USERS_PRIVATE_KEY=
FIREBASE_USERS_CLIENT_EMAIL=

# Firebase (Developers)
FIREBASE_DEVS_PROJECT_ID=tarsify-devs
FIREBASE_DEVS_PRIVATE_KEY=
FIREBASE_DEVS_CLIENT_EMAIL=

# RunPod
RUNPOD_API_KEY=
ADMIN_UIDS=your_firebase_uid

# GCP (API Backend)
GCP_PROJECT_ID=tarsify-dev
GCS_NOTEBOOKS_BUCKET=tarsify-dev-notebooks
GCS_OUTPUTS_BUCKET=tarsify-dev-outputs

# RunPod Endpoint IDs (for seeding)
RUNPOD_EP_TTS=9ib1e8vvtjxrwh
RUNPOD_EP_SDXL=qr7wla851k3zrz
RUNPOD_EP_WHISPER=352hhvj1y6v8f6
RUNPOD_EP_VLLM=
```

---

## Domains

| Subdomain          | Service            | Purpose              |
| ------------------ | ------------------ | -------------------- |
| tarsify.com        | Cloud Run (web)    | Consumer marketplace |
| studio.tarsify.com | Cloud Run (studio) | Developer portal     |
| api.tarsify.com    | Cloud Run (api)    | Backend API          |

---

## Quick Commands

```bash
npm run dev              # Start dev server (port 8080)
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run lint             # Lint
npm run typecheck        # Type check
npm run validate         # Typecheck + lint + test
npm run db:generate      # Regenerate Prisma client
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
```

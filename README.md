# Tarsify API

> Backend API for the Tarsify AI Marketplace Platform

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify 5
- **Language:** TypeScript 5
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Firebase Admin SDK (2 projects)
- **Testing:** Vitest
- **Validation:** Zod

## Project Structure

```
tarsify-api/
├── src/
│   ├── config/           # Environment & app configuration
│   │   ├── env.ts        # Environment validation (Zod)
│   │   ├── routes.ts     # Route path constants
│   │   └── constants.ts  # App-wide constants
│   ├── core/             # Core infrastructure
│   │   ├── errors/       # Error classes & codes
│   │   ├── responses/    # Standardized API responses
│   │   └── middleware/   # Global middleware
│   ├── plugins/          # Fastify plugins (CORS, Helmet, etc.)
│   ├── routes/           # API route modules
│   │   ├── health/       # Health check endpoints
│   │   ├── marketplace/  # Consumer routes (Firebase Project A)
│   │   ├── studio/       # Developer routes (Firebase Project B)
│   │   ├── public/       # Unauthenticated routes
│   │   └── webhooks/     # External service webhooks
│   ├── shared/           # Shared utilities
│   │   ├── types/        # TypeScript types
│   │   ├── utils/        # Utility functions
│   │   └── schemas/      # Validation schemas
│   ├── lib/              # External service clients
│   ├── app.ts            # Fastify app factory
│   └── server.ts         # Entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── tests/
│   ├── setup.ts          # Test configuration
│   ├── helpers/          # Test utilities
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
└── docker-compose.yml    # Local development services
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local PostgreSQL)

### Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start PostgreSQL:**

   ```bash
   docker compose up -d postgres
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Generate Prisma client:**

   ```bash
   pnpm db:generate
   ```

5. **Run migrations:**

   ```bash
   pnpm db:migrate
   ```

6. **Start development server:**
   ```bash
   pnpm dev
   ```

The API will be available at `http://localhost:8080`

## Available Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Start development server with hot reload |
| `pnpm build`         | Build for production                     |
| `pnpm start`         | Start production server                  |
| `pnpm test`          | Run tests                                |
| `pnpm test:watch`    | Run tests in watch mode                  |
| `pnpm test:coverage` | Run tests with coverage                  |
| `pnpm lint`          | Lint code                                |
| `pnpm lint:fix`      | Fix lint errors                          |
| `pnpm format`        | Format code with Prettier                |
| `pnpm typecheck`     | Type check without emitting              |
| `pnpm validate`      | Run typecheck, lint, and tests           |
| `pnpm db:generate`   | Generate Prisma client                   |
| `pnpm db:migrate`    | Run database migrations                  |
| `pnpm db:push`       | Push schema to database (dev)            |
| `pnpm db:studio`     | Open Prisma Studio                       |

## API Endpoints

### Health Checks

| Method | Path            | Description                           |
| ------ | --------------- | ------------------------------------- |
| GET    | `/health`       | Basic health check                    |
| GET    | `/health/ready` | Readiness probe (checks dependencies) |
| GET    | `/health/live`  | Liveness probe                        |

### Public (No Auth)

| Method | Path                        | Description              |
| ------ | --------------------------- | ------------------------ |
| GET    | `/api/public/notebooks`     | List published notebooks |
| GET    | `/api/public/notebooks/:id` | Get notebook details     |
| GET    | `/api/public/search`        | Search notebooks         |
| GET    | `/api/public/categories`    | List categories          |

### Marketplace (Consumer Auth - tarsify-users Firebase)

| Method | Path                                    | Description             |
| ------ | --------------------------------------- | ----------------------- |
| POST   | `/api/marketplace/auth/register`        | Create consumer account |
| GET    | `/api/marketplace/auth/me`              | Get current profile     |
| PUT    | `/api/marketplace/auth/profile`         | Update profile          |
| GET    | `/api/marketplace/notebooks`            | Browse notebooks        |
| GET    | `/api/marketplace/notebooks/:id`        | Get notebook details    |
| GET    | `/api/marketplace/notebooks/featured`   | Featured notebooks      |
| GET    | `/api/marketplace/notebooks/categories` | Categories with counts  |
| GET    | `/api/marketplace/notebooks/search`     | Search notebooks        |
| POST   | `/api/marketplace/notebooks/:id/run`    | Run notebook (mock)     |
| GET    | `/api/marketplace/runs`                 | List your runs          |
| GET    | `/api/marketplace/runs/:id`             | Get run details         |
| GET    | `/api/marketplace/credits`              | Get credit balance      |
| GET    | `/api/marketplace/credits/packages`     | Available packages      |
| POST   | `/api/marketplace/credits/purchase`     | Buy credits (mock)      |
| GET    | `/api/marketplace/credits/history`      | Purchase history        |

### Studio (Developer Auth - tarsify-devs Firebase)

| Method | Path                          | Description         |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/studio/auth/me`         | Get current profile |
| POST   | `/api/studio/auth/register`   | Create account      |
| GET    | `/api/studio/notebooks`       | List my notebooks   |
| POST   | `/api/studio/notebooks`       | Create notebook     |
| GET    | `/api/studio/earnings`        | Get earnings        |
| POST   | `/api/studio/payouts/request` | Request payout      |

## Configuration

### Route Names

To change route names (e.g., `/marketplace` to `/consumer`), edit:

- `src/config/routes.ts` - Update `ROUTE_GROUPS`

### Error Codes

All error codes are defined in:

- `src/core/errors/errorCodes.ts`

### Environment Variables

See `.env.example` for all available variables.

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# Run specific test file
pnpm test health.test.ts
```

## Deployment

### Cloud Run

The API is deployed to Cloud Run via Cloud Build:

1. Push to `main` branch
2. Cloud Build runs tests
3. Docker image is built and pushed
4. Deployed to Cloud Run

See `cloudbuild.yaml` for configuration.

### Manual Deployment

```bash
# Build
pnpm build

# Deploy
gcloud run deploy tarsify-api --source .
```

## Architecture Decisions

### Why Fastify?

- Fast performance (important for API)
- Built-in validation support
- Great TypeScript support
- Plugin ecosystem

### Why Separate Firebase Projects?

- Complete isolation between consumers and developers
- Different authentication policies
- Easier management and security

### Why Prisma?

- Type-safe database queries
- Excellent migration system
- Great developer experience

---

## Coding Guidelines & Style

> **IMPORTANT:** Follow these guidelines to maintain consistency across the codebase.

### File Structure Per Route Module

Each route module follows this structure:

```
routes/
└── module-name/
    ├── index.ts           # Re-exports (export { routes } from './routes')
    ├── module.schemas.ts  # Zod schemas + JSON schemas + TypeScript types
    ├── module.service.ts  # Business logic (NO Fastify imports)
    ├── module.controller.ts # Request handlers (Fastify req/reply)
    ├── module.routes.ts   # Route definitions with Fastify schemas
    └── module.test.ts     # Tests for this module
```

**Reference examples:**

- Studio auth: `src/routes/studio/auth/`
- Studio notebooks: `src/routes/studio/notebooks/`
- Marketplace notebooks: `src/routes/marketplace/notebooks/`

### Import Style

```typescript
// ✅ CORRECT - Use path aliases
import { prisma } from '@/lib/prisma';
import { AppError } from '@/core/errors';
import { PAGINATION } from '@/config/constants';

// ❌ WRONG - Relative imports for shared code
import { prisma } from '../../../lib/prisma';
```

### Schema Definition Pattern

```typescript
// module.schemas.ts

import { z } from 'zod';

// 1. Zod schemas for validation
export const createItemSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

// 2. JSON schemas for Fastify serialization
export const itemResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
  },
  required: ['id', 'title'],
} as const;

// 3. TypeScript interfaces for responses
export interface ItemResponse {
  id: string;
  title: string;
}
```

### Service Pattern

```typescript
// module.service.ts
import { prisma } from '@/lib/prisma';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import type { CreateItemInput, ItemResponse } from './module.schemas';

export const moduleService = {
  async createItem(input: CreateItemInput): Promise<{ data: ItemResponse }> {
    const item = await prisma.item.create({ data: input });
    return { data: item };
  },

  async getItem(id: string): Promise<{ data: ItemResponse }> {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Item not found', 404);
    }
    return { data: item };
  },
};
```

### Controller Pattern

```typescript
// module.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { createResponse } from '@/core/responses';
import { AppError } from '@/core/errors';
import { ERROR_CODES } from '@/core/errors/errorCodes';
import { moduleService } from './module.service';
import { createItemSchema, itemIdParamsSchema } from './module.schemas';

export async function createItemHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Validate with Zod
  const parseResult = createItemSchema.safeParse(request.body);
  if (!parseResult.success) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Invalid input', 400, {
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const result = await moduleService.createItem(parseResult.data);
  createResponse(reply).created(result.data);
}
```

### Routes Pattern

```typescript
// module.routes.ts
import type { FastifyInstance } from 'fastify';
import { createItemHandler, getItemHandler } from './module.controller';
import { itemResponseJsonSchema } from './module.schemas';

// Helper for wrapping responses
const wrapInSuccess = (dataSchema: object) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', const: true },
    data: dataSchema,
  },
});

export async function moduleRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', {
    schema: {
      description: 'Create item',
      tags: ['Module'],
      body: {
        /* JSON schema */
      },
      response: {
        201: wrapInSuccess(itemResponseJsonSchema),
        400: errorResponseSchema,
      },
    },
    handler: createItemHandler,
  });
}
```

### Test Pattern

```typescript
// module.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '@/app';

// For schema tests (no DB needed)
import { createItemSchema } from './module.schemas';

describe('Module Schema Tests', () => {
  describe('createItemSchema', () => {
    it('should accept valid input', () => {
      const result = createItemSchema.safeParse({ title: 'Test' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid input', () => {
      const result = createItemSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });
  });
});

// For integration tests (DB required)
const skipDbTests = !process.env.DATABASE_URL;

describe.skipIf(skipDbTests)('Module Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create item', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/module',
      headers: { Authorization: 'Bearer token' },
      payload: { title: 'Test' },
    });
    expect(response.statusCode).toBe(201);
  });
});
```

---

## Common Issues & Solutions

### 1. ESM Import Error in Tests

**Problem:** Using `require()` in test files causes errors:

```
Cannot find module './module.schemas'
```

**Solution:** Use ESM imports at the top of the file:

```typescript
// ❌ WRONG - require() doesn't work in ESM/Vitest
describe('Tests', () => {
  const { schema } = require('./module.schemas');
});

// ✅ CORRECT - Import at top level
import { schema } from './module.schemas';

describe('Tests', () => {
  // use schema here
});
```

### 2. Fastify Schema Validation vs Zod

**Problem:** Where to validate - Fastify JSON schema or Zod?

**Solution:** Use both for different purposes:

- **Fastify JSON schema:** Route-level validation (fast, OpenAPI docs)
- **Zod schema:** Controller-level validation (detailed errors, type inference)

```typescript
// In routes - JSON schema for Fastify
app.post('/', {
  schema: {
    body: jsonSchema, // Fast validation + OpenAPI
  },
  handler: async (request, reply) => {
    // In controller - Zod for detailed validation
    const result = zodSchema.safeParse(request.body);
  },
});
```

### 3. Missing Export in Index File

**Problem:** New module not found when importing.

**Solution:** Always update the index.ts barrel export:

```typescript
// src/routes/marketplace/index.ts
import { newModuleRoutes } from './new-module';

export async function marketplaceRoutes(app: FastifyInstance) {
  await app.register(newModuleRoutes, { prefix: '/new-module' });
}
```

### 4. Prisma Type Errors After Schema Change

**Problem:** TypeScript errors after updating `schema.prisma`.

**Solution:** Regenerate the Prisma client:

```bash
pnpm db:generate
```

### 5. Firebase Mock Not Working in Tests

**Problem:** Tests fail with Firebase auth errors.

**Solution:** Reset mock before tests:

```typescript
import { firebaseAdmin } from '@/services/firebase';

beforeAll(async () => {
  process.env.FIREBASE_MOCK = 'true';
  firebaseAdmin.resetToMock();
  await firebaseAdmin.initialize();
});
```

### 6. Response Schema Mismatch

**Problem:** Fastify throws serialization errors.

**Solution:** Ensure response matches JSON schema exactly:

```typescript
// JSON schema says required: ['id', 'title']
// Response must have both:
return { id: item.id, title: item.title }; // ✅
return { id: item.id }; // ❌ Missing title
```

---

## Reference Files

When stuck, reference these well-structured files:

| Task                    | Reference File                                          |
| ----------------------- | ------------------------------------------------------- |
| **New route module**    | `src/routes/studio/notebooks/`                          |
| **Auth middleware**     | `src/core/middleware/auth/developerAuth.ts`             |
| **Consumer auth**       | `src/core/middleware/auth/consumerAuth.ts`              |
| **Zod + JSON schemas**  | `src/routes/marketplace/notebooks/notebooks.schemas.ts` |
| **Service with Prisma** | `src/routes/studio/notebooks/notebook.service.ts`       |
| **Controller handlers** | `src/routes/studio/notebooks/notebook.controller.ts`    |
| **Route definitions**   | `src/routes/studio/notebooks/notebook.routes.ts`        |
| **Integration tests**   | `src/routes/studio/notebooks/notebook.test.ts`          |
| **Schema unit tests**   | `src/routes/studio/auth/auth.schemas.test.ts`           |
| **Error handling**      | `src/core/errors/AppError.ts`                           |
| **API responses**       | `src/core/responses/ApiResponse.ts`                     |
| **Consumer config**     | `src/config/consumer.ts`                                |
| **Constants**           | `src/config/constants.ts`                               |

---

## Naming Conventions

| Type             | Convention             | Example                      |
| ---------------- | ---------------------- | ---------------------------- |
| Files            | kebab-case             | `notebook.service.ts`        |
| Functions        | camelCase              | `getNotebookById()`          |
| Classes          | PascalCase             | `AppError`                   |
| Constants        | UPPER_SNAKE            | `ERROR_CODES`                |
| Types/Interfaces | PascalCase             | `NotebookResponse`           |
| Zod schemas      | camelCase + Schema     | `createNotebookSchema`       |
| JSON schemas     | camelCase + JsonSchema | `notebookResponseJsonSchema` |
| Route handlers   | camelCase + Handler    | `createNotebookHandler`      |
| Services         | camelCase + Service    | `notebookService`            |

---

## Consumer-Friendly Display Config

Technical terms are abstracted in `src/config/consumer.ts`:

| Internal  | Consumer Display |
| --------- | ---------------- |
| `T4`      | Standard         |
| `L4`      | Fast             |
| `A100`    | Premium          |
| `H100`    | Ultra            |
| `image`   | Image & Photos   |
| `text`    | Text & Writing   |
| `pending` | Queued           |
| `running` | Processing       |

To change consumer-facing names, edit `src/config/consumer.ts` only.

## License

UNLICENSED - Proprietary

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

### Marketplace (Consumer Auth)

| Method | Path                                 | Description         |
| ------ | ------------------------------------ | ------------------- |
| GET    | `/api/marketplace/auth/me`           | Get current profile |
| POST   | `/api/marketplace/auth/register`     | Create account      |
| GET    | `/api/marketplace/credits`           | Get credit balance  |
| POST   | `/api/marketplace/credits/purchase`  | Buy credits         |
| POST   | `/api/marketplace/notebooks/:id/run` | Run a notebook      |
| GET    | `/api/marketplace/executions`        | List executions     |

### Studio (Developer Auth)

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

## License

UNLICENSED - Proprietary

# TASK.md — Phase 3: Engine (RunPod Integration)

> **Repo:** tarsify-api
> **Read first:** `README.md` (project architecture, coding conventions, file patterns)
> **Update after:** `ROADMAP.md` (check off completed items), `API.md` (add new endpoints)
> **Agent:** Complete tasks sequentially. Write tests for every service. Follow existing repo patterns.

## Code Principles

- **Loosely coupled:** Engine module has a clean public interface. Routes import from engine, engine imports from DB. No circular deps.
- **Testable:** Every service has unit tests. Mock external calls (RunPod API). Use dependency injection.
- **Documented:** JSDoc on all public functions. README in `src/engine/`.
- **No hardcoding:** All model configs and endpoints live in DB. Zero code changes to add a new model.
- **Error handling:** Use existing `AppError` + error codes pattern. Never swallow errors. Log context.
- **Follow existing patterns:** Look at `src/routes/studio/notebooks/` for how to structure schemas, services, controllers, routes, and tests. Match the exact same patterns.

---

## TASK 0: Doc & Repo Cleanup

### 0a: Create archive directory and move old docs

```bash
mkdir -p docs/archive
mv INFRA.MD docs/archive/
mv DEVELOPMENT.md docs/archive/
```

Do NOT move `API.md` — it stays in root (client-facing, will be updated).

### 0b: Replace README.md

Replace the current `README.md` with the content from `ARCHITECTURE.md`. Delete the separate `ARCHITECTURE.md` file — README IS the architecture doc.

### 0c: Ensure these files are in repo root

- `README.md` — architecture + coding conventions (permanent)
- `ROADMAP.md` — progress tracker (permanent)
- `TASK.md` — this file (temporary, deleted when phase done)
- `API.md` — client-facing API reference (permanent)

**Done when:** Repo root has the 4 files. Old docs are in `docs/archive/`.

---

## TASK 1: Database Schema Migration

### ⚠️ Critical: Removing Old Execution Model

The current Prisma schema has an `Execution` model and `ExecutionStatus` enum tied to the old notebook system. This was mocked (never real GPU execution) and is no longer needed. Delete it to make room for the new engine `Execution` model.

### 1a: Delete old execution model and enum

In `prisma/schema.prisma`:
1. Delete the `ExecutionStatus` enum entirely
2. Delete the `Execution` model entirely
3. Remove `executions Execution[]` relation from the `Consumer` model
4. Remove `executions Execution[]` relation from the `Notebook` model

Then grep the entire `src/` directory for any code importing or using `Execution` or `ExecutionStatus` from Prisma. Remove or comment out those references. This will likely affect:
- Files in `src/routes/marketplace/` (consumer execution routes)
- Any test files referencing executions
- Shared types that re-export execution types

```bash
npm run db:generate
npm run typecheck   # fix any broken imports
npm run test         # remove/fix broken tests that reference old Execution
```

Old execution-related tests can be deleted — they tested mocked functionality that no longer exists.

### 1b: Add new engine enums

```prisma
enum EndpointSource {
  HUB
  CUSTOM
}

enum ModelCategory {
  IMAGE
  AUDIO
  TEXT
  VIDEO
  DOCUMENT
}

enum OutputType {
  IMAGE
  AUDIO
  TEXT
  FILE
  JSON
}

enum TarsModelStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum EngineExecutionStatus {
  PENDING
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  TIMED_OUT
  CANCELLED
}
```

### 1c: Add RunpodEndpoint table

```prisma
model RunpodEndpoint {
  id                String    @id @default(uuid()) @db.Uuid
  runpodEndpointId  String    @unique @map("runpod_endpoint_id")
  name              String    @db.VarChar(100)
  source            EndpointSource @default(HUB)
  dockerImage       String?   @map("docker_image")
  gpuType           String    @map("gpu_type") @db.VarChar(50)
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  baseModels        BaseModel[]
  executions        Execution[]

  @@map("runpod_endpoints")
}
```

### 1d: Add BaseModel table

```prisma
model BaseModel {
  id                String    @id @default(uuid()) @db.Uuid
  endpointId        String    @map("endpoint_id") @db.Uuid
  endpoint          RunpodEndpoint @relation(fields: [endpointId], references: [id])
  slug              String    @unique @db.VarChar(100)
  name              String    @db.VarChar(200)
  description       String?   @db.Text
  category          ModelCategory
  inputSchema       Json      @map("input_schema")
  outputType        OutputType @map("output_type")
  outputFormat      String    @map("output_format") @db.VarChar(20)
  estimatedSeconds  Int       @default(30) @map("estimated_seconds")
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  tarsModels        TarsModel[]

  @@map("base_models")
}
```

### 1e: Add TarsModel table

```prisma
model TarsModel {
  id                String    @id @default(uuid()) @db.Uuid
  developerId       String    @map("developer_id") @db.Uuid
  developer         Developer @relation(fields: [developerId], references: [id])
  baseModelId       String    @map("base_model_id") @db.Uuid
  baseModel         BaseModel @relation(fields: [baseModelId], references: [id])
  title             String    @db.VarChar(200)
  slug              String    @unique @db.VarChar(200)
  description       String?   @db.Text
  configOverrides   Json?     @map("config_overrides")
  status            TarsModelStatus @default(DRAFT)
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  publishedAt       DateTime? @map("published_at")

  executions        Execution[]

  @@map("tars_models")
  @@index([developerId])
  @@index([status])
}
```

**Note:** Add `tarsModels TarsModel[]` relation to the existing `Developer` model.

### 1f: Add new Execution table

```prisma
model Execution {
  id                String    @id @default(uuid()) @db.Uuid
  consumerId        String    @map("consumer_id") @db.Uuid
  consumer          Consumer  @relation(fields: [consumerId], references: [id])
  tarsModelId       String    @map("tars_model_id") @db.Uuid
  tarsModel         TarsModel @relation(fields: [tarsModelId], references: [id])
  endpointId        String    @map("endpoint_id") @db.Uuid
  endpoint          RunpodEndpoint @relation(fields: [endpointId], references: [id])
  status            EngineExecutionStatus @default(PENDING)
  runpodJobId       String?   @unique @map("runpod_job_id")
  inputPayload      Json?     @map("input_payload")
  outputPayload     Json?     @map("output_payload")
  errorMessage      String?   @map("error_message") @db.Text
  errorCode         String?   @map("error_code") @db.VarChar(50)
  createdAt         DateTime  @default(now()) @map("created_at")
  completedAt       DateTime? @map("completed_at")
  executionTimeMs   Int?      @map("execution_time_ms")

  @@map("executions")
  @@index([consumerId, createdAt(sort: Desc)])
  @@index([tarsModelId])
  @@index([status])
  @@index([runpodJobId])
}
```

Add `executions Execution[]` to the Consumer model (the old notebook execution relation was deleted in 1a).

### 1g: Run migration

```bash
npx prisma migrate dev --name remove_old_execution_add_engine_tables
npm run db:generate
npm run test
```

**Done when:** Migration succeeds. All old + new tables in Prisma Studio. All tests pass.

---

## TASK 2: Engine Module Structure

Create `src/engine/` with files from the architecture. See README.md for coding conventions.

```
src/engine/
├── index.ts              # Public API (createEngine factory)
├── runpod-client.ts      # RunPod HTTP wrapper
├── input-merger.ts       # Merge user inputs + developer config
├── types.ts              # Engine types (SubmitJobInput, JobHandle, etc.)
├── errors.ts             # Engine error classes
├── README.md             # Module documentation
└── __tests__/
    ├── runpod-client.test.ts
    ├── input-merger.test.ts
    └── engine.test.ts
```

Create types.ts and errors.ts with the interfaces/classes described above.

**Done when:** Files compile. `npm run typecheck` passes.

---

## TASK 3: RunPod Client

**File:** `src/engine/runpod-client.ts`

HTTP wrapper for RunPod Serverless API. Constructor takes `apiKey` and optional `baseUrl`.

Methods:
- `submitJob(endpointId, input)` → POST `/{endpointId}/run`
- `submitJobSync(endpointId, input)` → POST `/{endpointId}/runsync`
- `getJobStatus(endpointId, jobId)` → GET `/{endpointId}/status/{jobId}`
- `cancelJob(endpointId, jobId)` → POST `/{endpointId}/cancel/{jobId}`

Requirements:
- Auth: `Authorization: Bearer {apiKey}`
- Retry on 5xx: 2 retries, 1s delay between
- Throw `RunPodError` on non-2xx (after retries exhausted)
- Log: method, endpointId, jobId, statusCode, duration
- Helper function mapping RunPod status → EngineExecutionStatus

Tests: mock fetch, test submit/status/cancel, retry logic, error handling.

**Done when:** All tests pass.

---

## TASK 4: Input Merger

**File:** `src/engine/input-merger.ts`

Pure function `mergeInputs(userInputs, configOverrides)` → merged payload.

Rules (in order):
1. Start with user inputs
2. Apply `defaultInputs` for fields user didn't provide
3. Override with `lockedInputs` (user can't change)
4. Remove `hiddenFields`
5. Wrap `prompt` field with `promptPrefix`/`promptSuffix` if present

Tests: all merge scenarios, null/empty config, prompt wrapping, edge cases.

**Done when:** All tests pass.

---

## TASK 5: Engine Core

**File:** `src/engine/index.ts`

`createEngine(prisma, runpodApiKey)` factory returns:
- `submitJob(input)` → JobHandle
- `getJobStatus(executionId, consumerId)` → JobResult
- `cancelJob(executionId, consumerId)` → void

Key behaviors:
- submitJob: load model chain from DB → merge inputs → create execution → call RunPod → return handle
- getJobStatus: check DB cache first (terminal = return immediately) → else poll RunPod → update DB
- cancelJob: verify ownership → call RunPod cancel → update DB
- All methods verify ownership (consumerId matches execution)

Tests: mock Prisma + RunPod client. Test full flows.

**Done when:** All tests pass. Engine works in isolation.

---

## TASK 6: Admin Routes

**Directory:** `src/routes/admin/endpoints/` and `src/routes/admin/base-models/`

Follow existing route module pattern exactly (look at `src/routes/studio/notebooks/`).

### Admin auth middleware
`src/core/middleware/auth/adminAuth.ts` — developer auth + `ADMIN_UIDS` env var check.

### Endpoint routes
```
POST   /api/admin/endpoints          — create
GET    /api/admin/endpoints          — list (include base model count)
PATCH  /api/admin/endpoints/:id      — update
DELETE /api/admin/endpoints/:id      — soft delete
```

### Base model routes
```
POST   /api/admin/base-models        — create (validate endpoint, slug, inputSchema)
GET    /api/admin/base-models        — list (include endpoint info)
PATCH  /api/admin/base-models/:id    — update
DELETE /api/admin/base-models/:id    — soft delete
```

**Done when:** CRUD works via curl/Postman. Tests pass.

---

## TASK 7: Developer Tars Model Routes

**Directory:** `src/routes/developer/tars-models/`

Use existing developer auth middleware.

```
GET    /api/developer/base-models           — list active base models (read-only, for browsing)
POST   /api/developer/tars-models           — create
GET    /api/developer/tars-models           — list own
GET    /api/developer/tars-models/:id       — get (verify ownership)
PATCH  /api/developer/tars-models/:id       — update (if status→PUBLISHED, set publishedAt)
DELETE /api/developer/tars-models/:id       — archive
```

**Done when:** Full CRUD + publish flow works. Tests pass.

---

## TASK 8: Consumer / Execution Routes

### Marketplace (`src/routes/marketplace/models/`)

```
GET    /api/marketplace/models              — list PUBLISHED tars_models (paginate, filter by category)
GET    /api/marketplace/models/:slug        — detail + processed input_schema
```

Processed input_schema = base model schema minus hiddenFields, with defaults applied and locked fields marked readOnly.

### Executions (`src/routes/consumer/executions/`)

Use existing consumer auth middleware.

```
POST   /api/marketplace/models/:slug/run    — engine.submitJob()
GET    /api/consumer/executions/:id         — engine.getJobStatus()
GET    /api/consumer/executions             — list own (recent first, paginated)
POST   /api/consumer/executions/:id/cancel  — engine.cancelJob()
```

**Done when:** Full end-to-end loop works. Tests pass.

---

## TASK 9: Seed Script

**File:** `src/scripts/seed-engine.ts`

Seed RunPod endpoints + base models. Use env vars for real endpoint IDs, placeholders for missing ones.

Seed at minimum:
1. Chatterbox TTS endpoint + Text to Speech base model
2. SDXL endpoint + Image Generator base model (placeholder if no endpoint ID)

Package.json script: `"seed:engine": "tsx src/scripts/seed-engine.ts"`

**Done when:** Seed runs. Data visible in Prisma Studio.

---

## TASK 10: Wire Together

1. Init engine in `src/app.ts`
2. Register all new route modules
3. Add env vars to `.env.example`
4. Run `npm run validate` — all tests pass (old AND new)

**Done when:** `npm run validate` passes cleanly.

---

## TASK 11: Update API.md

Add all new endpoints to `API.md` following the existing format:
- Admin: endpoint CRUD, base model CRUD
- Developer: base model browse, tars model CRUD + publish
- Consumer: marketplace browse, run, poll, cancel

Include request/response JSON examples for every endpoint.

**Done when:** API.md is complete and accurate.

---

## Task Dependencies

```
Task 0  (cleanup)           → first
Task 1  (DB schema)         → after 0
Task 2  (engine structure)  → after 1
Task 3  (RunPod client)     → after 2
Task 4  (input merger)      → after 2
Task 5  (engine core)       → after 3, 4
Task 6  (admin routes)      → after 1
Task 7  (developer routes)  → after 1
Task 8  (consumer routes)   → after 5, 7
Task 9  (seed script)       → after 1
Task 10 (wire together)     → after all
Task 11 (API.md)            → after 6, 7, 8
```
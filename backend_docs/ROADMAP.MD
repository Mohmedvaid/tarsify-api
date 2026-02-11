# Tarsify API — Roadmap

> Track progress here. Update checkboxes after each task is completed.
> Current task details are in `TASK.md` (temporary, replaced each phase).

---

## Phase 1: Core Infrastructure ✅

- [x] Fastify 5 + TypeScript + ESM setup
- [x] Path aliases (`@/` → `src/`)
- [x] Prisma ORM + PostgreSQL + Docker Compose
- [x] Zod validation schemas
- [x] Error handling (`AppError`, error codes)
- [x] Structured logging (pino)
- [x] Health check endpoints
- [x] Test setup (Vitest) — 221 tests passing

## Phase 2: Studio Auth & Notebooks ✅

- [x] Firebase Admin SDK (dual project)
- [x] Developer auth middleware
- [x] Developer registration, profile, update
- [x] Notebook CRUD (create, read, update, delete)
- [x] Notebook file upload/download/delete (GCS)
- [x] Notebook publish/unpublish workflow
- [x] Notebook validation (.ipynb structure)
- [x] Consumer auth middleware
- [x] Marketplace notebook browse (mock)
- [x] Consumer runs/credits (mock)

## Phase 3: Engine — RunPod Integration ← CURRENT

> **Task doc:** `TASK.md`
> **What:** Real GPU execution via RunPod Serverless. Dynamic model catalog. Admin, developer, and consumer APIs.

- [ ] **Task 0:** Doc cleanup — archive old docs, set up new doc structure
- [ ] **Task 1:** Database migration — delete old Execution model, add engine tables (runpod_endpoints, base_models, tars_models, executions)
- [ ] **Task 2:** Engine module structure — types, errors, directory
- [ ] **Task 3:** RunPod client — HTTP wrapper with retry, status mapping
- [ ] **Task 4:** Input merger — merge user inputs with developer configOverrides
- [ ] **Task 5:** Engine core — submitJob, getJobStatus, cancelJob
- [ ] **Task 6:** Admin routes — CRUD for endpoints and base models
- [ ] **Task 7:** Developer routes — tars model create, configure, publish
- [ ] **Task 8:** Consumer routes — marketplace browse, run models, poll status
- [ ] **Task 9:** Seed script — initial data for dev/testing
- [ ] **Task 10:** Wire together — register routes, env vars, E2E test
- [ ] **Task 11:** Update API.md with all new endpoints

## Phase 4: Deploy & Test with Real RunPod

- [ ] Deploy SDXL endpoint on RunPod Hub
- [ ] Deploy Faster Whisper endpoint on RunPod Hub
- [ ] Deploy vLLM endpoint on RunPod Hub
- [ ] Seed all base models with real endpoint IDs
- [ ] End-to-end test: admin seed → developer publish → consumer run → get result
- [ ] Deploy to Cloud Run (staging)
- [ ] Configure Secret Manager with RunPod API key

## Phase 5: Studio Frontend — Tars Models

- [ ] Update tarsify-studio from notebook UI to tars model UI
- [ ] Developer browses base models (GET /api/developer/base-models)
- [ ] Developer creates tars model (picks base, configures, brands)
- [ ] Developer publishes tars model
- [ ] Developer views their published models

## Phase 6: Consumer Frontend — Marketplace

- [ ] Update tarsify-web from notebook browse to tars model marketplace
- [ ] Consumer browses published tars models
- [ ] Consumer views model detail + input form (dynamic from input_schema)
- [ ] Consumer runs model, sees loading spinner, gets result
- [ ] Consumer views execution history

## Phase 7: Credits & Billing

- [ ] Credit hold on submit, capture on success, refund on failure
- [ ] Stripe integration for credit purchases
- [ ] Developer earnings tracking (70/30 split)
- [ ] Payout system
- [ ] Add credit_holds and developer_earnings tables

## Phase 8: Production Polish

- [ ] Rate limiting on all routes
- [ ] CORS locked down
- [ ] Error responses sanitized (no stack traces)
- [ ] Auto-retry on RunPod failures (max 2)
- [ ] Execution timeout handling
- [ ] Stale execution cleanup job
- [ ] Monitoring and alerting

## Phase 9: Growth Features 🔮

- [ ] Reviews & ratings
- [ ] Search (PostgreSQL full-text)
- [ ] Developer analytics dashboard
- [ ] Super admin dashboard UI
- [ ] Custom model upload (Path B — dedicated RunPod endpoints)
- [ ] Warm pools for popular models
- [ ] Webhook notifications on job completion

---

## Decisions Log

| Date       | Decision                                      | Context                                    |
| ---------- | --------------------------------------------- | ------------------------------------------ |
| 2026-01-19 | Use Fastify 5 over Express                    | Performance, TypeScript support, plugins   |
| 2026-01-19 | Two Firebase projects for auth isolation       | Consumers and developers fully separated   |
| 2026-01-20 | GCS for file storage (not local filesystem)    | Cloud Run is ephemeral                     |
| 2026-02-11 | Switch from notebooks to RunPod engine         | Real GPU execution, marketplace model      |
| 2026-02-11 | RunPod Serverless over GCP GPUs                | Simpler, cheaper, no infra management      |
| 2026-02-11 | Shared endpoints for MVP (not dedicated)       | One SDXL endpoint serves all dev apps      |
| 2026-02-11 | No warm pools for MVP                          | Accept 15-50s cold starts                  |
| 2026-02-11 | Dynamic model catalog (DB, not code)           | Add models via admin API, zero deploys     |
| 2026-02-11 | 3-file doc system (ARCHITECTURE + ROADMAP + TASK) | Agent-friendly, no doc sprawl           |
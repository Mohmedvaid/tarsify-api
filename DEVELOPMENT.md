# Tarsify API - Development Guide

> Last Updated: January 27, 2026

---

## 📍 Current Status

| Phase   | Status         | Description             |
| ------- | -------------- | ----------------------- |
| Phase 1 | ✅ Done        | Core Infrastructure     |
| Phase 2 | ✅ Done        | Studio Auth & Notebooks |
| Phase 3 | 🔄 In Progress | MVP Polish & Deploy     |
| Phase 4 | ⏳ Next        | Marketplace Core        |
| Phase 5 | 🔮 Future      | Production Launch       |
| Phase 6 | 🔮 Future      | Growth Features         |

---

## ✅ Phase 1: Core Infrastructure (DONE)

- [x] Fastify 5 + TypeScript + ESM setup
- [x] Path aliases (`@/` → `src/`)
- [x] Prisma ORM + PostgreSQL
- [x] Zod validation schemas
- [x] Error handling (`AppError`, error codes)
- [x] Structured logging (pino)
- [x] Health check endpoints
- [x] Docker Compose for local DB
- [x] Test setup (Vitest)

---

## ✅ Phase 2: Studio Auth & Notebooks (DONE)

### Authentication

- [x] Firebase Admin SDK integration
- [x] Real Firebase auth (removed mock dependency)
- [x] Developer auth middleware
- [x] `POST /api/studio/auth/register` - Register developer
- [x] `GET /api/studio/auth/me` - Get profile
- [x] `PUT /api/studio/auth/profile` - Update profile

### Notebooks

- [x] `GET /api/studio/notebooks` - List notebooks
- [x] `POST /api/studio/notebooks` - Create notebook
- [x] `GET /api/studio/notebooks/:id` - Get notebook
- [x] `PUT /api/studio/notebooks/:id` - Update notebook
- [x] `DELETE /api/studio/notebooks/:id` - Delete notebook
- [x] `POST /api/studio/notebooks/:id/file` - Upload .ipynb
- [x] `GET /api/studio/notebooks/:id/file` - Download .ipynb
- [x] `DELETE /api/studio/notebooks/:id/file` - Delete file
- [x] `POST /api/studio/notebooks/:id/publish` - Publish
- [x] `POST /api/studio/notebooks/:id/unpublish` - Unpublish
- [x] Notebook validation (cells, nbformat)
- [x] Draft → Published workflow

---

## 🔄 Phase 3: MVP Polish & Deploy (IN PROGRESS)

### Auth Finalization

- [x] Remove mock auth mode
- [x] Configure real Firebase credentials
- [ ] Test full auth flow with frontend
- [ ] Handle registration edge cases

### Pre-Deploy Checklist

- [ ] Verify `FIREBASE_MOCK=false` enforced
- [ ] Test with real Firebase tokens
- [ ] Database connection pooling
- [ ] Rate limiting on auth endpoints
- [ ] CORS origins restricted
- [ ] Error responses sanitized (no stack traces)
- [ ] Logging level set to `info`

### Storage

- [x] GCS bucket created (`tarsify-studio-notebooks`)
- [x] Service account with least-privilege access
- [x] Local dev using service account key
- [x] `src/lib/storage.ts` rewritten for GCS

### Deployment

- [ ] Deploy to Cloud Run (staging)
- [ ] Configure Secret Manager
- [ ] Set up Cloud SQL
- [ ] Attach storage service account to Cloud Run
- [ ] Domain configuration (api.tarsify.com)
- [ ] SSL/TLS verification

---

## ⏳ Phase 4: Marketplace Core (NEXT)

### Consumer Auth

- [ ] Consumer auth middleware
- [ ] `POST /api/marketplace/auth/register`
- [ ] `GET /api/marketplace/auth/me`
- [ ] `PUT /api/marketplace/auth/profile`

### Browse Notebooks

- [ ] `GET /api/marketplace/notebooks` - Browse published
- [ ] `GET /api/marketplace/notebooks/:id` - Notebook details
- [ ] `GET /api/marketplace/notebooks/featured`
- [ ] `GET /api/marketplace/notebooks/categories`
- [ ] Filter by category, tier
- [ ] Sort by popular, newest, price

### Run Notebooks (Mock)

- [ ] `POST /api/marketplace/notebooks/:id/run`
- [ ] `GET /api/marketplace/runs`
- [ ] `GET /api/marketplace/runs/:id`
- [ ] Credit deduction logic

### Credits (Mock)

- [ ] `GET /api/marketplace/credits`
- [ ] `GET /api/marketplace/credits/packages`
- [ ] `POST /api/marketplace/credits/purchase`
- [ ] `GET /api/marketplace/credits/history`

---

## 🔮 Phase 5: Production Launch (FUTURE)

### Real GPU Execution

- [ ] RunPod/Modal integration
- [ ] Queue management
- [ ] Output file handling
- [ ] Execution time tracking
- [ ] Error recovery

### Payments

- [ ] Stripe integration for credits
- [ ] Payment webhooks
- [ ] Receipt generation
- [ ] Refund handling

### Developer Payouts

- [ ] Stripe Connect setup
- [ ] Earnings tracking
- [ ] Payout scheduling
- [ ] Tax documentation

### Analytics

- [ ] `GET /api/studio/analytics` - Views, runs
- [ ] `GET /api/studio/earnings` - Revenue
- [ ] Developer dashboard data

---

## 🔮 Phase 6: Growth Features (FUTURE)

- [ ] Reviews & ratings system
- [ ] Favorites/collections
- [ ] Real search (PostgreSQL full-text or Elasticsearch)
- [ ] Notifications
- [ ] Admin panel
- [ ] Webhooks for run completion
- [ ] GraphQL API (optional)

---

## 🔒 Security Checklist

### Authentication

- [x] Mock auth disabled in production (enforced in code)
- [x] Firebase tokens properly verified
- [ ] Token expiration checked
- [ ] Rate limiting on auth endpoints

### API Security

- [x] Input validation on all endpoints (Zod)
- [x] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention in user input
- [ ] Request size limits

### Infrastructure

- [ ] HTTPS only (Cloud Run default)
- [x] Security headers (Helmet.js)
- [ ] Database credentials rotated
- [ ] Secrets in Secret Manager (not .env)

### Pre-Deploy Verification

```bash
# Verify no mock mode in production config
if grep -q "FIREBASE_MOCK=true" .env.production 2>/dev/null; then
  echo "ERROR: Mock mode enabled in production!"
  exit 1
fi
```

---

## 🧪 Testing

### Current Coverage

- **221 tests passing**
- **17 skipped** (require DB connection)
- **0 failing**

### Test Commands

```bash
npm test              # Run all tests
npm run test:coverage # With coverage report
npm run test:watch    # Watch mode
```

### Test Structure

- `src/**/*.test.ts` - Unit/integration tests
- `tests/unit/` - Shared unit tests
- `tests/integration/` - Full integration tests

---

## 📝 Session Notes

### January 27, 2026

- Removed Firebase mock mode
- Fixed Firebase Admin SDK initialization
- Fixed private key parsing from env vars
- Consolidated documentation (removed PROGRESS.md, TODO_CLEANUP.md)

### January 22, 2026

- Added comprehensive coding guidelines to README
- Created PROGRESS.md with full tracking
- All 221 tests passing

### January 21, 2026

- Added search endpoint with mock implementation
- Created comprehensive test suite for marketplace modules
- Fixed ESM import issues in tests

### January 20, 2026

- Implemented marketplace notebooks browse
- Implemented consumer auth module
- Implemented runs/credits modules (mock)

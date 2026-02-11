# TARSIFY - Infrastructure Documentation

> Last Updated: January 19, 2026
>
> **Domain:** tarsify.com
> **Tagline:** "AI at your service."

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Repository Structure](#repository-structure)
4. [GCP Services](#gcp-services)
5. [Architecture Diagram](#architecture-diagram)
6. [Authentication System](#authentication-system)
7. [Database Schema](#database-schema)
8. [API Structure](#api-structure)
9. [Domain & DNS](#domain--dns)
10. [Deployment Strategy](#deployment-strategy)
11. [Cost Estimates](#cost-estimates)
12. [Setup Checklist](#setup-checklist)

---

## Overview

Tarsify is an AI marketplace platform where:

- **Developers (Sellers)** upload and monetize AI notebooks/mini-apps
- **Consumers (Buyers)** browse, purchase credits, and run AI notebooks
- Platform provides GPU infrastructure via warm pools and on-demand scaling

Similar to Amazon Marketplace but for AI applications, with simpler UX than Hugging Face for non-technical users.

---

## Tech Stack

| Layer                    | Technology                       | Purpose                           |
| ------------------------ | -------------------------------- | --------------------------------- |
| **Frontend (Consumer)**  | Next.js + TypeScript             | SSR for SEO, consumer marketplace |
| **Frontend (Developer)** | Next.js + TypeScript             | SSR for SEO, developer studio     |
| **Backend**              | Node.js + TypeScript             | Central API for both platforms    |
| **Database**             | PostgreSQL (Cloud SQL)           | Primary data store                |
| **Authentication**       | Firebase Auth (2 projects)       | Separate user pools               |
| **File Storage**         | GCS (`tarsify-studio-notebooks`) | Notebooks stored in GCS bucket    |
| **Hosting**              | Cloud Run                        | All 3 services (scale to zero)    |
| **DNS**                  | Cloud DNS                        | Domain management                 |
| **Secrets**              | Secret Manager                   | API keys, credentials             |
| **Container Registry**   | Artifact Registry                | Docker images                     |
| **CI/CD**                | Cloud Build                      | Automated deployments             |

---

## Repository Structure

Three independent repositories:

```
GitHub:
├── tarsify-api/        # Backend (Node.js)
├── tarsify-web/        # Consumer site (tarsify.com)
└── tarsify-studio/     # Developer portal (studio.tarsify.com)
```

### tarsify-api

```
tarsify-api/
├── src/
│   ├── routes/
│   │   ├── consumer/          # Consumer-specific endpoints
│   │   │   ├── auth.ts
│   │   │   ├── notebooks.ts
│   │   │   ├── credits.ts
│   │   │   └── purchases.ts
│   │   ├── developer/         # Developer-specific endpoints
│   │   │   ├── auth.ts
│   │   │   ├── notebooks.ts
│   │   │   ├── earnings.ts
│   │   │   └── payouts.ts
│   │   └── public/            # No auth required
│   │       ├── notebooks.ts
│   │       └── search.ts
│   ├── middleware/
│   │   ├── consumerAuth.ts    # Firebase Project A verification
│   │   └── developerAuth.ts   # Firebase Project B verification
│   ├── services/
│   ├── config/
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── Dockerfile
├── cloudbuild.yaml
└── package.json
```

### tarsify-web

```
tarsify-web/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Homepage
│   │   ├── explore/           # Browse notebooks
│   │   ├── notebook/[id]/     # Individual notebook page
│   │   ├── account/           # User settings
│   │   └── checkout/          # Credit purchase
│   ├── components/
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   └── firebase.ts        # Firebase Project A config
│   └── types/
├── Dockerfile
├── cloudbuild.yaml
└── package.json
```

### tarsify-studio

```
tarsify-studio/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── notebooks/         # Manage notebooks
│   │   │   ├── page.tsx       # List notebooks
│   │   │   ├── new/           # Create notebook
│   │   │   └── [id]/          # Edit notebook
│   │   ├── analytics/         # Views, usage stats
│   │   ├── earnings/          # Revenue tracking
│   │   ├── payouts/           # Payment settings
│   │   └── settings/          # Developer profile
│   ├── components/
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   └── firebase.ts        # Firebase Project B config
│   └── types/
├── Dockerfile
├── cloudbuild.yaml
└── package.json
```

---

## GCP Services

### Services Used

| Service               | Purpose                 | Tier                    |
| --------------------- | ----------------------- | ----------------------- |
| **Cloud Run**         | Host all 3 applications | Scale to zero           |
| **Cloud SQL**         | PostgreSQL database     | db-f1-micro             |
| **Cloud Storage**     | File storage            | Standard                |
| **Cloud DNS**         | Domain management       | Standard                |
| **Firebase Auth**     | Authentication          | Free tier (x2 projects) |
| **Secret Manager**    | Credentials storage     | Free tier               |
| **Artifact Registry** | Docker images           | Free tier               |
| **Cloud Build**       | CI/CD pipelines         | Free tier (120 min/day) |

### Services NOT Used (Yet)

| Service             | Why Skip                          |
| ------------------- | --------------------------------- |
| Memorystore (Redis) | Use in-memory caching for MVP     |
| Cloud CDN           | Cloud Run has built-in caching    |
| Cloud Armor         | Not needed until traffic grows    |
| Load Balancer       | Included with Cloud Run           |
| GKE                 | Overkill, Cloud Run is sufficient |
| Pub/Sub             | Direct API calls for MVP          |
| Cloud Tasks         | Handle async in application       |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLOUD DNS                                  │
│                                                                         │
│   tarsify.com ────────────► Cloud Run (web)                            │
│   studio.tarsify.com ─────► Cloud Run (studio)                         │
│   api.tarsify.com ────────► Cloud Run (api)                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             CLOUD RUN                                   │
│                                                                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│   │                 │  │                 │  │                 │       │
│   │   web           │  │   studio        │  │   api           │       │
│   │   (Next.js)     │  │   (Next.js)     │  │   (Node.js)     │       │
│   │                 │  │                 │  │                 │       │
│   │   Consumer      │  │   Developer     │  │   Backend       │       │
│   │   Marketplace   │  │   Portal        │  │   API           │       │
│   │                 │  │                 │  │                 │       │
│   │   Scale: 0-3    │  │   Scale: 0-3    │  │   Scale: 0-5    │       │
│   │   Memory: 512Mi │  │   Memory: 512Mi │  │   Memory: 512Mi │       │
│   │                 │  │                 │  │                 │       │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘       │
│            │                    │                    │                 │
│            │   Firebase Auth    │   Firebase Auth    │                 │
│            │   Project A        │   Project B        │                 │
│            │   (Consumers)      │   (Developers)     │                 │
│            │                    │                    │                 │
└────────────┼────────────────────┼────────────────────┼─────────────────┘
             │                    │                    │
             └────────────────────┼────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                   │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                        CLOUD SQL                                │  │
│   │                        PostgreSQL                               │  │
│   │                        db-f1-micro                              │  │
│   │                                                                 │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│   │   │ consumers   │  │ developers  │  │ notebooks   │           │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘           │  │
│   │                                                                 │  │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│   │   │ purchases   │  │ payouts     │  │ executions  │           │  │
│   │   └─────────────┘  └─────────────┘  └─────────────┘           │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      CLOUD STORAGE                              │  │
│   │                                                                 │  │
│   │   ┌─────────────────────┐  ┌─────────────────┐  ┌───────────┐  │  │
│   │   │ tarsify-studio-     │  │ models          │  │ outputs   │  │  │
│   │   │ notebooks ✅        │  │ bucket          │  │ bucket    │  │  │
│   │   └─────────────────────┘  └─────────────────┘  └───────────┘  │  │
│   │                                                                 │  │
│   │   Service Account: tarsify-api-storage@tarsify-studio...       │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                      SECRET MANAGER                             │  │
│   │                                                                 │  │
│   │   DATABASE_URL │ JWT_SECRET │ STRIPE_KEY │ RUNPOD_KEY          │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication System

### Two Separate Firebase Projects

| Firebase Project | Purpose                  | Used By            |
| ---------------- | ------------------------ | ------------------ |
| `tarsify-users`  | Consumer authentication  | tarsify.com        |
| `tarsify-devs`   | Developer authentication | studio.tarsify.com |

### Why Separate?

- Developers cannot log into consumer site with same credentials
- Consumers cannot log into developer studio with same credentials
- Completely isolated user pools
- Separate Firebase consoles for management

### Auth Flow - Consumer

```
1. User visits tarsify.com
2. Clicks "Sign In"
3. Firebase Project A handles authentication
4. Returns JWT token (signed by Project A)
5. Frontend stores token
6. API calls to /consumer/* include token
7. Backend verifies token with Firebase Admin SDK (Project A)
8. Backend looks up user in "consumers" table
```

### Auth Flow - Developer

```
1. Developer visits studio.tarsify.com
2. Clicks "Sign In"
3. Firebase Project B handles authentication
4. Returns JWT token (signed by Project B)
5. Frontend stores token
6. API calls to /developer/* include token
7. Backend verifies token with Firebase Admin SDK (Project B)
8. Backend looks up user in "developers" table
```

### Firebase Configuration

**Consumer Frontend (tarsify-web):**

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tarsify-users.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tarsify-users
```

**Developer Frontend (tarsify-studio):**

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tarsify-devs.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tarsify-devs
```

**Backend (tarsify-api):**

```
# Both Firebase Admin SDK configs
FIREBASE_USERS_PROJECT_ID=tarsify-users
FIREBASE_USERS_PRIVATE_KEY=xxx
FIREBASE_DEVS_PROJECT_ID=tarsify-devs
FIREBASE_DEVS_PRIVATE_KEY=xxx
```

---

## Database Schema

### Tables Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL                              │
│                                                                 │
│   consumers              developers            notebooks        │
│   ─────────              ──────────            ─────────        │
│   id                     id                    id               │
│   firebase_uid           firebase_uid          developer_id     │
│   email                  email                 title            │
│   name                   name                  description      │
│   avatar_url             avatar_url            price_credits    │
│   credits_balance        earnings_balance      gpu_type         │
│   created_at             payout_email          status           │
│   updated_at             stripe_account_id     created_at       │
│                          verified              updated_at       │
│                          created_at                             │
│                          updated_at                             │
│                                                                 │
│   purchases              executions            payouts          │
│   ─────────              ──────────            ───────          │
│   id                     id                    id               │
│   consumer_id            consumer_id           developer_id     │
│   credits_amount         notebook_id           amount           │
│   amount_paid            status                status           │
│   stripe_payment_id      gpu_used              stripe_payout_id │
│   created_at             credits_charged       created_at       │
│                          started_at                             │
│                          completed_at                           │
│                          output_url                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Table Definitions

**consumers**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firebase_uid | VARCHAR | Firebase Project A user ID |
| email | VARCHAR | User email |
| name | VARCHAR | Display name |
| avatar_url | VARCHAR | Profile picture |
| credits_balance | INTEGER | Available credits |
| created_at | TIMESTAMP | Account creation |
| updated_at | TIMESTAMP | Last update |

**developers**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firebase_uid | VARCHAR | Firebase Project B user ID |
| email | VARCHAR | Developer email |
| name | VARCHAR | Display name |
| avatar_url | VARCHAR | Profile picture |
| earnings_balance | INTEGER | Pending earnings (cents) |
| payout_email | VARCHAR | PayPal/Stripe email |
| stripe_account_id | VARCHAR | Stripe Connect ID |
| verified | BOOLEAN | Identity verified |
| created_at | TIMESTAMP | Account creation |
| updated_at | TIMESTAMP | Last update |

**notebooks**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| developer_id | UUID | FK to developers |
| title | VARCHAR | Notebook title |
| description | TEXT | Full description |
| short_description | VARCHAR | Card preview text |
| thumbnail_url | VARCHAR | Preview image |
| price_credits | INTEGER | Credits per run |
| gpu_type | ENUM | T4, L4, A100, H100 |
| category | VARCHAR | Image, Text, Video, Audio |
| status | ENUM | draft, published, archived |
| total_runs | INTEGER | Usage counter |
| average_rating | DECIMAL | User ratings |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

**purchases** (credit purchases by consumers)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| consumer_id | UUID | FK to consumers |
| credits_amount | INTEGER | Credits purchased |
| amount_paid | INTEGER | Amount in cents |
| stripe_payment_id | VARCHAR | Stripe payment ID |
| created_at | TIMESTAMP | Purchase date |

**executions** (notebook runs)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| consumer_id | UUID | FK to consumers |
| notebook_id | UUID | FK to notebooks |
| status | ENUM | pending, running, completed, failed |
| gpu_used | VARCHAR | Actual GPU allocated |
| credits_charged | INTEGER | Credits deducted |
| started_at | TIMESTAMP | Execution start |
| completed_at | TIMESTAMP | Execution end |
| output_url | VARCHAR | Result file URL |
| error_message | TEXT | Error if failed |

**payouts** (developer withdrawals)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| developer_id | UUID | FK to developers |
| amount | INTEGER | Payout amount (cents) |
| status | ENUM | pending, processing, completed, failed |
| stripe_payout_id | VARCHAR | Stripe payout ID |
| created_at | TIMESTAMP | Request date |
| completed_at | TIMESTAMP | Completion date |

---

## API Structure

### Base URL

```
https://api.tarsify.com
```

### Endpoints

**Public (No Auth)**

```
GET  /api/marketplace/notebooks              # List published notebooks (PUBLIC)
GET  /api/marketplace/notebooks/:id          # Get notebook details (PUBLIC)
GET  /api/marketplace/notebooks/featured     # Featured notebooks (PUBLIC)
GET  /api/marketplace/notebooks/categories   # Categories with counts (PUBLIC)
GET  /api/marketplace/notebooks/search?q=    # Search notebooks (PUBLIC)
GET  /api/marketplace/credits/packages       # Credit packages (PUBLIC)
```

**Consumer / Marketplace (Firebase Project A - tarsify-users)**

```
# Authentication
POST /api/marketplace/auth/register      # Create consumer record after Firebase signup
GET  /api/marketplace/auth/me            # Get current consumer profile
PUT  /api/marketplace/auth/profile       # Update profile

# Credits
GET  /api/marketplace/credits            # Get credit balance
POST /api/marketplace/credits/purchase   # Buy credits (mock - will integrate Stripe)
GET  /api/marketplace/credits/history    # Purchase history

# Runs (Notebook Execution)
POST /api/marketplace/notebooks/:id/run  # Execute a notebook (mock)
GET  /api/marketplace/runs               # List my runs
GET  /api/marketplace/runs/:id           # Get run status/result
```

**Developer / Studio (Firebase Project B - tarsify-devs)**

```
# Authentication
POST /api/studio/auth/register              # Create developer record
GET  /api/studio/auth/me                    # Get current developer profile
PUT  /api/studio/auth/profile               # Update profile
POST /api/studio/auth/complete-profile      # Complete profile setup

# Notebooks
GET    /api/studio/notebooks                # List my notebooks
POST   /api/studio/notebooks                # Create notebook (metadata)
GET    /api/studio/notebooks/:id            # Get notebook details
PUT    /api/studio/notebooks/:id            # Update notebook metadata
DELETE /api/studio/notebooks/:id            # Delete notebook

# Notebook File Operations
POST   /api/studio/notebooks/:id/file       # Upload .ipynb file
GET    /api/studio/notebooks/:id/file       # Download .ipynb file
DELETE /api/studio/notebooks/:id/file       # Remove file

# Publishing
POST /api/studio/notebooks/:id/publish      # Publish notebook
POST /api/studio/notebooks/:id/unpublish    # Unpublish notebook

# Coming Soon
GET  /api/studio/analytics                  # Overall stats
GET  /api/studio/earnings                   # Earnings summary
POST /api/studio/payouts/request            # Request payout
```

**Webhooks**

```
POST /webhooks/stripe               # Stripe payment events (planned)
POST /webhooks/runpod               # GPU job completion (planned)
```

---

## Domain & DNS

### Domain Structure

| Subdomain          | Service            | Purpose              |
| ------------------ | ------------------ | -------------------- |
| tarsify.com        | Cloud Run (web)    | Consumer marketplace |
| studio.tarsify.com | Cloud Run (studio) | Developer portal     |
| api.tarsify.com    | Cloud Run (api)    | Backend API          |

### Cloud DNS Setup

```
Zone: tarsify.com

Records:
─────────
A     tarsify.com           → Cloud Run web (managed)
A     studio.tarsify.com    → Cloud Run studio (managed)
A     api.tarsify.com       → Cloud Run api (managed)
```

Cloud Run handles SSL certificates automatically.

---

## Deployment Strategy

### CI/CD Flow

Each repository has independent deployment:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   tarsify-api                                                    │
│   ───────────                                                   │
│   Push to main                                                  │
│       │                                                         │
│       ├── Run tests                                             │
│       ├── Build Docker image                                    │
│       ├── Push to Artifact Registry                             │
│       └── Deploy to Cloud Run (api)                             │
│                                                                 │
│   tarsify-web                                                    │
│   ───────────                                                   │
│   Push to main                                                  │
│       │                                                         │
│       ├── Run tests                                             │
│       ├── Build Docker image                                    │
│       ├── Push to Artifact Registry                             │
│       └── Deploy to Cloud Run (web)                             │
│                                                                 │
│   tarsify-studio                                                 │
│   ──────────────                                                │
│   Push to main                                                  │
│       │                                                         │
│       ├── Run tests                                             │
│       ├── Build Docker image                                    │
│       ├── Push to Artifact Registry                             │
│       └── Deploy to Cloud Run (studio)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cloud Build Trigger Setup

| Trigger       | Repository     | Branch | Action              |
| ------------- | -------------- | ------ | ------------------- |
| deploy-api    | tarsify-api    | main   | Deploy to Cloud Run |
| deploy-web    | tarsify-web    | main   | Deploy to Cloud Run |
| deploy-studio | tarsify-studio | main   | Deploy to Cloud Run |

### Environment Strategy

```
Development:
────────────
• Local machines
• Local PostgreSQL or Cloud SQL (dev instance)
• Firebase emulators (optional)

Production:
───────────
• Cloud Run services
• Cloud SQL (production instance)
• Firebase Auth (live)
```

For MVP, single environment (production) is fine. Add staging later.

---

## Cost Estimates

### Monthly Costs (MVP Stage)

| Service            | Tier                         | Cost             |
| ------------------ | ---------------------------- | ---------------- |
| Cloud Run (web)    | Scale to zero, 0-3 instances | $0-3             |
| Cloud Run (studio) | Scale to zero, 0-3 instances | $0-3             |
| Cloud Run (api)    | Scale to zero, 0-5 instances | $0-5             |
| Cloud SQL          | db-f1-micro                  | $9               |
| Cloud Storage      | Standard, <10GB              | $0-2             |
| Cloud DNS          | 1 zone                       | $0.20            |
| Firebase Auth      | Free tier (x2)               | $0               |
| Secret Manager     | <10 secrets                  | $0               |
| Artifact Registry  | <500MB                       | $0               |
| Cloud Build        | <120 min/day                 | $0               |
| **Total**          |                              | **$10-25/month** |

### Cloud Run Settings (Cost Optimized)

```
All Services:
─────────────
Min instances:        0          # Scale to zero
Max instances:        3-5        # Cap runaway costs
CPU:                  1          # Minimum
Memory:               512Mi      # Enough for Node/Next
CPU allocation:       Request    # Pay only when active
Concurrency:          80         # Handle multiple requests
Timeout:              60s        # Reasonable default
```

### Scaling Costs

| Traffic        | Cloud Run | Cloud SQL     | Total |
| -------------- | --------- | ------------- | ----- |
| Just testing   | $0        | $9            | ~$10  |
| 100 users/day  | $5-10     | $9            | ~$20  |
| 1000 users/day | $20-30    | $9            | ~$35  |
| 5000 users/day | $50-100   | $26 (upgrade) | ~$100 |

---

## Setup Checklist

### Phase 1: GCP Project Setup

```
□ Create GCP Project: tarsify
□ Enable billing
□ Enable APIs:
    □ Cloud Run
    □ Cloud SQL Admin
    □ Cloud Storage
    □ Cloud DNS
    □ Artifact Registry
    □ Secret Manager
    □ Cloud Build
    □ Firebase
```

### Phase 2: Firebase Setup

```
□ Create Firebase Project A: tarsify-users
    □ Enable Email/Password auth
    □ Enable Google auth
    □ Generate Admin SDK credentials

□ Create Firebase Project B: tarsify-devs
    □ Enable Email/Password auth
    □ Enable Google auth
    □ Generate Admin SDK credentials
```

### Phase 3: Database Setup

```
□ Create Cloud SQL instance (db-f1-micro)
□ Create database: marketplace
□ Create database user
□ Save connection string to Secret Manager
```

### Phase 4: Storage Setup ✅ DONE

```
✓ Created bucket: tarsify-studio-notebooks (us-central1)
✓ Created service account: tarsify-api-storage@tarsify-studio.iam.gserviceaccount.com
✓ Granted roles/storage.objectAdmin (bucket-level only)
✓ Generated service account key for local dev: secrets/gcs-service-account.json
✓ Implemented GCS integration in src/lib/storage.ts
□ Create bucket: tarsify-studio-models (when needed)
□ Create bucket: tarsify-studio-outputs (when needed)
```

#### Storage Security Model

| Environment | Authentication Method                                         |
| ----------- | ------------------------------------------------------------- |
| Local Dev   | Service account JSON key (`secrets/gcs-service-account.json`) |
| Cloud Run   | Workload Identity (attach service account to Cloud Run)       |

The service account only has access to the notebooks bucket, not project-wide permissions.

### Phase 5: Domain Setup

```
□ Register domain (or use existing)
□ Create Cloud DNS zone
□ Update domain registrar nameservers
□ Verify DNS propagation
```

### Phase 6: Secrets Setup

```
□ DATABASE_URL
□ JWT_SECRET
□ STRIPE_SECRET_KEY
□ STRIPE_WEBHOOK_SECRET
□ RUNPOD_API_KEY
□ FIREBASE_USERS_CREDENTIALS
□ FIREBASE_DEVS_CREDENTIALS
```

### Phase 7: Repository Setup

```
□ Create tarsify-api repository
□ Create tarsify-web repository
□ Create tarsify-studio repository
□ Add Dockerfiles to each
□ Add cloudbuild.yaml to each
```

### Phase 8: Artifact Registry

```
□ Create Docker repository: tarsify
```

### Phase 9: Cloud Run Services

```
□ Deploy api service
    □ Map api.tarsify.com
□ Deploy web service
    □ Map tarsify.com
□ Deploy studio service
    □ Map studio.tarsify.com
```

### Phase 10: Cloud Build Triggers

```
□ Create trigger: deploy-api
□ Create trigger: deploy-web
□ Create trigger: deploy-studio
□ Test each trigger
```

---

## Environment Variables

### Backend (tarsify-api)

```
NODE_ENV=production
PORT=8080

# Database
DATABASE_URL=postgresql://user:pass@/tarsify?host=/cloudsql/project:region:instance

# Firebase Admin (Consumers)
FIREBASE_USERS_PROJECT_ID=tarsify-users
FIREBASE_USERS_PRIVATE_KEY=xxx
FIREBASE_USERS_CLIENT_EMAIL=xxx

# Firebase Admin (Developers)
FIREBASE_DEVS_PROJECT_ID=tarsify-devs
FIREBASE_DEVS_PRIVATE_KEY=xxx
FIREBASE_DEVS_CLIENT_EMAIL=xxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# RunPod
RUNPOD_API_KEY=xxx

# GCP
GCP_PROJECT_ID=tarsify-studio
GOOGLE_APPLICATION_CREDENTIALS=secrets/gcs-service-account.json  # Local dev only
GCS_NOTEBOOKS_BUCKET=tarsify-studio-notebooks
GCS_MODELS_BUCKET=tarsify-studio-models
GCS_OUTPUTS_BUCKET=tarsify-studio-outputs
```

### Frontend - Web (tarsify-web)

```
NEXT_PUBLIC_API_URL=https://api.tarsify.com
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tarsify-users.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tarsify-users
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Frontend - Studio (tarsify-studio)

```
NEXT_PUBLIC_API_URL=https://api.tarsify.com
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tarsify-devs.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tarsify-devs
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

---

## Future Considerations

### When to Upgrade

| Trigger                    | Action                           |
| -------------------------- | -------------------------------- |
| DB > 500MB or slow queries | Upgrade Cloud SQL to db-g1-small |
| Need caching               | Add Memorystore (Redis)          |
| High API traffic           | Increase Cloud Run min instances |
| Need GPU warm pool         | Add GKE with GPU node pools      |
| Global users               | Add Cloud CDN                    |
| Security concerns          | Add Cloud Armor                  |

### GPU Infrastructure (Phase 2)

```
Future Architecture:
────────────────────
Cloud Run (api)
    │
    ├── Quick jobs ──► RunPod Serverless
    │
    └── Heavy jobs ──► GKE + GPU Node Pools
                       ├── Warm pool (T4/L4)
                       └── On-demand (A100/H100)
```

---

## Quick Reference

### GCP Console Links

```
Cloud Run:        console.cloud.google.com/run
Cloud SQL:        console.cloud.google.com/sql
Cloud Storage:    console.cloud.google.com/storage
Cloud DNS:        console.cloud.google.com/net-services/dns
Secret Manager:   console.cloud.google.com/security/secret-manager
Artifact Registry: console.cloud.google.com/artifacts
Cloud Build:      console.cloud.google.com/cloud-build
Firebase:         console.firebase.google.com
```

### CLI Commands

```bash
# Switch project
gcloud config set project tarsify

# View Cloud Run services
gcloud run services list

# View logs
gcloud run services logs read api --region=us-central1

# Deploy manually
gcloud run deploy api --source . --region=us-central1

# Connect to Cloud SQL
gcloud sql connect tarsify-db --user=postgres

# View secrets
gcloud secrets list
```

---

## Support & Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Next.js Documentation](https://nextjs.org/docs)

---

_This document should be updated as the infrastructure evolves._

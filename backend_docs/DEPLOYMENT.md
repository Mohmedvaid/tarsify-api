# Deployment Guide

This document covers the deployment setup for Tarsify Studio.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     On Push to main                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────┐    │
│  │   GitHub Actions    │    │  Firebase App Hosting   │    │
│  │                     │    │                         │    │
│  │  • Lint (ESLint)    │    │  • Build (Next.js)      │    │
│  │  • Type Check (TS)  │    │  • Deploy (Cloud Run)   │    │
│  │  • Unit Tests       │    │                         │    │
│  │  • Security Scan    │    │                         │    │
│  │  • Build Check      │    │                         │    │
│  └─────────────────────┘    └─────────────────────────┘    │
│         (Quality Gates)            (Deployment)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Environments

| Environment | URL                                                                   | Branch |
| ----------- | --------------------------------------------------------------------- | ------ |
| Production  | https://tarsify-studio-backend--tarsify-studio.us-central1.hosted.app | `main` |

## CI/CD Pipeline

### GitHub Actions (Quality Gates)

Located in `.github/workflows/ci.yml`, runs on every push and PR:

1. **Lint** - ESLint + TypeScript type checking
2. **Test** - Vitest unit tests with coverage
3. **Security** - npm audit + TruffleHog secret scanning
4. **Build Check** - Verifies Next.js builds successfully

### Firebase App Hosting (Deployment)

Automatically deploys on push to `main` branch:

- Connected to GitHub repository
- Uses Cloud Build for building
- Deploys to Cloud Run
- Environment variables from `apphosting.yaml`
- Secrets from GCP Secret Manager

## Environment Variables

### Build-time Variables (apphosting.yaml)

```yaml
env:
  - variable: NEXT_PUBLIC_API_URL
    value: https://tarsify-api-rbpbrcyq6q-uc.a.run.app
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: tarsify-studio.firebaseapp.com
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: tarsify-studio
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    secret: firebase-api-key
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    secret: firebase-storage-bucket
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    secret: firebase-messaging-sender-id
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    secret: firebase-app-id
```

### GCP Secret Manager Secrets

| Secret Name                    | Description                  |
| ------------------------------ | ---------------------------- |
| `firebase-api-key`             | Firebase Web API Key         |
| `firebase-storage-bucket`      | Firebase Storage Bucket      |
| `firebase-messaging-sender-id` | Firebase Messaging Sender ID |
| `firebase-app-id`              | Firebase App ID              |

## Initial Setup Steps

### 1. Prerequisites

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud CLI (`gcloud`)
- GitHub repository

### 2. Create GCP Secrets

```bash
# Create secrets in GCP Secret Manager
echo -n "YOUR_API_KEY" | gcloud secrets create firebase-api-key --data-file=- --project=tarsify-studio
echo -n "YOUR_STORAGE_BUCKET" | gcloud secrets create firebase-storage-bucket --data-file=- --project=tarsify-studio
echo -n "YOUR_SENDER_ID" | gcloud secrets create firebase-messaging-sender-id --data-file=- --project=tarsify-studio
echo -n "YOUR_APP_ID" | gcloud secrets create firebase-app-id --data-file=- --project=tarsify-studio
```

### 3. Create Firebase App Hosting Backend

```bash
firebase apphosting:backends:create \
  --project=tarsify-studio \
  --location=us-central1 \
  --backend=tarsify-studio-backend
```

### 4. Connect GitHub Repository

1. Go to [Firebase Console > App Hosting](https://console.firebase.google.com/project/tarsify-studio/apphosting)
2. Click on `tarsify-studio-backend`
3. Go to **Deployment** settings
4. Connect your GitHub repository
5. Select `main` branch
6. Set root directory to `/`
7. Click **Save and deploy**

### 5. Grant Secret Access to Backend

```bash
firebase apphosting:secrets:grantaccess firebase-api-key --backend=tarsify-studio-backend --project=tarsify-studio
firebase apphosting:secrets:grantaccess firebase-storage-bucket --backend=tarsify-studio-backend --project=tarsify-studio
firebase apphosting:secrets:grantaccess firebase-messaging-sender-id --backend=tarsify-studio-backend --project=tarsify-studio
firebase apphosting:secrets:grantaccess firebase-app-id --backend=tarsify-studio-backend --project=tarsify-studio
```

### 6. Configure GitHub Secrets (for CI)

Go to **GitHub > Settings > Secrets and variables > Actions** and add:

| Secret                    | Description                  |
| ------------------------- | ---------------------------- |
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON key     |
| `FIREBASE_WEB_APP_ID`     | Firebase Web App ID          |
| `FIREBASE_TOKEN`          | Firebase CI token (optional) |

### 7. Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions-deploy \
  --project=tarsify-studio \
  --display-name="GitHub Actions Deploy"

# Grant permissions
gcloud projects add-iam-policy-binding tarsify-studio \
  --member="serviceAccount:github-actions-deploy@tarsify-studio.iam.gserviceaccount.com" \
  --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding tarsify-studio \
  --member="serviceAccount:github-actions-deploy@tarsify-studio.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Create key (add to GitHub secrets as GCP_SERVICE_ACCOUNT_KEY)
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions-deploy@tarsify-studio.iam.gserviceaccount.com

# IMPORTANT: Delete the key file after adding to GitHub
rm ~/github-actions-key.json
```

## Deploying

### Automatic Deployment

Push to `main` branch:

```bash
git push origin main
```

This triggers:

1. GitHub Actions CI pipeline (lint, test, security, build check)
2. Firebase App Hosting build and deploy

### Manual Deployment

If needed, trigger a deployment manually:

```bash
git commit --allow-empty -m "chore: trigger deployment" && git push
```

## Monitoring

### Build Logs

- **GitHub Actions**: https://github.com/Mohmedvaid/tarsify-studio/actions
- **Cloud Build**: https://console.cloud.google.com/cloud-build/builds?project=tarsify-studio
- **Firebase App Hosting**: https://console.firebase.google.com/project/tarsify-studio/apphosting

### Application Logs

```bash
gcloud run logs read --project=tarsify-studio --region=us-central1
```

Or view in Cloud Console:
https://console.cloud.google.com/run?project=tarsify-studio

## Troubleshooting

### Build Fails with Secret Access Error

Grant the backend access to secrets:

```bash
firebase apphosting:secrets:grantaccess SECRET_NAME --backend=tarsify-studio-backend --project=tarsify-studio
```

### Check Backend Status

```bash
firebase apphosting:backends:list --project=tarsify-studio
```

### View Secret Manager Secrets

```bash
gcloud secrets list --project=tarsify-studio
```

### Update a Secret Value

```bash
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=- --project=tarsify-studio
```

## Security

- All sensitive values stored in GCP Secret Manager
- Service account with minimal required permissions
- GitHub Actions secrets for CI/CD
- Security scanning with TruffleHog and npm audit
- See [SECURITY.md](../SECURITY.md) for security policy

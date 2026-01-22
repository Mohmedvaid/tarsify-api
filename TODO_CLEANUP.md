# TODO: Pre-Production Cleanup Checklist

> **CRITICAL**: These items MUST be addressed before deploying to production.  
> Last Updated: 2026-01-20

---

## 🔴 High Priority (Security Risk)

### 1. Firebase Mock Authentication

**Location:** `src/services/firebase/mock.ts`  
**Environment Variable:** `FIREBASE_MOCK=true`

**Current Behavior:**

- When `FIREBASE_MOCK=true`, any token in format `Bearer dev_<uid>` is accepted
- No actual Firebase verification is performed
- Any user can impersonate any Firebase UID

**Risk Level:** 🔴 **CRITICAL**

**Why It Exists:**

- Enables local development without Firebase credentials
- Allows testing auth flows without Firebase emulator
- Speeds up development iteration

**Production Fix Required:**

```bash
# .env.production - MUST be set to false or omitted entirely
FIREBASE_MOCK=false
```

**Code Safeguards to Add:**

```typescript
// src/services/firebase/admin.ts - Add production check
if (
  process.env.NODE_ENV === 'production' &&
  process.env.FIREBASE_MOCK === 'true'
) {
  throw new Error('FATAL: Firebase mock mode cannot be enabled in production');
}
```

**Verification Steps:**

1. [ ] Ensure `FIREBASE_MOCK` is NOT set in production environment
2. [ ] Add CI check to verify mock mode is disabled in prod builds
3. [ ] Add startup assertion that fails if mock mode + production
4. [ ] Review all `.env*` files to ensure no mock flags leak to production

---

### 2. Development-Only Error Details

**Location:** `src/core/errors/errorHandler.ts`

**Current Behavior:**

- Stack traces may be exposed in error responses during development

**Risk Level:** 🟡 **Medium**

**Production Fix:**

- Ensure `NODE_ENV=production` suppresses stack traces
- Verify error details don't leak sensitive information

---

## 🟡 Medium Priority (Technical Debt)

### 3. Hardcoded Test Values

**Locations to Review:**

- `src/**/*.test.ts` - Test files may have hardcoded values
- `src/services/firebase/types.ts` - Mock token prefix `dev_`

**Action:** Ensure no test/mock values can be used in production auth flows.

---

### 4. Database Connection Logging

**Location:** `src/lib/prisma.ts`

**Current Behavior:**

- Query logging enabled for debugging

**Production Fix:**

- Set `log: ['error', 'warn']` only in production
- Remove query logging to improve performance

---

### 5. Logger Configuration

**Location:** `src/lib/logger.ts`

**Action:**

- Ensure log level is `info` or higher in production
- Verify no sensitive data (tokens, passwords) is logged

---

## 🟢 Low Priority (Cleanup)

### 6. TODO Comments in Code

Run this command to find all TODO items:

```bash
grep -r "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts"
```

---

### 7. Unused Dependencies

Review `package.json` for any development dependencies that shouldn't be in production.

---

## Pre-Deploy Checklist

Before deploying to production, verify:

- [ ] `FIREBASE_MOCK` is NOT set or is `false`
- [ ] `NODE_ENV` is set to `production`
- [ ] Firebase credentials are properly configured:
  - [ ] `FIREBASE_PROJECT_ID_DEVS` is set
  - [ ] `FIREBASE_PROJECT_ID_USERS` is set
  - [ ] Service account credentials are available
- [ ] Database connection string points to production DB
- [ ] All secrets are managed via Secret Manager (not .env files)
- [ ] Error responses don't expose stack traces
- [ ] Logging level is appropriate for production
- [ ] Rate limiting is properly configured
- [ ] CORS origins are restricted to allowed domains

---

## Security Audit Reminders

### Authentication

- [ ] Mock auth is disabled
- [ ] Firebase tokens are properly verified
- [ ] Token expiration is checked
- [ ] User sessions are properly invalidated

### API Security

- [ ] All endpoints have proper authorization checks
- [ ] Input validation is enforced on all endpoints
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention in user input

### Infrastructure

- [ ] HTTPS only (no HTTP in production)
- [ ] Security headers configured (Helmet.js or equivalent)
- [ ] Database credentials rotated from development
- [ ] Secrets not committed to version control

---

## Automated Checks to Implement

```yaml
# Example CI check for production safety
- name: Verify no mock mode in production
  run: |
    if grep -q "FIREBASE_MOCK=true" .env.production 2>/dev/null; then
      echo "ERROR: Firebase mock mode is enabled in production config!"
      exit 1
    fi
```

---

## Notes

- This document should be reviewed before every production deployment
- Add new items as temporary workarounds are introduced
- Remove items only after they've been properly addressed and verified

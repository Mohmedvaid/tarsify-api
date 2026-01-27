# Frontend Auth Integration Guide

> **For:** Frontend Developer  
> **Backend API Version:** 1.0  
> **Last Updated:** January 27, 2026

This document covers everything needed to integrate frontend authentication with the Tarsify API.

---

## Table of Contents

1. [Firebase Configuration](#firebase-configuration)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Formats](#requestresponse-formats)
5. [Error Codes](#error-codes)
6. [Testing Checklist](#testing-checklist)

---

## Firebase Configuration

### Project Details

| Environment             | Firebase Project | Purpose                  |
| ----------------------- | ---------------- | ------------------------ |
| Studio (Developers)     | `tarsify-studio` | Developer authentication |
| Marketplace (Consumers) | `tarsify-users`  | Consumer authentication  |

### Frontend Firebase Setup

```typescript
// firebase.config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// For Studio (Developer Portal)
const studioConfig = {
  apiKey: 'YOUR_STUDIO_API_KEY',
  authDomain: 'tarsify-studio.firebaseapp.com',
  projectId: 'tarsify-studio',
  // ... other config
};

// For Marketplace (Consumer App)
const marketplaceConfig = {
  apiKey: 'YOUR_MARKETPLACE_API_KEY',
  authDomain: 'tarsify-users.firebaseapp.com',
  projectId: 'tarsify-users',
  // ... other config
};

const app = initializeApp(studioConfig); // or marketplaceConfig
export const auth = getAuth(app);
```

---

## Authentication Flow

### 1. User Signs Up/In with Firebase

```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

// Sign in
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Or sign up
const userCredential = await createUserWithEmailAndPassword(
  auth,
  email,
  password
);
```

### 2. Get Firebase ID Token

```typescript
// Get the ID token to send to backend
const idToken = await userCredential.user.getIdToken();
```

### 3. Register with Backend (First Time Only)

```typescript
// POST /api/studio/auth/register
const response = await fetch('http://localhost:8080/api/studio/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    email: user.email,
    displayName: 'John Doe', // optional
  }),
});
```

### 4. Subsequent API Calls

```typescript
// All authenticated requests need the Bearer token
const response = await fetch('http://localhost:8080/api/studio/auth/me', {
  headers: {
    Authorization: `Bearer ${idToken}`,
  },
});
```

### Token Refresh

Firebase tokens expire after **1 hour**. Use token refresh:

```typescript
import { onIdTokenChanged } from 'firebase/auth';

// Listen for token changes
onIdTokenChanged(auth, async (user) => {
  if (user) {
    const newToken = await user.getIdToken();
    // Update stored token
  }
});

// Or force refresh before API calls
const freshToken = await auth.currentUser?.getIdToken(true);
```

---

## API Endpoints

### Base URL

| Environment       | URL                       |
| ----------------- | ------------------------- |
| Local Development | `http://localhost:8080`   |
| Production        | `https://api.tarsify.com` |

### Studio Auth Endpoints (Developers)

| Method | Endpoint                            | Auth Required               | Description                   |
| ------ | ----------------------------------- | --------------------------- | ----------------------------- |
| `POST` | `/api/studio/auth/register`         | Firebase Token              | Register new developer        |
| `GET`  | `/api/studio/auth/me`               | Firebase Token + Registered | Get current developer profile |
| `PUT`  | `/api/studio/auth/profile`          | Firebase Token + Registered | Update profile                |
| `POST` | `/api/studio/auth/complete-profile` | Firebase Token + Registered | Complete profile setup        |

### Marketplace Auth Endpoints (Consumers)

| Method | Endpoint                         | Auth Required               | Description                  |
| ------ | -------------------------------- | --------------------------- | ---------------------------- |
| `POST` | `/api/marketplace/auth/register` | Firebase Token              | Register new consumer        |
| `GET`  | `/api/marketplace/auth/me`       | Firebase Token + Registered | Get current consumer profile |

---

## Request/Response Formats

### Authorization Header

```
Authorization: Bearer <firebase-id-token>
```

**Important:**

- Must be `Bearer` (case-insensitive, but prefer `Bearer`)
- Single space between `Bearer` and token
- Token must be a valid Firebase ID token

### POST /api/studio/auth/register

**Request:**

```json
{
  "email": "developer@example.com",
  "displayName": "John Doe"
}
```

| Field         | Type   | Required | Validation                                           |
| ------------- | ------ | -------- | ---------------------------------------------------- |
| `email`       | string | ✅ Yes   | Valid email format                                   |
| `displayName` | string | ❌ No    | 2-100 chars, letters/spaces/hyphens/apostrophes only |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firebaseUid": "firebase-uid",
    "email": "developer@example.com",
    "displayName": "John Doe",
    "avatarUrl": null,
    "bio": null,
    "stripeAccountId": null,
    "verified": false,
    "profileComplete": false,
    "createdAt": "2026-01-27T12:00:00.000Z",
    "updatedAt": "2026-01-27T12:00:00.000Z"
  }
}
```

### GET /api/studio/auth/me

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firebaseUid": "firebase-uid",
    "email": "developer@example.com",
    "displayName": "John Doe",
    "avatarUrl": "https://...",
    "bio": null,
    "stripeAccountId": null,
    "verified": false,
    "profileComplete": true,
    "totalEarnings": 0,
    "pendingPayout": 0,
    "notebookCount": 5,
    "createdAt": "2026-01-27T12:00:00.000Z",
    "updatedAt": "2026-01-27T12:00:00.000Z"
  }
}
```

### PUT /api/studio/auth/profile

**Request:**

```json
{
  "displayName": "Jane Doe",
  "avatarUrl": "https://example.com/avatar.png",
  "bio": "Full-stack developer"
}
```

| Field         | Type           | Required | Validation                  |
| ------------- | -------------- | -------- | --------------------------- |
| `displayName` | string         | ❌       | 2-100 chars                 |
| `avatarUrl`   | string \| null | ❌       | Valid URL or null to remove |
| `bio`         | string \| null | ❌       | Max 500 chars               |

**Note:** At least one field must be provided.

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "displayName": "Jane Doe",
    "bio": "Full-stack developer",
    "avatarUrl": "https://example.com/avatar.png",
    "profileComplete": true,
    "updatedAt": "2026-01-27T12:00:00.000Z"
  }
}
```

### POST /api/studio/auth/complete-profile

**Request:**

```json
{
  "displayName": "John Doe",
  "payoutEmail": "payout@example.com",
  "country": "US"
}
```

| Field         | Type   | Required | Validation                                       |
| ------------- | ------ | -------- | ------------------------------------------------ |
| `displayName` | string | ✅ Yes   | 2-100 chars                                      |
| `payoutEmail` | string | ❌ No    | Valid email                                      |
| `country`     | string | ❌ No    | Exactly 2 uppercase letters (ISO 3166-1 alpha-2) |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "displayName": "John Doe",
    "bio": null,
    "avatarUrl": null,
    "profileComplete": true,
    "updatedAt": "2026-01-27T12:00:00.000Z"
  }
}
```

---

## Error Codes

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERR_XXXX",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

### Authentication Errors

| HTTP Status | Error Code | Message                          | Cause                          |
| ----------- | ---------- | -------------------------------- | ------------------------------ |
| 401         | `ERR_2000` | Authorization header required    | Missing `Authorization` header |
| 401         | `ERR_2000` | Authentication failed            | Generic auth failure           |
| 401         | `ERR_2001` | Invalid authentication token     | Malformed or invalid token     |
| 401         | `ERR_2002` | Authentication token has expired | Token expired (>1 hour)        |

### Developer Errors

| HTTP Status | Error Code | Message                                        | Cause                                   |
| ----------- | ---------- | ---------------------------------------------- | --------------------------------------- |
| 404         | `ERR_4000` | Developer not found - registration required    | Firebase user exists but not registered |
| 409         | `ERR_4001` | Developer already registered with this account | Trying to register twice                |
| 409         | `ERR_4002` | Email already in use                           | Email taken by another developer        |

### Validation Errors

| HTTP Status | Error Code | Message                             | Cause                    |
| ----------- | ---------- | ----------------------------------- | ------------------------ |
| 400         | `ERR_1001` | Invalid request body                | Schema validation failed |
| 400         | `ERR_1001` | At least one field must be provided | Empty update request     |

### Validation Error Details

When `ERR_1001` occurs, the `details` field contains specific errors:

```json
{
  "success": false,
  "error": {
    "code": "ERR_1001",
    "message": "Invalid request body",
    "details": {
      "errors": [
        { "field": "email", "message": "Invalid email format" },
        {
          "field": "displayName",
          "message": "Display name contains invalid characters"
        }
      ]
    }
  }
}
```

---

## Testing Checklist

### ✅ Registration Flow

- [ ] New user can register with valid Firebase token
- [ ] Registration fails without auth header → 401 `ERR_2000`
- [ ] Registration fails with invalid token → 401 `ERR_2001`
- [ ] Registration fails if already registered → 409 `ERR_4001`
- [ ] Registration fails with invalid email → 400 `ERR_1001`
- [ ] Registration fails with displayName < 2 chars → 400
- [ ] Registration fails with displayName > 100 chars → 400
- [ ] Registration fails with special chars in displayName → 400

### ✅ Get Profile Flow

- [ ] Can get profile after registration → 200
- [ ] Get profile fails without auth → 401 `ERR_2000`
- [ ] Get profile fails if not registered → 404 `ERR_4000`
- [ ] Response includes `notebookCount` and `totalEarnings`

### ✅ Update Profile Flow

- [ ] Can update displayName → 200
- [ ] Can update avatarUrl → 200
- [ ] Can set avatarUrl to null → 200
- [ ] Update fails with empty body → 400 `ERR_1001`
- [ ] Update fails if not registered → 404 `ERR_4000`
- [ ] Update fails with invalid avatarUrl → 400

### ✅ Complete Profile Flow

- [ ] Can complete profile with displayName → 200
- [ ] Complete fails without displayName → 400
- [ ] Complete fails with invalid country code → 400
- [ ] Complete fails with invalid payoutEmail → 400

### ✅ Token Handling

- [ ] Expired token returns → 401 `ERR_2002`
- [ ] Token refresh works correctly
- [ ] `Bearer` case insensitive (`bearer`, `BEARER` work)

---

## Quick Reference Card

```typescript
// 1. Sign in with Firebase
const { user } = await signInWithEmailAndPassword(auth, email, password);
const token = await user.getIdToken();

// 2. Check if registered
try {
  const me = await fetch('/api/studio/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (me.status === 404) {
    // Not registered, go to registration
  }
} catch (e) {
  /* handle error */
}

// 3. Register if needed
await fetch('/api/studio/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ email: user.email }),
});

// 4. Make authenticated requests
const response = await fetch('/api/studio/notebooks', {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## Contact

Questions about auth integration? Reach out to the backend team.

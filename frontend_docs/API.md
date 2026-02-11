# Tarsify API Documentation

> Version: 1.0.0  
> Base URL: `https://api.tarsify.com` (prod) | `http://localhost:8080` (dev)  
> Last Updated: January 27, 2026

---

## Implementation Status

| Section                 | Status         |
| ----------------------- | -------------- |
| Studio Auth             | ✅ Implemented |
| Studio Notebooks        | ✅ Implemented |
| Studio Analytics        | 🔮 Future      |
| Studio Earnings/Payouts | 🔮 Future      |
| Marketplace Auth        | ⏳ Phase 4     |
| Marketplace Notebooks   | ⏳ Phase 4     |
| Marketplace Runs        | ⏳ Phase 4     |
| Marketplace Credits     | ⏳ Phase 4     |

> **Legend:** ✅ Implemented | ⏳ Planned | 🔮 Future

---

## Table of Contents

1. [Authentication](#authentication)
2. [Response Format](#response-format)
3. [Error Codes](#error-codes)
4. [Rate Limiting](#rate-limiting)
5. [Studio API (Developer)](#studio-api-developer) ✅
   - [Auth Endpoints](#auth-endpoints) ✅
   - [Notebook Endpoints](#notebook-endpoints) ✅
   - [Analytics Endpoints](#analytics-endpoints) 🔮
   - [Earnings Endpoints](#earnings-endpoints) 🔮
   - [Payout Endpoints](#payout-endpoints) 🔮
6. [Marketplace API (Consumer)](#marketplace-api-consumer) ⏳

---

## Authentication

### Firebase JWT Authentication

All protected endpoints require a valid Firebase JWT token in the Authorization header:

```
Authorization: Bearer <firebase-jwt-token>
```

### User Types & Firebase Projects

| User Type | Firebase Project | Route Prefix         | Domain             |
| --------- | ---------------- | -------------------- | ------------------ |
| Developer | `tarsify-studio` | `/api/studio/*`      | studio.tarsify.com |
| Consumer  | `tarsify-users`  | `/api/marketplace/*` | tarsify.com        |

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERR_1001",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

---

## Error Codes

### Authentication Errors (1xxx)

| Code       | HTTP | Message                                |
| ---------- | ---- | -------------------------------------- |
| `ERR_1001` | 401  | Authentication required                |
| `ERR_1002` | 401  | Invalid or expired token               |
| `ERR_1003` | 403  | Insufficient permissions               |
| `ERR_1004` | 404  | User not found - registration required |
| `ERR_1005` | 409  | User already registered                |

### Validation Errors (2xxx)

| Code       | HTTP | Message                  |
| ---------- | ---- | ------------------------ |
| `ERR_2001` | 400  | Invalid request body     |
| `ERR_2002` | 400  | Invalid query parameters |
| `ERR_2003` | 400  | Invalid path parameters  |
| `ERR_2004` | 400  | Missing required field   |

### Resource Errors (3xxx)

| Code       | HTTP | Message                 |
| ---------- | ---- | ----------------------- |
| `ERR_3001` | 404  | Resource not found      |
| `ERR_3002` | 409  | Resource already exists |
| `ERR_3003` | 409  | Resource conflict       |
| `ERR_3004` | 422  | Resource state invalid  |

### Business Logic Errors (4xxx)

| Code       | HTTP | Message                          |
| ---------- | ---- | -------------------------------- |
| `ERR_4001` | 400  | Insufficient credits             |
| `ERR_4002` | 400  | Payout minimum not reached       |
| `ERR_4003` | 400  | Notebook not published           |
| `ERR_4004` | 400  | Cannot modify published notebook |

### Server Errors (5xxx)

| Code       | HTTP | Message               |
| ---------- | ---- | --------------------- |
| `ERR_5001` | 500  | Internal server error |
| `ERR_5002` | 503  | Service unavailable   |
| `ERR_5003` | 504  | Gateway timeout       |

---

## Rate Limiting

| Endpoint Type  | Limit   | Window |
| -------------- | ------- | ------ |
| Public         | 100 req | 1 min  |
| Authenticated  | 200 req | 1 min  |
| Auth endpoints | 10 req  | 1 min  |

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

---

## Studio API (Developer)

Base path: `/api/studio`

All endpoints require **Developer Authentication** unless marked as 🔓 Public.

---

### Auth Endpoints

#### `POST /auth/register`

Create a new developer account after Firebase signup.

**Auth:** Required (Firebase JWT from `tarsify-devs`)

**Request Body:**

```json
{
  "email": "dev@example.com",
  "displayName": "John Doe"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firebaseUid": "firebase_uid",
    "email": "dev@example.com",
    "displayName": "John Doe",
    "avatarUrl": null,
    "bio": null,
    "stripeAccountId": null,
    "verified": false,
    "profileComplete": false,
    "createdAt": "2026-01-20T00:00:00Z",
    "updatedAt": "2026-01-20T00:00:00Z"
  }
}
```

**Errors:**

- `ERR_1005` - Developer already registered with this Firebase UID

---

#### `GET /auth/me`

Get current authenticated developer profile.

**Auth:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firebaseUid": "firebase_uid",
    "email": "dev@example.com",
    "displayName": "John Doe",
    "avatarUrl": "https://...",
    "bio": "AI enthusiast...",
    "stripeAccountId": "acct_xxx",
    "verified": true,
    "profileComplete": true,
    "totalEarnings": 15000,
    "pendingPayout": 2500,
    "notebookCount": 5,
    "createdAt": "2026-01-20T00:00:00Z",
    "updatedAt": "2026-01-20T00:00:00Z"
  }
}
```

**Errors:**

- `ERR_1004` - Developer not found (needs to register)

---

#### `PUT /auth/profile`

Update developer profile.

**Auth:** Required

**Request Body:**

```json
{
  "displayName": "John D.",
  "bio": "AI/ML developer specializing in...",
  "avatarUrl": "https://..."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "displayName": "John D.",
    "bio": "AI/ML developer specializing in...",
    "avatarUrl": "https://...",
    "profileComplete": true,
    "updatedAt": "2026-01-20T00:00:00Z"
  }
}
```

---

#### `POST /auth/complete-profile`

Complete developer profile (first-time setup after registration).

**Auth:** Required

**Request Body:**

```json
{
  "displayName": "John Doe",
  "bio": "AI/ML developer...",
  "payoutEmail": "payout@example.com",
  "country": "US"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "profileComplete": true,
    "updatedAt": "2026-01-20T00:00:00Z"
  }
}
```

---

### Notebook Endpoints

#### `GET /notebooks`

List all notebooks owned by the authenticated developer.

**Auth:** Required

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `status` | enum | all | `draft`, `published`, `archived`, `all` |
| `sort` | string | `-createdAt` | Sort field (prefix `-` for desc) |
| `search` | string | - | Search in title/description |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "AI Image Upscaler",
      "slug": "ai-image-upscaler",
      "description": "Upscale images using AI...",
      "shortDescription": "Upscale images 4x",
      "thumbnailUrl": "https://...",
      "category": "IMAGE_PROCESSING",
      "status": "published",
      "priceCredits": 10,
      "gpuType": "T4",
      "notebookFileUrl": "/api/studio/notebooks/uuid/file",
      "runCount": 1500,
      "rating": 4.8,
      "totalEarnings": 12000,
      "createdAt": "2026-01-20T00:00:00Z",
      "updatedAt": "2026-01-20T00:00:00Z",
      "publishedAt": "2026-01-20T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Note:** `notebookFileUrl` is `null` for notebooks without an uploaded file.

````

---

#### `POST /notebooks`

Create a new notebook (metadata only, draft status).

**Auth:** Required

**Note:** This only creates the notebook metadata. You must upload the `.ipynb` file separately using `POST /notebooks/:id/file`.

**Request Body:**

```json
{
  "title": "AI Image Upscaler",
  "description": "Upscale any image using state-of-the-art AI models...",
  "shortDescription": "Upscale images up to 4x resolution",
  "category": "IMAGE_PROCESSING",
  "gpuType": "T4",
  "priceCredits": 10
}
````

| Field              | Type   | Required | Description                            |
| ------------------ | ------ | -------- | -------------------------------------- |
| `title`            | string | ✅       | Notebook title (3-100 chars)           |
| `description`      | string | ❌       | Full description (markdown supported)  |
| `shortDescription` | string | ❌       | Short tagline (max 200 chars)          |
| `category`         | enum   | ❌       | See categories below                   |
| `gpuType`          | enum   | ❌       | `T4`, `A10G`, `A100` (default: `T4`)   |
| `priceCredits`     | int    | ❌       | Price per run (default: 0, max: 10000) |

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "AI Image Upscaler",
    "slug": "ai-image-upscaler",
    "status": "draft",
    "notebookFileUrl": null,
    "createdAt": "2026-01-20T00:00:00Z"
  }
}
```

---

#### `GET /notebooks/:id`

Get full notebook details.

**Auth:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "AI Image Upscaler",
    "slug": "ai-image-upscaler",
    "description": "Full markdown description...",
    "shortDescription": "Upscale images up to 4x",
    "thumbnailUrl": "https://...",
    "category": "IMAGE_PROCESSING",
    "status": "published",
    "priceCredits": 10,
    "gpuType": "T4",
    "notebookFileUrl": "/api/studio/notebooks/uuid/file",
    "inputSchema": {
      "type": "object",
      "properties": {
        "image": { "type": "string", "format": "uri" },
        "scale": { "type": "integer", "enum": [2, 4] }
      },
      "required": ["image"]
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "resultUrl": { "type": "string", "format": "uri" }
      }
    },
    "runCount": 1500,
    "rating": 4.8,
    "ratingCount": 120,
    "totalEarnings": 12000,
    "createdAt": "2026-01-20T00:00:00Z",
    "updatedAt": "2026-01-20T00:00:00Z",
    "publishedAt": "2026-01-20T00:00:00Z"
  }
}
```

**Note:** `notebookFileUrl` is `null` if no file has been uploaded yet. The URL points to the download endpoint.

---

#### `DELETE /notebooks/:id`

Update notebook details.

**Auth:** Required

**Note:** Some fields cannot be changed after publishing (gpuType, priceCredits). Create a new version instead.

**Request Body:**

```json
{
  "title": "AI Image Upscaler Pro",
  "description": "Updated description...",
  "shortDescription": "Upscale images up to 8x now!",
  "thumbnailUrl": "https://...",
  "category": "IMAGE_PROCESSING"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "AI Image Upscaler Pro",
    "updatedAt": "2026-01-20T00:00:00Z"
  }
}
```

---

#### `DELETE /notebooks/:id`

Delete a notebook (and its uploaded file).

**Auth:** Required

**Note:** Published notebooks are archived instead of deleted. The notebook file is also deleted from storage.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "archived",
    "message": "Notebook archived successfully"
  }
}
```

---

#### `POST /notebooks/:id/file`

Upload a notebook file (.ipynb).

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Request:**

| Field  | Type | Required | Description                  |
| ------ | ---- | -------- | ---------------------------- |
| `file` | file | ✅       | The `.ipynb` file (max 10MB) |

**File Requirements:**

- Must have `.ipynb` extension
- Must be valid JSON
- Must contain `cells` array with at least one code cell
- Must have `metadata` object
- Must have `nbformat` version

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "notebookFileUrl": "/api/studio/notebooks/uuid/file",
    "message": "Notebook file uploaded successfully"
  }
}
```

**Errors:**

- `ERR_2001` - Invalid file type (only .ipynb allowed)
- `ERR_2001` - Invalid notebook structure
- `ERR_2001` - File too large (max 10MB)

**cURL Example:**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@my-notebook.ipynb" \
  https://api.tarsify.com/api/studio/notebooks/uuid/file
```

---

#### `GET /notebooks/:id/file`

Download the notebook file (.ipynb).

**Auth:** Required

**Response:** `200 OK` with file stream

**Headers:**

```
Content-Type: application/x-ipynb+json
Content-Disposition: attachment; filename="notebook-title.ipynb"
```

**Note:** Returns the raw `.ipynb` file content. Use this URL for downloading the notebook.

**Errors:**

- `ERR_3001` - Notebook not found
- `ERR_3001` - No notebook file uploaded yet

---

#### `DELETE /notebooks/:id/file`

Delete only the notebook file (keeps metadata).

**Auth:** Required

**Note:** This removes the uploaded file but keeps the notebook metadata intact. Useful for replacing the notebook file (delete then upload new).

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "notebookFileUrl": null,
    "message": "Notebook file deleted successfully"
  }
}
```

**Errors:**

- `ERR_3001` - No notebook file to delete

---

#### `POST /notebooks/:id/publish`

Publish a draft notebook to the marketplace.

**Auth:** Required

**Prerequisites:**

- Notebook must be in `draft` status
- Must have title, description, shortDescription
- Must have notebook file uploaded (via `POST /notebooks/:id/file`)
- Must have valid inputSchema/outputSchema (if required)

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "published",
    "slug": "ai-image-upscaler",
    "publishedAt": "2026-01-20T00:00:00Z",
    "message": "Notebook published successfully"
  }
}
```

**Errors:**

- `ERR_3004` - Notebook not ready for publishing (missing required fields)
- `ERR_3004` - Missing notebook file

---

#### `POST /notebooks/:id/unpublish`

Unpublish a notebook (remove from marketplace but keep data).

**Auth:** Required

**Note:** Only published notebooks can be unpublished. This reverts the status to `draft`.

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "draft",
    "message": "Notebook unpublished"
  }
}
```

**Errors:**

- `ERR_3004` - Cannot unpublish notebook that is not published

---

### Analytics Endpoints

#### `GET /analytics`

Get overall analytics for the developer.

**Auth:** Required

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | enum | `30d` | `7d`, `30d`, `90d`, `365d`, `all` |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "summary": {
      "totalRuns": 5000,
      "totalEarnings": 45000,
      "avgRating": 4.7,
      "totalReviews": 320
    },
    "trends": {
      "runs": [
        { "date": "2026-01-01", "value": 150 },
        { "date": "2026-01-02", "value": 180 }
      ],
      "earnings": [
        { "date": "2026-01-01", "value": 1500 },
        { "date": "2026-01-02", "value": 1800 }
      ]
    },
    "topNotebooks": [
      {
        "id": "uuid",
        "title": "AI Image Upscaler",
        "runs": 1500,
        "earnings": 12000
      }
    ]
  }
}
```

---

#### `GET /analytics/notebooks/:id`

Get analytics for a specific notebook.

**Auth:** Required

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | enum | `30d` | `7d`, `30d`, `90d`, `365d`, `all` |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "notebookId": "uuid",
    "period": "30d",
    "summary": {
      "totalRuns": 1500,
      "totalEarnings": 12000,
      "avgRuntime": 28,
      "successRate": 98.5,
      "rating": 4.8,
      "reviewCount": 120
    },
    "trends": {
      "runs": [
        { "date": "2026-01-01", "value": 50 },
        { "date": "2026-01-02", "value": 65 }
      ]
    }
  }
}
```

---

### Earnings Endpoints

#### `GET /earnings`

Get earnings summary.

**Auth:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalEarnings": 150000,
    "pendingPayout": 25000,
    "totalPaidOut": 125000,
    "platformFeeRate": 0.2,
    "thisMonth": {
      "gross": 30000,
      "platformFee": 6000,
      "net": 24000
    },
    "lastMonth": {
      "gross": 25000,
      "platformFee": 5000,
      "net": 20000
    }
  }
}
```

---

#### `GET /earnings/history`

Get detailed earnings history.

**Auth:** Required

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 50 | Items per page |
| `from` | date | - | Start date (ISO 8601) |
| `to` | date | - | End date (ISO 8601) |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "notebookId": "uuid",
      "notebookTitle": "AI Image Upscaler",
      "executionId": "uuid",
      "creditsEarned": 10,
      "platformFee": 2,
      "netEarning": 8,
      "createdAt": "2026-01-20T12:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 5000,
    "totalPages": 100
  }
}
```

---

### Payout Endpoints

#### `GET /payouts`

Get payout history.

**Auth:** Required

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `status` | enum | all | `pending`, `processing`, `completed`, `failed`, `all` |

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 50000,
      "status": "completed",
      "stripeTransferId": "tr_xxx",
      "requestedAt": "2026-01-15T00:00:00Z",
      "processedAt": "2026-01-17T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

#### `POST /payouts/request`

Request a payout.

**Auth:** Required

**Prerequisites:**

- Minimum payout amount: 5000 credits ($50)
- Must have Stripe account connected

**Request Body:**

```json
{
  "amount": 25000
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 25000,
    "status": "pending",
    "estimatedArrival": "2026-01-22T00:00:00Z",
    "requestedAt": "2026-01-20T00:00:00Z"
  }
}
```

**Errors:**

- `ERR_4002` - Minimum payout amount not reached
- `ERR_4001` - Insufficient balance

---

#### `POST /payouts/connect-stripe`

Initialize Stripe Connect onboarding.

**Auth:** Required

**Request Body:**

```json
{
  "returnUrl": "https://studio.tarsify.com/settings/payouts",
  "refreshUrl": "https://studio.tarsify.com/settings/payouts?refresh=true"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "onboardingUrl": "https://connect.stripe.com/setup/...",
    "expiresAt": "2026-01-20T01:00:00Z"
  }
}
```

---

## Changelog

### v1.0.0 (2026-01-20)

- Initial API documentation
- Studio endpoints for developer authentication
- Notebook CRUD operations
- Analytics and earnings tracking
- Payout management

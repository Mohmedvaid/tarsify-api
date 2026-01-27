# Frontend Notebook API Integration Guide

> **For:** Frontend Developer  
> **Backend API Version:** 1.0  
> **Last Updated:** January 27, 2026

This document covers everything needed to integrate the Notebook APIs with the frontend.

---

## Table of Contents

1. [Overview](#overview)
2. [Enums & Constants](#enums--constants)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Formats](#requestresponse-formats)
5. [File Upload](#file-upload)
6. [Publishing Workflow](#publishing-workflow)
7. [Error Codes](#error-codes)
8. [Testing Checklist](#testing-checklist)

---

## Overview

### Base URL

| Environment | URL |
|-------------|-----|
| Local Development | `http://localhost:8080` |
| Production | `https://api.tarsify.com` |

### Authentication

All notebook endpoints require developer authentication:

```typescript
headers: {
  'Authorization': `Bearer ${firebaseIdToken}`
}
```

**Note:** Developer must be registered (via `/api/studio/auth/register`) before accessing notebook APIs.

---

## Enums & Constants

### GPU Types

| Value | Description | Use Case |
|-------|-------------|----------|
| `T4` | NVIDIA T4 | Basic inference, cost-effective |
| `L4` | NVIDIA L4 | Balanced performance |
| `A100` | NVIDIA A100 | High-performance training |
| `H100` | NVIDIA H100 | Maximum performance |

```typescript
type GpuType = 'T4' | 'L4' | 'A100' | 'H100';
```

### Notebook Categories

| Value | Description |
|-------|-------------|
| `image` | Image generation/processing |
| `text` | Text generation/NLP |
| `video` | Video processing |
| `audio` | Audio processing |
| `other` | Other/Miscellaneous |

```typescript
type NotebookCategory = 'image' | 'text' | 'video' | 'audio' | 'other';
```

### Notebook Status

| Value | Description | Can Edit | Visible in Marketplace |
|-------|-------------|----------|------------------------|
| `draft` | Work in progress | ✅ Yes | ❌ No |
| `published` | Live on marketplace | ❌ No | ✅ Yes |
| `archived` | Soft-deleted | ❌ No | ❌ No |

```typescript
type NotebookStatus = 'draft' | 'published' | 'archived';
```

---

## API Endpoints

### Notebook CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/studio/notebooks` | Create notebook (metadata only) |
| `GET` | `/api/studio/notebooks` | List notebooks with pagination |
| `GET` | `/api/studio/notebooks/:id` | Get notebook details |
| `DELETE` | `/api/studio/notebooks/:id` | Delete notebook |

### File Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/studio/notebooks/:id/file` | Upload .ipynb file |
| `GET` | `/api/studio/notebooks/:id/file` | Download .ipynb file |
| `DELETE` | `/api/studio/notebooks/:id/file` | Delete file (keep metadata) |

### Publishing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/studio/notebooks/:id/publish` | Publish to marketplace |
| `POST` | `/api/studio/notebooks/:id/unpublish` | Remove from marketplace |

---

## Request/Response Formats

### POST /api/studio/notebooks

Create a new notebook (metadata only).

**Request:**
```json
{
  "title": "AI Image Upscaler",
  "description": "Enhance image resolution using AI...",
  "shortDescription": "Upscale images 4x with AI",
  "category": "image",
  "gpuType": "T4",
  "priceCredits": 10
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | ✅ Yes | 3-200 characters |
| `description` | string \| null | ❌ No | Max 10,000 characters |
| `shortDescription` | string \| null | ❌ No | Max 255 characters |
| `category` | string | ❌ No | One of: `image`, `text`, `video`, `audio`, `other`. Default: `other` |
| `gpuType` | string | ✅ Yes | One of: `T4`, `L4`, `A100`, `H100` |
| `priceCredits` | integer | ✅ Yes | 1-10,000 |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "AI Image Upscaler",
    "description": "Enhance image resolution using AI...",
    "shortDescription": "Upscale images 4x with AI",
    "thumbnailUrl": null,
    "category": "image",
    "status": "draft",
    "priceCredits": 10,
    "gpuType": "T4",
    "createdAt": "2026-01-27T12:00:00.000Z",
    "updatedAt": "2026-01-27T12:00:00.000Z"
  }
}
```

---

### GET /api/studio/notebooks

List notebooks with pagination and filtering.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Page number (min: 1) |
| `limit` | integer | `20` | Items per page (1-100) |
| `status` | string | `all` | Filter: `draft`, `published`, `archived`, `all` |
| `sort` | string | `-createdAt` | Sort field (prefix `-` for descending) |
| `search` | string | - | Search in title (max 100 chars) |

**Sort Options:**
- `createdAt` / `-createdAt`
- `updatedAt` / `-updatedAt`
- `title` / `-title`
- `totalRuns` / `-totalRuns`
- `priceCredits` / `-priceCredits`

**Example Request:**
```
GET /api/studio/notebooks?page=1&limit=10&status=draft&sort=-updatedAt&search=upscale
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "AI Image Upscaler",
      "shortDescription": "Upscale images 4x with AI",
      "thumbnailUrl": "https://storage.example.com/thumb.jpg",
      "category": "image",
      "status": "draft",
      "priceCredits": 10,
      "gpuType": "T4",
      "totalRuns": 0,
      "averageRating": null,
      "createdAt": "2026-01-27T12:00:00.000Z",
      "updatedAt": "2026-01-27T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET /api/studio/notebooks/:id

Get full notebook details.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Notebook ID |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "developerId": "660e8400-e29b-41d4-a716-446655440001",
    "title": "AI Image Upscaler",
    "description": "Full description with markdown support...",
    "shortDescription": "Upscale images 4x with AI",
    "thumbnailUrl": "https://storage.example.com/thumb.jpg",
    "category": "image",
    "status": "draft",
    "priceCredits": 10,
    "gpuType": "T4",
    "totalRuns": 150,
    "averageRating": 4.5,
    "notebookFileUrl": "uploads/notebooks/550e8400.ipynb",
    "createdAt": "2026-01-27T12:00:00.000Z",
    "updatedAt": "2026-01-27T12:00:00.000Z"
  }
}
```

**Note:** `notebookFileUrl` will be `null` if no file has been uploaded yet.

---

### DELETE /api/studio/notebooks/:id

Delete a notebook.

**Behavior:**
- **Draft notebooks:** Permanently deleted
- **Published notebooks:** Archived (soft delete)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "archived"
  }
}
```

---

## File Upload

### POST /api/studio/notebooks/:id/file

Upload a Jupyter notebook file.

**Requirements:**
- Notebook must be in `draft` status
- File must be `.ipynb` extension
- File must be valid Jupyter notebook JSON
- Uses `multipart/form-data`

**Request (JavaScript):**
```typescript
const uploadNotebookFile = async (notebookId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `http://localhost:8080/api/studio/notebooks/${notebookId}/file`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Do NOT set Content-Type for FormData
      },
      body: formData
    }
  );

  return response.json();
};
```

**Request (using input element):**
```typescript
// HTML: <input type="file" accept=".ipynb" id="notebook-file" />

const fileInput = document.getElementById('notebook-file') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  await uploadNotebookFile(notebookId, file);
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "AI Image Upscaler",
    "notebookFileUrl": "uploads/notebooks/550e8400.ipynb",
    "status": "draft",
    "updatedAt": "2026-01-27T12:30:00.000Z"
  }
}
```

**Validation Errors:**
- No file uploaded → 400 `ERR_1001`
- Wrong file extension → 400 `ERR_1001` "Invalid file type. Only .ipynb files are allowed."
- Invalid JSON → 400 `ERR_1001` "Invalid notebook file"
- Missing `cells` array → 400 `ERR_1001` "Invalid notebook: missing or invalid \"cells\" array"
- Not in draft status → 400 `ERR_5003`

---

### GET /api/studio/notebooks/:id/file

Download the notebook file.

**Response:**
- Content-Type: `application/x-ipynb+json`
- Content-Disposition: `attachment; filename="notebook.ipynb"`
- Body: Raw `.ipynb` file content

**Example:**
```typescript
const downloadNotebookFile = async (notebookId: string) => {
  const response = await fetch(
    `http://localhost:8080/api/studio/notebooks/${notebookId}/file`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  // Trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = `notebook-${notebookId}.ipynb`;
  a.click();
  
  URL.revokeObjectURL(url);
};
```

---

### DELETE /api/studio/notebooks/:id/file

Delete file but keep notebook metadata.

**Requirements:**
- Notebook must be in `draft` status

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "notebookFileUrl": null,
    "status": "draft",
    "updatedAt": "2026-01-27T12:45:00.000Z"
  }
}
```

---

## Publishing Workflow

### Workflow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    NOTEBOOK LIFECYCLE                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   1. Create Notebook (POST /notebooks)                       │
│        ↓                                                     │
│   ┌─────────┐                                                │
│   │  DRAFT  │ ← Can edit metadata                            │
│   └────┬────┘   Can upload/delete file                       │
│        │                                                     │
│   2. Upload File (POST /notebooks/:id/file)                  │
│        │                                                     │
│   3. Fill Required Fields                                    │
│        │   - description ✓                                   │
│        │   - shortDescription ✓                              │
│        │   - notebookFile ✓                                  │
│        │                                                     │
│   4. Publish (POST /notebooks/:id/publish)                   │
│        ↓                                                     │
│   ┌───────────┐                                              │
│   │ PUBLISHED │ → Visible on marketplace                     │
│   └─────┬─────┘   Cannot edit                                │
│         │                                                    │
│   5. Unpublish (POST /notebooks/:id/unpublish)               │
│         ↓                                                    │
│   ┌─────────┐                                                │
│   │  DRAFT  │ ← Returns to draft, can edit again             │
│   └─────────┘                                                │
│                                                              │
│   DELETE: Draft → Permanent delete                           │
│           Published → Archived                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### POST /api/studio/notebooks/:id/publish

Publish notebook to marketplace.

**Requirements Before Publishing:**
| Field | Required |
|-------|----------|
| `title` | ✅ Always set on create |
| `description` | ✅ Must be filled |
| `shortDescription` | ✅ Must be filled |
| `notebookFile` | ✅ Must be uploaded |
| `gpuType` | ✅ Always set on create |
| `priceCredits` | ✅ Always set on create |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "published",
    "updatedAt": "2026-01-27T13:00:00.000Z"
  }
}
```

**Error - Missing Fields (400):**
```json
{
  "success": false,
  "error": {
    "code": "ERR_5003",
    "message": "Notebook is not ready for publishing. Missing required fields: description, shortDescription, notebookFile",
    "details": {
      "missingFields": ["description", "shortDescription", "notebookFile"]
    }
  }
}
```

---

### POST /api/studio/notebooks/:id/unpublish

Remove from marketplace.

**Requirements:**
- Notebook must be in `published` status

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "draft",
    "updatedAt": "2026-01-27T14:00:00.000Z"
  }
}
```

**Error - Wrong Status (400):**
```json
{
  "success": false,
  "error": {
    "code": "ERR_5003",
    "message": "Cannot unpublish notebook with status 'draft'. Only published notebooks can be unpublished."
  }
}
```

---

## Error Codes

### Notebook-Specific Errors

| HTTP Status | Error Code | Message | Cause |
|-------------|------------|---------|-------|
| 404 | `ERR_5000` | Notebook not found | ID doesn't exist or belongs to another developer |
| 400 | `ERR_5003` | Invalid notebook status | Wrong status for operation (e.g., publishing draft without file) |
| 400 | `ERR_5003` | Notebook is not ready for publishing... | Missing required fields for publish |
| 400 | `ERR_5003` | Cannot unpublish notebook with status 'draft'... | Trying to unpublish non-published notebook |
| 404 | `ERR_5000` | No notebook file has been uploaded yet | Trying to download non-existent file |
| 404 | `ERR_5000` | No notebook file to delete | Trying to delete non-existent file |

### Validation Errors

| HTTP Status | Error Code | Message | Cause |
|-------------|------------|---------|-------|
| 400 | `ERR_1001` | Invalid request body | Schema validation failed |
| 400 | `ERR_1001` | Invalid notebook ID | UUID format invalid |
| 400 | `ERR_1001` | Invalid file type. Only .ipynb files are allowed. | Wrong file extension |
| 400 | `ERR_1001` | Invalid notebook file | JSON parse error |
| 400 | `ERR_1001` | Invalid notebook: missing or invalid "cells" array | Not a valid Jupyter notebook |
| 400 | `ERR_1001` | No file uploaded | Missing file in multipart request |

### Authentication Errors

| HTTP Status | Error Code | Message |
|-------------|------------|---------|
| 401 | `ERR_2000` | Authorization header required |
| 401 | `ERR_2001` | Invalid authentication token |
| 404 | `ERR_4000` | Developer not found - registration required |

---

## Testing Checklist

### ✅ Create Notebook

- [ ] Can create with required fields only → 201
- [ ] Can create with all optional fields → 201
- [ ] Fails without title → 400
- [ ] Fails with title < 3 chars → 400
- [ ] Fails with title > 200 chars → 400
- [ ] Fails without gpuType → 400
- [ ] Fails with invalid gpuType → 400
- [ ] Fails without priceCredits → 400
- [ ] Fails with priceCredits < 1 → 400
- [ ] Fails with priceCredits > 10000 → 400
- [ ] Fails with invalid category → 400
- [ ] Created notebook has status "draft" → ✓
- [ ] Created notebook has correct developerId → ✓

### ✅ List Notebooks

- [ ] Returns paginated results → 200
- [ ] Pagination meta is correct → ✓
- [ ] Can filter by status → ✓
- [ ] Can sort ascending → ✓
- [ ] Can sort descending → ✓
- [ ] Can search by title → ✓
- [ ] Returns only current developer's notebooks → ✓
- [ ] Limit max 100 enforced → ✓

### ✅ Get Notebook

- [ ] Returns full notebook details → 200
- [ ] Fails for non-existent ID → 404 `ERR_5000`
- [ ] Fails for another developer's notebook → 404 `ERR_5000`
- [ ] Fails for invalid UUID → 400 `ERR_1001`

### ✅ Delete Notebook

- [ ] Draft notebook is permanently deleted → 200
- [ ] Published notebook is archived → 200
- [ ] Fails for non-existent ID → 404 `ERR_5000`

### ✅ File Upload

- [ ] Can upload valid .ipynb file → 200
- [ ] Replaces existing file → 200
- [ ] Fails without file → 400 `ERR_1001`
- [ ] Fails with wrong extension (.py) → 400 `ERR_1001`
- [ ] Fails with invalid JSON → 400 `ERR_1001`
- [ ] Fails with missing cells array → 400 `ERR_1001`
- [ ] Fails on published notebook → 400 `ERR_5003`
- [ ] `notebookFileUrl` updated after upload → ✓

### ✅ File Download

- [ ] Returns file content → 200
- [ ] Correct Content-Type header → ✓
- [ ] Correct Content-Disposition header → ✓
- [ ] Fails if no file uploaded → 404 `ERR_5000`
- [ ] Fails for another developer's notebook → 404 `ERR_5000`

### ✅ File Delete

- [ ] Deletes file, keeps metadata → 200
- [ ] `notebookFileUrl` becomes null → ✓
- [ ] Fails if no file exists → 404 `ERR_5000`
- [ ] Fails on published notebook → 400 `ERR_5003`

### ✅ Publish

- [ ] Publishes with all required fields → 200
- [ ] Status changes to "published" → ✓
- [ ] Fails without description → 400 `ERR_5003`
- [ ] Fails without shortDescription → 400 `ERR_5003`
- [ ] Fails without notebookFile → 400 `ERR_5003`
- [ ] Error includes missingFields array → ✓

### ✅ Unpublish

- [ ] Unpublishes successfully → 200
- [ ] Status changes to "draft" → ✓
- [ ] Fails on draft notebook → 400 `ERR_5003`
- [ ] Fails on archived notebook → 400 `ERR_5003`

---

## Quick Reference

```typescript
// TypeScript interfaces for frontend

interface NotebookListItem {
  id: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  category: 'image' | 'text' | 'video' | 'audio' | 'other';
  status: 'draft' | 'published' | 'archived';
  priceCredits: number;
  gpuType: 'T4' | 'L4' | 'A100' | 'H100';
  totalRuns: number;
  averageRating: number | null;
  createdAt: string;
  updatedAt: string;
}

interface NotebookDetail extends NotebookListItem {
  developerId: string;
  description: string | null;
  notebookFileUrl: string | null;
}

interface CreateNotebookInput {
  title: string;                    // Required: 3-200 chars
  gpuType: 'T4' | 'L4' | 'A100' | 'H100';  // Required
  priceCredits: number;             // Required: 1-10000
  description?: string | null;      // Optional: max 10000
  shortDescription?: string | null; // Optional: max 255
  category?: 'image' | 'text' | 'video' | 'audio' | 'other';
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

## Contact

Questions about notebook API integration? Reach out to the backend team.

# Tarsify Studio — Frontend Integration Guide

> **Version:** 2.0.0 (Tars Models)  
> **Last Updated:** February 16, 2026  
> **API Base URL:** `https://tarsify-api-rbpbrcyq6q-uc.a.run.app` (prod) | `http://localhost:8080` (dev)

---

## 🚨 Breaking Changes — READ FIRST

The backend has **completely changed** from the notebook model to the **Tars Model** architecture. This is a major refactor.

### What Changed

| Before (Notebooks)                          | After (Tars Models)                                    |
| ------------------------------------------- | ------------------------------------------------------ |
| Developers uploaded `.ipynb` Jupyter files  | Developers pick platform **base models** and configure |
| Routes: `/api/studio/notebooks/*`           | Routes: `/api/studio/tars-models/*`                    |
| Notebooks had GPU type, input/output schema | Base models have schemas, devs add `configOverrides`   |
| Manual notebook execution                   | RunPod serverless GPU execution                        |
| No real GPU execution (mocked)              | **Real GPU execution** via RunPod                      |

### Why This Change

- **Simpler for developers** — No notebook coding, just pick & configure
- **Real GPU execution** — RunPod Serverless (SDXL, Whisper, TTS, etc.)
- **Marketplace ready** — Consumers run Tars Models, devs earn credits
- **Scalable** — One SDXL endpoint serves unlimited developer apps

---

## 📋 Implementation Checklist

### Phase 1: Remove Notebook UI (Cleanup)

- [ ] Delete all notebook-related pages/components
- [ ] Remove notebook file upload logic
- [ ] Remove notebook preview/editor
- [ ] Clean up any notebook-related state management

### Phase 2: Auth (Should Already Work)

- [ ] Verify Firebase auth still works (`tarsify-devs` project)
- [ ] Verify `POST /api/studio/auth/register` works
- [ ] Verify `GET /api/studio/auth/me` returns developer profile
- [ ] Verify `PUT /api/studio/auth/profile` updates profile

### Phase 3: Base Models Browser (New)

- [ ] Create "Browse Base Models" page
- [ ] Fetch base models: `GET /api/studio/tars-models/base-models`
- [ ] Display cards with: name, description, category, outputType
- [ ] Show input schema (what parameters the model accepts)
- [ ] Filter by category (IMAGE, AUDIO, TEXT, VIDEO, DOCUMENT)
- [ ] "Create Tars Model" button on each card

### Phase 4: Tars Model CRUD (New)

- [ ] Create "My Tars Models" dashboard page
- [ ] List tars models: `GET /api/studio/tars-models`
- [ ] Pagination support (page, limit query params)
- [ ] Filter by status (DRAFT, PUBLISHED, ARCHIVED)
- [ ] Status badges for each model

### Phase 5: Create Tars Model Flow (New)

- [ ] Multi-step form / wizard:
  1. **Select Base Model** — pick from base models list
  2. **Brand Your Model** — title, slug, description
  3. **Configure** — set `configOverrides` (optional)
  4. **Review & Create** — preview and submit
- [ ] Submit: `POST /api/studio/tars-models`
- [ ] Slug validation (alphanumeric + hyphens only)
- [ ] Show base model's `inputSchema` for reference

### Phase 6: Edit & Manage Tars Model (New)

- [ ] View tars model detail page
- [ ] Edit form: `PUT /api/studio/tars-models/:id`
- [ ] Publish button: `POST /api/studio/tars-models/:id/publish` with `{ "action": "publish" }`
- [ ] Archive button: `POST /api/studio/tars-models/:id/publish` with `{ "action": "archive" }`
- [ ] Delete button (draft only): `DELETE /api/studio/tars-models/:id`
- [ ] Cannot edit slug after publish
- [ ] Show published URL / marketplace link

### Phase 7: Polish & UX

- [ ] Loading states for all API calls
- [ ] Error handling with user-friendly messages
- [ ] Success toasts for actions
- [ ] Confirm dialogs for publish/archive/delete
- [ ] Mobile responsive layouts
- [ ] Empty states ("No models yet, create your first!")

---

## 🔑 Key Concepts

### Base Model

Platform-provided AI capability that developers can build on. Examples:

| Slug                  | Name                      | Category | Output |
| --------------------- | ------------------------- | -------- | ------ |
| `sdxl-text-to-image`  | SDXL Text to Image        | IMAGE    | IMAGE  |
| `sdxl-image-to-image` | SDXL Image to Image       | IMAGE    | IMAGE  |
| `whisper-transcribe`  | Faster Whisper            | AUDIO    | JSON   |
| `chatterbox-tts`      | Chatterbox Text to Speech | AUDIO    | AUDIO  |

### Tars Model

Developer's branded/configured version of a base model. Developer picks a base model, adds branding (title, slug, description), optionally sets `configOverrides`, and publishes to marketplace.

### configOverrides

JSON object that customizes how the base model behaves:

```json
{
  "defaultInputs": {
    "style": "anime",
    "width": 1024,
    "height": 1024
  },
  "lockedInputs": {
    "negative_prompt": "ugly, blurry, low quality"
  },
  "hiddenFields": ["guidance_scale", "num_inference_steps"],
  "promptPrefix": "anime style, ",
  "promptSuffix": ", high quality, detailed, 4k"
}
```

| Field           | Purpose                                    |
| --------------- | ------------------------------------------ |
| `defaultInputs` | Pre-fill form fields (user can override)   |
| `lockedInputs`  | Force specific values (user cannot change) |
| `hiddenFields`  | Hide advanced fields from consumer UI      |
| `promptPrefix`  | Auto-prepend to user's prompt              |
| `promptSuffix`  | Auto-append to user's prompt               |

### Tars Model Status

| Status      | Meaning                                   |
| ----------- | ----------------------------------------- |
| `DRAFT`     | Not visible in marketplace                |
| `PUBLISHED` | Live in marketplace, consumers can run it |
| `ARCHIVED`  | Removed from marketplace, still exists    |

---

## 📡 API Reference (Studio)

### Auth Endpoints (Unchanged)

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| POST   | `/api/studio/auth/register` | Register new developer   |
| GET    | `/api/studio/auth/me`       | Get current developer    |
| PUT    | `/api/studio/auth/profile`  | Update developer profile |

### Tars Model Endpoints (New)

| Method | Endpoint                              | Description                    |
| ------ | ------------------------------------- | ------------------------------ |
| GET    | `/api/studio/tars-models/base-models` | List available base models     |
| GET    | `/api/studio/tars-models`             | List developer's tars models   |
| POST   | `/api/studio/tars-models`             | Create new tars model          |
| GET    | `/api/studio/tars-models/:id`         | Get tars model by ID           |
| PUT    | `/api/studio/tars-models/:id`         | Update tars model              |
| DELETE | `/api/studio/tars-models/:id`         | Delete tars model (draft only) |
| POST   | `/api/studio/tars-models/:id/publish` | Publish or archive tars model  |

### Deprecated Endpoints (Remove from UI)

| Method | Endpoint                  | Status                     |
| ------ | ------------------------- | -------------------------- |
| ALL    | `/api/studio/notebooks/*` | ⚠️ Deprecated — do not use |

---

## 📝 API Request/Response Examples

### List Base Models

```http
GET /api/studio/tars-models/base-models
Authorization: Bearer <firebase-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "baseModels": [
      {
        "id": "uuid",
        "slug": "sdxl-text-to-image",
        "name": "SDXL Text to Image",
        "description": "Generate high-quality 1024x1024 images from text prompts",
        "category": "IMAGE",
        "inputSchema": {
          "type": "object",
          "required": ["prompt"],
          "properties": {
            "prompt": {
              "type": "string",
              "title": "Prompt",
              "maxLength": 2000
            },
            "negative_prompt": { "type": "string", "title": "Negative Prompt" },
            "width": {
              "type": "integer",
              "default": 1024,
              "enum": [512, 768, 1024]
            },
            "height": {
              "type": "integer",
              "default": 1024,
              "enum": [512, 768, 1024]
            },
            "num_inference_steps": {
              "type": "integer",
              "default": 30,
              "minimum": 10,
              "maximum": 50
            },
            "guidance_scale": {
              "type": "number",
              "default": 7.5,
              "minimum": 1,
              "maximum": 20
            }
          }
        },
        "outputType": "IMAGE",
        "outputFormat": "png",
        "estimatedSeconds": 15
      }
    ]
  }
}
```

### Create Tars Model

```http
POST /api/studio/tars-models
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "baseModelId": "uuid-of-sdxl-text-to-image",
  "title": "Anime Art Generator",
  "slug": "anime-art-generator",
  "description": "Generate beautiful anime-style artwork from text descriptions",
  "configOverrides": {
    "defaultInputs": {
      "width": 1024,
      "height": 1024
    },
    "promptPrefix": "anime style, ",
    "promptSuffix": ", high quality, detailed"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Anime Art Generator",
    "slug": "anime-art-generator",
    "description": "Generate beautiful anime-style artwork from text descriptions",
    "status": "DRAFT",
    "configOverrides": { ... },
    "baseModel": {
      "id": "uuid",
      "slug": "sdxl-text-to-image",
      "name": "SDXL Text to Image",
      "category": "IMAGE",
      "outputType": "IMAGE"
    },
    "createdAt": "2026-02-16T00:00:00Z",
    "updatedAt": "2026-02-16T00:00:00Z"
  }
}
```

### List My Tars Models

```http
GET /api/studio/tars-models?page=1&limit=20&status=DRAFT
Authorization: Bearer <firebase-token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Anime Art Generator",
      "slug": "anime-art-generator",
      "status": "DRAFT",
      "baseModel": {
        "id": "uuid",
        "slug": "sdxl-text-to-image",
        "name": "SDXL Text to Image",
        "category": "IMAGE",
        "outputType": "IMAGE"
      },
      "createdAt": "2026-02-16T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Publish Tars Model

```http
POST /api/studio/tars-models/:id/publish
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "action": "publish"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PUBLISHED",
    "publishedAt": "2026-02-16T00:00:00Z"
  }
}
```

### Archive Tars Model

```http
POST /api/studio/tars-models/:id/publish
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "action": "archive"
}
```

---

## ⚠️ Error Codes (New)

| Code       | HTTP | Message                   | When                                 |
| ---------- | ---- | ------------------------- | ------------------------------------ |
| `ERR_5500` | 404  | Tars model not found      | Invalid ID or not owned by developer |
| `ERR_5501` | 400  | Model not published       | Trying to run unpublished model      |
| `ERR_5502` | 400  | Endpoint not active       | Base model's endpoint is disabled    |
| `ERR_5503` | 409  | Slug already exists       | Duplicate slug                       |
| `ERR_5504` | 400  | Invalid status transition | e.g., publish already published      |
| `ERR_5508` | 404  | Base model not found      | Invalid baseModelId                  |
| `ERR_5509` | 400  | Base model not active     | Base model is disabled               |

---

## 🎨 UI/UX Recommendations

### Base Models Page

```
┌─────────────────────────────────────────────────────────────┐
│  Browse Base Models                                   [IMAGE ▼]│
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ 🖼️ SDXL Text    │  │ 🖼️ SDXL Image   │  │ 🎤 Whisper      ││
│  │ to Image        │  │ to Image        │  │ Transcription   ││
│  │                 │  │                 │  │                 ││
│  │ Generate high-  │  │ Transform images│  │ Transcribe audio││
│  │ quality images  │  │ with AI         │  │ to text         ││
│  │ from text       │  │                 │  │                 ││
│  │                 │  │                 │  │                 ││
│  │ ⏱️ ~15s  IMAGE  │  │ ⏱️ ~18s  IMAGE  │  │ ⏱️ ~30s  JSON   ││
│  │                 │  │                 │  │                 ││
│  │ [Create Model]  │  │ [Create Model]  │  │ [Create Model]  ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### My Tars Models Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  My Tars Models                              [+ Create New]  │
├─────────────────────────────────────────────────────────────┤
│  Filter: [All ▼] [DRAFT] [PUBLISHED] [ARCHIVED]              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🎨 Anime Art Generator                    [DRAFT]       ││
│  │    Based on: SDXL Text to Image                         ││
│  │    Created: Feb 16, 2026                                ││
│  │                                   [Edit] [Publish] [🗑️] ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🎤 Voice Clone Studio                    [PUBLISHED]    ││
│  │    Based on: Chatterbox TTS              ✅ Live         ││
│  │    Published: Feb 10, 2026                              ││
│  │                                   [Edit] [Archive]       ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Create Tars Model Flow

```
Step 1: Select Base Model
  └─> Pick from base models grid

Step 2: Brand Your Model
  ├─> Title: "Anime Art Generator"
  ├─> Slug: "anime-art-generator" (auto-generated, editable)
  └─> Description: "Generate beautiful anime artwork..."

Step 3: Configure (Optional)
  ├─> Default Inputs: { width: 1024, height: 1024 }
  ├─> Prompt Prefix: "anime style, "
  └─> Prompt Suffix: ", high quality"

Step 4: Review & Create
  └─> Preview card → [Create Model]
```

---

## 🔗 Related Docs

- [API.md](./API.md) — Full API reference with all endpoints
- Backend Docs (in `backend_docs/`):
  - `ARCHITECTURE.MD` — System architecture
  - `ROADMAP.MD` — Progress tracker
  - `DEPLOYMENT.md` — Infrastructure details

---

## 📞 Questions?

If the API doesn't behave as documented, check:

1. Are you using the correct base URL?
2. Is the Firebase token from the correct project (`tarsify-devs`)?
3. Check response error codes for specific issues

Report issues in the `tarsify-api` repo.

# Studio Frontend Tasks

Based on backend changes. Delete this file when done.

---

## 1. TarsModel CRUD

| Action  | Endpoint                                   | Notes                                            |
| ------- | ------------------------------------------ | ------------------------------------------------ |
| Create  | `POST /api/studio/tars-models`             | `{ baseModelId, title, slug, description }`      |
| List    | `GET /api/studio/tars-models`              | Paginated, returns array with `baseModel` nested |
| Get     | `GET /api/studio/tars-models/:id`          | Single model with `baseModel`                    |
| Update  | `PATCH /api/studio/tars-models/:id`        | Only `title`, `slug`, `description`              |
| Delete  | `DELETE /api/studio/tars-models/:id`       | Only DRAFT status allowed                        |
| Publish | `POST /api/studio/tars-models/:id/publish` | `{ visibility, priceCredits }`                   |

---

## 2. Base Models List

```
GET /api/studio/tars-models/base-models
```

Returns available base models to build on. Use for "Create Model" dropdown.

---

## 3. Test Run (NEW)

```
POST /api/studio/tars-models/:id/test-run
Body: { input: { prompt: "...", ... } }
```

- Synchronous - waits for result (up to 60s timeout)
- Returns `{ jobId, status, output, error, executionTimeMs }`
- Use this for "Test Model" button before publishing

---

## 4. Dynamic Input Forms (NEW)

`baseModel.inputSchema` is now included in all TarsModel responses.

**Schema structure example:**

```json
{
  "inputSchema": {
    "prompt": {
      "type": "string",
      "required": true,
      "description": "Text prompt"
    },
    "negative_prompt": { "type": "string", "required": false },
    "width": { "type": "integer", "default": 1024, "min": 512, "max": 2048 },
    "height": { "type": "integer", "default": 1024 },
    "num_outputs": { "type": "integer", "default": 1, "min": 1, "max": 4 }
  }
}
```

**Frontend task:**

- Build a dynamic form generator that reads `inputSchema`
- Render appropriate input components based on `type` (string → textarea, integer → number input, etc.)
- Apply `required`, `default`, `min`, `max` constraints
- Use this form for both test-run and consumer execution

---

## 5. Output Display

`baseModel.outputType` tells you what kind of output to expect:

- `IMAGE` → render as image(s)
- `TEXT` → render as text/markdown
- `VIDEO` → render as video player
- `AUDIO` → render as audio player

`baseModel.outputFormat` gives format hints (e.g., `png`, `mp4`, `mp3`).

---

## Quick Dev Flow

1. Dev selects base model from dropdown
2. Dev fills in title, slug, description → Create
3. Dev enters test inputs (dynamic form from `inputSchema`)
4. Dev clicks "Test Run" → Shows result
5. Dev clicks "Publish" → Model goes live

---

## Auth Reminder

All `/api/studio/*` endpoints require:

```
Authorization: Bearer <firebase-id-token>
```

Use Firebase Auth project: `tarsify-devs`

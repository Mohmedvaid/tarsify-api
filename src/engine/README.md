# Engine Module

RunPod execution engine for Tarsify. Handles submitting jobs, polling status, and cancellation.

## Architecture

```
Consumer Request
     │
     ▼
┌─────────────────┐
│     Engine      │  ← createEngine(prisma, apiKey)
├─────────────────┤
│  submitJob()    │  → Creates execution, calls RunPod, returns handle
│  getJobStatus() │  → Polls RunPod, updates DB, returns result
│  cancelJob()    │  → Cancels on RunPod, updates DB
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  RunPod Client  │  ← HTTP wrapper with retry
├─────────────────┤
│  /run           │  → Async job submission
│  /runsync       │  → Sync execution (30s timeout)
│  /status/{id}   │  → Job status polling
│  /cancel/{id}   │  → Job cancellation
└─────────────────┘
     │
     ▼
  RunPod API
```

## Usage

```typescript
import { createEngine } from '@/engine';
import { prisma } from '@/lib/prisma';

const engine = createEngine(prisma, process.env.RUNPOD_API_KEY!);

// Submit a job
const handle = await engine.submitJob({
  consumerId: 'consumer-uuid',
  tarsModelSlug: 'anime-generator',
  userInputs: {
    prompt: 'a beautiful sunset',
    style: 'anime',
  },
});

// Poll for status
const result = await engine.getJobStatus(handle.executionId, consumerId);

// Cancel if needed
await engine.cancelJob(handle.executionId, consumerId);
```

## Files

| File               | Purpose                           |
| ------------------ | --------------------------------- |
| `index.ts`         | Public API, createEngine factory  |
| `types.ts`         | TypeScript types and interfaces   |
| `errors.ts`        | Error classes (RunPodError, etc.) |
| `runpod-client.ts` | HTTP client for RunPod API        |
| `input-merger.ts`  | Merges user inputs with config    |

## Input Merger

The `mergeInputs()` function applies developer's `configOverrides`:

```typescript
const configOverrides = {
  defaultInputs: { style: 'anime' }, // Applied if user doesn't provide
  lockedInputs: { width: 1024 }, // Always applied
  hiddenFields: ['negative_prompt'], // Removed from input
  promptPrefix: 'anime style, ', // Prepended to prompt
  promptSuffix: ', high quality', // Appended to prompt
};

mergeInputs({ prompt: 'sunset' }, configOverrides);
// → { prompt: 'anime style, sunset, high quality', style: 'anime', width: 1024 }
```

## Error Codes

| Code     | Meaning                   |
| -------- | ------------------------- |
| ERR_6001 | RunPod request failed     |
| ERR_6002 | RunPod timeout            |
| ERR_6003 | RunPod rate limited       |
| ERR_6100 | Model not found           |
| ERR_6101 | Model not published       |
| ERR_6102 | Endpoint not active       |
| ERR_6103 | Execution not found       |
| ERR_6104 | Execution not owned       |
| ERR_6105 | Execution not cancellable |

## Testing

```bash
npm run test src/engine
```

Tests mock the RunPod client and Prisma to test engine logic in isolation.

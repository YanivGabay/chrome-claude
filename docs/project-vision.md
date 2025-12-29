# Chrome Claude: Workflow System

> Natural language browser workflows, triggered through Claude Code, running in background.

## The Problem

1. **Browser automation is tedious** - Playwright/Puppeteer require exact selectors, break when UI changes
2. **Claude Chrome extension is manual** - You interact through the browser UI
3. **No reusable workflows** - Each task is one-off
4. **Context switching** - Jump between terminal and browser constantly

## The Solution

A **workflow library** that:
- Defines browser tasks in **natural language**
- Uses **typed parameters** for inputs
- Specifies **what to capture** (network, screenshots, console)
- Runs **in background** via Claude Code
- Lets you **continue working** while browser does its thing

## Why Claude, Not Playwright?

| Playwright | Claude |
|------------|--------|
| Exact selectors required | "Click the login button" |
| Breaks when UI changes | Adapts to page changes |
| No decision making | "If there's a captcha, wait for me" |
| Scripted extraction | "Find the pricing info" |
| Fails on unexpected popups | Handles them intelligently |
| Returns raw data | Returns structured meaning |

**Use Claude when:**
- Sites change frequently
- Requirements are fuzzy ("find the main content")
- You need semantic understanding
- Handling unknown UI variations

**Use Playwright when:**
- Exact, repeatable, fast automation
- Performance-critical scraping
- Simple, stable UIs

## Architecture

```
chrome-claude/
├── docs/
│   ├── claude-chrome-reference.md   # Chrome integration docs
│   └── project-vision.md            # This file
├── lib/
│   ├── workflow.ts                  # defineWorkflow() + types
│   └── runner.ts                    # Builds prompts, handles capture
├── workflows/
│   ├── qa/
│   │   ├── check-checkout-flow.ts
│   │   └── test-login-states.ts
│   ├── dev/
│   │   ├── debug-local-app.ts
│   │   └── check-staging.ts
│   └── scraping/
│       └── get-competitor-pricing.ts
└── output/                          # Captured data, screenshots, etc.
```

## Workflow Definition Format

```typescript
// workflows/qa/check-checkout-flow.ts
import { defineWorkflow } from '../../lib/workflow';

export default defineWorkflow({
  name: 'check-checkout-flow',
  description: 'QA the full checkout flow, capture API responses',

  // TYPED PARAMETERS
  // Users get autocomplete, validation, defaults
  params: {
    baseUrl: { type: 'string', required: true },
    testUser: { type: 'string', default: 'qa@test.com' }
  },

  // WHAT TO CAPTURE
  // Structured config for outputs
  capture: {
    network: {
      patterns: ['*/api/checkout*', '*/api/cart*'],
      saveDir: './output/checkout-qa/'
    },
    screenshots: './output/checkout-qa/screenshots/',
    console: { levels: ['error'], saveAs: './output/checkout-qa/errors.log' }
  },

  // NATURAL LANGUAGE TASK
  // Claude figures out the how
  task: `
    Go to {{ baseUrl }}

    Test the checkout flow:
    1. Add a product to cart
    2. Go to checkout
    3. Fill in test payment details
    4. Submit order
    5. Verify confirmation page

    Capture all checkout/cart API responses.
    Screenshot each step.
    Report any console errors.

    If anything fails, screenshot the error state and describe what went wrong.
  `
});
```

## Usage Flow

### 1. User Talks to Claude Code

```
You: run the checkout QA workflow on staging.myapp.com
```

### 2. Claude Code Reads Workflow

- Loads `workflows/qa/check-checkout-flow.ts`
- Validates parameters
- Builds full prompt with capture instructions

### 3. Runs in Background

```
Me: Running check-checkout-flow workflow in background...
    → baseUrl: https://staging.myapp.com
    → testUser: qa@test.com
    → Capturing: network, screenshots, console errors

    I'll let you know when it's done. What else?
```

### 4. Continue Working

```
You: also check the login page for console errors on prod

Me: Running debug-login workflow in background...
    [conversation continues normally]
```

### 5. Results

```
Me: ✓ checkout-qa finished
    → 5 screenshots saved
    → 3 API responses captured
    → 1 console error found: "TypeError: Cannot read property..."
    → Full output in ./output/checkout-qa/

    Want me to show the error details?
```

## Type Definitions

```typescript
// lib/workflow.ts

export interface WorkflowParam {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: any;
  description?: string;
}

export interface NetworkCapture {
  patterns: string[];              // Glob patterns for URLs
  methods?: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  saveDir: string;
  extractJson?: boolean;           // Parse and save as JSON
}

export interface ConsoleCapture {
  levels: ('error' | 'warn' | 'log' | 'info')[];
  pattern?: string;                // Filter by message pattern
  saveAs: string;
}

export interface CaptureConfig {
  network?: NetworkCapture;
  screenshots?: string;            // Directory path
  console?: ConsoleCapture;
  data?: string;                   // Where to save extracted data
}

export interface WorkflowDefinition {
  name: string;
  description?: string;
  params: Record<string, WorkflowParam>;
  capture: CaptureConfig;
  task: string;                    // Natural language, supports {{ param }} syntax
}

export function defineWorkflow(def: WorkflowDefinition): WorkflowDefinition {
  return def;
}
```

## Example Workflows

### QA: Test Login States

```typescript
defineWorkflow({
  name: 'test-login-states',
  description: 'Test various login scenarios',

  params: {
    baseUrl: { type: 'string', required: true },
  },

  capture: {
    screenshots: './output/login-tests/',
    console: { levels: ['error'], saveAs: './output/login-tests/errors.log' }
  },

  task: `
    Go to {{ baseUrl }}/login

    Test these scenarios:
    1. Empty form submission - verify error messages
    2. Invalid email format - verify validation
    3. Wrong password - verify error handling
    4. Forgot password link - verify it works

    Screenshot each error state.
    Report any console errors.
  `
});
```

### Dev: Debug Local App

```typescript
defineWorkflow({
  name: 'debug-local-app',
  description: 'Check local dev server for errors',

  params: {
    port: { type: 'number', default: 3000 },
    path: { type: 'string', default: '/' }
  },

  capture: {
    console: { levels: ['error', 'warn'], saveAs: './output/debug/console.log' },
    network: { patterns: ['*'], saveDir: './output/debug/network/' },
    screenshots: './output/debug/'
  },

  task: `
    Go to http://localhost:{{ port }}{{ path }}

    Wait for page to fully load.
    Check for any console errors or warnings.
    Check for any failed network requests.

    If errors found, screenshot the page and describe what's wrong.
  `
});
```

### Scraping: Competitor Pricing

```typescript
defineWorkflow({
  name: 'get-competitor-pricing',
  description: 'Extract pricing info from competitor site',

  params: {
    url: { type: 'string', required: true },
    competitor: { type: 'string', required: true }
  },

  capture: {
    network: { patterns: ['*/api/pricing*', '*/api/plans*'], saveDir: './output/pricing/' },
    screenshots: './output/pricing/',
    data: './output/pricing/data.json'
  },

  task: `
    Go to {{ url }}

    Find all pricing tiers for {{ competitor }}.

    For each tier, extract:
    - Tier name
    - Monthly price
    - Annual price (if available)
    - List of features

    Handle any cookie banners or popups.
    If there's a "show more" button, click to expand.
    Screenshot the pricing section.

    Save extracted data as JSON.
  `
});
```

### Multi-Site: Submit Listing

```typescript
defineWorkflow({
  name: 'submit-listing',
  description: 'Post listing to multiple sites',

  params: {
    sites: { type: 'array', required: true },
    listing: { type: 'object', required: true }
  },

  capture: {
    screenshots: './output/listings/',
  },

  task: `
    For each site in {{ sites }}:

    1. Navigate to the site
    2. Find the "create listing" or "post" form
    3. Fill in with: {{ listing }}
    4. Submit
    5. Screenshot the confirmation

    If login required, stop and tell me.
    If submission fails, screenshot error and continue to next site.
  `
});
```

## Sharing Workflows

Workflows are just TypeScript files. To share:

1. **Copy the file** - Drop into `workflows/` folder
2. **Git** - Version control, share via repo
3. **npm package** - Publish as package, import workflows

```typescript
// Using shared workflows
import checkoutQA from '@myorg/chrome-workflows/qa/checkout';
import pricingScraper from '@myorg/chrome-workflows/scraping/pricing';
```

## Future Ideas

- [ ] Web UI for non-developers to run workflows
- [ ] Workflow marketplace / community sharing
- [ ] Parallel workflow execution
- [ ] Workflow chaining (output of one feeds into another)
- [ ] Scheduled workflows via cron
- [ ] Slack/Discord notifications on completion
- [ ] Diff screenshots (compare before/after)

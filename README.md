# Chrome Claude

Natural language browser workflows for Claude Code.

## What is this?

A workflow system that lets you:
- Define browser tasks in **natural language**
- Trigger them through **Claude Code** in your terminal
- Run in **background** while you keep working
- Capture **network responses, screenshots, console logs**

## Why?

| Traditional Automation | Chrome Claude |
|------------------------|---------------|
| Write Playwright/Puppeteer scripts | Write natural language |
| Exact selectors, break when UI changes | Claude adapts |
| One-off scripts | Reusable workflows |
| Context switch to browser | Stay in terminal |

## Requirements

- macOS or Windows (not WSL)
- Google Chrome
- [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) v1.0.36+
- Claude Code CLI v2.0.73+
- Claude Pro, Team, or Enterprise plan
- Node.js 18+

## Installation

### Option 1: Install globally (recommended)

```bash
npm install -g chrome-claude
```

### Option 2: Clone and build

```bash
git clone https://github.com/youruser/chrome-claude.git
cd chrome-claude
npm install
npm run build
```

### Setup Claude Skill (optional)

To use `/workflow` commands in Claude Code:

```bash
cp skill/chrome-workflow.md ~/.claude/skills/
```

## Quick Start

### Via CLI

```bash
# List available workflows
chrome-claude list

# Describe a workflow
chrome-claude describe checkout-qa

# Run a workflow
chrome-claude run checkout-qa --url https://staging.myapp.com

# Dry run (show prompt without executing)
chrome-claude run checkout-qa --url https://example.com --dry-run
```

### Via Claude Code

```bash
# Start Claude Code with Chrome
claude --chrome

# Then talk naturally:
> /workflow run checkout-qa --url https://staging.myapp.com

# Or without the skill:
> run the checkout-qa workflow on https://staging.myapp.com
```

## Example Workflows

### QA: Checkout Flow

```typescript
// workflows/qa/checkout.ts
import { defineWorkflow } from 'chrome-claude';

export default defineWorkflow({
  name: 'checkout-qa',
  description: 'Test the checkout flow end-to-end',

  params: {
    url: { type: 'string', required: true },
    testUser: { type: 'string', default: 'qa@test.com' },
  },

  capture: {
    network: {
      patterns: ['*/api/checkout*', '*/api/cart*'],
      saveDir: './output/{{name}}/network/',
    },
    screenshots: './output/{{name}}/screenshots/',
    console: { levels: ['error'], saveAs: './output/{{name}}/console.log' },
  },

  task: `
    Go to {{url}}

    Test the checkout flow:
    1. Add a product to cart
    2. Go to checkout
    3. Fill in test payment details
    4. Submit order

    Screenshot each step.
    Capture all API responses.
    Report any errors.
  `,
});
```

### Dev: Debug Local Server

```typescript
// workflows/dev/debug-local.ts
import { defineWorkflow } from 'chrome-claude';

export default defineWorkflow({
  name: 'debug-local',
  description: 'Check local dev server for errors',

  params: {
    port: { type: 'number', default: 3000 },
    path: { type: 'string', default: '/' },
  },

  capture: {
    console: { levels: ['error', 'warn'], saveAs: './output/{{name}}/console.log' },
    screenshots: './output/{{name}}/',
  },

  task: `
    Go to http://localhost:{{port}}{{path}}

    Wait for page to load.
    Check for console errors or warnings.
    Screenshot the page.

    Report any issues found.
  `,
});
```

### Scraping: Competitor Pricing

```typescript
// workflows/scraping/pricing.ts
import { defineWorkflow } from 'chrome-claude';

export default defineWorkflow({
  name: 'scrape-pricing',
  description: 'Extract pricing info from competitor',

  params: {
    url: { type: 'string', required: true },
    competitor: { type: 'string', required: true },
  },

  capture: {
    network: { patterns: ['*/api/pricing*'], saveDir: './output/{{name}}/' },
    screenshots: './output/{{name}}/',
    data: './output/{{name}}/pricing.json',
  },

  task: `
    Go to {{url}}

    Find all pricing tiers.
    For each tier extract: name, monthly price, annual price, features.
    Handle any popups or cookie banners.

    Save as JSON.
  `,
});
```

## Usage Flow

```
You: /workflow run checkout-qa --url https://staging.myapp.com

Claude: Running checkout-qa in background...

        Parameters:
          url: https://staging.myapp.com
          testUser: qa@test.com (default)

        Capturing:
          - Network: */api/checkout*, */api/cart*
          - Screenshots
          - Console errors

        Output: ./output/checkout-qa/

        I'll let you know when done. What else?

You: [continue working on other things]

Claude: checkout-qa completed!

        Results:
          - 5 screenshots saved
          - 3 API responses captured
          - No console errors

        Files: ./output/checkout-qa/
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `chrome-claude run <name>` | Run a workflow |
| `chrome-claude list` | List available workflows |
| `chrome-claude describe <name>` | Show workflow details |
| `chrome-claude validate <name>` | Validate workflow params |
| `chrome-claude prompt <name>` | Show generated prompt |
| `chrome-claude init` | Initialize in current directory |

### Run Options

```bash
chrome-claude run <name> [options]

Options:
  --dry-run        Build prompt but don't execute
  --foreground     Wait for completion (default: background)
  --work-dir <dir> Output directory
  --<param> <val>  Workflow parameters
```

## Project Structure

```
chrome-claude/
├── src/
│   ├── index.ts          # Library exports
│   ├── cli.ts            # CLI entry point
│   ├── types.ts          # Type definitions
│   ├── workflow.ts       # defineWorkflow helper
│   ├── loader.ts         # Load workflow files
│   ├── validator.ts      # Param validation
│   ├── prompt-builder.ts # Build Claude prompts
│   └── runner.ts         # Execute workflows
├── workflows/            # Example workflows
│   ├── qa/
│   ├── dev/
│   └── scraping/
├── skill/
│   └── chrome-workflow.md # Claude skill
├── output/               # Captured data
└── docs/
    ├── architecture.md
    ├── claude-chrome-reference.md
    └── project-vision.md
```

## Creating Workflows

1. Create a `.ts` file in `workflows/`
2. Import `defineWorkflow` from `chrome-claude`
3. Define:
   - `params`: Typed input parameters
   - `capture`: What to save (network, screenshots, console)
   - `task`: Natural language instructions

IDE provides full autocomplete for params and capture config.

## Workflow Locations

Workflows are searched in:
1. `./workflows/` (current directory)
2. `~/.chrome-claude/workflows/` (global)

## Sharing Workflows

Workflows are TypeScript files:
- **Copy** files to share
- **Git** for version control
- **npm** for package distribution

```bash
# Publish your workflows
npm publish

# Others install
npm install @yourorg/chrome-workflows
```

## Documentation

- [Architecture](docs/architecture.md) - Layered design and data flow
- [Claude Chrome Reference](docs/claude-chrome-reference.md) - Chrome integration details
- [Project Vision](docs/project-vision.md) - Full design and examples

## License

MIT

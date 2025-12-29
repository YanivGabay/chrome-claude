# Architecture

> Layered design: Simple stays simple, complex is possible.

## Overview

```
┌─────────────────────────────────────────────────┐
│  Layer 3: Skill                                 │
│  User talks to Claude: "/workflow run qa"       │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  Layer 2: Runner                                │
│  CLI & library: reads workflow, builds prompt   │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  Layer 1: Workflow Definitions                  │
│  TypeScript files with types & natural language │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  Layer 0: Claude --chrome                       │
│  Actual browser control via Chrome extension    │
└─────────────────────────────────────────────────┘
```

## Layer 0: Claude Chrome Integration

The foundation. Provided by Anthropic.

- `claude --chrome` starts Claude Code with browser control
- Chrome extension receives commands via Native Messaging API
- Claude can navigate, click, type, capture network, screenshots, etc.

**We don't build this - we build on top of it.**

## Layer 1: Workflow Definitions

TypeScript files that define reusable workflows.

```typescript
// workflows/qa/checkout.ts
import { defineWorkflow } from 'chrome-claude';

export default defineWorkflow({
  name: 'checkout-qa',
  description: 'Test the checkout flow end-to-end',

  params: {
    url: { type: 'string', required: true, description: 'Base URL to test' },
    testUser: { type: 'string', default: 'qa@test.com' }
  },

  capture: {
    network: {
      patterns: ['*/api/checkout*', '*/api/cart*'],
      saveDir: './output/{{name}}/'
    },
    screenshots: './output/{{name}}/screenshots/',
    console: { levels: ['error'], saveAs: './output/{{name}}/console.log' }
  },

  task: `
    Go to {{url}}

    Test the checkout flow:
    1. Add a product to cart
    2. Go to checkout
    3. Fill test payment details
    4. Submit and verify confirmation

    Screenshot each step.
    Capture all API responses.
    Report any errors.
  `
});
```

**Why TypeScript:**
- Full IDE autocomplete
- Type errors caught immediately
- Self-documenting
- Refactoring support

**What authors get:**
- `params` - Typed, validated, with defaults
- `capture` - Structured config for outputs
- `task` - Natural language (Claude figures out the how)

## Layer 2: Runner

The execution engine. Available as CLI and library.

### As CLI

```bash
# Run a workflow
npx chrome-claude run checkout-qa --url https://staging.myapp.com

# List available workflows
npx chrome-claude list

# Validate a workflow
npx chrome-claude validate checkout-qa

# Show workflow details
npx chrome-claude describe checkout-qa
```

### As Library

```typescript
import { loadWorkflow, buildPrompt, runWorkflow } from 'chrome-claude';

// Load and inspect
const workflow = await loadWorkflow('checkout-qa');
console.log(workflow.params); // See required params

// Build prompt (for debugging)
const prompt = buildPrompt(workflow, { url: 'https://example.com' });
console.log(prompt);

// Run it
const result = await runWorkflow('checkout-qa', {
  params: { url: 'https://example.com' },
  background: true
});
```

### What the runner does:

1. **Loads** workflow definition from file
2. **Validates** params against schema
3. **Builds** full prompt with:
   - Task instructions
   - Capture instructions (network patterns, screenshot locations)
   - Output format instructions
4. **Executes** via `claude --chrome -p "..."`
5. **Handles** background execution
6. **Returns** results and output locations

## Layer 3: Skill

Claude Code integration. A skill file that lets users invoke workflows naturally.

```markdown
<!-- ~/.claude/skills/chrome-workflow.md -->
# /workflow

Run browser automation workflows via chrome-claude.

## Commands
- `/workflow run <name> [--param value]` - Run a workflow
- `/workflow list` - List available workflows
- `/workflow describe <name>` - Show workflow details

## Execution
When running a workflow:
1. Use `npx chrome-claude run <name> [params]` in background
2. Report that it's running
3. Continue conversation
4. Report results when complete
```

**Why a skill:**
- Users stay in Claude Code
- Natural invocation (`/workflow run checkout`)
- Background execution built-in
- Claude handles reporting

## Entry Points by User Type

| User | Entry Point | What They Do |
|------|-------------|--------------|
| **Quick user** | Skill | `/workflow run checkout --url x` |
| **Power user** | CLI | `npx chrome-claude run checkout --url x` |
| **Developer** | Library | `import { runWorkflow } from 'chrome-claude'` |
| **CI/CD** | CLI | Scripted in pipelines |

## File Structure

```
chrome-claude/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Library exports
│   ├── cli.ts                # CLI entry point
│   ├── types.ts              # Type definitions
│   ├── workflow.ts           # defineWorkflow helper
│   ├── loader.ts             # Load workflow files
│   ├── validator.ts          # Param validation
│   ├── prompt-builder.ts     # Build Claude prompts
│   └── runner.ts             # Execute workflows
├── workflows/                # Example workflows
│   ├── qa/
│   ├── dev/
│   └── scraping/
├── skill/
│   └── chrome-workflow.md    # Claude skill file
└── docs/
```

## Data Flow

```
User: /workflow run checkout-qa --url https://staging.myapp.com
         │
         ▼
    ┌─────────┐
    │  Skill  │  Invokes CLI in background
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │   CLI   │  Parses args, calls runner
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ Loader  │  Reads workflows/qa/checkout.ts
    └────┬────┘
         │
         ▼
    ┌──────────┐
    │Validator │  Checks params against schema
    └────┬─────┘
         │
         ▼
    ┌───────────────┐
    │ Prompt Builder│  Combines task + capture config
    └───────┬───────┘
            │
            ▼
    ┌─────────┐
    │ Runner  │  Spawns: claude --chrome -p "..."
    └────┬────┘
         │
         ▼
    ┌──────────────┐
    │Claude Chrome │  Actual browser automation
    └──────────────┘
         │
         ▼
    Output saved to ./output/checkout-qa/
```

## Distribution

### For Users (Install & Run)

```bash
# Install globally
npm install -g chrome-claude

# Clone workflow collections
git clone https://github.com/yourorg/qa-workflows ~/.chrome-claude/workflows/qa

# Add skill to Claude
cp node_modules/chrome-claude/skill/chrome-workflow.md ~/.claude/skills/

# Ready to use
claude --chrome
> /workflow run checkout-qa --url https://mysite.com
```

### For Authors (Create & Share)

```bash
# Init in your project
npx chrome-claude init

# Creates:
# - workflows/ directory
# - TypeScript config
# - Example workflow

# Write workflows with full IDE support
# Share via git or npm publish
```

### For Teams

```bash
# Shared workflow repo
my-company/
└── chrome-workflows/
    ├── package.json       # npm package
    ├── qa/
    ├── dev/
    └── monitoring/

# Team members install
npm install -g @mycompany/chrome-workflows

# Workflows available everywhere
```

## Future Considerations

### Phase 1 (Now)
- Core types and defineWorkflow
- Basic runner
- CLI with run/list/describe
- Skill file

### Phase 2 (Soon)
- Workflow validation
- Better output handling
- npm package published
- More example workflows

### Phase 3 (Later)
- Workflow marketplace / registry
- Web UI for non-developers
- Workflow chaining
- Scheduled execution

### Phase 4 (Future)
- Visual workflow builder
- Team collaboration features
- Analytics / reporting
- Parallel execution

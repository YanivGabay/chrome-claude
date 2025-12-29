# /workflow

Run browser automation workflows via chrome-claude.

## Description

This skill allows you to run predefined browser workflows through Claude Code. Workflows are natural language tasks with typed parameters and structured capture configurations.

## Commands

### Run a workflow

```
/workflow run <name> [--param value ...]
```

Run a workflow by name with optional parameters.

### List available workflows

```
/workflow list
```

Show all available workflows.

### Describe a workflow

```
/workflow describe <name>
```

Show details about a workflow including parameters and what it captures.

## How to Execute

When the user invokes a workflow command:

### For `/workflow list`:

Run in background:
```bash
npx chrome-claude list
```

Display the output to the user.

### For `/workflow describe <name>`:

Run:
```bash
npx chrome-claude describe <name>
```

Display the output to the user.

### For `/workflow run <name> [params]`:

1. First, describe the workflow to understand its parameters:
   ```bash
   npx chrome-claude describe <name>
   ```

2. If parameters are missing, ask the user for required values.

3. Run the workflow in background:
   ```bash
   npx chrome-claude run <name> --param1 value1 --param2 value2 &
   ```

4. Inform the user:
   - The workflow is running in background
   - Where output will be saved
   - That you'll continue the conversation

5. Continue working on other tasks while the workflow runs.

6. When the background process completes, report:
   - Success or failure
   - Files that were captured
   - Any errors encountered

## Examples

### User: /workflow list

```
I'll list the available workflows.

[runs: npx chrome-claude list]

Available workflows:

  checkout-qa - Test the checkout flow end-to-end
  debug-local - Check local dev server for errors
  scrape-pricing - Extract pricing info from competitor

Total: 3 workflow(s)
```

### User: /workflow run checkout-qa --url https://staging.myapp.com

```
Running checkout-qa workflow in background...

Parameters:
  url: https://staging.myapp.com
  testUser: qa@test.com (default)

Capturing:
  - Network: */api/checkout*, */api/cart*
  - Screenshots: each step
  - Console: errors

Output will be saved to: ./output/checkout-qa/

I'll let you know when it completes. What else can I help with?

[later...]

Workflow checkout-qa completed successfully!

Results:
  - 5 screenshots saved
  - 3 API responses captured
  - No console errors

Output: ./output/checkout-qa/
```

### User: /workflow run debug-local

```
I see the debug-local workflow. Let me check its parameters...

[runs: npx chrome-claude describe debug-local]

The workflow has these parameters:
  --port (number, default: 3000)
  --path (string, default: /)

Do you want to use the defaults, or specify different values?
```

## Workflow Locations

Workflows are searched in:
1. `./workflows/` (current directory)
2. `~/.chrome-claude/workflows/` (global)

## Requirements

- Chrome Claude CLI must be installed: `npm install -g chrome-claude`
- Claude must be started with Chrome: `claude --chrome`
- Chrome browser must be running with Claude extension

## Notes

- Workflows run in the background by default
- You can continue working while workflows execute
- Output is saved to `./output/<workflow-name>/`
- Use `--foreground` flag to wait for completion

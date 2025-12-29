#!/usr/bin/env node

/**
 * Chrome Claude CLI
 *
 * Command-line interface for running browser workflows.
 */

import { Command } from 'commander';
import { listWorkflows, getWorkflow } from './loader.js';
import { runWorkflow } from './runner.js';
import { buildPrompt, describeWorkflow } from './prompt-builder.js';
import { validateParams, coerceParams, formatErrors } from './validator.js';

const program = new Command();

program
  .name('chrome-claude')
  .description('Natural language browser workflows for Claude Code')
  .version('0.1.0');

// =============================================================================
// run command
// =============================================================================

program
  .command('run <workflow>')
  .description('Run a browser workflow')
  .option('--dry-run', 'Build prompt but do not execute')
  .option('--foreground', 'Run in foreground (wait for completion)')
  .option('--work-dir <dir>', 'Working directory for output')
  .allowUnknownOption(true) // Allow workflow-specific params
  .action(async (workflowName: string, options: Record<string, unknown>, cmd: Command) => {
    try {
      // Extract workflow params from unknown options
      const params = extractParams(cmd.args, workflowName);

      // Load workflow to validate params
      const { definition } = await getWorkflow(workflowName);

      // Run it
      const result = await runWorkflow(workflowName, {
        params,
        dryRun: Boolean(options.dryRun),
        background: !options.foreground,
        workDir: options.workDir as string | undefined,
      });

      if (result.success) {
        if (!options.dryRun) {
          console.log(`\nWorkflow ${options.foreground ? 'completed' : 'started'} successfully`);
          console.log(`Output: ${result.outputDir}`);
          if (result.duration) {
            console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
          }
        }
        process.exit(0);
      } else {
        console.error(`\nWorkflow failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// =============================================================================
// list command
// =============================================================================

program
  .command('list')
  .description('List available workflows')
  .option('--path <paths...>', 'Additional paths to search')
  .action(async (options: { path?: string[] }) => {
    try {
      const workflows = await listWorkflows(options.path);

      if (workflows.length === 0) {
        console.log('No workflows found.');
        console.log('\nCreate workflows in ./workflows/ or ~/.chrome-claude/workflows/');
        return;
      }

      console.log('Available workflows:\n');

      for (const w of workflows) {
        const desc = w.definition.description
          ? ` - ${w.definition.description}`
          : '';
        console.log(`  ${w.definition.name}${desc}`);
      }

      console.log(`\nTotal: ${workflows.length} workflow(s)`);
      console.log('\nRun: chrome-claude describe <name> for details');
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// =============================================================================
// describe command
// =============================================================================

program
  .command('describe <workflow>')
  .description('Show workflow details')
  .action(async (workflowName: string) => {
    try {
      const { definition } = await getWorkflow(workflowName);
      console.log(describeWorkflow(definition));
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// =============================================================================
// validate command
// =============================================================================

program
  .command('validate <workflow>')
  .description('Validate a workflow definition')
  .allowUnknownOption(true)
  .action(async (workflowName: string, options: Record<string, unknown>, cmd: Command) => {
    try {
      const params = extractParams(cmd.args, workflowName);
      const { definition } = await getWorkflow(workflowName);

      const coerced = coerceParams(definition.params, params);
      const result = validateParams(definition, coerced);

      if (result.valid) {
        console.log(`Workflow "${workflowName}" is valid`);
        console.log('\nResolved params:');
        for (const [key, value] of Object.entries(result.resolvedParams)) {
          console.log(`  ${key}: ${JSON.stringify(value)}`);
        }
      } else {
        console.error(`Workflow "${workflowName}" has validation errors:`);
        console.error(formatErrors(result.errors));
        process.exit(1);
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// =============================================================================
// prompt command (debug)
// =============================================================================

program
  .command('prompt <workflow>')
  .description('Show the prompt that would be sent to Claude')
  .allowUnknownOption(true)
  .action(async (workflowName: string, options: Record<string, unknown>, cmd: Command) => {
    try {
      const params = extractParams(cmd.args, workflowName);
      const { definition } = await getWorkflow(workflowName);

      const coerced = coerceParams(definition.params, params);
      const validation = validateParams(definition, coerced);

      if (!validation.valid) {
        console.error('Validation errors:');
        console.error(formatErrors(validation.errors));
        process.exit(1);
      }

      const prompt = buildPrompt(definition, validation.resolvedParams);
      console.log(prompt);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// =============================================================================
// init command
// =============================================================================

program
  .command('init')
  .description('Initialize chrome-claude in current directory')
  .action(async () => {
    console.log('TODO: Initialize project structure');
    console.log('Would create:');
    console.log('  - workflows/');
    console.log('  - workflows/example.ts');
    console.log('  - tsconfig.json (for workflow authoring)');
  });

// =============================================================================
// Helpers
// =============================================================================

/**
 * Extract workflow params from command line args
 *
 * Parses: --param value or --param=value
 */
function extractParams(args: string[], skipFirst: string): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  let i = 0;
  // Skip the workflow name
  while (i < args.length && args[i] !== skipFirst) {
    i++;
  }
  i++; // Skip past workflow name

  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const [key, ...valueParts] = arg.slice(2).split('=');
      const paramName = key;

      if (valueParts.length > 0) {
        // --param=value format
        params[paramName] = valueParts.join('=');
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        // --param value format
        params[paramName] = args[i + 1];
        i++;
      } else {
        // --flag (boolean)
        params[paramName] = true;
      }
    }

    i++;
  }

  return params;
}

// Run the CLI
program.parse();

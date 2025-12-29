/**
 * Workflow Runner
 *
 * Executes workflows by spawning claude --chrome processes.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import type { WorkflowDefinition, RunOptions, RunResult } from './types.js';
import { validateParams, coerceParams, formatErrors } from './validator.js';
import { buildPrompt } from './prompt-builder.js';
import { getWorkflow } from './loader.js';

/**
 * Run a workflow by name
 */
export async function runWorkflow(
  nameOrPath: string,
  options: RunOptions
): Promise<RunResult> {
  const startTime = Date.now();

  // Load the workflow
  const { definition } = await getWorkflow(nameOrPath);

  // Coerce and validate params
  const coercedParams = coerceParams(definition.params, options.params);
  const validation = validateParams(definition, coercedParams);

  if (!validation.valid) {
    return {
      success: false,
      outputDir: '',
      files: {},
      error: `Parameter validation failed:\n${formatErrors(validation.errors)}`,
    };
  }

  // Determine output directory
  const workDir = options.workDir || process.cwd();
  const outputDir = resolve(workDir, 'output', definition.name);

  // Build the prompt
  const prompt = buildPrompt(definition, validation.resolvedParams, { outputDir });

  // Dry run - just return the prompt
  if (options.dryRun) {
    console.log('=== DRY RUN ===');
    console.log('Prompt that would be sent to Claude:\n');
    console.log(prompt);
    console.log('\n=== END DRY RUN ===');

    return {
      success: true,
      outputDir,
      files: {},
      duration: Date.now() - startTime,
    };
  }

  // Ensure output directory exists
  await ensureDir(outputDir);

  // Execute
  const background = options.background !== false;

  if (background) {
    return runInBackground(prompt, outputDir, startTime);
  } else {
    return runForeground(prompt, outputDir, startTime);
  }
}

/**
 * Run workflow in background (non-blocking)
 */
async function runInBackground(
  prompt: string,
  outputDir: string,
  startTime: number
): Promise<RunResult> {
  const child = spawnClaude(prompt, { detached: true });

  // Don't wait for completion
  child.unref();

  console.log(`Workflow running in background (PID: ${child.pid})`);
  console.log(`Output will be saved to: ${outputDir}`);

  return {
    success: true,
    outputDir,
    files: {},
    duration: Date.now() - startTime,
  };
}

/**
 * Run workflow in foreground (blocking)
 */
async function runForeground(
  prompt: string,
  outputDir: string,
  startTime: number
): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawnClaude(prompt, { detached: false });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;

      if (code === 0) {
        resolve({
          success: true,
          outputDir,
          files: {}, // TODO: Parse output to find created files
          duration,
        });
      } else {
        resolve({
          success: false,
          outputDir,
          files: {},
          error: stderr || `Process exited with code ${code}`,
          duration,
        });
      }
    });

    child.on('error', (error) => {
      resolve({
        success: false,
        outputDir,
        files: {},
        error: error.message,
        duration: Date.now() - startTime,
      });
    });
  });
}

/**
 * Spawn a claude --chrome process
 */
function spawnClaude(
  prompt: string,
  options: { detached: boolean }
): ChildProcess {
  const args = [
    '--chrome',
    '-p', prompt,
    '--output-format', 'text',
  ];

  const child = spawn('claude', args, {
    detached: options.detached,
    stdio: options.detached ? 'ignore' : ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  return child;
}

/**
 * Ensure a directory exists
 */
async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Execute a workflow definition directly (without loading from file)
 */
export async function executeWorkflow(
  definition: WorkflowDefinition,
  options: RunOptions
): Promise<RunResult> {
  const startTime = Date.now();

  // Coerce and validate params
  const coercedParams = coerceParams(definition.params, options.params);
  const validation = validateParams(definition, coercedParams);

  if (!validation.valid) {
    return {
      success: false,
      outputDir: '',
      files: {},
      error: `Parameter validation failed:\n${formatErrors(validation.errors)}`,
    };
  }

  // Determine output directory
  const workDir = options.workDir || process.cwd();
  const outputDir = resolve(workDir, 'output', definition.name);

  // Build the prompt
  const prompt = buildPrompt(definition, validation.resolvedParams, { outputDir });

  if (options.dryRun) {
    console.log('=== DRY RUN ===');
    console.log('Prompt that would be sent to Claude:\n');
    console.log(prompt);
    console.log('\n=== END DRY RUN ===');

    return {
      success: true,
      outputDir,
      files: {},
      duration: Date.now() - startTime,
    };
  }

  await ensureDir(outputDir);

  const background = options.background !== false;

  if (background) {
    return runInBackground(prompt, outputDir, startTime);
  } else {
    return runForeground(prompt, outputDir, startTime);
  }
}

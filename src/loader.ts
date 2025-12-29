/**
 * Workflow Loader
 *
 * Loads workflow definitions from TypeScript files.
 */

import { pathToFileURL } from 'node:url';
import { resolve, dirname, basename } from 'node:path';
import { existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import type { WorkflowDefinition, LoadedWorkflow } from './types.js';

/** Default locations to search for workflows */
const DEFAULT_WORKFLOW_PATHS = [
  './workflows',
  '~/.chrome-claude/workflows',
];

/**
 * Expand ~ to home directory
 */
function expandHome(path: string): string {
  if (path.startsWith('~/')) {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    return resolve(home, path.slice(2));
  }
  return path;
}

/**
 * Find all workflow directories to search
 */
export function getWorkflowPaths(customPaths?: string[]): string[] {
  const paths = customPaths || DEFAULT_WORKFLOW_PATHS;
  return paths
    .map(expandHome)
    .map(p => resolve(p))
    .filter(p => existsSync(p));
}

/**
 * Load a single workflow by name
 *
 * Searches by:
 * 1. Filename match (workflows/name.ts)
 * 2. Workflow name property (loads all and finds matching name)
 */
export async function loadWorkflow(
  name: string,
  searchPaths?: string[]
): Promise<LoadedWorkflow> {
  const paths = getWorkflowPaths(searchPaths);

  // First, try direct filename match
  for (const searchPath of paths) {
    // Try direct file: workflows/name.ts
    const directPath = resolve(searchPath, `${name}.ts`);
    if (existsSync(directPath)) {
      return loadWorkflowFile(directPath);
    }

    // Try nested: workflows/category/name.ts
    const entries = await readdir(searchPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const nestedPath = resolve(searchPath, entry.name, `${name}.ts`);
        if (existsSync(nestedPath)) {
          return loadWorkflowFile(nestedPath);
        }
      }
    }
  }

  // If no filename match, search by workflow name property
  const allWorkflows = await listWorkflows(searchPaths);
  const found = allWorkflows.find(w => w.definition.name === name);

  if (found) {
    return found;
  }

  throw new Error(`Workflow not found: ${name}\nSearched in: ${paths.join(', ')}`);
}

/**
 * Load a workflow from a specific file path
 */
export async function loadWorkflowFile(filePath: string): Promise<LoadedWorkflow> {
  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Workflow file not found: ${absolutePath}`);
  }

  try {
    // Dynamic import the TypeScript file
    // Note: Requires ts-node or similar for direct .ts execution
    // In production, these would be compiled to .js
    const fileUrl = pathToFileURL(absolutePath).href;
    const module = await import(fileUrl);

    const definition: WorkflowDefinition = module.default;

    if (!definition || !definition.name) {
      throw new Error(`Invalid workflow: ${absolutePath} - must export default a workflow definition`);
    }

    return {
      definition,
      filePath: absolutePath,
      directory: dirname(absolutePath),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load workflow ${absolutePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * List all available workflows
 */
export async function listWorkflows(searchPaths?: string[]): Promise<LoadedWorkflow[]> {
  const paths = getWorkflowPaths(searchPaths);
  const workflows: LoadedWorkflow[] = [];

  for (const searchPath of paths) {
    const found = await scanDirectory(searchPath);
    workflows.push(...found);
  }

  // Dedupe by name (first found wins)
  const seen = new Set<string>();
  return workflows.filter(w => {
    if (seen.has(w.definition.name)) {
      return false;
    }
    seen.add(w.definition.name);
    return true;
  });
}

/**
 * Recursively scan a directory for workflow files
 */
async function scanDirectory(dir: string, maxDepth = 2, currentDepth = 0): Promise<LoadedWorkflow[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  if (!existsSync(dir)) {
    return [];
  }

  const workflows: LoadedWorkflow[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      // Recurse into subdirectories
      const nested = await scanDirectory(fullPath, maxDepth, currentDepth + 1);
      workflows.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.startsWith('_')) {
      // Try to load .ts files (skip files starting with _)
      try {
        const loaded = await loadWorkflowFile(fullPath);
        workflows.push(loaded);
      } catch {
        // Skip files that aren't valid workflows
      }
    }
  }

  return workflows;
}

/**
 * Get workflow by name or path
 */
export async function getWorkflow(nameOrPath: string, searchPaths?: string[]): Promise<LoadedWorkflow> {
  // If it looks like a path, load directly
  if (nameOrPath.includes('/') || nameOrPath.endsWith('.ts')) {
    return loadWorkflowFile(nameOrPath);
  }

  // Otherwise search by name
  return loadWorkflow(nameOrPath, searchPaths);
}

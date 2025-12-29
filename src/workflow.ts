/**
 * Workflow Definition Helper
 *
 * Provides the defineWorkflow function used by workflow authors.
 */

import type { WorkflowDefinition, ParamsSchema } from './types.js';

/**
 * Define a browser automation workflow.
 *
 * @example
 * ```typescript
 * import { defineWorkflow } from 'chrome-claude';
 *
 * export default defineWorkflow({
 *   name: 'my-workflow',
 *   description: 'Does something cool',
 *
 *   params: {
 *     url: { type: 'string', required: true },
 *     count: { type: 'number', default: 10 }
 *   },
 *
 *   capture: {
 *     screenshots: './output/',
 *     network: { patterns: ['*\/api\/*'], saveDir: './output/api/' }
 *   },
 *
 *   task: `
 *     Go to {{url}}
 *     Do the thing {{count}} times
 *     Screenshot the result
 *   `
 * });
 * ```
 */
export function defineWorkflow<T extends ParamsSchema>(
  definition: WorkflowDefinition<T>
): WorkflowDefinition<T> {
  // Validate required fields
  if (!definition.name) {
    throw new Error('Workflow must have a name');
  }

  if (!definition.task) {
    throw new Error('Workflow must have a task');
  }

  if (!definition.params) {
    throw new Error('Workflow must have params (use empty object {} if none)');
  }

  if (!definition.capture) {
    throw new Error('Workflow must have capture config (use empty object {} if none)');
  }

  // Normalize the definition
  return {
    ...definition,
    // Trim whitespace from task
    task: definition.task.trim(),
  };
}

/**
 * Debug Local App Workflow
 *
 * Check local development server for errors and issues.
 */

import { defineWorkflow } from '../../src/workflow.js';

export default defineWorkflow({
  name: 'debug-local',
  description: 'Check local dev server for errors',

  params: {
    port: {
      type: 'number',
      default: 3000,
      description: 'Local server port',
    },
    path: {
      type: 'string',
      default: '/',
      description: 'Path to check',
    },
    checkPaths: {
      type: 'array',
      default: ['/'],
      description: 'Additional paths to check (comma-separated)',
    },
  },

  capture: {
    network: {
      patterns: ['*'],
      saveDir: './output/{{name}}/network/',
      statusCodes: [400, 401, 403, 404, 500, 502, 503],
    },
    screenshots: './output/{{name}}/screenshots/',
    console: {
      levels: ['error', 'warn'],
      saveAs: './output/{{name}}/console.log',
    },
  },

  task: `
    Check the local development server at http://localhost:{{port}}

    For each path in [{{path}}, {{checkPaths}}]:

    1. Navigate to http://localhost:{{port}}<path>
    2. Wait for the page to fully load
    3. Check the browser console for errors or warnings
    4. Check for any failed network requests (4xx or 5xx status codes)
    5. Screenshot the page

    If you find any issues:
    - Screenshot the error state
    - Capture the relevant console messages
    - Note which network requests failed

    Summarize:
    - Pages checked
    - Console errors/warnings found (with messages)
    - Failed network requests
    - Overall health assessment
  `,
});

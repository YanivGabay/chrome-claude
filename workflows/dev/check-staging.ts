/**
 * Check Staging Environment Workflow
 *
 * Verify staging environment is working correctly.
 */

import { defineWorkflow } from '../../src/workflow.js';

export default defineWorkflow({
  name: 'check-staging',
  description: 'Verify staging environment health',

  params: {
    url: {
      type: 'string',
      required: true,
      description: 'Staging environment URL',
    },
    criticalPaths: {
      type: 'array',
      default: ['/', '/login', '/dashboard'],
      description: 'Critical paths to check',
    },
  },

  capture: {
    network: {
      patterns: ['*/api/*'],
      saveDir: './output/{{name}}/network/',
    },
    screenshots: './output/{{name}}/screenshots/',
    console: {
      levels: ['error'],
      saveAs: './output/{{name}}/console.log',
    },
  },

  task: `
    Verify the staging environment at {{url}}

    Check each critical path: {{criticalPaths}}

    For each path:
    1. Navigate to {{url}}<path>
    2. Verify the page loads without errors
    3. Check for console errors
    4. Check for broken images or missing resources
    5. Screenshot the page

    Also check:
    - API endpoints are responding (monitor network for */api/*)
    - No SSL/security warnings
    - Page load times are reasonable

    Report:
    - Status of each critical path (OK / ERROR)
    - Any console errors found
    - Any failed API calls
    - Overall staging health: HEALTHY / DEGRADED / BROKEN
  `,
});

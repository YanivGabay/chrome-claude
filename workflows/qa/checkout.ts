/**
 * Checkout Flow QA Workflow
 *
 * Tests the complete checkout flow and captures API responses.
 */

import { defineWorkflow } from '../../src/workflow.js';

export default defineWorkflow({
  name: 'checkout-qa',
  description: 'Test the checkout flow end-to-end',

  params: {
    url: {
      type: 'string',
      required: true,
      description: 'Base URL of the site to test',
    },
    testUser: {
      type: 'string',
      default: 'qa@test.com',
      description: 'Test user email for checkout',
    },
    testProduct: {
      type: 'string',
      default: 'first available',
      description: 'Which product to add to cart',
    },
  },

  capture: {
    network: {
      patterns: ['*/api/checkout*', '*/api/cart*', '*/api/payment*'],
      saveDir: './output/{{name}}/network/',
      extractJson: true,
    },
    screenshots: './output/{{name}}/screenshots/',
    console: {
      levels: ['error', 'warn'],
      saveAs: './output/{{name}}/console.log',
    },
  },

  task: `
    Go to {{url}}

    Test the complete checkout flow:

    1. BROWSE PRODUCTS
       - Navigate to the products or shop page
       - Find and click on {{testProduct}}
       - Screenshot the product page

    2. ADD TO CART
       - Click "Add to Cart" button
       - Verify the cart updates
       - Screenshot the cart confirmation

    3. GO TO CHECKOUT
       - Navigate to checkout page
       - Screenshot the checkout form

    4. FILL CHECKOUT FORM
       - Fill in test shipping details:
         - Name: Test User
         - Email: {{testUser}}
         - Address: 123 Test Street
         - City: Test City
         - Zip: 12345
       - Screenshot the filled form

    5. PAYMENT
       - If there's a test payment option, use it
       - Otherwise, fill with test card: 4242 4242 4242 4242
       - Screenshot before submitting

    6. SUBMIT ORDER
       - Click the submit/place order button
       - Wait for confirmation
       - Screenshot the confirmation page

    Throughout this flow:
    - Capture all API requests to checkout, cart, and payment endpoints
    - Note any console errors or warnings
    - If any step fails, screenshot the error state and describe what went wrong

    At the end, summarize:
    - Whether the flow completed successfully
    - Any errors encountered
    - Total number of API calls captured
  `,
});

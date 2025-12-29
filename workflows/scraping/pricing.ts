/**
 * Competitor Pricing Scraper Workflow
 *
 * Extract pricing information from a competitor's website.
 */

import { defineWorkflow } from '../../src/workflow.js';

export default defineWorkflow({
  name: 'scrape-pricing',
  description: 'Extract pricing info from competitor site',

  params: {
    url: {
      type: 'string',
      required: true,
      description: 'URL of the pricing page',
    },
    competitor: {
      type: 'string',
      required: true,
      description: 'Competitor name (for labeling output)',
    },
  },

  capture: {
    network: {
      patterns: ['*/api/pricing*', '*/api/plans*', '*/api/products*'],
      saveDir: './output/{{name}}/{{competitor}}/network/',
      extractJson: true,
    },
    screenshots: './output/{{name}}/{{competitor}}/screenshots/',
    data: './output/{{name}}/{{competitor}}/pricing.json',
  },

  task: `
    Extract pricing information from {{url}} for competitor: {{competitor}}

    1. Navigate to the pricing page
    2. Handle any cookie banners or popups
    3. If there's a "show more" or "view all plans" button, click it
    4. Screenshot the full pricing section

    Extract for each pricing tier:
    - Tier name (e.g., "Starter", "Pro", "Enterprise")
    - Monthly price
    - Annual price (if available)
    - Price per user (if applicable)
    - List of features included
    - Any limits or quotas mentioned

    Also note:
    - Free trial availability
    - Money-back guarantee
    - Custom/enterprise pricing contact option

    Save the extracted data as JSON with this structure:
    {
      "competitor": "{{competitor}}",
      "url": "{{url}}",
      "extractedAt": "<timestamp>",
      "tiers": [
        {
          "name": "...",
          "monthlyPrice": "...",
          "annualPrice": "...",
          "pricePerUser": "...",
          "features": ["...", "..."],
          "limits": {}
        }
      ],
      "notes": {
        "freeTrial": true/false,
        "trialDays": ...,
        "moneyBackGuarantee": "...",
        "enterpriseContact": true/false
      }
    }

    If any pricing API calls are made, capture those responses as well.
  `,
});

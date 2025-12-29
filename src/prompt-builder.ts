/**
 * Prompt Builder
 *
 * Converts a workflow definition + params into a complete prompt for Claude.
 */

import Handlebars from 'handlebars';
import type {
  WorkflowDefinition,
  CaptureConfig,
  NetworkCaptureConfig,
  ConsoleCaptureConfig,
  ScreenshotConfig,
} from './types.js';

/**
 * Build a complete prompt from a workflow and params
 */
export function buildPrompt(
  workflow: WorkflowDefinition,
  params: Record<string, unknown>,
  options: { outputDir?: string } = {}
): string {
  const outputDir = options.outputDir || `./output/${workflow.name}`;

  // Build template context
  const context = {
    ...params,
    name: workflow.name,
    outputDir,
  };

  // Compile and render the task template
  const taskTemplate = Handlebars.compile(workflow.task);
  const task = taskTemplate(context);

  // Build capture instructions
  const captureInstructions = buildCaptureInstructions(workflow.capture, context);

  // Combine into full prompt
  const sections: string[] = [];

  // Main task
  sections.push(task);

  // Capture instructions
  if (captureInstructions) {
    sections.push('');
    sections.push('---');
    sections.push('CAPTURE INSTRUCTIONS:');
    sections.push(captureInstructions);
  }

  // Output format
  sections.push('');
  sections.push('---');
  sections.push('OUTPUT FORMAT:');
  sections.push('When complete, summarize:');
  sections.push('- What was done');
  sections.push('- Files saved (with paths)');
  sections.push('- Any errors or issues encountered');

  return sections.join('\n');
}

/**
 * Build capture instructions section
 */
function buildCaptureInstructions(
  capture: CaptureConfig,
  context: Record<string, unknown>
): string {
  const instructions: string[] = [];

  // Network capture
  if (capture.network) {
    instructions.push(buildNetworkInstructions(capture.network, context));
  }

  // Screenshots
  if (capture.screenshots) {
    instructions.push(buildScreenshotInstructions(capture.screenshots, context));
  }

  // Console
  if (capture.console) {
    instructions.push(buildConsoleInstructions(capture.console, context));
  }

  // Data extraction
  if (capture.data) {
    const dataPath = renderTemplate(capture.data, context);
    instructions.push(`\nDATA EXTRACTION:\n- Save extracted data as JSON to: ${dataPath}`);
  }

  return instructions.join('\n');
}

/**
 * Build network capture instructions
 */
function buildNetworkInstructions(
  config: NetworkCaptureConfig,
  context: Record<string, unknown>
): string {
  const saveDir = renderTemplate(config.saveDir, context);
  const lines: string[] = ['\nNETWORK CAPTURE:'];

  lines.push(`- Monitor network requests matching: ${config.patterns.join(', ')}`);

  if (config.methods?.length) {
    lines.push(`- Only capture methods: ${config.methods.join(', ')}`);
  }

  if (config.statusCodes?.length) {
    lines.push(`- Only capture status codes: ${config.statusCodes.join(', ')}`);
  }

  if (config.contentType) {
    lines.push(`- Only capture content type: ${config.contentType}`);
  }

  lines.push(`- Save responses to: ${saveDir}`);

  if (config.extractJson !== false) {
    lines.push('- Extract and format JSON responses');
  }

  if (config.includeRequestHeaders) {
    lines.push('- Include request headers');
  }

  if (config.includeResponseHeaders) {
    lines.push('- Include response headers');
  }

  return lines.join('\n');
}

/**
 * Build screenshot instructions
 */
function buildScreenshotInstructions(
  config: string | ScreenshotConfig,
  context: Record<string, unknown>
): string {
  const lines: string[] = ['\nSCREENSHOTS:'];

  if (typeof config === 'string') {
    const dir = renderTemplate(config, context);
    lines.push(`- Take screenshots at key steps`);
    lines.push(`- Save to: ${dir}`);
    lines.push(`- Name files descriptively (e.g., 01-login-page.png, 02-dashboard.png)`);
  } else {
    const dir = renderTemplate(config.dir, context);
    lines.push(`- Take screenshots at key steps`);
    lines.push(`- Save to: ${dir}`);
    lines.push(`- Format: ${config.format || 'png'}`);

    if (config.naming === 'timestamp') {
      lines.push('- Name files with timestamps');
    } else {
      lines.push('- Name files with step numbers and descriptions');
    }
  }

  return lines.join('\n');
}

/**
 * Build console capture instructions
 */
function buildConsoleInstructions(
  config: ConsoleCaptureConfig,
  context: Record<string, unknown>
): string {
  const saveAs = renderTemplate(config.saveAs, context);
  const lines: string[] = ['\nCONSOLE CAPTURE:'];

  lines.push(`- Capture console output: ${config.levels.join(', ')}`);

  if (config.pattern) {
    lines.push(`- Filter messages matching: ${config.pattern}`);
  }

  lines.push(`- Save to: ${saveAs}`);

  return lines.join('\n');
}

/**
 * Render a template string with context
 */
function renderTemplate(template: string, context: Record<string, unknown>): string {
  const compiled = Handlebars.compile(template);
  return compiled(context);
}

/**
 * Get a summary of what a workflow will do (for --describe)
 */
export function describeWorkflow(workflow: WorkflowDefinition): string {
  const lines: string[] = [];

  lines.push(`Workflow: ${workflow.name}`);

  if (workflow.description) {
    lines.push(`Description: ${workflow.description}`);
  }

  lines.push('');
  lines.push('Parameters:');
  for (const [name, def] of Object.entries(workflow.params)) {
    const required = def.required ? '(required)' : `(default: ${def.default ?? 'none'})`;
    const desc = def.description ? ` - ${def.description}` : '';
    lines.push(`  --${name} <${def.type}> ${required}${desc}`);
  }

  lines.push('');
  lines.push('Captures:');
  if (workflow.capture.network) {
    lines.push(`  - Network: ${workflow.capture.network.patterns.join(', ')}`);
  }
  if (workflow.capture.screenshots) {
    const dir = typeof workflow.capture.screenshots === 'string'
      ? workflow.capture.screenshots
      : workflow.capture.screenshots.dir;
    lines.push(`  - Screenshots: ${dir}`);
  }
  if (workflow.capture.console) {
    lines.push(`  - Console: ${workflow.capture.console.levels.join(', ')}`);
  }
  if (workflow.capture.data) {
    lines.push(`  - Data: ${workflow.capture.data}`);
  }

  lines.push('');
  lines.push('Task:');
  lines.push(workflow.task.split('\n').map(l => `  ${l}`).join('\n'));

  return lines.join('\n');
}

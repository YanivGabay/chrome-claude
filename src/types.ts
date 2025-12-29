/**
 * Chrome Claude - Type Definitions
 *
 * These types provide full IDE support for workflow authors.
 */

// =============================================================================
// Parameter Types
// =============================================================================

export type ParamType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface ParamDefinition {
  /** The type of the parameter */
  type: ParamType;
  /** Whether this parameter is required (default: false) */
  required?: boolean;
  /** Default value if not provided */
  default?: unknown;
  /** Description shown in help/docs */
  description?: string;
}

export type ParamsSchema = Record<string, ParamDefinition>;

/** Infer the runtime type from a ParamDefinition */
export type InferParamType<T extends ParamDefinition> =
  T['type'] extends 'string' ? string :
  T['type'] extends 'number' ? number :
  T['type'] extends 'boolean' ? boolean :
  T['type'] extends 'array' ? unknown[] :
  T['type'] extends 'object' ? Record<string, unknown> :
  unknown;

/** Infer all params from a schema */
export type InferParams<T extends ParamsSchema> = {
  [K in keyof T]: InferParamType<T[K]>;
};

// =============================================================================
// Capture Configuration
// =============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type ConsoleLevel = 'error' | 'warn' | 'log' | 'info' | 'debug';

export interface NetworkCaptureConfig {
  /** URL patterns to capture (glob syntax) */
  patterns: string[];
  /** HTTP methods to capture (default: all) */
  methods?: HttpMethod[];
  /** Status codes to capture (default: all) */
  statusCodes?: number[];
  /** Content types to capture (default: all) */
  contentType?: string;
  /** Directory to save captured responses */
  saveDir: string;
  /** Extract and save as formatted JSON (default: true) */
  extractJson?: boolean;
  /** Include request headers in output */
  includeRequestHeaders?: boolean;
  /** Include response headers in output */
  includeResponseHeaders?: boolean;
}

export interface ConsoleCaptureConfig {
  /** Console levels to capture */
  levels: ConsoleLevel[];
  /** Optional pattern to filter messages */
  pattern?: string;
  /** File path to save console output */
  saveAs: string;
}

export interface ScreenshotConfig {
  /** Directory to save screenshots */
  dir: string;
  /** Image format (default: png) */
  format?: 'png' | 'jpg' | 'webp';
  /** Naming pattern: 'step' = 01-step-name.png, 'timestamp' = 2024-01-01-12-00-00.png */
  naming?: 'step' | 'timestamp';
}

export interface CaptureConfig {
  /** Network request/response capture */
  network?: NetworkCaptureConfig;
  /** Screenshot capture - can be string (dir path) or full config */
  screenshots?: string | ScreenshotConfig;
  /** Console output capture */
  console?: ConsoleCaptureConfig;
  /** Path to save extracted data (JSON) */
  data?: string;
}

// =============================================================================
// Workflow Definition
// =============================================================================

export interface WorkflowDefinition<T extends ParamsSchema = ParamsSchema> {
  /** Unique name for the workflow (used in CLI) */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Parameter definitions */
  params: T;
  /** What to capture during execution */
  capture: CaptureConfig;
  /**
   * The task to perform in natural language.
   * Supports {{paramName}} template syntax.
   */
  task: string;
}

// =============================================================================
// Runtime Types
// =============================================================================

export interface LoadedWorkflow {
  /** The workflow definition */
  definition: WorkflowDefinition;
  /** Absolute path to the workflow file */
  filePath: string;
  /** Directory containing the workflow */
  directory: string;
}

export interface RunOptions {
  /** Parameter values */
  params: Record<string, unknown>;
  /** Run in background (default: true) */
  background?: boolean;
  /** Working directory for output (default: cwd) */
  workDir?: string;
  /** Dry run - build prompt but don't execute */
  dryRun?: boolean;
}

export interface RunResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Output directory path */
  outputDir: string;
  /** Captured files */
  files: {
    network?: string[];
    screenshots?: string[];
    console?: string;
    data?: string;
  };
  /** Error message if failed */
  error?: string;
  /** Execution duration in ms */
  duration?: number;
}

// =============================================================================
// Validation
// =============================================================================

export interface ValidationError {
  param: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  /** Params with defaults applied */
  resolvedParams: Record<string, unknown>;
}

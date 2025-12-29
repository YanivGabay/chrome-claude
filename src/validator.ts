/**
 * Parameter Validator
 *
 * Validates and resolves workflow parameters.
 */

import type {
  WorkflowDefinition,
  ParamsSchema,
  ParamDefinition,
  ValidationResult,
  ValidationError,
} from './types.js';

/**
 * Validate params against a workflow definition
 */
export function validateParams(
  workflow: WorkflowDefinition,
  params: Record<string, unknown>
): ValidationResult {
  const errors: ValidationError[] = [];
  const resolvedParams: Record<string, unknown> = {};

  // Check each defined param
  for (const [name, def] of Object.entries(workflow.params)) {
    const value = params[name];
    const validation = validateParam(name, def, value);

    if (validation.error) {
      errors.push(validation.error);
    } else {
      resolvedParams[name] = validation.value;
    }
  }

  // Check for unknown params
  for (const name of Object.keys(params)) {
    if (!(name in workflow.params)) {
      errors.push({
        param: name,
        message: `Unknown parameter: ${name}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    resolvedParams,
  };
}

/**
 * Validate a single parameter
 */
function validateParam(
  name: string,
  def: ParamDefinition,
  value: unknown
): { value: unknown; error?: ValidationError } {
  // Handle missing values
  if (value === undefined || value === null || value === '') {
    if (def.required) {
      return {
        value: undefined,
        error: { param: name, message: `Required parameter missing: ${name}` },
      };
    }

    // Use default if available
    if (def.default !== undefined) {
      return { value: def.default };
    }

    return { value: undefined };
  }

  // Type validation
  const typeError = validateType(name, def.type, value);
  if (typeError) {
    return { value, error: typeError };
  }

  return { value };
}

/**
 * Validate parameter type
 */
function validateType(
  name: string,
  expectedType: string,
  value: unknown
): ValidationError | null {
  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        return { param: name, message: `Expected string, got ${typeof value}` };
      }
      break;

    case 'number':
      if (typeof value !== 'number' && isNaN(Number(value))) {
        return { param: name, message: `Expected number, got ${typeof value}` };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return { param: name, message: `Expected boolean, got ${typeof value}` };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        // Try to parse as comma-separated string
        if (typeof value === 'string') {
          return null; // Will be converted in coerceParams
        }
        return { param: name, message: `Expected array, got ${typeof value}` };
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        // Try to parse as JSON string
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return null; // Valid JSON
          } catch {
            return { param: name, message: `Expected object, got invalid JSON` };
          }
        }
        return { param: name, message: `Expected object, got ${typeof value}` };
      }
      break;
  }

  return null;
}

/**
 * Coerce string values to proper types based on schema
 */
export function coerceParams(
  schema: ParamsSchema,
  params: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [name, def] of Object.entries(schema)) {
    const value = params[name];

    if (value === undefined || value === null) {
      if (def.default !== undefined) {
        result[name] = def.default;
      }
      continue;
    }

    result[name] = coerceValue(def.type, value);
  }

  return result;
}

/**
 * Coerce a single value to the expected type
 */
function coerceValue(type: string, value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  switch (type) {
    case 'number':
      return typeof value === 'number' ? value : Number(value);

    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return Boolean(value);

    case 'array':
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        // Parse comma-separated
        return value.split(',').map(s => s.trim());
      }
      return [value];

    case 'object':
      if (typeof value === 'object' && !Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;

    default:
      return String(value);
  }
}

/**
 * Format validation errors for display
 */
export function formatErrors(errors: ValidationError[]): string {
  return errors.map(e => `  - ${e.param}: ${e.message}`).join('\n');
}

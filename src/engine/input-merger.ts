/**
 * Input Merger
 * Merges user inputs with developer's configOverrides
 */

import type { ConfigOverrides } from './types';

/**
 * Merge user inputs with developer config overrides
 *
 * Rules (applied in order):
 * 1. Start with user inputs
 * 2. Apply defaultInputs for fields user didn't provide
 * 3. Override with lockedInputs (user can't change)
 * 4. Remove hiddenFields
 * 5. Wrap prompt field with promptPrefix/promptSuffix if present
 *
 * @param userInputs - Inputs provided by the consumer
 * @param configOverrides - Developer's config overrides from TarsModel
 * @returns Merged input payload ready for RunPod
 */
export function mergeInputs(
  userInputs: Record<string, unknown>,
  configOverrides?: ConfigOverrides | null
): Record<string, unknown> {
  // Start with a copy of user inputs
  const merged: Record<string, unknown> = { ...userInputs };

  if (!configOverrides) {
    return merged;
  }

  // 1. Apply default inputs for missing fields
  if (configOverrides.defaultInputs) {
    for (const [key, value] of Object.entries(configOverrides.defaultInputs)) {
      if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
        merged[key] = value;
      }
    }
  }

  // 2. Apply locked inputs (always override)
  if (configOverrides.lockedInputs) {
    for (const [key, value] of Object.entries(configOverrides.lockedInputs)) {
      merged[key] = value;
    }
  }

  // 3. Remove hidden fields
  if (configOverrides.hiddenFields) {
    for (const field of configOverrides.hiddenFields) {
      delete merged[field];
    }
  }

  // 4. Wrap prompt with prefix/suffix
  if (merged.prompt && typeof merged.prompt === 'string') {
    const prefix = configOverrides.promptPrefix ?? '';
    const suffix = configOverrides.promptSuffix ?? '';
    merged.prompt = `${prefix}${merged.prompt}${suffix}`;
  }

  return merged;
}

/**
 * Process input schema to remove hidden fields and mark locked fields
 * Used for displaying the form to consumers
 *
 * @param baseSchema - Original input schema from BaseModel
 * @param configOverrides - Developer's config overrides from TarsModel
 * @returns Processed schema for consumer display
 */
export function processInputSchema(
  baseSchema: Record<string, unknown>,
  configOverrides?: ConfigOverrides | null
): Record<string, unknown> {
  if (!configOverrides) {
    return baseSchema;
  }

  // Deep clone the schema
  const processed = JSON.parse(JSON.stringify(baseSchema)) as Record<string, unknown>;

  // If schema has properties, process them
  const properties = processed.properties as Record<string, Record<string, unknown>> | undefined;
  if (!properties) {
    return processed;
  }

  // Remove hidden fields from schema
  if (configOverrides.hiddenFields) {
    for (const field of configOverrides.hiddenFields) {
      delete properties[field];

      // Also remove from required array if present
      const required = processed.required as string[] | undefined;
      if (required) {
        processed.required = required.filter((f) => f !== field);
      }
    }
  }

  // Mark locked fields as readOnly and set their default values
  if (configOverrides.lockedInputs) {
    for (const [key, value] of Object.entries(configOverrides.lockedInputs)) {
      if (properties[key]) {
        properties[key].readOnly = true;
        properties[key].default = value;
      }
    }
  }

  // Apply default values from defaultInputs
  if (configOverrides.defaultInputs) {
    for (const [key, value] of Object.entries(configOverrides.defaultInputs)) {
      if (properties[key] && properties[key].default === undefined) {
        properties[key].default = value;
      }
    }
  }

  return processed;
}

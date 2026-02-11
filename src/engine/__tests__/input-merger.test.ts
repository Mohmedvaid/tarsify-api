/**
 * Input Merger Tests
 * Tests for the input merging logic
 */

import { describe, it, expect } from 'vitest';
import { mergeInputs, processInputSchema } from '../input-merger';
import type { ConfigOverrides } from '../types';

describe('mergeInputs', () => {
  describe('without config overrides', () => {
    it('should return user inputs unchanged', () => {
      const userInputs = { prompt: 'hello', style: 'anime' };
      const result = mergeInputs(userInputs, null);
      expect(result).toEqual(userInputs);
    });

    it('should return copy, not original reference', () => {
      const userInputs = { prompt: 'hello' };
      const result = mergeInputs(userInputs, null);
      expect(result).not.toBe(userInputs);
    });
  });

  describe('defaultInputs', () => {
    it('should apply defaults for missing fields', () => {
      const userInputs = { prompt: 'hello' };
      const config: ConfigOverrides = {
        defaultInputs: { style: 'anime', quality: 'high' },
      };

      const result = mergeInputs(userInputs, config);

      expect(result).toEqual({
        prompt: 'hello',
        style: 'anime',
        quality: 'high',
      });
    });

    it('should not override user-provided values', () => {
      const userInputs = { prompt: 'hello', style: 'realistic' };
      const config: ConfigOverrides = {
        defaultInputs: { style: 'anime' },
      };

      const result = mergeInputs(userInputs, config);

      expect(result.style).toBe('realistic');
    });

    it('should apply default for empty string', () => {
      const userInputs = { prompt: 'hello', style: '' };
      const config: ConfigOverrides = {
        defaultInputs: { style: 'anime' },
      };

      const result = mergeInputs(userInputs, config);

      expect(result.style).toBe('anime');
    });

    it('should apply default for null value', () => {
      const userInputs = { prompt: 'hello', style: null };
      const config: ConfigOverrides = {
        defaultInputs: { style: 'anime' },
      };

      const result = mergeInputs(userInputs, config);

      expect(result.style).toBe('anime');
    });
  });

  describe('lockedInputs', () => {
    it('should override user values with locked values', () => {
      const userInputs = { prompt: 'hello', width: 512 };
      const config: ConfigOverrides = {
        lockedInputs: { width: 1024, height: 1024 },
      };

      const result = mergeInputs(userInputs, config);

      expect(result).toEqual({
        prompt: 'hello',
        width: 1024,
        height: 1024,
      });
    });

    it('should apply locked after defaults', () => {
      const userInputs = { prompt: 'hello' };
      const config: ConfigOverrides = {
        defaultInputs: { width: 512 },
        lockedInputs: { width: 1024 },
      };

      const result = mergeInputs(userInputs, config);

      expect(result.width).toBe(1024);
    });
  });

  describe('hiddenFields', () => {
    it('should remove hidden fields from output', () => {
      const userInputs = {
        prompt: 'hello',
        negative_prompt: 'bad quality',
        style: 'anime',
      };
      const config: ConfigOverrides = {
        hiddenFields: ['negative_prompt'],
      };

      const result = mergeInputs(userInputs, config);

      expect(result).toEqual({
        prompt: 'hello',
        style: 'anime',
      });
      expect(result).not.toHaveProperty('negative_prompt');
    });

    it('should handle non-existent hidden fields', () => {
      const userInputs = { prompt: 'hello' };
      const config: ConfigOverrides = {
        hiddenFields: ['nonexistent'],
      };

      const result = mergeInputs(userInputs, config);

      expect(result).toEqual({ prompt: 'hello' });
    });
  });

  describe('promptPrefix and promptSuffix', () => {
    it('should wrap prompt with prefix and suffix', () => {
      const userInputs = { prompt: 'a sunset' };
      const config: ConfigOverrides = {
        promptPrefix: 'anime style, ',
        promptSuffix: ', high quality',
      };

      const result = mergeInputs(userInputs, config);

      expect(result.prompt).toBe('anime style, a sunset, high quality');
    });

    it('should apply only prefix when suffix is missing', () => {
      const userInputs = { prompt: 'a sunset' };
      const config: ConfigOverrides = {
        promptPrefix: 'anime: ',
      };

      const result = mergeInputs(userInputs, config);

      expect(result.prompt).toBe('anime: a sunset');
    });

    it('should apply only suffix when prefix is missing', () => {
      const userInputs = { prompt: 'a sunset' };
      const config: ConfigOverrides = {
        promptSuffix: ' (detailed)',
      };

      const result = mergeInputs(userInputs, config);

      expect(result.prompt).toBe('a sunset (detailed)');
    });

    it('should not wrap if prompt is not a string', () => {
      const userInputs = { prompt: 123 };
      const config: ConfigOverrides = {
        promptPrefix: 'prefix: ',
      };

      const result = mergeInputs(userInputs, config);

      expect(result.prompt).toBe(123);
    });

    it('should not wrap if prompt is missing', () => {
      const userInputs = { style: 'anime' };
      const config: ConfigOverrides = {
        promptPrefix: 'prefix: ',
      };

      const result = mergeInputs(userInputs, config);

      expect(result).not.toHaveProperty('prompt');
    });
  });

  describe('combined operations', () => {
    it('should apply all operations in correct order', () => {
      const userInputs = {
        prompt: 'a cat',
        negative_prompt: 'ugly',
      };
      const config: ConfigOverrides = {
        defaultInputs: { style: 'anime', width: 512 },
        lockedInputs: { width: 1024 },
        hiddenFields: ['negative_prompt'],
        promptPrefix: 'detailed, ',
        promptSuffix: ', masterpiece',
      };

      const result = mergeInputs(userInputs, config);

      expect(result).toEqual({
        prompt: 'detailed, a cat, masterpiece',
        style: 'anime',
        width: 1024,
      });
    });
  });
});

describe('processInputSchema', () => {
  const baseSchema = {
    type: 'object',
    required: ['prompt'],
    properties: {
      prompt: { type: 'string', description: 'The prompt' },
      negative_prompt: { type: 'string', description: 'Negative prompt' },
      width: { type: 'number', description: 'Width' },
      height: { type: 'number', description: 'Height' },
    },
  };

  it('should return schema unchanged without config', () => {
    const result = processInputSchema(baseSchema, null);
    expect(result).toEqual(baseSchema);
  });

  it('should remove hidden fields from schema', () => {
    const config: ConfigOverrides = {
      hiddenFields: ['negative_prompt'],
    };

    const result = processInputSchema(baseSchema, config) as typeof baseSchema;

    expect(result.properties).not.toHaveProperty('negative_prompt');
    expect(result.properties).toHaveProperty('prompt');
  });

  it('should mark locked fields as readOnly', () => {
    const config: ConfigOverrides = {
      lockedInputs: { width: 1024 },
    };

    const result = processInputSchema(baseSchema, config) as typeof baseSchema;

    expect((result.properties.width as { readOnly?: boolean }).readOnly).toBe(true);
    expect((result.properties.width as { default?: number }).default).toBe(1024);
  });

  it('should set default values from defaultInputs', () => {
    const config: ConfigOverrides = {
      defaultInputs: { height: 768 },
    };

    const result = processInputSchema(baseSchema, config) as typeof baseSchema;

    expect((result.properties.height as { default?: number }).default).toBe(768);
  });

  it('should not modify original schema', () => {
    const config: ConfigOverrides = {
      hiddenFields: ['negative_prompt'],
    };

    processInputSchema(baseSchema, config);

    expect(baseSchema.properties).toHaveProperty('negative_prompt');
  });
});

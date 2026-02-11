/**
 * Consumer Config Tests
 * Tests for consumer-friendly display mappings
 */
import { describe, it, expect } from 'vitest';
import {
  COMPUTE_TIERS,
  CATEGORIES,
  CREDIT_PRICING,
  DISPLAY_LABELS,
  getComputeTierDisplay,
  getCategoryDisplay,
  formatCredits,
} from './consumer';

describe('Consumer Config', () => {
  describe('COMPUTE_TIERS', () => {
    it('should have all GPU types mapped', () => {
      expect(COMPUTE_TIERS.T4).toBeDefined();
      expect(COMPUTE_TIERS.L4).toBeDefined();
      expect(COMPUTE_TIERS.A100).toBeDefined();
      expect(COMPUTE_TIERS.H100).toBeDefined();
    });

    it('should have required properties for each tier', () => {
      Object.values(COMPUTE_TIERS).forEach(tier => {
        expect(tier.key).toBeDefined();
        expect(tier.displayName).toBeDefined();
        expect(tier.description).toBeDefined();
        expect(tier.icon).toBeDefined();
        expect(tier.sortOrder).toBeDefined();
      });
    });
  });

  describe('CATEGORIES', () => {
    it('should have all categories mapped', () => {
      expect(CATEGORIES.image).toBeDefined();
      expect(CATEGORIES.text).toBeDefined();
      expect(CATEGORIES.video).toBeDefined();
      expect(CATEGORIES.audio).toBeDefined();
      expect(CATEGORIES.other).toBeDefined();
    });

    it('should have required properties for each category', () => {
      Object.values(CATEGORIES).forEach(category => {
        expect(category.key).toBeDefined();
        expect(category.displayName).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.icon).toBeDefined();
      });
    });
  });

  describe('CREDIT_PRICING', () => {
    it('should have credits per dollar', () => {
      expect(CREDIT_PRICING.CREDITS_PER_DOLLAR).toBeGreaterThan(0);
    });

    it('should have minimum purchase in cents', () => {
      expect(CREDIT_PRICING.MIN_PURCHASE_CENTS).toBeGreaterThan(0);
    });

    it('should have packages', () => {
      expect(Array.isArray(CREDIT_PRICING.PACKAGES)).toBe(true);
      expect(CREDIT_PRICING.PACKAGES.length).toBeGreaterThan(0);
    });

    it('should have required properties for each package', () => {
      CREDIT_PRICING.PACKAGES.forEach(pkg => {
        expect(pkg.credits).toBeGreaterThan(0);
        expect(pkg.priceCents).toBeGreaterThan(0);
        expect(pkg.label).toBeDefined();
        expect(typeof pkg.popular).toBe('boolean');
      });
    });
  });

  describe('DISPLAY_LABELS', () => {
    it('should have all label types', () => {
      expect(DISPLAY_LABELS.credits).toBeDefined();
      expect(DISPLAY_LABELS.computeTier).toBeDefined();
      expect(DISPLAY_LABELS.estimatedTime).toBeDefined();
    });

    it('should have credit labels', () => {
      expect(DISPLAY_LABELS.credits.singular).toBe('credit');
      expect(DISPLAY_LABELS.credits.plural).toBe('credits');
    });
  });

  describe('getComputeTierDisplay', () => {
    it('should return display name for valid GPU type', () => {
      expect(getComputeTierDisplay('T4')).toBe('Standard');
      expect(getComputeTierDisplay('L4')).toBe('Fast');
      expect(getComputeTierDisplay('A100')).toBe('Premium');
      expect(getComputeTierDisplay('H100')).toBe('Ultra');
    });

    it('should return input for unknown GPU type', () => {
      expect(getComputeTierDisplay('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should handle empty string', () => {
      expect(getComputeTierDisplay('')).toBe('');
    });
  });

  describe('getCategoryDisplay', () => {
    it('should return display name for valid category', () => {
      expect(getCategoryDisplay('image')).toBe('Image & Photos');
      expect(getCategoryDisplay('text')).toBe('Text & Writing');
      expect(getCategoryDisplay('video')).toBe('Video');
      expect(getCategoryDisplay('audio')).toBe('Audio & Music');
      expect(getCategoryDisplay('other')).toBe('Other');
    });

    it('should return input for unknown category', () => {
      expect(getCategoryDisplay('unknown')).toBe('unknown');
    });

    it('should handle empty string', () => {
      expect(getCategoryDisplay('')).toBe('');
    });
  });

  describe('formatCredits', () => {
    it('should format with commas for large numbers', () => {
      expect(formatCredits(1000)).toBe('1,000 credits');
      expect(formatCredits(2500)).toBe('2,500 credits');
    });

    it('should handle singular', () => {
      expect(formatCredits(1)).toBe('1 credit');
    });

    it('should handle zero', () => {
      expect(formatCredits(0)).toBe('0 credits');
    });

    it('should handle small numbers', () => {
      expect(formatCredits(100)).toBe('100 credits');
    });
  });
});

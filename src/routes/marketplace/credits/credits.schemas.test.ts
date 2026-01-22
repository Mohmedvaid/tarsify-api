/**
 * Marketplace Credits Schema Tests
 * Unit tests for credit system schemas
 */
import { describe, it, expect } from 'vitest';
import {
  purchaseCreditsSchema,
  listPurchasesQuerySchema,
} from './credits.schemas';
import { CREDIT_PRICING } from '@/config/consumer';

describe('Marketplace Credits Schema Tests', () => {
  describe('purchaseCreditsSchema', () => {
    it('should accept valid amount in cents', () => {
      const result = purchaseCreditsSchema.safeParse({
        amountCents: 1000, // $10
      });
      expect(result.success).toBe(true);
    });

    it('should accept minimum purchase amount', () => {
      const result = purchaseCreditsSchema.safeParse({
        amountCents: CREDIT_PRICING.MIN_PURCHASE_CENTS,
      });
      expect(result.success).toBe(true);
    });

    it('should reject below minimum', () => {
      const result = purchaseCreditsSchema.safeParse({
        amountCents: CREDIT_PRICING.MIN_PURCHASE_CENTS - 1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject above maximum', () => {
      const result = purchaseCreditsSchema.safeParse({
        amountCents: CREDIT_PRICING.MAX_PURCHASE_CENTS + 1,
      });
      expect(result.success).toBe(false);
    });

    it('should require amountCents', () => {
      const result = purchaseCreditsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-integer amount', () => {
      const result = purchaseCreditsSchema.safeParse({
        amountCents: 10.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listPurchasesQuerySchema', () => {
    it('should accept valid query params', () => {
      const result = listPurchasesQuerySchema.safeParse({
        page: 1,
        limit: 20,
      });
      expect(result.success).toBe(true);
    });

    it('should apply defaults', () => {
      const result = listPurchasesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(20);
    });

    it('should reject page less than 1', () => {
      const result = listPurchasesQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject negative page', () => {
      const result = listPurchasesQuerySchema.safeParse({ page: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = listPurchasesQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it('should coerce string to number', () => {
      const result = listPurchasesQuerySchema.safeParse({
        page: '2',
        limit: '10',
      });
      expect(result.success).toBe(true);
      expect(result.data?.page).toBe(2);
      expect(result.data?.limit).toBe(10);
    });
  });
});

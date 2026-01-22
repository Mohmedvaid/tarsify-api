/**
 * Credits Schemas
 * Zod schemas for credit management
 */
import { z } from 'zod';
import { CREDIT_PRICING } from '@/config/consumer';

// ============================================
// Input Schemas
// ============================================

/**
 * Purchase credits input
 */
export const purchaseCreditsSchema = z.object({
  // Amount in cents
  amountCents: z
    .number()
    .int()
    .min(CREDIT_PRICING.MIN_PURCHASE_CENTS, `Minimum purchase is $${CREDIT_PRICING.MIN_PURCHASE_CENTS / 100}`)
    .max(CREDIT_PRICING.MAX_PURCHASE_CENTS, `Maximum purchase is $${CREDIT_PRICING.MAX_PURCHASE_CENTS / 100}`),
});

export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;

/**
 * List purchases query params
 */
export const listPurchasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPurchasesQuery = z.infer<typeof listPurchasesQuerySchema>;

// ============================================
// Response Types
// ============================================

/**
 * Credit balance response
 */
export interface CreditBalanceResponse {
  balance: number;
  displayBalance: string;
}

/**
 * Purchase response
 */
export interface PurchaseResponse {
  id: string;
  creditsAmount: number;
  amountPaid: number;
  amountPaidDisplay: string;
  createdAt: string;
}

/**
 * Purchase credits response (mock)
 */
export interface PurchaseCreditsResponse {
  id: string;
  creditsAmount: number;
  amountPaid: number;
  newBalance: number;
  message: string;
}

/**
 * Credit packages response
 */
export interface CreditPackagesResponse {
  packages: Array<{
    credits: number;
    priceCents: number;
    priceDisplay: string;
    popular: boolean;
  }>;
  creditsPerDollar: number;
}

// ============================================
// JSON Schemas
// ============================================

export const creditBalanceJsonSchema = {
  type: 'object',
  properties: {
    balance: { type: 'integer' },
    displayBalance: { type: 'string' },
  },
  required: ['balance', 'displayBalance'],
} as const;

export const purchaseResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    creditsAmount: { type: 'integer' },
    amountPaid: { type: 'integer' },
    amountPaidDisplay: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'creditsAmount', 'amountPaid', 'amountPaidDisplay', 'createdAt'],
} as const;

export const purchaseCreditsResponseJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    creditsAmount: { type: 'integer' },
    amountPaid: { type: 'integer' },
    newBalance: { type: 'integer' },
    message: { type: 'string' },
  },
  required: ['id', 'creditsAmount', 'amountPaid', 'newBalance', 'message'],
} as const;

export const creditPackagesJsonSchema = {
  type: 'object',
  properties: {
    packages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          credits: { type: 'integer' },
          priceCents: { type: 'integer' },
          priceDisplay: { type: 'string' },
          popular: { type: 'boolean' },
        },
      },
    },
    creditsPerDollar: { type: 'integer' },
  },
  required: ['packages', 'creditsPerDollar'],
} as const;

export const purchaseCreditsBodyJsonSchema = {
  type: 'object',
  properties: {
    amountCents: {
      type: 'integer',
      minimum: CREDIT_PRICING.MIN_PURCHASE_CENTS,
      maximum: CREDIT_PRICING.MAX_PURCHASE_CENTS,
    },
  },
  required: ['amountCents'],
} as const;

export const listPurchasesQueryJsonSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
} as const;

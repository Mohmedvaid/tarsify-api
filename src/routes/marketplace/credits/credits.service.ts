/**
 * Credits Service
 * Business logic for credit management
 * MVP: Mock purchases (no real Stripe integration)
 */
import { prisma } from '@/lib/prisma';
import type { Consumer, Purchase } from '@prisma/client';
import { purchaseRepository, consumerRepository } from '@/repositories';
import { CREDIT_PRICING, formatCredits } from '@/config/consumer';
import { PAGINATION } from '@/config/constants';
import { logger } from '@/lib/logger';
import type {
  PurchaseCreditsInput,
  ListPurchasesQuery,
  CreditBalanceResponse,
  PurchaseResponse,
  PurchaseCreditsResponse,
  CreditPackagesResponse,
} from './credits.schemas';

/**
 * Format cents as dollar string
 */
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Transform purchase to response
 */
function toPurchaseResponse(purchase: Purchase): PurchaseResponse {
  return {
    id: purchase.id,
    creditsAmount: purchase.creditsAmount,
    amountPaid: purchase.amountPaid,
    amountPaidDisplay: formatCents(purchase.amountPaid),
    createdAt: purchase.createdAt.toISOString(),
  };
}

/**
 * Credits Service
 */
export const creditsService = {
  /**
   * Get credit balance
   */
  async getBalance(consumer: Consumer): Promise<{ data: CreditBalanceResponse }> {
    return {
      data: {
        balance: consumer.creditsBalance,
        displayBalance: formatCredits(consumer.creditsBalance),
      },
    };
  },

  /**
   * Get available credit packages
   */
  async getPackages(): Promise<{ data: CreditPackagesResponse }> {
    return {
      data: {
        packages: CREDIT_PRICING.PACKAGES.map((pkg) => ({
          credits: pkg.credits,
          priceCents: pkg.priceCents,
          priceDisplay: formatCents(pkg.priceCents),
          popular: pkg.popular,
        })),
        creditsPerDollar: CREDIT_PRICING.CREDITS_PER_DOLLAR,
      },
    };
  },

  /**
   * Purchase credits (MVP: mock - no real payment)
   */
  async purchaseCredits(
    consumer: Consumer,
    input: PurchaseCreditsInput
  ): Promise<{ data: PurchaseCreditsResponse }> {
    const { amountCents } = input;

    // Calculate credits based on amount
    const creditsAmount = Math.floor(
      (amountCents / 100) * CREDIT_PRICING.CREDITS_PER_DOLLAR
    );

    // Create purchase and update balance in transaction
    const [purchase, updatedConsumer] = await prisma.$transaction(async (tx) => {
      // Create purchase record
      const newPurchase = await tx.purchase.create({
        data: {
          consumerId: consumer.id,
          creditsAmount,
          amountPaid: amountCents,
          stripePaymentId: `mock_${Date.now()}`, // Mock payment ID
        },
      });

      // Add credits to consumer
      const updated = await tx.consumer.update({
        where: { id: consumer.id },
        data: {
          creditsBalance: {
            increment: creditsAmount,
          },
        },
      });

      return [newPurchase, updated];
    });

    logger.info(
      {
        purchaseId: purchase.id,
        consumerId: consumer.id,
        creditsAmount,
        amountPaid: amountCents,
      },
      'Credits purchased (mock)'
    );

    return {
      data: {
        id: purchase.id,
        creditsAmount: purchase.creditsAmount,
        amountPaid: purchase.amountPaid,
        newBalance: updatedConsumer.creditsBalance,
        message: `Successfully added ${formatCredits(creditsAmount)} to your account`,
      },
    };
  },

  /**
   * List purchase history
   */
  async listPurchases(
    consumer: Consumer,
    query: ListPurchasesQuery
  ): Promise<{
    data: PurchaseResponse[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;

    const { data, total } = await purchaseRepository.listByConsumer(consumer.id, {
      page,
      limit,
    });

    return {
      data: data.map(toPurchaseResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

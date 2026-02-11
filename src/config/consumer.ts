/**
 * Consumer Display Configuration
 * Maps internal technical terms to consumer-friendly labels
 *
 * This allows changing consumer-facing names without touching business logic.
 * Example: GPU "T4" -> displayed as "Standard" tier to consumers
 */

/**
 * Compute tier configuration
 * Maps internal GPU types to consumer-friendly display names
 *
 * To change consumer-facing names, just update the `displayName` values here.
 * The internal `key` values remain constant for database/API compatibility.
 */
export const COMPUTE_TIERS = {
  T4: {
    key: 'T4',
    displayName: 'Standard',
    description: 'Great for most tasks',
    icon: '⚡',
    sortOrder: 1,
  },
  L4: {
    key: 'L4',
    displayName: 'Fast',
    description: 'Faster processing speed',
    icon: '🚀',
    sortOrder: 2,
  },
  A100: {
    key: 'A100',
    displayName: 'Premium',
    description: 'Best performance',
    icon: '💎',
    sortOrder: 3,
  },
  H100: {
    key: 'H100',
    displayName: 'Ultra',
    description: 'Maximum power',
    icon: '⚡💎',
    sortOrder: 4,
  },
} as const;

export type ComputeTierKey = keyof typeof COMPUTE_TIERS;

/**
 * Category configuration
 * Maps internal categories to consumer-friendly labels
 */
export const CATEGORIES = {
  image: {
    key: 'image',
    displayName: 'Image & Photos',
    description: 'Image generation, editing, and enhancement',
    icon: '🖼️',
    sortOrder: 1,
  },
  text: {
    key: 'text',
    displayName: 'Text & Writing',
    description: 'Text generation, summarization, and analysis',
    icon: '📝',
    sortOrder: 2,
  },
  video: {
    key: 'video',
    displayName: 'Video',
    description: 'Video generation and editing',
    icon: '🎬',
    sortOrder: 3,
  },
  audio: {
    key: 'audio',
    displayName: 'Audio & Music',
    description: 'Audio generation and processing',
    icon: '🎵',
    sortOrder: 4,
  },
  other: {
    key: 'other',
    displayName: 'Other',
    description: 'Miscellaneous AI tools',
    icon: '🔮',
    sortOrder: 99,
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

/**
 * Credit pricing configuration
 * How much things cost in credits
 */
export const CREDIT_PRICING = {
  /** Credits per dollar when purchasing */
  CREDITS_PER_DOLLAR: 100,

  /** Minimum purchase amount in cents */
  MIN_PURCHASE_CENTS: 500, // $5.00

  /** Maximum purchase amount in cents */
  MAX_PURCHASE_CENTS: 50000, // $500.00

  /** Credit packages available for purchase */
  PACKAGES: [
    { credits: 500, priceCents: 500, label: '$5 - 500 credits', popular: false },
    { credits: 1000, priceCents: 1000, label: '$10 - 1,000 credits', popular: true },
    { credits: 2500, priceCents: 2500, label: '$25 - 2,500 credits', popular: false },
    { credits: 5000, priceCents: 5000, label: '$50 - 5,000 credits', popular: false },
    { credits: 10000, priceCents: 10000, label: '$100 - 10,000 credits', popular: false },
  ],
} as const;

/**
 * Display labels for consumer UI
 * Centralized strings that can be easily changed
 */
export const DISPLAY_LABELS = {
  credits: {
    singular: 'credit',
    plural: 'credits',
    symbol: '💰',
  },
  computeTier: {
    label: 'Speed',
    tooltip: 'Higher speed tiers process faster',
  },
  estimatedTime: {
    label: 'Estimated time',
    tooltip: 'Approximate processing time',
  },
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Get consumer-friendly display name for GPU type
 */
export function getComputeTierDisplay(gpuType: string): string {
  const tier = COMPUTE_TIERS[gpuType as ComputeTierKey];
  return tier?.displayName ?? gpuType;
}

/**
 * Get full compute tier info
 */
export function getComputeTierInfo(gpuType: string) {
  return COMPUTE_TIERS[gpuType as ComputeTierKey] ?? {
    key: gpuType,
    displayName: gpuType,
    description: '',
    icon: '⚡',
    sortOrder: 99,
  };
}

/**
 * Get consumer-friendly display name for category
 */
export function getCategoryDisplay(category: string): string {
  const cat = CATEGORIES[category as CategoryKey];
  return cat?.displayName ?? category;
}

/**
 * Get full category info
 */
export function getCategoryInfo(category: string) {
  return CATEGORIES[category as CategoryKey] ?? {
    key: category,
    displayName: category,
    description: '',
    icon: '🔮',
    sortOrder: 99,
  };
}

/**
 * Format credits for display
 */
export function formatCredits(amount: number): string {
  const { singular, plural } = DISPLAY_LABELS.credits;
  return `${amount.toLocaleString()} ${amount === 1 ? singular : plural}`;
}

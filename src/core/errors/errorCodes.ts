/**
 * Error Codes
 * Centralized error codes for consistent error handling
 * Grouped by domain for easy management
 */

export const ERROR_CODES = {
  // General Errors (1xxx)
  INTERNAL_ERROR: 'ERR_1000',
  VALIDATION_ERROR: 'ERR_1001',
  NOT_FOUND: 'ERR_1002',
  METHOD_NOT_ALLOWED: 'ERR_1003',
  RATE_LIMITED: 'ERR_1004',
  SERVICE_UNAVAILABLE: 'ERR_1005',

  // Authentication Errors (2xxx)
  UNAUTHORIZED: 'ERR_2000',
  INVALID_TOKEN: 'ERR_2001',
  TOKEN_EXPIRED: 'ERR_2002',
  FORBIDDEN: 'ERR_2003',
  INVALID_CREDENTIALS: 'ERR_2004',

  // Consumer Errors (3xxx)
  CONSUMER_NOT_FOUND: 'ERR_3000',
  CONSUMER_ALREADY_EXISTS: 'ERR_3001',
  INSUFFICIENT_CREDITS: 'ERR_3002',

  // Developer Errors (4xxx)
  DEVELOPER_NOT_FOUND: 'ERR_4000',
  DEVELOPER_ALREADY_EXISTS: 'ERR_4001',
  DEVELOPER_NOT_VERIFIED: 'ERR_4002',

  // Notebook Errors (5xxx)
  NOTEBOOK_NOT_FOUND: 'ERR_5000',
  NOTEBOOK_NOT_PUBLISHED: 'ERR_5001',
  NOTEBOOK_ALREADY_EXISTS: 'ERR_5002',
  NOTEBOOK_INVALID_STATUS: 'ERR_5003',

  // Tars Model Errors (55xx)
  TARS_MODEL_NOT_FOUND: 'ERR_5500',
  TARS_MODEL_SLUG_EXISTS: 'ERR_5501',
  TARS_MODEL_INVALID_STATUS: 'ERR_5502',
  BASE_MODEL_NOT_FOUND: 'ERR_5503',
  BASE_MODEL_NOT_ACTIVE: 'ERR_5504',

  // Execution/Engine Errors (6xxx)
  EXECUTION_NOT_FOUND: 'ERR_6000',
  EXECUTION_FAILED: 'ERR_6001',
  EXECUTION_TIMEOUT: 'ERR_6002',
  GPU_UNAVAILABLE: 'ERR_6003',
  EXECUTION_NOT_OWNED: 'ERR_6004',
  EXECUTION_NOT_CANCELLABLE: 'ERR_6005',
  INVALID_INPUT: 'ERR_6006',
  MODEL_NOT_FOUND: 'ERR_6100',
  MODEL_NOT_PUBLISHED: 'ERR_6101',
  ENDPOINT_NOT_ACTIVE: 'ERR_6102',
  RUNPOD_REQUEST_FAILED: 'ERR_6200',
  RUNPOD_RATE_LIMITED: 'ERR_6201',
  RUNPOD_INVALID_RESPONSE: 'ERR_6202',
  RUNPOD_JOB_NOT_FOUND: 'ERR_6203',

  // Payment Errors (7xxx)
  PAYMENT_FAILED: 'ERR_7000',
  PAYMENT_NOT_FOUND: 'ERR_7001',
  PAYOUT_FAILED: 'ERR_7002',
  PAYOUT_MINIMUM_NOT_MET: 'ERR_7003',

  // Database Errors (8xxx)
  DATABASE_ERROR: 'ERR_8000',
  DATABASE_CONNECTION_ERROR: 'ERR_8001',
  DATABASE_QUERY_ERROR: 'ERR_8002',

  // External Service Errors (9xxx)
  FIREBASE_ERROR: 'ERR_9000',
  STRIPE_ERROR: 'ERR_9001',
  RUNPOD_ERROR: 'ERR_9002',
  STORAGE_ERROR: 'ERR_9003',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Default error messages for each code
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.INTERNAL_ERROR]: 'An internal server error occurred',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.METHOD_NOT_ALLOWED]: 'Method not allowed',
  [ERROR_CODES.RATE_LIMITED]: 'Too many requests, please try again later',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',

  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid authentication token',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Authentication token has expired',
  [ERROR_CODES.FORBIDDEN]: 'Access denied',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid credentials',

  [ERROR_CODES.CONSUMER_NOT_FOUND]: 'Consumer not found',
  [ERROR_CODES.CONSUMER_ALREADY_EXISTS]: 'Consumer already exists',
  [ERROR_CODES.INSUFFICIENT_CREDITS]: 'Insufficient credits',

  [ERROR_CODES.DEVELOPER_NOT_FOUND]: 'Developer not found',
  [ERROR_CODES.DEVELOPER_ALREADY_EXISTS]: 'Developer already exists',
  [ERROR_CODES.DEVELOPER_NOT_VERIFIED]: 'Developer not verified',

  [ERROR_CODES.NOTEBOOK_NOT_FOUND]: 'Notebook not found',
  [ERROR_CODES.NOTEBOOK_NOT_PUBLISHED]: 'Notebook is not published',
  [ERROR_CODES.NOTEBOOK_ALREADY_EXISTS]: 'Notebook already exists',
  [ERROR_CODES.NOTEBOOK_INVALID_STATUS]: 'Invalid notebook status',

  [ERROR_CODES.TARS_MODEL_NOT_FOUND]: 'Tars model not found',
  [ERROR_CODES.TARS_MODEL_SLUG_EXISTS]: 'Tars model slug already exists',
  [ERROR_CODES.TARS_MODEL_INVALID_STATUS]: 'Invalid tars model status',
  [ERROR_CODES.BASE_MODEL_NOT_FOUND]: 'Base model not found',
  [ERROR_CODES.BASE_MODEL_NOT_ACTIVE]: 'Base model is not active',

  [ERROR_CODES.EXECUTION_NOT_FOUND]: 'Execution not found',
  [ERROR_CODES.EXECUTION_FAILED]: 'Execution failed',
  [ERROR_CODES.EXECUTION_TIMEOUT]: 'Execution timed out',
  [ERROR_CODES.GPU_UNAVAILABLE]: 'GPU resources unavailable',
  [ERROR_CODES.EXECUTION_NOT_OWNED]: 'You do not have access to this execution',
  [ERROR_CODES.EXECUTION_NOT_CANCELLABLE]: 'Execution cannot be cancelled',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided',
  [ERROR_CODES.MODEL_NOT_FOUND]: 'Model not found',
  [ERROR_CODES.MODEL_NOT_PUBLISHED]: 'Model is not published',
  [ERROR_CODES.ENDPOINT_NOT_ACTIVE]: 'RunPod endpoint is not active',
  [ERROR_CODES.RUNPOD_REQUEST_FAILED]: 'RunPod request failed',
  [ERROR_CODES.RUNPOD_RATE_LIMITED]: 'RunPod rate limit exceeded',
  [ERROR_CODES.RUNPOD_INVALID_RESPONSE]: 'Invalid response from RunPod',
  [ERROR_CODES.RUNPOD_JOB_NOT_FOUND]: 'RunPod job not found',

  [ERROR_CODES.PAYMENT_FAILED]: 'Payment failed',
  [ERROR_CODES.PAYMENT_NOT_FOUND]: 'Payment not found',
  [ERROR_CODES.PAYOUT_FAILED]: 'Payout failed',
  [ERROR_CODES.PAYOUT_MINIMUM_NOT_MET]: 'Minimum payout amount not met',

  [ERROR_CODES.DATABASE_ERROR]: 'Database error occurred',
  [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 'Database connection failed',
  [ERROR_CODES.DATABASE_QUERY_ERROR]: 'Database query failed',

  [ERROR_CODES.FIREBASE_ERROR]: 'Firebase service error',
  [ERROR_CODES.STRIPE_ERROR]: 'Payment service error',
  [ERROR_CODES.RUNPOD_ERROR]: 'GPU service error',
  [ERROR_CODES.STORAGE_ERROR]: 'Storage service error',
};

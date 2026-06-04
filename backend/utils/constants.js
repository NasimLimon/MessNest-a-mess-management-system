// Application constants
module.exports = {
  // User roles
  ROLES: {
    ADMIN: 'admin',
    MEMBER: 'member',
  },

  // Member status
  MEMBER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },

  // Meal types
  MEAL_TYPES: {
    BREAKFAST: 'breakfast',
    LUNCH: 'lunch',
    DINNER: 'dinner',
  },

  // Complaint types
  COMPLAINT_TYPES: {
    FOOD_QUALITY: 'food_quality',
    HYGIENE: 'hygiene',
    SERVICE: 'service',
    OTHER: 'other',
  },

  // Complaint status
  COMPLAINT_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
  },

  // Payment methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    TRANSFER: 'transfer',
    ONLINE: 'online',
    OTHER: 'other',
  },

  // Payment status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },

  // Notice priority
  NOTICE_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },

  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    AUTH_FAILED: 'AUTH_FAILED',
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
  },
};

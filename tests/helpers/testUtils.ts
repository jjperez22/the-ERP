// tests/helpers/testUtils.ts
// Additional test utilities and helpers

/**
 * Test timeout utilities
 */
export const timeout = {
  short: 1000,    // 1 second
  medium: 5000,   // 5 seconds  
  long: 10000     // 10 seconds
};

/**
 * Common test assertions
 */
export const assertions = {
  /**
   * Check if object has all required properties
   */
  hasRequiredProperties: (obj: any, requiredProps: string[]): boolean => {
    return requiredProps.every(prop => obj.hasOwnProperty(prop));
  },

  /**
   * Check if array contains unique values
   */
  hasUniqueValues: (arr: any[]): boolean => {
    return arr.length === new Set(arr).size;
  },

  /**
   * Check if date is within expected range
   */
  isDateInRange: (date: Date, startDate: Date, endDate: Date): boolean => {
    return date >= startDate && date <= endDate;
  }
};

/**
 * Test data generators
 */
export const generators = {
  /**
   * Generate random string of specified length
   */
  randomString: (length: number = 8): string => {
    return Math.random().toString(36).substring(2, 2 + length);
  },

  /**
   * Generate random integer between min and max
   */
  randomInt: (min: number = 0, max: number = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Generate random date within range
   */
  randomDate: (start: Date = new Date(2023, 0, 1), end: Date = new Date()): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
};

/**
 * Mock API response helpers
 */
export const mockResponses = {
  success: (data: any = {}) => ({
    status: 'success',
    data,
    timestamp: new Date().toISOString()
  }),

  error: (message: string = 'Test error', code: number = 400) => ({
    status: 'error',
    message,
    code,
    timestamp: new Date().toISOString()
  }),

  pagination: (items: any[], page: number = 1, limit: number = 10) => ({
    data: items.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit)
    }
  })
};

/**
 * Test cleanup utilities
 */
export const cleanup = {
  /**
   * Clean up test timers
   */
  timers: () => {
    jest.clearAllTimers();
    jest.useRealTimers();
  },

  /**
   * Clean up all mocks
   */
  mocks: () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  },

  /**
   * Reset environment variables
   */
  env: (originalEnv: Record<string, string | undefined>) => {
    Object.keys(originalEnv).forEach(key => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  }
};

/**
 * Performance testing helpers
 */
export const performance = {
  /**
   * Measure execution time of async function
   */
  measureAsync: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  },

  /**
   * Measure execution time of sync function
   */
  measureSync: <T>(fn: () => T): { result: T; duration: number } => {
    const start = Date.now();
    const result = fn();
    const duration = Date.now() - start;
    return { result, duration };
  }
};

/**
 * Validation helpers
 */
export const validators = {
  /**
   * Check if string is valid SKU format
   */
  isValidSKU: (sku: string): boolean => {
    return /^[A-Z]{3}-[A-Z]{2}-\d{4}$/.test(sku);
  },

  /**
   * Check if number is valid price
   */
  isValidPrice: (price: number): boolean => {
    return typeof price === 'number' && price >= 0 && Number.isFinite(price);
  },

  /**
   * Check if confidence score is valid (0-1)
   */
  isValidConfidence: (confidence: number): boolean => {
    return typeof confidence === 'number' && confidence >= 0 && confidence <= 1;
  },

  /**
   * Check if risk score is valid (0-100)
   */
  isValidRiskScore: (score: number): boolean => {
    return typeof score === 'number' && score >= 0 && score <= 100;
  }
};

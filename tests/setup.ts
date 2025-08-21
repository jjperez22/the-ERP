// tests/setup.ts
// Global test setup - runs before each test file

// Extend Jest matchers
import 'jest-extended';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.PORT = '3001'; // Different from dev port to avoid conflicts

// Mock console methods to reduce noise during testing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Only show console output if VERBOSE_TESTS env var is set
if (!process.env.VERBOSE_TESTS) {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Global test utilities
global.testUtils = {
  // Restore original console methods if needed
  restoreConsole: () => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  },

  // Wait helper for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test IDs
  generateTestId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  // Mock dates for consistent testing
  mockDate: (date: string) => {
    const mockDate = new Date(date);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    return mockDate;
  },

  // Reset date mocks
  resetDateMocks: () => {
    (global.Date as any).mockRestore?.();
  }
};

// Global type definitions for test utilities
declare global {
  var testUtils: {
    restoreConsole: () => void;
    wait: (ms: number) => Promise<void>;
    generateTestId: () => string;
    mockDate: (date: string) => Date;
    resetDateMocks: () => void;
  };
}

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset date mocks
  global.testUtils.resetDateMocks();
  
  // Reset timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export {};

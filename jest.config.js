// jest.config.js
module.exports = {
  // Test environment
  testEnvironment: 'node',

  // File extensions to consider for modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform files with TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Test match patterns
  testMatch: [
    '**/tests/**/*.(test|spec).(ts|js)',
    '**/__tests__/**/*.(test|spec).(ts|js)',
    '**/*.(test|spec).(ts|js)'
  ],

  // Files to collect coverage from
  collectCoverageFrom: [
    'services/**/*.ts',
    'controllers/**/*.ts',
    'api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],

  // Setup files to run before each test file
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Module paths for easier imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@api/(.*)$': '<rootDir>/api/$1'
  },

  // Global test timeout
  testTimeout: 10000,

  // Verbose output for detailed test results
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Enable fake timers
  fakeTimers: {
    enableGlobally: true
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Global setup
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  
  // Global teardown
  globalTeardown: '<rootDir>/tests/globalTeardown.ts'
};

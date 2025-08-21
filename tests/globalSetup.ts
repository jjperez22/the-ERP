// tests/globalSetup.ts
// Jest global setup - runs once before all tests

export default async (): Promise<void> => {
  console.log('🧪 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-chars';
  process.env.PORT = '3001'; // Different port for testing
  
  // Mock external services for testing
  process.env.OPENAI_API_KEY = 'mock-openai-key-for-testing';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/construction_erp_test';
  
  console.log('✅ Test environment setup complete');
};

// tests/globalTeardown.ts
// Jest global teardown - runs once after all tests

export default async (): Promise<void> => {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any global test resources
  // Reset environment variables if needed
  
  // Close any open connections or cleanup resources
  // In a full implementation, you might:
  // - Close database connections
  // - Stop test servers
  // - Clean up temporary files
  // - Reset mock services
  
  console.log('✅ Test environment cleanup complete');
};

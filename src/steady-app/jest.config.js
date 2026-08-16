/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  // `support/` guarda dublês compartilhados, não suítes.
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/support/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**'],
};

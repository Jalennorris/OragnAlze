/* eslint-env jest */
// ...existing code...

// Mock localStorage for React Native
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

/* eslint-env jest */
// ...existing code...

// Mock localStorage for React Native
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str) => str,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  isLoaded: () => true,
  loadAsync: () => new Promise(() => {}),
}));

import '@testing-library/jest-dom';

// Setup DOM
beforeEach(() => {
  document.body.innerHTML = '';
});

// Mock do Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    rpc: jest.fn(),
  },
}));

// Mock do fetch para testes de API
global.fetch = jest.fn();

// Mock do window.URL para testes de download
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
  writable: true,
});

// Mock do document.createElement para testes de download
const mockLink = {
  click: jest.fn(),
  setAttribute: jest.fn(),
  style: {},
} as any;

const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink;
  }
  return originalCreateElement.call(document, tagName);
});
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

const createQueryBuilder = () => {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    neq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  };

  return chain;
};

beforeEach(() => {
  document.body.innerHTML = '';
  jest.clearAllMocks();
});

jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => createQueryBuilder()),
    rpc: jest.fn(),
  },
  createSessionSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => createQueryBuilder()),
    rpc: jest.fn(),
  })),
}));

global.fetch = jest.fn();

Object.assign(global, {
  TextEncoder,
  TextDecoder,
});

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn(),
  },
  writable: true,
});

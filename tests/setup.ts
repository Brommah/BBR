import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock lib/db to prevent DATABASE_URL requirement in tests
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(() => Promise.resolve(null)),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    lead: {
      findMany: vi.fn(() => Promise.resolve([])),
      findUnique: vi.fn(() => Promise.resolve(null)),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    projectSpec: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    note: {
      findMany: vi.fn(() => Promise.resolve([])),
      create: vi.fn(),
    },
    activity: {
      findMany: vi.fn(() => Promise.resolve([])),
      create: vi.fn(),
    },
    costRate: {
      findMany: vi.fn(() => Promise.resolve([])),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
  default: {},
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock crypto.randomUUID for tests
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  } as Crypto
}

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})

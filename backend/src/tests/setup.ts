// Mock Prisma Client for tests
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  skill: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  session: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  message: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  creditTransaction: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userPreferences: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn(),
  $on: jest.fn(),
};

// Mock the Prisma module
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

// Global test setup
beforeAll(async () => {
  // Setup test environment
});

afterAll(async () => {
  // Cleanup test environment
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

export { mockPrisma };

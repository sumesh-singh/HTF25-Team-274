import { PrismaClient } from '@prisma/client';
import config from '@/config';
import logger from '@/utils/logger';

// Prevent multiple instances of Prisma Client in development
declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = globalThis.__prisma || new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (config.nodeEnv === 'development') {
  globalThis.__prisma = prisma;
}

// Handle Prisma Client connection events
prisma.$on('query', (e) => {
  if (config.nodeEnv === 'development') {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Params: ${e.params}`);
    logger.debug(`Duration: ${e.duration}ms`);
  }
});

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

// Test database connection
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
    
    // Test query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database query test successful');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('✅ Database disconnected successfully');
  } catch (error) {
    logger.error('❌ Database disconnection failed:', error);
    throw error;
  }
};

export default prisma;
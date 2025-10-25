# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S skillsync -u 1001

# Copy built application
COPY --from=builder --chown=skillsync:nodejs /app/dist ./dist
COPY --from=builder --chown=skillsync:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=skillsync:nodejs /app/package*.json ./

# Create uploads directory
RUN mkdir -p uploads && chown skillsync:nodejs uploads

USER skillsync

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
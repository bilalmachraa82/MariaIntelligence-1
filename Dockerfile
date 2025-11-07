# ==========================================
# MariaIntelligence Production Dockerfile
# ==========================================
# Multi-stage build for optimized production image
# Frontend: React + Vite → dist/client
# Backend: Express + TypeScript (ES Modules) → dist/server/index.js

# ──────────────────────────────────────────
# Stage 1: Dependencies
# ──────────────────────────────────────────
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --include=dev

# ──────────────────────────────────────────
# Stage 2: Builder
# ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy all source code
COPY . .

# Build frontend (Vite) → dist/client
# Build backend (esbuild) → dist/server/index.js
RUN npm run build:render

# Verify build outputs
RUN ls -la dist/ && \
    ls -la dist/client/ && \
    ls -la dist/server/ && \
    test -f dist/server/index.js || (echo "❌ Server build failed!" && exit 1)

# ──────────────────────────────────────────
# Stage 3: Production Runtime
# ──────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy production startup script
COPY --chown=nodejs:nodejs start-server.js ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server using production script
CMD ["node", "start-server.js"]

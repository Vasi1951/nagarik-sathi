# Build stage - compile the React frontend
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source
COPY . .

# Build the React application
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────

# Production stage - lean image with only runtime dependencies
FROM node:22-alpine AS production

WORKDIR /app

# Create non-root user for security (never run as root in containers)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy server source
COPY --from=builder /app/server ./server

# Switch to non-root user
USER nodeuser

# Cloud Run uses PORT env variable
ENV NODE_ENV=production
EXPOSE 3000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server/index.js"]

# ==============================================================================
# Production Dockerfile for Wedding Invitation Portal (VowPortal)
# Uses Debian bookworm-slim to guarantee reliable glibc C++ bindings for
# better-sqlite3 without external shell script dependencies.
# ==============================================================================

# --- Stage 1: Build Environment ---
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install native compilation toolchain required for better-sqlite3 node-gyp
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    sqlite3 \
  && rm -rf /var/lib/apt/lists/*

# Copy package definitions
COPY package.json package-lock.json ./

# Clean install all dependencies (including dev tools for build)
RUN npm ci

# Copy project source files and configuration
COPY tsconfig.json vite.config.ts index.html server.ts healthcheck.cjs ./
COPY server/ ./server/
COPY src/ ./src/
COPY public/ ./public/

# Build Vite client assets and esbuild server bundle to dist/
RUN npm run build

# Remove development dependencies for a lean production footprint
RUN npm prune --omit=dev

# --- Stage 2: Production Runtime ---
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ARG PORT=3000
ENV NODE_ENV=production
ENV PORT=${PORT}

# Create persistent storage directory for SQLite database with full write access
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy built application and production dependencies from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/healthcheck.cjs ./

# Mountable volume for durable SQLite database persistence
VOLUME ["/app/data"]

# Expose server port (dynamically set from PORT variable)
EXPOSE ${PORT}

# Reliable container healthcheck with immediate process exit and timeout handling
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD node healthcheck.cjs || exit 1

# Direct execution without shell script wrapper - eliminates exec/CRLF/permission issues
CMD ["node", "dist/server.cjs"]

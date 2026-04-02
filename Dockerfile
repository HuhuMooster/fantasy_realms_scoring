# Stage 1 — install dependencies
FROM node:24-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2 — build
FROM node:24-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm build

# Stage 3 — migrator (runs migrations and seed, then exits)
FROM node:24-slim AS migrator
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

CMD ["sh", "-c", "./node_modules/.bin/tsx src/db/migrate.ts && ./node_modules/.bin/tsx src/db/seed.ts"]

# Stage 4 — production runner
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/.output ./.output
COPY --from=builder --chown=appuser:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=appuser:nodejs /app/src/db ./src/db
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER appuser
ARG PORT=3002
ENV PORT=${PORT}
EXPOSE ${PORT}
ENV HOST=0.0.0.0

CMD ["node", ".output/server/index.mjs"]

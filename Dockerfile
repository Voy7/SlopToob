FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Build the Next.js client
RUN npm run build

# ---- Runner ----
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules (includes tsx, ffmpeg packages, prisma client, etc.)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy source (server runs TypeScript directly via tsx)
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# Copy Next.js build output
COPY --from=builder /app/src/client/.next ./src/client/.next

# Copy Next.js config files needed at runtime
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/tailwind.config.ts ./

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]

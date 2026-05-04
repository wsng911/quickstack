FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache git libc6-compat && \
    git config --global user.email "dev@example.com" && \
    git config --global user.name "dev"

COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN git init && git add -A && git commit -m "init" || true

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache docker-cli

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["node", "server.js"]

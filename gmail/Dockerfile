# ---- build the TypeScript sources ----
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc
# `tsc` only emits compiled .js files, it never copies static assets.
# index.ts serves fonts/svg/png from `<dist>/assets`, so we copy them by hand.
RUN cp -r src/assets dist/assets

# ---- install only the production dependencies ----
FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- final runtime image ----
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/index.js"]

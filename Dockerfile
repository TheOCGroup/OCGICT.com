# G — Cloud Run fallback image (temporary host; Netlify remains primary).
# Build: pnpm run build:cloudrun (vite client build + esbuild harness bundle).
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build:cloudrun

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/cloudrun.js"]

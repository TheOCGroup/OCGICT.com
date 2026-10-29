# G — Cloud Run fallback image (temporary host; Netlify remains primary).
# Modeled on the repo's validated image: same Node version, same pnpm, and
# the patches/ directory copied BEFORE install (the lockfile's
# patchedDependencies require it — install fails without it).
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install --global pnpm@10.4.1
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build:cloudrun
RUN pnpm prune --prod

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/cloudrun.js"]

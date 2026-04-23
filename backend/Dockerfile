FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@9

FROM base AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY shared/package.json shared/
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile || pnpm install
COPY shared/ shared/
COPY backend/ backend/
RUN pnpm --filter shared build
RUN pnpm --filter backend prisma:generate
RUN pnpm --filter backend build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/backend ./backend
WORKDIR /app/backend
COPY --from=build /app/backend/node_modules ./node_modules
ENV PORT=10000
EXPOSE 10000
COPY backend/entrypoint.sh /app/backend/entrypoint.sh
RUN chmod +x /app/backend/entrypoint.sh
CMD ["/app/backend/entrypoint.sh"]

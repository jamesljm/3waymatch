FROM node:20-slim AS base
RUN npm install -g pnpm@9

FROM base AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY shared/package.json shared/
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile || pnpm install
COPY shared/ shared/
COPY frontend/ frontend/
RUN pnpm --filter shared build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm --filter frontend build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/frontend ./frontend
WORKDIR /app/frontend
ENV PORT=10000
EXPOSE 10000
CMD ["pnpm", "start", "--", "--port", "10000"]

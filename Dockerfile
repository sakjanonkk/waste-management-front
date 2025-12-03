# syntax=docker/dockerfile:1
FROM node:current-slim AS base
ARG	timezone=Asia/Bangkok
ARG ENVIRONMENT=production
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV	LANG=C.UTF-8
ENV	LC_ALL=C.UTF-8
ENV	TZ=$timezone
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app
LABEL environment=$ENVIRONMENT
### build
FROM base AS builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm run build --configuration $ENVIRONMENT
## runner
FROM unit:minimal AS runner
COPY --from=builder /app/dist/unicon-simulation-front/browser /www
COPY unit-config.json /docker-entrypoint.d/config.json

EXPOSE 8080

CMD ["unitd", "--no-daemon"]

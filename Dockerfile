# syntax=docker/dockerfile:1
FROM node:20-slim AS base
ARG timezone=Asia/Bangkok
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV TZ=$timezone
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install Bun
RUN apt-get update && apt-get install -y curl unzip && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/ && \
    rm -rf /var/lib/apt/lists/*

    
### build
FROM base AS builder
WORKDIR /app
COPY ./waste-management-front/package*.json ./waste-management-front/bun.lockb* ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

COPY ./waste-management-front/. .
RUN pnpm run build

### production
FROM nginx:alpine
COPY --from=builder /app/dist/unicon-simulation-front/browser /usr/share/nginx/html
COPY ./waste-management-front/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4000

CMD ["nginx", "-g", "daemon off;"]
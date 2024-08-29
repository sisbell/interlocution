FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app

# Install root dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

WORKDIR /usr/src/app/apps/game-server

# Install dependencies for 'game-server'
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

# Install type declarations for 'game-server'
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -D @types/express @types/body-parser @types/cors

WORKDIR /usr/src/app

RUN pnpm run -r build
RUN pnpm deploy --filter=game-server --prod /prod/game-server

FROM base AS app1
COPY --from=build /prod/game-server /prod/game-server
WORKDIR /prod/game-server
EXPOSE 8000
CMD [ "pnpm", "start" ]

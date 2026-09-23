# Build the frontend, then run the Express server that serves it and proxies
# the Deepgram voice-agent WebSocket. One container, one port.
FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
RUN pnpm install --frozen-lockfile && cd frontend && pnpm install --frozen-lockfile
COPY . .
RUN cd frontend && pnpm build

FROM node:24-alpine
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist
EXPOSE 3000
CMD ["node", "--no-deprecation", "server.js"]

# --- build stage ---
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/mcp-utils/package.json ./packages/mcp-utils/package.json
COPY packages/mcp-server-lyzr/package.json ./packages/mcp-server-lyzr/package.json
RUN npm ci
COPY packages/mcp-utils ./packages/mcp-utils
COPY packages/mcp-server-lyzr ./packages/mcp-server-lyzr
RUN npm run build --workspaces --if-present

# --- runtime stage ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/mcp-utils/package.json ./packages/mcp-utils/package.json
COPY packages/mcp-server-lyzr/package.json ./packages/mcp-server-lyzr/package.json
RUN npm ci --omit=dev
COPY --from=build /app/packages/mcp-utils/dist ./packages/mcp-utils/dist
COPY --from=build /app/packages/mcp-server-lyzr/build ./packages/mcp-server-lyzr/build
COPY packages/mcp-server-lyzr/skills ./packages/mcp-server-lyzr/skills
EXPOSE 3001
WORKDIR /app/packages/mcp-server-lyzr
# Streamable HTTP: multi-tenant, each client sends its own Lyzr key per request.
CMD ["node", "build/index.js", "streamableHttp"]

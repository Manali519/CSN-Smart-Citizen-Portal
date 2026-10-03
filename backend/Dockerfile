FROM node:24-slim

ENV NODE_ENV=production
WORKDIR /app

# Production dependencies only, installed exactly as locked
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY scripts ./scripts

USER node
# Cloud Run sets PORT (8080); the server reads it. Run node directly so it receives SIGTERM.
CMD ["node", "src/server.js"]

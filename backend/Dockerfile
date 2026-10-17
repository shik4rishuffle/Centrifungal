FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY src/ src/

# SQLite ledger lives on a volume. node:sqlite is built in, no native module to compile.
RUN mkdir -p /data && addgroup -S appgroup && adduser -S appuser -G appgroup && chown appuser:appgroup /data
USER appuser
VOLUME ["/data"]
ENV DB_PATH=/data/centrifungal.sqlite

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=10s \
  CMD wget -q --spider http://localhost:3001/api/health || exit 1

CMD ["node", "src/index.js"]

# --- Stage 1: build the React client ---
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- Stage 2: server runtime, serving the API + the built client ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# Processed stories live here. Mount a persistent volume at /data.
ENV DATA_DIR=/data
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist ./public
RUN mkdir -p /data

VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://localhost:3000/healthz || exit 1
CMD ["node", "index.js"]

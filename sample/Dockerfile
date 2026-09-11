# Stage 1: Build & Test Environment
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Optional: Run build steps here if using TypeScript (e.g., RUN npm run build)

# Stage 2: Production Runtime
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Only install production dependencies, skipping devDependencies
RUN npm ci --only=production
COPY --from=builder /app/server.js ./server.js

EXPOSE 3000
CMD ["npm", "start"]
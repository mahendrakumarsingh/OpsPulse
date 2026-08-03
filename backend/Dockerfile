# Stage 1: Build dependencies
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Production runtime
FROM node:18-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy configuration and only install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code from the builder stage
COPY --from=builder /usr/src/app/src ./src

# Set user permissions to non-root user for security
USER node

EXPOSE 5000

CMD ["node", "src/app.js"]

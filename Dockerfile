# ==========================================
# Stage 1: Build, Lint, and Run Unit Tests
# ==========================================
FROM node:20-alpine AS tester

WORKDIR /app

# Install dependencies based on package-lock.json
COPY package*.json ./
RUN npm ci

# Copy codebase
COPY . .

# Run linting and unit tests
RUN npm run lint
RUN npm run test

# ==========================================
# Stage 2: Serve the Static Application
# ==========================================
FROM nginx:alpine

# Copy static website files from the testing stage
COPY --from=tester /app/index.html /usr/share/nginx/html/
COPY --from=tester /app/style.css /usr/share/nginx/html/
COPY --from=tester /app/app.js /usr/share/nginx/html/
COPY --from=tester /app/calculator.js /usr/share/nginx/html/

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

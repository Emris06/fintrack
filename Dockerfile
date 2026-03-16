# ── Stage 1: Build frontend ──────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build backend ──────────────────────────────
FROM gradle:8.14-jdk17-alpine AS backend-build

WORKDIR /app/backend
COPY backend/ ./
# Copy frontend build output into Spring Boot static resources
COPY --from=frontend-build /app/frontend/dist/ ./src/main/resources/static/
RUN gradle bootJar --no-daemon -x test

# ── Stage 3: Production image ───────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S fintrack && adduser -S fintrack -G fintrack

COPY --from=backend-build /app/backend/build/libs/*.jar app.jar

RUN chown -R fintrack:fintrack /app
USER fintrack

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

# Fix (Bug #52 - Production-Readiness): Multi-stage containerization Dockerfile
# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend JAR
FROM eclipse-temurin:17-jdk-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY backend/src src
RUN ./mvnw clean package -DskipTests -B

# Stage 3: Minimal Production Runtime
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=backend-builder /app/backend/target/task-tracker-*.jar app.jar
USER appuser
EXPOSE 8080
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

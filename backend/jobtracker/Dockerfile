# ---- Build stage ----
# Uses the official Gradle image with JDK 17 to compile and package the application
FROM gradle:8.5-jdk17 AS build

WORKDIR /app

# Copy all source files into the build container
COPY . .

# Build the jar, skipping tests to speed up the Docker build
RUN ./gradlew clean build -x test

# ---- Run stage ----
# Uses a slim JRE-only image — much smaller than the full JDK build image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy only the built jar from the build stage — nothing else is needed at runtime
COPY --from=build /app/build/libs/jobtracker-0.0.1-SNAPSHOT.jar app.jar

# Render sets the PORT env var — Spring reads it via ${PORT:8080} in application.properties
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

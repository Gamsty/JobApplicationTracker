# ---- Build stage ----
# Uses the official Gradle image with JDK 17 to compile and package the application
FROM gradle:8.5-jdk17 AS build

WORKDIR /app

# Copy all source files into the build container
COPY . .

# Download the Azure Application Insights Java agent here (gradle image has curl/wget).
# The agent attaches at runtime via -javaagent and auto-instruments Spring, JDBC, HTTP
# clients, and outbound calls (including Azure Blob) with zero code changes.
ARG APPINSIGHTS_VERSION=3.5.4
RUN wget -q -O /tmp/applicationinsights-agent.jar \
    https://github.com/microsoft/ApplicationInsights-Java/releases/download/${APPINSIGHTS_VERSION}/applicationinsights-agent-${APPINSIGHTS_VERSION}.jar

# Build the jar, skipping tests to speed up the Docker build
RUN ./gradlew clean build -x test

# ---- Run stage ----
# Uses a slim JRE-only image — much smaller than the full JDK build image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy only the built jar from the build stage — nothing else is needed at runtime
COPY --from=build /app/build/libs/jobtracker-0.0.1-SNAPSHOT.jar app.jar

# Copy the Application Insights agent across from the build stage
COPY --from=build /tmp/applicationinsights-agent.jar /app/applicationinsights-agent.jar

# Attach the agent via JAVA_TOOL_OPTIONS — the JVM picks this up automatically.
# The agent reads APPLICATIONINSIGHTS_CONNECTION_STRING at startup; if it's not set
# (e.g. local dev), the agent logs a warning and stays passive instead of crashing.
#
# -XX:TieredStopAtLevel=1 skips C2 JIT compilation during boot. Combined with the
# AppInsights agent's class-transformation overhead, full C2 was pushing Spring's
# Tomcat-bind step past Render's port-scan window. This trades some peak runtime
# throughput for ~15-30s faster cold start, which matters on free-tier instances
# that get killed before they finish booting.
ENV JAVA_TOOL_OPTIONS="-javaagent:/app/applicationinsights-agent.jar -XX:TieredStopAtLevel=1"

# Render sets the PORT env var — Spring reads it via ${PORT:8080} in application.properties
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

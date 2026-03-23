FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY gradle gradle
COPY gradlew build.gradle settings.gradle ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true
COPY src src
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

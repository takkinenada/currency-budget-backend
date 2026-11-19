# === Stage 1: Build ===
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Спочатку кешуємо залежності
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Копіюємо код і збираємо JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# === Stage 2: Runtime ===
FROM eclipse-temurin:17-jre
WORKDIR /app

# Створюємо непривілейованого користувача
RUN useradd -r -u 1001 appuser
USER appuser

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/urandom", "-jar", "app.jar"]
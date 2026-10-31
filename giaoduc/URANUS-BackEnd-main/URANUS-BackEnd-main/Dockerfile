# Stage 1: Build the application using Maven
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml and resolve dependencies
# This layer will be cached unless pom.xml changes
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the rest of the source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create a minimal runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Alpine khong kem du lieu mui gio, va image nay mac dinh chay UTC.
# Hibernate sinh @CreationTimestamp theo gio JVM, nen moi created_at/sent_at
# bi luu lech 7 tieng so voi gio Viet Nam. Thieu goi tzdata thi bien TZ ben
# duoi khong phan giai duoc va van roi ve UTC.
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh

# Copy the built JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Dat thang -Duser.timezone de khong phu thuoc vao viec runtime co doc bien TZ hay khong
ENTRYPOINT ["java", "-Duser.timezone=Asia/Ho_Chi_Minh", "-jar", "app.jar"]

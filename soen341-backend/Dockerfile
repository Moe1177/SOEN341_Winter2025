# Description: Dockerfile for building the backend of the application
FROM maven:3.8.4-openjdk-17 AS build

# Set the working directory
WORKDIR /app

# Copy the pom.xml file and download the dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Use official OpenJDK image to run the application
FROM openjdk:17-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the built jar file from the build stage
COPY --from=build /app/target/demo-0.0.1-SNAPSHOT.jar .

# Expose the port
EXPOSE 8080

# Specify the command to run the application
ENTRYPOINT ["java", "-jar", "/app/demo-0.0.1-SNAPSHOT.jar"]
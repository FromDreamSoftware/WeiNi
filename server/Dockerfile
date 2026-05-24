FROM eclipse-temurin:21-jre-alpine

RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app

COPY target/*.jar app.jar

EXPOSE 8084

ENTRYPOINT ["java", "-Dfile.encoding=UTF-8", "-Duser.timezone=Asia/Shanghai", "-jar", "app.jar"]

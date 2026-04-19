FROM eclipse-temurin:25-jre

WORKDIR /codemaat
COPY ./code-maat-1.0.4-standalone.jar ./codemaat-standalone.jar

ENTRYPOINT ["java", "-Djava.awt.headless=true", "-jar", "codemaat-standalone.jar"]

CMD ["-h"]

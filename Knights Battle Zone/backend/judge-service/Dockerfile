FROM eclipse-temurin:17-jre-jammy
RUN addgroup --system app && adduser --system --ingroup app app
WORKDIR /app
COPY --chown=app:app target/judge-service-1.0.0.jar /app/judge-service.jar
# NOTE: To allow this service to start and control docker containers on the host,
# mount the docker socket when running the container: `-v /var/run/docker.sock:/var/run/docker.sock`
EXPOSE 5000
USER app
ENTRYPOINT ["java","-jar","/app/judge-service.jar"]

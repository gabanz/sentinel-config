FROM alpine

ADD ./sentinel-config /app/
ADD ./web/* /app/web/
ADD ./error-burn.libsonnet /app/

VOLUME /app
WORKDIR /app

EXPOSE 9099

CMD ["/app/sentinel-config"]  

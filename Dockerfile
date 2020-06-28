FROM alpine

ADD ./sentinel-config /app/
ADD ./web/index.html /app/web/
ADD ./web/index.css /app/web/
ADD ./web/components/* /app/web/components/
ADD ./error-burn.libsonnet /app/

VOLUME /app
WORKDIR /app

EXPOSE 9099

CMD ["/app/sentinel-config"]  

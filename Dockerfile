FROM novice/build:latest as my_build
WORKDIR /workspace

COPY nodejs /workspace/nodejs
COPY build_app.sh .
RUN /workspace/build_app.sh

FROM ubuntu:latest
LABEL maintainer="David <david@cninone.com>"

# Get noninteractive frontend for Debian to avoid some problems:
#    debconf: unable to initialize frontend: Dialog
ENV DEBIAN_FRONTEND noninteractive   
COPY ins_pack.sh /ins_pack.sh
RUN /ins_pack.sh
ENV LANG en_US.UTF-8  
ENV LANGUAGE en_US:en  
ENV LC_ALL en_US.UTF-8

COPY nginx/index.html /var/www/index.html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/letsencrypt /etc/nginx/letsencrypt
COPY nginx/freego.crt /etc/ssl/freego.crt
COPY nginx/freego.key /etc/ssl/freego.key

COPY --from=my_build /workspace/app /app
WORKDIR /etc/nginx/conf.d
EXPOSE 80 443

ENTRYPOINT ["/app"]
# CMD ["/init"]

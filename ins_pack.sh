#!/bin/bash

apt-get update && apt-get install -y tzdata curl wget procps net-tools \
	ca-certificates apt-transport-https sudo vim \
	software-properties-common locales tzdata \
	letsencrypt && locale-gen en_US.UTF-8

TZ="Asia/Chongqing"
ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone 

mkdir -p /var/log/nginx /var/www/cache /var/www/ssl-proof/.well-known
# nginx
printf '%s\n%s\n' "deb http://nginx.org/packages/mainline/ubuntu/ bionic nginx" "deb-src http://nginx.org/packages/mainline/ubuntu/ bionic nginx" >> /etc/apt/sources.list
wget -qO - http://nginx.org/keys/nginx_signing.key | apt-key add -
apt-get update && apt-get install -y nginx \
	&& rm -rf /var/lib/apt/lists/* 

chown -R www-data:www-data /var/www

rm -- "$0"
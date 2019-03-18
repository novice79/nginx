#!/bin/bash
log () {
    printf "[%(%Y-%m-%d %T)T] %s\n" -1 "$*"
}

cd /workspace/nodejs && npm i 
sed -i "s@/socket.io@/letsencrypt/socket.io@" /workspace/nodejs/public/js/index.js
pkg . -t node10-linux -o ../app


rm -- "$0"
# nginx
for docker auto build

usage:
docker run --name ng -p 7922:22 -p 80:80 -p 443:443 -v /data/config/nginx:/etc/nginx:ro -d -t novice/nginx

docker build -t ng .
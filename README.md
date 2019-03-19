# nginx
for docker auto build

usage:
docker run --name ng -p 7922:22 -p 80:80 -p 443:443 -v /data/config/nginx:/etc/nginx:ro -d -t novice/nginx

docker build -t ng .

docker run -d --name ng ng
//test use directly container ip
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ng
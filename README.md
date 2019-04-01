# nginx
for docker auto build

usage:
docker run --name ng -p 80:80 -p 443:443 -v letsencrypt:/etc/letsencrypt -d -t novice/nginx

docker build -t ng .

docker run -d --name ng ng
docker run -d --name ng -p 80:80 -p 443:443 ng
//test use directly container ip
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ng
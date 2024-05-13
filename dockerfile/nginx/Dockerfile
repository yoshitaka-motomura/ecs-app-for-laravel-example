FROM nginx:stable-alpine3.19

WORKDIR /var/www/html

COPY ../../backend /var/www/html

COPY ../../config/nginx/conf.d /etc/nginx/conf.d

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
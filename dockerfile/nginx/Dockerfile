FROM ghcr.io/yoshitaka-motomura/php:8.2.17 as backend

WORKDIR /var/www/html

COPY ../../backend /var/www/html

RUN composer install

FROM nginx:stable-alpine3.19

WORKDIR /var/www/html

COPY ../../backend /var/www/html

COPY --from=backend /var/www/html/vendor /var/www/html/vendor

COPY ../../config/nginx/conf.d /etc/nginx/conf.d

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
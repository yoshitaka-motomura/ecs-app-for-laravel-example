FROM ghcr.io/yoshitaka-motomura/php:8.2.17

WORKDIR /var/www/html

COPY ../../backend /var/www/html

RUN composer install

RUN php artisan storage:link && \
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

RUN php artisan optimize

ENTRYPOINT ["/usr/bin/supervisord", "-n","-c", "/etc/supervisord.conf"]
FROM node:20.13 as frontend

WORKDIR /app

COPY ../../app/package*.json  .

RUN npm install

COPY ../../app .

RUN npm run build

FROM nginx:stable-alpine3.19

WORKDIR /var/www/html

COPY --from=frontend /app/dist .

COPY ../../config/nginx/conf.d/app.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
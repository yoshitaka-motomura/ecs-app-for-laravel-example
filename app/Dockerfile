FROM node:20.13 as frontend

WORKDIR /app

COPY ./package*.json  ./

RUN npm ci

COPY . ./

RUN npm run build

FROM nginx:stable-alpine3.19

WORKDIR /var/www/html

COPY ./nginx/app.conf /etc/nginx/conf.d/default.conf

COPY --from=frontend /app/dist .


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
# build
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist/spa /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

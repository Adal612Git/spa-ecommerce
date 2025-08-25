# build
FROM node:20 AS build
WORKDIR /app

# Copia manifiestos…
COPY package*.json ./

# …y luego TODO el proyecto (quasar prepare necesita ver quasar.config.ts y src/)
COPY . .

# Instala deps y construye
RUN npm ci
RUN npm run build

# serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist/spa /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

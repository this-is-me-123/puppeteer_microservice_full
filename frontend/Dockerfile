FROM node:18 AS build
WORKDIR /app

COPY . .

# COPY index.html explicitly from public to root (Vite expects this!)
RUN cp public/index.html index.html

RUN npm install
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

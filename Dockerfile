# Stage 1: Build React App
FROM node:14 AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

# Stage 2: Setup Nginx and copy build files
FROM nginx:1.15-alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports and start Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

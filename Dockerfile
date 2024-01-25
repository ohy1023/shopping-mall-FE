# Stage 1: Build React App
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
COPY package-lock.json ./
RUN npm install
RUN npm install react-scripts@3.4.1 -g --silent
COPY . ./
RUN npm run build

# Stage 2: Serve React App with Node.js
FROM node:lts-alpine
WORKDIR /app

# 복사할 대상 경로를 build-stage에서의 WORKDIR에 맞게 설정
COPY --from=build-stage /app/build /app

EXPOSE 3000

CMD ["npm", "start"]

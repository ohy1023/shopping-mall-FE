# 스테이지 1: React 앱 빌드
FROM node:lts-alpine as build-stage
WORKDIR /frontent
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

# 스테이지 2: Node.js로 React 앱 서빙
FROM node:lts-alpine
WORKDIR /frontend
COPY --from=build-stage /frontend/build /frontend

EXPOSE 3000

CMD ["npm", "start"]

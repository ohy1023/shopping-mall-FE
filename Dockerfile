# 스테이지 1: React 앱 빌드
FROM node:lts-alpine as build-stage
WORKDIR /frontend
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

# 스테이지 2: Node.js로 React 앱 서빙
FROM node:lts-alpine
WORKDIR /frontend

# 스테이지 1에서 생성한 build 디렉터리를 /frontend에 복사
COPY --from=build-stage /frontend/build /frontend

EXPOSE 3000

CMD ["npm", "start"]

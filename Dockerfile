# Stage 1: Build React App
FROM node:14 AS builder

WORKDIR /app

COPY package-lock.json ./
COPY package.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Serve React App with Node.js
FROM node:14

WORKDIR /app

COPY --from=builder /app/build /app

EXPOSE 3000
CMD ["npm", "start"]

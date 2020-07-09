FROM node:12-slim
WORKDIR /usr/src/app

ENV PORT 8080
ENV HOST 0.0.0.0

COPY package*.json ./

RUN npm install --only production

COPY . .

CMD NODE_ENV=production npm start
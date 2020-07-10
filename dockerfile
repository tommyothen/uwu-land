FROM node:12-slim
WORKDIR /usr/src/app

ENV PORT 8080
ENV HOST 0.0.0.0
ENV NODE_ENV production
ENV SELF_DOMAIN uwu.land
ENV SISTER_DOMAIN app.uwu.land
ENV SISTER_PORT 8081

COPY package*.json ./

RUN npm install --only production

COPY . .

CMD npm start
FROM node

EXPOSE 24081

COPY package.json package.json

COPY package-lock.json package-lock.json

RUN npm install

COPY common common

COPY server server

CMD npm run run-server

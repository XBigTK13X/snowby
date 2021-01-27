FROM node

EXPOSE 24081

COPY package.json package.json

COPY yarn.lock yarn.lock

RUN yarn install

COPY common common

COPY server server

CMD yarn develop-server

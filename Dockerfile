FROM node:latest
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm ci && npm cache clean --force && npm run build 
EXPOSE 8080
ENTRYPOINT npm run start
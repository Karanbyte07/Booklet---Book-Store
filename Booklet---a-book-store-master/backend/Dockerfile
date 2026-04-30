FROM node:23

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 8080

CMD ["node", "server.js"]

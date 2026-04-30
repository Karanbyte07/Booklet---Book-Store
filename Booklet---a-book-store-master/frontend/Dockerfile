FROM node:23

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV HOST=0.0.0.0
ENV PORT=3000
ENV REACT_APP_API_URL=http://72.62.72.185:8080

EXPOSE 3000

CMD ["npm", "start"]

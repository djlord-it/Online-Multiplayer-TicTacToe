FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install && npm run build
EXPOSE 8000
CMD ["npm", "start"]

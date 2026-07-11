FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev || true
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

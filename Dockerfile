FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

CMD ["npm", "start"]

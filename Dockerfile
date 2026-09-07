FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Auth stays off inside the image even if .grok/app-env.json is absent.
ENV VITE_AUTH_ENABLED=false

EXPOSE 8080

CMD ["npm", "run", "dev"]

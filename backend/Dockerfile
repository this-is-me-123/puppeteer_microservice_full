FROM node:18-bullseye

# Install build tools for native modules
RUN apt-get update && \
    apt-get install -y build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
EXPOSE 3001
COPY . .
CMD ["npm", "start"]

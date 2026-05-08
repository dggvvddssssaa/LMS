FROM node:18-bullseye

# Install dependencies for mediasoup (Python 3, make, g++)
# Bullseye already has python3, but we might need build-essential
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose ports
# API
EXPOSE 4000
# Mediasoup
EXPOSE 2000-2020/udp
EXPOSE 2000-2020/tcp

CMD ["npm", "run", "dev"]

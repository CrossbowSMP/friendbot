FROM ghcr.io/playit-cloud/playit-agent:0.17 AS playit

FROM node:18-slim

WORKDIR /app

COPY --from=playit /usr/local/bin/playit /usr/local/bin/playit

RUN apt-get update && apt-get install -y \
    ca-certificates \
    python3 \
    make \
    g++ \
    cmake \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN rm -f package-lock.json && npm install --production

COPY . .
COPY start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]

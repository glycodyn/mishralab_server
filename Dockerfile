FROM node:18-slim

# Set working directory
WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy your backend code (edit this if autoDockVina.js lives elsewhere)
COPY backend/autoDockVina.js ./app/autoDockVina.js

# Copy the Linux binaries from Vina/docker
COPY Vina/docker/vina /usr/local/bin/vina
COPY Vina/docker/GlycoTorchVina /usr/local/bin/GlycoTorchVina

# Make them executable
RUN chmod +x /usr/local/bin/vina /usr/local/bin/GlycoTorchVina

# Create upload folders
RUN mkdir -p /app/uploads/docking /app/uploads/results

ENV PATH="/usr/local/bin:${PATH}"

EXPOSE 3000

CMD ["node", "app/autoDockVina.js"]

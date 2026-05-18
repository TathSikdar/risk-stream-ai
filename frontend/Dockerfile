# Frontend Dockerfile
FROM node:18-slim

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose port (Vite default is 5173)
EXPOSE 5173

# Command to run in dev mode
CMD ["npm", "run", "dev", "--", "--host"]

# Backend BFF Dockerfile
# Senior SWE: Use full node image to ensure all build tools and libraries are present
FROM node:18

WORKDIR /app

# Senior SWE: Install system dependencies (full image has most, but ensure sqlite/bcrypt needs)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Senior SWE: Clean slate - ensure no host-mounted junk interferes during build
RUN rm -rf node_modules

# Install and build native modules
RUN npm install
RUN npm rebuild sqlite3 bcrypt --build-from-source

# Copy application code
# Senior SWE: The .dockerignore in this directory now prevents host node_modules from leaking.
COPY . .

# Expose port
EXPOSE 5000

# Senior SWE: Add diagnostic check to verify ELF header at startup
# We check if the file is an ELF (Linux) or PE (Windows) binary.
CMD ["sh", "-c", "file node_modules/sqlite3/build/Release/node_sqlite3.node && node src/index.js"]

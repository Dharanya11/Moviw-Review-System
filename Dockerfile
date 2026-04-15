FROM node:18

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install

# Go back and copy full project
WORKDIR /app
COPY . .

# Expose port
EXPOSE 3000

# Run server
CMD ["node", "backend/server.js"]
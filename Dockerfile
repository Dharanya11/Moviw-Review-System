# Use multi-stage builds for backend and frontend

# Backend Stage
FROM node:18 AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .

# Frontend Stage
FROM node:18 AS frontend
WORKDIR /app/frontend
COPY frontend/ .

# Final Stage
FROM node:18
WORKDIR /app
COPY --from=backend /app/backend ./backend
COPY --from=frontend /app/frontend ./frontend

# Expose port
EXPOSE 3000

# Run server
CMD ["node", "backend/server.js"]
# Stage 1: Build React frontend
FROM node:20-alpine as frontend-build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy frontend source code and environment files
COPY .env* ./
COPY public/ ./public/
COPY src/ ./src/

# Build the React app
RUN npm run build

# Stage 2: Set up Python Flask backend
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Create directory for uploaded images
RUN mkdir -p public/images

# Copy backend code
COPY backend/ ./backend/

# Copy .env file
COPY .env .

# Copy the built React app from the previous stage
COPY --from=frontend-build /app/build ./build

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Set the working directory
WORKDIR /app

# Create a startup script
RUN echo '#!/bin/bash\n\
cd /app/backend\n\
gunicorn --bind 0.0.0.0:5000 app:app' > /app/start.sh && \
chmod +x /app/start.sh

# Expose the port
EXPOSE 5000

# Command to run the app
CMD ["/app/start.sh"]
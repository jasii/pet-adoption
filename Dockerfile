# Stage 1: Build React app
FROM node:16 as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY ./src ./src
COPY ./public ./public

RUN npm run build

# Stage 2: Build backend and serve frontend
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy backend files
COPY backend ./backend
COPY pets.db ./

# Copy built React app from Stage 1
COPY --from=build /app/build ./build

# Copy entrypoint script
COPY entrypoint.sh .

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 5000
EXPOSE 80

# Run entrypoint script
CMD ["./entrypoint.sh"]
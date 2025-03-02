#!/bin/sh

# Start the backend
python backend/app.py &

# Serve the frontend
cd build
python -m http.server 80
#!/bin/bash

# UAE Work Hub - Startup Script
echo "🇦🇪 Starting UAE Work Hub API..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    brew services start mongodb/brew/mongodb-community
    sleep 2
fi

# Set environment variables
export NODE_ENV=development
export PORT=5001
export MONGODB_URI=mongodb://localhost:27017/uae_workhub

# Start the development server
echo "🚀 Starting API server on port 5001..."
npm run dev
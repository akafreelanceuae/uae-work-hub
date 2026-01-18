#!/bin/bash

# Kill any existing servers on port 5001
lsof -ti :5001 | xargs kill -9 2>/dev/null || true

# Create logs directory
mkdir -p logs

# Start the server
NODE_ENV=development PORT=5001 npx tsx src/index.ts &

# Store PID
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait a moment for server to start
sleep 3

# Check if it's running
if lsof -i :5001 > /dev/null 2>&1; then
    echo "✅ Server is running on port 5001"
    echo "🔗 Health check: http://localhost:5001/health"
    echo "📋 To stop: kill $SERVER_PID"
else
    echo "❌ Server failed to start"
    exit 1
fi

# Keep the process running in background
echo "Server PID: $SERVER_PID" > .server.pid
#!/bin/bash

echo "🚀 Performance Review System - Installation Script"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker version: $(docker --version)"

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install npm dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOF
REACT_APP_API_BASE_URL=http://localhost:8080/api/v1
REACT_APP_NOCODB_URL=http://localhost:8080
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check if NocoDB is running
if docker ps | grep -q nocodb; then
    echo "✅ NocoDB is already running"
else
    echo "🐳 Starting NocoDB..."
    docker run -d --name nocodb \
        -v "$(pwd)"/nocodb:/usr/app/data/ \
        -p 8080:8080 \
        nocodb/nocodb:latest
    
    if [ $? -eq 0 ]; then
        echo "✅ NocoDB started successfully"
        echo "🌐 NocoDB is available at: http://localhost:8080"
    else
        echo "❌ Failed to start NocoDB"
        exit 1
    fi
fi

# Wait for NocoDB to be ready
echo "⏳ Waiting for NocoDB to be ready..."
sleep 10

# Check if NocoDB is responding
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ NocoDB is responding"
else
    echo "⚠️  NocoDB might not be ready yet. Please wait a few more seconds."
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Access NocoDB at: http://localhost:8080"
echo "2. Create a new project in NocoDB"
echo "3. Import the database schema (see README.md)"
echo "4. Start the React app: npm start"
echo ""
echo "🔗 Useful URLs:"
echo "- React App: http://localhost:3000"
echo "- NocoDB: http://localhost:8080"
echo ""
echo "📚 For more information, see README.md"
echo ""
echo "Happy coding! 🚀"

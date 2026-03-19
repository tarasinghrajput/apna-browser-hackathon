#!/bin/bash

echo "==================================="
echo "Apna Browser - Quick Start Script"
echo "==================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed"
echo "   Version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm is installed"
echo "   Version: $(npm --version)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo ""
    echo "✅ Dependencies already installed"
fi

# Check if required files exist
echo ""
echo "📄 Checking required files..."
required_files=("index.html" "homepage.html" "main.js" "renderer.js" "package.json")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

echo ""
echo "==================================="
echo "Starting Apna Browser..."
echo "==================================="
echo ""

npm start

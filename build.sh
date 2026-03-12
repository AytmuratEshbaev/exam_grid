#!/bin/bash
echo "Installing server dependencies..."
cd server
npm install

echo "Installing client dependencies and building..."
cd ../client
npm install
npm run build

echo "Build complete."

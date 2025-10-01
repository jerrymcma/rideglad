#!/usr/bin/env bash

# This ensures npm installs dependencies in the mobile directory
# even when EAS uploads the entire monorepo

set -e

echo "📦 Installing mobile app dependencies..."
npm install --legacy-peer-deps

echo "✅ Dependencies installed successfully"

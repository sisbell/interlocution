#!/bin/bash

# Enable Corepack (if not already enabled)
corepack enable

# Install root dependencies
pnpm install

# Navigate to the 'game-server' package directory
cd apps/game-server

# Install dependencies for 'game-server'
pnpm install

# Install type declarations for 'game-server'
pnpm install -D @types/express @types/body-parser @types/cors

# Return to the root directory to run the build script
cd ..

# Build all packages
pnpm run -r build


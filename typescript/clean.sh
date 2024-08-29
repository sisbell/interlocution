#!/bin/bash

# Clean all packages in the workspace
rm -rf ./node_modules
pnpm run -r clean
pnpm run -r remove-modules


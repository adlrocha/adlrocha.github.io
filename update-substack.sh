#!/bin/bash

# Updates Substack posts and pushes to GitHub
# Run this after publishing a new post on Substack

set -e

echo "Fetching latest Substack posts..."
npm run fetch-substack

echo ""
echo "Committing and pushing..."
git add src/data/substack-cache.json
git commit -m "Update Substack posts"
git push

echo ""
echo "✓ Done! Site will rebuild with latest posts."

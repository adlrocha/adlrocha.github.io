#!/bin/bash

# Updates Substack posts and tweets, then pushes to GitHub.
# Spins up an ephemeral RSSHub container for tweets automatically.
#
# Requires:
#   - Docker
#   - TWITTER_AUTH_TOKEN env var (auth_token cookie from x.com)
#   - TWITTER_CT0 env var (ct0 cookie from x.com)
#
# Usage: TWITTER_AUTH_TOKEN=xxx TWITTER_CT0=yyy ./update-substack.sh

set -e

echo "=== Fetching Substack posts ==="
npm run fetch-substack

echo ""
echo "=== Fetching tweets ==="
npm run fetch-tweets

echo ""
echo "Committing and pushing..."
git add src/data/substack-cache.json src/data/tweets-cache.json
git commit -m "Update Substack posts and tweets"
git push

echo ""
echo "✓ Done! Site will rebuild with latest content."

#!/usr/bin/env npx ts-node

// Imports tweets from a Twitter/X data export archive into the local cache.
//
// Twitter lets you download your full archive at:
//   Settings > Your Account > Download an archive of your data
//
// The archive contains a file called `data/tweets.js` with all your tweets.
// Point this script at that file to backfill the cache with historical tweets.
//
// This script:
//   1. Parses the tweets.js file (strips the JS wrapper to get JSON)
//   2. Filters to only original tweets (no retweets, no replies)
//   3. Merges with the existing cache (deduplicates by tweet ID)
//
// Usage:
//   npx tsx scripts/import-tweets-archive.ts path/to/twitter-archive/data/tweets.js
//
// You can also pass a plain JSON array file (e.g. from twitter-web-exporter).

import { writeFileSync, readFileSync, existsSync } from 'fs';

const TWITTER_USERNAME = 'adlrocha';
const CACHE_FILE = './src/data/tweets-cache.json';

interface Tweet {
  id: string;
  text: string;
  date: string;
  url: string;
}

interface Cache {
  lastUpdated: string;
  tweets: Tweet[];
}

interface ArchiveTweetEntry {
  tweet: {
    id_str: string;
    full_text: string;
    created_at: string;
    in_reply_to_status_id_str?: string;
    in_reply_to_user_id_str?: string;
    retweeted?: boolean;
    entities?: {
      user_mentions?: Array<{ screen_name: string }>;
    };
  };
}

function loadExistingCache(): Cache {
  if (!existsSync(CACHE_FILE)) {
    return { lastUpdated: '', tweets: [] };
  }

  try {
    const content = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    console.warn('Could not read existing cache, starting fresh');
    return { lastUpdated: '', tweets: [] };
  }
}

function parseArchiveFile(filePath: string): ArchiveTweetEntry[] {
  let content = readFileSync(filePath, 'utf-8');

  // Twitter archive uses: window.YTD.tweets.part0 = [...]
  // Strip the JS assignment prefix to get valid JSON.
  const jsonStart = content.indexOf('[');
  if (jsonStart === -1) {
    throw new Error('Could not find JSON array in file. Expected tweets.js or a JSON array.');
  }
  content = content.slice(jsonStart);

  const parsed = JSON.parse(content);

  // Handle both formats:
  // - Twitter archive: [{ tweet: { ... } }, ...]
  // - Plain JSON array: [{ id_str: "...", full_text: "...", ... }, ...]
  if (parsed.length > 0 && parsed[0].tweet) {
    return parsed as ArchiveTweetEntry[];
  }

  // Wrap plain objects into the expected format
  return parsed.map((t: Record<string, unknown>) => ({ tweet: t })) as ArchiveTweetEntry[];
}

function isOriginalTweet(entry: ArchiveTweetEntry): boolean {
  const t = entry.tweet;

  // Skip replies to other users
  if (t.in_reply_to_user_id_str) {
    return false;
  }

  // Skip retweets
  if (t.retweeted || t.full_text.startsWith('RT @')) {
    return false;
  }

  return true;
}

function main() {
  const archivePath = process.argv[2];
  if (!archivePath) {
    console.error('Usage: npx tsx scripts/import-tweets-archive.ts <path-to-tweets.js>');
    console.error('');
    console.error('Get your archive at: Twitter Settings > Your Account > Download an archive');
    console.error('Then point this script at data/tweets.js inside the archive.');
    process.exit(1);
  }

  if (!existsSync(archivePath)) {
    console.error(`File not found: ${archivePath}`);
    process.exit(1);
  }

  console.log(`Parsing archive: ${archivePath}`);
  const entries = parseArchiveFile(archivePath);
  console.log(`Found ${entries.length} total tweets in archive`);

  const originals = entries.filter(isOriginalTweet);
  console.log(`${originals.length} original tweets (excluding retweets and replies)`);

  const importedTweets: Tweet[] = originals.map((entry) => {
    const t = entry.tweet;
    return {
      id: t.id_str,
      text: t.full_text,
      date: new Date(t.created_at).toISOString(),
      url: `https://x.com/${TWITTER_USERNAME}/status/${t.id_str}`,
    };
  });

  // Merge with existing cache
  const existingCache = loadExistingCache();
  console.log(`Existing cache has ${existingCache.tweets.length} tweets`);

  const tweetMap = new Map<string, Tweet>();
  for (const tweet of existingCache.tweets) {
    tweetMap.set(tweet.id, tweet);
  }

  let newCount = 0;
  for (const tweet of importedTweets) {
    if (!tweetMap.has(tweet.id)) {
      newCount++;
    }
    tweetMap.set(tweet.id, tweet);
  }

  const merged = Array.from(tweetMap.values());
  merged.sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());

  const cache: Cache = {
    lastUpdated: new Date().toISOString(),
    tweets: merged,
  };

  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`\nImported ${newCount} new tweets`);
  console.log(`Total: ${merged.length} tweets cached to ${CACHE_FILE}`);
}

main();

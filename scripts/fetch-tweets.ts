#!/usr/bin/env npx ts-node

/**
 * Self-contained tweet fetcher.
 *
 * Spins up an ephemeral RSSHub Docker container, fetches @adlrocha's original
 * tweets (no retweets/replies), merges them into the local cache, and tears
 * the container down — all in one command.
 *
 * Environment variables:
 *   TWITTER_AUTH_TOKEN - auth_token cookie from x.com (required)
 *   TWITTER_CT0        - ct0 cookie from x.com (required)
 *   RSSHUB_PORT        - local port for the ephemeral container (default: 1200)
 *
 * Usage: npm run fetch-tweets
 */

import { writeFileSync, readFileSync, existsSync, mkdtempSync, unlinkSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { XMLParser } from 'fast-xml-parser';

const TWITTER_USERNAME = 'adlrocha';
const CACHE_FILE = './src/data/tweets-cache.json';
const CONTAINER_NAME = 'rsshub-fetch-tweets';
const RSSHUB_IMAGE = 'diygod/rsshub:latest';
const HEALTH_CHECK_INTERVAL_MS = 2000;
const HEALTH_CHECK_MAX_ATTEMPTS = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} environment variable is required.\n` +
      'Grab it from your browser: DevTools → Application → Cookies → x.com'
    );
  }
  return value;
}

function getPort(): number {
  return Number(process.env.RSSHUB_PORT ?? '1200');
}

// ---------------------------------------------------------------------------
// Docker lifecycle
// ---------------------------------------------------------------------------

function exec(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function isContainerRunning(): boolean {
  try {
    const out = exec(`docker inspect -f '{{.State.Running}}' ${CONTAINER_NAME}`);
    return out === 'true';
  } catch {
    return false;
  }
}

function removeExistingContainer(): void {
  try {
    exec(`docker rm -f ${CONTAINER_NAME}`);
    console.log('Removed stale container from a previous run');
  } catch {
    // Container didn't exist — nothing to do.
  }
}

// Writes secrets to a temporary env file and passes it via --env-file so that
// credentials never appear in process arguments (ps, /proc, docker inspect, etc.).
function startContainer(authToken: string, ct0: string, port: number): string {
  console.log(`Starting ephemeral RSSHub container on port ${port}...`);
  removeExistingContainer();

  const tmpDir = mkdtempSync(join(tmpdir(), 'rsshub-'));
  const envFile = join(tmpDir, 'env');
  writeFileSync(envFile, `TWITTER_AUTH_TOKEN=${authToken}\nTWITTER_CT0=${ct0}\n`, { mode: 0o600 });

  try {
    const cmd = [
      'docker run -d',
      `--name ${CONTAINER_NAME}`,
      `-p ${port}:1200`,
      `--env-file ${envFile}`,
      RSSHUB_IMAGE,
    ].join(' ');

    exec(cmd);
  } finally {
    // Remove the env file immediately — Docker has already read it.
    unlinkSync(envFile);
    rmSync(tmpDir, { recursive: true, force: true });
  }

  return envFile;
}

function stopContainer(): void {
  console.log('Tearing down RSSHub container...');
  try {
    exec(`docker rm -f ${CONTAINER_NAME}`);
  } catch {
    // Best-effort cleanup.
  }
}

async function waitForHealthy(port: number): Promise<void> {
  const url = `http://localhost:${port}/`;
  console.log('Waiting for RSSHub to become ready...');

  for (let attempt = 1; attempt <= HEALTH_CHECK_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        console.log('RSSHub is ready');
        return;
      }
    } catch {
      // Not ready yet.
    }
    await new Promise((r) => setTimeout(r, HEALTH_CHECK_INTERVAL_MS));
  }

  throw new Error(
    `RSSHub did not become healthy after ${HEALTH_CHECK_MAX_ATTEMPTS} attempts. ` +
    `Check: docker logs ${CONTAINER_NAME}`
  );
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// HTML / parsing helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractTweetId(url: string): string | null {
  const match = url.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Fetch tweets
// ---------------------------------------------------------------------------

async function fetchTweetsFromRssHub(port: number): Promise<Tweet[]> {
  const feedUrl = `http://localhost:${port}/twitter/user/${TWITTER_USERNAME}/exclude_rts_replies`;

  console.log(`Fetching tweets from: ${feedUrl}`);

  const response = await fetch(feedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; adlrocha-site/1.0)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}\n${body}`);
  }

  const xml = await response.text();
  console.log(`Received ${xml.length} bytes`);

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const feed = parser.parse(xml);
  const items = feed?.rss?.channel?.item || [];
  const itemArray = Array.isArray(items) ? items : [items];

  console.log(`Parsed ${itemArray.length} tweets from RSS`);

  const tweets: Tweet[] = [];

  for (const item of itemArray) {
    const link = String(item.link || '');
    const id = extractTweetId(link);
    if (!id) {
      console.warn(`Skipping item with no parseable tweet ID: ${link}`);
      continue;
    }

    const rawText = String(item.description || item.title || '');
    const text = stripHtml(rawText);

    tweets.push({
      id,
      text,
      date: new Date(String(item.pubDate || '')).toISOString(),
      url: link,
    });
  }

  return tweets;
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

function mergeTweets(existing: Tweet[], fetched: Tweet[]): Tweet[] {
  const tweetMap = new Map<string, Tweet>();

  for (const tweet of existing) {
    tweetMap.set(tweet.id, tweet);
  }

  let newCount = 0;
  for (const tweet of fetched) {
    if (!tweetMap.has(tweet.id)) {
      newCount++;
    }
    tweetMap.set(tweet.id, tweet);
  }

  console.log(`Found ${newCount} new tweets`);

  const merged = Array.from(tweetMap.values());
  merged.sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());

  return merged;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const authToken = requireEnv('TWITTER_AUTH_TOKEN');
  const ct0 = requireEnv('TWITTER_CT0');
  const port = getPort();

  try {
    // 1. Start RSSHub
    startContainer(authToken, ct0, port);
    await waitForHealthy(port);

    // 2. Fetch & merge
    const existingCache = loadExistingCache();
    console.log(`Existing cache has ${existingCache.tweets.length} tweets`);

    const fetchedTweets = await fetchTweetsFromRssHub(port);
    const mergedTweets = mergeTweets(existingCache.tweets, fetchedTweets);

    const cache: Cache = {
      lastUpdated: new Date().toISOString(),
      tweets: mergedTweets,
    };

    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`\n✓ Total: ${mergedTweets.length} tweets cached to ${CACHE_FILE}`);
    console.log(`  Last updated: ${cache.lastUpdated}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // 3. Always tear down
    stopContainer();
  }
}

main();

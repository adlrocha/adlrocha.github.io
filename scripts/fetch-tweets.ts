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

interface TweetMedia {
  url: string;
  type: 'photo' | 'gif' | 'video';
  poster?: string;       // thumbnail for video/gif
  width?: number;
  height?: number;
}

interface QuotedTweet {
  author: string;
  text: string;
  media?: TweetMedia[];
}

interface Tweet {
  id: string;
  text: string;
  date: string;
  url: string;
  media?: TweetMedia[];
  quotedTweet?: QuotedTweet;
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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ensp;/g, ' ');
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
  ).trim();
}

/**
 * Extracts media items (`<img>` and `<video>`) from an HTML string.
 * Returns the media array and the HTML with those tags removed.
 */
function extractMedia(html: string): { media: TweetMedia[]; html: string } {
  const media: TweetMedia[] = [];
  let cleaned = html;

  // Extract <video> tags (GIFs and videos) — must come before <img> to avoid
  // matching poster thumbnails as photos.
  const videoRegex = /<video\s[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = videoRegex.exec(html)) !== null) {
    const tag = match[0];
    const srcMatch = tag.match(/\bsrc=['"]([^'"]+)['"]/);
    const posterMatch = tag.match(/\bposter=['"]([^'"]+)['"]/);
    const widthMatch = tag.match(/\bwidth=['"]?(\d+)['"]?/);
    const heightMatch = tag.match(/\bheight=['"]?(\d+)['"]?/);
    const isGif = /\bautoplay\b/.test(tag) && /\bloop\b/.test(tag);

    if (srcMatch) {
      media.push({
        url: srcMatch[1],
        type: isGif ? 'gif' : 'video',
        poster: posterMatch?.[1],
        width: widthMatch ? Number(widthMatch[1]) : undefined,
        height: heightMatch ? Number(heightMatch[1]) : undefined,
      });
    }
  }

  // Remove full <video ...></video> blocks and self-closing <video ... />
  cleaned = cleaned.replace(/<video\s[^>]*>[\s\S]*?<\/video>/gi, '');
  cleaned = cleaned.replace(/<video\s[^>]*\/?\s*>/gi, '');

  // Extract <img> tags — skip hidden avatars (width='0') and any already
  // captured video posters.
  const imgRegex = /<img\s[^>]*>/gi;
  while ((match = imgRegex.exec(cleaned)) !== null) {
    const tag = match[0];
    // Skip hidden avatar images
    if (/hidden=['"]?true['"]?/i.test(tag)) continue;
    if (/width=['"]?0['"]?/i.test(tag)) continue;

    const srcMatch = tag.match(/\bsrc=['"]([^'"]+)['"]/);
    const widthMatch = tag.match(/\bwidth=['"]?(\d+)['"]?/);
    const heightMatch = tag.match(/\bheight=['"]?(\d+)['"]?/);

    if (srcMatch) {
      media.push({
        url: srcMatch[1],
        type: 'photo',
        width: widthMatch ? Number(widthMatch[1]) : undefined,
        height: heightMatch ? Number(heightMatch[1]) : undefined,
      });
    }
  }

  // Remove <img> tags (but keep hidden ones removed too for cleanliness)
  cleaned = cleaned.replace(/<img\s[^>]*>/gi, '');

  return { media, html: cleaned };
}

/**
 * Extracts a quoted tweet from the RSSHub `<div class="rsshub-quote">` block.
 * Returns the quoted tweet data and the HTML with the quote block removed.
 */
function extractQuotedTweet(html: string): { quotedTweet?: QuotedTweet; html: string } {
  // Match the rsshub-quote div — it can contain nested HTML (media, links, etc.)
  const quoteRegex = /<div\s+class=["']rsshub-quote["']>([\s\S]*?)<\/div>/i;
  const match = html.match(quoteRegex);

  if (!match) {
    return { html };
  }

  let quoteHtml = match[1];
  const cleanedOuter = html.replace(match[0], '');

  // Extract media inside the quoted tweet
  const { media: quoteMedia, html: quoteHtmlNoMedia } = extractMedia(quoteHtml);

  // Strip remaining HTML to get plain text, then parse "AuthorName:  text"
  const quoteText = stripHtml(quoteHtmlNoMedia);

  // RSSHub format: "AuthorName:&ensp;text" (after entity decoding: "AuthorName:  text")
  // The author name can contain spaces, letters, numbers, emoji, underscores, dots, parens.
  // We match up to the first ": " or ":\n" pattern.
  const authorMatch = quoteText.match(/^(.+?):\s+([\s\S]*)$/);

  if (authorMatch) {
    const quotedTweet: QuotedTweet = {
      author: authorMatch[1].trim(),
      text: authorMatch[2].trim(),
    };
    if (quoteMedia.length > 0) {
      quotedTweet.media = quoteMedia;
    }
    return { quotedTweet, html: cleanedOuter };
  }

  // If we can't parse author:text, just treat the whole thing as text
  if (quoteText.trim()) {
    return {
      quotedTweet: { author: '', text: quoteText.trim() },
      html: cleanedOuter,
    };
  }

  return { html: cleanedOuter };
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

    const rawHtml = String(item.description || item.title || '');

    // 1. Extract quoted tweet (removes the rsshub-quote div from HTML)
    const { quotedTweet, html: htmlNoQuote } = extractQuotedTweet(rawHtml);

    // 2. Extract media from the remaining HTML (tweet's own media)
    const { media, html: htmlNoMedia } = extractMedia(htmlNoQuote);

    // 3. Strip remaining HTML to get plain text
    const text = stripHtml(htmlNoMedia);

    const tweet: Tweet = {
      id,
      text,
      date: new Date(String(item.pubDate || '')).toISOString(),
      url: link,
    };

    if (media.length > 0) {
      tweet.media = media;
    }
    if (quotedTweet) {
      tweet.quotedTweet = quotedTweet;
    }

    tweets.push(tweet);
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
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Normalises tweet text for similarity comparison by stripping t.co URLs and
 * collapsing whitespace.
 */
function normalizeForComparison(text: string): string {
  return text
    .replace(/https?:\/\/t\.co\/\w+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Jaccard similarity over whitespace-tokenised words.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
function wordSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.length / union.size;
}

/**
 * Removes near-duplicate tweets from a sorted (newest-first) list.
 *
 * Duplicates are identified as tweets that:
 *   1. Were posted within `timeWindowMs` of each other (default: 5 minutes)
 *   2. Have highly similar text after normalisation (similarity >= `threshold`)
 *   3. Have non-trivial text (> 20 chars after stripping URLs)
 *
 * For each duplicate pair, the **newer** tweet is kept (the corrected version).
 * The list must already be sorted newest-first.
 */
function deduplicateTweets(
  tweets: Tweet[],
  { timeWindowMs = 5 * 60 * 1000, threshold = 0.7 } = {}
): Tweet[] {
  const removedIds = new Set<string>();

  for (let i = 0; i < tweets.length; i++) {
    if (removedIds.has(tweets[i].id)) continue;

    const normI = normalizeForComparison(tweets[i].text);
    if (normI.length <= 20) continue;

    const dateI = new Date(tweets[i].date).getTime();

    for (let j = i + 1; j < tweets.length; j++) {
      if (removedIds.has(tweets[j].id)) continue;

      const dateJ = new Date(tweets[j].date).getTime();
      // Since sorted newest-first, dateI >= dateJ.  Stop scanning once
      // the time gap exceeds the window.
      if (dateI - dateJ > timeWindowMs) break;

      const normJ = normalizeForComparison(tweets[j].text);
      if (normJ.length <= 20) continue;

      if (wordSimilarity(normI, normJ) >= threshold) {
        // Keep i (newer), discard j (older)
        console.log(
          `  Dedup: keeping ${tweets[i].id} (${tweets[i].date}), ` +
          `removing ${tweets[j].id} (${tweets[j].date})`
        );
        removedIds.add(tweets[j].id);
      }
    }
  }

  if (removedIds.size > 0) {
    console.log(`Removed ${removedIds.size} near-duplicate tweets`);
  }

  return tweets.filter((t) => !removedIds.has(t.id));
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
    const dedupedTweets = deduplicateTweets(mergedTweets);

    const cache: Cache = {
      lastUpdated: new Date().toISOString(),
      tweets: dedupedTweets,
    };

    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`\n✓ Total: ${dedupedTweets.length} tweets cached to ${CACHE_FILE}`);
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

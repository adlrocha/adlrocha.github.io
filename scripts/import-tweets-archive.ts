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

interface TweetMedia {
  url: string;
  type: 'photo' | 'gif' | 'video';
  poster?: string;
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
      media?: Array<{ url: string }>;
      urls?: Array<{
        url: string;           // t.co shortened URL
        expanded_url: string;  // real destination URL
        display_url: string;
      }>;
    };
    extended_entities?: {
      media?: Array<{
        type: string; // 'photo' | 'animated_gif' | 'video'
        media_url_https: string;
        sizes?: {
          large?: { w: number; h: number };
        };
        video_info?: {
          variants?: Array<{
            bitrate?: number;
            content_type: string;
            url: string;
          }>;
        };
      }>;
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

/**
 * Extracts media from a Twitter archive tweet's extended_entities.
 */
function extractArchiveMedia(entry: ArchiveTweetEntry): TweetMedia[] {
  const mediaEntities = entry.tweet.extended_entities?.media;
  if (!mediaEntities || mediaEntities.length === 0) return [];

  const media: TweetMedia[] = [];

  for (const m of mediaEntities) {
    const size = m.sizes?.large;

    if (m.type === 'photo') {
      media.push({
        url: m.media_url_https,
        type: 'photo',
        width: size?.w,
        height: size?.h,
      });
    } else if (m.type === 'animated_gif' || m.type === 'video') {
      // Pick the highest-bitrate MP4 variant
      const variants = m.video_info?.variants ?? [];
      const mp4Variants = variants.filter((v) => v.content_type === 'video/mp4');
      mp4Variants.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));

      const bestVariant = mp4Variants[0];
      if (bestVariant) {
        media.push({
          url: bestVariant.url,
          type: m.type === 'animated_gif' ? 'gif' : 'video',
          poster: m.media_url_https,
          width: size?.w,
          height: size?.h,
        });
      }
    }
  }

  return media;
}

/**
 * Strips t.co media URLs from tweet text since we render media separately.
 */
function stripMediaUrls(text: string, entry: ArchiveTweetEntry): string {
  const mediaEntities = entry.tweet.entities?.media;
  if (!mediaEntities) return text;
  let cleaned = text;
  for (const m of mediaEntities) {
    cleaned = cleaned.replace(m.url, '');
  }
  return cleaned.trim();
}

/**
 * Expands t.co URLs in tweet text to their real destinations using the
 * archive's `entities.urls` mapping.
 */
function expandUrls(text: string, entry: ArchiveTweetEntry): string {
  const urlEntities = entry.tweet.entities?.urls;
  if (!urlEntities) return text;
  let expanded = text;
  for (const u of urlEntities) {
    if (u.url && u.expanded_url) {
      expanded = expanded.replace(u.url, u.expanded_url);
    }
  }
  return expanded;
}

const TWEET_URL_PATTERN = /^https?:\/\/(?:x\.com|twitter\.com)\/(\w+)\/status\/(\d+)/;

/**
 * Extracts a quoted tweet reference from the archive's `entities.urls`.
 *
 * Twitter stores quote tweets as a URL entity whose `expanded_url` points to
 * another tweet (e.g. "https://x.com/user/status/123456").  We detect these,
 * strip the quote URL from the tweet text, and return a minimal QuotedTweet
 * stub with the URL so the page can render an embedded link.
 */
function extractQuotedTweetFromArchive(
  text: string,
  entry: ArchiveTweetEntry,
  allEntries: ArchiveTweetEntry[]
): { text: string; quotedTweet?: QuotedTweet } {
  const urlEntities = entry.tweet.entities?.urls;
  if (!urlEntities) return { text };

  for (const u of urlEntities) {
    const match = u.expanded_url?.match(TWEET_URL_PATTERN);
    if (!match) continue;

    const quotedAuthor = match[1];
    const quotedId = match[2];

    // Try to find the quoted tweet in the archive itself
    const quotedEntry = allEntries.find(
      (e) => e.tweet.id_str === quotedId
    );

    // Strip the t.co quote URL from the tweet text
    let cleanedText = text.replace(u.url, '').trim();

    if (quotedEntry) {
      // We have the full quoted tweet text from the archive
      const quotedText = quotedEntry.tweet.full_text
        .replace(/https?:\/\/t\.co\/\w+/g, '')
        .trim();
      return {
        text: cleanedText,
        quotedTweet: {
          author: quotedAuthor,
          text: quotedText || u.expanded_url,
        },
      };
    }

    // Quoted tweet not in archive — use the URL as a reference
    return {
      text: cleanedText,
      quotedTweet: {
        author: quotedAuthor,
        text: u.expanded_url,
      },
    };
  }

  return { text };
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
      if (dateI - dateJ > timeWindowMs) break;

      const normJ = normalizeForComparison(tweets[j].text);
      if (normJ.length <= 20) continue;

      if (wordSimilarity(normI, normJ) >= threshold) {
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
    const media = extractArchiveMedia(entry);

    // 1. Strip media t.co URLs (we render media separately)
    let text = stripMediaUrls(t.full_text, entry);

    // 2. Extract quoted tweet from entities.urls (tweet URLs → QuotedTweet)
    const { text: textNoQuote, quotedTweet } = extractQuotedTweetFromArchive(
      text,
      entry,
      entries
    );
    text = textNoQuote;

    // 3. Expand remaining t.co URLs to their real destinations
    text = expandUrls(text, entry);

    const tweet: Tweet = {
      id: t.id_str,
      text,
      date: new Date(t.created_at).toISOString(),
      url: `https://x.com/${TWITTER_USERNAME}/status/${t.id_str}`,
    };

    if (media.length > 0) {
      tweet.media = media;
    }
    if (quotedTweet) {
      tweet.quotedTweet = quotedTweet;
    }

    return tweet;
  });

  // Merge with existing cache.
  //
  // Smart merge strategy: for tweets that exist in both the cache and the
  // archive, we want the best of both worlds:
  //   - **Media** from the archive (real URLs instead of t.co links)
  //   - **quotedTweet** from the archive if the cache version has none
  //     (the archive has entities.urls that reference quoted tweets)
  //   - **Text** from the archive when the cache only has t.co links
  //   - Otherwise keep the cache text (RSSHub provides full untruncated text;
  //     the archive sometimes truncates with "...")
  //
  // For tweets only in the archive (not in cache), use the archive version
  // as-is.  For tweets only in the cache, keep them unchanged.
  const existingCache = loadExistingCache();
  console.log(`Existing cache has ${existingCache.tweets.length} tweets`);

  const tweetMap = new Map<string, Tweet>();
  for (const tweet of existingCache.tweets) {
    tweetMap.set(tweet.id, tweet);
  }

  let newCount = 0;
  let enrichedCount = 0;
  for (const imported of importedTweets) {
    const existing = tweetMap.get(imported.id);

    if (!existing) {
      // Brand new tweet — use the archive version
      newCount++;
      tweetMap.set(imported.id, imported);
      continue;
    }

    // Merge: enrich the existing cached tweet with archive data
    let changed = false;

    // Take media from the archive if the cache version has none
    if (imported.media && imported.media.length > 0 && !existing.media) {
      existing.media = imported.media;
      changed = true;
    }

    // Take quotedTweet from the archive if the cache version has none
    if (imported.quotedTweet && !existing.quotedTweet) {
      existing.quotedTweet = imported.quotedTweet;
      changed = true;
    }

    // If the cache text is just t.co links and the archive has real text,
    // prefer the archive text (which now has expanded URLs and quote URLs
    // stripped)
    const cacheTextStripped = existing.text
      .replace(/https?:\/\/t\.co\/\w+/g, '')
      .trim();
    const archiveTextStripped = imported.text
      .replace(/https?:\/\/t\.co\/\w+/g, '')
      .trim();

    if (cacheTextStripped.length === 0 && archiveTextStripped.length > 0) {
      existing.text = imported.text;
      changed = true;
    } else if (cacheTextStripped.length === 0 && archiveTextStripped.length === 0) {
      // Both are empty (media/quote-only tweet) — clear the t.co cruft
      existing.text = imported.text;
      changed = true;
    }

    if (changed) {
      enrichedCount++;
      tweetMap.set(imported.id, existing);
    }
  }

  const merged = Array.from(tweetMap.values());
  merged.sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());
  const deduped = deduplicateTweets(merged);

  const cache: Cache = {
    lastUpdated: new Date().toISOString(),
    tweets: deduped,
  };

  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`\nImported ${newCount} new tweets, enriched ${enrichedCount} existing tweets with media`);
  console.log(`Total: ${deduped.length} tweets cached to ${CACHE_FILE}`);
}

main();

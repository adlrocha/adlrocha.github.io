#!/usr/bin/env npx ts-node

/**
 * Fetches Substack RSS feed and merges with existing cached posts.
 * New posts are added, existing posts are preserved.
 *
 * Usage: npm run fetch-substack
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';

const SUBSTACK_RSS_URL = 'https://adlrocha.substack.com/feed';
const CACHE_FILE = './src/data/substack-cache.json';

interface SubstackPost {
  title: string;
  link: string;
  date: string;
  description: string;
}

interface Cache {
  lastUpdated: string;
  posts: SubstackPost[];
}

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

function loadExistingCache(): Cache {
  if (!existsSync(CACHE_FILE)) {
    return { lastUpdated: '', posts: [] };
  }

  try {
    const content = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    console.warn('Could not read existing cache, starting fresh');
    return { lastUpdated: '', posts: [] };
  }
}

async function fetchSubstackPosts(): Promise<SubstackPost[]> {
  console.log('Fetching Substack RSS feed...');

  const response = await fetch(SUBSTACK_RSS_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
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

  console.log(`Parsed ${itemArray.length} posts from RSS`);

  return itemArray.map((item: Record<string, unknown>) => ({
    title: String(item.title || ''),
    link: String(item.link || ''),
    date: new Date(String(item.pubDate || '')).toISOString(),
    description: stripHtml(String(item.description || '')).slice(0, 200) + '...',
  }));
}

function mergePosts(existingPosts: SubstackPost[], newPosts: SubstackPost[]): SubstackPost[] {
  // Create a map of existing posts by link (unique identifier)
  const postMap = new Map<string, SubstackPost>();

  // Add existing posts to map
  for (const post of existingPosts) {
    postMap.set(post.link, post);
  }

  // Add/update with new posts
  let newCount = 0;
  for (const post of newPosts) {
    if (!postMap.has(post.link)) {
      newCount++;
    }
    postMap.set(post.link, post);
  }

  console.log(`Found ${newCount} new posts`);

  // Convert back to array and sort by date (newest first)
  const merged = Array.from(postMap.values());
  merged.sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());

  return merged;
}

async function main() {
  try {
    // Load existing cache
    const existingCache = loadExistingCache();
    console.log(`Existing cache has ${existingCache.posts.length} posts`);

    // Fetch new posts from RSS
    const newPosts = await fetchSubstackPosts();

    // Merge posts (preserves old, adds new)
    const mergedPosts = mergePosts(existingCache.posts, newPosts);

    const cache: Cache = {
      lastUpdated: new Date().toISOString(),
      posts: mergedPosts,
    };

    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`\n✓ Total: ${mergedPosts.length} posts cached to ${CACHE_FILE}`);
    console.log(`  Last updated: ${cache.lastUpdated}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

#!/usr/bin/env npx ts-node

/**
 * Fetches Substack RSS feed and caches posts to a JSON file.
 * Run this locally before pushing to update Substack posts.
 *
 * Usage: npm run fetch-substack
 */

import { writeFileSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';

const SUBSTACK_RSS_URL = 'https://adlrocha.substack.com/feed';
const CACHE_FILE = './src/data/substack-cache.json';

interface SubstackPost {
  title: string;
  link: string;
  date: string;
  description: string;
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

  console.log(`Parsed ${itemArray.length} posts`);

  return itemArray.map((item: Record<string, unknown>) => ({
    title: String(item.title || ''),
    link: String(item.link || ''),
    date: new Date(String(item.pubDate || '')).toISOString(),
    description: stripHtml(String(item.description || '')).slice(0, 200) + '...',
  }));
}

async function main() {
  try {
    const posts = await fetchSubstackPosts();

    const cache = {
      lastUpdated: new Date().toISOString(),
      posts,
    };

    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`\n✓ Cached ${posts.length} posts to ${CACHE_FILE}`);
    console.log(`  Last updated: ${cache.lastUpdated}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

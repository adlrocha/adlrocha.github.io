import { XMLParser } from 'fast-xml-parser';

export interface SubstackPost {
  title: string;
  link: string;
  date: Date;
  description: string;
  isExternal: true;
}

const SUBSTACK_RSS_URL = 'https://adlrocha.substack.com/feed';

export async function fetchSubstackPosts(): Promise<SubstackPost[]> {
  try {
    console.log('[Substack] Fetching RSS feed...');

    const response = await fetch(SUBSTACK_RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AstroBot/1.0; +https://adlrocha.com)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!response.ok) {
      console.error(`[Substack] Failed to fetch RSS: ${response.status} ${response.statusText}`);
      return [];
    }

    const xml = await response.text();
    console.log(`[Substack] Received ${xml.length} bytes`);

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const feed = parser.parse(xml);
    const items = feed?.rss?.channel?.item || [];

    // Ensure items is an array
    const itemArray = Array.isArray(items) ? items : [items];

    console.log(`[Substack] Parsed ${itemArray.length} posts`);

    return itemArray.map((item: Record<string, unknown>) => ({
      title: String(item.title || ''),
      link: String(item.link || ''),
      date: new Date(String(item.pubDate || '')),
      description: stripHtml(String(item.description || '')).slice(0, 200) + '...',
      isExternal: true as const,
    }));
  } catch (error) {
    console.error('[Substack] Error fetching posts:', error);
    return [];
  }
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

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { fetchSubstackPosts } from '../lib/substack';
import { fetchTweets } from '../lib/tweets';

interface FeedItem {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const siteUrl = 'https://adlrocha.com';

  // Gather all content sources
  const blogPosts = await getCollection('blog', ({ data }) => !data.draft);
  const substackPosts = fetchSubstackPosts();
  const tweets = fetchTweets();

  const items: FeedItem[] = [
    ...blogPosts.map((post) => ({
      title: post.data.title,
      link: `${siteUrl}/writing/${post.id}`,
      pubDate: post.data.date,
      description: post.data.description ?? '',
    })),
    ...substackPosts.map((post) => ({
      title: post.title,
      link: post.link,
      pubDate: post.date,
      description: post.description,
    })),
    ...tweets.map((tweet) => {
      const fullText = tweet.quotedTweet
        ? `${tweet.text}\n\n> ${tweet.quotedTweet.author}: ${tweet.quotedTweet.text}`
        : tweet.text;
      return {
        title: tweet.text.length > 80 ? tweet.text.slice(0, 77) + '...' : tweet.text,
        link: tweet.url,
        pubDate: tweet.date,
        description: fullText,
      };
    }),
  ];

  items.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  const rssItems = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`
    )
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>adlrocha</title>
    <link>${siteUrl}</link>
    <description>Writing, tweets, and thoughts by Alfonso de la Rocha.</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

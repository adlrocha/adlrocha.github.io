import substackCache from '../data/substack-cache.json';

export interface SubstackPost {
  title: string;
  link: string;
  date: Date;
  description: string;
  isExternal: true;
}

/**
 * Returns cached Substack posts from the JSON file.
 * To update posts, run: npm run fetch-substack
 */
export function fetchSubstackPosts(): SubstackPost[] {
  try {
    const posts = substackCache.posts || [];

    return posts.map((post) => ({
      title: post.title,
      link: post.link,
      date: new Date(post.date),
      description: post.description,
      isExternal: true as const,
    }));
  } catch (error) {
    console.warn('[Substack] Error reading cache:', error);
    return [];
  }
}

import tweetsCache from '../data/tweets-cache.json';

export interface TweetMedia {
  url: string;
  type: 'photo' | 'gif' | 'video';
  poster?: string;
  width?: number;
  height?: number;
}

export interface QuotedTweet {
  author: string;
  text: string;
  media?: TweetMedia[];
}

export interface Tweet {
  id: string;
  text: string;
  date: Date;
  url: string;
  media?: TweetMedia[];
  quotedTweet?: QuotedTweet;
}

/**
 * Known accounts that appear as quoted tweet authors in the existing cache.
 * This list is used by the retroactive migration heuristic to detect quoted
 * tweets that were previously flattened into the text field.
 *
 * The pattern is: the user's own text ends, then immediately the quoted
 * author's display name appears followed by ": " and the quoted text.
 * Since display names can contain spaces and punctuation, we can't reliably
 * detect the boundary with a generic regex. Instead, we maintain this list
 * of known authors observed in the data. New tweets fetched via RSSHub will
 * be parsed structurally (via the rsshub-quote div) and won't need this.
 */
const KNOWN_QUOTE_AUTHORS = [
  'adlrocha',
  'Nikunj Kothari',
  'Beff (e/acc)',
  'Justine Moore',
  'Igor Os',
  'Charlie Bilello',
  'Pablo Grueso',
  'Erik Voorhees',
];

/**
 * Attempts to split a flattened tweet text into the user's own text and a
 * quoted tweet, using known author names. Returns the original text unchanged
 * if no quote is detected.
 *
 * RSSHub uses an en-space (U+2002 / &ensp;) after the colon, so we match
 * both regular spaces and en-spaces.
 */
function tryExtractQuotedTweet(
  text: string
): { text: string; quotedTweet?: QuotedTweet } {
  for (const author of KNOWN_QUOTE_AUTHORS) {
    // Match "Author:" followed by a regular space or en-space (U+2002)
    const patterns = [`${author}: `, `${author}:\u2002`];
    for (const pattern of patterns) {
      const idx = text.lastIndexOf(pattern);
      if (idx > 0) {
        const userText = text.slice(0, idx).trim();
        const quotedText = text.slice(idx + pattern.length).trim();
        if (userText.length > 0 && quotedText.length > 0) {
          return {
            text: userText,
            quotedTweet: { author, text: quotedText },
          };
        }
      }
    }
  }
  return { text };
}

// ---------------------------------------------------------------------------
// Build-time deduplication
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
 * Removes near-duplicate tweets from a newest-first sorted list.
 * Keeps the newer tweet (the corrected version) for each duplicate pair.
 */
function deduplicateTweets(tweets: Tweet[]): Tweet[] {
  const timeWindowMs = 5 * 60 * 1000;
  const threshold = 0.7;
  const removedIds = new Set<string>();

  for (let i = 0; i < tweets.length; i++) {
    if (removedIds.has(tweets[i].id)) continue;

    const normI = normalizeForComparison(tweets[i].text);
    if (normI.length <= 20) continue;

    const dateI = tweets[i].date.getTime();

    for (let j = i + 1; j < tweets.length; j++) {
      if (removedIds.has(tweets[j].id)) continue;

      const dateJ = tweets[j].date.getTime();
      if (dateI - dateJ > timeWindowMs) break;

      const normJ = normalizeForComparison(tweets[j].text);
      if (normJ.length <= 20) continue;

      if (wordSimilarity(normI, normJ) >= threshold) {
        removedIds.add(tweets[j].id);
      }
    }
  }

  return tweets.filter((t) => !removedIds.has(t.id));
}

/**
 * Returns cached tweets from the JSON file.
 * To update tweets, run: npm run fetch-tweets
 *
 * For tweets that were cached before the quoted-tweet extraction was added,
 * this function applies a heuristic to retroactively detect and split quoted
 * tweets from the flattened text.
 */
export function fetchTweets(): Tweet[] {
  try {
    const tweets = tweetsCache.tweets || [];

    const mapped = tweets.map((tweet) => {
      const hasStructuredQuote = 'quotedTweet' in tweet && tweet.quotedTweet;
      const hasMedia = 'media' in tweet && tweet.media;

      // If the tweet already has structured data, use it directly
      if (hasStructuredQuote) {
        return {
          id: tweet.id,
          text: tweet.text,
          date: new Date(tweet.date),
          url: tweet.url,
          media: hasMedia
            ? (tweet as Record<string, unknown>).media as TweetMedia[]
            : undefined,
          quotedTweet: (tweet as Record<string, unknown>)
            .quotedTweet as QuotedTweet,
        };
      }

      // Retroactively try to extract a quoted tweet from the flattened text
      const { text: cleanText, quotedTweet } = tryExtractQuotedTweet(
        tweet.text
      );

      return {
        id: tweet.id,
        text: cleanText,
        date: new Date(tweet.date),
        url: tweet.url,
        media: hasMedia
          ? (tweet as Record<string, unknown>).media as TweetMedia[]
          : undefined,
        quotedTweet,
      };
    });

    // Deduplicate after mapping (safety net for unclean cache data)
    return deduplicateTweets(mapped);
  } catch (error) {
    console.warn('[Tweets] Error reading cache:', error);
    return [];
  }
}

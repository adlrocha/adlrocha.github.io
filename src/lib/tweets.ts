import tweetsCache from '../data/tweets-cache.json';

export interface Tweet {
  id: string;
  text: string;
  date: Date;
  url: string;
}

/**
 * Returns cached tweets from the JSON file.
 * To update tweets, run: npm run fetch-tweets
 */
export function fetchTweets(): Tweet[] {
  try {
    const tweets = tweetsCache.tweets || [];

    return tweets.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      date: new Date(tweet.date),
      url: tweet.url,
    }));
  } catch (error) {
    console.warn('[Tweets] Error reading cache:', error);
    return [];
  }
}

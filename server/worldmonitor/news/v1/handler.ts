import type { NewsServiceHandler } from '../../../../src/generated/server/worldmonitor/news/v1/service_server';

import { summarizeArticle } from './summarize-article';
import { getSummarizeArticleCache } from './get-summarize-article-cache';
import { listFeedDigest } from './list-feed-digest';
import { analyzeNewsFromUrls } from './analyze-news-from-urls';

export const newsHandler: NewsServiceHandler = {
  summarizeArticle,
  getSummarizeArticleCache,
  listFeedDigest,
  analyzeNewsFromUrls,
};

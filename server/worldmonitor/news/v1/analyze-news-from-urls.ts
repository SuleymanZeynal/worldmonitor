import type {
  ServerContext,
  AnalyzeNewsFromUrlsRequest,
  AnalyzeNewsFromUrlsResponse,
  NewsItem as ProtoNewsItem,
  ThreatLevel as ProtoThreatLevel,
} from '../../../../src/generated/server/worldmonitor/news/v1/service_server';
import { CHROME_UA } from '../../../_shared/constants';
import { classifyByKeyword, type ThreatLevel } from './_classifier';
import { getSourceTier } from '../../../_shared/source-tiers';
import { getRelayBaseUrl, getRelayHeaders } from '../../../_shared/relay';

const MAX_URLS = 10;
const MAX_ITEMS_PER_URL = 10;
const FETCH_TIMEOUT_MS = 10_000;

const LEVEL_TO_PROTO: Record<ThreatLevel, ProtoThreatLevel> = {
  critical: 'THREAT_LEVEL_CRITICAL',
  high: 'THREAT_LEVEL_HIGH',
  medium: 'THREAT_LEVEL_MEDIUM',
  low: 'THREAT_LEVEL_LOW',
  info: 'THREAT_LEVEL_UNSPECIFIED',
};

const SEVERITY_SCORES: Record<ThreatLevel, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  info: 0,
};

const SCORE_WEIGHTS = {
  severity: 0.4,
  sourceTier: 0.2,
  corroboration: 0.3,
  recency: 0.1,
} as const;

interface ParsedItem {
  source: string;
  title: string;
  link: string;
  publishedAt: number;
  isAlert: boolean;
  level: ThreatLevel;
  category: string;
  confidence: number;
  importanceScore: number;
}

function computeImportanceScore(
  level: ThreatLevel,
  source: string,
  publishedAt: number,
): number {
  const tier = getSourceTier(source);
  const tierScore = tier === 1 ? 100 : tier === 2 ? 75 : tier === 3 ? 50 : 25;
  const ageMs = Date.now() - publishedAt;
  const recencyScore = Math.max(0, 1 - ageMs / (24 * 60 * 60 * 1000)) * 100;
  return Math.round(
    SEVERITY_SCORES[level] * SCORE_WEIGHTS.severity +
    tierScore * SCORE_WEIGHTS.sourceTier +
    25 * SCORE_WEIGHTS.corroboration + // single source, fixed mid-point
    recencyScore * SCORE_WEIGHTS.recency,
  );
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Lightly sanitize a title string extracted from HTML/XML. */
function sanitizeTitle(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 300);
}

// ── XML/RSS parsing ───────────────────────────────────────────────────────────

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function extractXmlTag(block: string, tag: string): string {
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, 'i');
  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
  const cdataMatch = block.match(cdataRe);
  if (cdataMatch) return cdataMatch[1]!.trim();
  const match = block.match(plainRe);
  return match ? decodeXmlEntities(match[1]!.trim()) : '';
}

function looksLikeRss(text: string): boolean {
  const trimmed = text.trimStart().slice(0, 200).toLowerCase();
  return (
    trimmed.startsWith('<?xml') ||
    trimmed.includes('<rss') ||
    trimmed.includes('<feed') ||
    trimmed.includes('<channel>')
  );
}

function parseRssText(text: string, sourceName: string, variant: string): ParsedItem[] {
  const items: ParsedItem[] = [];

  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;

  let matches = [...text.matchAll(itemRegex)];
  const isAtom = matches.length === 0;
  if (isAtom) matches = [...text.matchAll(entryRegex)];

  for (const match of matches.slice(0, MAX_ITEMS_PER_URL)) {
    const block = match[1]!;

    const title = sanitizeTitle(extractXmlTag(block, 'title'));
    if (!title) continue;

    let link: string;
    if (isAtom) {
      const hrefMatch = block.match(/<link[^>]+href=["']([^"']+)["']/);
      link = hrefMatch?.[1] ?? '';
    } else {
      link = extractXmlTag(block, 'link');
    }
    if (!/^https?:\/\//i.test(link)) link = '';

    const pubDateStr = isAtom
      ? (extractXmlTag(block, 'published') || extractXmlTag(block, 'updated'))
      : extractXmlTag(block, 'pubDate');
    const parsedDate = pubDateStr ? new Date(pubDateStr) : new Date();
    const publishedAt = Number.isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();

    const threat = classifyByKeyword(title, variant);
    const isAlert = threat.level === 'critical' || threat.level === 'high';
    const importanceScore = computeImportanceScore(threat.level, sourceName, publishedAt);

    items.push({
      source: sourceName,
      title,
      link,
      publishedAt,
      isAlert,
      level: threat.level,
      category: threat.category,
      confidence: threat.confidence,
      importanceScore,
    });
  }

  return items;
}

// ── HTML scraping ─────────────────────────────────────────────────────────────

/**
 * Extracts article links and titles from an HTML page.
 * Strategy (in order of preference):
 * 1. <article> elements with <h1>/<h2>/<h3> headings and <a> links
 * 2. <a> elements inside <main> or role="main"
 * 3. Any <a> with ≥4 words that looks like a news headline
 * Deduplicates by href and ignores navigation/utility links.
 */
function scrapeHtmlArticles(html: string, baseUrl: string, sourceName: string, variant: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const seen = new Set<string>();
  const now = Date.now();

  // Resolve relative URLs
  function resolveUrl(href: string): string {
    if (!href) return '';
    if (/^https?:\/\//i.test(href)) return href;
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return '';
    }
  }

  // Helper: strip HTML tags and decode entities
  function stripTags(s: string): string {
    return decodeXmlEntities(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }

  // 1. Try <article> blocks first — highest-confidence extraction
  const articleRegex = /<article[\s>]([\s\S]*?)<\/article>/gi;
  for (const articleMatch of html.matchAll(articleRegex)) {
    const block = articleMatch[1]!;

    // Look for a heading inside the article
    const headingMatch = block.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    const headingText = headingMatch ? stripTags(headingMatch[1]!) : '';

    // Look for the primary link inside the article
    const linkMatch = block.match(/<a[^>]+href=["']([^"'#?][^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
    const linkHref = linkMatch ? resolveUrl(linkMatch[1]!) : '';
    const linkText = linkMatch ? stripTags(linkMatch[2]!) : '';

    const title = sanitizeTitle(headingText || linkText);
    const link = linkHref;

    if (!title || title.split(/\s+/).length < 3) continue;
    if (!link || seen.has(link)) continue;
    if (!/^https?:\/\//i.test(link)) continue;

    seen.add(link);
    const threat = classifyByKeyword(title, variant);
    items.push({
      source: sourceName,
      title,
      link,
      publishedAt: now,
      isAlert: threat.level === 'critical' || threat.level === 'high',
      level: threat.level,
      category: threat.category,
      confidence: threat.confidence,
      importanceScore: computeImportanceScore(threat.level, sourceName, now),
    });

    if (items.length >= MAX_ITEMS_PER_URL) break;
  }

  if (items.length >= MAX_ITEMS_PER_URL) return items;

  // 2. Look for <a> tags with meaningful headline text (≥4 words, reasonable length)
  //    Skip nav/footer/utility links by checking parent context patterns.
  const navPattern = /<(?:nav|header|footer|aside)[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside)>/gi;
  const htmlWithoutNav = html.replace(navPattern, '');

  const linkRegex = /<a[^>]+href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const linkMatch of htmlWithoutNav.matchAll(linkRegex)) {
    const rawHref = linkMatch[1]!;
    const rawText = stripTags(linkMatch[2]!);
    const title = sanitizeTitle(rawText);

    if (!title) continue;
    const wordCount = title.split(/\s+/).length;
    if (wordCount < 4 || wordCount > 40) continue; // too short = nav link; too long = description
    if (title.length < 20 || title.length > 250) continue;

    const link = resolveUrl(rawHref);
    if (!link || !/^https?:\/\//i.test(link)) continue;
    if (seen.has(link)) continue;

    // Skip links that point back to the same page (anchors, query params only)
    try {
      const parsed = new URL(link);
      const base = new URL(baseUrl);
      if (parsed.pathname === base.pathname && parsed.hostname === base.hostname) continue;
    } catch { /* continue */ }

    seen.add(link);
    const threat = classifyByKeyword(title, variant);
    items.push({
      source: sourceName,
      title,
      link,
      publishedAt: now,
      isAlert: threat.level === 'critical' || threat.level === 'high',
      level: threat.level,
      category: threat.category,
      confidence: threat.confidence,
      importanceScore: computeImportanceScore(threat.level, sourceName, now),
    });

    if (items.length >= MAX_ITEMS_PER_URL) break;
  }

  return items;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': CHROME_UA,
        'Accept': 'application/rss+xml, application/xml, text/xml, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTextViaRelay(url: string): Promise<string | null> {
  const relayBase = getRelayBaseUrl();
  if (!relayBase) return null;
  const relayUrl = `${relayBase}/rss?url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(relayUrl, {
      headers: getRelayHeaders({ Accept: 'application/rss+xml, application/xml, text/xml, */*' }),
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    return await resp.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAndParseUrl(url: string, variant: string): Promise<{ items: ParsedItem[]; status: string }> {
  const sourceName = extractHostname(url);

  // Try direct fetch first, relay fallback if needed
  let text = await fetchText(url);
  if (!text) {
    text = await fetchTextViaRelay(url);
  }

  if (!text) {
    return { items: [], status: 'fetch_failed' };
  }

  // Decide: RSS/Atom XML or HTML
  if (looksLikeRss(text)) {
    const items = parseRssText(text, sourceName, variant);
    return { items, status: items.length > 0 ? 'ok' : 'empty' };
  }

  // Treat as HTML page — scrape article links
  const items = scrapeHtmlArticles(text, url, sourceName, variant);
  return { items, status: items.length > 0 ? 'ok' : 'empty' };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function analyzeNewsFromUrls(
  _ctx: ServerContext,
  req: AnalyzeNewsFromUrlsRequest,
): Promise<AnalyzeNewsFromUrlsResponse> {
  const variant = req.variant || 'full';
  const urls = (req.urls ?? [])
    .filter(u => typeof u === 'string' && /^https?:\/\//i.test(u.trim()))
    .slice(0, MAX_URLS);

  if (urls.length === 0) {
    return { categories: {}, feedStatuses: {}, generatedAt: new Date().toISOString() };
  }

  const feedStatuses: Record<string, string> = {};
  const allItems: ParsedItem[] = [];

  // Fetch all URLs in parallel
  const results = await Promise.allSettled(
    urls.map(url => fetchAndParseUrl(url, variant)),
  );

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;
    const result = results[i]!;
    const sourceName = extractHostname(url);

    if (result.status === 'fulfilled') {
      const { items, status } = result.value;
      if (status !== 'ok') feedStatuses[sourceName] = status;
      allItems.push(...items);
    } else {
      feedStatuses[sourceName] = 'error';
    }
  }

  // Sort all items by importance score desc, then recency desc
  allItems.sort((a, b) => b.importanceScore - a.importanceScore || b.publishedAt - a.publishedAt);

  // Group by category
  const categoryMap = new Map<string, ProtoNewsItem[]>();
  for (const item of allItems) {
    const cat = item.category || 'general';
    const bucket = categoryMap.get(cat) ?? [];
    bucket.push({
      source: item.source,
      title: item.title,
      link: item.link,
      publishedAt: item.publishedAt,
      isAlert: item.isAlert,
      importanceScore: item.importanceScore,
      corroborationCount: 1,
      locationName: '',
      threat: {
        level: LEVEL_TO_PROTO[item.level],
        category: item.category,
        confidence: item.confidence,
        source: 'keyword',
      },
    });
    categoryMap.set(cat, bucket);
  }

  const categories: Record<string, { items: ProtoNewsItem[] }> = {};
  for (const [cat, items] of categoryMap) {
    categories[cat] = { items };
  }

  return {
    categories,
    feedStatuses,
    generatedAt: new Date().toISOString(),
  };
}

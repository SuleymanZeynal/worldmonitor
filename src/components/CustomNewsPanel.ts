import { Panel } from './Panel';
import { t } from '@/services/i18n';
import type { NewsItem } from '@/types';
import { generateId, formatTime } from '@/utils';
import { sanitizeUrl, escapeHtml } from '@/utils/sanitize';
import { h, replaceChildren, clearChildren } from '@/utils/dom-utils';
import { toApiUrl } from '@/services/runtime';
import { SITE_VARIANT } from '@/config/variant';
import { getCurrentLanguage } from '@/services/i18n';

export interface CustomSource {
  id: string;
  url: string;
}

export class CustomNewsPanel extends Panel {
  private sources: CustomSource[] = [];
  private onSourcesChange?: (sources: CustomSource[]) => void;
  private isFetching = false;

  constructor(initialSources: CustomSource[] = []) {
    super({
      id: 'custom-news',
      title: t('panels.customNews'),
      infoTooltip: t('components.customNews.infoTooltip'),
    });
    this.sources = initialSources;
    this.renderInput();
  }

  private renderInput(): void {
    clearChildren(this.content);

    const input = h('input', {
      type: 'url',
      className: 'monitor-input',
      id: 'customNewsUrl',
      placeholder: t('components.customNews.placeholder'),
      onKeypress: (e: Event) => {
        if ((e as KeyboardEvent).key === 'Enter') this.addSource();
      },
    });

    const addBtn = h('button', {
      className: 'monitor-add-btn',
      id: 'addCustomNewsBtn',
      onClick: () => this.addSource(),
    }, t('components.customNews.add'));

    const inputContainer = h('div', { className: 'monitor-input-container' }, input, addBtn);

    const sourcesList = h('div', { id: 'customNewsSourcesList' });

    const fetchBtn = h('button', {
      className: 'monitor-add-btn',
      id: 'fetchCustomNewsBtn',
      style: 'margin-top: 8px; width: 100%;',
      onClick: () => void this.fetchAndAnalyze(),
    }, t('components.customNews.fetch'));

    const results = h('div', { id: 'customNewsResults' });

    this.content.appendChild(inputContainer);
    this.content.appendChild(sourcesList);
    this.content.appendChild(fetchBtn);
    this.content.appendChild(results);

    this.renderSourcesList();
    this.renderEmptyResults();
  }

  private addSource(): void {
    const input = document.getElementById('customNewsUrl') as HTMLInputElement | null;
    if (!input) return;
    const raw = input.value.trim();
    if (!raw) return;

    // Basic URL validation
    let url: string;
    try {
      url = new URL(raw).toString();
    } catch {
      this.showInlineError(t('components.customNews.invalidUrl'));
      return;
    }

    if (this.sources.some(s => s.url === url)) {
      input.value = '';
      return;
    }

    this.sources.push({ id: generateId(), url });
    input.value = '';
    this.renderSourcesList();
    this.onSourcesChange?.(this.sources);
  }

  public removeSource(id: string): void {
    this.sources = this.sources.filter(s => s.id !== id);
    this.renderSourcesList();
    this.onSourcesChange?.(this.sources);
  }

  private renderSourcesList(): void {
    const list = document.getElementById('customNewsSourcesList');
    if (!list) return;

    if (this.sources.length === 0) {
      replaceChildren(list,
        h('div', { style: 'color: var(--text-dim); font-size: 10px; margin-top: 8px;' },
          t('components.customNews.noSources'),
        ),
      );
      return;
    }

    replaceChildren(list,
      ...this.sources.map(s =>
        h('span', { className: 'monitor-tag', style: 'max-width: 100%; overflow: hidden;' },
          h('span', {
            style: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; display: inline-block; vertical-align: bottom;',
            title: s.url,
          }, new URL(s.url).hostname),
          h('span', {
            className: 'monitor-tag-remove',
            onClick: () => this.removeSource(s.id),
          }, '×'),
        ),
      ),
    );
  }

  private renderEmptyResults(): void {
    const results = document.getElementById('customNewsResults');
    if (!results) return;
    replaceChildren(results,
      h('div', { style: 'color: var(--text-dim); font-size: 10px; margin-top: 12px;' },
        t('components.customNews.addUrlsHint'),
      ),
    );
  }

  private showInlineError(msg: string): void {
    const results = document.getElementById('customNewsResults');
    if (!results) return;
    replaceChildren(results,
      h('div', { style: 'color: var(--status-alert); font-size: 10px; margin-top: 12px;' }, msg),
    );
  }

  public async fetchAndAnalyze(): Promise<void> {
    if (this.isFetching) return;
    if (this.sources.length === 0) {
      this.showInlineError(t('components.customNews.noSources'));
      return;
    }

    const fetchBtn = document.getElementById('fetchCustomNewsBtn') as HTMLButtonElement | null;
    if (fetchBtn) fetchBtn.disabled = true;
    this.isFetching = true;

    const results = document.getElementById('customNewsResults');
    if (results) {
      replaceChildren(results,
        h('div', { style: 'color: var(--text-dim); font-size: 10px; margin-top: 12px;' },
          t('components.customNews.loading'),
        ),
      );
    }

    try {
      const resp = await fetch(toApiUrl('/api/news/v1/analyze-news-from-urls'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: this.sources.map(s => s.url),
          variant: SITE_VARIANT,
          lang: getCurrentLanguage(),
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json() as {
        categories: Record<string, { items: Array<{
          source: string;
          title: string;
          link: string;
          publishedAt: number;
          isAlert: boolean;
          importanceScore: number;
          threat?: { level: string; category: string };
        }> }>;
      };

      // Flatten all categories into a single sorted list
      const allItems: NewsItem[] = [];
      for (const bucket of Object.values(data.categories)) {
        for (const item of bucket.items) {
          allItems.push({
            source: item.source,
            title: item.title,
            link: item.link,
            pubDate: new Date(item.publishedAt),
            isAlert: item.isAlert,
            importanceScore: item.importanceScore,
          });
        }
      }

      allItems.sort((a, b) =>
        ((b.importanceScore ?? 0) - (a.importanceScore ?? 0)) ||
        (b.pubDate.getTime() - a.pubDate.getTime()),
      );

      this.renderResults(allItems);
      this.setCount(allItems.length);
    } catch {
      this.showInlineError(t('components.customNews.fetchError'));
    } finally {
      this.isFetching = false;
      if (fetchBtn) fetchBtn.disabled = false;
    }
  }

  private renderResults(items: NewsItem[]): void {
    const results = document.getElementById('customNewsResults');
    if (!results) return;

    if (items.length === 0) {
      replaceChildren(results,
        h('div', { style: 'color: var(--text-dim); font-size: 10px; margin-top: 12px;' },
          t('components.customNews.noResults'),
        ),
      );
      return;
    }

    replaceChildren(results,
      h('div', { style: 'color: var(--text-dim); font-size: 10px; margin: 12px 0 8px;' },
        `${items.length} ${t('components.customNews.articles')}`,
      ),
      ...items.slice(0, 50).map(item =>
        h('div', {
          className: `item${item.isAlert ? ' item-alert' : ''}`,
        },
          h('div', { className: 'item-source' }, escapeHtml(item.source)),
          h('a', {
            className: 'item-title',
            href: sanitizeUrl(item.link),
            target: '_blank',
            rel: 'noopener noreferrer',
          }, escapeHtml(item.title)),
          h('div', { className: 'item-time' }, formatTime(item.pubDate)),
        ),
      ),
    );
  }

  public onChanged(callback: (sources: CustomSource[]) => void): void {
    this.onSourcesChange = callback;
  }

  public getSources(): CustomSource[] {
    return [...this.sources];
  }

  public setSources(sources: CustomSource[]): void {
    this.sources = sources;
    this.renderSourcesList();
  }
}

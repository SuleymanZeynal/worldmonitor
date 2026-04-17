export interface ServerFeed {
  name: string;
  url: string;
  lang?: string;
}

const AZ_FEEDS: ServerFeed[] = [
  { name: 'Report.az', url: 'https://report.az/rss', lang: 'az' },
  { name: 'Oxu.az',    url: 'https://oxu.az/feed',   lang: 'az' },
  { name: 'Haqqin.az', url: 'https://haqqin.az/rss', lang: 'az' },
];

export const VARIANT_FEEDS: Record<string, Record<string, ServerFeed[]>> = {
  full:      { politics: AZ_FEEDS },
  tech:      { tech:     AZ_FEEDS },
  finance:   { finance:  AZ_FEEDS },
  commodity: { 'commodity-news': AZ_FEEDS },
  happy:     { positive: AZ_FEEDS },
};

export const INTEL_SOURCES: ServerFeed[] = [];

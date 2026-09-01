export interface ServerFeed {
  name: string;
  url: string;
  lang?: string;
}

const AZ_FEEDS: ServerFeed[] = [
  { name: 'Report.az',  url: 'https://report.az/rss' },
  { name: 'Oxu.az',    url: 'https://oxu.az/feed' },
  { name: 'Haqqin.az', url: 'https://haqqin.az/rss' },
  { name: 'AzərTAc',   url: 'https://azertag.az/rss' },
  { name: '1news.az',  url: 'https://1news.az/rss' },
];

const TR_FEEDS: ServerFeed[] = [
  { name: 'Anadolu Ajansı', url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel' },
  { name: 'NTV Haber',      url: 'https://www.ntv.com.tr/son-dakika.rss' },
  { name: 'Hürriyet',       url: 'https://www.hurriyet.com.tr/rss/anasayfa' },
  { name: 'Sabah',          url: 'https://www.sabah.com.tr/rss/anasayfa.xml' },
  { name: 'Sözcü',          url: 'https://www.sozcu.com.tr/rss/son-dakika.xml' },
];

const REGIONAL_FEEDS: ServerFeed[] = [...AZ_FEEDS, ...TR_FEEDS];

export const VARIANT_FEEDS: Record<string, Record<string, ServerFeed[]>> = {
  full: {
    politics:         REGIONAL_FEEDS,
    us:               REGIONAL_FEEDS,
    europe:           REGIONAL_FEEDS,
    middleeast:       REGIONAL_FEEDS,
    africa:           REGIONAL_FEEDS,
    latam:            REGIONAL_FEEDS,
    asia:             REGIONAL_FEEDS,
    energy:           REGIONAL_FEEDS,
    gov:              REGIONAL_FEEDS,
    thinktanks:       REGIONAL_FEEDS,
    ai:               REGIONAL_FEEDS,
    layoffs:          REGIONAL_FEEDS,
    startups:         REGIONAL_FEEDS,
    vcblogs:          REGIONAL_FEEDS,
    regionalStartups: REGIONAL_FEEDS,
    unicorns:         REGIONAL_FEEDS,
    accelerators:     REGIONAL_FEEDS,
    funding:          REGIONAL_FEEDS,
    producthunt:      REGIONAL_FEEDS,
    security:         REGIONAL_FEEDS,
    policy:           REGIONAL_FEEDS,
    hardware:         REGIONAL_FEEDS,
    cloud:            REGIONAL_FEEDS,
    dev:              REGIONAL_FEEDS,
    github:           REGIONAL_FEEDS,
    ipo:              REGIONAL_FEEDS,
    finance:          REGIONAL_FEEDS,
    tech:             REGIONAL_FEEDS,
    crisis:           REGIONAL_FEEDS,
  },
  tech: {
    tech:             REGIONAL_FEEDS,
    ai:               REGIONAL_FEEDS,
    startups:         REGIONAL_FEEDS,
    vcblogs:          REGIONAL_FEEDS,
    regionalStartups: REGIONAL_FEEDS,
    unicorns:         REGIONAL_FEEDS,
    accelerators:     REGIONAL_FEEDS,
    security:         REGIONAL_FEEDS,
    policy:           REGIONAL_FEEDS,
    github:           REGIONAL_FEEDS,
    funding:          REGIONAL_FEEDS,
    cloud:            REGIONAL_FEEDS,
    layoffs:          REGIONAL_FEEDS,
    finance:          REGIONAL_FEEDS,
    dev:              REGIONAL_FEEDS,
    ipo:              REGIONAL_FEEDS,
    producthunt:      REGIONAL_FEEDS,
    hardware:         REGIONAL_FEEDS,
    outages:          REGIONAL_FEEDS,
  },
  finance: {
    finance:          REGIONAL_FEEDS,
    markets:          REGIONAL_FEEDS,
    forex:            REGIONAL_FEEDS,
    bonds:            REGIONAL_FEEDS,
    commodities:      REGIONAL_FEEDS,
    crypto:           REGIONAL_FEEDS,
    centralbanks:     REGIONAL_FEEDS,
    economic:         REGIONAL_FEEDS,
    ipo:              REGIONAL_FEEDS,
    derivatives:      REGIONAL_FEEDS,
    fintech:          REGIONAL_FEEDS,
    regulation:       REGIONAL_FEEDS,
    institutional:    REGIONAL_FEEDS,
    analysis:         REGIONAL_FEEDS,
    gccNews:          REGIONAL_FEEDS,
  },
  commodity: {
    'commodity-news':      REGIONAL_FEEDS,
    'gold-silver':         REGIONAL_FEEDS,
    energy:                REGIONAL_FEEDS,
    'mining-news':         REGIONAL_FEEDS,
    'critical-minerals':   REGIONAL_FEEDS,
    'base-metals':         REGIONAL_FEEDS,
    'mining-companies':    REGIONAL_FEEDS,
    'supply-chain':        REGIONAL_FEEDS,
    'commodity-regulation': REGIONAL_FEEDS,
    markets:               REGIONAL_FEEDS,
    finance:               REGIONAL_FEEDS,
  },
  happy: {
    positive:         REGIONAL_FEEDS,
    science:          REGIONAL_FEEDS,
    nature:           REGIONAL_FEEDS,
    inspiring:        REGIONAL_FEEDS,
    community:        REGIONAL_FEEDS,
  },
};

export const INTEL_SOURCES: ServerFeed[] = [];

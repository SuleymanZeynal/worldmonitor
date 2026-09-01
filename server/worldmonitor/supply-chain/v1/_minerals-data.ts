export interface MineralProductionEntry {
  mineral: string;
  country: string;
  countryCode: string;
  productionTonnes: number;
  unit: string;
}

export const MINERAL_PRODUCTION_2024: MineralProductionEntry[] = [
  // Lithium (tonnes LCE)
  { mineral: 'Lithium', country: 'Australia', countryCode: 'AU', productionTonnes: 86000, unit: 'tonnes LCE' },
  { mineral: 'Lithium', country: 'Chile', countryCode: 'CL', productionTonnes: 44000, unit: 'tonnes LCE' },
  { mineral: 'Lithium', country: 'China', countryCode: 'CN', productionTonnes: 33000, unit: 'tonnes LCE' },
  { mineral: 'Lithium', country: 'Argentina', countryCode: 'AR', productionTonnes: 9600, unit: 'tonnes LCE' },

  // Cobalt (tonnes)
  { mineral: 'Cobalt', country: 'DRC', countryCode: 'CD', productionTonnes: 130000, unit: 'tonnes' },
  { mineral: 'Cobalt', country: 'Indonesia', countryCode: 'ID', productionTonnes: 17000, unit: 'tonnes' },
  { mineral: 'Cobalt', country: 'Russia', countryCode: 'RU', productionTonnes: 8900, unit: 'tonnes' },
  { mineral: 'Cobalt', country: 'Australia', countryCode: 'AU', productionTonnes: 5600, unit: 'tonnes' },

  // Rare Earths (tonnes REO)
  { mineral: 'Rare Earths', country: 'China', countryCode: 'CN', productionTonnes: 240000, unit: 'tonnes REO' },
  { mineral: 'Rare Earths', country: 'Myanmar', countryCode: 'MM', productionTonnes: 38000, unit: 'tonnes REO' },
  { mineral: 'Rare Earths', country: 'USA', countryCode: 'US', productionTonnes: 43000, unit: 'tonnes REO' },
  { mineral: 'Rare Earths', country: 'Australia', countryCode: 'AU', productionTonnes: 18000, unit: 'tonnes REO' },

  // Gallium (tonnes)
  { mineral: 'Gallium', country: 'China', countryCode: 'CN', productionTonnes: 600, unit: 'tonnes' },
  { mineral: 'Gallium', country: 'Japan', countryCode: 'JP', productionTonnes: 10, unit: 'tonnes' },
  { mineral: 'Gallium', country: 'South Korea', countryCode: 'KR', productionTonnes: 8, unit: 'tonnes' },
  { mineral: 'Gallium', country: 'Russia', countryCode: 'RU', productionTonnes: 5, unit: 'tonnes' },

  // Germanium (tonnes)
  { mineral: 'Germanium', country: 'China', countryCode: 'CN', productionTonnes: 95, unit: 'tonnes' },
  { mineral: 'Germanium', country: 'Belgium', countryCode: 'BE', productionTonnes: 15, unit: 'tonnes' },
  { mineral: 'Germanium', country: 'Canada', countryCode: 'CA', productionTonnes: 9, unit: 'tonnes' },
  { mineral: 'Germanium', country: 'Russia', countryCode: 'RU', productionTonnes: 5, unit: 'tonnes' },

  // Boron — Turkey holds ~70% of global reserves and dominates production
  { mineral: 'Boron', country: 'Turkey', countryCode: 'TR', productionTonnes: 1950000, unit: 'tonnes B2O3' },
  { mineral: 'Boron', country: 'USA', countryCode: 'US', productionTonnes: 500000, unit: 'tonnes B2O3' },
  { mineral: 'Boron', country: 'Russia', countryCode: 'RU', productionTonnes: 70000, unit: 'tonnes B2O3' },
  { mineral: 'Boron', country: 'Chile', countryCode: 'CL', productionTonnes: 60000, unit: 'tonnes B2O3' },

  // Chromium — Turkey is top-5 global producer; critical for stainless steel
  { mineral: 'Chromium', country: 'South Africa', countryCode: 'ZA', productionTonnes: 18000000, unit: 'tonnes ore' },
  { mineral: 'Chromium', country: 'Kazakhstan', countryCode: 'KZ', productionTonnes: 7500000, unit: 'tonnes ore' },
  { mineral: 'Chromium', country: 'India', countryCode: 'IN', productionTonnes: 4100000, unit: 'tonnes ore' },
  { mineral: 'Chromium', country: 'Turkey', countryCode: 'TR', productionTonnes: 3500000, unit: 'tonnes ore' },

  // Gold (tonnes) — Turkey is a significant producer; Azerbaijan growing via Chovdar/Gedabek mines
  { mineral: 'Gold', country: 'China', countryCode: 'CN', productionTonnes: 375, unit: 'tonnes' },
  { mineral: 'Gold', country: 'Russia', countryCode: 'RU', productionTonnes: 310, unit: 'tonnes' },
  { mineral: 'Gold', country: 'Australia', countryCode: 'AU', productionTonnes: 305, unit: 'tonnes' },
  { mineral: 'Gold', country: 'Canada', countryCode: 'CA', productionTonnes: 195, unit: 'tonnes' },
  { mineral: 'Gold', country: 'Turkey', countryCode: 'TR', productionTonnes: 42, unit: 'tonnes' },
  { mineral: 'Gold', country: 'Azerbaijan', countryCode: 'AZ', productionTonnes: 4, unit: 'tonnes' },

  // Crude Oil (million barrels/year) — Azerbaijan is a major Caspian producer (BTC pipeline)
  { mineral: 'Crude Oil (Caspian)', country: 'Azerbaijan', countryCode: 'AZ', productionTonnes: 35000000, unit: 'tonnes/year' },
  { mineral: 'Crude Oil (Caspian)', country: 'Kazakhstan', countryCode: 'KZ', productionTonnes: 90000000, unit: 'tonnes/year' },
  { mineral: 'Crude Oil (Caspian)', country: 'Turkmenistan', countryCode: 'TM', productionTonnes: 11000000, unit: 'tonnes/year' },
];


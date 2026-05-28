export type ResourceKey =
  | 'food'
  | 'wood'
  | 'stone'
  | 'bronze'
  | 'iron'
  | 'gold'
  | 'science'
  | 'population'
  | 'energy'
  | 'coal'
  | 'titanium'
  | 'darkMatter'
  | 'gems';

export type BuildingKey =
  | 'farm'
  | 'lumberMill'
  | 'quarry'
  | 'mine'
  | 'ironMine'
  | 'barracks'
  | 'market'
  | 'castle'
  | 'university'
  | 'cathedral'
  | 'observatory'
  | 'bank'
  | 'shipyard'
  | 'factory'
  | 'railroad'
  | 'powerPlant'
  | 'laboratory'
  | 'researchCenter'
  | 'airport'
  | 'stockExchange'
  | 'spacePort'
  | 'orbitalStation'
  | 'lunarColony';

export type ResearchKey =
  | 'agriculture'
  | 'metalworking'
  | 'mining'
  | 'economics'
  | 'education'
  | 'engineering'
  | 'industrialization'
  | 'energySystems'
  | 'spaceProgram';

export const ERAS = [
  { id: 0, key: 'stone', name: 'Stone Age', nameRu: 'Каменный век', productionBonus: 0 },
  { id: 1, key: 'bronze', name: 'Bronze Age', nameRu: 'Бронзовый век', productionBonus: 0.1 },
  { id: 2, key: 'iron', name: 'Iron Age', nameRu: 'Железный век', productionBonus: 0.15 },
  { id: 3, key: 'medieval', name: 'Middle Ages', nameRu: 'Средневековье', productionBonus: 0.2, scienceBonus: 0 },
  { id: 4, key: 'renaissance', name: 'Renaissance', nameRu: 'Эпоха Возрождения', productionBonus: 0.3, scienceBonus: 0 },
  { id: 5, key: 'industrial', name: 'Industrial Age', nameRu: 'Индустриальная эпоха', productionBonus: 0.4 },
  { id: 6, key: 'modern', name: 'Modern Age', nameRu: 'Современная эпоха', productionBonus: 0.5 },
  { id: 7, key: 'space', name: 'Space Age', nameRu: 'Космическая эпоха', productionBonus: 0.5 },
] as const;

export interface EraRequirement {
  resources?: Partial<Record<ResourceKey, number>>;
  buildings?: Partial<Record<BuildingKey, number>>;
  researches?: Partial<Record<ResearchKey, number>>;
  population?: number;
  wondersBuilt?: number;
  scienceBonusOnAdvance?: number;
}

export const ERA_REQUIREMENTS: EraRequirement[] = [
  {},
  {
    resources: { food: 1000, wood: 1000, stone: 500 },
    buildings: { farm: 5, lumberMill: 5, quarry: 3 },
    researches: { agriculture: 3 },
    population: 100,
  },
  {
    resources: { food: 5000, wood: 5000, stone: 3000, bronze: 1500 },
    buildings: { farm: 10, quarry: 8, mine: 5 },
    researches: { agriculture: 5, metalworking: 3 },
    population: 500,
  },
  {
    resources: { food: 10000, wood: 10000, iron: 5000, gold: 5000 },
    buildings: { market: 5, mine: 10, barracks: 5 },
    researches: { mining: 5, economics: 3 },
    population: 2000,
    wondersBuilt: 1,
  },
  {
    resources: { food: 25000, iron: 20000, gold: 15000, science: 10000 },
    buildings: { university: 5, castle: 3 },
    researches: { education: 5 },
    population: 5000,
    scienceBonusOnAdvance: 0.25,
  },
  {
    resources: { iron: 50000, gold: 50000, science: 25000 },
    buildings: { bank: 10, observatory: 5 },
    researches: { engineering: 7, economics: 7 },
    population: 15000,
    wondersBuilt: 2,
  },
  {
    resources: { iron: 100000, gold: 100000, science: 75000, energy: 50000 },
    buildings: { factory: 15, powerPlant: 10 },
    researches: { industrialization: 10 },
    population: 50000,
  },
  {
    resources: { science: 500000, energy: 250000, gold: 250000 },
    buildings: { researchCenter: 20, stockExchange: 10 },
    researches: { spaceProgram: 10 },
    population: 250000,
    wondersBuilt: 4,
  },
];

export const BUILDING_DEFS: Record<
  BuildingKey,
  {
    name: string;
    eraUnlock: number;
    baseCost: Partial<Record<ResourceKey, number>>;
    production: Partial<Record<ResourceKey, number>>;
    costResource?: ResourceKey;
  }
> = {
  farm: { name: 'Farm', eraUnlock: 0, baseCost: { wood: 50 }, production: { food: 5 } },
  lumberMill: { name: 'Lumber Mill', eraUnlock: 0, baseCost: { wood: 100 }, production: { wood: 5 } },
  quarry: { name: 'Quarry', eraUnlock: 0, baseCost: { wood: 150 }, production: { stone: 5 } },
  mine: { name: 'Mine', eraUnlock: 1, baseCost: { stone: 200 }, production: { bronze: 3 } },
  ironMine: { name: 'Iron Mine', eraUnlock: 2, baseCost: { stone: 300 }, production: { iron: 5 } },
  barracks: { name: 'Barracks', eraUnlock: 2, baseCost: { wood: 400, iron: 100 }, production: { population: 2 } },
  market: { name: 'Market', eraUnlock: 2, baseCost: { wood: 500, gold: 100 }, production: { gold: 3 } },
  castle: { name: 'Castle', eraUnlock: 3, baseCost: { stone: 1000, iron: 500 }, production: { gold: 5 } },
  university: { name: 'University', eraUnlock: 3, baseCost: { stone: 800, gold: 300 }, production: { science: 8 } },
  cathedral: { name: 'Cathedral', eraUnlock: 3, baseCost: { stone: 1200, gold: 500 }, production: { population: 5 } },
  observatory: { name: 'Observatory', eraUnlock: 4, baseCost: { iron: 2000, science: 500 }, production: { science: 15 } },
  bank: { name: 'Bank', eraUnlock: 4, baseCost: { gold: 500 }, production: { gold: 10 } },
  shipyard: { name: 'Shipyard', eraUnlock: 4, baseCost: { wood: 3000, iron: 1000 }, production: { gold: 8 } },
  factory: { name: 'Factory', eraUnlock: 5, baseCost: { iron: 5000 }, production: { iron: 20, coal: 10 } },
  railroad: { name: 'Railroad', eraUnlock: 5, baseCost: { iron: 3000, coal: 500 }, production: { gold: 15 } },
  powerPlant: { name: 'Power Plant', eraUnlock: 5, baseCost: { iron: 5000 }, production: { energy: 20 } },
  laboratory: { name: 'Laboratory', eraUnlock: 3, baseCost: { gold: 1000 }, production: { science: 10 } },
  researchCenter: { name: 'Research Center', eraUnlock: 6, baseCost: { science: 10000, gold: 5000 }, production: { science: 50 } },
  airport: { name: 'Airport', eraUnlock: 6, baseCost: { iron: 8000, energy: 2000 }, production: { gold: 25 } },
  stockExchange: { name: 'Stock Exchange', eraUnlock: 6, baseCost: { gold: 20000 }, production: { gold: 40 } },
  spacePort: { name: 'Space Port', eraUnlock: 7, baseCost: { titanium: 1000, energy: 50000 }, production: { titanium: 5 } },
  orbitalStation: { name: 'Orbital Station', eraUnlock: 7, baseCost: { titanium: 5000, energy: 100000 }, production: { darkMatter: 2 } },
  lunarColony: { name: 'Lunar Colony', eraUnlock: 7, baseCost: { titanium: 10000, science: 200000 }, production: { darkMatter: 5 } },
};

export const RESEARCH_DEFS: Record<
  ResearchKey,
  { name: string; eraUnlock: number; baseCost: Partial<Record<ResourceKey, number>>; bonusType: string; bonusPercent: number }
> = {
  agriculture: { name: 'Agriculture', eraUnlock: 0, baseCost: { food: 100, science: 10 }, bonusType: 'food', bonusPercent: 0.2 },
  metalworking: { name: 'Metalworking', eraUnlock: 1, baseCost: { bronze: 200, science: 50 }, bonusType: 'bronze', bonusPercent: 0.2 },
  mining: { name: 'Mining', eraUnlock: 2, baseCost: { iron: 500, science: 100 }, bonusType: 'iron', bonusPercent: 0.2 },
  economics: { name: 'Economics', eraUnlock: 2, baseCost: { gold: 300, science: 150 }, bonusType: 'gold', bonusPercent: 0.2 },
  education: { name: 'Education', eraUnlock: 3, baseCost: { science: 500, gold: 200 }, bonusType: 'science', bonusPercent: 0.2 },
  engineering: { name: 'Engineering', eraUnlock: 4, baseCost: { science: 2000, iron: 1000 }, bonusType: 'building', bonusPercent: 0.2 },
  industrialization: { name: 'Industrialization', eraUnlock: 5, baseCost: { science: 5000, coal: 2000 }, bonusType: 'building', bonusPercent: 0.2 },
  energySystems: { name: 'Energy Systems', eraUnlock: 5, baseCost: { science: 3000, energy: 1000 }, bonusType: 'energy', bonusPercent: 0.2 },
  spaceProgram: { name: 'Space Program', eraUnlock: 6, baseCost: { science: 50000, energy: 10000 }, bonusType: 'all', bonusPercent: 0.1 },
};

export const WONDER_DEFS = [
  { id: 'pyramid', name: 'Great Pyramid of Giza', bonusType: 'food', bonusPercent: 0.25, durationHours: 24, cost: { stone: 50000, gold: 10000 } },
  { id: 'gardens', name: 'Hanging Gardens', bonusType: 'food', bonusPercent: 0.2, durationHours: 72, cost: { wood: 40000, food: 30000 } },
  { id: 'zeus', name: 'Statue of Zeus', bonusType: 'gold', bonusPercent: 0.2, durationHours: 48, cost: { gold: 30000, bronze: 20000 } },
  { id: 'colossus', name: 'Colossus of Rhodes', bonusType: 'gold', bonusPercent: 0.25, durationHours: 72, cost: { iron: 40000, gold: 20000 } },
  { id: 'lighthouse', name: 'Lighthouse of Alexandria', bonusType: 'science', bonusPercent: 0.25, durationHours: 168, cost: { stone: 60000, science: 15000 } },
  { id: 'artemis', name: 'Temple of Artemis', bonusType: 'science', bonusPercent: 0.2, durationHours: 120, cost: { gold: 50000, stone: 30000 } },
  { id: 'mausoleum', name: 'Mausoleum at Halicarnassus', bonusType: 'all', bonusPercent: 0.15, durationHours: 168, cost: { stone: 80000, gold: 30000 } },
] as const;

export const TERRITORIES = [
  { id: 'forest', name: 'Forest', bonus: { wood: 0.1 }, cost: { food: 500, wood: 200 } },
  { id: 'mountain', name: 'Mountain', bonus: { stone: 0.1, iron: 0.05 }, cost: { stone: 1000, iron: 500 } },
  { id: 'desert', name: 'Desert', bonus: { gold: 0.1 }, cost: { food: 2000, gold: 500 } },
  { id: 'ocean', name: 'Ocean', bonus: { science: 0.1, gold: 0.05 }, cost: { wood: 3000, science: 1000 } },
] as const;

export const ENDGAME_PROJECTS = [
  { id: 'moon', name: 'Lunar Colony', cost: { titanium: 50000, energy: 500000, science: 1000000 } },
  { id: 'mars', name: 'Mars Colony', cost: { titanium: 100000, darkMatter: 10000, science: 5000000 } },
  { id: 'orbital', name: 'Orbital City', cost: { titanium: 200000, darkMatter: 50000, energy: 2000000 } },
  { id: 'starship', name: 'Interstellar Ship', cost: { darkMatter: 500000, titanium: 500000, science: 10000000 } },
] as const;

export const SHOP_PRODUCTS = [
  { id: 'gems_100', name: '100 Gems', stars: 100, gems: 100 },
  { id: 'gems_600', name: '600 Gems', stars: 500, gems: 600 },
  { id: 'gems_1400', name: '1400 Gems', stars: 1000, gems: 1400 },
  { id: 'gems_8000', name: '8000 Gems', stars: 5000, gems: 8000 },
  { id: 'boost_x2', name: 'x2 Production 24h', stars: 100, type: 'boost', multiplier: 2, hours: 24 },
  { id: 'boost_x5', name: 'x5 Production 24h', stars: 500, type: 'boost', multiplier: 5, hours: 24 },
  { id: 'instant_era', name: 'Instant Era Advance', stars: 1000, type: 'instant_era' },
  { id: 'resources_1h', name: '1 Hour Resources', stars: 50, type: 'resources', hours: 1 },
  { id: 'resources_12h', name: '12 Hours Resources', stars: 100, type: 'resources', hours: 12 },
  { id: 'resources_24h', name: '24 Hours Resources', stars: 250, type: 'resources', hours: 24 },
  { id: 'vip_bronze', name: 'VIP Bronze (30 days)', stars: 299, type: 'vip', tier: 'bronze' },
  { id: 'vip_silver', name: 'VIP Silver (30 days)', stars: 599, type: 'vip', tier: 'silver' },
  { id: 'vip_gold', name: 'VIP Gold (30 days)', stars: 999, type: 'vip', tier: 'gold' },
  { id: 'battle_pass', name: 'Battle Pass Premium', stars: 499, type: 'battle_pass' },
  { id: 'spin_10', name: 'Wheel Spin', stars: 10, type: 'spin' },
] as const;

export const REFERRAL_TIERS = [
  { count: 5, reward: 'unique_avatar' },
  { count: 10, reward: 'vip_bronze_3d' },
  { count: 25, reward: 'gold_frame' },
  { count: 50, reward: 'unique_title' },
  { count: 100, reward: 'unique_monument' },
] as const;

export const MAX_OFFLINE_HOURS = 24;

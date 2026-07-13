export type Gender = 'male' | 'female';
export type ElementName = '木' | '火' | '土' | '金' | '水';
export type PillarKey = 'year' | 'month' | 'day' | 'time';
export type ReadingSection = 'overview' | 'career' | 'relationship' | 'health' | 'growth';

export interface BirthInput {
  name: string;
  gender: Gender;
  birthDate: string;
  birthTime: string;
  birthplace: string;
}

export interface Pillar {
  key: PillarKey;
  label: string;
  ganZhi: string;
  stem: string;
  branch: string;
  hiddenStems: string[];
  stemTenGod: string;
  branchTenGods: string[];
  wuXing: string;
  naYin: string;
  diShi: string;
  selfDiShi: string;
  xunKong: string;
}

export interface ElementScore {
  element: ElementName;
  score: number;
  ratio: number;
  tone: '不足' | '平衡' | '偏旺';
}

export interface DaYunPeriod {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  endAge: number;
  xunKong: string;
  isCurrent: boolean;
}

export interface ReadingAdvice {
  title: string;
  body: string;
  tags: string[];
}

export interface PersonalityPortrait {
  title: string;
  opening: string;
  evidence: string[];
  traits: string[];
  strengths: string[];
  blindSpots: string[];
  workStyle: string;
  relationshipStyle: string;
  moneyStyle: string;
  growthKey: string;
  verification: string[];
}

export type DeepDomainKey = 'summary' | 'career' | 'wealth' | 'relationship' | 'health' | 'family';

export interface DeepDomainReport {
  key: DeepDomainKey;
  title: string;
  conclusion: string;
  evidence: string[];
  realWorld: string[];
  risks: string[];
  actions: string[];
}

export interface DeepLuckPeriod {
  ganZhi: string;
  years: string;
  ages: string;
  effect: string;
  bestFor: string[];
  caution: string[];
}

export interface FutureYearReading {
  year: number;
  ganZhi: string;
  theme: string;
  focus: string;
  career: string;
  relationship: string;
  money: string;
  caution: string;
}

export interface DeepDiveReport {
  thesis: string;
  usefulGod: string;
  favorableGod: string;
  avoidGod: string;
  structureName: string;
  domains: DeepDomainReport[];
  currentLuck: DeepLuckPeriod | null;
  futureYears: FutureYearReading[];
}

export interface BaziReading {
  input: BirthInput;
  generatedAt: string;
  solarText: string;
  lunarText: string;
  zodiac: string;
  pillars: Pillar[];
  dayMaster: {
    stem: string;
    element: ElementName;
    polarity: '阳' | '阴';
    strength: '偏弱' | '中和' | '偏旺';
    summary: string;
  };
  elementScores: ElementScore[];
  usefulElements: ElementName[];
  structure: {
    dominantElement: ElementName;
    missingElements: ElementName[];
    highlightedTenGods: string[];
    taiYuan: string;
    mingGong: string;
    shenGong: string;
  };
  portrait: PersonalityPortrait;
  deepDive: DeepDiveReport;
  daYun: {
    startText: string;
    direction: string;
    periods: DaYunPeriod[];
  };
  annual: {
    year: number;
    ganZhi: string;
    theme: string;
    suggestion: string;
  };
  advice: Record<ReadingSection, ReadingAdvice>;
}

export interface ReadingPort {
  createReading(input: BirthInput): BaziReading;
}

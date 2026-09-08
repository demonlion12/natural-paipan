export type Gender = 'male' | 'female';
export type YaoValue = 6 | 7 | 8 | 9;
export type ElementName = '木' | '火' | '土' | '金' | '水';
export type PillarKey = 'year' | 'month' | 'day' | 'time';
export type ReadingSection = 'overview' | 'career' | 'relationship' | 'health' | 'growth';
export type CalendarType = 'solar' | 'lunar';
export type TimeMode = 'clock' | 'trueSolar';
export type DayBoundary = 'midnight' | 'lateZi';
export type BirthTimeSource = 'certificate' | 'family' | 'memory' | 'estimated' | 'unknown';

export interface BirthInput {
  name: string;
  gender: Gender;
  birthDate: string;
  birthTime: string;
  birthplace: string;
  latitude?: number;
  calendarType: CalendarType;
  lunarLeapMonth: boolean;
  timezoneOffset: number;
  longitude: number;
  timeMode: TimeMode;
  daylightSaving: boolean;
  dayBoundary: DayBoundary;
  unknownHour: boolean;
  birthTimeSource: BirthTimeSource;
  uncertaintyMinutes: number;
}

export interface Pillar {
  known?: boolean;
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

export interface SchoolJudgment {
  citation?: { bookId: string; chapterId: string; chapterTitle: string; passageId: string; version: string; sourceUrl: string; text: string };
  ruleId?: string;
  dependencies?: string[];
  counterEvidence?: string[];
  key: 'ziping' | 'qiongtong' | 'ditiansui' | 'sanming';
  school: string;
  weight: '主判' | '校验' | '补充';
  focus: string;
  source: string;
  sourceUrl: string;
  quote: string;
  conclusion: string;
  evidence: string[];
  limitation: string;
}

export interface MethodSynthesis {
  confidence: '较高' | '中等' | '待回测';
  confidenceReason: string;
  consensus: string[];
  differences: string[];
  decisionOrder: string[];
  schools: SchoolJudgment[];
}

export interface DeepDiveReport {
  thesis: string;
  usefulGod: string;
  favorableGod: string;
  avoidGod: string;
  structureName: string;
  methodSynthesis: MethodSynthesis;
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
  calculation: {
    version: string;
    asOf?: string;
    ruleVersion?: string;
    contentVersion?: string;
    completeness?: 'complete' | 'unknown-hour';
    originalText: string;
    convertedSolarText: string;
    effectiveSolarText: string;
    correctionMinutes: number;
    longitudeCorrectionMinutes: number;
    equationOfTimeMinutes: number;
    daylightSavingMinutes: number;
    dayBoundaryText: string;
    reliabilityText: string;
    warnings: string[];
  };
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
  createReading(input: BirthInput, context?: AnalysisContext): Promise<BaziReading>;
}

export interface AnalysisContext {
  asOf: string;
  signal?: AbortSignal;
}

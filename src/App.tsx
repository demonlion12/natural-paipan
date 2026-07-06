import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Copy,
  Download,
  Edit3,
  FileText,
  Heart,
  LogIn,
  MapPin,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { readingService } from './adapters/readingService';
import type { BaziReading, BirthInput, DeepDomainKey, ElementName, ReadingSection } from './core/types';

const initialInput: BirthInput = {
  name: '1232',
  gender: 'male',
  birthDate: '1990-01-01',
  birthTime: '00:00',
  birthplace: '未知地 北京时间',
};

const sectionOrder: ReadingSection[] = ['overview', 'career', 'relationship', 'health', 'growth'];
type AppStep = 'login' | 'birth' | 'report';
type NavTarget = 'paipan' | 'professional' | 'detail' | 'luck' | 'notes';
type ClassicKey = 'qiongtong' | 'ditiansui' | 'sanming' | 'tiyao' | 'ziping';
const deepDomainOrder: DeepDomainKey[] = ['summary', 'career', 'wealth', 'relationship', 'health', 'family'];

const sectionIcon = {
  overview: Sparkles,
  career: Compass,
  relationship: Heart,
  health: Activity,
  growth: Check,
};

const classicTabs: Array<{ key: ClassicKey; label: string }> = [
  { key: 'qiongtong', label: '穷通宝鉴' },
  { key: 'ditiansui', label: '滴天髓' },
  { key: 'sanming', label: '三命通会' },
  { key: 'tiyao', label: '八字提要' },
  { key: 'ziping', label: '子平真诠' },
];

function createReadingSafely(input: BirthInput) {
  try {
    return { reading: readingService.createReading(input), error: '' };
  } catch (error) {
    return {
      reading: null,
      error: error instanceof Error ? error.message : '排盘失败，请检查输入',
    };
  }
}

const elementIcon: Record<string, string> = {
  木: '🌱',
  火: '🔥',
  土: '⛰',
  金: '⚒',
  水: '💧',
};

const branchElement: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
};

const stemElement: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

const stemPolarity: Record<string, '阳' | '阴'> = {
  甲: '阳',
  乙: '阴',
  丙: '阳',
  丁: '阴',
  戊: '阳',
  己: '阴',
  庚: '阳',
  辛: '阴',
  壬: '阳',
  癸: '阴',
};

const branchHiddenStems: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const monthBranches = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
const monthTerms = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];

const tianYiMap: Record<string, string[]> = {
  甲: ['丑', '未'],
  戊: ['丑', '未'],
  庚: ['丑', '未'],
  乙: ['子', '申'],
  己: ['子', '申'],
  丙: ['亥', '酉'],
  丁: ['亥', '酉'],
  壬: ['卯', '巳'],
  癸: ['卯', '巳'],
  辛: ['寅', '午'],
};

const wenChangMap: Record<string, string> = {
  甲: '巳',
  乙: '午',
  丙: '申',
  丁: '酉',
  戊: '申',
  己: '酉',
  庚: '亥',
  辛: '子',
  壬: '寅',
  癸: '卯',
};

const luShenMap: Record<string, string> = {
  甲: '寅',
  乙: '卯',
  丙: '巳',
  丁: '午',
  戊: '巳',
  己: '午',
  庚: '申',
  辛: '酉',
  壬: '亥',
  癸: '子',
};

const yangRenMap: Record<string, string> = {
  甲: '卯',
  乙: '寅',
  丙: '午',
  丁: '巳',
  戊: '午',
  己: '巳',
  庚: '酉',
  辛: '申',
  壬: '子',
  癸: '亥',
};

const combinePairs = [
  ['甲', '己', '甲己合土'],
  ['乙', '庚', '乙庚合金'],
  ['丙', '辛', '丙辛合水'],
  ['丁', '壬', '丁壬合木'],
  ['戊', '癸', '戊癸合火'],
];

const branchRelations = [
  ['子', '午', '子午冲'],
  ['丑', '未', '丑未冲'],
  ['寅', '申', '寅申冲'],
  ['卯', '酉', '卯酉冲'],
  ['辰', '戌', '辰戌冲'],
  ['巳', '亥', '巳亥冲'],
  ['子', '丑', '子丑合'],
  ['寅', '亥', '寅亥合'],
  ['卯', '戌', '卯戌合'],
  ['辰', '酉', '辰酉合'],
  ['巳', '申', '巳申合'],
  ['午', '未', '午未合'],
  ['子', '卯', '子卯刑'],
  ['寅', '巳', '寅巳刑'],
  ['巳', '申', '巳申刑'],
  ['丑', '戌', '丑戌刑'],
  ['戌', '未', '戌未刑'],
  ['子', '未', '子未害'],
  ['丑', '午', '丑午害'],
  ['寅', '巳', '寅巳害'],
  ['卯', '辰', '卯辰害'],
  ['申', '亥', '申亥害'],
  ['酉', '戌', '酉戌害'],
];

function collectPairNotes(values: string[], rules: string[][], fallback: string) {
  const notes = new Set<string>();
  rules.forEach(([a, b, label]) => {
    if (values.includes(a) && values.includes(b)) {
      notes.add(label);
    }
  });
  return notes.size ? [...notes].join('，') : fallback;
}

function advanceGanZhi(baseGanZhi: string, offset: number) {
  const [stem, branch] = baseGanZhi.split('');
  const stemIndex = stems.indexOf(stem);
  const branchIndex = branches.indexOf(branch);
  if (stemIndex < 0 || branchIndex < 0) {
    return baseGanZhi;
  }
  return `${stems[(stemIndex + offset + stems.length * 20) % stems.length]}${branches[(branchIndex + offset + branches.length * 20) % branches.length]}`;
}

function getTenGod(dayStem: string, targetStem: string) {
  const dayElement = stemElement[dayStem];
  const targetElement = stemElement[targetStem];
  const samePolarity = stemPolarity[dayStem] === stemPolarity[targetStem];

  if (!dayElement || !targetElement) {
    return '-';
  }
  if (dayElement === targetElement) {
    return samePolarity ? '比肩' : '劫财';
  }
  if (
    (dayElement === '木' && targetElement === '火') ||
    (dayElement === '火' && targetElement === '土') ||
    (dayElement === '土' && targetElement === '金') ||
    (dayElement === '金' && targetElement === '水') ||
    (dayElement === '水' && targetElement === '木')
  ) {
    return samePolarity ? '食神' : '伤官';
  }
  if (
    (targetElement === '木' && dayElement === '火') ||
    (targetElement === '火' && dayElement === '土') ||
    (targetElement === '土' && dayElement === '金') ||
    (targetElement === '金' && dayElement === '水') ||
    (targetElement === '水' && dayElement === '木')
  ) {
    return samePolarity ? '偏印' : '正印';
  }
  if (
    (dayElement === '木' && targetElement === '土') ||
    (dayElement === '火' && targetElement === '金') ||
    (dayElement === '土' && targetElement === '水') ||
    (dayElement === '金' && targetElement === '木') ||
    (dayElement === '水' && targetElement === '火')
  ) {
    return samePolarity ? '偏财' : '正财';
  }
  return samePolarity ? '七杀' : '正官';
}

function getBranchGroupStar(referenceBranch: string, targetBranch: string, map: Record<string, string[]>, label: string) {
  const matched = Object.entries(map).find(([branchesInGroup, starBranch]) => {
    return branchesInGroup.includes(referenceBranch) && starBranch.includes(targetBranch);
  });
  return matched ? label : '';
}

function getShenShaForBranch(reading: BaziReading, targetStem: string, targetBranch: string) {
  const dayStem = reading.dayMaster.stem;
  const dayBranch = reading.pillars.find((pillar) => pillar.key === 'day')?.branch ?? '';
  const yearBranch = reading.pillars.find((pillar) => pillar.key === 'year')?.branch ?? '';
  const stars = new Set<string>();

  if ((tianYiMap[dayStem] ?? []).includes(targetBranch)) {
    stars.add('天乙贵人');
  }
  if (wenChangMap[dayStem] === targetBranch) {
    stars.add('文昌贵人');
  }
  if (luShenMap[dayStem] === targetBranch) {
    stars.add('禄神');
  }
  if (yangRenMap[dayStem] === targetBranch) {
    stars.add('羊刃');
  }

  const groupMaps = [
    { label: '桃花', map: { 申子辰: ['酉'], 寅午戌: ['卯'], 巳酉丑: ['午'], 亥卯未: ['子'] } },
    { label: '驿马', map: { 申子辰: ['寅'], 寅午戌: ['申'], 巳酉丑: ['亥'], 亥卯未: ['巳'] } },
    { label: '华盖', map: { 申子辰: ['辰'], 寅午戌: ['戌'], 巳酉丑: ['丑'], 亥卯未: ['未'] } },
    { label: '将星', map: { 申子辰: ['子'], 寅午戌: ['午'], 巳酉丑: ['酉'], 亥卯未: ['卯'] } },
  ];
  [dayBranch, yearBranch].filter(Boolean).forEach((referenceBranch) => {
    groupMaps.forEach((item) => {
      const star = getBranchGroupStar(referenceBranch, targetBranch, item.map, item.label);
      if (star) {
        stars.add(star);
      }
    });
  });

  if (targetStem === dayStem) {
    stars.add('伏吟');
  }
  return [...stars].slice(0, 5);
}

function createVirtualColumn(label: string, ganZhi: string, reading: BaziReading) {
  const [stem, branch] = ganZhi.split('');
  const hiddenStems = branchHiddenStems[branch] ?? [];
  return {
    label,
    ganZhi,
    stem,
    branch,
    hiddenStems,
    stemTenGod: getTenGod(reading.dayMaster.stem, stem),
    branchTenGods: hiddenStems.map((hiddenStem) => getTenGod(reading.dayMaster.stem, hiddenStem)),
    shenSha: getShenShaForBranch(reading, stem, branch),
    diShi: '-',
    xunKong: '-',
    naYin: '-',
  };
}

function getLuckPhase(period: BaziReading['daYun']['periods'][number]) {
  if (period.endAge <= 22) {
    return '成长期';
  }
  if (period.endAge <= 42) {
    return '立业期';
  }
  if (period.endAge <= 62) {
    return '沉淀期';
  }
  return '收束期';
}

function describeLuckPeriod(reading: BaziReading, period: BaziReading['daYun']['periods'][number]) {
  const [stem, branch] = period.ganZhi.split('');
  const stemWuXing = stemElement[stem] ?? '';
  const branchWuXing = branchElement[branch] ?? '';
  const usefulHits = [stemWuXing, branchWuXing].filter((element): element is ElementName =>
    reading.usefulElements.includes(element as ElementName),
  );
  const repeatsDominant = [stemWuXing, branchWuXing].includes(reading.structure.dominantElement);
  const branchNote = collectPairNotes(
    [...reading.pillars.map((pillar) => pillar.branch), branch],
    branchRelations,
    '与原局地支未见明显冲合刑害，更多看五行补偏与十神落点。',
  );
  const stemNote = collectPairNotes(
    [...reading.pillars.map((pillar) => pillar.stem), stem],
    combinePairs,
    '与原局天干未见明显合化，重点看该运天干所带出的做事方式。',
  );
  const theme = usefulHits.length
    ? `这步运带${usefulHits.join('、')}，能补命局所需，适合主动经营关键机会。`
    : repeatsDominant
      ? `这步运加重${reading.structure.dominantElement}气，优势会更明显，但也容易把原本的惯性放大。`
      : `这步运不直接落在首要喜用上，宜以稳定节奏和现实选择来借势。`;
  const action = period.isCurrent
    ? '当前正在此运，重要决定要同时看原局短板、流年触发和现实资源，不宜只凭一时情绪推进。'
    : period.startYear > new Date().getFullYear()
      ? '未来进入此运前，先把专业能力、现金流和关系边界准备好，届时更容易承接机会。'
      : '这步运可作为回测样本，回看学习、迁移、事业压力、关系变化是否在此阶段明显被触发。';

  return {
    action,
    branchNote,
    phase: getLuckPhase(period),
    stemNote,
    theme,
    usefulText: usefulHits.length ? `喜用触发：${usefulHits.join('、')}` : `喜用未显：以${reading.usefulElements.join('、')}为调候方向`,
  };
}

function GanZhiGlyph({ value, type }: { value: string; type: 'stem' | 'branch' }) {
  const element = type === 'stem' ? stemElement[value] : branchElement[value];

  return (
    <span className={`gz-glyph gz-${element}`}>
      {value}
      <small>{elementIcon[element]}</small>
    </span>
  );
}

function TopProfile({
  reading,
  onEdit,
  onCopy,
  onExport,
}: {
  reading: BaziReading;
  onEdit: () => void;
  onCopy: () => void;
  onExport: () => void;
}) {
  return (
    <section className="profile-banner">
      <div className="profile-seal">☯</div>
      <div className="profile-name">{reading.input.name || '未命名'}</div>
      <div className="profile-dates">
        <span>
          阴历：{reading.lunarText} {reading.pillars[3].branch}时
        </span>
        <span>阳历：{reading.solarText}</span>
      </div>
      <div className="profile-actions">
        <button className="edit-button" onClick={onEdit} type="button">
          <Edit3 size={16} />
          编辑
        </button>
        <button className="edit-button" onClick={onCopy} type="button">
          <Copy size={16} />
          复制
        </button>
        <button className="edit-button" onClick={onExport} type="button">
          <Download size={16} />
          导出
        </button>
      </div>
    </section>
  );
}

function AncientReference({ reading }: { reading: BaziReading }) {
  const [activeClassic, setActiveClassic] = useState<ClassicKey>('qiongtong');
  const [showReasoning, setShowReasoning] = useState(true);
  const dayStem = reading.dayMaster.stem;
  const monthBranch = reading.pillars[1].branch;
  const visibleStems = reading.pillars.map((pillar) => pillar.stem).join('、');
  const hiddenStems = [...new Set(reading.pillars.flatMap((pillar) => pillar.hiddenStems))].join('、');
  const useful = reading.usefulElements.join('、');
  const dominant = reading.structure.dominantElement;
  const missing = reading.structure.missingElements.join('、') || '五行不见明显缺口';

  const classicContent: Record<ClassicKey, { hint: string; paragraphs: string[] }> = {
    qiongtong: {
      hint: `调候用神提示：${useful}`,
      paragraphs: [
        `${monthBranch}月论命，先看月令寒暖燥湿，再看日主是否得令、得地、得助。此局日主为${dayStem}，${reading.dayMaster.strength}，不可只按五行数量取断，仍须合看月令、藏干与十神透出。`,
        `从盘面看，${dominant}气较显，${missing}为后天需调之处。若行运能引动${useful}，多主思路顺、资源顺、做事阻力减；若再逢耗泄太过，则宜守中取势，不宜强拧。`,
      ],
    },
    ditiansui: {
      hint: '滴天髓重气势流通：旺者宜泄，弱者宜扶，寒暖燥湿不可偏废。',
      paragraphs: [
        `此局要点在“气势是否能流通”。${dominant}显则是天赋与惯性，若只旺而不通，现实中容易表现为某类反应过度；若能以${useful}疏导，则才气、判断和执行更容易落地。`,
        `看命不可见一字便断吉凶。年、月、日、时四柱需合看：年看根基，月看令气，日看自身，时看后劲。此局时柱为${reading.pillars[3].ganZhi}，后期更重能力沉淀。`,
      ],
    },
    sanming: {
      hint: '三命通会重格局组合：财官印食伤，比劫杀刃，皆须看位置与成败。',
      paragraphs: [
        `十神较显者为${reading.structure.highlightedTenGods.join('、') || '结构分散'}。这些不是标签，而是你在现实事务中的角色：有的主资源，有的主规则，有的主表达，有的主竞争。`,
        `格局有成有破，不宜强行套一个名称。若大运配合，优势能成事；若岁运冲动短板，则容易在人情、节奏、资源或规则上出现压力。`,
      ],
    },
    tiyao: {
      hint: '八字提要重简明定盘：先看日主，再看月令，再取喜忌。',
      paragraphs: [
        `定盘简要：日主${dayStem}，生于${monthBranch}月，整体${reading.dayMaster.strength}。喜用偏向${useful}，忌一味加重${dominant}之偏。`,
        `现实落点：重要选择宜先问三件事：是否补足用神，是否减少内耗，是否能沉淀长期能力。若三者皆无，则短期热闹未必值得投入。`,
      ],
    },
    ziping: {
      hint: '子平真诠重月令与格局：有官先论官，有杀先论杀，成败看清浊。',
      paragraphs: [
        `月柱${reading.pillars[1].ganZhi}为提纲，提纲定一局气候。此处要看${reading.pillars[1].stemTenGod}与藏干${reading.pillars[1].hiddenStems.join('、')}如何作用于日主。`,
        `若格局清，则事有主线；若混杂，则人生常需先筛选方向。你的盘面更适合把复杂机会收束成一条主线，不宜什么都抓。`,
      ],
    },
  };
  const currentClassic = classicContent[activeClassic];

  return (
    <article className="classic-panel">
      <h2>智能古籍参考</h2>
      <div className="classic-tabs">
        {classicTabs.map((tab) => (
          <button
            className={tab.key === activeClassic ? 'classic-tab active' : 'classic-tab'}
            key={tab.key}
            onClick={() => setActiveClassic(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="classic-body">
        <p className="classic-hint">{currentClassic.hint}</p>
        <p>
          本八字：透 <mark>{visibleStems}</mark>，藏 <mark>{hiddenStems}</mark>
        </p>
        <button className="classic-pill" onClick={() => setShowReasoning((value) => !value)} type="button">
          {showReasoning ? '收起推演' : `展开论${dayStem}生${monthBranch}月`}
        </button>
        {showReasoning && currentClassic.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p>
          此处为古籍思路转译，并非绝对断语。命局定底色，大运定阶段，流年定触发，现实选择才定落点。
        </p>
      </div>
    </article>
  );
}

function PaipanSection({ reading }: { reading: BaziReading }) {
  const stemNotes = collectPairNotes(reading.pillars.map((pillar) => pillar.stem), combinePairs, '无合冲关系');
  const branchNotes = collectPairNotes(reading.pillars.map((pillar) => pillar.branch), branchRelations, '未见明显冲合刑害');
  const rows = [
    { label: '主星', render: (pillar: BaziReading['pillars'][number]) => <strong>{pillar.stemTenGod}</strong> },
    { label: '天干', render: (pillar: BaziReading['pillars'][number]) => <GanZhiGlyph value={pillar.stem} type="stem" /> },
    { label: '地支', render: (pillar: BaziReading['pillars'][number]) => <GanZhiGlyph value={pillar.branch} type="branch" /> },
    {
      label: '藏干',
      render: (pillar: BaziReading['pillars'][number]) => (
        <span className="stacked-text">{pillar.hiddenStems.map((stem) => `${stem}${stemElement[stem]}`).join('\n')}</span>
      ),
    },
    {
      label: '副星',
      render: (pillar: BaziReading['pillars'][number]) => (
        <span className="stacked-text">{pillar.branchTenGods.join('\n') || '-'}</span>
      ),
    },
    { label: '星运', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.diShi}</span> },
    { label: '自坐', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.diShi}</span> },
    { label: '空亡', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.xunKong}</span> },
    { label: '纳音', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.naYin}</span> },
    {
      label: '神煞',
      render: (pillar: BaziReading['pillars'][number]) => (
        <span className="stacked-text shensha-text">{getShenShaForBranch(reading, pillar.stem, pillar.branch).join('\n') || '-'}</span>
      ),
    },
  ];

  return (
    <section className="paipan-section">
      <div className="paipan-grid">
        <article className="paipan-table-card">
          <div className="paipan-table">
            <div className="paipan-row paipan-head">
              <div>日期</div>
              {reading.pillars.map((pillar) => (
                <div key={pillar.key}>{pillar.label}</div>
              ))}
            </div>
            {rows.map((row) => (
              <div className="paipan-row" key={row.label}>
                <div className="row-label">{row.label}</div>
                {reading.pillars.map((pillar) => (
                  <div className="paipan-cell" key={`${row.label}-${pillar.key}`}>
                    {row.render(pillar)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </article>
        <AncientReference reading={reading} />
      </div>
      <div className="paipan-notes">
        <p>
          <strong>天干留意：</strong>
          {stemNotes}
        </p>
        <p>
          <strong>地支留意：</strong>
          {branchNotes}
        </p>
      </div>
    </section>
  );
}

function ProfessionalChartPanel({ reading }: { reading: BaziReading }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const selectableYears = Array.from({ length: 41 }, (_, index) => currentYear - 10 + index);
  const currentLuck =
    reading.daYun.periods.find((period) => selectedYear >= period.startYear && selectedYear <= period.endYear) ??
    reading.daYun.periods.find((period) => period.isCurrent) ??
    reading.daYun.periods[0];
  const currentYearGanZhi =
    reading.annual.year === selectedYear ? reading.annual.ganZhi : advanceGanZhi(reading.annual.ganZhi, selectedYear - reading.annual.year);
  const detailColumns = [
    createVirtualColumn('流年', currentYearGanZhi, reading),
    createVirtualColumn('大运', currentLuck.ganZhi, reading),
    ...reading.pillars.map((pillar) => ({
      ...pillar,
      shenSha: getShenShaForBranch(reading, pillar.stem, pillar.branch),
    })),
  ];
  const stemNotes = collectPairNotes(detailColumns.map((column) => column.stem), combinePairs, '天干暂未见明显合化，重点看十神与五行补偏。');
  const branchNotes = collectPairNotes(detailColumns.map((column) => column.branch), branchRelations, '地支暂未见明显冲合刑害，重点看岁运是否引动原局。');
  const nextYears = Array.from({ length: 8 }, (_, index) => {
    const year = selectedYear + index;
    return {
      year,
      ganZhi: advanceGanZhi(currentYearGanZhi, index),
    };
  });
  const flowMonths = monthBranches.map((branch, index) => {
    const ganZhi = `${stems[(stems.indexOf(currentYearGanZhi[0]) * 2 + index + 2) % stems.length]}${branch}`;
    return {
      term: monthTerms[index],
      ganZhi,
    };
  });
  const rows = [
    { label: '主星', render: (column: typeof detailColumns[number]) => <strong>{column.stemTenGod}</strong> },
    { label: '天干', render: (column: typeof detailColumns[number]) => <GanZhiGlyph value={column.stem} type="stem" /> },
    { label: '地支', render: (column: typeof detailColumns[number]) => <GanZhiGlyph value={column.branch} type="branch" /> },
    {
      label: '藏干',
      render: (column: typeof detailColumns[number]) => (
        <span className="stacked-text">{column.hiddenStems.map((stem) => `${stem}${stemElement[stem]}`).join('\n') || '-'}</span>
      ),
    },
    {
      label: '副星',
      render: (column: typeof detailColumns[number]) => <span className="stacked-text">{column.branchTenGods.join('\n') || '-'}</span>,
    },
    { label: '星运', render: (column: typeof detailColumns[number]) => <span>{column.diShi}</span> },
    { label: '空亡', render: (column: typeof detailColumns[number]) => <span>{column.xunKong}</span> },
    { label: '纳音', render: (column: typeof detailColumns[number]) => <span>{column.naYin}</span> },
    { label: '神煞', render: (column: typeof detailColumns[number]) => <span className="stacked-text shensha-text">{column.shenSha.join('\n') || '-'}</span> },
  ];

  return (
    <section className="section professional-chart-section">
      <div className="section-title">
        <h2>专业细盘</h2>
        <div className="professional-title-actions">
          <label>
            <span>流年</span>
            <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
              {selectableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <span>
            {selectedYear}流年 · {currentLuck.ganZhi}大运 · 原局同看
          </span>
        </div>
      </div>

      <div className="professional-grid">
        <article className="professional-table-card">
          <div className="professional-table">
            <div className="professional-row professional-head">
              <div>日期</div>
              {detailColumns.map((column) => (
                <div key={column.label}>{column.label}</div>
              ))}
            </div>
            {rows.map((row) => (
              <div className="professional-row" key={row.label}>
                <div className="row-label">{row.label}</div>
                {detailColumns.map((column) => (
                  <div className="paipan-cell" key={`${row.label}-${column.label}`}>
                    {row.render(column)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </article>

        <article className="flow-board">
          <div className="flow-board-head">
            <div>
              <strong>岁运盘</strong>
              <span>
                起运：{reading.daYun.startText} · {reading.daYun.direction}
              </span>
            </div>
            <small>日主：{reading.dayMaster.stem} · 点击流年切换</small>
          </div>

          <div className="flow-matrix">
            <div className="flow-label">大运</div>
            {reading.daYun.periods.slice(0, 8).map((period) => (
              <div className={period.ganZhi === currentLuck.ganZhi ? 'flow-cell current' : 'flow-cell'} key={period.ganZhi}>
                <small>{period.startYear}</small>
                <strong>{period.ganZhi}</strong>
                <span>{getTenGod(reading.dayMaster.stem, period.ganZhi[0])}</span>
              </div>
            ))}

            <div className="flow-label">流年</div>
            {nextYears.map((year) => (
              <button
                type="button"
                className={year.year === selectedYear ? 'flow-cell current' : 'flow-cell'}
                key={year.year}
                onClick={() => setSelectedYear(year.year)}
                aria-label={`切换到${year.year}流年`}
              >
                <small>{year.year}</small>
                <strong>{year.ganZhi}</strong>
                <span>{getTenGod(reading.dayMaster.stem, year.ganZhi[0])}</span>
              </button>
            ))}

            <div className="flow-label">流月</div>
            {flowMonths.slice(0, 8).map((month) => (
              <div className="flow-cell" key={`${month.term}-${month.ganZhi}`}>
                <small>{month.term}</small>
                <strong>{month.ganZhi}</strong>
                <span>{getTenGod(reading.dayMaster.stem, month.ganZhi[0])}</span>
              </div>
            ))}
          </div>

          <div className="flow-summary">
            <span>{reading.usefulElements[0]}旺</span>
            <span>{reading.structure.dominantElement}显</span>
            <span>{reading.dayMaster.strength}</span>
          </div>
        </article>
      </div>

      <div className="paipan-notes">
        <p>
          <strong>天干留意：</strong>
          {stemNotes}
        </p>
        <p>
          <strong>地支留意：</strong>
          {branchNotes}
        </p>
      </div>
    </section>
  );
}

function ElementBoard({ reading }: { reading: BaziReading }) {
  return (
    <section className="section element-section">
      <div className="section-title">
        <h2>五行气势</h2>
        <span>喜用 {reading.usefulElements.join('、')}</span>
      </div>
      <div className="element-board">
        <div className="wheel" aria-label="五行盘">
          {reading.elementScores.map((item, index) => (
            <div className={`wheel-item wheel-${item.element}`} key={item.element} style={{ rotate: `${index * 72}deg` }}>
              <span style={{ rotate: `${-index * 72}deg` }}>{item.element}</span>
            </div>
          ))}
          <div className="wheel-center">
            <strong>{reading.dayMaster.stem}</strong>
            <span>{reading.dayMaster.strength}</span>
          </div>
        </div>
        <div className="element-bars">
          {reading.elementScores.map((item) => (
            <div className="element-row" key={item.element}>
              <div className="element-head">
                <strong>{item.element}</strong>
                <span>{item.tone}</span>
              </div>
              <div className="bar-track">
                <div className={`bar-fill fill-${item.element}`} style={{ width: `${Math.max(item.ratio * 100, 5)}%` }} />
              </div>
              <span className="score">{Math.round(item.ratio * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PortraitSection({ reading }: { reading: BaziReading }) {
  const { portrait } = reading;

  return (
    <section className="section portrait-section">
      <div className="section-title">
        <h2>性格画像</h2>
        <span>从日主、月令、十神和五行结构合看</span>
      </div>
      <div className="portrait-opening">
        <span className="eyebrow">{portrait.title}</span>
        <p>{portrait.opening}</p>
      </div>

      <div className="portrait-grid">
        <article>
          <h3>命理依据</h3>
          <ul>
            {portrait.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>内在模式</h3>
          <ul>
            {portrait.traits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>优势所在</h3>
          <ul>
            {portrait.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>容易卡住</h3>
          <ul>
            {portrait.blindSpots.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="life-grid">
        <article>
          <h3>事业打法</h3>
          <p>{portrait.workStyle}</p>
        </article>
        <article>
          <h3>关系模式</h3>
          <p>{portrait.relationshipStyle}</p>
        </article>
        <article>
          <h3>财务节奏</h3>
          <p>{portrait.moneyStyle}</p>
        </article>
      </div>

      <article className="growth-key">
        <h3>一句话点醒</h3>
        <p>{portrait.growthKey}</p>
      </article>

      <div className="verification-box">
        <strong>可验证回测</strong>
        <ul>
          {portrait.verification.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AdvicePanel({ reading }: { reading: BaziReading }) {
  const [activeSection, setActiveSection] = useState<ReadingSection>('overview');
  const advice = reading.advice[activeSection];
  const Icon = sectionIcon[activeSection];

  return (
    <section className="section advice-section">
      <div className="section-title">
        <h2>分析建议</h2>
        <span>{reading.structure.highlightedTenGods.join('、') || '结构均衡'}</span>
      </div>
      <div className="tabs" role="tablist" aria-label="分析分类">
        {sectionOrder.map((section) => {
          const TabIcon = sectionIcon[section];
          return (
            <button
              className={section === activeSection ? 'tab active' : 'tab'}
              key={section}
              onClick={() => setActiveSection(section)}
              type="button"
            >
              <TabIcon size={16} />
              <span>{reading.advice[section].title}</span>
            </button>
          );
        })}
      </div>
      <article className="advice-body">
        <div className="advice-icon">
          <Icon size={22} />
        </div>
        <div>
          <h3>{advice.title}</h3>
          <p>{advice.body}</p>
          <div className="tag-row">
            {advice.tags.map((tag, index) => (
              <span key={`${tag}-${index}`}>{tag}</span>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}

function DeepDivePanel({ reading }: { reading: BaziReading }) {
  const [activeDomain, setActiveDomain] = useState<DeepDomainKey>('summary');
  const activeReport = reading.deepDive.domains.find((domain) => domain.key === activeDomain) ?? reading.deepDive.domains[0];

  return (
    <section className="section deep-section">
      <div className="section-title">
        <h2>专业详批</h2>
        <span>
          {reading.deepDive.structureName} · 用神{reading.deepDive.usefulGod} · 喜神{reading.deepDive.favorableGod}
        </span>
      </div>
      <div className="deep-thesis">
        <strong>命局总纲</strong>
        <p>{reading.deepDive.thesis}</p>
      </div>
      <div className="deep-tabs" role="tablist" aria-label="专项详批">
        {deepDomainOrder.map((key) => {
          const domain = reading.deepDive.domains.find((item) => item.key === key);
          if (!domain) {
            return null;
          }
          return (
            <button
              className={activeDomain === key ? 'deep-tab active' : 'deep-tab'}
              key={key}
              onClick={() => setActiveDomain(key)}
              type="button"
            >
              {domain.title}
            </button>
          );
        })}
      </div>
      <article className="domain-report">
        <h3>{activeReport.title}</h3>
        <p className="domain-conclusion">{activeReport.conclusion}</p>
        <div className="domain-grid">
          <div>
            <h4>命理依据</h4>
            <ul>
              {activeReport.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>现实表现</h4>
            <ul>
              {activeReport.realWorld.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>风险点</h4>
            <ul>
              {activeReport.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>行动建议</h4>
            <ul>
              {activeReport.actions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </section>
  );
}

function LuckIntegratedPanel({ reading }: { reading: BaziReading }) {
  const currentPeriod = reading.daYun.periods.find((period) => period.isCurrent);
  const currentDescription = currentPeriod ? describeLuckPeriod(reading, currentPeriod) : null;

  return (
    <section className="section luck-integrated-section">
      <div className="section-title">
        <h2>大运合参</h2>
        <span>
          八字原局 + 十年大运 + 未来三年
        </span>
      </div>

      <div className="luck-overview">
        <article>
          <strong>起运方式</strong>
          <p>
            {reading.daYun.direction}，{reading.daYun.startText}。大运不是单独看吉凶，而是看它把原局里的哪一股气引出来。
          </p>
        </article>
        <article>
          <strong>命局底盘</strong>
          <p>
            日主{reading.dayMaster.stem}，整体{reading.dayMaster.strength}；命局{reading.structure.dominantElement}气较显，喜用偏向
            {reading.usefulElements.join('、')}。
          </p>
        </article>
        <article>
          <strong>当前重点</strong>
          <p>
            {currentPeriod && currentDescription
              ? `${currentPeriod.ganZhi}运（${currentPeriod.startYear}-${currentPeriod.endYear}）处在${currentDescription.phase}，${currentDescription.theme}`
              : '当前大运未能定位，建议检查出生时间与性别信息。'}
          </p>
        </article>
      </div>

      <div className="luck-current-grid">
        <article className="luck-current-card">
          <h3>当前大运详批</h3>
          {reading.deepDive.currentLuck && currentPeriod && currentDescription ? (
            <>
              <div className="luck-current-head">
                <strong>{reading.deepDive.currentLuck.ganZhi}</strong>
                <span>
                  {reading.deepDive.currentLuck.years} · {reading.deepDive.currentLuck.ages}
                </span>
              </div>
              <p>{reading.deepDive.currentLuck.effect}</p>
              <div className="domain-grid compact">
                <div>
                  <h4>原局触发</h4>
                  <ul>
                    <li>{currentDescription.stemNote}</li>
                    <li>{currentDescription.branchNote}</li>
                  </ul>
                </div>
                <div>
                  <h4>较利方向</h4>
                  <ul>
                    {reading.deepDive.currentLuck.bestFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>需要留意</h4>
                  <ul>
                    {reading.deepDive.currentLuck.caution.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>行动取法</h4>
                  <ul>
                    <li>{currentDescription.action}</li>
                    <li>{currentDescription.usefulText}</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p>当前大运未能定位，请检查出生时间与性别信息。</p>
          )}
        </article>
      </div>

      <div className="luck-period-list">
        {reading.daYun.periods.map((period) => (
          <article className={period.isCurrent ? 'luck-period-card current' : 'luck-period-card'} key={`${period.startYear}-${period.ganZhi}`}>
            <div className="luck-period-head">
              <div>
                <strong>{period.ganZhi}</strong>
                <span>{describeLuckPeriod(reading, period).phase}</span>
              </div>
              <p>
                {period.startYear}-{period.endYear} · {period.startAge}-{period.endAge}岁
              </p>
            </div>
            <div className="luck-period-body">
              <p>{describeLuckPeriod(reading, period).theme}</p>
              <ul>
                <li>{describeLuckPeriod(reading, period).stemNote}</li>
                <li>{describeLuckPeriod(reading, period).branchNote}</li>
                <li>{describeLuckPeriod(reading, period).action}</li>
              </ul>
            </div>
            <small>空亡：{period.xunKong} · {describeLuckPeriod(reading, period).usefulText}</small>
          </article>
        ))}
      </div>

      <article className="year-card">
        <h3>未来三年逐年提示</h3>
        <div className="year-list">
          {reading.deepDive.futureYears.map((year) => (
            <div className="year-item" key={year.year}>
              <strong>
                {year.year} · {year.ganZhi} · {year.theme}
              </strong>
              <p>{year.focus}</p>
              <p>事业：{year.career}</p>
              <p>关系：{year.relationship}</p>
              <p>财务：{year.money}</p>
              <small>提醒：{year.caution}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function buildReportText(reading: BaziReading, note: string) {
  const pillars = reading.pillars.map((pillar) => `${pillar.label} ${pillar.ganZhi} ${pillar.stemTenGod}`).join(' / ');
  const elements = reading.elementScores.map((item) => `${item.element}${Math.round(item.ratio * 100)}%(${item.tone})`).join('、');
  const deepDomains = reading.deepDive.domains
    .map((domain) => {
      return [
        `【${domain.title}】`,
        domain.conclusion,
        `依据：${domain.evidence.join('；')}`,
        `现实表现：${domain.realWorld.join('；')}`,
        `风险点：${domain.risks.join('；')}`,
        `行动建议：${domain.actions.join('；')}`,
      ].join('\n');
    })
    .join('\n\n');
  const futureYears = reading.deepDive.futureYears
    .map((year) => `${year.year} ${year.ganZhi} ${year.theme}：${year.focus} 事业：${year.career} 关系：${year.relationship} 财务：${year.money} 提醒：${year.caution}`)
    .join('\n');
  const luckPeriods = reading.daYun.periods
    .map((period) => {
      const description = describeLuckPeriod(reading, period);
      return `${period.ganZhi} ${period.startYear}-${period.endYear} ${period.startAge}-${period.endAge}岁：${description.theme} ${description.stemNote} ${description.branchNote} ${description.action}`;
    })
    .join('\n');

  return [
    `自然排盘报告：${reading.input.name || '未命名'}`,
    `阳历：${reading.solarText}`,
    `阴历：${reading.lunarText}`,
    `四柱：${pillars}`,
    `日主：${reading.dayMaster.polarity}${reading.dayMaster.element}，${reading.dayMaster.strength}`,
    `五行：${elements}`,
    `喜用：${reading.usefulElements.join('、')}`,
    `命宫：${reading.structure.mingGong}，身宫：${reading.structure.shenGong}，胎元：${reading.structure.taiYuan}`,
    '',
    '【专业详批：性格画像】',
    reading.portrait.opening,
    '',
    '【事业打法】',
    reading.portrait.workStyle,
    '',
    '【关系模式】',
    reading.portrait.relationshipStyle,
    '',
    '【财务节奏】',
    reading.portrait.moneyStyle,
    '',
    '【专业详批：命局总论】',
    reading.deepDive.thesis,
    `格局取向：${reading.deepDive.structureName}`,
    `用神：${reading.deepDive.usefulGod}；喜神：${reading.deepDive.favorableGod}；忌神参考：${reading.deepDive.avoidGod}`,
    '',
    deepDomains,
    '',
    '【大运合参】',
    luckPeriods,
    '',
    '【未来三年】',
    futureYears,
    '',
    '【断事笔记】',
    note || '暂无',
    '',
    '注：以上为传统命理视角下的趋势分析，不替代医学、法律、心理、财务等专业意见。',
  ].join('\n');
}

function NotesPanel({
  note,
  onChange,
  onClear,
  onSave,
}: {
  note: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSave: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <section className="section notes-panel">
      <div className="section-title">
        <h2>断事笔记</h2>
        <span>记录验证点、问题背景和反馈</span>
      </div>
      <textarea
        aria-label="断事笔记"
        onChange={(event) => onChange(event.target.value)}
        placeholder="例如：想看事业转型；2022 年是否有换工作、搬迁、关系变化；后续反馈准或不准都记在这里。"
        ref={textareaRef}
        value={note}
      />
      <div className="note-actions">
        <button className="secondary-button" onClick={() => onSave(textareaRef.current?.value ?? note)} type="button">
          <Save size={16} />
          保存笔记
        </button>
        <button className="secondary-button" onClick={onClear} type="button">
          <RotateCcw size={16} />
          清空
        </button>
      </div>
    </section>
  );
}

function LoginPage({
  profileName,
  onChangeName,
  onLogin,
  onGuest,
}: {
  profileName: string;
  onChangeName: (value: string) => void;
  onLogin: () => void;
  onGuest: () => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin();
  };

  return (
    <main className="flow-shell login-screen">
      <section className="login-hero">
        <div className="brand-lockup">
          <div className="brand-symbol">自</div>
          <div>
            <span>Natural Paipan</span>
            <h1>自然排盘</h1>
          </div>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">八字排盘 · 专业详批 · 大运合参</p>
          <h2>输入生辰，生成一份清晰可读的八字分析报告。</h2>
          <p>
            先建立档案，再录入出生信息，系统会把四柱、五行、格局、事业关系和大运节奏整理成结构化报告。
          </p>
        </div>
        <div className="feature-strip" aria-label="核心能力">
          <span>四柱排盘</span>
          <span>五行气势</span>
          <span>专业深度页</span>
          <span>逐项详批</span>
        </div>
      </section>

      <section className="auth-card">
        <form onSubmit={handleSubmit}>
          <h2>登录自然排盘</h2>
          <p>建立一个档案，后续可以保存报告、记录断事笔记，并继续查看不同阶段的运势变化。</p>
          <label>
            <span>
              <UserRound size={15} /> 昵称 / 档案名
            </span>
            <input
              autoComplete="name"
              name="profileName"
              onChange={(event) => onChangeName(event.target.value)}
              placeholder="请输入昵称"
              value={profileName}
            />
          </label>
          <label>
            <span>
              <LogIn size={15} /> 手机号 / 邮箱
            </span>
            <input autoComplete="email" name="account" placeholder="演示版可留空" />
          </label>
          <button className="primary-button" type="submit">
            <LogIn size={17} />
            进入录入
          </button>
          <button className="secondary-button" onClick={onGuest} type="button">
            <ArrowRight size={16} />
            游客体验
          </button>
        </form>
      </section>
    </main>
  );
}

function BirthSetupPage({
  input,
  onBack,
  onChange,
  onReset,
  onSubmit,
}: {
  input: BirthInput;
  onBack: () => void;
  onChange: (input: BirthInput) => void;
  onReset: () => void;
  onSubmit: (input: BirthInput) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      name: String(form.get('name') || input.name),
      gender: String(form.get('gender') || input.gender) as BirthInput['gender'],
      birthDate: String(form.get('birthDate') || input.birthDate),
      birthTime: String(form.get('birthTime') || input.birthTime),
      birthplace: String(form.get('birthplace') || input.birthplace),
    });
  };

  return (
    <main className="flow-shell birth-screen">
      <section className="birth-panel">
        <div className="flow-topbar">
          <button className="icon-text-button" onClick={onBack} type="button">
            <ArrowLeft size={17} />
            返回
          </button>
        </div>

        <div className="birth-heading">
          <p className="eyebrow">第二步 · 建立命盘资料</p>
          <h1>输入出生日期，生成四柱与完整详批。</h1>
          <p>默认使用公历时间。后续接 App 时，这一页可以独立做成资料录入 screen，并扩展真太阳时、农历、出生地经纬度和多档案管理。</p>
        </div>

        <form className="birth-form" id="basic-info" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>
                <UserRound size={15} /> 昵称
              </span>
              <input name="name" value={input.name} onChange={(event) => onChange({ ...input, name: event.target.value })} />
            </label>

            <label>
              <span>
                <Sparkles size={15} /> 性别
              </span>
              <select
                name="gender"
                value={input.gender}
                onChange={(event) => onChange({ ...input, gender: event.target.value as BirthInput['gender'] })}
              >
                <option value="female">女</option>
                <option value="male">男</option>
              </select>
            </label>

            <label>
              <span>
                <CalendarDays size={15} /> 出生日期
              </span>
              <input
                name="birthDate"
                type="date"
                value={input.birthDate}
                onChange={(event) => onChange({ ...input, birthDate: event.target.value })}
              />
            </label>

            <label>
              <span>
                <Clock3 size={15} /> 出生时间
              </span>
              <input
                name="birthTime"
                type="time"
                value={input.birthTime}
                onChange={(event) => onChange({ ...input, birthTime: event.target.value })}
              />
            </label>

            <label className="wide">
              <span>
                <MapPin size={15} /> 出生地
              </span>
              <input
                name="birthplace"
                value={input.birthplace}
                onChange={(event) => onChange({ ...input, birthplace: event.target.value })}
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              <RefreshCw size={17} />
              生成八字排盘分析
            </button>
            <button className="secondary-button" onClick={onReset} type="button">
              <RotateCcw size={16} />
              重置案例
            </button>
          </div>
        </form>
      </section>

      <aside className="birth-aside">
        <strong>可扩展功能口</strong>
        <p>当前由本地 `ReadingPort` 出报告，后续可替换为远程 API、登录会员、订单支付、历史档案和原生 App Bridge。</p>
        <div className="aside-checks">
          <span>真太阳时</span>
          <span>多档案</span>
          <span>报告导出</span>
          <span>AI 详批</span>
        </div>
      </aside>
    </main>
  );
}

function ReportSidebar({
  activeNav,
  onEdit,
  onNavigate,
}: {
  activeNav: NavTarget;
  onEdit: () => void;
  onNavigate: (target: NavTarget) => void;
}) {
  const navItems: Array<{ key: NavTarget; label: string }> = [
    { key: 'paipan', label: '基本排盘' },
    { key: 'professional', label: '专业细盘' },
    { key: 'detail', label: '专业详批' },
    { key: 'luck', label: '大运合参' },
    { key: 'notes', label: '断事笔记' },
  ];

  return (
    <aside className="report-sidebar">
      <div className="sidebar-brand">
        <div className="brand-symbol">自</div>
        <div>
          <strong>自然排盘</strong>
          <span>命盘报告</span>
        </div>
      </div>

      <button className="sidebar-edit" onClick={onEdit} type="button">
        <Edit3 size={16} />
        基本信息
      </button>

      <nav className="sidebar-nav" aria-label="报告导航">
        {navItems.map((item) => (
          <button className={activeNav === item.key ? 'active' : ''} key={item.key} onClick={() => onNavigate(item.key)} type="button">
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default function App() {
  const [input, setInput] = useState(initialInput);
  const [submitted, setSubmitted] = useState(initialInput);
  const [step, setStep] = useState<AppStep>('login');
  const [activeNav, setActiveNav] = useState<NavTarget>('paipan');
  const [note, setNote] = useState(() => window.localStorage.getItem('bazi-web-note') ?? '');
  const [toast, setToast] = useState('');
  const { reading, error } = useMemo(() => createReadingSafely(submitted), [submitted]);
  const paipanRef = useRef<HTMLDivElement>(null);
  const professionalRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const luckRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const scrollTo = (target: NavTarget) => {
    const refs: Record<NavTarget, RefObject<HTMLDivElement | null>> = {
      paipan: paipanRef,
      professional: professionalRef,
      detail: detailRef,
      luck: luckRef,
      notes: notesRef,
    };
    setActiveNav(target);
    refs[target].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copyReport = async () => {
    if (!reading) {
      return;
    }
    const text = buildReportText(reading, note);
    try {
      await navigator.clipboard.writeText(text);
      setToast('已复制自然排盘报告');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      setToast('已复制自然排盘报告');
    }
  };

  const exportReport = () => {
    if (!reading) {
      return;
    }
    const text = buildReportText(reading, note);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reading.input.name || 'bazi'}-自然排盘报告.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setToast('已导出 txt 报告');
  };

  const saveNote = (value: string) => {
    setNote(value);
    window.localStorage.setItem('bazi-web-note', value);
    setToast('断事笔记已保存');
  };

  const resetCase = () => {
    setInput(initialInput);
    setSubmitted(initialInput);
    setToast('已重置为默认案例');
    setActiveNav('paipan');
  };

  if (step === 'login') {
    return (
      <LoginPage
        onChangeName={(name) => setInput((current) => ({ ...current, name }))}
        onGuest={() => {
          setToast('已进入游客体验');
          setStep('birth');
        }}
        onLogin={() => {
          setToast('登录成功，继续录入生辰');
          setStep('birth');
        }}
        profileName={input.name}
      />
    );
  }

  if (step === 'birth') {
    return (
      <>
        <BirthSetupPage
          input={input}
          onBack={() => setStep('login')}
          onChange={setInput}
          onReset={resetCase}
          onSubmit={(nextInput) => {
            setInput(nextInput);
            setSubmitted(nextInput);
            setActiveNav('paipan');
            setStep('report');
            setToast('排盘已生成');
          }}
        />
        {toast && <div className="toast">{toast}</div>}
      </>
    );
  }

  return (
    <main className="report-shell">
      <ReportSidebar activeNav={activeNav} onEdit={() => setStep('birth')} onNavigate={scrollTo} />

      <div className="report-main">
        {error && <div className="error-box">{error}</div>}
        {reading && (
          <>
            <TopProfile
              onCopy={copyReport}
              onEdit={() => setStep('birth')}
              onExport={exportReport}
              reading={reading}
            />
            <div ref={paipanRef}>
              <PaipanSection reading={reading} />
            </div>
            <div ref={professionalRef}>
              <ProfessionalChartPanel reading={reading} />
            </div>
            <div className="detail-stack" ref={detailRef}>
              <PortraitSection reading={reading} />
              <DeepDivePanel reading={reading} />
              <ElementBoard reading={reading} />
              <AdvicePanel reading={reading} />
            </div>
            <div ref={luckRef}>
              <LuckIntegratedPanel reading={reading} />
            </div>
            <div ref={notesRef}>
              <NotesPanel
                note={note}
                onChange={setNote}
                onClear={() => {
                  setNote('');
                  window.localStorage.removeItem('bazi-web-note');
                  setToast('断事笔记已清空');
                }}
                onSave={saveNote}
              />
            </div>

            <p className="disclaimer">以上为基于传统干支模型的结构化参考，不替代医学、法律、财务或人生重大决策建议。</p>
          </>
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>
    </main>
  );
}

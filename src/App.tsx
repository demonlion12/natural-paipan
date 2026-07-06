import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import {
  Activity,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Copy,
  Download,
  Edit3,
  FileText,
  Heart,
  MapPin,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { readingService } from './adapters/readingService';
import type { BaziReading, BirthInput, DeepDomainKey, ReadingSection } from './core/types';

const initialInput: BirthInput = {
  name: '1232',
  gender: 'male',
  birthDate: '1990-01-01',
  birthTime: '00:00',
  birthplace: '未知地 北京时间',
};

const sectionOrder: ReadingSection[] = ['overview', 'career', 'relationship', 'health', 'growth'];
type NavTarget = 'form' | 'paipan' | 'analysis' | 'detail' | 'notes';
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
        <h2>你是这样的人</h2>
        <span>青阳子批语 · 有据有断</span>
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
        <h2>专业深度详批</h2>
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
      <div className="luck-year-grid">
        <article className="luck-card">
          <h3>当前大运详批</h3>
          {reading.deepDive.currentLuck ? (
            <>
              <strong>{reading.deepDive.currentLuck.ganZhi}</strong>
              <p>
                {reading.deepDive.currentLuck.years} · {reading.deepDive.currentLuck.ages}
              </p>
              <p>{reading.deepDive.currentLuck.effect}</p>
              <div className="mini-columns">
                <div>
                  <h4>较利</h4>
                  <ul>
                    {reading.deepDive.currentLuck.bestFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>需防</h4>
                  <ul>
                    {reading.deepDive.currentLuck.caution.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p>当前大运未能定位，请检查出生时间与性别信息。</p>
          )}
        </article>
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
      </div>
    </section>
  );
}

function DaYunTimeline({ reading }: { reading: BaziReading }) {
  return (
    <section className="section">
      <div className="section-title">
        <h2>大运节奏</h2>
        <span>
          {reading.daYun.direction} · {reading.daYun.startText}
        </span>
      </div>
      <div className="timeline">
        {reading.daYun.periods.map((period) => (
          <article className={period.isCurrent ? 'period current' : 'period'} key={`${period.startYear}-${period.ganZhi}`}>
            <strong>{period.ganZhi}</strong>
            <span>
              {period.startYear}-{period.endYear}
            </span>
            <small>
              {period.startAge}-{period.endAge}岁 · 空亡{period.xunKong}
            </small>
          </article>
        ))}
      </div>
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
    '【青阳子批语】',
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
    '【专业深度详批】',
    reading.deepDive.thesis,
    `格局取向：${reading.deepDive.structureName}`,
    `用神：${reading.deepDive.usefulGod}；喜神：${reading.deepDive.favorableGod}；忌神参考：${reading.deepDive.avoidGod}`,
    '',
    deepDomains,
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

function BirthForm({
  input,
  activeNav,
  onChange,
  onNavigate,
  onReset,
  onSubmit,
}: {
  input: BirthInput;
  activeNav: NavTarget;
  onChange: (input: BirthInput) => void;
  onNavigate: (target: NavTarget) => void;
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
    <form className="control-panel" id="basic-info" onSubmit={handleSubmit}>
      <div className="side-logo">自然排盘</div>
      <nav className="side-nav" aria-label="排盘导航">
        <button className={activeNav === 'form' ? 'active' : ''} onClick={() => onNavigate('form')} type="button">
          基本信息
        </button>
        <button className={activeNav === 'paipan' ? 'active' : ''} onClick={() => onNavigate('paipan')} type="button">
          基本排盘
        </button>
        <button className={activeNav === 'analysis' ? 'active' : ''} onClick={() => onNavigate('analysis')} type="button">
          青阳子批
        </button>
        <button className={activeNav === 'detail' ? 'active' : ''} onClick={() => onNavigate('detail')} type="button">
          专业细盘
        </button>
        <button className={activeNav === 'notes' ? 'active' : ''} onClick={() => onNavigate('notes')} type="button">
          断事笔记
        </button>
      </nav>

      <div className="brand-mark">
        <div className="seal">知</div>
        <div>
          <h1>自然排盘</h1>
          <p>八字 · 五行 · 大运 · 建议</p>
        </div>
      </div>

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

      <button className="primary-button" type="submit">
        <RefreshCw size={17} />
        生成排盘
      </button>
      <button className="secondary-button" onClick={onReset} type="button">
        <RotateCcw size={16} />
        重置案例
      </button>

      <div className="app-port">
        <strong>App 架构口</strong>
        <p>当前使用本地排盘服务，后续可把 `ReadingPort` 切换为远程 API、会员报告或原生 App Bridge。</p>
      </div>
    </form>
  );
}

export default function App() {
  const [input, setInput] = useState(initialInput);
  const [submitted, setSubmitted] = useState(initialInput);
  const [activeNav, setActiveNav] = useState<NavTarget>('paipan');
  const [note, setNote] = useState(() => window.localStorage.getItem('bazi-web-note') ?? '');
  const [toast, setToast] = useState('');
  const { reading, error } = useMemo(() => createReadingSafely(submitted), [submitted]);
  const formRef = useRef<HTMLDivElement>(null);
  const paipanRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
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
      form: formRef,
      paipan: paipanRef,
      analysis: analysisRef,
      detail: detailRef,
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
    scrollTo('paipan');
  };

  return (
    <main className="app-shell">
      <div ref={formRef}>
        <BirthForm
          activeNav={activeNav}
          input={input}
          onChange={setInput}
          onNavigate={scrollTo}
          onReset={resetCase}
          onSubmit={(nextInput) => {
            setInput(nextInput);
            setSubmitted(nextInput);
            setToast('排盘已更新');
            scrollTo('paipan');
          }}
        />
      </div>

      <div className="report-panel">
        {error && <div className="error-box">{error}</div>}
        {reading && (
          <>
            <TopProfile
              onCopy={copyReport}
              onEdit={() => scrollTo('form')}
              onExport={exportReport}
              reading={reading}
            />
            <div ref={paipanRef}>
              <PaipanSection reading={reading} />
            </div>
            <div ref={analysisRef}>
              <PortraitSection reading={reading} />
            </div>
            <div className="detail-stack" ref={detailRef}>
              <DeepDivePanel reading={reading} />
              <ElementBoard reading={reading} />
              <AdvicePanel reading={reading} />
              <DaYunTimeline reading={reading} />
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

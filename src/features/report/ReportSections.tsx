import type { RefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ClassicKey, DiagramTab, classicTabs, deepDomainOrder, elementCycleOrder } from '../../appConfig';
import { getFlowDays, getSolarTermMonths } from '../../core/solarTerms';
import type { BaziReading, DeepDomainKey, ElementName, Pillar } from '../../core/types';
import {
  Copy,
  Download,
  Edit3
} from '../../icons';

import { advanceGanZhi, branchElement, branchRelations, collectPairNotes, combinePairs, createVirtualColumn, describeLuckPeriod, elementControlledBy, elementControls, elementGenerates, elementIcon, elementRemedyGuide, getElementRelation, getPairRelations, getShenShaForBranch, getStemBranchRelation, getTenGod, kinshipByTenGod, palaceMeanings, seasonProfileByBranch, stemElement, stemPolarity } from '../../core/interpretation';
export function GanZhiGlyph({ value, type }: { value: string; type: 'stem' | 'branch' }) {
  const element = type === 'stem' ? stemElement[value] : branchElement[value];

  return (
    <span className={`gz-glyph gz-${element}`}>
      {value}
      <small>{elementIcon[element]}</small>
    </span>
  );
}

export function TopProfile({
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
        <span>排盘时刻：{reading.solarText}</span>
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
      <div className="profile-facts" aria-label="命盘基础坐标">
        <div><span>性别</span><strong>{reading.input.gender === 'male' ? '男' : '女'}</strong></div>
        <div><span>生肖</span><strong>{reading.zodiac}</strong></div>
        <div><span>出生地</span><strong>{reading.input.birthplace || '未填写'}</strong></div>
        <div><span>日主</span><strong>{reading.dayMaster.stem} · {reading.dayMaster.polarity}{reading.dayMaster.element}</strong></div>
        <div><span>胎元</span><strong>{reading.structure.taiYuan}</strong></div>
        <div><span>命宫</span><strong>{reading.structure.mingGong}</strong></div>
        <div><span>身宫</span><strong>{reading.structure.shenGong}</strong></div>
        <div><span>起运</span><strong>{reading.daYun.startText} · {reading.daYun.direction}</strong></div>
      </div>
      <div className="calculation-audit" aria-label="排盘时间校正依据">
        <div><span>计算版本</span><strong>{reading.calculation.version}</strong></div>
        <div><span>原始输入</span><strong>{reading.calculation.originalText}</strong></div>
        <div><span>公历转换</span><strong>{reading.calculation.convertedSolarText}</strong></div>
        <div><span>排盘采用</span><strong>{reading.calculation.effectiveSolarText}</strong></div>
        <div><span>校正明细</span><strong>经度 {reading.calculation.longitudeCorrectionMinutes >= 0 ? '+' : ''}{reading.calculation.longitudeCorrectionMinutes}分 · 均时差 {reading.calculation.equationOfTimeMinutes >= 0 ? '+' : ''}{reading.calculation.equationOfTimeMinutes}分 · 夏令时 {reading.calculation.daylightSavingMinutes}分</strong></div>
        <div><span>换日规则</span><strong>{reading.calculation.dayBoundaryText}</strong></div>
        <div><span>时间可信度</span><strong>{reading.calculation.reliabilityText}</strong></div>
      </div>
      {reading.calculation.warnings.length > 0 && <div className="calculation-warnings">{reading.calculation.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
    </section>
  );
}

export function AncientReference({ reading }: { reading: BaziReading }) {
  const dayStem = reading.dayMaster.stem;
  const monthBranch = reading.pillars[1].branch;
  const recommendedClassic: ClassicKey = dayStem === '丙' && monthBranch === '子' ? 'qiongtong' : 'ditiansui';
  const [activeClassic, setActiveClassic] = useState<ClassicKey>(recommendedClassic);
  const [showReasoning, setShowReasoning] = useState(true);
  const visibleStems = reading.pillars.map((pillar) => pillar.stem).join('、');
  const hiddenStems = [...new Set(reading.pillars.flatMap((pillar) => pillar.hiddenStems))].join('、');
  const useful = reading.usefulElements.join('、');
  const dominant = reading.structure.dominantElement;
  const missing = reading.structure.missingElements.join('、') || '五行不见明显缺口';

  useEffect(() => {
    setActiveClassic(recommendedClassic);
    setShowReasoning(true);
  }, [dayStem, monthBranch, recommendedClassic]);

  const classicContent: Record<
    ClassicKey,
    {
      quote: string;
      source: string;
      chapter: string;
      sourceUrl?: string;
      status: '已校勘短引' | '待校勘短引';
      relevance: string;
      interpretation: string[];
    }
  > = {
    qiongtong: {
      quote: '十一月丙火，冬至一阳生，弱中复强。',
      source: '《穷通宝鉴》',
      chapter: '论丙火，子月条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E7%AA%AE%E9%80%9A%E5%AF%B6%E9%91%91',
      status: dayStem === '丙' && monthBranch === '子' ? '已校勘短引' : '待校勘短引',
      relevance:
        dayStem === '丙' && monthBranch === '子'
          ? '当前命盘为丙日、子月，此条可作为调候参考。'
          : `当前命盘为${dayStem}日、${monthBranch}月；本条先作为“按日主月令取调候”的方法示例，后续可接入完整日主月令原文库。`,
      interpretation: [
        `${monthBranch}月论命，先看月令寒暖燥湿，再看日主是否得令、得地、得助。此局日主为${dayStem}，${reading.dayMaster.strength}，不可只按五行数量取断，仍须合看月令、藏干与十神透出。`,
        `从盘面看，${dominant}气较显，${missing}为后天需调之处。若行运能引动${useful}，多主思路顺、资源顺、做事阻力减；若再逢耗泄太过，则宜守中取势，不宜强拧。`,
      ],
    },
    ditiansui: {
      quote: '欲识三元万法宗，先观帝载与神功。',
      source: '《滴天髓》',
      chapter: '通神论',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E6%BB%B4%E5%A4%A9%E9%AB%93',
      status: '已校勘短引',
      relevance: `此条强调先看全局气势。当前命盘${dominant}气较显，喜用取${useful}，正适合从“气势是否流通”切入。`,
      interpretation: [
        `此局要点在“气势是否能流通”。${dominant}显则是天赋与惯性，若只旺而不通，现实中容易表现为某类反应过度；若能以${useful}疏导，则才气、判断和执行更容易落地。`,
        `看命不可见一字便断吉凶。年、月、日、时四柱需合看：年看根基，月看令气，日看自身，时看后劲。此局时柱为${reading.pillars[3].ganZhi}，后期更重能力沉淀。`,
      ],
    },
    sanming: {
      quote: '凡看命，以日干为主。',
      source: '《三命通会》',
      chapter: '论命总法相关条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83',
      status: '待校勘短引',
      relevance: `当前日主为${dayStem}，专业详批里所有十神、喜忌、岁运触发都应回到日主承受力来判断。`,
      interpretation: [
        `十神较显者为${reading.structure.highlightedTenGods.join('、') || '结构分散'}。这些不是标签，而是你在现实事务中的角色：有的主资源，有的主规则，有的主表达，有的主竞争。`,
        `格局有成有破，不宜强行套一个名称。若大运配合，优势能成事；若岁运冲动短板，则容易在人情、节奏、资源或规则上出现压力。`,
      ],
    },
    tiyao: {
      quote: '论命以日主为体，月令为提纲。',
      source: '《八字提要》',
      chapter: '定局提要',
      status: '待校勘短引',
      relevance: `当前命盘为${dayStem}日、${monthBranch}月，此条用于提示“先定日主，再看月令”的阅读顺序。`,
      interpretation: [
        `定盘简要：日主${dayStem}，生于${monthBranch}月，整体${reading.dayMaster.strength}。喜用偏向${useful}，忌一味加重${dominant}之偏。`,
        `现实落点：重要选择宜先问三件事：是否补足用神，是否减少内耗，是否能沉淀长期能力。若三者皆无，则短期热闹未必值得投入。`,
      ],
    },
    ziping: {
      quote: '八字用神，专求月令。',
      source: '《子平真诠》',
      chapter: '论用神',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE',
      status: '已校勘短引',
      relevance: `当前月柱为${reading.pillars[1].ganZhi}，月令决定气候和格局入口，所以不能只看日柱或单个神煞。`,
      interpretation: [
        `月柱${reading.pillars[1].ganZhi}为提纲，提纲定一局气候。此处要看${reading.pillars[1].stemTenGod}与藏干${reading.pillars[1].hiddenStems.join('、')}如何作用于日主。`,
        `若格局清，则事有主线；若混杂，则人生常需先筛选方向。你的盘面更适合把复杂机会收束成一条主线，不宜什么都抓。`,
      ],
    },
    yuanhai: {
      quote: '子平一法，专以日干为主。',
      source: '《渊海子平》',
      chapter: '论日为主',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3',
      status: '待校勘短引',
      relevance: `当前日主${dayStem}是十神换算的中心，财官印食伤都要看它与日主的关系，不宜单独贴标签。`,
      interpretation: [
        `此盘以日主${dayStem}为核心，先看月令${monthBranch}所主之气，再看透干${visibleStems}是否成局。若十神有情，则现实中做事有章法；若互相牵制，则容易一边想推进，一边被关系、资源或规则拖住。`,
        `从子平法看，${reading.structure.highlightedTenGods.join('、') || '十神分布较散'}为较醒目的事务角色。它们会具体落在工作分工、合作方式、财务节奏和人际边界上。`,
      ],
    },
    tianyuan: {
      quote: '甲己之年丙作首，乙庚之岁戊为头。',
      source: '《天元巫咸经》',
      chapter: '五虎遁月法相关条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E5%A4%A9%E5%85%83%E5%B7%AB%E5%92%B8%E7%B6%93',
      status: '待校勘短引',
      relevance: `此条偏向干支排布法。当前盘面透${visibleStems}，用于说明天干不是装饰，而是外显能力与岁运触发入口。`,
      interpretation: [
        `天干为外显之气，此局透${visibleStems}，说明外在表现不只看性格，还看机会来时你会先动用哪一类能力。${dayStem}日主遇${monthBranch}月，宜先定主气，再分清扶抑。`,
        `若岁运再引动${useful}，做事容易从“想明白”走到“做成形”；若岁运加重${dominant}之偏，则要防止判断过满、节奏过急或对单一方向投入过深。`,
      ],
    },
    shenfeng: {
      quote: '有病方为贵，无伤不是奇。',
      source: '《神峰通考》',
      chapter: '病药说相关条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E7%A5%9E%E5%B3%B0%E9%80%9A%E8%80%83',
      status: '已校勘短引',
      relevance: `当前命盘${dominant}较显，${missing}；从病药法看，重点不是说好坏，而是找失衡处与可调之物。`,
      interpretation: [
        `此局之“病”不必理解为坏，而是命局里最容易失衡的地方。${dominant}显，是优势也是惯性；${missing}，则是现实中需要后天经营的功课。`,
        `取“药”宜看${useful}。在选择行业、合作方式和长期方向时，凡能补${useful}、缓${dominant}之偏者，多半更利沉淀；反之，短期虽热，长期容易内耗。`,
      ],
    },
    qianli: {
      quote: '看命先看日主强弱。',
      source: '《千里命稿》',
      chapter: '强弱篇相关条',
      status: '待校勘短引',
      relevance: `当前日主判为${reading.dayMaster.strength}，这会影响事业、财务、关系建议是偏进取还是偏蓄势。`,
      interpretation: [
        `以现代应用看，此局不是单看旺弱，而要看“能力如何变现”。${reading.dayMaster.strength}时，行事最怕只凭情绪或短线反馈；能建立稳定节奏，优势更容易兑现。`,
        `事业上宜把${reading.structure.highlightedTenGods.slice(0, 3).join('、') || '主要十神'}对应的能力做成可复用方法。关系和财务上，则要用规则感降低反复消耗。`,
      ],
    },
    wuxing: {
      quote: '五行者，金木水火土也。',
      source: '《五行精纪》',
      chapter: '论五行',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80',
      status: '待校勘短引',
      relevance: `当前五行以${dominant}较显，喜用${useful}。此条提示五行分析要落到生克循环，不只是百分比。`,
      interpretation: [
        `五行以${dominant}较显，${missing}为调候与平衡处。旺者不一定全吉，弱者不一定全凶，关键在生克是否形成通路。`,
        `若能以${useful}引通，则才华、资源与执行之间更顺；若一处太旺而无泄无制，现实中容易表现为执着、反复、急躁或长期疲惫。`,
      ],
    },
    lixu: {
      quote: '年为本，日为主。',
      source: '《李虚中命书》',
      chapter: '命书总论相关条',
      sourceUrl: 'https://zh.wikisource.org/wiki/%E6%9D%8E%E8%99%9B%E4%B8%AD%E5%91%BD%E6%9B%B8',
      status: '待校勘短引',
      relevance: `当前年柱${reading.pillars[0].ganZhi}看根基，日柱${reading.pillars[2].ganZhi}看自身承载，二者要合看。`,
      interpretation: [
        `年柱${reading.pillars[0].ganZhi}为根基气，月柱${reading.pillars[1].ganZhi}为成长环境与行事底色。早年受环境、规则、资源配置影响较明显，但真正成事仍要看日时与运势承接。`,
        `此局后劲要看时柱${reading.pillars[3].ganZhi}与大运配合。若阶段运能补${useful}，后期越能靠经验、专业和稳定输出打开空间。`,
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
        <section className="classic-source-card">
          <div className="classic-source-meta">
            <span>古籍原文</span>
            <strong>{currentClassic.source}</strong>
            <em>{currentClassic.chapter}</em>
            <small>{currentClassic.status}{activeClassic === recommendedClassic ? ' · 本盘优先' : ''}</small>
          </div>
          <blockquote>{currentClassic.quote}</blockquote>
          {currentClassic.sourceUrl && (
            <a className="classic-source-link" href={currentClassic.sourceUrl} rel="noreferrer" target="_blank">
              查看文本来源
            </a>
          )}
        </section>
        <p>
          本八字：透 <mark>{visibleStems}</mark>，藏 <mark>{hiddenStems}</mark>
        </p>
        <section className="classic-interpretation">
          <h3>现代解读</h3>
          <p className="classic-hint">{currentClassic.relevance}</p>
        </section>
        <button className="classic-pill" onClick={() => setShowReasoning((value) => !value)} type="button">
          {showReasoning ? '收起现代解读' : `展开论${dayStem}生${monthBranch}月`}
        </button>
        {showReasoning && currentClassic.interpretation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p>
          原文短引用于定位经典论法，现代解读为系统根据当前命盘转译，并非绝对断语。命局定底色，大运定阶段，流年定触发，现实选择才定落点。
        </p>
      </div>
    </article>
  );
}

export function getStrengthEvidence(reading: BaziReading) {
  const dayElement = reading.dayMaster.element;
  const motherElement = (Object.keys(elementGenerates) as ElementName[]).find((element) => elementGenerates[element] === dayElement) ?? dayElement;
  const outputElement = elementGenerates[dayElement];
  const wealthElement = elementControls[dayElement];
  const officerElement = elementControlledBy[dayElement];
  const monthPillar = reading.pillars[1];
  const monthMainStem = monthPillar.hiddenStems[0];
  const monthMainElement = stemElement[monthMainStem] as ElementName;
  const ratioOf = (elements: ElementName[]) => Math.round(reading.elementScores.filter((score) => elements.includes(score.element)).reduce((sum, score) => sum + score.ratio, 0) * 100);
  const locationsFor = (elements: ElementName[]) => reading.pillars.flatMap((pillar) => [
    ...(elements.includes(stemElement[pillar.stem] as ElementName) ? [`${pillar.label}${pillar.stem}透`] : []),
    ...pillar.hiddenStems.flatMap((stem, index) => elements.includes(stemElement[stem] as ElementName) ? [`${pillar.label}${pillar.branch}藏${stem}${index === 0 ? '本气' : index === 1 ? '中气' : '余气'}`] : []),
  ]);
  const roots = reading.pillars.flatMap((pillar) => pillar.hiddenStems.flatMap((stem, index) => stemElement[stem] === dayElement ? [`${pillar.label}${pillar.branch}藏${stem}${index === 0 ? '本根' : index === 1 ? '中根' : '余根'}`] : []));
  const supportLocations = locationsFor([dayElement, motherElement]);
  const pressureLocations = locationsFor([outputElement, wealthElement, officerElement]);
  return {
    month: {
      title: '月令司气',
      value: `${monthPillar.branch}${branchElement[monthPillar.branch]} · ${seasonProfileByBranch[monthPillar.branch].season}`,
      detail: `月令本气${monthMainStem}${monthMainElement}，对${dayElement}日主形成“${getElementRelation(monthMainElement, dayElement)}”的季节作用。${seasonProfileByBranch[monthPillar.branch].climate}。`,
    },
    roots: {
      title: '得地通根',
      value: roots.length ? `${roots.length} 处根气` : '原局无同类根',
      detail: roots.length ? roots.join('；') : `四支藏干未见${dayElement}同类，日主承载更依赖${motherElement}印星与岁运补助。`,
    },
    support: {
      title: '生扶力量',
      value: `${ratioOf([dayElement, motherElement])}% 结构占比`,
      detail: supportLocations.length ? supportLocations.join('；') : `原局未见明显${dayElement}比劫与${motherElement}印星来源。`,
    },
    pressure: {
      title: '克泄耗力量',
      value: `${ratioOf([outputElement, wealthElement, officerElement])}% 结构占比`,
      detail: pressureLocations.length ? pressureLocations.join('；') : '食伤、财星、官杀在原局显性与根气均不突出。',
    },
    supportRatio: ratioOf([dayElement, motherElement]),
  };
}

export function getPillarRelationNotes(reading: BaziReading, pillar: Pillar) {
  return reading.pillars.filter((other) => other.key !== pillar.key).flatMap((other) => {
    const stemLinks = getPairRelations(pillar.stem, other.stem, combinePairs).map((relation) => `${pillar.label}与${other.label}天干：${relation}`);
    const branchLinks = getPairRelations(pillar.branch, other.branch, branchRelations).map((relation) => `${pillar.label}与${other.label}地支：${relation}`);
    const repeated = pillar.branch === other.branch ? [`${pillar.label}与${other.label}地支同见${pillar.branch}，主题有伏吟与重复倾向`] : [];
    return [...stemLinks, ...branchLinks, ...repeated];
  });
}

export function PaipanSection({ reading, elementRef }: { reading: BaziReading; elementRef: RefObject<HTMLDivElement | null> }) {
  const stemNotes = collectPairNotes(reading.pillars.map((pillar) => pillar.stem), combinePairs, '无合冲关系');
  const branchNotes = collectPairNotes(reading.pillars.map((pillar) => pillar.branch), branchRelations, '未见明显冲合刑害');
  const strengthEvidence = getStrengthEvidence(reading);
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
    { label: '自坐', render: (pillar: BaziReading['pillars'][number]) => <span>{pillar.selfDiShi}</span> },
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
      <div className="paipan-core-strip">
        <div><span>日主</span><strong>{reading.dayMaster.stem} · {reading.dayMaster.polarity}{reading.dayMaster.element}</strong><small>{reading.input.unknownHour ? '旺衰待定' : reading.dayMaster.strength}</small></div>
        <div><span>月令</span><strong>{reading.pillars[1].branch} · {seasonProfileByBranch[reading.pillars[1].branch].season}</strong><small>{seasonProfileByBranch[reading.pillars[1].branch].climate}</small></div>
        <div><span>结构</span><strong>{reading.deepDive.structureName}</strong><small>显神：{reading.structure.highlightedTenGods.join('、') || '分布较散'}</small></div>
        <div><span>喜用</span><strong>{reading.input.unknownHour ? '待定' : reading.usefulElements.join('、')}</strong><small>调候：{reading.input.unknownHour ? '时辰待补全' : seasonProfileByBranch[reading.pillars[1].branch].adjustment.join('、')}</small></div>
      </div>
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
                    {pillar.known === false ? <span>待定</span> : row.render(pillar)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </article>
        <div ref={elementRef}>
          <ElementBoard reading={reading} compact />
        </div>
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
      {!reading.input.unknownHour && <><section className="strength-evidence-section">
        <div className="paipan-subhead">
          <div><span>强弱不是数个数</span><h2>旺衰判定依据</h2></div>
          <p>结论：{reading.dayMaster.strength}。依次检查月令、通根、生扶与克泄耗，再用岁运和现实经历复核。</p>
        </div>
        <div className="strength-balance">
          <div><span>生扶侧 {strengthEvidence.supportRatio}%</span><span>克泄耗侧 {100 - strengthEvidence.supportRatio}%</span></div>
          <div className="strength-track"><span style={{ width: `${strengthEvidence.supportRatio}%` }} /></div>
        </div>
        <div className="strength-evidence-grid">
          {[strengthEvidence.month, strengthEvidence.roots, strengthEvidence.support, strengthEvidence.pressure].map((evidence, index) => (
            <article key={evidence.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{evidence.title}</h3>
              <strong>{evidence.value}</strong>
              <p>{evidence.detail}</p>
            </article>
          ))}
        </div>
        <p className="method-disclaimer">结构占比来自天干、藏干层级与月令加权，用于展示证据方向，不等同于传统典籍中的唯一旺衰标准；边界命局仍需结合格局、合化和岁运回测。</p>
      </section>
      <section className="pillar-detail-section">
        <div className="paipan-subhead">
          <div><span>从一柱看一层人生坐标</span><h2>四柱逐柱信息</h2></div>
          <p>每柱同时看天干外显、地支根基、宫位时间，以及它与其余三柱形成的关系。</p>
        </div>
        <div className="pillar-detail-grid">
          {reading.pillars.map((pillar, pillarIndex) => {
            const palace = palaceMeanings[pillar.key];
            const relations = getPillarRelationNotes(reading, pillar);
            const stars = getShenShaForBranch(reading, pillar.stem, pillar.branch);
            return (
              <article className="pillar-detail-card" key={pillar.key}>
                <header>
                  <span>{String(pillarIndex + 1).padStart(2, '0')}</span>
                  <div><h3>{pillar.label} · {palace.title}</h3><small>{palace.time} · {palace.space}</small></div>
                  <strong>{pillar.ganZhi}</strong>
                </header>
                <div className="pillar-detail-glyphs">
                  <div><small>{pillar.stemTenGod}</small><GanZhiGlyph value={pillar.stem} type="stem" /><span>{stemPolarity[pillar.stem]}{stemElement[pillar.stem]}</span></div>
                  <div><small>地支根基</small><GanZhiGlyph value={pillar.branch} type="branch" /><span>{branchElement[pillar.branch]} · {getStemBranchRelation(pillar.stem, pillar.branch)}</span></div>
                </div>
                <div className="hidden-stem-list">
                  {pillar.hiddenStems.map((stem, index) => <div key={stem}><span>{index === 0 ? '本气' : index === 1 ? '中气' : '余气'}</span><strong>{stem}{stemElement[stem]}</strong><small>{pillar.branchTenGods[index]}</small></div>)}
                </div>
                <dl>
                  <div><dt>星运</dt><dd>{pillar.diShi}</dd></div>
                  <div><dt>自坐</dt><dd>{pillar.selfDiShi}</dd></div>
                  <div><dt>纳音</dt><dd>{pillar.naYin}</dd></div>
                  <div><dt>空亡</dt><dd>{pillar.xunKong}</dd></div>
                </dl>
                <div className="pillar-star-list"><strong>神煞</strong><div>{stars.length ? stars.map((star) => <span key={star}>{star}</span>) : <span>未见主要神煞</span>}</div></div>
                <div className="pillar-relation-list"><strong>柱间关系</strong>{relations.length ? relations.map((relation) => <p key={relation}>{relation}</p>) : <p>与其余三柱未见主要天干五合、地支冲合刑害。</p>}</div>
              </article>
            );
          })}
        </div>
      </section></>}
    </section>
  );
}

export function ProfessionalChartPanel({ reading }: { reading: BaziReading }) {
  const currentYear = reading.annual.year;
  const flowColumnCount = 12;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => {
    const instant = Date.parse(reading.calculation.asOf ?? reading.generatedAt);
    return Math.max(0, getSolarTermMonths(currentYear).findIndex(month => instant >= month.start && instant < month.end));
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const currentLuck =
    reading.daYun.periods.find((period) => selectedYear >= period.startYear && selectedYear <= period.endYear) ??
    reading.daYun.periods.find((period) => period.isCurrent) ??
    reading.daYun.periods[0];
  const currentYearGanZhi =
    reading.annual.year === selectedYear ? reading.annual.ganZhi : advanceGanZhi(reading.annual.ganZhi, selectedYear - reading.annual.year);
  const displayedLuckPeriods = Array.from({ length: flowColumnCount }, (_, index) => reading.daYun.periods[index] ?? null);
  const nextYears = Array.from({ length: flowColumnCount }, (_, index) => {
    const year = currentLuck.startYear + index;
    return {
      year,
      ganZhi: advanceGanZhi(currentYearGanZhi, year - selectedYear),
    };
  });
  const flowMonths = useMemo(() => getSolarTermMonths(selectedYear), [selectedYear]);
  const flowDays = useMemo(() => getFlowDays(flowMonths[selectedMonthIndex]), [flowMonths, selectedMonthIndex]);
  useEffect(() => { setSelectedDayIndex(0); }, [selectedMonthIndex, selectedYear]);

  const currentMonth = flowMonths[selectedMonthIndex];
  const currentDay = flowDays[selectedDayIndex] ?? flowDays[0] ?? { label: '载入中', dateText: '', ganZhi: currentYearGanZhi };
  const detailColumns = [
    createVirtualColumn('流日', currentDay.ganZhi, reading),
    createVirtualColumn('流月', currentMonth.ganZhi, reading),
    createVirtualColumn('流年', currentYearGanZhi, reading),
    createVirtualColumn('大运', currentLuck.ganZhi, reading),
    ...reading.pillars.map((pillar) => ({
      ...pillar,
      shenSha: getShenShaForBranch(reading, pillar.stem, pillar.branch),
    })),
  ];
  const stemNotes = collectPairNotes(detailColumns.map((column) => column.stem), combinePairs, '天干暂未见明显合化，重点看十神与五行补偏。');
  const branchNotes = collectPairNotes(detailColumns.map((column) => column.branch), branchRelations, '地支暂未见明显冲合刑害，重点看岁运是否引动原局。');
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
    { label: '自坐', render: (column: typeof detailColumns[number]) => <span>{column.selfDiShi}</span> },
    { label: '空亡', render: (column: typeof detailColumns[number]) => <span>{column.xunKong}</span> },
    { label: '纳音', render: (column: typeof detailColumns[number]) => <span>{column.naYin}</span> },
    { label: '神煞', render: (column: typeof detailColumns[number]) => <span className="stacked-text shensha-text">{column.shenSha.join('\n') || '-'}</span> },
  ];

  return (
    <section className="section professional-chart-section">
      <div className="section-title">
        <h2>专业细盘</h2>
        <div className="professional-title-actions">
          <span>
            {selectedYear}流年 · {currentMonth.ganZhi}流月 · {currentDay.ganZhi}流日 · {currentLuck.ganZhi}大运
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
            <small>日主：{reading.dayMaster.stem} · 点击大运 / 流年 / 流月 / 流日切换</small>
          </div>
          <p className="flow-term-range">本月交节：{currentMonth.startText} 至 {currentMonth.endText}（北京时间）；首尾交节日按实际时刻分属两月。</p>

          <div className="flow-stack">
            <div className="flow-matrix">
              <div className="flow-label">大运</div>
              {displayedLuckPeriods.map((period, index) =>
                period ? (
                  <button
                    type="button"
                    className={period.startYear === currentLuck.startYear ? 'flow-cell current' : 'flow-cell'}
                    key={`${period.startYear}-${period.ganZhi}`}
                    disabled={period.startYear < 1900 || period.startYear > 2100}
                    title={period.startYear > 2100 ? '岁运细盘支持至 2100 年' : undefined}
                    onClick={() => {
                      setSelectedYear(period.startYear);
                      setSelectedMonthIndex(0);
                      setSelectedDayIndex(0);
                    }}
                    aria-label={`切换到${period.startYear}年开始的${period.ganZhi}大运`}
                  >
                    <small>{period.startYear}</small>
                    <strong>{period.ganZhi}</strong>
                    <span>{getTenGod(reading.dayMaster.stem, period.ganZhi[0])}</span>
                  </button>
                ) : (
                  <div className="flow-cell" key={`luck-empty-${index}`}>
                    <span>-</span>
                  </div>
                )
              )}

              <div className="flow-label">流年</div>
              {nextYears.map((year) => (
                <button
                  type="button"
                  className={year.year === selectedYear ? 'flow-cell current' : 'flow-cell'}
                  key={year.year}
                  disabled={year.year < 1900 || year.year > 2100}
                  title={year.year > 2100 ? '岁运细盘支持至 2100 年' : undefined}
                  onClick={() => {
                    setSelectedYear(year.year);
                    setSelectedDayIndex(0);
                  }}
                  aria-label={`切换到${year.year}流年`}
                >
                  <small>{year.year}</small>
                  <strong>{year.ganZhi}</strong>
                  <span>{getTenGod(reading.dayMaster.stem, year.ganZhi[0])}</span>
                </button>
              ))}
            </div>

            <div className="flow-strip">
              <div className="flow-label">流月</div>
              <div className="flow-scroll" aria-label="流月横向列表">
                {flowMonths.map((month, index) => (
                  <button
                    type="button"
                    className={index === selectedMonthIndex ? 'flow-cell current' : 'flow-cell'}
                    key={`${month.term}-${month.ganZhi}`}
                    title={`${month.startText} 至 ${month.endText}（北京时间）`}
                    onClick={() => {
                      setSelectedMonthIndex(index);
                      setSelectedDayIndex(0);
                    }}
                    aria-label={`切换到${month.term}${month.ganZhi}流月`}
                  >
                    <small>{month.term}</small>
                    <small>{month.startText.slice(5, 10)}</small>
                    <strong>{month.ganZhi}</strong>
                    <span>{getTenGod(reading.dayMaster.stem, month.ganZhi[0])}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flow-strip">
              <div className="flow-label">流日</div>
              <div className="flow-scroll day-scroll" aria-label="流日横向列表">
                {flowDays.map((day, index) => (
                  <button
                    type="button"
                    className={index === selectedDayIndex ? 'flow-cell current' : 'flow-cell'}
                    key={`${day.dateText}-${day.ganZhi}`}
                    onClick={() => setSelectedDayIndex(index)}
                    aria-label={`切换到${day.dateText}${day.ganZhi}流日`}
                  >
                    <small>
                      {day.label}
                      <br />
                      {day.dateText}
                    </small>
                    <strong>{day.ganZhi}</strong>
                    <span>{getTenGod(reading.dayMaster.stem, day.ganZhi[0])}</span>
                  </button>
                ))}
              </div>
            </div>
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

export function ElementBoard({ reading, compact = false }: { reading: BaziReading; compact?: boolean }) {
  const elementScoresByCycle = elementCycleOrder
    .map((element) => reading.elementScores.find((item) => item.element === element))
    .filter((item): item is BaziReading['elementScores'][number] => Boolean(item));

  return (
    <section className={compact ? 'section element-section compact' : 'section element-section'}>
      <div className="section-title">
        <h2>五行气势</h2>
        <span>{reading.input.unknownHour ? '三柱统计 · 喜用待定' : `喜用 ${reading.usefulElements.join('、')}`}</span>
      </div>
      <div className="element-board">
        <div className="wheel" aria-label="五行盘">
          {elementScoresByCycle.map((item, index) => (
            <div className={`wheel-item wheel-${item.element}`} key={item.element} style={{ rotate: `${index * 72}deg` }}>
              <span style={{ rotate: `${-index * 72}deg` }}>{item.element}</span>
            </div>
          ))}
          <div className="wheel-center">
            <strong>{reading.dayMaster.stem}</strong>
            <span>{reading.input.unknownHour ? '待补时辰' : reading.dayMaster.strength}</span>
          </div>
        </div>
        <div className="element-bars">
          {elementScoresByCycle.map((item) => (
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

export function UsefulAndTiaohouPanel({ reading }: { reading: BaziReading }) {
  const dayElement = reading.dayMaster.element;
  const dayStrength = reading.dayMaster.strength;
  const monthBranch = reading.pillars[1].branch;
  const monthProfile = seasonProfileByBranch[monthBranch];
  const usefulPrimary = reading.usefulElements[0];
  const usefulSecondary = reading.usefulElements[1] ?? elementGenerates[usefulPrimary];
  const avoidElements = reading.elementScores
    .filter((item) => item.tone === '偏旺' && !reading.usefulElements.includes(item.element))
    .map((item) => item.element);
  const weakElements = reading.elementScores.filter((item) => item.tone === '不足').map((item) => item.element);
  const visibleUseful = reading.pillars
    .flatMap((pillar) => [pillar.stem, pillar.branch])
    .filter((value) => reading.usefulElements.includes((stemElement[value] ?? branchElement[value]) as ElementName));
  const supportElement = dayStrength === '偏弱' ? dayElement : elementGenerates[dayElement];
  const controlElement = elementControlledBy[dayElement];
  const drainElement = elementGenerates[dayElement];
  const wealthElement = elementControls[dayElement];
  const tiaohouHits = monthProfile.adjustment.filter((element) => reading.usefulElements.includes(element));
  const tensionElements = monthProfile.adjustment.filter((element) => !reading.usefulElements.includes(element));
  const scoreOf = (element: ElementName) => Math.round((reading.elementScores.find((item) => item.element === element)?.ratio ?? 0) * 100);
  const fireScore = scoreOf('火');
  const waterScore = scoreOf('水');
  const earthScore = scoreOf('土');
  const metalScore = scoreOf('金');
  const thermalBalance = `火约${fireScore}%，水约${waterScore}%`;
  const moistureBalance = `土约${earthScore}%，水约${waterScore}%，金约${metalScore}%`;
  const isColdSeason = ['亥', '子', '丑'].includes(monthBranch);
  const isHotSeason = ['巳', '午', '未'].includes(monthBranch);
  const isWetSeason = ['亥', '子', '丑', '辰'].includes(monthBranch);
  const isDrySeason = ['巳', '午', '未', '申', '酉', '戌'].includes(monthBranch);
  const thermalDiagnosis =
    isColdSeason && fireScore >= 28
      ? `月令仍以寒论，但原局火约${fireScore}%，已经有解冻和发用的条件。重点是让火稳定、持续、有承接，不是继续追求更热。`
      : isColdSeason
        ? '寒气当令，火是第一层调候；宜先建立白天节律、行动与可见输出，再谈其他补偏。'
        : isHotSeason && waterScore >= 24
          ? `月令偏热，但原局水约${waterScore}%，已有润燥条件。重点是让水能收敛火势，不宜一边补水一边继续高刺激消耗。`
          : isHotSeason
            ? '热燥当令，先用水润、金收，使行动有回旋；不宜再用熬夜、冲刺和密集社交加火。'
            : waterScore >= 30 && fireScore <= 15
      ? '寒湿偏重，先补火的温度、曝光和行动力，再用土来收束水势。'
      : fireScore >= 32 && waterScore <= 15
        ? '偏热少润，宜补水金的冷静、复盘和边界，不宜再用高刺激方式催动。'
        : fireScore >= 30
          ? '火气较显，行动力和表达不弱，调候重点在防燥、防急、防过度消耗。'
          : waterScore >= 28
            ? '水气较显，思考、感受和流动性强，调候重点在用火把想法落实。'
            : '寒暖不极端，关键不是单补某一行，而是让火水有来有往。';
  const moistureDiagnosis =
    isWetSeason && waterScore + earthScore >= 45
      ? '水土并重，容易形成湿滞：现实里表现为事情堆积、想法反复、推进速度慢，需要火来烘、木来疏。'
      : isWetSeason
        ? '月令带湿，先看事情能否流动和收口。即使盘中见火，也应以持续温养、疏通积压为主，不按夏季燥局处理。'
        : isDrySeason && fireScore + earthScore >= 45
        ? '火土并重，容易偏燥：现实里表现为急、硬、耗，需水来润、金来收。'
        : isDrySeason
          ? '月令带燥，优先保留弹性、恢复与信息回流，再看水金是否足以润收。'
        : metalScore >= 28 && waterScore <= 15
          ? '金旺少水，容易干脆但不够柔润，宜增加沟通缓冲和信息复盘。'
          : waterScore <= 12
            ? '水少偏燥，做事容易缺少回旋与耐心，宜补安静、复盘和长期流动资源。'
            : '燥湿相对可调，重点看岁运是否突然加重水土或火土。';
  const remedyElements = [...new Set([...monthProfile.adjustment, ...reading.usefulElements])].slice(0, 4);
  const primaryClimateElement = monthProfile.adjustment[0];
  const secondaryClimateElement = monthProfile.adjustment[1];
  const primaryClimateScore = scoreOf(primaryClimateElement);
  const remedyPlan = remedyElements.map((element) => {
    const isPrimaryClimate = element === primaryClimateElement;
    const isClimate = monthProfile.adjustment.includes(element);
    const isUseful = reading.usefulElements.includes(element);
    const score = scoreOf(element);
    const level = isPrimaryClimate ? '第一优先' : isClimate && isUseful ? '重点协同' : isClimate ? '调候辅助' : '结构辅助';
    const dosage = score >= 30
      ? `盘中${element}约${score}%，已有明显基础，应以“疏导、规范、不过量”为主。`
      : score <= 12
        ? `盘中${element}约${score}%，根气偏少，宜小量持续建立，不宜短期猛补。`
        : `盘中${element}约${score}%，可按现实反馈稳定使用，重点是形成流通。`;
    return { element, guide: elementRemedyGuide[element], isClimate, isUseful, level, dosage };
  });
  const decisionOrder = [
    `先调月令：先处理${primaryClimateElement}，目标是修正${monthProfile.climate}带来的发挥条件。`,
    `再做承接：用${secondaryClimateElement}承接${primaryClimateElement}，避免只补一端造成新的偏枯。`,
    `再扶日主：结合${dayStrength}，以${reading.usefulElements.join('、')}改善承压、输出或约束。`,
    `最后看岁运：大运流年若已经补足同一五行，现实方案应减量，不再机械叠加。`,
  ];
  const verificationSignals = [
    `启动：重要事情从决定到开始的时间是否缩短，同时没有明显冲动增加。`,
    `持续：连续四周能否稳定完成关键任务，而不是三天用力、随后停摆。`,
    `关系：表达与边界是否更清楚，冲突后恢复速度是否改善。`,
    `资源：时间、现金流、睡眠和承诺是否仍在可控范围。若任一项持续恶化，说明补法过量或方向不合。`,
  ];
  const usefulLogic =
    dayStrength === '偏弱'
      ? `日主${dayElement}偏弱，扶抑上先看印比：${supportElement}能补根气、增强承压，${controlElement}来克时则要先看有无通关。`
      : dayStrength === '偏旺'
        ? `日主${dayElement}偏旺，扶抑上宜泄耗制：${drainElement}可泄秀，${wealthElement}可成事，${controlElement}可立规矩，但过制则反成压力。`
        : `日主${dayElement}中和，扶抑不是单纯补强或削弱，重点看月令气候、格局清浊和岁运是否引动关键十神。`;

  return (
    <section className="section useful-section">
      <div className="section-title">
        <h2>喜用与调候详析</h2>
        <span>
          用神 {usefulPrimary} · 喜神 {usefulSecondary} · 月令{monthBranch}
        </span>
      </div>

      <div className="useful-summary">
        <article>
          <span>用神</span>
          <strong>{usefulPrimary}</strong>
          <p>
            当前日主{reading.dayMaster.stem}属{dayElement}，整体{dayStrength}。系统取{reading.usefulElements.join('、')}为主要补偏方向，
            不是只看缺什么，而是看月令、旺衰、流通和现实可承接性。
          </p>
        </article>
        <article>
          <span>调候</span>
          <strong>{monthProfile.adjustment.join('、')}</strong>
          <p>
            生于{monthBranch}月，属{monthProfile.season}，{monthProfile.climate}。调候先看寒暖燥湿：
            {monthProfile.priority} 本盘寒暖参考为{thermalBalance}，燥湿参考为{moistureBalance}。
          </p>
        </article>
        <article>
          <span>过量警示</span>
          <strong>{avoidElements.join('、') || reading.structure.dominantElement}</strong>
          <p>
            {avoidElements.length
              ? `${avoidElements.join('、')}已偏旺，岁运再增时容易放大惯性。`
              : `${reading.structure.dominantElement}为命局主气，未必为忌，但过度时会压住其他五行。`}
            取用要看能否形成流通，而不是把某一行越补越多。
          </p>
        </article>
      </div>

      <div className="remedy-priority" aria-label="调候执行顺序">
        {decisionOrder.map((item, index) => (
          <div key={item}>
            <span>{index + 1}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>

      <div className="useful-grid">
        <article>
          <h3>一、扶抑喜用</h3>
          <p>{usefulLogic}</p>
          <ul>
            <li>首要用神：{usefulPrimary}，用于修正命局最需要补的方向。</li>
            <li>辅助喜神：{usefulSecondary}，用于承接用神，避免补而不通。</li>
            <li>可见根气：{visibleUseful.length ? `${visibleUseful.join('、')}已在原局出现，喜用有落点。` : '原局喜用不显，更要靠环境、选择和岁运来补。'}</li>
          </ul>
        </article>

        <article>
          <h3>二、调候取法</h3>
          <p>
            调候重在“气候适不适合日主发挥”。{monthProfile.season}的核心问题是{monthProfile.climate}，
            所以本盘不能只用旺弱判断，还要看{monthProfile.adjustment.join('、')}能否调出可用之气。
          </p>
          <ul>
            <li>寒暖判断：{monthProfile.thermal} 本盘{thermalBalance}，若火不足则先补温度与行动力；若火已旺，则调候用火不可过头。</li>
            <li>燥湿判断：{monthProfile.moisture} 本盘{moistureBalance}，水土金的比例决定是先润、先燥，还是先疏通。</li>
            <li>{tiaohouHits.length ? `调候与喜用重合：${tiaohouHits.join('、')}，属于既补结构又调气候。` : `调候与扶抑有张力：${tensionElements.join('、')}需谨慎使用，不能一概当成喜。`}</li>
            <li>月令藏干：{reading.pillars[1].hiddenStems.join('、')}，说明气候背后还藏着{reading.pillars[1].branchTenGods.join('、') || '十神伏藏'}。</li>
            <li>取法次第：先处理{monthProfile.adjustment[0]}，再看{monthProfile.adjustment[1]}能否承接；若二者都不显，就要等大运流年或现实环境来补。</li>
            <li>缺口提示：{weakElements.length ? `${weakElements.join('、')}不足，适合后天主动补环境和能力。` : '五行缺口不明显，重点在清浊与流通。'}</li>
          </ul>
        </article>

        <article className="wide-card">
          <h3>三、寒暖燥湿细看</h3>
          <div className="climate-detail">
            <div>
              <strong>寒暖</strong>
              <p>
                {monthProfile.thermal} 盘面参考为{thermalBalance}。{thermalDiagnosis}
              </p>
            </div>
            <div>
              <strong>燥湿</strong>
              <p>
                {monthProfile.moisture} 盘面参考为{moistureBalance}。{moistureDiagnosis}
              </p>
            </div>
            <div>
              <strong>补法次第</strong>
              <p>
                先按月令处理{monthProfile.adjustment[0]}，再用{monthProfile.adjustment[1]}承接；若与扶抑喜用冲突，就“少量、持续、可回收”地补，不做极端改变。
              </p>
            </div>
          </div>
          <div className="method-basis">
            <strong>判断依据</strong>
            <p>
              先以月令定四时寒暖燥湿，再用原局火、水、土、金的比例校验，最后才合看日主旺衰与岁运。五行的基本性质参考
              <a href="https://ctext.org/shang-shu/great-plan/zhs" target="_blank" rel="noreferrer">《尚书·洪范》</a>
              所述润下、炎上、曲直、从革、稼穑；燥湿不可偏枯的判断参考
              <a href="https://zh.wikisource.org/zh/%E6%BB%B4%E5%A4%A9%E9%AB%93/16" target="_blank" rel="noreferrer">《滴天髓·燥湿》</a>。
              现代方案是基于这些原则做的生活转译，不是古籍原文直接给出的物品清单。
            </p>
          </div>
        </article>

        <article>
          <h3>四、现实取用</h3>
          <p>
            喜用落到现实，不是简单穿颜色或选方位，而是选择能补足{reading.usefulElements.join('、')}性质的环境、能力和节奏。
          </p>
          <ul>
            <li>{usefulPrimary}为用：优先经营能带来稳定补偏的能力、行业资源或生活节律。</li>
            <li>{usefulSecondary}为喜：适合作为辅助策略，用来承接机会、缓冲压力。</li>
            <li>若遇到加重{reading.structure.dominantElement}的年份，先降内耗，再谈扩张。</li>
          </ul>
        </article>

        <article>
          <h3>五、岁运观察</h3>
          <p>
            大运、流年见{reading.usefulElements.join('、')}时，往往更容易出现顺手的机会；若见{avoidElements.join('、') || reading.structure.dominantElement}过多，
            则要看是否冲动原局关系。
          </p>
          <ul>
            <li>可回测：过去进入喜用年份时，学习、迁移、合作或收入是否更顺。</li>
            <li>可预判：未来岁运若同时补调候与扶抑，适合主动推进重要事项。</li>
            <li>可避险：岁运冲合刑害明显时，先做减法，避免在压力期硬扩张。</li>
          </ul>
        </article>

        <article className="wide-card">
          <h3>六、完整调候方案</h3>
          <p>
            以下先按月令调气候，再按日主旺衰补结构。物品、颜色和方位仅放在最后作为提醒；真正有分量的是时间安排、工作方式、能力结构、关系边界与长期环境。
          </p>
          <div className="remedy-grid">
            {remedyPlan.map(({ element, guide, isClimate, isUseful, level, dosage }) => {
              return (
                <div className="remedy-card" key={element}>
                  <div className="remedy-card-title">
                    <strong>取{element}</strong>
                    <span>{level}</span>
                    {isClimate && <small>调候</small>}
                    {isUseful && <small>喜用</small>}
                  </div>
                  <p className="remedy-principle">{guide.principle}</p>
                  <p><b>剂量判断：</b>{dosage}</p>
                  <dl>
                    <div><dt>时间节律</dt><dd>{guide.timing.join('；')}</dd></div>
                    <div><dt>空间环境</dt><dd>{guide.environments.join('；')}</dd></div>
                    <div><dt>工作路径</dt><dd>{guide.workModes.join('；')}</dd></div>
                    <div><dt>能力训练</dt><dd>{guide.capabilities.join('；')}</dd></div>
                    <div><dt>人际策略</dt><dd>{guide.relationships.join('；')}</dd></div>
                    <div><dt>日常动作</dt><dd>{guide.actions.join('；')}</dd></div>
                    <div><dt>资源与器用</dt><dd>{guide.items.join('；')}</dd></div>
                    <div><dt>过量信号</dt><dd>{guide.overuseSignals.join('；')}</dd></div>
                    <div><dt>避免</dt><dd>{guide.avoid.join('；')}</dd></div>
                  </dl>
                </div>
              );
            })}
          </div>
        </article>

        <article className="wide-card verification-card">
          <h3>七、执行周期与纠偏</h3>
          <div className="execution-grid">
            <div>
              <strong>前 7 天 · 减少阻塞</strong>
              <p>先停止最明显的反向习惯：{elementRemedyGuide[primaryClimateElement].avoid[0]}。只选一个最小动作开始，不同时改造全部生活。</p>
            </div>
            <div>
              <strong>第 2-4 周 · 建立主线</strong>
              <p>{elementRemedyGuide[primaryClimateElement].actions[0]}；同时用{secondaryClimateElement}的方式承接：{elementRemedyGuide[secondaryClimateElement].actions[0]}。</p>
            </div>
            <div>
              <strong>第 2-3 月 · 看现实结果</strong>
              <p>把方案放进真实工作、关系和资源选择中。若只有情绪感受变好、交付和边界没有改善，就需要调整剂量。</p>
            </div>
          </div>
          <ul className="verification-list">
            {verificationSignals.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="method-note">
            本盘首调{primaryClimateElement}，当前占比约{primaryClimateScore}%。调候取法只用于传统命理的生活规划参考；涉及饮食、睡眠、身体不适或情绪问题时，应以医学与专业意见为准。
          </p>
        </article>
      </div>
    </section>
  );
}

export function SmartPillarDiagram({ reading }: { reading: BaziReading }) {
  const [activeTab, setActiveTab] = useState<DiagramTab>('ganzhi');
  const tabItems: Array<{ key: DiagramTab; label: string }> = [
    { key: 'ganzhi', label: '干支' },
    { key: 'flow', label: '流通' },
    { key: 'palace', label: '宫位' },
    { key: 'kinship', label: '六亲' },
  ];
  const pillars = reading.pillars;
  const adjacentPairs = pillars.slice(0, -1).map((pillar, index) => {
    const next = pillars[index + 1];
    const stemRelation = getElementRelation(stemElement[pillar.stem], stemElement[next.stem]);
    const branchRelation = getElementRelation(branchElement[pillar.branch], branchElement[next.branch]);
    const branchNotes = getPairRelations(pillar.branch, next.branch, branchRelations);
    const stemNotes = getPairRelations(pillar.stem, next.stem, combinePairs);
    return { pillar, next, stemRelation, branchRelation, branchNotes, stemNotes };
  });
  const allStemNotes = collectPairNotes(pillars.map((pillar) => pillar.stem), combinePairs, '天干未见明显合化');
  const allBranchNotes = collectPairNotes(pillars.map((pillar) => pillar.branch), branchRelations, '地支未见明显冲合刑害');
  const relationTone = (relation: string) => (relation === '生' || relation === '助' ? 'good' : 'warn');
  const describeStemLink = (pillar: Pillar, next: Pillar, relation: string) =>
    `${pillar.stem}${stemElement[pillar.stem]} → ${next.stem}${stemElement[next.stem]}：${relation}`;
  const describeBranchLink = (pillar: Pillar, next: Pillar, relation: string) =>
    `${pillar.branch}${branchElement[pillar.branch]} → ${next.branch}${branchElement[next.branch]}：${relation}`;
  const describeRootLink = (pillar: Pillar, relation: string) =>
    `${pillar.stem}${stemElement[pillar.stem]} → ${pillar.branch}${branchElement[pillar.branch]}：${relation}`;

  return (
    <section className="section diagram-section">
      <div className="diagram-title">
        <h2>智能四柱图示</h2>
      </div>
      <div className="diagram-tabs" role="tablist" aria-label="智能四柱图示">
        {tabItems.map((item) => (
          <button
            className={activeTab === item.key ? 'active' : ''}
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === 'ganzhi' && (
        <div className="diagram-pane">
          <div className="diagram-pillars">
            {pillars.map((pillar) => (
              <article className="diagram-pillar" key={pillar.key}>
                <span>{pillar.label}</span>
                <em>{pillar.stemTenGod}</em>
                <GanZhiGlyph value={pillar.stem} type="stem" />
                <GanZhiGlyph value={pillar.branch} type="branch" />
                <small>{pillar.branchTenGods.join('、') || '-'}</small>
              </article>
            ))}
          </div>
          <div className="diagram-note-grid">
            <p>
              <strong>天干：</strong>
              {allStemNotes}
            </p>
            <p>
              <strong>地支：</strong>
              {allBranchNotes}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'flow' && (
        <div className="diagram-pane">
          <div className="flow-visual">
            <div className="flow-chart">
              <div className="flow-chart-row">
                {pillars.map((pillar, index) => (
                  <div className="flow-slot" key={`stem-slot-${pillar.key}`}>
                    <div className="flow-glyph-node">
                      <small>{pillar.stemTenGod}</small>
                      <GanZhiGlyph value={pillar.stem} type="stem" />
                    </div>
                    {index < adjacentPairs.length && (
                      <div className={`relation-line horizontal ${relationTone(adjacentPairs[index].stemRelation)}`}>
                        <span>{adjacentPairs[index].stemRelation}</span>
                        <em>{describeStemLink(pillar, adjacentPairs[index].next, adjacentPairs[index].stemRelation)}</em>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flow-chart-row">
                {pillars.map((pillar, index) => {
                  const stemBranchRelation = getElementRelation(stemElement[pillar.stem], branchElement[pillar.branch]);
                  return (
                    <div className="flow-slot branch-slot" key={`branch-slot-${pillar.key}`}>
                      <div className={`relation-line vertical ${relationTone(stemBranchRelation)}`}>
                        <span>{stemBranchRelation}</span>
                        <em>{describeRootLink(pillar, stemBranchRelation)}</em>
                      </div>
                      <div className="flow-glyph-node">
                        <GanZhiGlyph value={pillar.branch} type="branch" />
                        <small>{pillar.branchTenGods[0] || '-'}</small>
                      </div>
                      {index < adjacentPairs.length && (
                        <div className={`relation-line horizontal branch-line ${relationTone(adjacentPairs[index].branchRelation)}`}>
                          <span>{adjacentPairs[index].branchRelation}</span>
                          <em>{describeBranchLink(pillar, adjacentPairs[index].next, adjacentPairs[index].branchRelation)}</em>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="diagram-note-grid">
            <p>
              <strong>天干关系：</strong>
              {adjacentPairs.map((item) => describeStemLink(item.pillar, item.next, item.stemRelation)).join('；')}
            </p>
            <p>
              <strong>地支关系：</strong>
              {adjacentPairs.map((item) => describeBranchLink(item.pillar, item.next, item.branchRelation)).join('；')}
            </p>
            <p>
              <strong>上下关系：</strong>
              {pillars
                .map((pillar) => describeRootLink(pillar, getElementRelation(stemElement[pillar.stem], branchElement[pillar.branch])))
                .join('；')}
            </p>
            <p>
              <strong>总体判断：</strong>
              {adjacentPairs
                .map((item) => `${item.pillar.label}${item.next.label}：天干${item.stemRelation}，地支${item.branchRelation}`)
                .join('；')}
            </p>
            <p>
              <strong>阻塞：</strong>
              {adjacentPairs
                .flatMap((item) => [...item.stemNotes, ...item.branchNotes])
                .join('、') || '未见明显相冲、相刑、相克阻塞，重点看岁运触发。'}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'palace' && (
        <div className="diagram-pane">
          <div className="palace-pillar-row">
            {pillars.map((pillar) => {
              const palace = palaceMeanings[pillar.key];
              return (
                <article className="palace-pillar" key={pillar.key}>
                  <strong>{palace.title}</strong>
                  <span>{pillar.label}</span>
                  <GanZhiGlyph value={pillar.stem} type="stem" />
                  <GanZhiGlyph value={pillar.branch} type="branch" />
                </article>
              );
            })}
          </div>
          <div className="palace-matrix">
            {['time', 'space', 'body'].map((key) => (
              <article key={key}>
                <h3>{key === 'time' ? '时间类象' : key === 'space' ? '空间类象' : '身体类象'}</h3>
                <div>
                  {pillars.map((pillar) => (
                    <span key={`${key}-${pillar.key}`}>{palaceMeanings[pillar.key][key as 'time' | 'space' | 'body']}</span>
                  ))}
                </div>
              </article>
            ))}
            <article>
              <h3>人际类象</h3>
              <div>
                {pillars.map((pillar) => (
                  <span key={`people-${pillar.key}`}>{palaceMeanings[pillar.key].people.join('、')}</span>
                ))}
              </div>
            </article>
          </div>
        </div>
      )}

      {activeTab === 'kinship' && (
        <div className="diagram-pane">
          <div className="kinship-board">
            <article>
              <h3>亲属关系</h3>
              <div className="kinship-columns">
                {pillars.map((pillar) => {
                  const kin = kinshipByTenGod[pillar.stemTenGod] ?? { family: ['关系待定'], social: ['关系待定'] };
                  return (
                    <div key={`family-${pillar.key}`}>
                      <strong>{kin.family.join(' / ')}</strong>
                      <span>{pillar.stemTenGod}</span>
                      <GanZhiGlyph value={pillar.stem} type="stem" />
                      <GanZhiGlyph value={pillar.branch} type="branch" />
                      <small>{pillar.branchTenGods.map((god) => kinshipByTenGod[god]?.family[0] ?? god).join('、') || '-'}</small>
                    </div>
                  );
                })}
              </div>
            </article>
            <article>
              <h3>社会关系</h3>
              <div className="kinship-columns">
                {pillars.map((pillar) => {
                  const kin = kinshipByTenGod[pillar.stemTenGod] ?? { family: ['关系待定'], social: ['关系待定'] };
                  return (
                    <div key={`social-${pillar.key}`}>
                      <strong>{kin.social.join(' / ')}</strong>
                      <span>{pillar.stemTenGod}</span>
                      <GanZhiGlyph value={pillar.stem} type="stem" />
                      <GanZhiGlyph value={pillar.branch} type="branch" />
                      <small>{pillar.branchTenGods.map((god) => kinshipByTenGod[god]?.social[0] ?? god).join('、') || '-'}</small>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}

export function PortraitSection({ reading }: { reading: BaziReading }) {
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

export function DeepDivePanel({ reading }: { reading: BaziReading }) {
  const [activeDomain, setActiveDomain] = useState<DeepDomainKey>('summary');
  const activeReport = reading.deepDive.domains.find((domain) => domain.key === activeDomain) ?? reading.deepDive.domains[0];
  const synthesis = reading.deepDive.methodSynthesis;

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
      <div className="method-synthesis">
        <div className="method-synthesis-head">
          <div>
            <span className="method-eyebrow">多法交叉校验</span>
            <h3>四家合参</h3>
          </div>
          <span className={`confidence-badge confidence-${synthesis.confidence}`}>证据完整度：{synthesis.confidence}</span>
        </div>
        <p className="confidence-reason">{synthesis.confidenceReason}</p>
        <div className="method-summary-grid">
          <div>
            <h4>共同结论</h4>
            <ol>
              {synthesis.consensus.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </div>
          <div>
            <h4>分歧处理</h4>
            <ol>
              {synthesis.differences.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </div>
          <div>
            <h4>判读次序</h4>
            <ol>
              {synthesis.decisionOrder.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </div>
        </div>
        <div className="school-judgment-list">
          {synthesis.schools.map((school, index) => (
            <article className="school-judgment" key={school.key}>
              <div className="school-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="school-body">
                <div className="school-title-row">
                  <div>
                    <h4>{school.school}</h4>
                    <span>{school.focus}</span>
                  </div>
                  <span className={`school-weight weight-${school.weight}`}>{school.weight}</span>
                </div>
                <blockquote>{school.quote}</blockquote>
                <p className="school-conclusion">{school.conclusion}</p>
                <ul>
                  {school.evidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <div className="school-footer">
                  <span>适用边界：{school.limitation}</span>
                  <a href={school.sourceUrl} rel="noreferrer" target="_blank">{school.source} · 查看出处</a>
                  {school.citation && <a href={`#/learn/classics/${school.citation.bookId}/${school.citation.chapterId}?passage=${school.citation.passageId}&edition=${school.citation.version}`}>本地原文 · {school.citation.chapterTitle}</a>}
                </div>
              </div>
            </article>
          ))}
        </div>
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

export function LuckIntegratedPanel({ reading }: { reading: BaziReading }) {
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
                    <li>{currentDescription.stemFocus}</li>
                    <li>{currentDescription.branchFocus}</li>
                  </ul>
                </div>
                <div>
                  <h4>机会窗口</h4>
                  <ul>
                    <li>{currentDescription.opportunity}</li>
                    <li>{currentDescription.climateText}</li>
                    {reading.deepDive.currentLuck.bestFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>风险边界</h4>
                  <ul>
                    <li>{currentDescription.risk}</li>
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
                    {currentDescription.actionSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                    <li>{currentDescription.reviewPoint}</li>
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
        {reading.daYun.periods.map((period) => {
          const description = describeLuckPeriod(reading, period);
          return (
            <article className={period.isCurrent ? 'luck-period-card current' : 'luck-period-card'} key={`${period.startYear}-${period.ganZhi}`}>
              <div className="luck-period-head">
                <div>
                  <strong>{period.ganZhi}</strong>
                  <span>{description.phase}</span>
                </div>
                <p>
                  {period.startYear}-{period.endYear} · {period.startAge}-{period.endAge}岁
                </p>
              </div>
              <div className="luck-period-body">
                <p>{description.theme}</p>
                <div className="luck-detail-block">
                  <h4>十神与原局</h4>
                  <ul>
                    <li>{description.stemFocus}</li>
                    <li>{description.branchFocus}</li>
                    <li>{description.stemNote}</li>
                    <li>{description.branchNote}</li>
                  </ul>
                </div>
                <div className="luck-detail-block">
                  <h4>机会与风险</h4>
                  <ul>
                    <li>{description.opportunity}</li>
                    <li>{description.risk}</li>
                    <li>{description.climateText}</li>
                  </ul>
                </div>
                <div className="luck-detail-block">
                  <h4>行动清单</h4>
                  <ul>
                    {description.actionSteps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                    <li>{description.reviewPoint}</li>
                  </ul>
                </div>
              </div>
              <small>
                空亡：{period.xunKong} · {description.usefulText} · 十神主线：{description.stemTenGod}
              </small>
            </article>
          );
        })}
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

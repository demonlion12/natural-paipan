import { Solar } from 'lunar-javascript';
import type { DaYun, EightChar } from 'lunar-javascript';
import type {
  BaziReading,
  BirthInput,
  DaYunPeriod,
  DeepDiveReport,
  DeepDomainReport,
  ElementName,
  ElementScore,
  Gender,
  PersonalityPortrait,
  Pillar,
  PillarKey,
  ReadingAdvice,
  ReadingSection,
} from './types';

const STEM_ELEMENT: Record<string, ElementName> = {
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

const STEM_POLARITY: Record<string, '阳' | '阴'> = {
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

const BRANCH_MAIN_STEM: Record<string, string> = {
  子: '癸',
  丑: '己',
  寅: '甲',
  卯: '乙',
  辰: '戊',
  巳: '丙',
  午: '丁',
  未: '己',
  申: '庚',
  酉: '辛',
  戌: '戊',
  亥: '壬',
};

const BRANCH_COMBINES = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
const BRANCH_CLASHES = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];

const BRANCH_HIDDEN_WEIGHTS = [8, 4, 2];
const ELEMENTS: ElementName[] = ['木', '火', '土', '金', '水'];
const GENERATES: Record<ElementName, ElementName> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};
const CONTROLS: Record<ElementName, ElementName> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
};

const PILLAR_LABEL: Record<PillarKey, string> = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  time: '时柱',
};

const SECTION_TITLES: Record<ReadingSection, string> = {
  overview: '核心性格',
  career: '事业财运',
  relationship: '关系模式',
  health: '身心节律',
  growth: '行动建议',
};

const ELEMENT_PERSONA: Record<ElementName, string> = {
  木: '重成长、讲原则，适合在持续迭代中建立影响力',
  火: '表达感强、反应快，适合站到台前或负责传播与推动',
  土: '重稳定、能承压，适合做整合、管理和长期经营',
  金: '边界清晰、执行果断，适合规则、产品、技术和高标准交付',
  水: '学习力强、观察细腻，适合研究、策略、交易和跨界连接',
};

const ELEMENT_DEEP_PROFILE: Record<
  ElementName,
  { self: string; pressure: string; virtue: string; imbalance: string; social: string }
> = {
  木: {
    self: '你不是喜欢原地等结果的人，内在有一股向上生发的劲。你在乎成长、秩序和长期意义，做事常常先问“这件事能不能让我变得更好”。',
    pressure: '压力大时容易变得较真，表面还算温和，心里却会反复推演对错与边界。',
    virtue: '长处是有原则、有恢复力，适合把一个方向长期经营成个人标签。',
    imbalance: '失衡时容易急于证明自己，或对不够成长的人事物失去耐心。',
    social: '你欣赏真诚、上进、有共同目标的人，不太适合长期处在消耗型关系里。',
  },
  火: {
    self: '你对氛围、反馈和人的情绪很敏锐，心里有光，也需要被看见。你不是冷处理型人格，很多事一旦想明白，就希望尽快表达、推进、点燃局面。',
    pressure: '压力大时容易心急，脑子转得快，睡下了也还在复盘白天的对话与选择。',
    virtue: '长处是感染力、表达力和行动热度，适合站到前台、做传播、做产品推动或承担关键沟通。',
    imbalance: '失衡时容易一阵热一阵冷，或因为太想把事做成而忽略节奏。',
    social: '你需要有回应的关系；长期冷淡、拖延、含糊，会让你明显消耗。',
  },
  土: {
    self: '你底层是重稳定、重责任的人。很多时候你不会轻易说难，但会默默把事情扛起来，先保证局面不塌，再考虑自己的感受。',
    pressure: '压力大时容易把情绪压进身体里，外面看着稳，里面已经在反复消化。',
    virtue: '长处是承载力、整合力和耐心，适合管理、运营、长期项目和资源沉淀。',
    imbalance: '失衡时容易过度负责，替别人兜底太多，最后反而让自己变钝。',
    social: '你适合和靠谱、讲信用、能共同建设生活的人在一起。',
  },
  金: {
    self: '你不是随波逐流的人，内心有一套清楚的标准。你看人看事常先看边界、效率和结果，讨厌拖泥带水，也不太吃空话。',
    pressure: '压力大时容易收紧，变得挑剔、沉默，或对细节控制得更严。',
    virtue: '长处是判断力、执行力和专业标准，适合技术、金融、法务、产品、审计或高质量交付。',
    imbalance: '失衡时容易显得冷硬，心里明明在意，表达出来却像否定。',
    social: '你尊重有能力、守规则、说到做到的人，关系里最怕反复失信。',
  },
  水: {
    self: '你不是只看表面的人，感受力和观察力都比较深。你会先收集信息、判断趋势，再决定要不要投入，很多想法不会第一时间说出来。',
    pressure: '压力大时容易想太多，越想越远，甚至把还没发生的风险提前演练一遍。',
    virtue: '长处是学习力、策略感和适应力，适合研究、数据、投资、咨询、跨区域或跨行业连接。',
    imbalance: '失衡时容易犹豫、分散，知道很多可能性，却迟迟不落地。',
    social: '你需要能给你空间、也能和你深聊的人；太浅、太吵、太急的关系会让你后退。',
  },
};

const TEN_GOD_PROFILE: Record<string, { drive: string; gift: string; shadow: string }> = {
  比肩: {
    drive: '自我感与自主性较强，遇事倾向先靠自己判断。',
    gift: '能扛事，有竞争意识，不容易被环境轻易压倒。',
    shadow: '有时会不自觉地把求助看成示弱，导致一个人硬撑。',
  },
  劫财: {
    drive: '行动欲、同伴缘和竞争心较明显，容易被现场气氛带动。',
    gift: '适合协作、开拓、冲刺，也敢在关键时刻下注。',
    shadow: '需防人情消耗、冲动决策，尤其财务与合作要先立边界。',
  },
  食神: {
    drive: '重体验、重表达，也重生活质感，不喜欢长期被高压驱赶。',
    gift: '适合内容、创作、教学、服务和把复杂事讲得舒服。',
    shadow: '舒适区太久会削弱进取，容易把真正想做的事往后拖。',
  },
  伤官: {
    drive: '脑子快，有自己的判断，不喜欢被僵硬规则管住。',
    gift: '适合创新、表达、技术突破、产品优化和提出新解法。',
    shadow: '话太直或标准太高时，容易与权威、流程、上级产生摩擦。',
  },
  正财: {
    drive: '现实感较强，重稳定收益、责任兑现和看得见的成果。',
    gift: '擅长经营、预算、执行和把资源落到实处。',
    shadow: '容易为了安全感而压低野心，也容易被琐事绑定。',
  },
  偏财: {
    drive: '对机会、资源、人脉和商业变化较敏感。',
    gift: '适合项目制、资源整合、商务合作和非固定路径赚钱。',
    shadow: '机会多时更要筛选，忌贪快、贪多、贪看似轻松的钱。',
  },
  正官: {
    drive: '重规则、名誉、秩序和可被认可的位置。',
    gift: '适合平台、管理、专业资质、组织责任和稳定晋升。',
    shadow: '太在意评价时会压抑真实想法，做决定容易保守。',
  },
  七杀: {
    drive: '对压力、挑战和竞争环境有反应，越有难度越容易被激发。',
    gift: '适合攻坚、管理风险、创业开局、危机处理和高压赛道。',
    shadow: '压力过量时容易紧绷、急躁，或把关系也当成战场。',
  },
  正印: {
    drive: '需要安全感、系统知识和可信赖的支撑。',
    gift: '学习力、吸收力、贵人缘和证照体系较有利。',
    shadow: '容易想得周全但行动慢，或对外部认可有依赖。',
  },
  偏印: {
    drive: '思维独特，喜欢研究非标准答案，对冷门知识和复杂系统敏感。',
    gift: '适合策略、研究、技术、心理、玄学、产品洞察和跨界学习。',
    shadow: '想法太多时容易孤立、跳跃，别人未必跟得上你的逻辑。',
  },
};

const STRENGTH_PROFILE: Record<'偏弱' | '中和' | '偏旺', string> = {
  偏弱: '日主偏弱，不是能力弱，而是命局里消耗、压力或外部牵引较多。你更适合先借平台、借系统、借贵人，把根基养厚后再扩张。',
  中和: '日主中和，说明你有自我，也能接住外部要求。此类结构最怕长期摇摆，真正开运的关键是把优势固定成可复制的方法。',
  偏旺: '日主偏旺，主观能量足，抗压与自驱较强。好处是敢定方向，难处是容易太靠自己，需学会泄秀、用规则和合作来疏通能量。',
};

const ELEMENT_CAREER: Record<ElementName, string> = {
  木: '教育、内容、咨询、品牌、组织发展、健康生活方式',
  火: '传媒、营销、设计、演讲、产品增长、线上娱乐',
  土: '运营、管理、地产、供应链、财务规划、社区服务',
  金: '技术、金融、法务、工业、审计、系统化交付',
  水: '研究、数据、投资、贸易、心理、旅行与跨区域业务',
};

const ELEMENT_HEALTH: Record<ElementName, string> = {
  木: '注意睡眠、眼睛、筋膜拉伸和情绪疏导',
  火: '注意心火、炎症、熬夜和咖啡因摄入',
  土: '注意脾胃、代谢、久坐和甜食依赖',
  金: '注意呼吸道、皮肤、肩颈紧张和过度控制',
  水: '注意肾水、腰背、寒湿和长期焦虑',
};

function parseDateTime(input: BirthInput) {
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour, minute] = input.birthTime.split(':').map(Number);

  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    throw new Error('请输入完整的出生日期和时间');
  }

  return { year, month, day, hour, minute };
}

function normalizeArray(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return `${value}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getMotherElement(element: ElementName) {
  return (Object.keys(GENERATES) as ElementName[]).find((key) => GENERATES[key] === element)!;
}

function getChildElement(element: ElementName) {
  return GENERATES[element];
}

function getControlledBy(element: ElementName) {
  return (Object.keys(CONTROLS) as ElementName[]).find((key) => CONTROLS[key] === element)!;
}

function getTenGodFromStems(dayStem: string, targetStem: string) {
  const dayElement = STEM_ELEMENT[dayStem];
  const targetElement = STEM_ELEMENT[targetStem];
  const samePolarity = STEM_POLARITY[dayStem] === STEM_POLARITY[targetStem];

  if (dayElement === targetElement) {
    return samePolarity ? '比肩' : '劫财';
  }
  if (GENERATES[dayElement] === targetElement) {
    return samePolarity ? '食神' : '伤官';
  }
  if (GENERATES[targetElement] === dayElement) {
    return samePolarity ? '偏印' : '正印';
  }
  if (CONTROLS[dayElement] === targetElement) {
    return samePolarity ? '偏财' : '正财';
  }
  return samePolarity ? '七杀' : '正官';
}

function getAnnualBranchNotes(branch: string, pillars: Pillar[]) {
  const notes = new Set<string>();
  pillars.forEach((pillar) => {
    if (BRANCH_COMBINES.some(([a, b]) => (a === branch && b === pillar.branch) || (b === branch && a === pillar.branch))) {
      notes.add(`${branch}${pillar.branch}合（引动${pillar.label}）`);
    }
    if (BRANCH_CLASHES.some(([a, b]) => (a === branch && b === pillar.branch) || (b === branch && a === pillar.branch))) {
      notes.add(`${branch}${pillar.branch}冲（推动${pillar.label}变化）`);
    }
    if (branch === pillar.branch) {
      notes.add(`${branch}${pillar.branch}伏吟（${pillar.label}主题重复）`);
    }
  });
  return [...notes];
}

function createPillar(key: PillarKey, eightChar: EightChar): Pillar {
  const methodPrefix = key === 'time' ? 'Time' : `${key[0].toUpperCase()}${key.slice(1)}`;
  const get = (suffix: string) => {
    const method = `get${methodPrefix}${suffix}`;
    const value = (eightChar as unknown as Record<string, () => unknown>)[method];
    if (typeof value !== 'function') {
      throw new Error(`排盘字段缺失：${method}`);
    }
    return value.call(eightChar);
  };

  return {
    key,
    label: PILLAR_LABEL[key],
    ganZhi: get('') as string,
    stem: get('Gan') as string,
    branch: get('Zhi') as string,
    hiddenStems: normalizeArray(get('HideGan') as string[] | string),
    stemTenGod: get('ShiShenGan') as string,
    branchTenGods: normalizeArray(get('ShiShenZhi') as string[] | string),
    wuXing: get('WuXing') as string,
    naYin: get('NaYin') as string,
    diShi: get('DiShi') as string,
    xunKong: get('XunKong') as string,
  };
}

function scoreElements(pillars: Pillar[]) {
  const scores = Object.fromEntries(ELEMENTS.map((element) => [element, 0])) as Record<ElementName, number>;

  pillars.forEach((pillar) => {
    scores[STEM_ELEMENT[pillar.stem]] += 10;

    pillar.hiddenStems.forEach((stem, index) => {
      const element = STEM_ELEMENT[stem];
      if (element) {
        scores[element] += BRANCH_HIDDEN_WEIGHTS[index] ?? 1;
      }
    });
  });

  const monthBranchElements = pillars.find((pillar) => pillar.key === 'month')?.hiddenStems ?? [];
  monthBranchElements.forEach((stem, index) => {
    const element = STEM_ELEMENT[stem];
    if (element) {
      scores[element] += index === 0 ? 8 : 2;
    }
  });

  return scores;
}

function normalizeScores(scores: Record<ElementName, number>): ElementScore[] {
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0) || 1;

  return ELEMENTS.map((element) => {
    const ratio = scores[element] / total;
    const tone: ElementScore['tone'] = ratio < 0.13 ? '不足' : ratio > 0.28 ? '偏旺' : '平衡';
    return {
      element,
      score: scores[element],
      ratio,
      tone,
    };
  }).sort((a, b) => b.score - a.score);
}

function getDayMasterStrength(dayElement: ElementName, scores: Record<ElementName, number>) {
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0) || 1;
  const supportRatio = (scores[dayElement] + scores[getMotherElement(dayElement)]) / total;

  if (supportRatio >= 0.58) {
    return '偏旺';
  }
  if (supportRatio <= 0.36) {
    return '偏弱';
  }
  return '中和';
}

function getUsefulElements(dayElement: ElementName, strength: '偏弱' | '中和' | '偏旺') {
  if (strength === '偏弱') {
    return [getMotherElement(dayElement), dayElement];
  }
  if (strength === '偏旺') {
    return [getChildElement(dayElement), CONTROLS[dayElement], getControlledBy(dayElement)];
  }
  return [dayElement, getChildElement(dayElement)];
}

function findHighlightedTenGods(pillars: Pillar[]) {
  const counts = new Map<string, number>();
  pillars.forEach((pillar) => {
    [pillar.stemTenGod, ...pillar.branchTenGods].forEach((god) => {
      if (god && god !== '日主') {
        counts.set(god, (counts.get(god) ?? 0) + 1);
      }
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([god]) => god);
}

function countTenGods(pillars: Pillar[]) {
  const counts = new Map<string, number>();
  pillars.forEach((pillar) => {
    [pillar.stemTenGod, ...pillar.branchTenGods].forEach((god) => {
      if (god && god !== '日主') {
        counts.set(god, (counts.get(god) ?? 0) + 1);
      }
    });
  });
  return counts;
}

function hasAnyGod(counts: Map<string, number>, gods: string[]) {
  return gods.some((god) => (counts.get(god) ?? 0) > 0);
}

function getGodProfileText(highlightedTenGods: string[]) {
  const primary = highlightedTenGods[0];
  const secondary = highlightedTenGods[1];
  const primaryProfile = primary ? TEN_GOD_PROFILE[primary] : undefined;
  const secondaryProfile = secondary ? TEN_GOD_PROFILE[secondary] : undefined;

  return {
    primary,
    secondary,
    drive: primaryProfile?.drive ?? '十神分布较散，说明你的行为模式不只靠单一力量驱动，常随阶段与环境切换角色。',
    gift: primaryProfile?.gift ?? '优势在于适应面较宽，能在不同任务里找到自己的位置。',
    shadow:
      secondaryProfile && primaryProfile
        ? `${primaryProfile.shadow} 同时${secondary}也显，${secondaryProfile.shadow}`
        : (primaryProfile?.shadow ?? '需要避免什么都想兼顾，导致主线不够清楚。'),
  };
}

function createPortrait(
  input: BirthInput,
  pillars: Pillar[],
  dayElement: ElementName,
  strength: '偏弱' | '中和' | '偏旺',
  usefulElements: ElementName[],
  elementScores: ElementScore[],
  highlightedTenGods: string[],
): PersonalityPortrait {
  const monthPillar = pillars.find((pillar) => pillar.key === 'month')!;
  const dayPillar = pillars.find((pillar) => pillar.key === 'day')!;
  const timePillar = pillars.find((pillar) => pillar.key === 'time')!;
  const dominant = elementScores[0];
  const weakest = elementScores[elementScores.length - 1];
  const profile = ELEMENT_DEEP_PROFILE[dayElement];
  const godProfile = getGodProfileText(highlightedTenGods);
  const usefulText = usefulElements.join('、');

  return {
    title: `${input.name || '这位缘主'}，你是这样的人`,
    opening: `从命理结构看，你是${STEM_POLARITY[dayPillar.stem]}${dayElement}日主，月令落在${monthPillar.ganZhi}，命局以${dominant.element}气较显，日主整体为${strength}。这不是一句简单的“性格外向或内向”，而是说：你的底层动力、抗压方式和成事路径，都带有明显的${dayElement}象。${profile.self}`,
    evidence: [
      `日主为${dayPillar.stem}${dayPillar.branch}，日干${dayPillar.stem}代表“我”，其五行为${dayElement}，所以先以${dayElement}的气质定你的核心人格。`,
      `月柱${monthPillar.ganZhi}主青年环境与做事底色，藏干为${monthPillar.hiddenStems.join('、')}，说明你早期形成的反应模式里，${monthPillar.branchTenGods.join('、')}的力量较容易被激活。`,
      `命局五行里${dominant.element}约占${Math.round(dominant.ratio * 100)}%，${weakest.element}约占${Math.round(weakest.ratio * 100)}%。${dominant.element}旺处是天赋，${weakest.element}弱处往往就是需要后天补课的地方。`,
      highlightedTenGods.length
        ? `十神中${highlightedTenGods.join('、')}较醒目，表示你处理现实问题时，常在这些角色之间切换。`
        : '十神没有特别单一的压倒性力量，说明你更像复合型人格，不能只用一个标签概括。',
    ],
    traits: [
      profile.pressure,
      godProfile.drive,
      strength === '偏弱'
        ? '你不适合长期硬扛，越是重要的事，越要先找资源、找方法、找稳定节奏。'
        : strength === '偏旺'
          ? '你心里有主见，不喜欢被人安排太细；别人若只讲道理不讲尊重，你会本能抗拒。'
          : '你有调和能力，既能顾及现实，也保留自我判断，但最怕一直被琐碎事情牵着走。',
      `时柱${timePillar.ganZhi}看后劲与长期输出，带${timePillar.stemTenGod}，说明你越往后越需要把能力沉淀成自己的节奏，而不是只响应别人需求。`,
    ],
    strengths: [
      profile.virtue,
      godProfile.gift,
      `当你处在${usefulText}较足的环境里，做事更顺，判断更稳，也更容易遇到能真正托举你的关系和机会。`,
    ],
    blindSpots: [
      profile.imbalance,
      godProfile.shadow,
      `${weakest.element}气不足时，现实表现常是某类能力容易被忽略：可能是表达、边界、稳定、执行或休息。它不是缺陷，而是后天最值得补的功课。`,
    ],
    workStyle: `事业上，你不是单纯适合“稳定”或“冒险”的人，而要看阶段。${STRENGTH_PROFILE[strength]} 你的工作方式宜先建立一项可被别人识别的硬能力，再用${highlightedTenGods[0] || '主线能力'}去放大影响力。适合的方向可参考${ELEMENT_CAREER[dayElement]}，但真正关键是：岗位要允许你持续升级，而不是只消耗体力和情绪。`,
    relationshipStyle: `关系里，你需要的是有回应、有边界、能共同成长的人。${profile.social} 若对方长期含糊、失信或只索取不建设，你会从热到冷，最后在心里先退出。改善关系的关键不是一味忍让，而是把期待说清，把边界立稳。`,
    moneyStyle: `财务上，命局提示你适合用“能力变现 + 稳定结构”来积累，而不是完全靠运气。若${highlightedTenGods.includes('偏财') ? '偏财' : '财星'}被引动，项目机会、人情资源和副业机会会增加；但越有机会，越要做预算、合同和退出条件，避免财来财去。`,
    growthKey: `你的开运点不在神秘处，而在三个现实动作：一是补${usefulText}，让生活环境、合作对象和作息更支持你；二是减少${dominant.element}过旺带来的惯性反应；三是把当下大运能给你的资源用到一条主线上。命局给底牌，打法仍在你手里。`,
    verification: [
      `你大概率不喜欢被人用很粗暴的方式安排人生，哪怕表面配合，心里也会重新评估这段关系。`,
      `你在熟悉领域会越来越有主见，但在不确定阶段容易先观察、试探，等判断成型后再明显发力。`,
      `过去某些阶段，你容易出现“明明能扛，但扛完很累”的情况，尤其当责任、人情和现实压力同时压来时更明显。`,
    ],
  };
}

function createAdvice(
  section: ReadingSection,
  dayElement: ElementName,
  usefulElements: ElementName[],
  strength: '偏弱' | '中和' | '偏旺',
  dominantElement: ElementName,
  highlightedTenGods: string[],
): ReadingAdvice {
  const usefulText = usefulElements.join('、');
  const tenGodText = highlightedTenGods.length ? highlightedTenGods.join('、') : '十神结构较分散';

  const bodyBySection: Record<ReadingSection, string> = {
    overview: `${dayElement}日主，整体呈${strength}。你的底层气质不是单一的“外向/内向”，而是${ELEMENT_PERSONA[dayElement]}。盘中${dominantElement}气较显，遇到复杂问题时，你容易先用${dominantElement}的方式反应：或推进，或控制，或承接，或观察。${STRENGTH_PROFILE[strength]} 当前最宜补${usefulText}，让自己的状态更顺，不要总靠意志硬撑。`,
    career: `事业上适合靠“可复用能力”建立护城河。${dayElement}日主可重点参考${ELEMENT_CAREER[dayElement]}等方向；当前结构中${tenGodText}较醒目，说明机会往往来自角色切换、资源整合或专业表达。你不适合长期做没有成长曲线的重复消耗，越到后面，越需要把经验沉淀成方法、作品、流程或个人品牌。做选择时优先看长期复利，不只看短期热闹。`,
    relationship: `关系里要避免只用自己的节奏解释对方。${strength === '偏旺' ? '你需要给对方更多空间，也给自己设置柔性的反馈机制，否则容易不知不觉变成“我都是为你好”。' : strength === '偏弱' ? '你需要更清楚地表达需求，少用过度体谅来换稳定，否则容易表面没事、内里委屈。' : '你的优势是能在自我和配合之间找到平衡，但也要避免什么都讲道理，忽略真实感受。'}有利元素为${usefulText}，适合选择能带来成长感和稳定感的人际场域。`,
    health: `${ELEMENT_HEALTH[dayElement]}。这不是医学诊断，而是从五行偏性看你的压力出口。${dominantElement}偏显时，身体和情绪容易沿着同一条通道过度使用；如果某一阶段明显感到卡顿，先从睡眠、运动、饮食、工作边界调整，不要把所有压力都解释成“运不好”。`,
    growth: `接下来最适合做三件事：把重要目标拆成 90 天节奏；固定一个能补${usefulText}的生活习惯；把优势沉淀成作品、流程或资产。你的命局不是没有机会，而是需要减少能量外泄，把“想做、能做、值得做”收束到同一条主线。命盘像地图，真正改变结果的仍然是连续行动。`,
  };

  return {
    title: SECTION_TITLES[section],
    body: bodyBySection[section],
    tags: [dayElement, ...usefulElements, strength].slice(0, 4),
  };
}

function getDaYunPeriods(input: BirthInput, eightChar: EightChar): BaziReading['daYun'] {
  const genderFlag: 0 | 1 = input.gender === 'male' ? 1 : 0;
  const yun = eightChar.getYun(genderFlag);
  const currentYear = new Date().getFullYear();
  const periods: DaYunPeriod[] = yun
    .getDaYun(9)
    .filter((period) => period.getGanZhi())
    .map((period: DaYun) => ({
      ganZhi: period.getGanZhi(),
      startYear: period.getStartYear(),
      endYear: period.getEndYear(),
      startAge: period.getStartAge(),
      endAge: period.getEndAge(),
      xunKong: period.getXunKong(),
      isCurrent: currentYear >= period.getStartYear() && currentYear <= period.getEndYear(),
    }));

  return {
    startText: `${yun.getStartYear()}年${yun.getStartMonth()}个月${yun.getStartDay()}天后起运`,
    direction: yun.isForward() ? '顺行' : '逆行',
    periods,
  };
}

function getGanZhiYear(year: number) {
  return Solar.fromYmdHms(year, 7, 1, 12, 0, 0).getLunar().getEightChar().getYear();
}

function getElementFromGanZhi(ganZhi: string) {
  return STEM_ELEMENT[ganZhi[0]];
}

function createDomainReport(params: {
  key: DeepDomainReport['key'];
  title: string;
  conclusion: string;
  evidence: string[];
  realWorld: string[];
  risks: string[];
  actions: string[];
}): DeepDomainReport {
  return params;
}

function createDeepDiveReport(args: {
  input: BirthInput;
  pillars: Pillar[];
  dayElement: ElementName;
  strength: '偏弱' | '中和' | '偏旺';
  usefulElements: ElementName[];
  elementScores: ElementScore[];
  highlightedTenGods: string[];
  daYun: BaziReading['daYun'];
}): DeepDiveReport {
  const { pillars, dayElement, strength, usefulElements, elementScores, highlightedTenGods, daYun } = args;
  const tenGodCounts = countTenGods(pillars);
  const dayPillar = pillars.find((pillar) => pillar.key === 'day')!;
  const monthPillar = pillars.find((pillar) => pillar.key === 'month')!;
  const timePillar = pillars.find((pillar) => pillar.key === 'time')!;
  const dominant = elementScores[0];
  const weakest = elementScores[elementScores.length - 1];
  const usefulText = usefulElements.join('、');
  const hasWealth = hasAnyGod(tenGodCounts, ['正财', '偏财']);
  const hasOfficer = hasAnyGod(tenGodCounts, ['正官', '七杀']);
  const hasOutput = hasAnyGod(tenGodCounts, ['食神', '伤官']);
  const hasResource = hasAnyGod(tenGodCounts, ['正印', '偏印']);
  const hasPeer = hasAnyGod(tenGodCounts, ['比肩', '劫财']);
  const structureName = hasOfficer && hasResource
    ? '官印相生取向'
    : hasOutput && hasWealth
      ? '食伤生财取向'
      : hasWealth
        ? '财星经营取向'
        : hasResource
          ? '印星护身取向'
          : hasPeer
            ? '比劫争衡取向'
            : '复合平衡取向';
  const currentLuck = daYun.periods.find((period) => period.isCurrent) ?? null;

  const domains: DeepDomainReport[] = [
    createDomainReport({
      key: 'summary',
      title: '命局总论',
      conclusion: `此局为${dayPillar.stem}${dayPillar.branch}日，${STEM_POLARITY[dayPillar.stem]}${dayElement}日主，月令${monthPillar.ganZhi}为提纲，整体判断为${strength}，结构近于“${structureName}”。`,
      evidence: [
        `日干${dayPillar.stem}为命局之我，五行为${dayElement}；月柱${monthPillar.ganZhi}主令气，是判断旺衰与格局的第一层依据。`,
        `五行分布中${dominant.element}约${Math.round(dominant.ratio * 100)}%，${weakest.element}约${Math.round(weakest.ratio * 100)}%，说明天赋与短板都有明确落点。`,
        `十神较显者为${highlightedTenGods.join('、') || '分布较散'}，成事方式不可只看单一标签，要看角色组合。`,
      ],
      realWorld: [
        `你做事最怕主线不清，一旦方向清楚，反而能把复杂信息收束成长期能力。`,
        `命局给出的课题不是“有没有机会”，而是机会来时能否筛选、承接、沉淀。`,
      ],
      risks: [
        `${dominant.element}过显时容易形成惯性反应，越忙越按旧方式处理问题。`,
        `${weakest.element}不足处容易成为现实短板，需要靠环境、训练和合作补上。`,
      ],
      actions: [
        `优先补${usefulText}：从作息、空间、合作对象、学习方向四处入手。`,
        `所有重大选择先问：能否减少内耗、增强主线、沉淀资产。`,
      ],
    }),
    createDomainReport({
      key: 'career',
      title: '事业格局详批',
      conclusion: hasOfficer
        ? '事业上有规则、职位、责任线索，适合在体系、平台或专业资质中建立位置。'
        : hasOutput
          ? '事业上重输出与表达，适合产品、内容、技术、咨询、运营增长等能展示能力的路径。'
          : '事业格局更看长期积累，宜先做深一项可复用能力，再谈扩张。',
      evidence: [
        `事业看官杀、印星、食伤与月柱。此局月柱为${monthPillar.ganZhi}，月干十神为${monthPillar.stemTenGod}。`,
        hasOfficer ? '官杀出现，说明压力、规则、职位或权责关系是事业主题之一。' : '官杀不算最显，事业不宜只靠职位头衔，应重能力与结果。',
        hasResource ? '印星出现，利学习、证照、系统训练、贵人提携。' : '印星不显时，学习体系和外部支持需要后天主动建立。',
        hasOutput ? '食伤出现，利表达、输出、技术转化和产品化。' : '食伤不显时，要刻意训练表达、展示和作品沉淀。',
      ],
      realWorld: [
        `适合的工作不是单纯“稳定”或“自由”，而是能持续升级能力、积累信用和形成复利的位置。`,
        `若当前工作只消耗时间，不产生作品、方法、人脉或资质，就不算真正顺命局。`,
      ],
      risks: [
        hasPeer ? '比劫显时，合作与同辈竞争会影响事业节奏，需先定责权利。' : '竞争不是最大问题，主线分散才是更大的消耗。',
        `逢${dominant.element}过旺阶段，容易急于推进或固守旧路径，需防判断过快。`,
      ],
      actions: [
        '建立一个可展示的专业资产：作品集、流程模板、案例库、方法论或证照。',
        '重要合作先写清交付、分账、退出机制，减少人情化消耗。',
      ],
    }),
    createDomainReport({
      key: 'wealth',
      title: '财运资源详批',
      conclusion: hasWealth
        ? '财星有根，赚钱多与资源经营、现实责任、项目机会有关，但也要防财来财去。'
        : '财星不是最显，财富更宜从专业能力、长期复利和稳定现金流中来。',
      evidence: [
        `财运看正财、偏财，也看食伤能否生财、比劫是否夺财。此局财星状态：${hasWealth ? '有显现' : '不算最显'}。`,
        hasOutput ? '食伤出现，说明可通过表达、技术、产品、内容或服务转化为收入。' : '食伤不显，变现不能只靠灵感，需靠稳定交付与资源配置。',
        hasPeer ? '比劫出现，朋友、人情、合伙会影响钱财流动。' : '比劫不重，财务最大风险多来自节奏与判断，而非同辈分夺。',
      ],
      realWorld: [
        '你适合把钱看成系统，而不是情绪奖励：预算、复盘、现金流、合同都要前置。',
        '副业或项目可以做，但必须符合主线能力，不宜到处试水。',
      ],
      risks: [
        '不宜把趋势判断包装成确定收益，也不宜因短期机会打乱长期现金流。',
        hasPeer ? '合伙、借贷、人情消费要谨慎，越熟越要写清规则。' : '看似稳妥的低效投入，也会慢慢吞掉复利。',
      ],
      actions: [
        '设置三层账户：生活现金流、长期储备、试错资金，互不挪用。',
        '任何投资或项目先写下最坏结果、退出条件和资金上限。',
      ],
    }),
    createDomainReport({
      key: 'relationship',
      title: '婚恋关系详批',
      conclusion: '关系上最重要的不是桃花多少，而是能否在回应、边界和共同建设之间取得平衡。',
      evidence: [
        `关系看日支夫妻宫，此局日支为${dayPillar.branch}，藏干${dayPillar.hiddenStems.join('、')}，对应十神为${dayPillar.branchTenGods.join('、') || '不显'}。`,
        `日主${strength}会影响相处姿态：${strength === '偏旺' ? '容易主见较强，需要给关系留弹性' : strength === '偏弱' ? '容易先顾对方，需要清楚表达需求' : '较能调和，但也要避免长期压抑真实感受'}。`,
        hasWealth ? '财星出现，现实经营、承诺、物质安排会进入关系议题。' : '财星不算突出，关系更看情绪回应与价值同频。',
      ],
      realWorld: [
        '你适合能一起建设生活的人，不适合长期含糊、失信或只消耗不成长的关系。',
        '关系出现问题时，常不是没有感情，而是节奏、边界、责任分配没讲清。',
      ],
      risks: [
        '不宜用沉默测试对方，也不宜把“我能扛”当成亲密关系里的常态。',
        '逢冲合刑害被流年引动时，容易把旧问题翻出来，需要提前沟通。',
      ],
      actions: [
        '把关系里的钱、时间、家务、家人边界说清楚，不靠猜。',
        '遇到冲突先描述事实和需求，少做人格判断。',
      ],
    }),
    createDomainReport({
      key: 'health',
      title: '身心健康详批',
      conclusion: `健康倾向主要看五行偏性与压力出口。此局${dominant.element}较显，${weakest.element}较弱，宜补节律，不宜长期硬耗。`,
      evidence: [
        `五行偏性：${elementScores.map((item) => `${item.element}${Math.round(item.ratio * 100)}%`).join('、')}。`,
        `${dayElement}日主本身对应的调养重点：${ELEMENT_HEALTH[dayElement]}。`,
        `时柱${timePillar.ganZhi}看后期节律，带${timePillar.stemTenGod}，越往后越要重视输出与恢复的平衡。`,
      ],
      realWorld: [
        '压力不会凭空消失，它会进入睡眠、饮食、情绪、肩颈、消化或拖延里。',
        '如果长期感到钝、累、烦，先看作息与边界，不要只解释成“运不好”。',
      ],
      risks: [
        '此处不是医学诊断；出现持续疼痛、失眠、焦虑或其他明显症状，应走正规医疗或心理支持。',
        `${dominant.element}过显时容易过度使用同一套反应，形成身体和情绪的单点压力。`,
      ],
      actions: [
        '固定睡眠窗口、低强度运动、减少夜间信息刺激，是最稳的补运动作。',
        `多接触${usefulText}对应的环境与习惯，例如空间整理、规律训练、学习系统或稳定合作。`,
      ],
    }),
    createDomainReport({
      key: 'family',
      title: '六亲关系详批',
      conclusion: '六亲不宜断绝对吉凶，应看关系模式。此局更适合用“边界清楚、责任适度、少替人兜底”的方式经营亲缘与人情。',
      evidence: [
        `年柱${pillars[0].ganZhi}看早年与家族背景，月柱${monthPillar.ganZhi}看成长环境与父母互动方式。`,
        hasResource ? '印星出现，母系、学习、保护与贵人议题较明显。' : '印星不显时，原生支持未必总能直接给到，需要自己建立系统。',
        hasWealth ? '财星出现，父亲、资源、现实责任与金钱安排较容易进入关系议题。' : '财星不重时，亲缘中的现实资源未必是主轴。',
        hasPeer ? '比劫出现，兄弟朋友、同辈竞争或人情往来会影响选择。' : '比劫不重，同辈影响不是最核心牵引。',
      ],
      realWorld: [
        '你需要分清“我愿意帮”和“我必须负责”，否则亲缘、人情、合作容易混在一起。',
        '适合建立温和但清晰的边界：能帮到哪里、不能帮什么、什么时候需要对方自己承担。',
      ],
      risks: [
        '不宜用内疚感做决定，也不宜为了维持表面和气长期压抑真实压力。',
        '亲友合作、金钱往来、共同投资尤其需要白纸黑字。',
      ],
      actions: [
        '把家庭责任列清单：必要责任、可协助事项、不可长期承担事项。',
        '重要沟通先讲现实安排，再讲情绪评价，冲突会少很多。',
      ],
    }),
  ];

  const deepLuck = currentLuck
    ? {
        ganZhi: currentLuck.ganZhi,
        years: `${currentLuck.startYear}-${currentLuck.endYear}`,
        ages: `${currentLuck.startAge}-${currentLuck.endAge}岁`,
        effect: `当前行${currentLuck.ganZhi}运，五行偏向${getElementFromGanZhi(currentLuck.ganZhi)}。此运要看它是否引动喜用${usefulText}，以及是否加重${dominant.element}之偏。`,
        bestFor: [
          '建立可复用能力与长期信用',
          '筛选合作关系，减少无效消耗',
          `主动补${usefulText}，把机会落实到主线`,
        ],
        caution: [
          '不宜同时开启太多方向',
          '不宜因短期情绪做长期承诺',
          '重要合作先定规则再投入感情',
        ],
      }
    : null;

  const futureYears = [0, 1, 2].map((offset) => {
    const year = new Date().getFullYear() + offset;
    const ganZhi = getGanZhiYear(year);
    const [yearStem, yearBranch] = ganZhi.split('');
    const stemElement = STEM_ELEMENT[yearStem];
    const branchMainStem = BRANCH_MAIN_STEM[yearBranch];
    const branchElement = STEM_ELEMENT[branchMainStem];
    const stemTenGod = getTenGodFromStems(dayPillar.stem, yearStem);
    const branchTenGod = getTenGodFromStems(dayPillar.stem, branchMainStem);
    const profile = TEN_GOD_PROFILE[stemTenGod];
    const branchProfile = TEN_GOD_PROFILE[branchTenGod];
    const usefulHits = [stemElement, branchElement].filter((element) => usefulElements.includes(element));
    const aligned = usefulHits.length > 0;
    const relationNotes = getAnnualBranchNotes(yearBranch, pillars);
    const relationText = relationNotes.length ? relationNotes.join('、') : '与原局地支未见直接六合、六冲或伏吟';
    const career = ['正官', '七杀'].includes(stemTenGod)
      ? '事业主线落在权责、规则和位置变化，适合争取明确职级或承担关键任务，但要把压力写进时间与资源预算。'
      : ['正印', '偏印'].includes(stemTenGod)
        ? '事业宜先做资质、研究、方法和专业壁垒；学习必须转成证书、案例、流程或作品，避免只输入不交付。'
        : ['食神', '伤官'].includes(stemTenGod)
          ? '事业利输出、产品、表达和创新，适合发布成果、优化流程；与上级或制度互动时要留证据、留余地。'
          : ['正财', '偏财'].includes(stemTenGod)
            ? '事业与客户、项目、资源和收入直接相连，适合谈商业结果；先定成本、回款与退出条件。'
            : '事业会突出自我主张、团队和同业竞争，适合建立个人品牌，但合作必须先定责权利。';
    const relationship = relationNotes.some((note) => note.includes('日柱'))
      ? `流年直接引动日柱，关系、自身状态和居所安排更容易发生变化；${relationText}。重要决定要把感受与现实条件分开讨论。`
      : ['正财', '偏财', '正官', '七杀'].includes(stemTenGod)
        ? `关系议题更重承诺、责任与现实安排。${relationText}，适合把时间、金钱、家庭边界说清楚。`
        : `关系重点在沟通节奏与相互支持。${relationText}，不要用沉默或忙碌代替回应。`;
    const money = ['正财', '偏财'].includes(stemTenGod)
      ? '财星透出，资源与交易机会会增加；正财重稳定兑现，偏财重项目筛选，均须设置预算、回款节点与风险上限。'
      : ['比肩', '劫财'].includes(stemTenGod)
        ? '比劫年份钱财容易受同伴、合伙和竞争牵动，谨慎借贷、担保、人情消费与口头分账。'
        : ['食神', '伤官'].includes(stemTenGod)
          ? '收入更适合从作品、技术、内容和服务转化而来，先验证付费需求，再扩投入。'
          : '财务宜守现金流，以专业积累和稳定配置为主，不因单一消息改变长期计划。';
    return {
      year,
      ganZhi,
      theme: aligned ? `${stemTenGod}主事 · 喜用有应` : `${stemTenGod}主事 · 调频守中`,
      focus: `${yearStem}属${stemElement}，为${stemTenGod}；${yearBranch}主气属${branchElement}，为${branchTenGod}。${profile?.drive ?? ''}${aligned ? `干支中见喜用${usefulHits.join('、')}，可以主动承接，但仍要看原局触发。` : `干支未直接补足喜用${usefulElements.join('、')}，宜借现实环境和选择做平衡。`}`,
      career,
      relationship,
      money,
      caution: `${profile?.shadow ?? '避免在信息不全时做长期承诺。'} 地支底层还带${branchTenGod}：${branchProfile?.shadow ?? '需观察长期环境变化。'} ${relationText}。`,
    };
  });

  return {
    thesis: `命局核心为${STEM_POLARITY[dayPillar.stem]}${dayElement}日主，${strength}，以${structureName}为主要取向。成事关键在于补${usefulText}，减少${dominant.element}过显带来的惯性。`,
    usefulGod: usefulElements[0],
    favorableGod: usefulElements.slice(1).join('、') || usefulElements[0],
    avoidGod: dominant.element,
    structureName,
    domains,
    currentLuck: deepLuck,
    futureYears,
  };
}

function getAnnualReading(dayElement: ElementName, usefulElements: ElementName[]) {
  const year = new Date().getFullYear();
  const annualEightChar = Solar.fromYmdHms(year, 7, 1, 12, 0, 0).getLunar().getEightChar();
  const ganZhi = annualEightChar.getYear();
  const yearElement = STEM_ELEMENT[annualEightChar.getYearGan()];
  const aligned = usefulElements.includes(yearElement);

  return {
    year,
    ganZhi,
    theme: aligned ? '顺势补能' : '主动调频',
    suggestion: aligned
      ? `${year} ${ganZhi}年带来的${yearElement}气对你较友好，适合推进长期计划、学习升级和关键关系经营。`
      : `${year} ${ganZhi}年${yearElement}气较明显，和你的优先补益元素不完全一致，建议降低无效消耗，先把节奏、现金流和身体状态稳住。`,
  };
}

export function createBaziReading(input: BirthInput): BaziReading {
  const { year, month, day, hour, minute } = parseDateTime(input);
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  const pillars: Pillar[] = ['year', 'month', 'day', 'time'].map((key) => createPillar(key as PillarKey, eightChar));
  const scores = scoreElements(pillars);
  const elementScores = normalizeScores(scores);
  const dayStem = eightChar.getDayGan();
  const dayElement = STEM_ELEMENT[dayStem];
  const strength = getDayMasterStrength(dayElement, scores);
  const usefulElements = getUsefulElements(dayElement, strength);
  const dominantElement = elementScores[0].element;
  const missingElements = elementScores.filter((item) => item.tone === '不足').map((item) => item.element);
  const highlightedTenGods = findHighlightedTenGods(pillars);
  const annual = getAnnualReading(dayElement, usefulElements);
  const portrait = createPortrait(input, pillars, dayElement, strength, usefulElements, elementScores, highlightedTenGods);
  const daYun = getDaYunPeriods(input, eightChar);
  const deepDive = createDeepDiveReport({
    input,
    pillars,
    dayElement,
    strength,
    usefulElements,
    elementScores,
    highlightedTenGods,
    daYun,
  });

  const advice = Object.fromEntries(
    (Object.keys(SECTION_TITLES) as ReadingSection[]).map((section) => [
      section,
      createAdvice(section, dayElement, usefulElements, strength, dominantElement, highlightedTenGods),
    ]),
  ) as Record<ReadingSection, ReadingAdvice>;

  return {
    input,
    generatedAt: new Date().toISOString(),
    solarText: solar.toYmdHms(),
    lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    zodiac: lunar.getAnimal(),
    pillars,
    dayMaster: {
      stem: dayStem,
      element: dayElement,
      polarity: STEM_POLARITY[dayStem],
      strength,
      summary: `${STEM_POLARITY[dayStem]}${dayElement}日主，${ELEMENT_PERSONA[dayElement]}。`,
    },
    elementScores,
    usefulElements,
    structure: {
      dominantElement,
      missingElements,
      highlightedTenGods,
      taiYuan: eightChar.getTaiYuan(),
      mingGong: eightChar.getMingGong(),
      shenGong: eightChar.getShenGong(),
    },
    portrait,
    deepDive,
    daYun,
    annual,
    advice,
  };
}

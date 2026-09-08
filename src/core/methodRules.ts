import type { Pillar, SchoolJudgment } from './types';
import { CYCLE, stemPhase } from './ganzhi';
import references from './classicReferences.json';

export function evaluateMethods(pillars: Pillar[], sources: SchoolJudgment[]): SchoolJudgment[] {
  const month = pillars[1];
  const day = pillars[2];
  const known = pillars.filter(p => p.known !== false);
  const visible = known.map(p => p.stem);
  const hidden = known.flatMap(p => p.hiddenStems);
  const monthMain = month.hiddenStems[0];
  const rooted = known.filter(p => p.hiddenStems.some(s => stemPhase(s) === stemPhase(day.stem)));
  const exposed = month.hiddenStems.filter(s => visible.includes(s));
  const cold = ['亥', '子', '丑'].includes(month.branch);
  const hot = ['巳', '午', '未'].includes(month.branch);
  const damp = ['亥', '子', '丑', '辰'].includes(month.branch);
  const regulators = cold ? ['丙', '丁'] : hot ? ['壬', '癸'] : damp ? ['丙', '丁', '戊'] : ['壬', '癸', '甲'];
  const activeRegulators = regulators.filter(s => visible.includes(s));
  const latentRegulators = regulators.filter(s => !visible.includes(s) && hidden.includes(s));
  const phaseLocations = CYCLE.map(element => ({ element, positions: known.filter(p => [p.stem, ...p.hiddenStems].some(s => stemPhase(s) === element)).map(p => p.label) }));
  const gaps = phaseLocations.filter(item => !item.positions.length);
  const links = phaseLocations.flatMap((item, index) => item.positions.length && phaseLocations[(index + 1) % 5].positions.length ? [`${item.element}生${phaseLocations[(index + 1) % 5].element}`] : []);
  const judgments = {
    ziping: {
      conclusion: `${month.ganZhi}月以藏干${monthMain}、${month.branchTenGods[0]}为观察入口。${exposed.length ? `月令所藏${exposed.join('、')}透出，先核对透干的承接与制约。` : '月令藏干未直接透出，不把月支主气直接等同已经成立的格局。'}日主同类根见${rooted.map(p => p.label).join('、') || '无明确落点'}，取格仍要核实根气受冲与相神配合。`,
      evidence: [`月令藏干：${month.hiddenStems.join('、')}；实际透出：${exposed.join('、') || '无'}。`, `日主${day.stem}同类根分布：${rooted.map(p => `${p.label}${p.ganZhi}`).join('、') || '未见'}。`],
      counter: '只确认月令入口和透根条件；缺少相神保护、根受冲或透干被合绊时，不能据此断成格。',
      dependencies: ['month.hiddenStems', 'pillars.stem', 'pillars.hiddenStems'],
    },
    qiongtong: {
      conclusion: `${month.branch}月的季节底色为${cold ? '寒' : hot ? '热' : '过渡季节'}、${damp ? '偏湿' : '偏燥'}。温润调节候选${regulators.join('、')}中，${activeRegulators.length ? `${activeRegulators.join('、')}已透，先核对是否有根和来源` : '尚无透干落点，不能把候选直接当成已能发挥作用'}；${latentRegulators.length ? `${latentRegulators.join('、')}仅藏，属于潜在条件` : '藏干没有额外调节候选'}。调候先看气候与落点，不能按五行占比简单追加。`,
      evidence: [`月令${month.branch}；透干${visible.join('、')}。`, `调节候选透出${activeRegulators.join('、') || '无'}，仅藏${latentRegulators.join('、') || '无'}。`],
      counter: '这是季节与透藏初筛，不等同《穷通宝鉴》十干逐月完整取用；遇合绊、无根或原局已有充分调节时不能继续机械补益。',
      dependencies: ['month.branch', 'pillars.stem', 'pillars.hiddenStems'],
    },
    ditiansui: {
      conclusion: `以${month.branch}月主气${stemPhase(monthMain)}为起点，日主${day.stem}的同类根在${rooted.map(p => p.label).join('、') || '透藏未见'}。生化路径可观察到${links.join('、') || '尚无连续相生环节'}。${gaps.length ? `${gaps.map(g => g.element).join('、')}在透藏中未见，相关路径缺少中介落点` : '五行在透藏中均有落点，但有字不代表有力'}。是否通关还需核对中介是否得令、通根和受制，不能仅因相邻两行同时出现就判流通成功。`,
      evidence: phaseLocations.map(item => `${item.element}：${item.positions.join('、') || '透藏未见'}。`),
      counter: '路径只表示结构可能性；中介虚浮、失令或被制会使路径难以成立。合化需另核条件，本规则不自动判化。',
      dependencies: ['pillars.hiddenStems', 'pillars.stem'],
    },
    sanming: {
      conclusion: `以柱位定位证据：${known.map(p => `${p.label}${p.ganZhi}，${p.stemTenGod}坐${p.branchTenGods[0] || '日主'}`).join('；')}。月柱对应成长与社会环境，日支${day.branch}对应贴身关系位置；这些是原局位置描述，需要在实际岁运引动后才进一步讨论事件。`,
      evidence: known.map(p => `${p.label}藏${p.hiddenStems.join('、')}，对应${p.branchTenGods.join('、')}。`),
      counter: '柱位与十神不对应具体亲属的必然遭遇；没有岁运触发和经历核对，不输出事件年份或断言。',
      dependencies: ['pillars.key', 'pillars.stemTenGod', 'pillars.branchTenGods'],
    },
  };
  return sources.map(source => {
    const rule = judgments[source.key];
    const refKey = source.key === 'qiongtong' ? `qiongtong:${day.stem}:${['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'].indexOf(month.branch)}` : source.key;
    const citation = (references as Record<string, SchoolJudgment['citation']>)[refKey];
    return { ...source, citation, ruleId: `${source.key}.structure.v1`, dependencies: rule.dependencies, counterEvidence: [rule.counter], conclusion: rule.conclusion, evidence: rule.evidence, limitation: rule.counter };
  });
}

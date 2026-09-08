export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const CYCLE = ['木', '火', '土', '金', '水'] as const;
export function stemPhase(stem: string) { return CYCLE[Math.floor(STEMS.indexOf(stem) / 2)]; }
export function getTenGod(day: string, target: string) {
  if (!STEMS.includes(day) || !STEMS.includes(target)) return '-';
  const offset = (CYCLE.indexOf(stemPhase(target)) - CYCLE.indexOf(stemPhase(day)) + 5) % 5;
  const same = STEMS.indexOf(day) % 2 === STEMS.indexOf(target) % 2;
  return [['比肩', '劫财'], ['食神', '伤官'], ['偏财', '正财'], ['七杀', '正官'], ['偏印', '正印']][offset][same ? 0 : 1];
}
export function getSelfDiShi(stem: string, branch: string) {
  const starts = ['亥', '午', '寅', '酉', '寅', '酉', '巳', '子', '申', '卯'];
  const states = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  const index = STEMS.indexOf(stem);
  if (index < 0 || !BRANCHES.includes(branch)) return '-';
  return states[((index % 2 === 0 ? 1 : -1) * (BRANCHES.indexOf(branch) - BRANCHES.indexOf(starts[index])) + 24) % 12];
}

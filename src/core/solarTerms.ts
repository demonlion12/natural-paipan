import { Solar, type SolarDate } from 'lunar-javascript';

const terms = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
const dayMs = 86400000;
const beijingOffset = 8 * 3600000;

function instant(solar: SolarDate) {
  return Date.UTC(solar.getYear(), solar.getMonth() - 1, solar.getDay(), solar.getHour(), solar.getMinute(), solar.getSecond()) - beijingOffset;
}

export function getSolarTermMonths(year: number) {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error('岁运年份支持 1900–2100 年');
  const table = (y: number) => Solar.fromYmdHms(y, 7, 1, 12, 0, 0).getLunar().getJieQiTable();
  const current = table(year);
  const next = table(year + 1);
  return terms.map((term, index) => {
    const start = index === 11 ? next[term] : current[term];
    const end = index === 11 ? next['立春'] : index === 10 ? next['小寒'] : current[terms[index + 1]];
    // Evaluate after the boundary; the table's time uses China standard time.
    const after = new Date(instant(start) + beijingOffset + 1000);
    const ganZhi = Solar.fromYmdHms(after.getUTCFullYear(), after.getUTCMonth() + 1, after.getUTCDate(), after.getUTCHours(), after.getUTCMinutes(), after.getUTCSeconds()).getLunar().getEightChar().getMonth();
    return { term, ganZhi, start: instant(start), end: instant(end), startText: start.toYmdHms(), endText: end.toYmdHms() };
  });
}

export function getFlowDays(month: ReturnType<typeof getSolarTermMonths>[number]) {
  const first = Math.floor((month.start + beijingOffset) / dayMs) * dayMs;
  const last = Math.floor((month.end - 1 + beijingOffset) / dayMs) * dayMs;
  return Array.from({ length: Math.round((last - first) / dayMs) + 1 }, (_, index) => {
    const date = new Date(first + index * dayMs);
    const lunar = Solar.fromYmdHms(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 12, 0, 0).getLunar();
    return { label: lunar.getDayInChinese(), dateText: `${date.getUTCMonth() + 1}/${date.getUTCDate()}`, ganZhi: lunar.getEightChar().getDay(), partial: index === 0 || index === Math.round((last - first) / dayMs) };
  });
}

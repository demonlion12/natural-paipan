declare module 'lunar-javascript' {
  export const Solar: {
    fromYmdHms(
      year: number | string,
      month: number | string,
      day: number | string,
      hour: number | string,
      minute: number | string,
      second: number | string,
    ): SolarDate;
    fromYmd(year: number, month: number, day: number): SolarDate;
  };

  export const Lunar: {
    fromYmdHms(
      year: number | string,
      month: number | string,
      day: number | string,
      hour: number | string,
      minute: number | string,
      second: number | string,
    ): LunarDate;
  };

  export interface SolarDate {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    getLunar(): LunarDate;
    toYmd(): string;
    toYmdHms(): string;
    toFullString(): string;
  }

  export interface LunarDate {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getAnimal(): string;
    getYearShengXiao(): string;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getEightChar(): EightChar;
    getSolar(): SolarDate;
    toFullString(): string;
  }

  export interface EightChar {
    setSect(sect: 1 | 2): void;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearGan(): string;
    getMonthGan(): string;
    getDayGan(): string;
    getTimeGan(): string;
    getYearZhi(): string;
    getMonthZhi(): string;
    getDayZhi(): string;
    getTimeZhi(): string;
    getYearHideGan(): string[];
    getMonthHideGan(): string[];
    getDayHideGan(): string[];
    getTimeHideGan(): string[];
    getYearShiShenGan(): string;
    getMonthShiShenGan(): string;
    getDayShiShenGan(): string;
    getTimeShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonthShiShenZhi(): string[];
    getDayShiShenZhi(): string[];
    getTimeShiShenZhi(): string[];
    getYearWuXing(): string;
    getMonthWuXing(): string;
    getDayWuXing(): string;
    getTimeWuXing(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYearDiShi(): string;
    getMonthDiShi(): string;
    getDayDiShi(): string;
    getTimeDiShi(): string;
    getYearXunKong(): string;
    getMonthXunKong(): string;
    getDayXunKong(): string;
    getTimeXunKong(): string;
    getTaiYuan(): string;
    getMingGong(): string;
    getShenGong(): string;
    getYun(gender: 0 | 1, sect?: 1 | 2): Yun;
    toString(): string;
  }

  export interface Yun {
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getStartHour(): number;
    getStartSolar(): SolarDate;
    isForward(): boolean;
    getDaYun(count?: number): DaYun[];
  }

  export interface DaYun {
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
    getGanZhi(): string;
    getXunKong(): string;
  }
}

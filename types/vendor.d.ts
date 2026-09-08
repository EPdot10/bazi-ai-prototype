declare module 'lunar-javascript' {
  interface EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getDayGan(): string;
  }

  interface Lunar {
    getEightChar(): EightChar;
  }

  export class Solar {
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    getLunar(): Lunar;
  }
}

declare module 'tz-lookup' {
  export default function tzlookup(latitude: number, longitude: number): string;
}

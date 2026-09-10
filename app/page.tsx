'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  LoaderCircle,
  LockKeyhole,
  MapPin,
} from 'lucide-react';

import { BirthWheel, type BirthWheelValue } from '@/components/birth-wheel';
import { TurnstileField } from '@/components/turnstile-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TimeConfidence = 'exact' | 'approximate' | 'unknown';
type Gender = 'male' | 'female' | 'undisclosed';
type ReadingLocale = 'en' | 'zh';
type FeedbackChoice = 'Match' | 'Partial' | 'Miss';
type ResultView =
  | 'past'
  | 'character'
  | 'career'
  | 'relationships'
  | 'timing'
  | 'future'
  | 'method';
type LifeAreaKey = 'character' | 'career' | 'relationships' | 'timing';

interface LifeArea {
  headline: string;
  narrative: string;
  signals?: string[];
  guidance?: string;
  strengths?: string[];
  frictions?: string[];
  stressPattern?: string;
  possibleCost?: string;
  actions?: string[];
  basis: string;
  confidence: string;
}

interface FutureForecast {
  year: number;
  age?: number;
  theme: string;
  opportunity: string;
  pressure: string;
  riskScenario: string;
  triggerConditions: string[];
  earlySignals: string[];
  actions: string[];
  avoid: string[];
  basis: string;
  confidence: string;
  hourSensitive?: boolean;
}

interface Reading {
  resolvedPlace: {
    label: string;
    ianaTimeZone: string;
  };
  chart: {
    pillars: { year: string; month: string; day: string; hour?: string };
    dayMaster: string;
    elementBalance: Record<string, number>;
    birthTimeConfidence: TimeConfidence;
    calculationNotes: string[];
    timeAdjustment?: {
      minutes: number;
      adjustedLocalTime?: string;
      method: string;
    };
    dayMasterElement?: string;
    seasonalStrength?: string;
    strengthNotes?: string[];
    hiddenStems?: Record<string, string[]>;
    tenGods?: Record<string, string>;
    structuralRelations?: string[];
    eventCandidates?: Array<{
      year: number;
      age: number;
      window: string;
      themes: string[];
      domains?: string[];
      signature?: string;
      evidence: string[];
      confidence: string;
    }>;
    futureSignals?: Array<{
      year: number;
      opportunityScore: number;
      pressureScore: number;
      hourSensitive: boolean;
    }>;
    systems?: {
      bazi: 'calculated';
      ziwei: 'not-calculated';
      ziweiNote: string;
    };
  };
  interpretation: {
    summary: string;
    pastOverview: {
      characterSentence: string;
      trajectorySentence: string;
    };
    pastPatterns: Array<{
      period: string;
      headline: string;
      narrative: string;
      possibilities: string[];
      principle: string;
      basis: string;
      confidence: string;
    }>;
    insights: Array<{
      title: string;
      interpretation: string;
      basis: string;
      confidence: string;
    }>;
    lifeAreas: Record<LifeAreaKey, LifeArea>;
    futureOverview?: string;
    futureForecasts?: FutureForecast[];
    reflectionQuestions: string[];
    limitations: string;
  };
  interpretationSource: 'deepseek' | 'fixture';
  locale?: ReadingLocale;
  testFixture?: boolean;
  feedbackConsent?: boolean;
  modelNotice?: string;
}

const currentYear = new Date().getFullYear();
const initialBirthValue: BirthWheelValue = {
  year: currentYear - 28,
  month: 1,
  day: 1,
  hour: 12,
  minute: 30,
};
const elementNames: Record<string, string> = {
  wood: 'Wood',
  fire: 'Fire',
  earth: 'Earth',
  metal: 'Metal',
  water: 'Water',
};
const stemNames: Record<string, string> = {
  甲: 'Yang Wood',
  乙: 'Yin Wood',
  丙: 'Yang Fire',
  丁: 'Yin Fire',
  戊: 'Yang Earth',
  己: 'Yin Earth',
  庚: 'Yang Metal',
  辛: 'Yin Metal',
  壬: 'Yang Water',
  癸: 'Yin Water',
};
const resultTabs: Array<{ value: ResultView; label: string }> = [
  { value: 'past', label: 'Looking back' },
  { value: 'future', label: 'Looking ahead' },
  { value: 'character', label: 'Character' },
  { value: 'career', label: 'Career' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'timing', label: 'Timing' },
  { value: 'method', label: 'Method' },
];

const resultTabsZh: Array<{ value: ResultView; label: string }> = [
  { value: 'past', label: '回望过去' },
  { value: 'future', label: '展望未来' },
  { value: 'character', label: '性格' },
  { value: 'career', label: '事业' },
  { value: 'relationships', label: '关系' },
  { value: 'timing', label: '时机' },
  { value: 'method', label: '方法' },
];

const sessionReadingKey = 'ming:last-reading:v2';

const intakeCopy = {
  en: {
    stepLabels: ['Date', 'Time', 'City'],
    birthDate: 'Birth date',
    birthTime: 'Birth time',
    birthPlace: 'Birth place',
    setDate: 'Set the date.',
    setTime: 'Set the hour.',
    confirmCity: 'Confirm the city.',
    exactHint:
      'Exact is recommended. A precise birth time gives the clearest four-pillar reading; unknown is still valid.',
    timeQuestion: 'How certain is the time?',
    exact: 'Exact',
    approximate: 'Approximate',
    unknown: 'Unknown',
    unknownHint:
      'No hour will be guessed. The reading will use three pillars and lower confidence where time matters.',
    birthDateWheel: 'Use the birth wheel',
    typeDate: 'Type the date instead',
    birthTimeWheel: 'Use the birth wheel',
    typeTime: 'Type the time instead',
    confirm: 'Confirm',
    back: 'Back',
    continue: 'Continue',
    optionalName: 'Name · optional',
    optionalGender: 'Gender · optional',
    namePlaceholder: 'How should we address you?',
    male: 'Male',
    female: 'Female',
    undisclosed: 'Prefer not to say',
    placeOfBirth: 'Place of birth',
    cityHint: 'City is enough. Add the country when cities share a name.',
    locationConfirmed: 'Location confirmed',
    confirmThisCity: 'Confirm this city',
    confirmingCity: 'Confirming city',
    share:
      "I'm willing to share anonymous feedback to help us make this prototype better. This is optional.",
    provider:
      'To generate your reading, your birth date, city, and any optional details you provide are sent to our AI provider.',
    reveal: 'Reveal my reading',
    privacy:
      'Birth details are processed to create this reading and are not stored by this prototype. Interpretation is for reflection, not professional advice.',
  },
  zh: {
    stepLabels: ['日期', '时间', '城市'],
    birthDate: '出生日期',
    birthTime: '出生时间',
    birthPlace: '出生地点',
    setDate: '设定日期',
    setTime: '设定时间',
    confirmCity: '确认城市',
    exactHint:
      '建议输入 Exact time（准确时间）。时间越准确，四柱解读越清晰；不知道也可以继续。',
    timeQuestion: '出生时间的准确程度',
    exact: '准确',
    approximate: '大概',
    unknown: '未知',
    unknownHint:
      '不会猜测时辰。本次将使用三柱，并降低所有依赖时间的判断置信度。',
    birthDateWheel: '使用日期滚轮',
    typeDate: '改为手动输入日期',
    birthTimeWheel: '使用时间滚轮',
    typeTime: '改为手动输入时间',
    confirm: '确认',
    back: '返回',
    continue: '继续',
    optionalName: '姓名 · 选填',
    optionalGender: '性别 · 选填',
    namePlaceholder: '希望我们如何称呼你？',
    male: '男',
    female: '女',
    undisclosed: '不透露',
    placeOfBirth: '出生地点',
    cityHint: '填写城市即可；同名城市请补充国家或地区。',
    locationConfirmed: '地点已确认',
    confirmThisCity: '确认这个城市',
    confirmingCity: '正在确认城市',
    share: '我愿意分享匿名反馈，帮助我们改进这个原型。此项为自愿选择。',
    provider:
      '为了生成解读，你提供的生日、城市和其他选填信息会发送给 AI 服务。',
    reveal: '查看我的解读',
    privacy:
      '出生信息只用于生成本次解读，不会由本原型保存。解读仅供自我反思，不替代专业建议。',
  },
} as const;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function friendlyTimeZone(value: string) {
  if (value === 'Asia/Shanghai') return 'China Standard Time · UTC+8';
  return value.replaceAll('_', ' ');
}

export default function Home() {
  const [birthValue, setBirthValue] =
    useState<BirthWheelValue>(initialBirthValue);
  const [timeConfidence, setTimeConfidence] = useState<TimeConfidence>('exact');
  const [birthPlace, setBirthPlace] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('undisclosed');
  const [locale, setLocale] = useState<ReadingLocale>('en');
  const [confirmedPlace, setConfirmedPlace] = useState<
    Reading['resolvedPlace'] | null
  >(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [directInput, setDirectInput] = useState(false);
  const [dateInteracted, setDateInteracted] = useState(false);
  const [timeInteracted, setTimeInteracted] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [shareForImprovement, setShareForImprovement] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    let savedReading: Reading | null = null;
    try {
      const saved = window.sessionStorage.getItem(sessionReadingKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Reading;
        if (parsed?.chart && parsed?.interpretation && parsed?.resolvedPlace) {
          savedReading = parsed;
        }
      }
    } catch {
      // A blocked or malformed session entry should never prevent a new reading.
    } finally {
      queueMicrotask(() => {
        if (savedReading) {
          setReading(savedReading);
          if (savedReading.locale === 'zh' || savedReading.locale === 'en') {
            setLocale(savedReading.locale);
          }
        }
        setSessionRestored(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!sessionRestored) return;
    try {
      if (reading) {
        window.sessionStorage.setItem(
          sessionReadingKey,
          JSON.stringify(reading),
        );
      } else {
        window.sessionStorage.removeItem(sessionReadingKey);
      }
    } catch {
      // Storage is an enhancement; the reading remains available in memory.
    }
  }, [reading, sessionRestored]);

  function resetReading() {
    setReading(null);
    setHasStarted(false);
    setBirthValue(initialBirthValue);
    setTimeConfidence('exact');
    setBirthPlace('');
    setName('');
    setGender('undisclosed');
    setConfirmedPlace(null);
    setStep(1);
    setDirectInput(false);
    setDateInteracted(false);
    setTimeInteracted(false);
    setTurnstileToken('');
    setShareForImprovement(false);
    setError('');
  }

  async function confirmPlace() {
    setResolvingPlace(true);
    setError('');
    try {
      const response = await fetch('/api/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: birthPlace }),
      });
      const payload = (await response.json()) as {
        place?: Reading['resolvedPlace'];
        error?: string;
      };
      if (!response.ok || !payload.place) {
        throw new Error(payload.error ?? 'Unable to confirm this city.');
      }
      setConfirmedPlace(payload.place);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to confirm this city.',
      );
    } finally {
      setResolvingPlace(false);
    }
  }

  async function submitReading() {
    if (!confirmedPlace) {
      setError('Confirm the city before creating your reading.');
      return;
    }
    if (!timeConfidence) {
      setError('Choose how certain you are about the birth time.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: `${birthValue.year}-${pad(birthValue.month)}-${pad(birthValue.day)}`,
          birthTime:
            timeConfidence === 'unknown'
              ? ''
              : `${pad(birthValue.hour)}:${pad(birthValue.minute)}`,
          birthTimeConfidence: timeConfidence,
          birthPlace,
          name: name.trim() || undefined,
          gender,
          locale,
          turnstileToken,
          shareForImprovement,
        }),
      });
      const payload = (await response.json()) as Reading & { error?: string };
      if (!response.ok)
        throw new Error(payload.error ?? 'Unable to create reading.');
      setReading({
        ...payload,
        locale,
        testFixture: response.headers.has('X-Ming-Test-Fixture'),
        feedbackConsent: shareForImprovement,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to create reading.',
      );
    } finally {
      setLoading(false);
    }
  }

  const copy = locale === 'zh' ? intakeCopy.zh : intakeCopy.en;

  return (
    <main className="min-h-screen bg-[#f2efe8] text-[#181714]">
      <SiteHeader
        locale={locale}
        onLocaleChange={setLocale}
        onHome={resetReading}
        showLanguageToggle={!reading}
      />
      {reading ? (
        <ReadingResult
          reading={reading}
          locale={reading.locale ?? locale}
          onReset={resetReading}
        />
      ) : !hasStarted ? (
        <LandingPage locale={locale} onBegin={() => setHasStarted(true)} />
      ) : (
        <section className="mx-auto grid max-w-[1280px] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="hidden flex-col justify-between border-b border-black/10 px-6 py-14 sm:px-10 sm:py-20 lg:flex lg:min-h-[calc(100vh-5rem)] lg:border-r lg:border-b-0 lg:px-14 lg:py-24">
            <div className="animate-rise">
              <div className="hero-seal mb-10">
                <span className="font-serif text-3xl">命</span>
              </div>
              <p className="mb-7 text-[10px] font-semibold tracking-[0.24em] text-[#9d3027] uppercase">
                {locale === 'zh'
                  ? '四柱 · 一个出生时刻'
                  : 'Four pillars · one moment in time'}
              </p>
              <h1 className="max-w-xl font-serif text-[clamp(3.5rem,6.5vw,6.7rem)] leading-[0.9] font-medium tracking-[-0.055em]">
                {locale === 'zh'
                  ? '从故事开始的地方开始。'
                  : 'Begin where your story began.'}
              </h1>
              <p className="mt-8 max-w-md font-serif text-2xl leading-8 text-black/72">
                {locale === 'zh'
                  ? '看看中国传统命理如何描述你的人生结构。'
                  : 'Discover the patterns Chinese astrology sees in your life.'}
              </p>
              <p className="mt-4 max-w-md text-sm leading-7 text-black/55">
                {locale === 'zh'
                  ? '设定出生的日期与城市，MING 会把古老的中国方法转化为一份安静、现代的结构反思。'
                  : 'Set the moment and city of your birth. MING translates an old Chinese method into a quiet, modern reflection on the pattern you carry.'}
              </p>
              <div className="mt-10 flex items-center gap-3 text-[10px] font-semibold tracking-[0.16em] text-black/38 uppercase">
                <span className="h-px w-10 bg-[#9d3027]/55" />
                {locale === 'zh'
                  ? '不是预言 · 是一份可核对的结构'
                  : 'No prophecy · a pattern to consider'}
              </div>
            </div>

            <div className="animate-rise-delayed mt-16 space-y-4 border-t border-black/10 pt-6 text-xs text-black/42">
              {(locale === 'zh'
                ? [
                    '城市用于确认当地时区',
                    '不知道时辰也可以继续',
                    '一份解读覆盖性格、事业、关系与时机',
                  ]
                : [
                    'Your city confirms location and civil time zone',
                    'Unknown birth time remains a valid path',
                    'One reading covers character, work, love, and timing',
                  ]
              ).map((item) => (
                <p className="flex items-start gap-3" key={item}>
                  <Check className="mt-0.5 size-3.5 text-[#9d3027]" />
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="reading-intake-panel animate-rise-delayed px-6 py-10 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            <div className="mb-10 lg:hidden">
              <div className="hero-seal mb-7 size-16">
                <span className="font-serif text-2xl">命</span>
              </div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9d3027] uppercase">
                {locale === 'zh'
                  ? '一份安静的命盘解读'
                  : 'A quiet reading of your pattern'}
              </p>
              <p className="mt-3 max-w-sm font-serif text-3xl leading-9">
                {locale === 'zh'
                  ? '看看中国传统命理如何描述你的人生结构。'
                  : 'Discover the patterns Chinese astrology sees in your life.'}
              </p>
            </div>
            <form
              className="mx-auto max-w-xl"
              onSubmit={(event) => {
                event.preventDefault();
                void submitReading();
              }}
            >
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9d3027] uppercase">
                    0{step} ·{' '}
                    {step === 1
                      ? locale === 'zh'
                        ? '出生日期'
                        : 'Birth date'
                      : step === 2
                        ? locale === 'zh'
                          ? '出生时间'
                          : 'Birth time'
                        : locale === 'zh'
                          ? '出生地点'
                          : 'Birth place'}
                  </p>
                  <h2 className="mt-3 font-serif text-4xl tracking-[-0.035em] sm:text-5xl">
                    {step === 1
                      ? copy.setDate
                      : step === 2
                        ? copy.setTime
                        : copy.confirmCity}
                  </h2>
                </div>
                <span className="pb-2 text-[10px] font-semibold tracking-[0.16em] text-black/32 uppercase">
                  {locale === 'zh' ? `第 ${step} 步，共 3 步` : `${step} of 3`}
                </span>
              </div>

              <ol
                aria-label={
                  locale === 'zh' ? '出生信息步骤' : 'Birth reading steps'
                }
                className="mt-8 grid grid-cols-3 border-y border-black/10"
              >
                {copy.stepLabels.map((label, index) => {
                  const item = index + 1;
                  return (
                    <li
                      className={`relative flex items-center gap-2 py-3 text-[10px] font-semibold tracking-[0.14em] uppercase transition-colors ${item <= step ? 'text-[#9d3027]' : 'text-black/30'} ${index > 0 ? 'border-l border-black/10 pl-3 sm:pl-5' : ''}`}
                      key={label}
                    >
                      <span
                        className={`grid size-5 place-items-center rounded-full border text-[9px] transition-colors ${item <= step ? 'border-[#9d3027] bg-[#9d3027] text-white' : 'border-black/15 text-black/35'}`}
                      >
                        {item}
                      </span>
                      {label}
                    </li>
                  );
                })}
              </ol>

              {step === 1 ? (
                <div className="mt-8">
                  {directInput ? (
                    <label className="block" htmlFor="directDate">
                      <span className="field-label">{copy.birthDate}</span>
                      <Input
                        className="minimal-input"
                        id="directDate"
                        max={new Date().toISOString().slice(0, 10)}
                        onInput={(event) => {
                          const [year, month, day] = event.currentTarget.value
                            .split('-')
                            .map(Number);
                          if (year && month && day) {
                            setBirthValue((current) => ({
                              ...current,
                              year,
                              month,
                              day,
                            }));
                            setDateInteracted(true);
                          }
                        }}
                        type="date"
                        value={`${birthValue.year}-${pad(birthValue.month)}-${pad(birthValue.day)}`}
                      />
                    </label>
                  ) : (
                    <BirthWheel
                      mode="date"
                      onChange={setBirthValue}
                      onInteract={() => setDateInteracted(true)}
                      value={birthValue}
                    />
                  )}
                  <button
                    className="mt-4 text-xs text-black/40 underline decoration-black/20 underline-offset-4 hover:text-black/70"
                    onClick={() => setDirectInput((value) => !value)}
                    type="button"
                  >
                    {directInput ? copy.birthDateWheel : copy.typeDate}
                  </button>
                  <Button
                    className="glow-control mt-8 h-14 w-full rounded-none bg-[#1b1a17] text-xs tracking-[0.14em] uppercase hover:bg-[#9d3027]"
                    disabled={!dateInteracted}
                    onClick={() => setStep(2)}
                    type="button"
                  >
                    {copy.confirm} {birthValue.year} · {pad(birthValue.month)} ·{' '}
                    {pad(birthValue.day)}
                    <ArrowUpRight className="size-4" />
                  </Button>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="mt-8">
                  <fieldset>
                    <legend className="field-label">{copy.timeQuestion}</legend>
                    <p className="mb-4 text-xs leading-5 text-black/45">
                      {copy.exactHint}
                    </p>
                    <div
                      className="grid grid-cols-3 border border-black/12"
                      role="radiogroup"
                    >
                      {(
                        [
                          ['exact', copy.exact],
                          ['approximate', copy.approximate],
                          ['unknown', copy.unknown],
                        ] as const
                      ).map(([value, label]) => (
                        <label
                          className={`grid h-12 cursor-pointer place-items-center border-r border-black/10 text-xs font-semibold tracking-[0.08em] uppercase transition last:border-r-0 ${timeConfidence === value ? 'bg-[#1b1a17] text-white' : 'text-black/42 hover:bg-black/[0.03]'}`}
                          key={value}
                        >
                          <input
                            checked={timeConfidence === value}
                            className="sr-only"
                            name="time-confidence"
                            onChange={() => {
                              setTimeConfidence(value);
                              setTimeInteracted(value === 'unknown');
                              if (value === 'approximate')
                                setBirthValue((current) => ({
                                  ...current,
                                  minute: 30,
                                }));
                            }}
                            type="radio"
                            value={value}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {timeConfidence === 'unknown' ? (
                    <p className="mt-8 border-l-2 border-[#9d3027] pl-4 text-sm leading-6 text-black/52">
                      {copy.unknownHint}
                    </p>
                  ) : directInput ? (
                    <label className="mt-8 block" htmlFor="directTime">
                      <span className="field-label">{copy.birthTime}</span>
                      <Input
                        className="minimal-input"
                        id="directTime"
                        onInput={(event) => {
                          const [hour, minute] = event.currentTarget.value
                            .split(':')
                            .map(Number);
                          if (
                            Number.isInteger(hour) &&
                            Number.isInteger(minute)
                          ) {
                            setBirthValue((current) => ({
                              ...current,
                              hour,
                              minute,
                            }));
                            setTimeInteracted(true);
                          }
                        }}
                        step={timeConfidence === 'approximate' ? 3600 : 60}
                        type="time"
                        value={`${pad(birthValue.hour)}:${pad(timeConfidence === 'approximate' ? 0 : birthValue.minute)}`}
                      />
                    </label>
                  ) : (
                    <div className="mt-8">
                      <BirthWheel
                        approximateTime={timeConfidence === 'approximate'}
                        mode="time"
                        onChange={setBirthValue}
                        onInteract={() => setTimeInteracted(true)}
                        value={birthValue}
                      />
                    </div>
                  )}

                  {timeConfidence !== 'unknown' ? (
                    <button
                      className="mt-4 text-xs text-black/40 underline decoration-black/20 underline-offset-4 hover:text-black/70"
                      onClick={() => setDirectInput((value) => !value)}
                      type="button"
                    >
                      {directInput ? copy.birthTimeWheel : copy.typeTime}
                    </button>
                  ) : null}

                  <div className="mt-8 grid grid-cols-[0.8fr_1.2fr] gap-3">
                    <Button
                      className="h-14 rounded-none border-black/15 bg-transparent text-xs tracking-[0.12em] uppercase hover:bg-black/[0.03]"
                      onClick={() => setStep(1)}
                      type="button"
                      variant="outline"
                    >
                      {copy.back}
                    </Button>
                    <Button
                      className="glow-control h-14 rounded-none bg-[#1b1a17] text-xs tracking-[0.12em] uppercase hover:bg-[#9d3027]"
                      disabled={
                        !timeConfidence ||
                        (timeConfidence !== 'unknown' && !timeInteracted)
                      }
                      onClick={() => setStep(3)}
                      type="button"
                    >
                      {copy.continue} <ArrowUpRight className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="mt-10">
                  <div className="mb-8 grid gap-6 sm:grid-cols-[1.1fr_0.9fr]">
                    <label className="block" htmlFor="name">
                      <span className="field-label">{copy.optionalName}</span>
                      <Input
                        className="minimal-input"
                        id="name"
                        maxLength={80}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={copy.namePlaceholder}
                        value={name}
                      />
                    </label>
                    <fieldset>
                      <legend className="field-label">
                        {copy.optionalGender}
                      </legend>
                      <div
                        className="grid grid-cols-3 border border-black/12"
                        role="radiogroup"
                      >
                        {(
                          [
                            ['male', copy.male],
                            ['female', copy.female],
                            ['undisclosed', copy.undisclosed],
                          ] as const
                        ).map(([value, label]) => (
                          <label
                            className={`grid min-h-12 cursor-pointer place-items-center border-r border-black/10 px-1 text-center text-[10px] font-semibold tracking-[0.05em] uppercase transition last:border-r-0 ${gender === value ? 'bg-[#1b1a17] text-white' : 'text-black/42 hover:bg-black/[0.03]'}`}
                            key={value}
                          >
                            <input
                              checked={gender === value}
                              className="sr-only"
                              name="gender"
                              onChange={() => setGender(value)}
                              type="radio"
                              value={value}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                  <label className="block" htmlFor="birthPlace">
                    <span className="field-label">{copy.placeOfBirth}</span>
                    <span className="relative block">
                      <MapPin className="pointer-events-none absolute top-1/2 left-1 size-4 -translate-y-1/2 text-[#9d3027]" />
                      <Input
                        className="minimal-input !pr-0 !pl-8"
                        id="birthPlace"
                        onChange={(event) => {
                          setBirthPlace(event.target.value);
                          setConfirmedPlace(null);
                        }}
                        placeholder={
                          locale === 'zh'
                            ? '例如：墨尔本，澳大利亚'
                            : 'Melbourne, Australia'
                        }
                        required
                        value={birthPlace}
                      />
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-black/42">
                      {copy.cityHint}
                    </span>
                  </label>

                  {confirmedPlace ? (
                    <div className="mt-6 border border-black/10 bg-white/25 p-4">
                      <p className="text-xs font-semibold text-[#9d3027]">
                        {copy.locationConfirmed}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-black/58">
                        {confirmedPlace.label}
                        <br />
                        {friendlyTimeZone(confirmedPlace.ianaTimeZone)}
                      </p>
                    </div>
                  ) : (
                    <Button
                      className="glow-control mt-6 h-12 w-full rounded-none border-black/15 bg-transparent text-xs tracking-[0.11em] uppercase hover:bg-black/[0.03]"
                      disabled={!birthPlace.trim() || resolvingPlace}
                      onClick={() => void confirmPlace()}
                      type="button"
                      variant="outline"
                    >
                      {resolvingPlace ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          {copy.confirmingCity}
                        </>
                      ) : (
                        copy.confirmThisCity
                      )}
                    </Button>
                  )}

                  <div className="mt-7 space-y-4 border-t border-black/10 pt-6">
                    <label className="flex items-start gap-3 text-xs leading-5 text-black/52">
                      <input
                        checked={shareForImprovement}
                        className="mt-1 accent-[#9d3027]"
                        onChange={(event) =>
                          setShareForImprovement(event.target.checked)
                        }
                        type="checkbox"
                      />
                      <span>{copy.share}</span>
                    </label>
                    <p className="text-[11px] leading-5 text-black/38">
                      {copy.provider}
                    </p>
                    <TurnstileField onToken={setTurnstileToken} />
                  </div>

                  <div className="sticky bottom-0 -mx-6 mt-8 grid grid-cols-[0.7fr_1.3fr] gap-3 border-t border-black/10 bg-[#f2efe8]/95 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
                    <Button
                      className="h-14 rounded-none border-black/15 bg-transparent text-xs tracking-[0.12em] uppercase hover:bg-black/[0.03]"
                      onClick={() => setStep(2)}
                      type="button"
                      variant="outline"
                    >
                      {copy.back}
                    </Button>
                    <Button
                      className="glow-control h-14 rounded-none bg-[#1b1a17] text-xs tracking-[0.11em] uppercase hover:bg-[#9d3027]"
                      disabled={loading || !confirmedPlace}
                      type="submit"
                    >
                      {loading ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Reading your chart
                        </>
                      ) : (
                        <>
                          {copy.reveal} <ArrowUpRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}

              {error ? (
                <p
                  className="mt-6 border-l-2 border-[#9d3027] pl-4 text-sm leading-6 text-[#8b2b24]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-7 flex items-start gap-2.5 text-xs leading-5 text-black/40">
                <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
                <p>{copy.privacy}</p>
              </div>
            </form>
          </div>
        </section>
      )}
      {loading ? <ReadingLoading locale={locale} /> : null}
    </main>
  );
}

function LandingPage({
  locale,
  onBegin,
}: {
  locale: ReadingLocale;
  onBegin: () => void;
}) {
  const isZh = locale === 'zh';
  return (
    <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1280px] items-center gap-14 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:px-14 lg:py-24">
      <div className="animate-rise max-w-2xl">
        <p className="mb-7 text-[10px] font-semibold tracking-[0.24em] text-[#9d3027] uppercase">
          {isZh ? '四柱 · 一个出生时刻' : 'Four pillars · one moment in time'}
        </p>
        <h1 className="max-w-3xl font-serif text-[clamp(3.5rem,8vw,7.4rem)] leading-[0.88] font-medium tracking-[-0.06em]">
          {isZh ? '读懂时刻' : 'Read the pattern'}
          <span className="block text-[#9d3027]">
            {isZh ? '之下的结构。' : 'beneath the moment.'}
          </span>
        </h1>
        <p className="mt-9 max-w-xl font-serif text-2xl leading-9 text-black/70 sm:text-3xl sm:leading-10">
          {isZh
            ? '用出生日期、时间和城市，看看中国传统命理如何描述你的节奏与平衡。'
            : 'Discover what your birth date, time, and city reveal through an old Chinese system of timing and balance.'}
        </p>
        <p className="mt-5 max-w-lg text-sm leading-7 text-black/52">
          {isZh
            ? 'MING 将八字转化为清晰、个人化的反思，帮助你回看性格、事业、关系与已经走过的阶段。'
            : 'MING turns BaZi into a clear, personal reflection on your character, work, relationships, and the chapters you have already lived.'}
        </p>
        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Button
            className="glow-control h-14 rounded-none bg-[#1b1a17] px-7 text-xs tracking-[0.16em] uppercase hover:bg-[#9d3027]"
            onClick={onBegin}
            type="button"
          >
            {isZh ? '开始解读' : 'Begin your reading'}
            <ArrowUpRight className="size-4" />
          </Button>
          <span className="text-xs text-black/38">
            {isZh
              ? '首次基础解读免费 · 无需注册'
              : 'Free first reading · no account required'}
          </span>
        </div>
        <div className="mt-14 flex items-center gap-3 text-[10px] font-semibold tracking-[0.16em] text-black/38 uppercase">
          <span className="h-px w-10 bg-[#9d3027]/55" />
          {isZh
            ? '不是预言 · 是一份可核对的结构'
            : 'No prophecy · a pattern to consider'}
        </div>
      </div>

      <div className="animate-rise-delayed relative mx-auto w-full max-w-md lg:justify-self-end">
        <div className="absolute -inset-8 rounded-full bg-[#9d3027]/[0.04] blur-3xl" />
        <div className="relative border border-black/10 bg-white/30 p-6 shadow-[0_24px_80px_rgb(55_35_22_/_6%)] sm:p-8">
          <div className="flex items-center justify-between border-b border-black/10 pb-5">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9d3027] uppercase">
                {isZh ? '你的起点' : 'Your starting point'}
              </p>
              <p className="mt-2 font-serif text-2xl">
                {isZh ? '三个信息，一张命盘。' : 'Three details. One map.'}
              </p>
            </div>
            <span className="grid size-12 place-items-center border border-[#9d3027]/30 font-serif text-2xl text-[#9d3027]">
              命
            </span>
          </div>
          <div className="divide-y divide-black/10">
            {(isZh
              ? [
                  ['01', '日期', '故事开始的那一天'],
                  ['02', '时间', '一天之中的节奏'],
                  ['03', '城市', '确定当地时间的地点'],
                ]
              : [
                  ['01', 'Date', 'The day your story began'],
                  ['02', 'Time', 'The rhythm within the day'],
                  ['03', 'City', 'The place that sets the clock'],
                ]
            ).map(([number, title, description]) => (
              <div className="flex gap-5 py-6" key={number}>
                <span className="pt-1 text-[10px] font-semibold tracking-[0.16em] text-[#9d3027]">
                  {number}
                </span>
                <div>
                  <p className="font-serif text-xl">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-black/45">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-black/10 pt-5 text-xs leading-5 text-black/40">
            {isZh
              ? '准确时间会带来更多细节；不知道时辰也可以开始。'
              : 'Exact time gives more detail. Unknown is still a valid way to begin.'}
          </p>
        </div>
      </div>
    </section>
  );
}

function SiteHeader({
  locale,
  onLocaleChange,
  onHome,
  showLanguageToggle,
}: {
  locale: ReadingLocale;
  onLocaleChange: (locale: ReadingLocale) => void;
  onHome: () => void;
  showLanguageToggle: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 mx-auto flex h-20 max-w-[1280px] items-center justify-between border-b border-black/10 bg-[#f2efe8]/88 px-6 backdrop-blur-md sm:px-10 lg:px-14">
      <button
        aria-label={locale === 'zh' ? '返回首页' : 'Return to home'}
        className="group flex items-center gap-3"
        onClick={onHome}
        type="button"
      >
        <span className="grid size-8 place-items-center bg-[#9d3027] font-serif text-sm text-white shadow-[0_5px_18px_rgb(157_48_39_/_18%)]">
          命
        </span>
        <span className="font-serif text-xl tracking-[0.2em] transition-colors group-hover:text-[#9d3027]">
          MING
        </span>
      </button>
      <div className="flex items-center gap-4">
        <span className="hidden h-1.5 w-1.5 animate-pulse rounded-full bg-[#9d3027] sm:block" />
        <p className="hidden text-[10px] font-medium tracking-[0.2em] text-black/45 uppercase min-[560px]:block">
          {locale === 'zh' ? '内测版 · 四柱' : 'Private beta · Four Pillars'}
        </p>
        {showLanguageToggle ? (
          <div
            aria-label="Language"
            className="flex items-center border border-black/12 text-[10px] font-semibold tracking-[0.12em] uppercase"
          >
            {(['en', 'zh'] as const).map((value) => (
              <button
                aria-pressed={locale === value}
                className={`px-2.5 py-2 transition-colors ${locale === value ? 'bg-[#1b1a17] text-white' : 'text-black/42 hover:bg-black/[0.04]'}`}
                key={value}
                onClick={() => onLocaleChange(value)}
                type="button"
              >
                {value === 'en' ? 'EN' : '中文'}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

const loadingStages = [
  {
    character: '定',
    en: 'Confirming the place and local time',
    zh: '确认出生地点与当地时间',
  },
  {
    character: '曆',
    en: 'Aligning the date with the solar-term calendar',
    zh: '根据节气历校准日期',
  },
  {
    character: '柱',
    en: 'Forming the visible pillars',
    zh: '排出可见的四柱',
  },
  {
    character: '象',
    en: 'Tracing earlier turning points',
    zh: '寻找过去的重要转折',
  },
  {
    character: '解',
    en: 'Composing your complete reading',
    zh: '整理完整解读',
  },
] as const;

function ReadingLoading({ locale }: { locale: ReadingLocale }) {
  const [stage, setStage] = useState(0);
  const isZh = locale === 'zh';

  useEffect(() => {
    const timer = window.setInterval(
      () =>
        setStage((current) => Math.min(current + 1, loadingStages.length - 1)),
      2400,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#171612]/94 px-6 text-[#f2efe8] backdrop-blur-sm">
      <output aria-live="polite" className="sr-only">
        {isZh ? loadingStages[stage].zh : loadingStages[stage].en}
      </output>
      <div aria-hidden="true" className="w-full max-w-md text-center">
        <div className="relative mx-auto grid size-28 place-items-center animate-breathe">
          <span className="absolute inset-0 animate-spin rounded-full border border-[#f2efe8]/10 border-t-[#b94a3e] [animation-duration:3s]" />
          <span className="absolute inset-3 animate-[spin_5s_linear_infinite_reverse] rounded-full border border-dashed border-[#f2efe8]/16" />
          <span className="font-serif text-4xl text-[#d86a5d] transition-all duration-700">
            {loadingStages[stage].character}
          </span>
        </div>
        <p className="mt-9 text-[10px] font-semibold tracking-[0.22em] text-[#d86a5d] uppercase">
          {isZh
            ? `正在读取结构 · 0${stage + 1}`
            : `Reading the pattern · 0${stage + 1}`}
        </p>
        <p className="mt-4 font-serif text-3xl leading-9">
          {isZh ? loadingStages[stage].zh : loadingStages[stage].en}
        </p>
        <div className="mt-9 h-px overflow-hidden bg-white/10">
          <div
            className="h-full bg-[#b94a3e] transition-all duration-700 animate-draw"
            style={{ width: `${((stage + 1) / loadingStages.length) * 100}%` }}
          />
        </div>
        <p className="mt-5 text-xs leading-5 text-white/35">
          {isZh
            ? '先由系统完成命盘计算，再由模型解读已核验的结构。'
            : 'The chart is calculated first. The model interprets only the verified pattern.'}
        </p>
      </div>
    </div>
  );
}

function ReadingResult({
  reading,
  locale,
  onReset,
}: {
  reading: Reading;
  locale: ReadingLocale;
  onReset: () => void;
}) {
  const [view, setView] = useState<ResultView>('past');
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const tabs = locale === 'zh' ? resultTabsZh : resultTabs;

  function moveTab(direction: -1 | 1) {
    const currentIndex = tabs.findIndex((tab) => tab.value === view);
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    setView(next.value);
    requestAnimationFrame(() =>
      document.getElementById(`reading-tab-${next.value}`)?.focus(),
    );
  }

  return (
    <div className="animate-rise mx-auto max-w-[1180px] px-6 py-12 sm:px-10 sm:py-16">
      <div className="mb-8 flex items-center justify-between gap-4">
        <button
          className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-black/42 uppercase transition hover:gap-3 hover:text-[#9d3027]"
          onClick={onReset}
          type="button"
        >
          <ArrowLeft className="size-3.5" />{' '}
          {locale === 'zh' ? '重新开始' : 'New reading'}
        </button>
        {reading.testFixture ? (
          <span className="rounded-full border border-[#9d3027]/30 bg-[#9d3027]/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-[#9d3027] uppercase">
            {locale === 'zh' ? '测试虚构数据' : 'Test fixture data'}
          </span>
        ) : null}
      </div>

      <nav
        aria-label="Reading sections"
        className="result-tabs mb-10 flex snap-x snap-mandatory overflow-x-auto border-y border-black/10"
      >
        {tabs.map((tab) => (
          <button
            className={`glow-control shrink-0 snap-start border-b-2 px-4 py-4 text-[10px] font-semibold tracking-[0.08em] whitespace-nowrap uppercase transition first:pl-0 sm:text-xs ${
              view === tab.value
                ? 'border-[#9d3027] text-[#9d3027]'
                : 'border-transparent text-black/42 hover:text-black/70'
            }`}
            aria-controls="reading-panel"
            aria-selected={view === tab.value}
            id={`reading-tab-${tab.value}`}
            key={tab.value}
            onClick={() => setView(tab.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                moveTab(1);
              }
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                moveTab(-1);
              }
            }}
            role="tab"
            tabIndex={view === tab.value ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="result-hero grid gap-10 border-b border-black/10 pb-12 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9d3027] uppercase">
            Your elemental profile
          </p>
          <h1 className="relative z-10 mt-3 max-w-lg font-serif text-5xl tracking-[-0.04em] sm:text-6xl">
            {reading.chart.dayMaster} ·{' '}
            {stemNames[reading.chart.dayMaster] ?? 'Elemental'} Day Master
          </h1>
          <p className="mt-5 max-w-sm text-xs leading-5 text-black/45">
            {reading.resolvedPlace.label}
            <br />
            {friendlyTimeZone(reading.resolvedPlace.ianaTimeZone)}
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-[9px] font-semibold tracking-[0.1em] text-black/42 uppercase">
            {Object.entries(reading.chart.elementBalance).map(
              ([element, count]) => (
                <span
                  className="border border-black/10 px-2.5 py-1.5"
                  key={element}
                >
                  {elementNames[element]} {count}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-4 border-y border-black/10 py-5">
            {(['year', 'month', 'day', 'hour'] as const).map((key) => (
              <div key={key} className="text-center">
                <p className="text-[9px] tracking-[0.14em] text-black/35 uppercase">
                  {key}
                </p>
                <p className="mt-2 font-serif text-2xl">
                  {reading.chart.pillars[key] ?? '—'}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-xl font-serif text-2xl leading-8 sm:text-3xl sm:leading-10">
            {reading.interpretation.summary}
          </p>
          <p className="mt-5 text-[9px] tracking-[0.12em] text-black/32 uppercase">
            {locale === 'zh'
              ? reading.interpretationSource === 'deepseek'
                ? 'DeepSeek 解读 · 命盘由本地计算'
                : reading.interpretationSource === 'fixture'
                  ? '已保存测试结果 · 未调用 API'
                  : 'AI 解读不可用'
              : reading.interpretationSource === 'deepseek'
                ? 'DeepSeek interpretation · locally calculated chart'
                : reading.interpretationSource === 'fixture'
                  ? 'Saved test fixture · no API request'
                  : 'AI interpretation unavailable'}
          </p>
        </div>
      </section>

      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- WAI-ARIA tabs require a labelled tabpanel. */}
      <div
        aria-labelledby={`reading-tab-${view}`}
        className="mx-auto min-h-[520px] max-w-3xl animate-rise-delayed py-12"
        id="reading-panel"
        role="tabpanel"
        tabIndex={0}
      >
        {view === 'past' ? (
          <PastView reading={reading} locale={locale} />
        ) : null}
        {(['character', 'career', 'relationships', 'timing'] as const).includes(
          view as LifeAreaKey,
        ) ? (
          view === 'relationships' && !premiumUnlocked ? (
            <LockedLifeArea
              area={reading.interpretation.lifeAreas.relationships}
              locale={locale}
              onUnlock={() => setPremiumUnlocked(true)}
            />
          ) : (
            <LifeAreaView
              area={reading.interpretation.lifeAreas[view as LifeAreaKey]}
              areaKey={view as LifeAreaKey}
              locale={locale}
              showIntro={view !== 'timing'}
            />
          )
        ) : null}
        {view === 'future' ? (
          premiumUnlocked ? (
            <FutureView reading={reading} locale={locale} />
          ) : (
            <LockedFutureView
              reading={reading}
              locale={locale}
              onUnlock={() => setPremiumUnlocked(true)}
            />
          )
        ) : null}
        {view === 'method' ? (
          <MethodView reading={reading} locale={locale} />
        ) : null}
      </div>
    </div>
  );
}

function LockedLifeArea({
  area,
  locale,
  onUnlock,
}: {
  area: LifeArea;
  locale: ReadingLocale;
  onUnlock: () => void;
}) {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  function unlock() {
    if (code === '666') {
      setCodeError('');
      onUnlock();
      return;
    }
    setCodeError('That Jade Pass is not recognised.');
  }

  return (
    <section className="relative overflow-hidden border border-black/10">
      <div
        className="pointer-events-none select-none p-8 blur-[7px]"
        aria-hidden="true"
      >
        <LifeAreaView area={area} areaKey="relationships" locale={locale} />
      </div>
      <div className="absolute inset-0 grid place-items-center bg-[#f2efe8]/72 p-6 backdrop-blur-[2px]">
        <div className="w-full max-w-sm border border-black/12 bg-[#f2efe8] p-7 text-center shadow-[0_24px_70px_rgba(43,34,24,0.12)]">
          <span className="mx-auto grid size-10 place-items-center rounded-full border border-[#9d3027]/30 text-[#9d3027]">
            <LockKeyhole className="size-4" />
          </span>
          <p className="mt-5 text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
            {locale === 'zh' ? '私密章节' : 'Private chamber'}
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            {locale === 'zh' ? '解锁关系与连接' : 'Unlock Love & Bonds'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-black/50">
            {locale === 'zh'
              ? '输入 Jade Pass 查看完整的关系解读。'
              : 'Enter your Jade Pass to reveal the full relationship reading.'}
          </p>
          <label className="mt-6 block text-left" htmlFor="jadePass">
            <span className="field-label">
              {locale === 'zh' ? 'Jade Pass' : 'Jade Pass'}
            </span>
            <Input
              className="minimal-input text-center tracking-[0.3em]"
              id="jadePass"
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') unlock();
              }}
              placeholder={locale === 'zh' ? '输入密码' : 'Enter code'}
              value={code}
            />
          </label>
          <Button
            className="glow-control mt-5 h-12 w-full rounded-none bg-[#1b1a17] text-xs tracking-[0.12em] uppercase hover:bg-[#9d3027]"
            onClick={unlock}
            type="button"
          >
            {locale === 'zh' ? '打开章节' : 'Open the chamber'}
          </Button>
          {codeError ? (
            <p className="mt-3 text-xs text-[#9d3027]" role="alert">
              {codeError}
            </p>
          ) : null}
          <p className="mt-4 text-[10px] leading-4 text-black/30">
            {locale === 'zh'
              ? '原型测试专用。测试密码：666'
              : 'Prototype access only. Test code: 666'}
          </p>
        </div>
      </div>
    </section>
  );
}

function ReadingSummary({
  reading,
  locale,
}: {
  reading: Reading;
  locale: ReadingLocale;
}) {
  return (
    <section className="mb-12 max-w-3xl border-l-2 border-[#9d3027] pl-5 sm:pl-7">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-[#9d3027] uppercase">
        {locale === 'zh' ? '两句话总结' : 'Your reading in two lines'}
      </p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 sm:gap-8">
        <p className="font-serif text-2xl leading-8 text-black/80">
          {reading.interpretation.pastOverview.characterSentence}
        </p>
        <p className="font-serif text-2xl leading-8 text-black/60">
          {reading.interpretation.pastOverview.trajectorySentence}
        </p>
      </div>
    </section>
  );
}

function InsightStrip({
  reading,
  locale,
}: {
  reading: Reading;
  locale: ReadingLocale;
}) {
  return (
    <section className="mb-12 border-y border-black/10 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#9d3027] uppercase">
            {locale === 'zh' ? '独特结构线索' : 'Distinctive signatures'}
          </p>
          <p className="mt-2 text-sm leading-6 text-black/45">
            {locale === 'zh'
              ? '这些是从命盘结构推导出的可核对假设，不是星座式的通用标签。'
              : 'These are checkable hypotheses from the chart structure, not generic horoscope labels.'}
          </p>
        </div>
        <span className="hidden text-[9px] tracking-[0.12em] text-black/30 uppercase sm:block">
          {reading.interpretation.insights.length} signals
        </span>
      </div>
      <div className="mt-6 grid gap-px bg-black/10 sm:grid-cols-2">
        {reading.interpretation.insights.map((insight, index) => (
          <article
            className="bg-[#f2efe8] p-6"
            key={`${insight.title}-${index}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-serif text-2xl text-[#9d3027]">
                0{index + 1}
              </span>
              <span className="text-[9px] tracking-[0.1em] text-black/30 uppercase">
                {locale === 'zh'
                  ? `${insight.confidence} 置信度`
                  : `${insight.confidence} confidence`}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-semibold">{insight.title}</h2>
            <p className="mt-3 text-sm leading-6 text-black/58">
              {insight.interpretation}
            </p>
            <p className="mt-4 text-[10px] leading-5 text-black/32">
              {insight.basis}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PastView({
  reading,
  locale,
}: {
  reading: Reading;
  locale: ReadingLocale;
}) {
  const [matches, setMatches] = useState<Record<number, FeedbackChoice>>({});
  const [savedFeedback, setSavedFeedback] = useState(false);
  const feedbackKey = `ming:feedback:v1:${Object.values(reading.chart.pillars).join('')}`;

  useEffect(() => {
    if (!reading.feedbackConsent) return;
    try {
      const saved = window.localStorage.getItem(feedbackKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Record<string, FeedbackChoice>;
      const restored = Object.fromEntries(
        reading.interpretation.pastPatterns.flatMap((pattern, index) =>
          parsed[pattern.period] ? [[index, parsed[pattern.period]]] : [],
        ),
      ) as Record<number, FeedbackChoice>;
      queueMicrotask(() => {
        setMatches(restored);
        setSavedFeedback(Object.keys(restored).length > 0);
      });
    } catch {
      // Feedback is an enhancement; a malformed local entry is ignored.
    }
  }, [
    feedbackKey,
    reading.feedbackConsent,
    reading.interpretation.pastPatterns,
  ]);

  function recordFeedback(
    period: string,
    index: number,
    choice: FeedbackChoice,
  ) {
    setMatches((current) => ({ ...current, [index]: choice }));
    if (!reading.feedbackConsent) return;
    try {
      const saved = window.localStorage.getItem(feedbackKey);
      const current = saved
        ? (JSON.parse(saved) as Record<string, FeedbackChoice>)
        : {};
      current[period] = choice;
      window.localStorage.setItem(feedbackKey, JSON.stringify(current));
      setSavedFeedback(true);
      void fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          period,
          choice,
          locale,
        }),
      }).catch(() => {
        // Local storage remains the source of truth if the network is unavailable.
      });
    } catch {
      // Do not block the reading if storage is unavailable.
    }
  }

  function exportFeedback() {
    if (!reading.feedbackConsent || !Object.keys(matches).length) return;
    const records = reading.interpretation.pastPatterns.flatMap(
      (pattern, index) =>
        matches[index]
          ? [{ period: pattern.period, choice: matches[index] }]
          : [],
    );
    const blob = new Blob([JSON.stringify({ version: 1, records }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ming-calibration-feedback.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <ReadingSummary reading={reading} locale={locale} />
      <InsightStrip reading={reading} locale={locale} />
      <p className="text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
        {locale === 'zh' ? '先验证，再谈预测' : 'Recognition before prediction'}
      </p>
      <div className="mt-3 flex items-end justify-between gap-6 border-b border-black/10 pb-6">
        <div>
          <h2 className="font-serif text-4xl">
            {locale === 'zh'
              ? '这些阶段符合你的经历吗？'
              : 'Do these periods match?'}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-black/48">
            {locale === 'zh'
              ? '把每一段都当作待验证的假设。不符合也是有价值的信息，不需要勉强解释。'
              : 'Treat each as a hypothesis. A miss is useful information—not something the reading should explain away.'}
          </p>
        </div>
        <span className="hidden text-[9px] text-black/32 sm:block">
          {locale === 'zh'
            ? '符合 · 部分符合 · 不符合'
            : 'Match · Partial · Miss'}
        </span>
      </div>

      <div className="divide-y divide-black/10">
        {reading.interpretation.pastPatterns.map((pattern, patternIndex) => (
          <article
            className="grid gap-5 py-7 sm:grid-cols-[10rem_1fr]"
            key={`${pattern.period}-${pattern.headline}`}
          >
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em] text-[#9d3027] uppercase">
                {pattern.period}
              </p>
              <p className="mt-2 text-[9px] tracking-[0.1em] text-black/30 uppercase">
                {pattern.confidence} confidence
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{pattern.headline}</h3>
              <p className="mt-3 text-[15px] leading-7 text-black/62">
                {pattern.narrative}
              </p>
              <ul className="mt-3 space-y-2">
                {pattern.possibilities.map((possibility) => (
                  <li
                    className="grid grid-cols-[0.75rem_1fr] text-sm leading-6 text-black/58"
                    key={possibility}
                  >
                    <span className="text-[#9d3027]">·</span>
                    <span>{possibility}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-black/34">
                {pattern.principle || pattern.basis}
              </p>
              {pattern.basis && pattern.basis !== pattern.principle ? (
                <details className="mt-3 text-[10px] leading-5 text-black/32">
                  <summary className="cursor-pointer tracking-[0.08em] uppercase">
                    {locale === 'zh'
                      ? '查看计算依据'
                      : 'View calculation basis'}
                  </summary>
                  <p className="mt-2">{pattern.basis}</p>
                </details>
              ) : null}
              <div
                className="mt-5 flex flex-wrap gap-2"
                aria-label={`Does ${pattern.period} match your experience?`}
              >
                {(['Match', 'Partial', 'Miss'] as const).map((choice) => (
                  <button
                    aria-pressed={matches[patternIndex] === choice}
                    className={`glow-control border px-3 py-2 text-[10px] font-semibold tracking-[0.08em] uppercase transition ${matches[patternIndex] === choice ? 'border-[#9d3027] bg-[#9d3027] text-white' : 'border-black/12 text-black/38 hover:border-black/30'}`}
                    key={choice}
                    onClick={() =>
                      recordFeedback(pattern.period, patternIndex, choice)
                    }
                    type="button"
                  >
                    {locale === 'zh'
                      ? choice === 'Match'
                        ? '符合'
                        : choice === 'Partial'
                          ? '部分符合'
                          : '不符合'
                      : choice}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-7 text-[11px] leading-5 text-black/35">
        {reading.feedbackConsent
          ? savedFeedback
            ? locale === 'zh'
              ? '你的反馈已保存在本设备，并可匿名提交用于校准。不会上传生日、姓名或城市。'
              : 'Your feedback is saved on this device and may be submitted anonymously for calibration. Birth date, name, and city are not uploaded.'
            : locale === 'zh'
              ? '选择一段经历进行标记，帮助我们校准候选事件。'
              : 'Mark a period to help calibrate future event candidates.'
          : locale === 'zh'
            ? '你未同意分享反馈，因此这些标记不会保存。'
            : 'Feedback sharing was not enabled, so these marks will not be saved.'}
      </p>
      {reading.feedbackConsent && Object.keys(matches).length ? (
        <button
          className="mt-3 text-[10px] font-semibold tracking-[0.1em] text-[#9d3027] uppercase underline underline-offset-4"
          onClick={exportFeedback}
          type="button"
        >
          {locale === 'zh'
            ? '导出匿名校准样本'
            : 'Export anonymous calibration sample'}
        </button>
      ) : null}
    </section>
  );
}

function LockedFutureView({
  reading,
  locale,
  onUnlock,
}: {
  reading: Reading;
  locale: ReadingLocale;
  onUnlock: () => void;
}) {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  function unlock() {
    if (code === '666') {
      setCodeError('');
      onUnlock();
      return;
    }
    setCodeError(
      locale === 'zh'
        ? '无法识别这个 Jade Pass。'
        : 'That Jade Pass is not recognised.',
    );
  }

  return (
    <section className="relative overflow-hidden border border-black/10">
      <div
        className="pointer-events-none max-h-[620px] select-none overflow-hidden p-8 blur-[7px]"
        aria-hidden="true"
      >
        <FutureView reading={reading} locale={locale} />
      </div>
      <div className="absolute inset-0 grid place-items-center bg-[#f2efe8]/76 p-6 backdrop-blur-[2px]">
        <div className="w-full max-w-md border border-black/12 bg-[#f2efe8] p-7 text-center shadow-[0_24px_70px_rgba(43,34,24,0.12)]">
          <span className="mx-auto grid size-10 place-items-center rounded-full border border-[#9d3027]/30 text-[#9d3027]">
            <LockKeyhole className="size-4" />
          </span>
          <p className="mt-5 text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
            {locale === 'zh'
              ? '未来年份 · 测试解锁'
              : 'Future years · test access'}
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            {locale === 'zh'
              ? '查看机会、压力与风险'
              : 'See opportunity, pressure & risk'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-black/50">
            {locale === 'zh'
              ? '同一个 Jade Pass 会同时解锁关系与未来年份分析。'
              : 'The same Jade Pass unlocks both Relationships and future-year analysis.'}
          </p>
          <label className="mt-6 block text-left" htmlFor="futureJadePass">
            <span className="field-label">Jade Pass</span>
            <Input
              className="minimal-input text-center tracking-[0.3em]"
              id="futureJadePass"
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') unlock();
              }}
              placeholder={locale === 'zh' ? '输入密码' : 'Enter code'}
              value={code}
            />
          </label>
          <Button
            className="glow-control mt-5 h-12 w-full rounded-none bg-[#1b1a17] text-xs tracking-[0.12em] uppercase hover:bg-[#9d3027]"
            onClick={unlock}
            type="button"
          >
            {locale === 'zh' ? '解锁未来分析' : 'Unlock the outlook'}
          </Button>
          {codeError ? (
            <p className="mt-3 text-xs text-[#9d3027]" role="alert">
              {codeError}
            </p>
          ) : null}
          <p className="mt-4 text-[10px] leading-4 text-black/30">
            {locale === 'zh' ? '原型测试密码：666' : 'Prototype test code: 666'}
          </p>
        </div>
      </div>
    </section>
  );
}

function FutureView({
  reading,
  locale,
}: {
  reading: Reading;
  locale: ReadingLocale;
}) {
  const forecasts = reading.interpretation.futureForecasts ?? [];
  return (
    <section>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
        {locale === 'zh' ? '趋势，不是命令' : 'Signals, not certainties'}
      </p>
      <h2 className="mt-3 font-serif text-4xl tracking-[-0.03em]">
        {locale === 'zh'
          ? '未来几年的明暗两面。'
          : 'The light and friction ahead.'}
      </h2>
      <p className="mt-6 max-w-2xl text-sm leading-7 text-black/58">
        {reading.interpretation.futureOverview ??
          (locale === 'zh'
            ? '当前没有足够强的未来年份信号。较平静的年份更适合积累，而不是强行寻找事件。'
            : 'There are no strong supplied future-year signals. Quieter years are better read as room to consolidate, not as missing predictions.')}
      </p>

      {forecasts[0] ? (
        <div className="mt-8 grid gap-px border-y border-black/10 bg-black/10 sm:grid-cols-2">
          <div className="bg-[#f2efe8] p-5">
            <p className="text-[9px] font-semibold tracking-[0.14em] text-emerald-800 uppercase">
              {locale === 'zh' ? '先看机会' : 'The opening to watch'}
            </p>
            <p className="mt-2 text-sm leading-6 text-black/60">
              {forecasts[0].opportunity}
            </p>
          </div>
          <div className="bg-[#f2efe8] p-5">
            <p className="text-[9px] font-semibold tracking-[0.14em] text-[#9d3027] uppercase">
              {locale === 'zh' ? '先看压力' : 'The pressure to watch'}
            </p>
            <p className="mt-2 text-sm leading-6 text-black/60">
              {forecasts[0].pressure}
            </p>
          </div>
        </div>
      ) : null}

      {forecasts.length ? (
        <div className="mt-10 space-y-5">
          {forecasts.map((forecast) => (
            <article
              className="border border-black/10 bg-white/15 p-6 sm:p-8"
              key={forecast.year}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
                <div>
                  <p className="font-serif text-4xl text-[#9d3027]">
                    {forecast.year}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl">{forecast.theme}</h3>
                </div>
                <div className="text-right text-[9px] tracking-[0.1em] text-black/32 uppercase">
                  <p>
                    {forecast.age !== undefined
                      ? `${locale === 'zh' ? '约' : 'around age'} ${forecast.age}`
                      : ''}
                  </p>
                  <p>
                    {forecast.confidence}{' '}
                    {locale === 'zh' ? '置信度' : 'confidence'}
                  </p>
                  {forecast.hourSensitive ? (
                    <p className="mt-1 text-[#9d3027]">
                      {locale === 'zh' ? '时辰敏感' : 'hour-sensitive'}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="border-l-2 border-emerald-700/55 pl-4">
                  <p className="text-[9px] font-semibold tracking-[0.14em] text-emerald-800 uppercase">
                    {locale === 'zh' ? '机会' : 'Opportunity'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    {forecast.opportunity}
                  </p>
                </div>
                <div className="border-l-2 border-[#9d3027] pl-4">
                  <p className="text-[9px] font-semibold tracking-[0.14em] text-[#9d3027] uppercase">
                    {locale === 'zh' ? '压力与代价' : 'Pressure & cost'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    {forecast.pressure}
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-[#9d3027]/[0.055] p-5">
                <p className="text-[9px] font-semibold tracking-[0.14em] text-[#9d3027] uppercase">
                  {locale === 'zh'
                    ? '如果问题没有处理'
                    : 'If the pattern is left unattended'}
                </p>
                <p className="mt-2 text-sm leading-6 text-black/62">
                  {forecast.riskScenario}
                </p>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <ForecastList
                  title={locale === 'zh' ? '留意这些迹象' : 'Early signals'}
                  items={forecast.earlySignals}
                />
                <ForecastList
                  title={locale === 'zh' ? '可以主动做' : 'Actions with agency'}
                  items={forecast.actions}
                />
                <ForecastList
                  title={locale === 'zh' ? '触发条件' : 'Trigger conditions'}
                  items={forecast.triggerConditions}
                />
                <ForecastList
                  title={locale === 'zh' ? '尽量避免' : 'Try to avoid'}
                  items={forecast.avoid}
                />
              </div>
              <p className="mt-6 border-t border-black/8 pt-4 text-[10px] leading-5 text-black/30">
                {locale === 'zh' ? '依据：' : 'Basis: '}
                {forecast.basis}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ForecastList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[9px] font-semibold tracking-[0.13em] text-black/38 uppercase">
        {title}
      </p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-black/56">
        {items.map((item) => (
          <li key={item}>— {item}</li>
        ))}
      </ul>
    </div>
  );
}

const lifeAreaLeadCopy: Record<
  LifeAreaKey,
  {
    en: { eyebrow: string; strength: string; friction: string };
    zh: { eyebrow: string; strength: string; friction: string };
  }
> = {
  character: {
    en: {
      eyebrow: 'Character lens',
      strength: 'Your usable edge',
      friction: 'The cost to watch',
    },
    zh: {
      eyebrow: '性格视角',
      strength: '可以依靠的部分',
      friction: '需要留意的代价',
    },
  },
  career: {
    en: {
      eyebrow: 'Career lens',
      strength: 'Where you can compound',
      friction: 'Where effort leaks',
    },
    zh: {
      eyebrow: '事业视角',
      strength: '可以积累的地方',
      friction: '精力容易流失的地方',
    },
  },
  relationships: {
    en: {
      eyebrow: 'Relationship lens',
      strength: 'What creates trust',
      friction: 'What can erode it',
    },
    zh: {
      eyebrow: '关系视角',
      strength: '建立信任的部分',
      friction: '可能消耗关系的部分',
    },
  },
  timing: {
    en: {
      eyebrow: 'Timing lens',
      strength: 'Current support',
      friction: 'Current pressure',
    },
    zh: { eyebrow: '时机视角', strength: '当前的支持', friction: '当前的压力' },
  },
};

function LifeAreaLead({
  area,
  areaKey,
  locale,
}: {
  area: LifeArea;
  areaKey: LifeAreaKey;
  locale: ReadingLocale;
}) {
  const copy = lifeAreaLeadCopy[areaKey][locale];
  const strength =
    area.strengths?.[0] ??
    area.signals?.[0] ??
    (locale === 'zh'
      ? '命盘提供了一条可继续核对的支持线索。'
      : 'The chart offers a supportive pattern worth checking.');
  const friction =
    area.frictions?.[0] ??
    area.signals?.[1] ??
    (locale === 'zh'
      ? '压力下的反应需要结合真实经历核对。'
      : 'Your response under pressure needs to be checked against lived experience.');

  return (
    <section className="mb-10 border-l-2 border-[#9d3027] pl-5 sm:pl-7">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-[#9d3027] uppercase">
        {copy.eyebrow}
      </p>
      <div className="mt-4 flex items-baseline justify-between gap-5">
        <h2 className="font-serif text-4xl tracking-[-0.03em]">
          {area.headline}
        </h2>
        <span className="shrink-0 text-[9px] tracking-[0.1em] text-black/30 uppercase">
          {locale === 'zh'
            ? `${area.confidence} 置信度`
            : `${area.confidence} confidence`}
        </span>
      </div>
      <div className="mt-6 grid gap-px bg-black/10 sm:grid-cols-2">
        <div className="bg-[#f2efe8] p-5">
          <p className="text-[9px] font-semibold tracking-[0.13em] text-emerald-800 uppercase">
            {copy.strength}
          </p>
          <p className="mt-2 text-sm leading-6 text-black/60">{strength}</p>
        </div>
        <div className="bg-[#f2efe8] p-5">
          <p className="text-[9px] font-semibold tracking-[0.13em] text-[#9d3027] uppercase">
            {copy.friction}
          </p>
          <p className="mt-2 text-sm leading-6 text-black/60">{friction}</p>
        </div>
      </div>
    </section>
  );
}

function LifeAreaView({
  area,
  areaKey,
  locale,
  showIntro = true,
}: {
  area: LifeArea;
  areaKey: LifeAreaKey;
  locale: ReadingLocale;
  showIntro?: boolean;
}) {
  const strengths = area.strengths ?? area.signals?.slice(0, 2) ?? [];
  const frictions = area.frictions ?? area.signals?.slice(2) ?? [];
  const actions = area.actions ?? (area.guidance ? [area.guidance] : []);
  return (
    <section>
      {showIntro ? (
        <LifeAreaLead area={area} areaKey={areaKey} locale={locale} />
      ) : (
        <div className="flex items-baseline justify-between gap-5">
          <h2 className="font-serif text-4xl tracking-[-0.03em]">
            {area.headline}
          </h2>
          <span className="shrink-0 text-[9px] tracking-[0.1em] text-black/30 uppercase">
            {locale === 'zh'
              ? `${area.confidence} 置信度`
              : `${area.confidence} confidence`}
          </span>
        </div>
      )}
      <p className="mt-8 font-serif text-2xl leading-9 text-black/78">
        {area.narrative}
      </p>
      <div className="mt-10 grid gap-px bg-black/10 sm:grid-cols-2">
        <div className="bg-[#f2efe8] p-6">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-emerald-800 uppercase">
            {locale === 'zh' ? '可以依靠的部分' : 'What works in your favour'}
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-black/58">
            {strengths.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
        </div>
        <div className="bg-[#f2efe8] p-6">
          <p className="text-[9px] font-semibold tracking-[0.14em] text-[#9d3027] uppercase">
            {locale === 'zh'
              ? '容易付出代价的部分'
              : 'Where friction can cost you'}
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-black/58">
            {frictions.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
        </div>
      </div>

      {area.stressPattern || area.possibleCost ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="border border-black/10 p-5">
            <p className="text-[9px] font-semibold tracking-[0.14em] text-black/35 uppercase">
              {locale === 'zh' ? '压力下的反应' : 'Under pressure'}
            </p>
            <p className="mt-2 text-sm leading-6 text-black/58">
              {area.stressPattern}
            </p>
          </div>
          <div className="border border-[#9d3027]/20 bg-[#9d3027]/[0.045] p-5">
            <p className="text-[9px] font-semibold tracking-[0.14em] text-[#9d3027] uppercase">
              {locale === 'zh' ? '可能的代价' : 'Possible cost'}
            </p>
            <p className="mt-2 text-sm leading-6 text-black/58">
              {area.possibleCost}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-9 border-l-2 border-[#9d3027] pl-5">
        <p className="text-[9px] font-semibold tracking-[0.15em] text-black/35 uppercase">
          {locale === 'zh' ? '可以主动做' : 'Actions with agency'}
        </p>
        <ul className="mt-2 space-y-2 text-sm leading-6 text-black/62">
          {actions.map((action) => (
            <li key={action}>— {action}</li>
          ))}
        </ul>
      </div>
      <p className="mt-8 text-[10px] leading-5 text-black/30">
        {locale === 'zh' ? '依据：' : 'Basis: '}
        {area.basis}
      </p>
    </section>
  );
}

function MethodView({
  reading,
  locale,
}: {
  reading: Reading;
  locale: ReadingLocale;
}) {
  return (
    <section>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
        {locale === 'zh' ? '计算与边界' : 'Calculation and limits'}
      </p>
      <h2 className="mt-3 font-serif text-4xl">
        {locale === 'zh' ? '这次解读使用了什么。' : 'What the reading used.'}
      </h2>

      <div className="mt-6 border border-black/10 bg-black/[0.015] p-5 text-sm leading-6 text-black/52">
        <p className="font-semibold text-black/65">
          {locale === 'zh' ? '系统范围' : 'System scope'}
        </p>
        <p className="mt-2">
          {locale === 'zh'
            ? '本次结果使用八字、节气、真太阳时、藏干、十神，以及过去与未来的流年冲合。紫微斗数已列为下一步实验方向，但在星盘事实层完成前，模型不会虚构宫位、星曜或四化。'
            : 'This reading uses BaZi, solar terms, apparent solar time, hidden stems, Ten Gods, and past and future annual relations. Ziwei Dou Shu is the next experimental direction, but the model cannot invent palaces, stars, or transformations before its chart layer exists.'}
        </p>
      </div>

      <div className="mt-8 grid gap-px bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-[#f2efe8] p-5">
          <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
            {locale === 'zh' ? '日主元素' : 'Day Master element'}
          </p>
          <p className="mt-2 font-serif text-2xl">
            {reading.chart.dayMasterElement ?? '—'}
          </p>
        </div>
        <div className="bg-[#f2efe8] p-5">
          <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
            {locale === 'zh' ? '季节强弱' : 'Seasonal strength'}
          </p>
          <p className="mt-2 font-serif text-2xl">
            {reading.chart.seasonalStrength ?? '—'}
          </p>
        </div>
        <div className="bg-[#f2efe8] p-5">
          <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
            {locale === 'zh' ? '事件候选' : 'Event candidates'}
          </p>
          <p className="mt-2 font-serif text-2xl">
            {reading.chart.eventCandidates?.length ?? 0}
          </p>
        </div>
        <div className="bg-[#f2efe8] p-5">
          <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
            {locale === 'zh' ? '未来强信号' : 'Future signals'}
          </p>
          <p className="mt-2 font-serif text-2xl">
            {reading.chart.futureSignals?.length ?? 0}
          </p>
        </div>
      </div>

      {reading.chart.systems ? (
        <div className="mt-7 grid gap-3 text-xs leading-5 sm:grid-cols-2">
          <div className="border border-emerald-800/20 bg-emerald-900/[0.035] p-4">
            <p className="font-semibold text-emerald-900">
              {locale === 'zh' ? '八字 · 已计算' : 'BaZi · calculated'}
            </p>
          </div>
          <div className="border border-black/10 p-4 text-black/46">
            <p className="font-semibold text-black/60">
              {locale === 'zh'
                ? '紫微斗数 · 实验准备中'
                : 'Ziwei Dou Shu · experimental, not calculated'}
            </p>
            <p className="mt-1">
              {locale === 'zh'
                ? '需要独立排星盘后才能进入解读。'
                : 'A separate star-chart calculation is required before interpretation.'}
            </p>
          </div>
        </div>
      ) : null}

      {reading.chart.strengthNotes?.length ? (
        <div className="mt-7 border-l-2 border-[#9d3027] pl-4">
          <p className="text-[9px] font-semibold tracking-[0.15em] text-black/35 uppercase">
            {locale === 'zh' ? '强弱说明' : 'Strength notes'}
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-black/52">
            {reading.chart.strengthNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {reading.chart.structuralRelations?.length ? (
        <div className="mt-7">
          <p className="text-[9px] font-semibold tracking-[0.15em] text-black/35 uppercase">
            {locale === 'zh' ? '命盘结构关系' : 'Natal structural relations'}
          </p>
          <p className="mt-2 text-sm leading-6 text-black/52">
            {reading.chart.structuralRelations.join(' · ')}
          </p>
        </div>
      ) : null}

      {reading.chart.hiddenStems ? (
        <details className="mt-7 border-y border-black/10 py-4">
          <summary className="cursor-pointer text-[10px] font-semibold tracking-[0.12em] text-black/48 uppercase">
            {locale === 'zh'
              ? '查看藏干与十神依据'
              : 'View hidden stems and Ten Gods'}
          </summary>
          <div className="mt-4 grid gap-5 text-xs leading-6 text-black/48 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-black/60">
                {locale === 'zh' ? '藏干' : 'Hidden stems'}
              </p>
              {Object.entries(reading.chart.hiddenStems).map(
                ([branch, stems]) => (
                  <p key={branch}>
                    {branch}: {stems.join(' · ')}
                  </p>
                ),
              )}
            </div>
            <div>
              <p className="font-semibold text-black/60">
                {locale === 'zh' ? '十神' : 'Ten Gods'}
              </p>
              {Object.entries(reading.chart.tenGods ?? {})
                .slice(0, 8)
                .map(([key, value]) => (
                  <p key={key}>
                    {key}: {value}
                  </p>
                ))}
            </div>
          </div>
        </details>
      ) : null}

      <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-y border-black/10 py-5 text-[10px] tracking-[0.08em] text-black/45 uppercase">
        {Object.entries(reading.chart.elementBalance).map(
          ([element, count]) => (
            <span key={element}>
              {elementNames[element]} {count}
            </span>
          ),
        )}
      </div>

      {reading.chart.birthTimeConfidence === 'unknown' ? (
        <p className="mt-7 border-l-2 border-[#9d3027] pl-4 text-sm leading-6 text-black/55">
          The hour pillar is intentionally omitted. The reading does not invent
          claims that require a birth hour.
        </p>
      ) : null}

      <ul className="mt-8 space-y-3">
        {reading.chart.calculationNotes.map((note) => (
          <li className="text-sm leading-6 text-black/52" key={note}>
            {note}
          </li>
        ))}
      </ul>

      {reading.chart.timeAdjustment ? (
        <div className="mt-8 grid gap-4 border border-black/10 p-5 sm:grid-cols-2">
          <div>
            <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
              {locale === 'zh' ? '真太阳时修正' : 'Apparent solar offset'}
            </p>
            <p className="mt-2 font-serif text-2xl">
              {reading.chart.timeAdjustment.minutes >= 0 ? '+' : ''}
              {reading.chart.timeAdjustment.minutes} min
            </p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
              {locale === 'zh' ? '修正后出生时间' : 'Adjusted birth time'}
            </p>
            <p className="mt-2 font-serif text-2xl">
              {reading.chart.timeAdjustment.adjustedLocalTime ??
                (locale === 'zh' ? '不可用' : 'Not available')}
            </p>
          </div>
        </div>
      ) : null}

      {reading.modelNotice ? (
        <p className="mt-8 text-[11px] leading-5 text-black/38">
          {reading.modelNotice}
        </p>
      ) : null}
      <p className="mt-8 border-t border-black/10 pt-6 text-[11px] leading-5 text-black/38">
        {reading.interpretation.limitations}
      </p>
    </section>
  );
}

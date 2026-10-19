'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  FileDown,
  LoaderCircle,
  LockKeyhole,
  MapPin,
} from 'lucide-react';

import { BirthWheel, type BirthWheelValue } from '@/components/birth-wheel';
import { TurnstileField } from '@/components/turnstile-field';
import { ReadingFollowUp } from '@/components/reading-follow-up';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ZiweiCalculation } from '@/lib/ziwei/calculate';

type TimeConfidence = 'exact' | 'approximate' | 'unknown';
type Gender = 'male' | 'female' | 'undisclosed';
type ReadingLocale = 'en' | 'zh';
type FeedbackChoice = 'Match' | 'Partial' | 'Miss' | 'CannotJudge';
type ResultView =
  | 'overview'
  | 'past'
  | 'character'
  | 'career'
  | 'relationships'
  | 'timing'
  | 'future'
  | 'method';
type LifeAreaKey = 'character' | 'career' | 'relationships' | 'timing';
type ReadingPhase = 'past' | 'future' | LifeAreaKey;

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
  ziweiChart?: ZiweiCalculation;
  interpretation: {
    summary: string;
    pastOverview: {
      characterSentence: string;
      trajectorySentence: string;
    };
    pastPatterns: Array<{
      period: string;
      headline: string;
      checkableEvent?: string;
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
    lifeAreas: Record<LifeAreaKey, LifeArea | null>;
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
  progress?: {
    completed: ReadingPhase[];
    active?: ReadingPhase;
    failed?: ReadingPhase[];
  };
}

type InterpretationPatch = Omit<
  Partial<Reading['interpretation']>,
  'lifeAreas'
> & {
  lifeAreas?: Partial<Record<LifeAreaKey, LifeArea>>;
};

interface PhaseResponse {
  resolvedPlace: Reading['resolvedPlace'];
  chart: Reading['chart'];
  ziweiChart?: Reading['ziweiChart'];
  interpretation: InterpretationPatch;
  phase: ReadingPhase;
  interpretationSource: 'deepseek' | 'fixture';
}

interface ReadingRequestPayload {
  birthDate: string;
  birthTime: string;
  birthTimeConfidence: TimeConfidence;
  birthPlace: string;
  name?: string;
  gender: Gender;
  locale: ReadingLocale;
  turnstileToken?: string;
  shareForImprovement: boolean;
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
  { value: 'overview', label: 'Overview' },
  { value: 'past', label: 'Looking back' },
  { value: 'future', label: 'Looking ahead' },
  { value: 'character', label: 'Character' },
  { value: 'career', label: 'Career' },
  { value: 'relationships', label: 'Love & Relationships' },
  { value: 'timing', label: 'Timing' },
  { value: 'method', label: 'Method' },
];

const resultTabsZh: Array<{ value: ResultView; label: string }> = [
  { value: 'overview', label: '总览' },
  { value: 'past', label: '回望过去' },
  { value: 'future', label: '展望未来' },
  { value: 'character', label: '性格' },
  { value: 'career', label: '事业' },
  { value: 'relationships', label: '恋爱与亲密关系' },
  { value: 'timing', label: '时机' },
  { value: 'method', label: '方法' },
];

function confidenceLabel(value: string, locale: ReadingLocale) {
  const labels: Record<string, { en: string; zh: string }> = {
    high: { en: 'Chart signal: stronger', zh: '命盘线索：强' },
    medium: { en: 'Chart signal: moderate', zh: '命盘线索：中' },
    low: { en: 'Chart signal: limited', zh: '命盘线索：弱' },
  };
  return (
    labels[value.toLowerCase()]?.[locale] ??
    (locale === 'zh' ? '未经验证' : 'Not validated')
  );
}

const readingPhaseOrder: ReadingPhase[] = [
  'past',
  'future',
  'character',
  'career',
  'relationships',
  'timing',
];

const sessionReadingKey = 'ming:last-reading:v3';
const legacySessionReadingKey = 'ming:last-reading:v2';
const readingRetentionMs = 24 * 60 * 60 * 1000;

function availableReadingStores(): Storage[] {
  const stores: Storage[] = [];
  try {
    stores.push(window.sessionStorage);
  } catch {
    // Some browser privacy modes can block per-tab storage.
  }
  try {
    stores.push(window.localStorage);
  } catch {
    // Keep the reading usable in memory if persistent storage is unavailable.
  }
  return stores;
}

function parseStoredReading(value: string): Reading | null {
  try {
    const parsed = JSON.parse(value) as
      | Reading
      | { version: 1; expiresAt: number; reading: Reading };
    if ('version' in parsed) {
      if (parsed.version !== 1 || parsed.expiresAt <= Date.now()) return null;
      return parsed.reading;
    }
    return parsed;
  } catch {
    return null;
  }
}

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
      'Your reading is saved temporarily in this browser and automatically expires after 24 hours so you can return after a refresh. Birth details are sent to the AI provider to generate it. The reading is for reflection, not professional advice.',
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
      '建议输入准确出生时间。时间越准确，四柱解读越清晰；不知道也可以继续。',
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
      '解读会暂存在当前浏览器中，24 小时后自动过期，刷新后可以继续查看；出生信息会发送给 AI 服务用于生成解读。内容仅供自我反思，不替代专业建议。',
  },
} as const;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function createReadingFromPhase(
  payload: PhaseResponse,
  locale: ReadingLocale,
  feedbackConsent: boolean,
): Reading {
  const patch = payload.interpretation;
  return {
    resolvedPlace: payload.resolvedPlace,
    chart: payload.chart,
    ziweiChart: payload.ziweiChart,
    interpretation: {
      summary: patch.summary ?? '',
      pastOverview: patch.pastOverview ?? {
        characterSentence: '',
        trajectorySentence: '',
      },
      pastPatterns: patch.pastPatterns ?? [],
      insights: patch.insights ?? [],
      lifeAreas: {
        character: patch.lifeAreas?.character ?? null,
        career: patch.lifeAreas?.career ?? null,
        relationships: patch.lifeAreas?.relationships ?? null,
        timing: patch.lifeAreas?.timing ?? null,
      },
      futureOverview: patch.futureOverview,
      futureForecasts: patch.futureForecasts ?? [],
      reflectionQuestions: patch.reflectionQuestions ?? [],
      limitations: patch.limitations ?? '',
    },
    interpretationSource: payload.interpretationSource,
    locale,
    feedbackConsent,
    progress: {
      completed: [payload.phase],
      active: undefined,
      failed: [],
    },
  };
}

function mergeReadingPhase(reading: Reading, payload: PhaseResponse): Reading {
  const patch = payload.interpretation;
  const completed = new Set(reading.progress?.completed ?? []);
  completed.add(payload.phase);
  return {
    ...reading,
    resolvedPlace: payload.resolvedPlace,
    chart: payload.chart,
    ziweiChart: payload.ziweiChart ?? reading.ziweiChart,
    interpretation: {
      ...reading.interpretation,
      ...patch,
      lifeAreas: {
        ...reading.interpretation.lifeAreas,
        ...patch.lifeAreas,
      },
    },
    progress: {
      completed: readingPhaseOrder.filter((phase) => completed.has(phase)),
      active: undefined,
      failed: reading.progress?.failed ?? [],
    },
  };
}

function friendlyTimeZone(value: string) {
  if (value === 'Asia/Shanghai') return 'China Standard Time · UTC+8';
  return value.replaceAll('_', ' ');
}

function phaseLabel(phase: ReadingPhase, locale: ReadingLocale) {
  if (locale === 'zh') {
    return {
      past: '回望过去',
      future: '展望未来',
      character: '性格',
      career: '事业',
      relationships: '恋爱与亲密关系',
      timing: '时机',
    }[phase];
  }
  return {
    past: 'Looking back',
    future: 'Looking ahead',
    character: 'Character',
    career: 'Career',
    relationships: 'Love & Relationships',
    timing: 'Timing',
  }[phase];
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
  const generationRef = useRef(0);

  useEffect(() => {
    let savedReading: Reading | null = null;
    for (const storage of availableReadingStores()) {
      for (const key of [sessionReadingKey, legacySessionReadingKey]) {
        try {
          const saved = storage.getItem(key);
          if (!saved) continue;
          const parsed = parseStoredReading(saved);
          if (
            parsed?.chart &&
            parsed?.interpretation &&
            parsed?.resolvedPlace
          ) {
            savedReading = parsed;
            break;
          }
          storage.removeItem(key);
        } catch {
          // Continue to the other store if one is unavailable or malformed.
        }
      }
      if (savedReading) break;
    }
    queueMicrotask(() => {
      if (savedReading) {
        setReading(savedReading);
        if (savedReading.locale === 'zh' || savedReading.locale === 'en') {
          setLocale(savedReading.locale);
        }
      }
      setSessionRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!sessionRestored) return;
    const stores = availableReadingStores();
    if (reading) {
      const saved = JSON.stringify({
        version: 1,
        expiresAt: Date.now() + readingRetentionMs,
        reading,
      });
      for (const storage of stores) {
        try {
          storage.setItem(sessionReadingKey, saved);
          storage.removeItem(legacySessionReadingKey);
        } catch {
          // Storage is an enhancement; the reading remains available in memory.
        }
      }
    } else {
      for (const storage of stores) {
        try {
          storage.removeItem(sessionReadingKey);
          storage.removeItem(legacySessionReadingKey);
        } catch {
          // Ignore unavailable stores while resetting the reading.
        }
      }
    }
  }, [reading, sessionRestored]);

  function resetReading() {
    generationRef.current += 1;
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

  async function requestReadingPhase(
    requestPayload: ReadingRequestPayload,
    phase: ReadingPhase,
  ) {
    const response = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...requestPayload,
        phase,
        // Turnstile is verified only for the first request because tokens are
        // single-use. Continuation phases are still rate-limited server-side.
        turnstileToken:
          phase === 'past' ? requestPayload.turnstileToken : undefined,
      }),
    });
    const payload = (await response.json()) as PhaseResponse & {
      error?: string;
    };
    if (!response.ok) {
      throw new Error(
        payload.error ?? 'Unable to create this reading section.',
      );
    }
    return payload;
  }

  async function continueReading(
    requestPayload: ReadingRequestPayload,
    generation: number,
  ) {
    for (const phase of readingPhaseOrder.slice(1)) {
      if (generationRef.current !== generation) return;
      setReading((current) =>
        current
          ? {
              ...current,
              progress: {
                completed: current.progress?.completed ?? ['past'],
                active: phase,
                failed: current.progress?.failed ?? [],
              },
            }
          : current,
      );
      try {
        const payload = await requestReadingPhase(requestPayload, phase);
        if (generationRef.current !== generation) return;
        setReading((current) =>
          current ? mergeReadingPhase(current, payload) : current,
        );
      } catch (caught) {
        if (generationRef.current !== generation) return;
        setReading((current) =>
          current
            ? {
                ...current,
                progress: {
                  completed: current.progress?.completed ?? ['past'],
                  active: undefined,
                  failed: [...(current.progress?.failed ?? []), phase],
                },
              }
            : current,
        );
        // Continue with the next section so one malformed model response does
        // not block all of the remaining pages.
        console.warn(
          '[reading-phase-error]',
          phase,
          caught instanceof Error ? caught.message : caught,
        );
      }
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
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const requestPayload: ReadingRequestPayload = {
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
    };
    setLoading(true);
    setError('');

    try {
      const payload = await requestReadingPhase(requestPayload, 'past');
      if (generationRef.current !== generation) return;
      const initialReading = createReadingFromPhase(
        payload,
        locale,
        shareForImprovement,
      );
      setReading({
        ...initialReading,
        testFixture: false,
      });
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      void continueReading(requestPayload, generation);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Unable to create reading.',
      );
    } finally {
      if (generationRef.current === generation) setLoading(false);
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
                      locale={locale}
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
                        locale={locale}
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
                    <TurnstileField
                      locale={locale}
                      onToken={setTurnstileToken}
                    />
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
                          {locale === 'zh'
                            ? '正在解读命盘'
                            : 'Reading your chart'}
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
                  className="mt-6 whitespace-pre-wrap break-words border-l-2 border-[#9d3027] pl-4 text-sm leading-6 text-[#8b2b24]"
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
        <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            className="glow-control flex min-h-24 w-full items-center justify-between gap-3 rounded-none border border-black/12 bg-white/25 px-4 py-4 text-left text-black transition-colors hover:border-[#9d3027]/45 hover:bg-[#9d3027]/[0.035] sm:px-5"
            onClick={onBegin}
            type="button"
          >
            <span className="grid gap-1.5">
              <span className="text-sm font-semibold tracking-[0.06em]">
                {isZh ? '人生详解' : 'Full Life Reading'}
              </span>
              <span className="text-xs leading-5 text-black/50">
                {isZh
                  ? '回看过去，了解性格、事业与未来'
                  : 'Past patterns, character, work, and what lies ahead'}
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-[#9d3027]" />
          </Button>
          <Link
            className="glow-control flex min-h-24 w-full items-center justify-between gap-3 border border-black/12 bg-white/25 px-4 py-4 text-black transition-colors hover:border-[#9d3027]/45 hover:bg-[#9d3027]/[0.035] sm:px-5"
            href={`/question?lang=${locale}`}
          >
            <span className="grid gap-1.5">
              <span className="text-sm font-semibold tracking-[0.06em]">
                {isZh ? '具体解答' : 'Ask One Question'}
              </span>
              <span className="text-xs leading-5 text-black/50">
                {isZh
                  ? '聚焦你此刻最关心的一件事'
                  : 'Focus on the one thing on your mind now'}
              </span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-[#9d3027]" />
          </Link>
        </div>
        <p className="mt-3 text-xs text-black/38">
          {isZh
            ? '首次人生详解免费 · 无需注册'
            : 'Your first full reading is free · no account required'}
        </p>
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
            aria-label={locale === 'zh' ? '语言' : 'Language'}
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
    character: '回',
    en: 'Preparing the first page: looking back',
    zh: '先整理第一部分：回望过去',
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
            ? '回望过去完成后会先开放页面，其他章节会在后台按顺序生成。'
            : 'Looking back will open first. The remaining chapters continue in the background.'}
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
  const [view, setView] = useState<ResultView>('overview');
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [notice, setNotice] = useState('');
  const tabs = locale === 'zh' ? resultTabsZh : resultTabs;
  const readingKey = Object.values(reading.chart.pillars).join('');
  const completedPhases = new Set(reading.progress?.completed ?? ['past']);

  function selectTab(next: ResultView, scrollToPanel = false) {
    const phase = next === 'method' || next === 'overview' ? null : next;
    if (phase && !completedPhases.has(phase)) {
      setNotice(
        locale === 'zh'
          ? '这一部分正在分析中，请稍等。完成后会自动开放。'
          : 'This section is still being analysed. Please wait a moment.',
      );
      return;
    }
    setNotice('');
    setView(next);
    if (scrollToPanel) {
      requestAnimationFrame(() =>
        document.getElementById('reading-panel')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      );
    }
  }

  function moveTab(direction: -1 | 1) {
    const currentIndex = tabs.findIndex((tab) => tab.value === view);
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    selectTab(next.value);
    const nextPhase =
      next.value === 'method' || next.value === 'overview' ? null : next.value;
    if (!nextPhase || completedPhases.has(nextPhase)) {
      requestAnimationFrame(() =>
        document.getElementById(`reading-tab-${next.value}`)?.focus(),
      );
    }
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
        <div className="flex items-center gap-3">
          <button
            className="glow-control inline-flex items-center gap-2 border border-black/12 px-3 py-2 text-[10px] font-semibold tracking-[0.08em] text-black/55 uppercase transition hover:border-[#9d3027]/40 hover:text-[#9d3027]"
            onClick={() => window.print()}
            type="button"
          >
            <FileDown className="size-3.5" />
            {locale === 'zh' ? '保存为 PDF' : 'Save as PDF'}
          </button>
          {reading.testFixture ? (
            <span className="rounded-full border border-[#9d3027]/30 bg-[#9d3027]/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-[#9d3027] uppercase">
              {locale === 'zh' ? '测试虚构数据' : 'Test fixture data'}
            </span>
          ) : null}
        </div>
      </div>

      <nav
        aria-label={locale === 'zh' ? '解读章节' : 'Reading sections'}
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
            onClick={() => selectTab(tab.value)}
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
      {notice ? (
        <output
          aria-live="polite"
          className="-mt-5 mb-7 text-xs text-[#9d3027]"
        >
          {notice}
        </output>
      ) : null}
      {reading.progress?.active ? (
        <p className="-mt-5 mb-7 text-[10px] tracking-[0.12em] text-black/35 uppercase">
          {locale === 'zh'
            ? `正在生成${phaseLabel(reading.progress.active, locale)} · 可先阅读已完成部分`
            : `Generating ${phaseLabel(reading.progress.active, locale)} · completed sections remain available`}
        </p>
      ) : null}

      {view === 'overview' ? (
        <section className="result-hero grid gap-10 border-b border-black/10 pb-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9d3027] uppercase">
              {locale === 'zh' ? '你的五行命盘' : 'Your elemental profile'}
            </p>
            <h1 className="relative z-10 mt-3 max-w-lg font-serif text-5xl tracking-[-0.04em] sm:text-6xl">
              {reading.chart.dayMaster} ·{' '}
              {locale === 'zh'
                ? '日主'
                : `${stemNames[reading.chart.dayMaster] ?? 'Elemental'} Day Master`}
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
                    {locale === 'zh'
                      ? (
                          {
                            wood: '木',
                            fire: '火',
                            earth: '土',
                            metal: '金',
                            water: '水',
                          } as Record<string, string>
                        )[element]
                      : elementNames[element]}{' '}
                    {count}
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
                    {locale === 'zh'
                      ? (
                          {
                            year: '年',
                            month: '月',
                            day: '日',
                            hour: '时',
                          } as const
                        )[key]
                      : key}
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
      ) : null}

      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- WAI-ARIA tabs require a labelled tabpanel. */}
      <div
        aria-labelledby={`reading-tab-${view}`}
        className="mx-auto min-h-[520px] max-w-3xl scroll-mt-24 animate-rise-delayed py-12"
        id="reading-panel"
        role="tabpanel"
        tabIndex={0}
      >
        {view === 'overview' ? (
          <>
            <ReadingSummary reading={reading} locale={locale} />
            <InsightStrip reading={reading} locale={locale} />
          </>
        ) : null}
        {view === 'past' ? (
          <PastView reading={reading} locale={locale} />
        ) : null}
        {(['character', 'career', 'relationships', 'timing'] as const).includes(
          view as LifeAreaKey,
        ) ? (
          view === 'relationships' &&
          !reading.interpretation.lifeAreas.relationships ? (
            <PendingSection phase="relationships" locale={locale} />
          ) : view === 'relationships' && !premiumUnlocked ? (
            <LockedLifeArea
              area={reading.interpretation.lifeAreas.relationships!}
              locale={locale}
              readingKey={readingKey}
              shareConsent={reading.feedbackConsent === true}
              onUnlock={() => setPremiumUnlocked(true)}
            />
          ) : reading.interpretation.lifeAreas[view as LifeAreaKey] ? (
            <LifeAreaView
              area={reading.interpretation.lifeAreas[view as LifeAreaKey]!}
              areaKey={view as LifeAreaKey}
              locale={locale}
              readingKey={readingKey}
              shareConsent={reading.feedbackConsent === true}
              showIntro={view !== 'timing'}
            />
          ) : (
            <PendingSection phase={view as ReadingPhase} locale={locale} />
          )
        ) : null}
        {view === 'future' ? (
          !completedPhases.has('future') ? (
            <PendingSection phase="future" locale={locale} />
          ) : premiumUnlocked ? (
            <FutureView
              reading={reading}
              locale={locale}
              readingKey={readingKey}
              shareConsent={reading.feedbackConsent === true}
            />
          ) : (
            <LockedFutureView
              reading={reading}
              locale={locale}
              readingKey={readingKey}
              shareConsent={reading.feedbackConsent === true}
              onUnlock={() => setPremiumUnlocked(true)}
            />
          )
        ) : null}
        {view === 'method' ? (
          <>
            <MethodView reading={reading} locale={locale} />
            <div className="mt-16 border-t border-black/10 pt-12">
              <ReadingFollowUp
                locale={locale}
                context={JSON.stringify({
                  summary: reading.interpretation.summary,
                  pastOverview: reading.interpretation.pastOverview,
                  pastPatterns: reading.interpretation.pastPatterns.slice(0, 6).map(({ period, headline, narrative, checkableEvent }) => ({ period, headline, narrative, checkableEvent })),
                  lifeAreas: Object.fromEntries(
                    (['character', 'career', 'relationships', 'timing'] as const)
                      .filter((key) => premiumUnlocked || key !== 'relationships')
                      .map((key) => {
                        const area = reading.interpretation.lifeAreas[key];
                        return [key, area ? { headline: area.headline, narrative: area.narrative, strengths: area.strengths, frictions: area.frictions, actions: area.actions } : null];
                      }),
                  ),
                  future: premiumUnlocked
                    ? { overview: reading.interpretation.futureOverview, forecasts: reading.interpretation.futureForecasts?.slice(0, 6) }
                    : undefined,
                  limitations: reading.interpretation.limitations,
                })}
              />
              <div className="mt-8 flex flex-col gap-4 border border-black/10 bg-white/25 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <p className="text-xs font-semibold tracking-[0.1em] text-[#9d3027] uppercase">
                    {locale === 'zh' ? '独立起问' : 'A separate question'}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl">
                    {locale === 'zh' ? '想问另一件具体的事？' : 'Have a different question?'}
                  </h3>
                  <p className="mt-2 max-w-xl text-xs leading-5 text-black/50">
                    {locale === 'zh'
                      ? '这会单独起卦，不会引用这份人生解读。'
                      : 'This starts a separate cast and does not use this life reading.'}
                  </p>
                </div>
                <Link
                  className="glow-control inline-flex min-h-12 shrink-0 items-center justify-center gap-3 border border-[#9d3027]/35 px-5 text-xs font-semibold tracking-[0.1em] text-[#9d3027] uppercase transition-colors hover:bg-[#9d3027]/[0.05]"
                  href={`/question?lang=${locale}`}
                >
                  {locale === 'zh' ? '具体解答' : 'Ask a question'}
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>
          </>
        ) : null}
        {view === 'overview' ||
        view === 'past' ||
        view === 'method' ||
        (completedPhases.has(view as ReadingPhase) &&
          (!(view === 'future' || view === 'relationships') ||
            premiumUnlocked)) ? (
          <SectionFeedback
            key={`${readingKey}:${view}`}
            locale={locale}
            readingKey={readingKey}
            section={view}
            shareConsent={reading.feedbackConsent === true}
          />
        ) : null}
      </div>
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 border-t border-black/10 py-6 text-xs">
        <button
          className="glow-control min-w-0 text-left text-black/60 disabled:cursor-not-allowed disabled:opacity-25"
          disabled={tabs[0].value === view}
          onClick={() => {
            const index = tabs.findIndex((tab) => tab.value === view);
            if (index > 0) selectTab(tabs[index - 1].value, true);
          }}
          type="button"
        >
          {locale === 'zh' ? '← 上一页' : '← Previous'}
        </button>
        <span className="shrink-0 text-[10px] tracking-[0.14em] text-black/35">
          {tabs.findIndex((tab) => tab.value === view) + 1} / {tabs.length}
        </span>
        <button
          className="glow-control min-w-0 text-right text-[#9d3027] disabled:cursor-not-allowed disabled:opacity-25"
          disabled={tabs[tabs.length - 1].value === view}
          onClick={() => {
            const index = tabs.findIndex((tab) => tab.value === view);
            if (index < tabs.length - 1) selectTab(tabs[index + 1].value, true);
          }}
          type="button"
        >
          {locale === 'zh' ? '下一页 →' : 'Next →'}
        </button>
      </div>
      {notice ? (
        <output
          aria-live="polite"
          className="mx-auto block max-w-3xl pb-6 text-xs text-[#9d3027]"
        >
          {notice}
        </output>
      ) : null}
      <PrintableReading
        reading={reading}
        locale={locale}
        premiumUnlocked={premiumUnlocked}
      />
    </div>
  );
}

type SurveySection = ResultView;
type SurveyKey = 'clarity' | 'specificity' | 'next_step';
type SurveyStatus = 'idle' | 'sending' | 'sent' | 'local' | 'failed';

const surveyQuestions: Record<
  ReadingLocale,
  Record<SurveyKey, { prompt: string; options: Array<[string, string]> }>
> = {
  en: {
    clarity: {
      prompt: 'Was this section easy to understand?',
      options: [
        ['clear', 'Yes'],
        ['somewhat_clear', 'Somewhat'],
        ['unclear', 'Not yet'],
      ],
    },
    specificity: {
      prompt: 'How personal did it feel?',
      options: [
        ['specific', 'Specific'],
        ['mixed', 'A mix'],
        ['generic', 'Too generic'],
      ],
    },
    next_step: {
      prompt: 'What would make it more useful?',
      options: [
        ['more_examples', 'More examples'],
        ['more_reasoning', 'Clearer reasoning'],
        ['more_timing', 'More timing detail'],
      ],
    },
  },
  zh: {
    clarity: {
      prompt: '这一部分是否容易读懂？',
      options: [
        ['clear', '容易理解'],
        ['somewhat_clear', '部分理解'],
        ['unclear', '不太明白'],
      ],
    },
    specificity: {
      prompt: '内容对你来说有多贴近？',
      options: [
        ['specific', '比较贴近'],
        ['mixed', '有些贴近'],
        ['generic', '太笼统'],
      ],
    },
    next_step: {
      prompt: '怎样改进会更有帮助？',
      options: [
        ['more_examples', '更多具体例子'],
        ['more_reasoning', '更清楚的推理'],
        ['more_timing', '更具体的时间线'],
      ],
    },
  },
};

function SectionFeedback({
  locale,
  readingKey,
  section,
  shareConsent,
}: {
  locale: ReadingLocale;
  readingKey: string;
  section: SurveySection;
  shareConsent: boolean;
}) {
  const storageKey = `ming:survey:v1:${readingKey}:${section}`;
  const [answers, setAnswers] = useState<Partial<Record<SurveyKey, string>>>(
    {},
  );
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<SurveyStatus>('idle');
  const questions = surveyQuestions[locale];
  const labels =
    locale === 'zh'
      ? {
          title: '帮我们把这一页做得更好',
          hint: '可选，最多 3 个选择；不需要为了配合解读而勉强选择。',
          comment: '还希望我们改进什么？（选填）',
          placeholder: '例如：希望对中年阶段的变化给出更具体的例子。',
          submit: '提交反馈',
          localOnly: '已保存在此设备；你未同意分享，因此没有发送。',
          sending: '正在发送反馈…',
          sent: '反馈已提交。',
          failed: '发送失败；反馈仍保存在此设备。',
          privacy:
            '若你已同意分享，答案与意见会发送用于改进；请勿填写身份或敏感信息。请求不附带生日、姓名或城市，但 Cloudflare 仍会处理 IP 等请求元数据。',
        }
      : {
          title: 'Help us improve this section',
          hint: 'Optional, up to 3 choices. A miss is useful feedback too.',
          comment: 'What else should we improve? (optional)',
          placeholder:
            'For example: Add more concrete examples for midlife changes.',
          submit: 'Send feedback',
          localOnly:
            'Saved on this device; sharing is off, so nothing was sent.',
          sending: 'Sending feedback…',
          sent: 'Feedback submitted.',
          failed: 'Could not send; your feedback remains on this device.',
          privacy:
            'If you opted in, answers and comments are sent to improve the product. Avoid identifying or sensitive details. Birth date, name, and city are not attached; Cloudflare still processes IP and request metadata.',
        };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        answers?: Partial<Record<SurveyKey, string>>;
        comment?: string;
      };
      queueMicrotask(() => {
        setAnswers(parsed.answers ?? {});
        setComment(parsed.comment ?? '');
      });
    } catch {
      // Invalid or unavailable local feedback is non-fatal.
    }
  }, [storageKey]);

  function choose(key: SurveyKey, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setStatus('idle');
  }

  async function submit() {
    if (!Object.keys(answers).length && !comment.trim()) return;
    const payload = { answers, comment: comment.trim() };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Still attempt the explicitly consented send below.
    }
    if (!shareConsent) {
      setStatus('local');
      return;
    }
    setStatus('sending');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          feedbackType: 'survey',
          section,
          answers,
          comment: payload.comment,
          locale,
        }),
      });
      if (!response.ok) throw new Error('FEEDBACK_SEND_FAILED');
      setStatus('sent');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <section
      className="mt-12 border-t border-black/10 pt-7"
      aria-label={labels.title}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl">{labels.title}</h3>
        <p className="text-[10px] text-black/38">{labels.hint}</p>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {(
          Object.entries(questions) as Array<
            [SurveyKey, (typeof questions)[SurveyKey]]
          >
        ).map(([key, question]) => (
          <fieldset key={key}>
            <legend className="mb-2 text-xs font-medium text-black/65">
              {question.prompt}
            </legend>
            <div className="flex flex-wrap gap-2">
              {question.options.map(([value, label]) => (
                <button
                  aria-pressed={answers[key] === value}
                  className={`glow-control border px-2.5 py-2 text-[10px] transition ${answers[key] === value ? 'border-[#9d3027] bg-[#9d3027] text-white' : 'border-black/12 text-black/48 hover:border-black/30'}`}
                  key={value}
                  onClick={() => choose(key, value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <label className="mt-6 block text-xs font-medium text-black/62">
        {labels.comment}
        <textarea
          className="mt-2 min-h-24 w-full resize-y border border-black/12 bg-white/35 p-3 text-sm leading-6 outline-none transition focus:border-[#9d3027]/50"
          maxLength={500}
          onChange={(event) => {
            setComment(event.target.value);
            setStatus('idle');
          }}
          placeholder={labels.placeholder}
          value={comment}
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          className="glow-control border border-[#9d3027]/35 px-4 py-2.5 text-[10px] font-semibold tracking-[0.08em] text-[#9d3027] uppercase transition hover:bg-[#9d3027] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={
            status === 'sending' ||
            (!Object.keys(answers).length && !comment.trim())
          }
          onClick={submit}
          type="button"
        >
          {labels.submit}
        </button>
        <p className="max-w-2xl text-[10px] leading-5 text-black/38">
          {labels.privacy}
        </p>
      </div>
      {status !== 'idle' ? (
        <output
          aria-live="polite"
          className="mt-3 block text-[11px] text-black/48"
        >
          {status === 'sending'
            ? labels.sending
            : status === 'sent'
              ? labels.sent
              : status === 'failed'
                ? labels.failed
                : labels.localOnly}
        </output>
      ) : null}
    </section>
  );
}

function PredictionRating({
  claim,
  locale,
  readingKey,
  section,
  shareConsent,
}: {
  claim: string;
  locale: ReadingLocale;
  readingKey: string;
  section: string;
  shareConsent: boolean;
}) {
  const [choice, setChoice] = useState<FeedbackChoice | null>(null);
  const [status, setStatus] = useState<SurveyStatus>('idle');
  const claimId = claimFingerprint(section, claim);
  const storageKey = `ming:prediction:v1:${readingKey}:${claimId}`;
  const options: Array<[FeedbackChoice, string]> =
    locale === 'zh'
      ? [
          ['Match', '符合'],
          ['Partial', '部分符合'],
          ['Miss', '不符合'],
          ['CannotJudge', '暂无法判断'],
        ]
      : [
          ['Match', 'Match'],
          ['Partial', 'Partial'],
          ['Miss', 'Miss'],
          ['CannotJudge', 'Cannot judge'],
        ];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        storageKey,
      ) as FeedbackChoice | null;
      if (
        saved &&
        ['Match', 'Partial', 'Miss', 'CannotJudge'].includes(saved)
      ) {
        queueMicrotask(() => setChoice(saved));
      }
    } catch {
      // Ignore unavailable local storage.
    }
  }, [storageKey]);

  async function rate(next: FeedbackChoice) {
    setChoice(next);
    setStatus('idle');
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Rating remains available in component state.
    }
    if (!shareConsent) {
      setStatus('local');
      return;
    }
    setStatus('sending');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          feedbackType: 'prediction',
          period: section,
          section,
          claimId: await sha256Fingerprint(`${section}|${claim}`),
          calibrationVersion: 2,
          choice: next,
          locale,
        }),
      });
      if (!response.ok) throw new Error('FEEDBACK_SEND_FAILED');
      setStatus('sent');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <div
      className="mt-4 flex flex-wrap items-center gap-2"
      aria-label={
        locale === 'zh'
          ? '这条推测与你的体验有多贴近？'
          : 'How closely does this fit your experience?'
      }
    >
      <span className="mr-1 w-full text-[10px] text-black/40">
        {locale === 'zh'
          ? '可选：这条推测和你的体验有多贴近？'
          : 'Optional: how closely does this fit your experience?'}
      </span>
      {options.map(([value, label]) => (
        <button
          aria-pressed={choice === value}
          className={`glow-control border px-2.5 py-2 text-[10px] transition ${choice === value ? 'border-[#9d3027] bg-[#9d3027] text-white' : 'border-black/12 text-black/45 hover:border-black/30'}`}
          key={value}
          onClick={() => rate(value)}
          type="button"
        >
          {label}
        </button>
      ))}
      {status !== 'idle' ? (
        <span className="text-[10px] text-black/38" aria-live="polite">
          {status === 'sending'
            ? locale === 'zh'
              ? '提交中…'
              : 'Sending…'
            : status === 'sent'
              ? locale === 'zh'
                ? '已提交'
                : 'Submitted'
              : status === 'failed'
                ? locale === 'zh'
                  ? '提交失败'
                  : 'Could not send'
                : locale === 'zh'
                  ? '仅保存在本设备'
                  : 'Saved on this device only'}
        </span>
      ) : null}
    </div>
  );
}

function claimFingerprint(section: string, claim: string) {
  // A synchronous stable fingerprint for local keys; the server receives only
  // a SHA-256 fingerprint in the existing retrospective-feedback contract.
  const input = `${section}\u0000${claim}`;
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function sha256Fingerprint(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function PrintableReading({
  reading,
  locale,
  premiumUnlocked,
}: {
  reading: Reading;
  locale: ReadingLocale;
  premiumUnlocked: boolean;
}) {
  const isZh = locale === 'zh';
  const areas: LifeAreaKey[] = [
    'character',
    'career',
    'relationships',
    'timing',
  ];
  const areaTitles: Record<LifeAreaKey, string> = isZh
    ? {
        character: '性格',
        career: '事业',
        relationships: '关系',
        timing: '时机',
      }
    : {
        character: 'Character',
        career: 'Career',
        relationships: 'Relationships',
        timing: 'Timing',
      };
  return (
    <article className="reading-printable" aria-hidden="true">
      <header>
        <p className="print-kicker">
          MING · {isZh ? '个人解读' : 'PERSONAL READING'}
        </p>
        <h1>{isZh ? '你的命理解读' : 'Your reading'}</h1>
        <p>
          {reading.resolvedPlace.label} · {reading.resolvedPlace.ianaTimeZone}
        </p>
        <p>
          {isZh ? '年 · 月 · 日 · 时' : 'Year · Month · Day · Hour'}:{' '}
          {reading.chart.pillars.year} · {reading.chart.pillars.month} ·{' '}
          {reading.chart.pillars.day} · {reading.chart.pillars.hour ?? '—'}
        </p>
      </header>
      <section className="print-section">
        <h2>{isZh ? '总览' : 'Overview'}</h2>
        <p>{reading.interpretation.summary}</p>
        <p>{reading.interpretation.pastOverview.characterSentence}</p>
        <p>{reading.interpretation.pastOverview.trajectorySentence}</p>
        {reading.interpretation.insights.map((item) => (
          <div className="print-item" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.interpretation}</p>
            {item.basis ? <p className="print-muted">{item.basis}</p> : null}
          </div>
        ))}
      </section>
      <section className="print-section">
        <h2>{isZh ? '回望过去' : 'Looking back'}</h2>
        {reading.interpretation.pastPatterns.map((item) => (
          <div className="print-item" key={`${item.period}:${item.headline}`}>
            <h3>
              {item.period} · {item.headline}
            </h3>
            {item.checkableEvent ? (
              <p>
                <strong>{item.checkableEvent}</strong>
              </p>
            ) : null}
            <p>{item.narrative}</p>
            {item.principle ? (
              <p className="print-muted">{item.principle}</p>
            ) : null}
          </div>
        ))}
      </section>
      {premiumUnlocked && reading.interpretation.futureForecasts?.length ? (
        <section className="print-section">
          <h2>{isZh ? '展望未来' : 'Looking ahead'}</h2>
          <p>{reading.interpretation.futureOverview}</p>
          {reading.interpretation.futureForecasts.map((item) => (
            <div className="print-item" key={item.year}>
              <h3>
                {item.year} · {item.theme}
              </h3>
              <p>
                {isZh ? '机会' : 'Opportunity'}: {item.opportunity}
              </p>
              <p>
                {isZh ? '压力' : 'Pressure'}: {item.pressure}
              </p>
              <p>{item.riskScenario}</p>
              <p>
                {isZh ? '建议' : 'Actions'}: {item.actions.join(' · ')}
              </p>
            </div>
          ))}
        </section>
      ) : null}
      {areas.map((key) => {
        const area = reading.interpretation.lifeAreas[key];
        if (!area || (key === 'relationships' && !premiumUnlocked)) return null;
        return (
          <section className="print-section" key={key}>
            <h2>{areaTitles[key]}</h2>
            <h3>{area.headline}</h3>
            <p>{area.narrative}</p>
            <p>
              {isZh ? '优势' : 'Strengths'}:{' '}
              {(area.strengths ?? area.signals ?? []).join(' · ')}
            </p>
            <p>
              {isZh ? '摩擦点' : 'Friction'}:{' '}
              {(area.frictions ?? []).join(' · ')}
            </p>
            <p>
              {isZh ? '可以尝试' : 'Actions'}:{' '}
              {(area.actions ?? []).join(' · ')}
            </p>
            {area.basis ? <p className="print-muted">{area.basis}</p> : null}
          </section>
        );
      })}
      <footer className="print-footer">
        {reading.interpretation.reflectionQuestions.length ? (
          <div>
            <strong>
              {isZh ? '带着这些问题继续想一想' : 'Questions to reflect on'}:
            </strong>
            <ul>
              {reading.interpretation.reflectionQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {reading.interpretation.limitations}
        {isZh
          ? ' 传统命理是一种文化性反思工具，不构成事实保证或专业建议。'
          : ' Traditional systems are reflective cultural lenses, not guarantees or professional advice.'}
      </footer>
    </article>
  );
}

// Kept as a calculation-review reference; the customer-facing tab was removed
// so Zi Wei is delivered only as a synthesized, plain-language reading.
// oxlint-disable-next-line no-unused-vars
function ZiweiView({
  chart,
  locale,
}: {
  chart: ZiweiCalculation;
  locale: ReadingLocale;
}) {
  const isZh = locale === 'zh';
  const palaceOrder = [
    '命宫',
    '兄弟',
    '夫妻',
    '子女',
    '财帛',
    '疾厄',
    '迁移',
    '交友',
    '官禄',
    '田宅',
    '福德',
    '父母',
  ];
  const englishPalaceNames: Record<string, string> = {
    命宫: 'Life',
    兄弟: 'Siblings',
    夫妻: 'Partnership',
    子女: 'Children',
    财帛: 'Wealth',
    疾厄: 'Health',
    迁移: 'Travel',
    交友: 'Friends',
    官禄: 'Career',
    田宅: 'Home',
    福德: 'Inner life',
    父母: 'Parents',
  };
  const elementNames = isZh
    ? { water: '水', wood: '木', metal: '金', earth: '土', fire: '火' }
    : {
        water: 'Water',
        wood: 'Wood',
        metal: 'Metal',
        earth: 'Earth',
        fire: 'Fire',
      };
  const lunarDate = `${chart.lunarDate.isLeapMonth ? (isZh ? '闰' : 'Leap ') : ''}${chart.lunarDate.month}${isZh ? '月' : 'th lunar month'} · ${chart.lunarDate.day}${isZh ? '日' : 'th day'}`;

  return (
    <section>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
        {isZh ? '独立排盘 · 规则可见' : 'Separate chart · rules shown'}
      </p>
      <h2 className="mt-3 font-serif text-4xl">
        {isZh ? '紫微斗数盘面' : 'Zi Wei Dou Shu chart'}
      </h2>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-black/55">
        {isZh
          ? '这里只展示按指定传统规则计算出的盘面，不是 AI 预测，也不代表预测准确性已经验证。紫微斗数不同流派的排盘约定可能不同。'
          : 'This page shows a chart calculated under one named tradition. It is not an AI prediction, and predictive accuracy has not been established. Zi Wei schools can use different chart conventions.'}
      </p>

      {!chart.complete ? (
        <div className="mt-8 border border-[#9d3027]/20 bg-[#9d3027]/[0.035] p-6">
          <p className="font-serif text-2xl">
            {isZh
              ? '出生时辰未知，暂不排完整盘。'
              : 'Birth time needed for a full chart.'}
          </p>
          <p className="mt-3 text-sm leading-6 text-black/55">
            {isZh
              ? '命宫、身宫和主星位置会受到时辰影响。我们不会用估计值替你补出这些信息。'
              : 'The birth hour affects the Life and Body palaces and star placements. We do not guess these positions.'}
          </p>
          <p className="mt-5 text-xs text-black/40">
            {isZh ? '已能确认' : 'Available'}: {chart.yearGanzhi} · {lunarDate}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: isZh ? '命宫' : 'Life palace', value: chart.mingBranch },
              { label: isZh ? '身宫' : 'Body palace', value: chart.shenBranch },
              {
                label: isZh ? '五行局' : 'Five-element bureau',
                value: `${elementNames[chart.bureau.element]}${chart.bureau.number}${isZh ? '局' : ''}`,
              },
              {
                label: isZh ? '出生年干支' : 'Birth-year cycle',
                value: chart.yearGanzhi,
              },
            ].map((item) => (
              <div
                className="border border-black/10 bg-white/35 p-4"
                key={item.label}
              >
                <p className="text-[9px] tracking-[0.12em] text-black/35 uppercase">
                  {item.label}
                </p>
                <p className="mt-2 font-serif text-2xl">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-px bg-black/10 sm:grid-cols-2">
            {palaceOrder.map((name) => {
              const palace = chart.palaces.find((item) => item.name === name);
              if (!palace) return null;
              return (
                <article className="bg-[#f7f4ed] p-5 sm:p-6" key={name}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] tracking-[0.13em] text-[#9d3027] uppercase">
                        {isZh ? name : englishPalaceNames[name]}
                        {palace.isShen ? (isZh ? ' · 身宫' : ' · Body') : ''}
                      </p>
                      <p className="mt-1 font-serif text-xl">
                        {palace.ganzhi} · {palace.branch}
                      </p>
                    </div>
                    <span className="text-[9px] text-black/35">
                      {isZh ? '地支' : 'Branch'} {palace.branch}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {palace.stars.length ? (
                      palace.stars.map((star) => (
                        <span
                          className="border border-black/10 px-2.5 py-1 text-xs text-black/65"
                          key={star}
                        >
                          {star}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-black/35">
                        {isZh
                          ? '本实验范围内未列主星'
                          : 'No included principal star'}
                      </span>
                    )}
                  </div>
                  {palace.transformations.length ? (
                    <p className="mt-3 text-[10px] tracking-[0.08em] text-[#9d3027]">
                      {palace.transformations.join(' · ')}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
          <div className="mt-8 space-y-3 border-l-2 border-[#9d3027] pl-5 text-xs leading-6 text-black/48">
            <p>
              {isZh
                ? `采用《紫微斗数全书》卷二实验约定 ${chart.convention}。出生日期与时间按出生地当地民用钟表时间输入；时区用于核对和记录，不做 UTC 转换或真太阳时修正。`
                : `Convention: ${chart.convention}, following a selected reading of Volume 2 of the Zi Wei Dou Shu Quan Shu. Enter the local civil birth date and clock time. The zone is recorded for context; no UTC conversion or true-solar-time correction is applied.`}
            </p>
            <p>
              {isZh
                ? '本版只计算十四主星及四化定位所需的辅星位置；未计算完整辅星、星曜亮度、大限或流年。盘面规则测试不等于人生预测准确性验证。'
                : 'This version calculates the fourteen principal stars and only the auxiliary positions needed for four transformations. It does not include a complete auxiliary-star set, brightness, major periods, or annual charts. Chart-rule tests do not validate life predictions.'}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

function PendingSection({
  phase,
  locale,
}: {
  phase: ReadingPhase;
  locale: ReadingLocale;
}) {
  return (
    <section className="min-w-0 overflow-hidden border border-black/10 p-5 sm:p-8 md:p-12">
      <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#9d3027]/20 bg-[#9d3027]/5 px-3 py-1.5 text-[10px] font-semibold leading-4 tracking-[0.12em] text-[#9d3027] uppercase">
        <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-[#9d3027]" aria-hidden="true" />
        {locale === 'zh' ? '解读生成中' : 'Preparing reading'}
      </p>
      <h2 className="mt-5 max-w-full break-words font-serif text-[clamp(1.75rem,5vw,2.5rem)] leading-tight">
        {locale === 'zh'
          ? `正在生成：${phaseLabel(phase, locale)}`
          : `${phaseLabel(phase, locale)} is being prepared`}
      </h2>
      <p className="mt-4 max-w-xl break-words text-sm leading-7 text-black/52">
        {locale === 'zh'
          ? '模型正在按顺序完成这一章节。你可以先阅读已经开放的部分，完成后本页会自动更新。'
          : 'The model is completing this chapter in sequence. You can read the available sections first; this page will update when it is ready.'}
      </p>
      <div className="mt-8 h-1 overflow-hidden rounded-full bg-black/10">
        <div className="h-full w-1/3 animate-pulse bg-[#9d3027]" />
      </div>
    </section>
  );
}

function LockedLifeArea({
  area,
  locale,
  readingKey,
  shareConsent,
  onUnlock,
}: {
  area: LifeArea;
  locale: ReadingLocale;
  readingKey: string;
  shareConsent: boolean;
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
        <LifeAreaView
          area={area}
          areaKey="relationships"
          locale={locale}
          readingKey={readingKey}
          shareConsent={shareConsent}
        />
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
          {reading.interpretation.insights.length}{' '}
          {locale === 'zh' ? '条线索' : 'signals'}
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
                {confidenceLabel(insight.confidence, locale)}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-semibold">{insight.title}</h2>
            <p className="mt-3 text-sm leading-6 text-black/58">
              {insight.interpretation}
            </p>
            {insight.basis ? (
              <details className="mt-4 text-[10px] leading-5 text-black/42">
                <summary className="cursor-pointer">
                  {locale === 'zh'
                    ? '为什么这样推测'
                    : 'Why this interpretation?'}
                </summary>
                <p className="mt-2">{insight.basis}</p>
              </details>
            ) : null}
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
  const [legacyFeedback, setLegacyFeedback] = useState<
    Record<string, FeedbackChoice>
  >({});
  const [submissionStatus, setSubmissionStatus] = useState<
    'idle' | 'sending' | 'sent' | 'failed'
  >('idle');
  const submissionSequence = useRef(0);
  const feedbackKey = `ming:feedback:v2:${Object.values(reading.chart.pillars).join('')}`;
  const legacyFeedbackKey = `ming:feedback:v1:${Object.values(reading.chart.pillars).join('')}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(feedbackKey);
      const parsed = saved
        ? (JSON.parse(saved) as Record<string, FeedbackChoice>)
        : {};
      const legacy = window.localStorage.getItem(legacyFeedbackKey);
      const parsedLegacy = legacy
        ? (JSON.parse(legacy) as Record<string, FeedbackChoice>)
        : {};
      const restored = Object.fromEntries(
        reading.interpretation.pastPatterns.flatMap((pattern, index) => {
          const claimKey = `${pattern.period}::${pattern.checkableEvent || pattern.headline}`;
          return parsed[claimKey] ? [[index, parsed[claimKey]]] : [];
        }),
      ) as Record<number, FeedbackChoice>;
      queueMicrotask(() => {
        setMatches(restored);
        setSavedFeedback(Object.keys(restored).length > 0);
        setLegacyFeedback(parsedLegacy);
      });
    } catch {
      // Feedback is an enhancement; a malformed local entry is ignored.
    }
  }, [
    feedbackKey,
    legacyFeedbackKey,
    reading.feedbackConsent,
    reading.interpretation.pastPatterns,
  ]);

  function recordFeedback(
    period: string,
    claim: string,
    index: number,
    choice: FeedbackChoice,
  ) {
    setMatches((current) => ({ ...current, [index]: choice }));
    try {
      const saved = window.localStorage.getItem(feedbackKey);
      const current = saved
        ? (JSON.parse(saved) as Record<string, FeedbackChoice>)
        : {};
      current[`${period}::${claim}`] = choice;
      window.localStorage.setItem(feedbackKey, JSON.stringify(current));
      setSavedFeedback(true);
    } catch {
      // A blocked local store should not prevent an explicitly consented send.
    }
    if (!reading.feedbackConsent) return;
    const sequence = ++submissionSequence.current;
    setSubmissionStatus('sending');
    void (async () => {
      try {
        const bytes = new TextEncoder().encode(`v2|${period}|${claim}`);
        const digest = await window.crypto.subtle.digest('SHA-256', bytes);
        const claimId = Array.from(new Uint8Array(digest), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join('');
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consent: true,
            feedbackType: 'prediction',
            section: 'past',
            period,
            claimId,
            calibrationVersion: 2,
            choice,
            locale,
          }),
        });
        if (!response.ok) throw new Error('FEEDBACK_SEND_FAILED');
        if (sequence === submissionSequence.current)
          setSubmissionStatus('sent');
      } catch {
        if (sequence === submissionSequence.current)
          setSubmissionStatus('failed');
      }
    })();
  }

  function exportFeedback() {
    if (!reading.feedbackConsent || !Object.keys(matches).length) return;
    const records = reading.interpretation.pastPatterns.flatMap(
      (pattern, index) =>
        matches[index]
          ? [
              {
                period: pattern.period,
                claim: pattern.checkableEvent || pattern.headline,
                choice: matches[index],
              },
            ]
          : [],
    );
    const blob = new Blob([JSON.stringify({ version: 2, records }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ming-calibration-feedback.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportLegacyFeedback() {
    const blob = new Blob(
      [JSON.stringify({ version: 1, records: legacyFeedback }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ming-legacy-feedback.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
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
            ? '符合 · 部分符合 · 不符合 · 无法判断'
            : 'Match · Partial · Miss · Cannot judge'}
        </span>
      </div>
      <p className="mt-4 text-[11px] leading-5 text-black/40">
        {locale === 'zh'
          ? '下方“命盘线索”只表示传统规则中的线索强弱，不是经过验证的预测准确率。反馈时只评价每段突出显示的单条假设。'
          : '“Chart signal” describes an interpretive clue, not a measured hit rate. When giving feedback, rate only the highlighted claim in each period.'}
      </p>

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
                {confidenceLabel(pattern.confidence, locale)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">{pattern.headline}</h3>
              {pattern.checkableEvent ? (
                <div className="mt-4 border-l-2 border-[#9d3027] bg-[#9d3027]/[0.04] px-4 py-3">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-[#9d3027] uppercase">
                    {locale === 'zh' ? '请核对这一条' : 'The claim to check'}
                  </p>
                  <p className="mt-2 text-base leading-7 text-[#25231e]">
                    {pattern.checkableEvent}
                  </p>
                </div>
              ) : null}
              {pattern.checkableEvent ? (
                <div
                  className="mt-3 flex flex-wrap items-center gap-2"
                  aria-label={
                    locale === 'zh'
                      ? `${pattern.period}的核对假设与你的经历相符吗？`
                      : `Does the highlighted claim for ${pattern.period} match your experience?`
                  }
                >
                  <span className="mr-1 text-[10px] text-black/42">
                    {locale === 'zh'
                      ? '只评价上方这一条'
                      : 'Rate only this claim'}
                  </span>
                  {(['Match', 'Partial', 'Miss', 'CannotJudge'] as const).map(
                    (choice) => (
                      <button
                        aria-pressed={matches[patternIndex] === choice}
                        className={`glow-control border px-3 py-2 text-[10px] font-semibold tracking-[0.08em] uppercase transition ${matches[patternIndex] === choice ? 'border-[#9d3027] bg-[#9d3027] text-white' : 'border-black/12 text-black/38 hover:border-black/30'}`}
                        key={choice}
                        onClick={() =>
                          recordFeedback(
                            pattern.period,
                            pattern.checkableEvent!,
                            patternIndex,
                            choice,
                          )
                        }
                        type="button"
                      >
                        {locale === 'zh'
                          ? choice === 'Match'
                            ? '符合'
                            : choice === 'Partial'
                              ? '部分符合'
                              : choice === 'Miss'
                                ? '不符合'
                                : '无法判断'
                          : choice}
                      </button>
                    ),
                  )}
                  <span className="w-full text-[10px] leading-4 text-black/35">
                    {reading.feedbackConsent
                      ? locale === 'zh'
                        ? '点击后会立即提交；反馈内容仅含年份、假设指纹和评分。'
                        : 'Clicking sends the year, claim fingerprint, and rating immediately.'
                      : locale === 'zh'
                        ? '未同意分享：评分仅保存在本设备，不会发送。'
                        : 'Sharing is off: ratings stay on this device and are not sent.'}
                  </span>
                </div>
              ) : (
                <p className="mt-5 text-xs text-black/38">
                  {locale === 'zh'
                    ? '旧版解读没有单独的核对假设，无法计入反馈；重新生成后可使用。'
                    : 'This older reading has no separate claim to rate. Create a new reading to use feedback.'}
                </p>
              )}
              <p className="mt-3 text-[15px] leading-7 text-black/62">
                {pattern.narrative}
              </p>
              {pattern.possibilities.length ? (
                <details className="mt-3 text-xs leading-5 text-black/48">
                  <summary className="cursor-pointer">
                    {locale === 'zh'
                      ? '其他可能的表现（不计入反馈）'
                      : 'Other possible expressions (not rated)'}
                  </summary>
                  <ul className="mt-2 space-y-2">
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
                </details>
              ) : null}
              {pattern.principle || pattern.basis ? (
                <details className="mt-4 text-xs leading-5 text-black/42">
                  <summary className="cursor-pointer">
                    {locale === 'zh'
                      ? '为什么这样推测'
                      : 'Why this interpretation?'}
                  </summary>
                  {pattern.principle ? (
                    <p className="mt-2">{pattern.principle}</p>
                  ) : null}
                  {pattern.basis && pattern.basis !== pattern.principle ? (
                    <p className="mt-2 text-[10px] text-black/35">
                      {pattern.basis}
                    </p>
                  ) : null}
                </details>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <p className="mt-7 text-[11px] leading-5 text-black/45">
        {reading.feedbackConsent
          ? locale === 'zh'
            ? '你已同意分享：点击评分后，会立即发送年份、该条假设的指纹及评分。反馈请求不含生日、姓名或城市；云服务仍会处理 IP 等请求元数据。'
            : 'You opted to share feedback. Rating sends the year, a fingerprint of this claim, and your choice immediately. The feedback request excludes birth date, name, and city; the service still processes IP and other request metadata.'
          : locale === 'zh'
            ? '你未同意分享反馈，因此这些评分只保存在本设备，不会发送。'
            : 'Feedback sharing is off. Ratings stay on this device and are not sent.'}
      </p>
      {reading.feedbackConsent && savedFeedback ? (
        <output className="mt-2 block text-[11px] leading-5 text-black/45">
          {locale === 'zh'
            ? submissionStatus === 'sending'
              ? '已保存到本设备，正在提交。'
              : submissionStatus === 'sent'
                ? '已保存到本设备，提交成功。'
                : submissionStatus === 'failed'
                  ? '已保存到本设备，但提交失败；可再次点击评分重试。'
                  : '已保存到本设备；之前的线上提交状态未知。'
            : submissionStatus === 'sending'
              ? 'Saved on this device; sending now.'
              : submissionStatus === 'sent'
                ? 'Saved on this device and submitted.'
                : submissionStatus === 'failed'
                  ? 'Saved on this device, but sending failed. Click a rating again to retry.'
                  : 'Saved on this device; earlier online submission status is unknown.'}
        </output>
      ) : null}
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
      {reading.feedbackConsent && Object.keys(legacyFeedback).length ? (
        <div className="mt-5 border-t border-black/10 pt-4">
          <p className="text-[11px] leading-5 text-black/42">
            {locale === 'zh'
              ? '旧版评分仍保存在本设备，但不能对应新版的单条假设，也不会自动计入当前反馈。'
              : 'Older ratings remain on this device, but cannot be matched to the new single-claim format.'}
          </p>
          <button
            className="mt-2 text-[10px] font-semibold tracking-[0.1em] text-[#9d3027] uppercase underline underline-offset-4"
            onClick={exportLegacyFeedback}
            type="button"
          >
            {locale === 'zh' ? '导出旧版评分' : 'Export older ratings'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function LockedFutureView({
  reading,
  locale,
  readingKey,
  shareConsent,
  onUnlock,
}: {
  reading: Reading;
  locale: ReadingLocale;
  readingKey: string;
  shareConsent: boolean;
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
        <FutureView
          reading={reading}
          locale={locale}
          readingKey={readingKey}
          shareConsent={shareConsent}
        />
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
  readingKey,
  shareConsent,
}: {
  reading: Reading;
  locale: ReadingLocale;
  readingKey: string;
  shareConsent: boolean;
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
                  <p>{confidenceLabel(forecast.confidence, locale)}</p>
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
              <PredictionRating
                claim={`${forecast.year}: ${forecast.theme}. ${forecast.opportunity} ${forecast.pressure}`}
                locale={locale}
                readingKey={readingKey}
                section="future"
                shareConsent={shareConsent}
              />
              {forecast.basis ? (
                <details className="mt-6 border-t border-black/8 pt-4 text-xs leading-5 text-black/42">
                  <summary className="cursor-pointer">
                    {locale === 'zh'
                      ? '为什么这样推测'
                      : 'Why this interpretation?'}
                  </summary>
                  <p className="mt-2">{forecast.basis}</p>
                </details>
              ) : null}
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
          {confidenceLabel(area.confidence, locale)}
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
  readingKey,
  shareConsent,
  showIntro = true,
}: {
  area: LifeArea;
  areaKey: LifeAreaKey;
  locale: ReadingLocale;
  readingKey: string;
  shareConsent: boolean;
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
            {confidenceLabel(area.confidence, locale)}
          </span>
        </div>
      )}
      <p className="mt-8 font-serif text-2xl leading-9 text-black/78">
        {area.narrative}
      </p>
      <PredictionRating
        claim={area.narrative}
        locale={locale}
        readingKey={readingKey}
        section={areaKey}
        shareConsent={shareConsent}
      />
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
      {area.basis ? (
        <details className="mt-8 text-xs leading-5 text-black/42">
          <summary className="cursor-pointer">
            {locale === 'zh' ? '为什么这样推测' : 'Why this interpretation?'}
          </summary>
          <p className="mt-2">{area.basis}</p>
        </details>
      ) : null}
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

      <div className="mt-7 space-y-4 border-l-2 border-[#9d3027] pl-5 text-sm leading-7 text-black/65">
        <p>
          {locale === 'zh'
            ? '可以把命盘想成一张“出生时的季节地图”：它记录了当时的时间与地点，再用传统符号描述不同力量之间的关系。地图给的是观察角度，不是人生剧本。'
            : 'Think of the chart as a seasonal map of birth time and place. Traditional symbols describe relationships in that map; they offer a lens, not a script for your life.'}
        </p>
        <p>
          {locale === 'zh'
            ? '我们先计算命盘，再让 AI 结合当代生活提出可能的经历与选择。居住环境、时代、资源和个人决定都可能改变结果；出生城市也不等于成长或居住城市。'
            : 'We calculate the chart first, then ask AI to suggest possible experiences in today’s world. Era, environment, resources, and choices matter; birthplace is not the same as where you grew up or live.'}
        </p>
        <p>
          {locale === 'zh'
            ? '因此，请把过去的描述当作可核对的假设，把未来的描述当作思考提示。八字并没有被证明能准确预测某个人的具体事件；不吻合时，不需要勉强对号入座。'
            : 'Treat the past as checkable hypotheses and the future as prompts for reflection. BaZi is not scientifically proven to predict a person’s specific events; a miss is a miss.'}
        </p>
      </div>

      <div className="mt-6 border border-black/10 bg-black/[0.015] p-5 text-sm leading-6 text-black/52">
        <p className="font-semibold text-black/65">
          {locale === 'zh' ? '系统范围' : 'System scope'}
        </p>
        <p className="mt-2">
          {locale === 'zh'
            ? '本次解读先由程序分别计算八字与紫微斗数盘面，再把可用的线索交由 AI 综合解释。出生时辰不明时，不猜测紫微命宫等依赖时辰的内容；盘面之间若有不同倾向，也不会强行说成一致。'
            : 'The app calculates BaZi and Zi Wei charts separately, then asks AI to synthesize supported clues into one practical reading. If birth time is unknown, hour-dependent Zi Wei placements are omitted; differing chart signals are not forced into agreement.'}
        </p>
      </div>

      <div className="mt-8 grid gap-px bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-[#f2efe8] p-5">
          <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
            {locale === 'zh' ? '日主元素' : 'Day Master element'}
          </p>
          <p className="mt-2 font-serif text-2xl">
            {locale === 'zh'
              ? ((
                  {
                    wood: '木',
                    fire: '火',
                    earth: '土',
                    metal: '金',
                    water: '水',
                  } as Record<string, string>
                )[reading.chart.dayMasterElement ?? ''] ?? '—')
              : (reading.chart.dayMasterElement ?? '—')}
          </p>
        </div>
        <div className="bg-[#f2efe8] p-5">
          <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
            {locale === 'zh' ? '季节强弱' : 'Seasonal strength'}
          </p>
          <p className="mt-2 font-serif text-2xl">
            {locale === 'zh'
              ? ((
                  {
                    supported: '有季节助力',
                    balanced: '较均衡',
                    challenged: '季节助力较弱',
                  } as Record<string, string>
                )[reading.chart.seasonalStrength ?? ''] ?? '待核对')
              : (reading.chart.seasonalStrength ?? '—')}
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
                ? '紫微斗数 · 作为综合解读的辅助线索'
                : 'Zi Wei Dou Shu · an integrated supporting lens'}
            </p>
            <p className="mt-1">
              {locale === 'zh'
                ? reading.ziweiChart?.complete
                  ? '紫微线索已参与整体解读，不另设术语密集的分析页。'
                  : '因出生时辰不足，时辰相关的紫微线索不会用于推断。'
                : reading.ziweiChart?.complete
                  ? 'Supported Zi Wei clues are part of the overall interpretation; no separate technical report is shown.'
                  : 'Without a known birth hour, hour-dependent Zi Wei clues are excluded.'}
            </p>
          </div>
        </div>
      ) : null}

      {reading.chart.strengthNotes?.length && locale === 'en' ? (
        <div className="mt-7 border-l-2 border-[#9d3027] pl-4">
          <p className="text-[9px] font-semibold tracking-[0.15em] text-black/35 uppercase">
            Strength notes
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-black/52">
            {reading.chart.strengthNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {reading.chart.structuralRelations?.length && locale === 'en' ? (
        <div className="mt-7">
          <p className="text-[9px] font-semibold tracking-[0.15em] text-black/35 uppercase">
            Natal structural relations
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
              {locale === 'zh'
                ? (
                    {
                      wood: '木',
                      fire: '火',
                      earth: '土',
                      metal: '金',
                      water: '水',
                    } as Record<string, string>
                  )[element]
                : elementNames[element]}{' '}
              {count}
            </span>
          ),
        )}
      </div>

      {reading.chart.birthTimeConfidence === 'unknown' ? (
        <p className="mt-7 border-l-2 border-[#9d3027] pl-4 text-sm leading-6 text-black/55">
          {locale === 'zh'
            ? '你没有提供出生时辰，因此我们省略时柱，也不会编造依赖时辰才能判断的内容。'
            : 'The hour pillar is intentionally omitted. The reading does not invent claims that require a birth hour.'}
        </p>
      ) : null}

      {locale === 'zh' ? (
        <ul className="mt-8 space-y-3 text-sm leading-6 text-black/52">
          <li>
            出生城市用于确认当地时区：{reading.resolvedPlace.label}（
            {reading.resolvedPlace.ianaTimeZone}）。
          </li>
          <li>
            四柱按节气历计算；上方五行数量只统计可见天干与地支，不能据此断言某元素完全不存在。
          </li>
          {reading.chart.birthTimeConfidence === 'unknown' ? (
            <li>出生时辰未知，因此时柱未计算，相关判断也已省略。</li>
          ) : null}
        </ul>
      ) : (
        <ul className="mt-8 space-y-3">
          {reading.chart.calculationNotes.map((note) => (
            <li className="text-sm leading-6 text-black/52" key={note}>
              {note}
            </li>
          ))}
        </ul>
      )}

      {reading.chart.timeAdjustment ? (
        <div className="mt-8 grid gap-4 border border-black/10 p-5 sm:grid-cols-2">
          <div>
            <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
              {locale === 'zh' ? '真太阳时修正' : 'Apparent solar offset'}
            </p>
            <p className="mt-2 font-serif text-2xl">
              {reading.chart.timeAdjustment.minutes >= 0 ? '+' : ''}
              {reading.chart.timeAdjustment.minutes}{' '}
              {locale === 'zh' ? '分钟' : 'min'}
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

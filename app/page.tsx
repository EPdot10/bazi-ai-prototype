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
import { NativeSelect } from '@/components/ui/native-select';

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
  | 'method';
type LifeAreaKey = 'character' | 'career' | 'relationships' | 'timing';

interface LifeArea {
  headline: string;
  narrative: string;
  signals: string[];
  guidance: string;
  basis: string;
  confidence: string;
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
      evidence: string[];
      confidence: string;
    }>;
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
    reflectionQuestions: string[];
    limitations: string;
  };
  interpretationSource: 'deepseek' | 'local' | 'fixture';
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
  minute: 0,
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
  { value: 'character', label: 'Character' },
  { value: 'career', label: 'Career' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'timing', label: 'Timing' },
  { value: 'method', label: 'Method' },
];

const resultTabsZh: Array<{ value: ResultView; label: string }> = [
  { value: 'past', label: '回望过去' },
  { value: 'character', label: '性格' },
  { value: 'career', label: '事业' },
  { value: 'relationships', label: '关系' },
  { value: 'timing', label: '时机' },
  { value: 'method', label: '方法' },
];

const sessionReadingKey = 'ming:last-reading:v1';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function friendlyTimeZone(value: string) {
  if (value === 'Asia/Shanghai') return 'China Standard Time · UTC+8';
  return value.replaceAll('_', ' ');
}

function birthDateKey(value: BirthWheelValue) {
  return `${value.year}-${pad(value.month)}-${pad(value.day)}`;
}

function isTestDate(value: BirthWheelValue) {
  return ['1000-01-01', '1000-01-02'].includes(birthDateKey(value));
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
  const [tier, setTier] = useState<'free' | 'premium'>('free');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [directInput, setDirectInput] = useState(false);
  const [dateInteracted, setDateInteracted] = useState(false);
  const [timeInteracted, setTimeInteracted] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);
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
        if (savedReading) setReading(savedReading);
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
    setBirthValue(initialBirthValue);
    setTimeConfidence('exact');
    setBirthPlace('');
    setName('');
    setGender('undisclosed');
    setLocale('en');
    setConfirmedPlace(null);
    setTier('free');
    setStep(1);
    setDirectInput(false);
    setDateInteracted(false);
    setTimeInteracted(false);
    setTurnstileToken('');
    setShareForImprovement(false);
    setError('');
  }

  async function confirmPlace() {
    if (isTestDate(birthValue)) {
      setBirthPlace('Melbourne, Australia');
      setConfirmedPlace({
        label: 'Melbourne, Victoria, Australia',
        ianaTimeZone: 'Australia/Melbourne',
      });
      setError('');
      return;
    }

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
          tier,
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

  return (
    <main className="min-h-screen bg-[#f2efe8] text-[#181714]">
      <SiteHeader />
      {reading ? (
        <ReadingResult
          reading={reading}
          locale={reading.locale ?? locale}
          onReset={resetReading}
        />
      ) : (
        <section className="mx-auto grid max-w-[1280px] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="hidden flex-col justify-between border-b border-black/10 px-6 py-14 sm:px-10 sm:py-20 lg:flex lg:min-h-[calc(100vh-5rem)] lg:border-r lg:border-b-0 lg:px-14 lg:py-24">
            <div className="animate-rise">
              <div className="hero-seal mb-10">
                <span className="font-serif text-3xl">命</span>
              </div>
              <p className="mb-7 text-[10px] font-semibold tracking-[0.24em] text-[#9d3027] uppercase">
                Four pillars · one moment in time
              </p>
              <h1 className="max-w-xl font-serif text-[clamp(3.5rem,6.5vw,6.7rem)] leading-[0.9] font-medium tracking-[-0.055em]">
                Begin where your story began.
              </h1>
              <p className="mt-8 max-w-md font-serif text-2xl leading-8 text-black/72">
                Discover the patterns Chinese astrology sees in your life.
              </p>
              <p className="mt-4 max-w-md text-sm leading-7 text-black/55">
                Set the moment and city of your birth. MING translates an old
                Chinese method into a quiet, modern reflection on the pattern
                you carry.
              </p>
              <div className="mt-10 flex items-center gap-3 text-[10px] font-semibold tracking-[0.16em] text-black/38 uppercase">
                <span className="h-px w-10 bg-[#9d3027]/55" />
                No prophecy · a pattern to consider
              </div>
            </div>

            <div className="animate-rise-delayed mt-16 space-y-4 border-t border-black/10 pt-6 text-xs text-black/42">
              {[
                'Your city confirms location and civil time zone',
                'Unknown birth time remains a valid path',
                'One reading covers character, work, love, and timing',
              ].map((item) => (
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
                A quiet reading of your pattern
              </p>
              <p className="mt-3 max-w-sm font-serif text-3xl leading-9">
                Discover the patterns Chinese astrology sees in your life.
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
                      ? locale === 'zh'
                        ? '设定日期'
                        : 'Set the date.'
                      : step === 2
                        ? locale === 'zh'
                          ? '设定时间'
                          : 'Set the hour.'
                        : locale === 'zh'
                          ? '确认城市'
                          : 'Confirm the city.'}
                  </h2>
                </div>
                <span className="pb-2 text-[10px] font-semibold tracking-[0.16em] text-black/32 uppercase">
                  {locale === 'zh' ? `第 ${step} 步，共 3 步` : `${step} of 3`}
                </span>
              </div>

              <ol
                aria-label="Birth reading steps"
                className="mt-8 grid grid-cols-3 border-y border-black/10"
              >
                {(['Date', 'Time', 'City'] as const).map((label, index) => {
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
                      <span className="field-label">Birth date</span>
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
                    {directInput
                      ? 'Use the birth wheel'
                      : 'Type the date instead'}
                  </button>
                  <Button
                    className="glow-control mt-8 h-14 w-full rounded-none bg-[#1b1a17] text-xs tracking-[0.14em] uppercase hover:bg-[#9d3027]"
                    disabled={!dateInteracted}
                    onClick={() => setStep(2)}
                    type="button"
                  >
                    Confirm {birthValue.year} · {pad(birthValue.month)} ·{' '}
                    {pad(birthValue.day)}
                    <ArrowUpRight className="size-4" />
                  </Button>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="mt-8">
                  <fieldset>
                    <legend className="field-label">
                      How certain is the time?
                    </legend>
                    <p className="mb-4 text-xs leading-5 text-black/45">
                      Exact is recommended. A precise birth time gives the
                      clearest four-pillar reading; unknown is still valid.
                    </p>
                    <div
                      className="grid grid-cols-3 border border-black/12"
                      role="radiogroup"
                    >
                      {(
                        [
                          ['exact', 'Exact'],
                          ['approximate', 'Approximate'],
                          ['unknown', 'Unknown'],
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
                                  minute: 0,
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
                      No hour will be guessed. The reading will use three
                      pillars and lower confidence where time matters.
                    </p>
                  ) : directInput ? (
                    <label className="mt-8 block" htmlFor="directTime">
                      <span className="field-label">Birth time</span>
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
                      {directInput
                        ? 'Use the birth wheel'
                        : 'Type the time instead'}
                    </button>
                  ) : null}

                  <div className="mt-8 grid grid-cols-[0.8fr_1.2fr] gap-3">
                    <Button
                      className="h-14 rounded-none border-black/15 bg-transparent text-xs tracking-[0.12em] uppercase hover:bg-black/[0.03]"
                      onClick={() => setStep(1)}
                      type="button"
                      variant="outline"
                    >
                      Back
                    </Button>
                    <Button
                      className="glow-control h-14 rounded-none bg-[#1b1a17] text-xs tracking-[0.12em] uppercase hover:bg-[#9d3027]"
                      disabled={
                        !timeConfidence ||
                        (timeConfidence !== 'unknown' && !timeInteracted)
                      }
                      onClick={() => {
                        if (isTestDate(birthValue)) {
                          setBirthPlace('Melbourne, Australia');
                          setConfirmedPlace({
                            label: 'Melbourne, Victoria, Australia',
                            ianaTimeZone: 'Australia/Melbourne',
                          });
                        }
                        setStep(3);
                      }}
                      type="button"
                    >
                      Continue <ArrowUpRight className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="mt-10">
                  <div className="mb-8 grid gap-6 sm:grid-cols-[1.1fr_0.9fr]">
                    <label className="block" htmlFor="name">
                      <span className="field-label">Name · optional</span>
                      <Input
                        className="minimal-input"
                        id="name"
                        maxLength={80}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="How should we address you?"
                        value={name}
                      />
                    </label>
                    <fieldset>
                      <legend className="field-label">Gender · optional</legend>
                      <div
                        className="grid grid-cols-3 border border-black/12"
                        role="radiogroup"
                      >
                        {(
                          [
                            ['male', 'Male'],
                            ['female', 'Female'],
                            ['undisclosed', 'Prefer not to say'],
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
                    <span className="field-label">Place of birth</span>
                    <span className="relative block">
                      <MapPin className="pointer-events-none absolute top-1/2 left-1 size-4 -translate-y-1/2 text-[#9d3027]" />
                      <Input
                        className="minimal-input !pr-0 !pl-8"
                        id="birthPlace"
                        onChange={(event) => {
                          setBirthPlace(event.target.value);
                          setConfirmedPlace(null);
                        }}
                        placeholder="Melbourne, Australia"
                        required
                        value={birthPlace}
                      />
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-black/42">
                      City is enough. Add the country when cities share a name.
                    </span>
                  </label>

                  {confirmedPlace ? (
                    <div className="mt-6 border border-black/10 bg-white/25 p-4">
                      <p className="text-xs font-semibold text-[#9d3027]">
                        Location confirmed
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
                          Confirming city
                        </>
                      ) : (
                        'Confirm this city'
                      )}
                    </Button>
                  )}

                  <div className="mt-7 block">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <span>
                        <span className="field-label">
                          {locale === 'zh' ? '解读深度' : 'Reading depth'}
                        </span>
                        <NativeSelect
                          className="minimal-select"
                          id="tier"
                          onChange={(event) =>
                            setTier(event.target.value as 'free' | 'premium')
                          }
                          value={tier}
                        >
                          <option value="free">
                            {locale === 'zh'
                              ? '基础 · 更快'
                              : 'Essential · quicker'}
                          </option>
                          <option value="premium">
                            {locale === 'zh'
                              ? '深度 · 较慢'
                              : 'Deep reading · slower'}
                          </option>
                        </NativeSelect>
                      </span>
                      <span>
                        <span className="field-label">
                          {locale === 'zh' ? '语言' : 'Language'}
                        </span>
                        <NativeSelect
                          className="minimal-select"
                          id="locale"
                          onChange={(event) =>
                            setLocale(event.target.value as ReadingLocale)
                          }
                          value={locale}
                        >
                          <option value="en">English</option>
                          <option value="zh">简体中文</option>
                        </NativeSelect>
                      </span>
                    </div>
                  </div>

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
                      <span>
                        I’m willing to share anonymous feedback to help us make
                        this prototype better. This is optional.
                      </span>
                    </label>
                    <p className="text-[11px] leading-5 text-black/38">
                      To generate your reading, your birth date, city, and any
                      optional details you provide are sent to our AI provider.
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
                      Back
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
                          Reveal my reading <ArrowUpRight className="size-4" />
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
                <p>
                  Birth details are processed to create this reading and are not
                  stored by this prototype. Interpretation is for reflection,
                  not professional advice.
                </p>
              </div>
            </form>
          </div>
        </section>
      )}
      {loading ? <ReadingLoading /> : null}
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 mx-auto flex h-20 max-w-[1280px] items-center justify-between border-b border-black/10 bg-[#f2efe8]/88 px-6 backdrop-blur-md sm:px-10 lg:px-14">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center bg-[#9d3027] font-serif text-sm text-white shadow-[0_5px_18px_rgb(157_48_39_/_18%)]">
          命
        </span>
        <span className="font-serif text-xl tracking-[0.2em]">MING</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden h-1.5 w-1.5 animate-pulse rounded-full bg-[#9d3027] sm:block" />
        <p className="max-[420px]:hidden text-[10px] font-medium tracking-[0.2em] text-black/45 uppercase">
          Private beta · Four Pillars
        </p>
      </div>
    </header>
  );
}

const loadingStages = [
  ['定', 'Confirming the place and local time'],
  ['曆', 'Aligning the date with the solar-term calendar'],
  ['柱', 'Forming the visible pillars'],
  ['象', 'Tracing earlier turning points'],
  ['解', 'Composing your complete reading'],
] as const;

function ReadingLoading() {
  const [stage, setStage] = useState(0);

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
        {loadingStages[stage][1]}
      </output>
      <div aria-hidden="true" className="w-full max-w-md text-center">
        <div className="relative mx-auto grid size-28 place-items-center animate-breathe">
          <span className="absolute inset-0 animate-spin rounded-full border border-[#f2efe8]/10 border-t-[#b94a3e] [animation-duration:3s]" />
          <span className="absolute inset-3 animate-[spin_5s_linear_infinite_reverse] rounded-full border border-dashed border-[#f2efe8]/16" />
          <span className="font-serif text-4xl text-[#d86a5d] transition-all duration-700">
            {loadingStages[stage][0]}
          </span>
        </div>
        <p className="mt-9 text-[10px] font-semibold tracking-[0.22em] text-[#d86a5d] uppercase">
          Reading the pattern · 0{stage + 1}
        </p>
        <p className="mt-4 font-serif text-3xl leading-9">
          {loadingStages[stage][1]}
        </p>
        <div className="mt-9 h-px overflow-hidden bg-white/10">
          <div
            className="h-full bg-[#b94a3e] transition-all duration-700 animate-draw"
            style={{ width: `${((stage + 1) / loadingStages.length) * 100}%` }}
          />
        </div>
        <p className="mt-5 text-xs leading-5 text-white/35">
          The chart is calculated first. The model interprets only the verified
          pattern.
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
  const [relationshipUnlocked, setRelationshipUnlocked] = useState(false);
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

      <ReadingSummary reading={reading} locale={locale} />

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
                  : '本地计算结果 · AI 备用解读'
              : reading.interpretationSource === 'deepseek'
                ? 'DeepSeek interpretation · locally calculated chart'
                : reading.interpretationSource === 'fixture'
                  ? 'Saved test fixture · no API request'
                  : 'Locally calculated reading · AI fallback'}
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
          view === 'relationships' && !relationshipUnlocked ? (
            <LockedLifeArea
              area={reading.interpretation.lifeAreas.relationships}
              locale={locale}
              onUnlock={() => setRelationshipUnlocked(true)}
            />
          ) : (
            <LifeAreaView
              area={reading.interpretation.lifeAreas[view as LifeAreaKey]}
              locale={locale}
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
        <LifeAreaView area={area} locale={locale} />
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

function LifeAreaView({
  area,
  locale,
}: {
  area: LifeArea;
  locale: ReadingLocale;
}) {
  return (
    <section>
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
      <p className="mt-8 font-serif text-2xl leading-9 text-black/78">
        {area.narrative}
      </p>
      <div className="mt-10 grid gap-px bg-black/10 sm:grid-cols-2">
        {area.signals.map((signal, index) => (
          <div className="bg-[#f2efe8] p-6" key={signal}>
            <p className="font-serif text-lg text-[#9d3027]">0{index + 1}</p>
            <p className="mt-3 text-sm leading-6 text-black/58">{signal}</p>
          </div>
        ))}
      </div>
      <div className="mt-9 border-l-2 border-[#9d3027] pl-5">
        <p className="text-[9px] font-semibold tracking-[0.15em] text-black/35 uppercase">
          {locale === 'zh' ? '带走这一点' : 'Take with you'}
        </p>
        <p className="mt-2 text-sm leading-6 text-black/62">{area.guidance}</p>
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
            ? '本次结果使用八字、节气、真太阳时、藏干、十神与流年冲合。大运和紫微斗数尚未接入结构化计算，因此模型不会对它们作出假设。'
            : 'This reading uses BaZi, solar terms, apparent solar time, hidden stems, Ten Gods, and annual branch relations. Da Yun and Ziwei Dou Shu are not yet structured here, so the model is instructed not to guess them.'}
        </p>
      </div>

      <div className="mt-8 grid gap-px bg-black/10 sm:grid-cols-3">
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
      </div>

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

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

type TimeConfidence = 'exact' | 'approximate' | 'unknown';
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

  function resetReading() {
    setReading(null);
    setBirthValue(initialBirthValue);
    setTimeConfidence('exact');
    setBirthPlace('');
    setConfirmedPlace(null);
    setTier('free');
    setStep(1);
    setDirectInput(false);
    setDateInteracted(false);
    setTimeInteracted(false);
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
          tier,
        }),
      });
      const payload = (await response.json()) as Reading & { error?: string };
      if (!response.ok)
        throw new Error(payload.error ?? 'Unable to create reading.');
      setReading(payload);
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
        <ReadingResult reading={reading} onReset={resetReading} />
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
                      ? 'Birth date'
                      : step === 2
                        ? 'Birth time'
                        : 'Birth place'}
                  </p>
                  <h2 className="mt-3 font-serif text-4xl tracking-[-0.035em] sm:text-5xl">
                    {step === 1
                      ? 'Set the date.'
                      : step === 2
                        ? 'Set the hour.'
                        : 'Confirm the city.'}
                  </h2>
                </div>
                <span className="pb-2 text-[10px] font-semibold tracking-[0.16em] text-black/32 uppercase">
                  {step} of 3
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

                  <label className="mt-7 block" htmlFor="tier">
                    <span className="field-label">Reading depth</span>
                    <NativeSelect
                      className="minimal-select"
                      id="tier"
                      onChange={(event) =>
                        setTier(event.target.value as 'free' | 'premium')
                      }
                      value={tier}
                    >
                      <option value="free">Essential · quicker</option>
                      <option value="premium">Deep reading · slower</option>
                    </NativeSelect>
                  </label>

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
  onReset,
}: {
  reading: Reading;
  onReset: () => void;
}) {
  const [view, setView] = useState<ResultView>('past');
  const [relationshipUnlocked, setRelationshipUnlocked] = useState(false);

  function moveTab(direction: -1 | 1) {
    const currentIndex = resultTabs.findIndex((tab) => tab.value === view);
    const nextIndex =
      (currentIndex + direction + resultTabs.length) % resultTabs.length;
    const next = resultTabs[nextIndex];
    setView(next.value);
    requestAnimationFrame(() =>
      document.getElementById(`reading-tab-${next.value}`)?.focus(),
    );
  }

  return (
    <div className="animate-rise mx-auto max-w-[1180px] px-6 py-12 sm:px-10 sm:py-16">
      <button
        className="mb-8 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-black/42 uppercase transition hover:gap-3 hover:text-[#9d3027]"
        onClick={onReset}
        type="button"
      >
        <ArrowLeft className="size-3.5" /> New reading
      </button>

      <nav
        aria-label="Reading sections"
        className="result-tabs mb-10 flex snap-x snap-mandatory overflow-x-auto border-y border-black/10"
      >
        {resultTabs.map((tab) => (
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

      <ReadingSummary reading={reading} />

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
            {Object.entries(reading.chart.elementBalance).map(([element, count]) => (
              <span className="border border-black/10 px-2.5 py-1.5" key={element}>
                {elementNames[element]} {count}
              </span>
            ))}
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
            {reading.interpretationSource === 'deepseek'
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
        {view === 'past' ? <PastView reading={reading} /> : null}
        {(['character', 'career', 'relationships', 'timing'] as const).includes(
          view as LifeAreaKey,
        ) ? (
          view === 'relationships' && !relationshipUnlocked ? (
            <LockedLifeArea
              area={reading.interpretation.lifeAreas.relationships}
              onUnlock={() => setRelationshipUnlocked(true)}
            />
          ) : (
            <LifeAreaView
              area={reading.interpretation.lifeAreas[view as LifeAreaKey]}
            />
          )
        ) : null}
        {view === 'method' ? <MethodView reading={reading} /> : null}
      </div>
    </div>
  );
}

function LockedLifeArea({
  area,
  onUnlock,
}: {
  area: LifeArea;
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
        <LifeAreaView area={area} />
      </div>
      <div className="absolute inset-0 grid place-items-center bg-[#f2efe8]/72 p-6 backdrop-blur-[2px]">
        <div className="w-full max-w-sm border border-black/12 bg-[#f2efe8] p-7 text-center shadow-[0_24px_70px_rgba(43,34,24,0.12)]">
          <span className="mx-auto grid size-10 place-items-center rounded-full border border-[#9d3027]/30 text-[#9d3027]">
            <LockKeyhole className="size-4" />
          </span>
          <p className="mt-5 text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
            Private chamber
          </p>
          <h2 className="mt-2 font-serif text-3xl">Unlock Love & Bonds</h2>
          <p className="mt-3 text-sm leading-6 text-black/50">
            Enter your Jade Pass to reveal the full relationship reading.
          </p>
          <label className="mt-6 block text-left" htmlFor="jadePass">
            <span className="field-label">Jade Pass</span>
            <Input
              className="minimal-input text-center tracking-[0.3em]"
              id="jadePass"
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') unlock();
              }}
              placeholder="Enter code"
              value={code}
            />
          </label>
          <Button
            className="glow-control mt-5 h-12 w-full rounded-none bg-[#1b1a17] text-xs tracking-[0.12em] uppercase hover:bg-[#9d3027]"
            onClick={unlock}
            type="button"
          >
            Open the chamber
          </Button>
          {codeError ? (
            <p className="mt-3 text-xs text-[#9d3027]" role="alert">
              {codeError}
            </p>
          ) : null}
          <p className="mt-4 text-[10px] leading-4 text-black/30">
            Prototype access only. Test code: 666
          </p>
        </div>
      </div>
    </section>
  );
}

function ReadingSummary({ reading }: { reading: Reading }) {
  return (
    <section className="mb-12 max-w-3xl border-l-2 border-[#9d3027] pl-5 sm:pl-7">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-[#9d3027] uppercase">
        Your reading in two lines
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

function PastView({ reading }: { reading: Reading }) {
  const [matches, setMatches] = useState<Record<number, string>>({});

  return (
    <section>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
        Recognition before prediction
      </p>
      <div className="mt-3 flex items-end justify-between gap-6 border-b border-black/10 pb-6">
        <div>
          <h2 className="font-serif text-4xl">Do these periods match?</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-black/48">
            Treat each as a hypothesis. A miss is useful information—not
            something the reading should explain away.
          </p>
        </div>
        <span className="hidden text-[9px] text-black/32 sm:block">
          Match · Partial · Miss
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
                {['Match', 'Partial', 'Miss'].map((choice) => (
                  <button
                    aria-pressed={matches[patternIndex] === choice}
                    className={`glow-control border px-3 py-2 text-[10px] font-semibold tracking-[0.08em] uppercase transition ${matches[patternIndex] === choice ? 'border-[#9d3027] bg-[#9d3027] text-white' : 'border-black/12 text-black/38 hover:border-black/30'}`}
                    key={choice}
                    onClick={() =>
                      setMatches((current) => ({
                        ...current,
                        [patternIndex]: choice,
                      }))
                    }
                    type="button"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LifeAreaView({ area }: { area: LifeArea }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-5">
        <h2 className="font-serif text-4xl tracking-[-0.03em]">
          {area.headline}
        </h2>
        <span className="shrink-0 text-[9px] tracking-[0.1em] text-black/30 uppercase">
          {area.confidence} confidence
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
          Take with you
        </p>
        <p className="mt-2 text-sm leading-6 text-black/62">{area.guidance}</p>
      </div>
      <p className="mt-8 text-[10px] leading-5 text-black/30">
        Basis: {area.basis}
      </p>
    </section>
  );
}

function MethodView({ reading }: { reading: Reading }) {
  return (
    <section>
      <p className="text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
        Calculation and limits
      </p>
      <h2 className="mt-3 font-serif text-4xl">What the reading used.</h2>

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
              Apparent solar offset
            </p>
            <p className="mt-2 font-serif text-2xl">
              {reading.chart.timeAdjustment.minutes >= 0 ? '+' : ''}
              {reading.chart.timeAdjustment.minutes} min
            </p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.12em] text-black/32 uppercase">
              Adjusted birth time
            </p>
            <p className="mt-2 font-serif text-2xl">
              {reading.chart.timeAdjustment.adjustedLocalTime ??
                'Not available'}
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

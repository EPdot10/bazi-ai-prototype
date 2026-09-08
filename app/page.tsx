'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  LoaderCircle,
  LockKeyhole,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

type TimeConfidence = 'exact' | 'approximate' | 'unknown';
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
  };
  interpretation: {
    summary: string;
    pastPatterns: Array<{
      period: string;
      headline: string;
      possibilities: string[];
      basis: string;
      confidence: string;
    }>;
    insights: Array<{
      title: string;
      interpretation: string;
      basis: string;
      confidence: string;
    }>;
    reflectionQuestions: string[];
    limitations: string;
  };
  interpretationSource: 'deepseek' | 'local';
  modelNotice?: string;
}

const elementNames: Record<string, string> = {
  wood: 'Wood',
  fire: 'Fire',
  earth: 'Earth',
  metal: 'Metal',
  water: 'Water',
};

export default function Home() {
  const [timeConfidence, setTimeConfidence] = useState<TimeConfidence>('exact');
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitReading(formElement: HTMLFormElement) {
    setLoading(true);
    setError('');

    const form = new FormData(formElement);
    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: form.get('birthDate'),
          birthTime: form.get('birthTime'),
          birthTimeConfidence: timeConfidence,
          birthPlace: form.get('birthPlace'),
          topic: form.get('topic'),
          tier: form.get('tier'),
        }),
      });
      const payload = (await response.json()) as Reading & { error?: string };
      if (!response.ok)
        throw new Error(payload.error ?? 'Unable to create reading.');
      setReading(payload);
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
      <header className="mx-auto flex h-20 max-w-[1280px] items-center justify-between border-b border-black/10 px-6 sm:px-10 lg:px-14">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center bg-[#9d3027] font-serif text-sm text-white">
            命
          </span>
          <span className="font-serif text-xl tracking-[0.2em]">MING</span>
        </div>
        <p className="text-[10px] font-medium tracking-[0.2em] text-black/45 uppercase">
          BaZi · Four Pillars
        </p>
      </header>

      <section className="mx-auto grid max-w-[1280px] lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex flex-col justify-between px-6 py-14 sm:px-10 sm:py-20 lg:px-14 lg:py-24">
          <div>
            <p className="mb-7 text-[10px] font-semibold tracking-[0.24em] text-[#9d3027] uppercase">
              A Chinese practice of time & pattern
            </p>
            <h1 className="max-w-[760px] font-serif text-[clamp(3.6rem,7vw,7.6rem)] leading-[0.88] font-medium tracking-[-0.055em]">
              A reading of the moment you arrived.
            </h1>
            <p className="mt-8 max-w-lg text-sm leading-7 text-black/56 sm:text-[15px]">
              Your birth date, time and place become four pillars—a quiet
              framework for reflecting on temperament, timing and change.
            </p>
          </div>

          <div className="mt-20 flex items-center gap-4 text-[10px] font-semibold tracking-[0.2em] text-black/35 uppercase lg:mt-12">
            <span>Year</span>
            <span className="text-[#9d3027]">·</span>
            <span>Month</span>
            <span className="text-[#9d3027]">·</span>
            <span>Day</span>
            <span className="text-[#9d3027]">·</span>
            <span>Hour</span>
          </div>
        </div>

        <div className="border-t border-black/10 px-6 py-14 sm:px-10 sm:py-20 lg:border-t-0 lg:border-l lg:px-14 lg:py-24">
          <div className="mx-auto max-w-md">
            {reading ? (
              <ReadingResult
                reading={reading}
                onReset={() => setReading(null)}
              />
            ) : (
              <>
                <p className="text-[10px] font-semibold tracking-[0.2em] text-black/38 uppercase">
                  Your details
                </p>
                <h2 className="mt-4 font-serif text-4xl tracking-[-0.035em]">
                  Begin your reading.
                </h2>

                <form
                  className="mt-12 space-y-8"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitReading(event.currentTarget);
                  }}
                >
                  <label className="block" htmlFor="birthDate">
                    <span className="field-label">Date of birth</span>
                    <Input
                      className="minimal-input"
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      required
                    />
                  </label>

                  <div className="grid grid-cols-[1fr_1.15fr] gap-6">
                    <label className="block" htmlFor="birthTime">
                      <span className="field-label">Time</span>
                      <Input
                        className="minimal-input"
                        id="birthTime"
                        name="birthTime"
                        type="time"
                        required={timeConfidence !== 'unknown'}
                        disabled={timeConfidence === 'unknown'}
                      />
                    </label>

                    <label className="block" htmlFor="timeConfidence">
                      <span className="field-label">Accuracy</span>
                      <NativeSelect
                        className="minimal-select"
                        id="timeConfidence"
                        name="timeConfidence"
                        value={timeConfidence}
                        onChange={(event) =>
                          setTimeConfidence(
                            event.target.value as TimeConfidence,
                          )
                        }
                      >
                        <option value="exact">Exact time</option>
                        <option value="approximate">Approximate</option>
                        <option value="unknown">I don&apos;t know</option>
                      </NativeSelect>
                    </label>
                  </div>

                  <label className="block" htmlFor="birthPlace">
                    <span className="field-label">Place of birth</span>
                    <Input
                      className="minimal-input"
                      id="birthPlace"
                      name="birthPlace"
                      placeholder="City, state, country"
                      required
                    />
                    <span className="mt-2 block text-[11px] leading-5 text-black/38">
                      We confirm the city and its historical civil time zone
                      before calculating the chart.
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-6">
                    <label className="block" htmlFor="topic">
                      <span className="field-label">Focus</span>
                      <NativeSelect
                        className="minimal-select"
                        id="topic"
                        name="topic"
                      >
                        <option value="overview">Life overview</option>
                        <option value="career">Career</option>
                        <option value="relationships">Relationships</option>
                        <option value="year-ahead">Year ahead</option>
                      </NativeSelect>
                    </label>
                    <label className="block" htmlFor="tier">
                      <span className="field-label">Model</span>
                      <NativeSelect
                        className="minimal-select"
                        id="tier"
                        name="tier"
                      >
                        <option value="free">Flash · quick</option>
                        <option value="premium">Pro · deeper</option>
                      </NativeSelect>
                    </label>
                  </div>

                  <Button
                    className="h-14 w-full rounded-none bg-[#1b1a17] text-xs tracking-[0.14em] text-white uppercase hover:bg-[#9d3027]"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Calculating your chart
                      </>
                    ) : (
                      <>
                        Reveal my pillars
                        <ArrowUpRight className="size-4" />
                      </>
                    )}
                  </Button>

                  {error ? (
                    <p
                      className="border-l-2 border-[#9d3027] pl-4 text-sm leading-6 text-[#8b2b24]"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}

                  <div className="flex items-start gap-2.5 text-[11px] leading-5 text-black/42">
                    <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
                    <p>
                      Details are processed to create this reading and are not
                      stored by this prototype. Traditional interpretation is
                      for reflection, not professional advice.
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ReadingResult({
  reading,
  onReset,
}: {
  reading: Reading;
  onReset: () => void;
}) {
  return (
    <article>
      <button
        className="mb-9 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-black/42 uppercase hover:text-[#9d3027]"
        onClick={onReset}
        type="button"
      >
        <ArrowLeft className="size-3.5" /> New reading
      </button>

      <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9d3027] uppercase">
        Your chart
      </p>
      <h2 className="mt-3 font-serif text-4xl tracking-[-0.035em]">
        {reading.chart.dayMaster} Day Master
      </h2>
      <p className="mt-3 text-xs leading-5 text-black/45">
        {reading.resolvedPlace.label}
        <br />
        {reading.resolvedPlace.ianaTimeZone}
      </p>

      <div className="mt-8 grid grid-cols-4 border-y border-black/10 py-5">
        {(['year', 'month', 'day', 'hour'] as const).map((key) => (
          <div key={key} className="text-center">
            <p className="text-[9px] tracking-[0.14em] text-black/35 uppercase">
              {key}
            </p>
            <p className="mt-2 font-serif text-xl">
              {reading.chart.pillars[key] ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {reading.chart.birthTimeConfidence === 'unknown' ? (
        <p className="mt-4 border-l-2 border-[#9d3027] pl-3 text-xs leading-5 text-black/52">
          The hour pillar is intentionally omitted. This reading avoids claims
          that depend on birth time.
        </p>
      ) : null}

      <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-[10px] tracking-[0.08em] text-black/42 uppercase">
        {Object.entries(reading.chart.elementBalance).map(
          ([element, count]) => (
            <span key={element}>
              {elementNames[element]} {count}
            </span>
          ),
        )}
      </div>

      <p className="mt-9 font-serif text-2xl leading-8">
        {reading.interpretation.summary}
      </p>
      <p className="mt-3 text-[9px] tracking-[0.12em] text-black/32 uppercase">
        {reading.interpretationSource === 'deepseek'
          ? 'DeepSeek interpretation · locally calculated chart'
          : 'Locally calculated reading · AI fallback'}
      </p>

      {reading.interpretation.pastPatterns.length ? (
        <section className="mt-10">
          <div className="flex items-end justify-between gap-4 border-b border-black/10 pb-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#9d3027] uppercase">
                Looking back
              </p>
              <h3 className="mt-2 font-serif text-2xl">
                Do these periods match?
              </h3>
            </div>
            <span className="text-[9px] text-black/32">
              Match · Partial · Miss
            </span>
          </div>

          <div className="divide-y divide-black/10">
            {reading.interpretation.pastPatterns.map((pattern) => (
              <article
                className="py-6"
                key={`${pattern.period}-${pattern.headline}`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-[#9d3027] uppercase">
                    {pattern.period}
                  </p>
                  <span className="text-[9px] tracking-[0.1em] text-black/30 uppercase">
                    {pattern.confidence} confidence
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-semibold">
                  {pattern.headline}
                </h4>
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
                <p className="mt-3 text-[10px] leading-4 text-black/30">
                  Basis: {pattern.basis}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-9 space-y-8">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-black/38 uppercase">
          Your underlying patterns
        </p>
        {reading.interpretation.insights.map((insight) => (
          <section key={insight.title}>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-sm font-semibold">{insight.title}</h3>
              <span className="text-[9px] tracking-[0.12em] text-black/35 uppercase">
                {insight.confidence} confidence
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-black/58">
              {insight.interpretation}
            </p>
            <p className="mt-2 text-[10px] leading-4 text-black/34">
              Basis: {insight.basis}
            </p>
          </section>
        ))}
      </div>

      {reading.interpretation.reflectionQuestions.length ? (
        <section className="mt-9 border-t border-black/10 pt-7">
          <h3 className="text-[10px] font-semibold tracking-[0.16em] text-black/38 uppercase">
            Questions to take with you
          </h3>
          <ol className="mt-4 list-none space-y-3">
            {reading.interpretation.reflectionQuestions.map(
              (question, index) => (
                <li
                  key={question}
                  className="grid grid-cols-[1.25rem_1fr] text-sm leading-6 text-black/55"
                >
                  <span className="font-serif text-[#9d3027]">{index + 1}</span>
                  <span>{question}</span>
                </li>
              ),
            )}
          </ol>
        </section>
      ) : null}

      {reading.modelNotice ? (
        <p className="mt-8 text-[11px] leading-5 text-black/38">
          {reading.modelNotice}
        </p>
      ) : null}

      <p className="mt-8 border-t border-black/10 pt-5 text-[11px] leading-5 text-black/38">
        {reading.interpretation.limitations}
      </p>
    </article>
  );
}

'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Compass,
  Database,
  LockKeyhole,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TimeConfidence = 'exact' | 'approximate' | 'unknown';

const pillars = [
  ['Year', '年', 'ancestry'],
  ['Month', '月', 'environment'],
  ['Day', '日', 'core self'],
  ['Hour', '时', 'inner world'],
];

export default function Home() {
  const [timeConfidence, setTimeConfidence] = useState<TimeConfidence>('exact');
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-70 [background-image:radial-gradient(circle_at_16%_12%,rgba(170,55,34,.12),transparent_28%),radial-gradient(circle_at_85%_25%,rgba(34,88,72,.11),transparent_30%)]" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full border border-primary/25 bg-primary text-primary-foreground">
            <span className="font-heading text-lg">命</span>
          </div>
          <div>
            <p className="font-heading text-lg tracking-[0.18em]">MING</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Private prototype
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
          BaZi · Four Pillars
        </span>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-16">
        <div className="max-w-2xl">
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground">
            <Compass className="size-4" /> Ancient pattern, modern
            interpretation
          </p>
          <h1 className="font-heading text-5xl leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
            Your birth moment holds more than a zodiac animal.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Discover your Day Master, elemental balance and the patterns that
            shaped your early life through the Chinese Four Pillars tradition.
          </p>
          <div className="mt-9 grid grid-cols-4 gap-2 sm:max-w-xl sm:gap-3">
            {pillars.map(([label, character, detail], index) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-card/70 p-3 text-center shadow-sm backdrop-blur sm:p-4"
              >
                <span className="font-heading text-2xl text-primary">
                  {character}
                </span>
                <p className="mt-2 text-xs font-semibold">{label}</p>
                <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
                  {detail}
                </p>
                {index === 3 && (
                  <span className="mt-2 block text-[9px] text-muted-foreground">
                    optional
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-card/90 p-5 shadow-[0_28px_90px_rgba(42,29,17,.14)] backdrop-blur sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Free elemental profile
              </p>
              <h2 className="mt-2 font-heading text-2xl">
                Begin with your birth details
              </h2>
            </div>
            <LockKeyhole className="mt-1 size-5 text-muted-foreground" />
          </div>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Date of birth
                <Input
                  className="h-11 bg-background"
                  name="birthDate"
                  type="date"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Birth time
                <Input
                  className="h-11 bg-background"
                  disabled={timeConfidence === 'unknown'}
                  name="birthTime"
                  type="time"
                  required={timeConfidence !== 'unknown'}
                />
              </label>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">
                How certain is the birth time?
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['exact', 'Exact'],
                    ['approximate', 'Approximate'],
                    ['unknown', 'Unknown'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${timeConfidence === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}
                    key={value}
                    onClick={() => setTimeConfidence(value)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block space-y-2 text-sm font-medium">
              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" /> Place of birth
              </span>
              <Input
                className="h-11 bg-background"
                name="birthPlace"
                placeholder="City, state/province, country"
                required
              />
              <span className="block text-xs font-normal leading-5 text-muted-foreground">
                Birthplace lets us resolve the historical timezone, daylight
                saving rules and local solar time.
              </span>
            </label>
            <Button
              className="h-12 w-full rounded-xl text-sm"
              size="lg"
              type="submit"
            >
              Reveal my elemental profile <ArrowRight className="ml-1 size-4" />
            </Button>
            {submitted && (
              <div
                className="rounded-xl border border-accent bg-accent/65 p-3 text-sm leading-6 text-accent-foreground"
                role="status"
              >
                The secure intake flow is ready. Chart calculation and the
                private AI interpretation pipeline are the next implementation
                step.
              </div>
            )}
          </form>
          <div className="mt-5 flex items-start gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
            <Database className="mt-0.5 size-4 shrink-0" />
            <p>
              Your identifying details stay separate from the anonymised chart
              facts sent for AI interpretation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

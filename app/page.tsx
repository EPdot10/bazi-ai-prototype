'use client';

import { useState } from 'react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

type TimeConfidence = 'exact' | 'approximate' | 'unknown';

export default function Home() {
  const [timeConfidence, setTimeConfidence] = useState<TimeConfidence>('exact');
  const [submitted, setSubmitted] = useState(false);

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
            <p className="text-[10px] font-semibold tracking-[0.2em] text-black/38 uppercase">
              Your details
            </p>
            <h2 className="mt-4 font-serif text-4xl tracking-[-0.035em]">
              Begin your reading.
            </h2>

            <form
              className="mt-12 space-y-9"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <label className="block">
                <span className="field-label">Date of birth</span>
                <Input
                  className="minimal-input"
                  name="birthDate"
                  type="date"
                  required
                />
              </label>

              <div className="grid grid-cols-[1fr_1.15fr] gap-6">
                <label className="block">
                  <span className="field-label">Time</span>
                  <Input
                    className="minimal-input"
                    name="birthTime"
                    type="time"
                    disabled={timeConfidence === 'unknown'}
                  />
                </label>

                <label className="block">
                  <span className="field-label">Accuracy</span>
                  <NativeSelect
                    className="minimal-select"
                    name="timeConfidence"
                    value={timeConfidence}
                    onChange={(event) =>
                      setTimeConfidence(event.target.value as TimeConfidence)
                    }
                  >
                    <option value="exact">Exact time</option>
                    <option value="approximate">Approximate</option>
                    <option value="unknown">I don&apos;t know</option>
                  </NativeSelect>
                </label>
              </div>

              <label className="block">
                <span className="field-label">Place of birth</span>
                <Input
                  className="minimal-input"
                  name="birthPlace"
                  placeholder="City, country"
                  required
                />
                <span className="mt-2 block text-[11px] leading-5 text-black/38">
                  Enter a city and country so we can resolve the correct local
                  time and location.
                </span>
              </label>

              <Button
                className="h-14 w-full rounded-none bg-[#1b1a17] text-xs tracking-[0.14em] text-white uppercase hover:bg-[#9d3027]"
                type="submit"
              >
                Reveal my four pillars
                <ArrowUpRight className="size-4" />
              </Button>

              <div className="flex items-start gap-2.5 text-[11px] leading-5 text-black/42">
                <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Your birth details stay private. Readings are for reflection,
                  not medical, legal or financial advice.
                </p>
              </div>

              {submitted ? (
                <p
                  className="border-l-2 border-[#9d3027] pl-4 text-sm leading-6 text-black/62"
                  role="status"
                >
                  Your details are ready. The reading flow will connect here.
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

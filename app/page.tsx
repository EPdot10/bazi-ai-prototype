'use client';

import { useState } from 'react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TimeConfidence = 'exact' | 'approximate' | 'unknown';

const pillars = [
  { chinese: '年', english: 'Year', meaning: 'Lineage' },
  { chinese: '月', english: 'Month', meaning: 'Season' },
  { chinese: '日', english: 'Day', meaning: 'Self' },
  { chinese: '時', english: 'Hour', meaning: 'Inner life' },
];

const timeOptions: Array<{
  value: TimeConfidence;
  label: string;
  note: string;
}> = [
  { value: 'exact', label: 'Exact', note: 'From a record' },
  { value: 'approximate', label: 'Approx.', note: 'Best recollection' },
  { value: 'unknown', label: 'Unknown', note: 'Three pillars' },
];

export default function Home() {
  const [timeConfidence, setTimeConfidence] = useState<TimeConfidence>('exact');
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="ming-shell min-h-screen text-foreground">
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between border-b border-white/10 px-5 py-5 sm:px-9 lg:px-14">
        <a
          className="group flex items-center gap-4"
          href="#"
          aria-label="Ming home"
        >
          <span className="seal-mark">命</span>
          <span>
            <span className="block font-heading text-xl tracking-[0.3em] text-[#f1eadb]">
              MING
            </span>
            <span className="mt-0.5 block text-[9px] uppercase tracking-[0.32em] text-white/42">
              The Four Pillars
            </span>
          </span>
        </a>
        <nav
          className="hidden items-center gap-9 text-[10px] uppercase tracking-[0.22em] text-white/55 sm:flex"
          aria-label="Primary navigation"
        >
          <a className="transition hover:text-[#eee5d3]" href="#method">
            The method
          </a>
          <a className="transition hover:text-[#eee5d3]" href="#reading">
            Begin a reading
          </a>
        </nav>
        <span className="text-[10px] uppercase tracking-[0.24em] text-white/40">
          Est. in Sydney
        </span>
      </header>

      <section className="relative mx-auto grid max-w-[1440px] lg:min-h-[calc(100vh-81px)] lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative flex flex-col justify-between overflow-hidden border-white/10 px-5 pb-10 pt-14 sm:px-9 lg:border-r lg:px-14 lg:pb-12 lg:pt-20">
          <div className="orbit" aria-hidden="true">
            <span className="orbit-center">五行</span>
            <span className="orbit-word orbit-word-1">木</span>
            <span className="orbit-word orbit-word-2">火</span>
            <span className="orbit-word orbit-word-3">土</span>
            <span className="orbit-word orbit-word-4">金</span>
            <span className="orbit-word orbit-word-5">水</span>
          </div>

          <div className="relative z-[1] max-w-3xl">
            <p className="mb-7 flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-[#c5a566] before:h-px before:w-9 before:bg-[#a9864a]">
              An Eastern study of time & character
            </p>
            <h1 className="font-heading text-[clamp(3.9rem,7.2vw,7.7rem)] leading-[0.82] tracking-[-0.045em] text-[#f1eadb]">
              Your life,
              <span className="mt-3 block pl-[12%] italic text-[#cbb98d]">
                in four pillars.
              </span>
            </h1>
            <p className="mt-9 max-w-md text-sm leading-7 text-white/52 sm:text-base">
              A private reading of the moment and place you entered the
              world—translated through BaZi, the classical Chinese art of
              elemental pattern.
            </p>
          </div>

          <div
            id="method"
            className="relative z-[1] mt-16 grid max-w-2xl grid-cols-4 border-y border-white/12"
          >
            {pillars.map((pillar, index) => (
              <div
                className="group border-r border-white/12 px-2 py-5 first:pl-0 last:border-r-0 sm:px-5"
                key={pillar.english}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="font-heading text-3xl text-[#e6dac1] sm:text-4xl">
                    {pillar.chinese}
                  </span>
                  <span className="text-[8px] text-white/24">0{index + 1}</span>
                </div>
                <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-white/64">
                  {pillar.english}
                </p>
                <p className="mt-1 hidden text-[10px] text-white/28 sm:block">
                  {pillar.meaning}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          id="reading"
          className="paper-panel relative flex items-center px-5 py-10 sm:px-9 lg:px-14 lg:py-16"
        >
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="mb-12 flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9b2f25]">
                  Complimentary introduction
                </p>
                <h2 className="mt-4 max-w-sm font-heading text-4xl leading-[1.02] tracking-[-0.025em] text-[#211d18] sm:text-5xl">
                  Begin with what is known.
                </h2>
              </div>
              <span className="font-heading text-sm italic text-[#211d18]/38">
                01 / 03
              </span>
            </div>

            <form
              className="space-y-8"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="grid gap-7 sm:grid-cols-2">
                <label className="field-label">
                  <span>Date of birth</span>
                  <Input
                    className="editorial-input"
                    name="birthDate"
                    type="date"
                    required
                  />
                </label>
                <label className="field-label">
                  <span>Time of birth</span>
                  <Input
                    className="editorial-input"
                    disabled={timeConfidence === 'unknown'}
                    name="birthTime"
                    type="time"
                    required={timeConfidence !== 'unknown'}
                  />
                </label>
              </div>

              <fieldset>
                <legend className="field-kicker">
                  Certainty of birth time
                </legend>
                <div className="mt-3 grid grid-cols-3 border-y border-[#342d24]/20">
                  {timeOptions.map((option) => (
                    <button
                      className={`time-choice ${timeConfidence === option.value ? 'time-choice-active' : ''}`}
                      key={option.value}
                      onClick={() => setTimeConfidence(option.value)}
                      type="button"
                    >
                      <span>{option.label}</span>
                      <small>{option.note}</small>
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="field-label">
                <span>Place of birth</span>
                <Input
                  className="editorial-input"
                  name="birthPlace"
                  placeholder="City, region, country"
                  required
                />
                <small className="mt-2 block normal-case tracking-normal text-[#3d3429]/45">
                  Used to resolve historical local time. A city is precise
                  enough.
                </small>
              </label>

              <div className="pt-2">
                <Button
                  className="group h-14 w-full rounded-none bg-[#201b16] px-6 text-[11px] uppercase tracking-[0.22em] text-[#f4eddf] shadow-none hover:bg-[#9b2f25]"
                  size="lg"
                  type="submit"
                >
                  Read my elemental pattern
                  <ArrowUpRight className="ml-auto size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Button>
                <div className="mt-4 flex items-start gap-2.5 text-[10px] leading-5 text-[#3d3429]/45">
                  <LockKeyhole className="mt-0.5 size-3 shrink-0" />
                  <p>
                    Your details are used only to construct this reading. Exact
                    birth time is optional.
                  </p>
                </div>
              </div>

              {submitted && (
                <div
                  className="border-l-2 border-[#9b2f25] bg-[#9b2f25]/5 px-4 py-3 text-sm leading-6 text-[#332b23]"
                  role="status"
                >
                  Your details have been received. The reading experience will
                  appear here when the calculation layer is connected.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

'use client';

import { useMemo } from 'react';
import Picker from 'react-mobile-picker';

export interface BirthWheelValue {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

interface BirthWheelProps {
  value: BirthWheelValue;
  onChange: (value: BirthWheelValue) => void;
  mode: 'date' | 'time';
  approximateTime?: boolean;
  onInteract?: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1919 }, (_, index) =>
  String(currentYear - index),
);
const months = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);
const hours = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
);
const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0'),
);

function WheelItem({
  value,
  label = value,
}: {
  value: string;
  label?: string;
}) {
  return (
    <Picker.Item value={value}>
      {({ selected }) => (
        <span
          className={`font-serif transition-all ${
            selected ? 'text-2xl text-[#181714]' : 'text-lg text-black/24'
          }`}
        >
          {label}
        </span>
      )}
    </Picker.Item>
  );
}

export function BirthWheel({
  value,
  onChange,
  mode,
  approximateTime = false,
  onInteract,
}: BirthWheelProps) {
  const days = useMemo(() => {
    const dayCount = new Date(value.year, value.month, 0).getDate();
    return Array.from({ length: dayCount }, (_, index) =>
      String(index + 1).padStart(2, '0'),
    );
  }, [value.month, value.year]);
  const loopMonths = useMemo(
    () =>
      ['previous', 'current', 'next'].flatMap((cycle) =>
        months.map((month) => ({ value: `${cycle}:${month}`, label: month })),
      ),
    [],
  );
  const loopDays = useMemo(
    () =>
      ['previous', 'current', 'next'].flatMap((cycle) =>
        days.map((day) => ({ value: `${cycle}:${day}`, label: day })),
      ),
    [days],
  );

  const pickerValue: Record<string, string | number> =
    mode === 'date'
      ? {
          year: String(value.year),
          month: `current:${String(value.month).padStart(2, '0')}`,
          day: `current:${String(Math.min(value.day, days.length)).padStart(2, '0')}`,
        }
      : {
          hour: String(value.hour).padStart(2, '0'),
          ...(approximateTime
            ? {}
            : { minute: String(value.minute).padStart(2, '0') }),
        };

  function handleChange(next: Record<string, string | number>) {
    const numericPart = (input: string | number) =>
      Number(String(input).split(':').at(-1));
    const updated = {
      ...value,
      ...(next.year ? { year: numericPart(next.year) } : {}),
      ...(next.month ? { month: numericPart(next.month) } : {}),
      ...(next.day ? { day: numericPart(next.day) } : {}),
      ...(next.hour !== undefined ? { hour: numericPart(next.hour) } : {}),
      ...(next.minute !== undefined
        ? { minute: numericPart(next.minute) }
        : {}),
    };
    const dayCount = new Date(updated.year, updated.month, 0).getDate();
    updated.day = Math.min(updated.day, dayCount);
    onChange(updated);
  }

  return (
    <div
      className="birth-wheel"
      aria-label={mode === 'date' ? 'Birth date wheel' : 'Birth time wheel'}
      onKeyDownCapture={onInteract}
      onPointerDownCapture={onInteract}
      onWheelCapture={onInteract}
    >
      <p className="sr-only">
        Use touch drag or the mouse wheel to change a column. A direct input
        option follows this picker.
      </p>
      <output className="sr-only" aria-live="polite">
        {mode === 'date'
          ? `Selected date ${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
          : `Selected time ${String(value.hour).padStart(2, '0')}${approximateTime ? ', approximately' : `:${String(value.minute).padStart(2, '0')}`}`}
      </output>

      <div
        className={`mb-2 grid ${mode === 'date' ? 'grid-cols-[1.35fr_1fr_1fr]' : approximateTime ? 'grid-cols-1' : 'grid-cols-2'} text-center text-xs font-semibold tracking-[0.12em] text-black/38 uppercase`}
      >
        {mode === 'date' ? (
          <>
            <span>Year</span>
            <span>Month</span>
            <span>Day</span>
          </>
        ) : (
          <>
            <span>Hour</span>
            {approximateTime ? null : <span>Minute</span>}
          </>
        )}
      </div>

      <div className="relative border-y border-black/10">
        <div className="pointer-events-none absolute top-1/2 right-0 left-0 h-10 -translate-y-1/2 border-y border-black/10 bg-white/35" />
        <Picker
          className="relative"
          height={mode === 'date' ? 210 : 168}
          itemHeight={42}
          onChange={handleChange}
          value={pickerValue}
          wheelMode="natural"
        >
          {mode === 'date' ? (
            <>
              <Picker.Column name="year">
                {years.map((year) => (
                  <WheelItem key={year} value={year} />
                ))}
              </Picker.Column>
              <Picker.Column name="month">
                {loopMonths.map((month) => (
                  <WheelItem
                    key={month.value}
                    label={month.label}
                    value={month.value}
                  />
                ))}
              </Picker.Column>
              <Picker.Column name="day">
                {loopDays.map((day) => (
                  <WheelItem
                    key={day.value}
                    label={day.label}
                    value={day.value}
                  />
                ))}
              </Picker.Column>
            </>
          ) : (
            <>
              <Picker.Column name="hour">
                {hours.map((hour) => (
                  <WheelItem key={hour} value={hour} />
                ))}
              </Picker.Column>
              {approximateTime ? null : (
                <Picker.Column name="minute">
                  {minutes.map((minute) => (
                    <WheelItem key={minute} value={minute} />
                  ))}
                </Picker.Column>
              )}
            </>
          )}
        </Picker>
      </div>

      <p className="mt-4 text-center font-serif text-lg text-black/65">
        {mode === 'date'
          ? `${value.year} · ${String(value.month).padStart(2, '0')} · ${String(value.day).padStart(2, '0')}`
          : `${String(value.hour).padStart(2, '0')}${approximateTime ? ':00 approximately' : `:${String(value.minute).padStart(2, '0')}`}`}
      </p>
    </div>
  );
}

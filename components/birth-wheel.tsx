'use client';

import { useMemo, useRef } from 'react';
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

type WheelColumn = 'year' | 'month' | 'day' | 'hour' | 'minute';

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
  const mouseDrag = useRef<{
    column: WheelColumn;
    lastY: number;
    remainder: number;
  } | null>(null);
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
  const loopHours = useMemo(
    () =>
      ['previous', 'current', 'next'].flatMap((cycle) =>
        hours.map((hour) => ({ value: `${cycle}:${hour}`, label: hour })),
      ),
    [],
  );
  const loopMinutes = useMemo(
    () =>
      ['previous', 'current', 'next'].flatMap((cycle) =>
        minutes.map((minute) => ({
          value: `${cycle}:${minute}`,
          label: minute,
        })),
      ),
    [],
  );
  const wheelRemainder = useRef(0);

  const pickerValue: Record<string, string | number> =
    mode === 'date'
      ? {
          year: String(value.year),
          month: `current:${String(value.month).padStart(2, '0')}`,
          day: `current:${String(Math.min(value.day, days.length)).padStart(2, '0')}`,
        }
      : {
          hour: `current:${String(value.hour).padStart(2, '0')}`,
          ...(approximateTime
            ? {}
            : { minute: `current:${String(value.minute).padStart(2, '0')}` }),
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
    // The mobile picker updates its controlled value from touch gestures, but
    // touch pointer events do not go through the mouse-drag handler. Mark the
    // wheel as interacted here so the parent can enable the next step.
    onInteract?.();
  }

  function stepColumn(column: WheelColumn, direction: 1 | -1) {
    const next = { ...value };
    if (column === 'year') {
      next.year = Math.min(currentYear, Math.max(1920, next.year + direction));
    }
    if (column === 'month') {
      next.month = ((next.month - 1 + direction + 12) % 12) + 1;
    }
    if (column === 'day') {
      const dayCount = new Date(next.year, next.month, 0).getDate();
      next.day = ((next.day - 1 + direction + dayCount) % dayCount) + 1;
    }
    if (column === 'hour') next.hour = (next.hour + direction + 24) % 24;
    if (column === 'minute') next.minute = (next.minute + direction + 60) % 60;
    const dayCount = new Date(next.year, next.month, 0).getDate();
    next.day = Math.min(next.day, dayCount);
    onChange(next);
  }

  function handleMouseDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') {
      onInteract?.();
      return;
    }
    if (event.button !== 0) return;
    const column = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-wheel-column]',
    )?.dataset.wheelColumn as WheelColumn | undefined;
    if (!column) return;
    mouseDrag.current = { column, lastY: event.clientY, remainder: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    onInteract?.();
  }

  function handleMouseMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = mouseDrag.current;
    if (!drag || event.pointerType !== 'mouse') return;
    event.preventDefault();
    const delta = event.clientY - drag.lastY;
    drag.lastY = event.clientY;
    drag.remainder += delta;
    while (Math.abs(drag.remainder) >= 24) {
      const direction = drag.remainder < 0 ? 1 : -1;
      stepColumn(drag.column, direction);
      drag.remainder += direction * 24;
    }
  }

  function handleMouseUp(event: React.PointerEvent<HTMLDivElement>) {
    if (
      mouseDrag.current &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    mouseDrag.current = null;
  }

  return (
    <div
      className="birth-wheel"
      aria-label={mode === 'date' ? 'Birth date wheel' : 'Birth time wheel'}
      onKeyDownCapture={onInteract}
      onPointerDownCapture={handleMouseDown}
      onPointerMoveCapture={handleMouseMove}
      onPointerUpCapture={handleMouseUp}
      onPointerCancelCapture={handleMouseUp}
      onWheelCapture={(event) => {
        onInteract?.();
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        const column = (event.target as HTMLElement).closest<HTMLElement>(
          '[data-wheel-column]',
        )?.dataset.wheelColumn as WheelColumn | undefined;
        if (!column) return;
        wheelRemainder.current += event.deltaY;
        while (Math.abs(wheelRemainder.current) >= 28) {
          // Scrolling up moves toward the previous value; scrolling down
          // moves toward the next value. This keeps mouse and touch movement
          // aligned and avoids the browser's page-scroll gesture.
          const direction = wheelRemainder.current < 0 ? -1 : 1;
          stepColumn(column, direction);
          wheelRemainder.current -= direction * 28;
        }
      }}
      onTouchMoveCapture={(event) => {
        if (event.cancelable) event.preventDefault();
      }}
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
              <Picker.Column name="year" data-wheel-column="year">
                {years.map((year) => (
                  <WheelItem key={year} value={year} />
                ))}
              </Picker.Column>
              <Picker.Column name="month" data-wheel-column="month">
                {loopMonths.map((month) => (
                  <WheelItem
                    key={month.value}
                    label={month.label}
                    value={month.value}
                  />
                ))}
              </Picker.Column>
              <Picker.Column name="day" data-wheel-column="day">
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
              <Picker.Column name="hour" data-wheel-column="hour">
                {loopHours.map((hour) => (
                  <WheelItem
                    key={hour.value}
                    label={hour.label}
                    value={hour.value}
                  />
                ))}
              </Picker.Column>
              {approximateTime ? null : (
                <Picker.Column name="minute" data-wheel-column="minute">
                  {loopMinutes.map((minute) => (
                    <WheelItem
                      key={minute.value}
                      label={minute.label}
                      value={minute.value}
                    />
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

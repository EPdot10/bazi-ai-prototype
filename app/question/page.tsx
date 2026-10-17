'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { TurnstileField } from '@/components/turnstile-field';
import { castCoinLine, deriveCoinReading, type CoinLine } from '@/lib/iching';

type Locale = 'en' | 'zh';
const sessionKey = 'ming:question-session:v1';
const subscribeToUrl = () => () => {};
const browserLocale = (): Locale =>
  new URLSearchParams(window.location.search).get('lang') === 'zh'
    ? 'zh'
    : 'en';
const serverLocale = (): Locale => 'en';
interface Answer {
  answer: string;
  conditions: string;
  action: string;
  symbolism: string;
  limitation: string;
}

function validAnswer(value: unknown): value is Answer {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return ['answer', 'conditions', 'action', 'symbolism', 'limitation'].every(
    (key) =>
      typeof candidate[key] === 'string' && candidate[key].length <= 1_200,
  );
}

function HexagramLines({
  lines,
  moving = [],
}: {
  lines: boolean[];
  moving?: number[];
}) {
  return (
    <div
      aria-label="Hexagram lines, bottom to top"
      className="flex w-24 flex-col-reverse gap-2"
    >
      {lines.map((solid, index) => (
        <div className="flex h-2.5 items-center gap-1" key={index}>
          {solid ? (
            <span className="h-full w-full bg-[#292620]" />
          ) : (
            <>
              <span className="h-full flex-1 bg-[#292620]" />
              <span className="h-full flex-1 bg-[#292620]" />
            </>
          )}
          {moving.includes(index + 1) ? (
            <span
              aria-label="Moving line"
              className="ml-1 size-1.5 shrink-0 rounded-full bg-[#a43b31]"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function QuestionPage() {
  const urlLocale = useSyncExternalStore(
    subscribeToUrl,
    browserLocale,
    serverLocale,
  );
  const [chosenLocale, setChosenLocale] = useState<Locale | null>(null);
  const locale = chosenLocale ?? urlLocale;
  const [question, setQuestion] = useState('');
  const [timeframe, setTimeframe] = useState<
    'month' | 'quarter' | 'year' | 'open'
  >('quarter');
  const [throws, setThrows] = useState<CoinLine[]>([]);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileGeneration, setTurnstileGeneration] = useState(0);
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const answerRef = useRef<HTMLElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const onToken = useCallback((token: string) => setTurnstileToken(token), []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem(sessionKey) ?? 'null',
        ) as Record<string, unknown> | null;
        if (saved) {
          const requestedLocale = new URLSearchParams(
            window.location.search,
          ).get('lang');
          if (
            typeof saved.question === 'string' &&
            saved.question.length <= 280
          )
            setQuestion(saved.question);
          if (
            ['month', 'quarter', 'year', 'open'].includes(
              String(saved.timeframe),
            )
          )
            setTimeframe(saved.timeframe as typeof timeframe);
          const validThrows =
            Array.isArray(saved.throws) &&
            saved.throws.length <= 6 &&
            saved.throws.every((line) => [6, 7, 8, 9].includes(line));
          if (validThrows) setThrows(saved.throws as CoinLine[]);
          if (
            Array.isArray(saved.throws) &&
            saved.throws.length === 6 &&
            (!requestedLocale || requestedLocale === saved.locale) &&
            saved.answer &&
            validAnswer(saved.answer)
          )
            setAnswer(saved.answer);
          if (
            !requestedLocale &&
            (saved.locale === 'en' || saved.locale === 'zh')
          )
            setChosenLocale(saved.locale);
        }
      } catch {
        sessionStorage.removeItem(sessionKey);
      }
      setRestored(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!restored) return;
    sessionStorage.setItem(
      sessionKey,
      JSON.stringify({ question, timeframe, throws, answer, locale }),
    );
  }, [restored, question, timeframe, throws, answer, locale]);

  useEffect(() => {
    if (throws.length === 6 && !answer)
      submitRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
  }, [throws.length, answer]);

  useEffect(() => {
    if (answer)
      answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [answer]);

  const isZh = locale === 'zh';
  const cast = throws.length === 6 ? deriveCoinReading(throws) : null;
  const betaEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_QUESTION_BETA_ENABLED === 'true';

  async function requestReading() {
    if (!cast || question.trim().length < 8 || pending) return;
    setPending(true);
    setError('');
    setAnswer(null);
    try {
      const response = await fetch('/api/iching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          timeframe,
          throws,
          locale,
          turnstileToken,
        }),
      });
      const data = (await response.json()) as {
        interpretation?: Answer;
        error?: string;
        requestId?: string;
      };
      if (!response.ok || !data.interpretation) {
        const requestId =
          data.requestId ?? response.headers.get('X-Request-Id');
        const message = isZh
          ? ((
              {
                400: '请检查问题和六爻是否完整。',
                403: '请完成人机验证。',
                404: '实验功能尚未开放。',
                429: '请求过于频繁，请稍后再试。',
                502: 'AI 暂时未能完成解读，请重试。',
                503: '解读服务暂不可用。',
              } as Record<number, string>
            )[response.status] ?? '解读暂时失败，请重试。')
          : (data.error ?? 'The reading could not be created.');
        throw new Error(`${message}${requestId ? ` [${requestId}]` : ''}`);
      }
      setAnswer(data.interpretation);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : isZh
            ? '网络连接失败，请稍后再试。'
            : 'The reading could not be created.',
      );
    } finally {
      setPending(false);
      setTurnstileToken('');
      setTurnstileGeneration((current) => current + 1);
    }
  }

  function changeLocale(value: Locale) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', value);
    window.history.replaceState(null, '', url);
    setChosenLocale(value);
    setAnswer(null);
    setError('');
  }

  function resetCast() {
    setThrows([]);
    setAnswer(null);
    setError('');
  }

  function clearSession() {
    sessionStorage.removeItem(sessionKey);
    setQuestion('');
    setTimeframe('quarter');
    setThrows([]);
    setAnswer(null);
    setError('');
  }

  if (!betaEnabled) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f2efe8] px-6 text-center text-[#1b1a17]">
        <div>
          <p className="font-serif text-5xl text-[#9d3027]">卦</p>
          <h1 className="mt-6 font-serif text-3xl">
            {isZh ? '实验功能尚未开放' : 'The experiment is not open yet'}
          </h1>
          <p className="mt-4 text-sm text-black/50">
            {isZh
              ? '六爻起卦仍在内部验证中。'
              : 'The six-line cast is still in internal testing.'}
          </p>
          <Link
            className="mt-8 inline-block text-sm text-[#9d3027] underline"
            href="/"
          >
            {isZh ? '返回首页' : 'Back to home'}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2efe8] text-[#1b1a17]">
      <header className="mx-auto flex h-20 max-w-[1160px] items-center justify-between border-b border-black/10 px-6 sm:px-10">
        <Link
          className="flex items-center gap-3 font-serif text-xl tracking-[0.16em]"
          href="/"
        >
          <span className="grid size-8 place-items-center bg-[#9d3027] text-sm text-white">
            命
          </span>
          MING
        </Link>
        <div
          aria-label="Language"
          className="flex border border-black/15 text-xs"
        >
          {(['en', 'zh'] as const).map((value) => (
            <button
              aria-pressed={locale === value}
              className={`px-3 py-2 ${locale === value ? 'bg-[#1b1a17] text-white' : ''}`}
              key={value}
              disabled={pending}
              onClick={() => changeLocale(value)}
              type="button"
            >
              {value === 'zh' ? '中文' : 'EN'}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-[1160px] px-6 pb-24 pt-14 sm:px-10 sm:pt-20">
        <Link
          className="inline-flex items-center gap-2 text-xs text-black/45 hover:text-[#9d3027]"
          href="/"
        >
          <ArrowLeft className="size-4" />
          {isZh ? '返回首页' : 'Back to home'}
        </Link>
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.82fr)] lg:gap-24">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#9d3027] uppercase">
              {isZh
                ? '三币易经起卦 · 六爻实验'
                : 'Three-coin I Ching · six-line experiment'}
            </p>
            <h1 className="mt-5 font-serif text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.06em]">
              {isZh ? '问一个具体的问题。' : 'Ask one clear question.'}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-black/57">
              {isZh
                ? '专注一个当下可行动的问题，掷三枚虚拟硬币六次，从下往上形成卦象。结果提供一种思考角度，不替你做决定。'
                : 'Focus on one question you can act on. Cast three virtual coins six times, building the hexagram from the bottom up. The result is a perspective, not a decision made for you.'}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-black/46">
              {isZh
                ? '目前只做三币起卦与卦象反思，不包含纳甲、六亲、用神等完整六爻断法。'
                : 'This currently offers a three-coin cast and reflective interpretation, not a complete Na Jia six-line reading.'}
            </p>
            <label
              className="mt-12 block text-xs font-semibold tracking-[0.16em] uppercase"
              htmlFor="iching-question"
            >
              {isZh ? '你想问什么？' : 'Your question'}
            </label>
            <textarea
              className="mt-4 min-h-36 w-full resize-y border border-black/15 bg-white/45 p-5 text-base leading-7 outline-none transition-colors focus:border-[#9d3027]"
              id="iching-question"
              maxLength={280}
              disabled={throws.length > 0 || pending}
              onChange={(event) => {
                setQuestion(event.target.value);
                setAnswer(null);
              }}
              placeholder={
                isZh
                  ? '例如：我该如何判断现在是否适合换工作？'
                  : 'For example: How can I judge whether now is a good time to change jobs?'
              }
              value={question}
            />
            <p className="mt-2 text-xs leading-5 text-black/40">
              {isZh
                ? '请勿输入姓名或敏感资料。此标签页会暂存进度，可随时清除；提交后问题和卦象会发送给 AI 服务。起卦后如需改问题，请先重新起卦。'
                : 'Avoid names and sensitive details. This tab temporarily saves your progress; you can clear it. On submission, your question and cast go to an AI service. Start again to change the question.'}
            </p>

            <label
              className="mt-7 block text-xs font-semibold tracking-[0.16em] uppercase"
              htmlFor="iching-timeframe"
            >
              {isZh ? '你关心的时间范围' : 'Timeframe you have in mind'}
            </label>
            <select
              className="mt-3 min-h-12 w-full border border-black/15 bg-white/45 px-4 text-sm outline-none focus:border-[#9d3027]"
              id="iching-timeframe"
              disabled={throws.length > 0 || pending}
              onChange={(event) => {
                setTimeframe(event.target.value as typeof timeframe);
                setAnswer(null);
              }}
              value={timeframe}
            >
              <option value="month">
                {isZh ? '未来一个月' : 'Next month'}
              </option>
              <option value="quarter">
                {isZh ? '未来三个月' : 'Next three months'}
              </option>
              <option value="year">{isZh ? '未来一年' : 'Next year'}</option>
              <option value="open">{isZh ? '不限定时间' : 'Open-ended'}</option>
            </select>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                className="inline-flex min-h-12 items-center gap-3 bg-[#1b1a17] px-6 text-xs font-semibold tracking-[0.12em] text-white uppercase transition-colors hover:bg-[#9d3027] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={
                  question.trim().length < 8 || throws.length === 6 || pending
                }
                onClick={() =>
                  setThrows((current) => [...current, castCoinLine()])
                }
                type="button"
              >
                {throws.length === 6
                  ? isZh
                    ? '六爻已完成'
                    : 'Six lines complete'
                  : isZh
                    ? `掷第 ${throws.length + 1} 爻`
                    : `Cast line ${throws.length + 1}`}
                <ArrowRight className="size-4" />
              </button>
              {throws.length > 0 ? (
                <button
                  className="inline-flex min-h-12 items-center gap-2 px-3 text-xs text-black/50 hover:text-[#9d3027]"
                  onClick={resetCast}
                  type="button"
                >
                  <RotateCcw className="size-4" />
                  {isZh ? '重新起卦／修改问题' : 'Start again / edit question'}
                </button>
              ) : null}
              <button
                className="min-h-12 px-3 text-xs text-black/40 underline-offset-4 hover:text-[#9d3027] hover:underline"
                onClick={clearSession}
                type="button"
              >
                {isZh ? '清除此页记录' : 'Clear this session'}
              </button>
            </div>
            <p aria-live="polite" className="mt-4 text-sm text-black/50">
              {isZh
                ? `已完成 ${throws.length} / 6 爻`
                : `${throws.length} / 6 lines cast`}
            </p>
            {cast ? (
              <div className="mt-9">
                <TurnstileField
                  action="iching"
                  locale={locale}
                  onToken={onToken}
                  resetKey={turnstileGeneration}
                />
                <button
                  ref={submitRef}
                  className="mt-6 min-h-12 bg-[#9d3027] px-6 text-xs font-semibold tracking-[0.12em] text-white uppercase disabled:opacity-50"
                  disabled={pending}
                  onClick={requestReading}
                  type="button"
                >
                  {pending
                    ? isZh
                      ? '正在解读卦象…'
                      : 'Interpreting the cast…'
                    : isZh
                      ? '查看针对问题的解读'
                      : 'Read the answer'}
                </button>
              </div>
            ) : null}
            {error ? (
              <p className="mt-5 text-sm text-[#a43b31]" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="self-start border border-black/10 bg-white/35 p-6 shadow-[0_20px_80px_rgb(55_35_22_/_5%)] sm:p-9">
            <div className="flex items-center justify-between border-b border-black/10 pb-5">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9d3027] uppercase">
                {isZh ? '你的卦象' : 'Your cast'}
              </p>
              <span className="font-serif text-3xl text-[#9d3027]">卦</span>
            </div>
            <div className="mt-8 space-y-4">
              {Array.from({ length: 6 }, (_, index) => {
                const line = throws[index];
                return (
                  <div
                    className="flex items-center justify-between border-b border-black/8 pb-3"
                    key={index}
                  >
                    <span className="text-xs text-black/40">
                      {isZh ? `第 ${index + 1} 爻` : `Line ${index + 1}`}
                    </span>
                    <span className="font-serif text-lg">
                      {line
                        ? line === 6 || line === 8
                          ? '– –'
                          : '——'
                        : '· · ·'}
                    </span>
                    <span className="w-20 text-right text-xs text-[#9d3027]">
                      {line
                        ? `${line}${line === 6 || line === 9 ? (isZh ? ' · 变' : ' · moving') : ''}`
                        : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            {cast ? (
              <div className="mt-10 flex flex-wrap items-start gap-10 border-t border-black/10 pt-8">
                <div>
                  <p className="mb-4 text-xs text-black/45">
                    {isZh ? '本卦' : 'Original'}
                  </p>
                  <HexagramLines
                    lines={cast.original.lines}
                    moving={cast.movingLines}
                  />
                  <p className="mt-4 font-serif text-xl">
                    {cast.original.number} · {cast.original.name}
                  </p>
                </div>
                {cast.changed ? (
                  <div>
                    <p className="mb-4 text-xs text-black/45">
                      {isZh ? '之卦' : 'Changed'}
                    </p>
                    <HexagramLines lines={cast.changed.lines} />
                    <p className="mt-4 font-serif text-xl">
                      {cast.changed.number} · {cast.changed.name}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
            <p className="mt-10 text-xs leading-6 text-black/40">
              {isZh
                ? '约定：三枚硬币正面记 3，反面记 2；6、9 为变爻。第一掷是最下方一爻。本实验仅采用三币起卦，不是包含纳甲、六亲、用神的完整六爻断法。'
                : 'Method: each heads counts 3, each tails 2. A total of 6 or 9 is moving. The first cast is the bottom line. This is a three-coin I Ching experiment, not a full Na Jia six-line calculation.'}
            </p>
          </div>
        </div>

        {answer ? (
          <section
            ref={answerRef}
            aria-live="polite"
            className="mt-20 max-w-4xl scroll-mt-8 border-t border-black/15 pt-10"
          >
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9d3027] uppercase">
              {isZh ? '针对你的问题' : 'For your question'}
            </p>
            <h2 className="mt-5 font-serif text-3xl leading-snug sm:text-4xl">
              {answer.answer}
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-black/40 uppercase">
                  {isZh ? '值得观察的条件' : 'What to watch'}
                </p>
                <p className="mt-3 leading-7">{answer.conditions}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-black/40 uppercase">
                  {isZh ? '下一步' : 'A next step'}
                </p>
                <p className="mt-3 leading-7">{answer.action}</p>
              </div>
            </div>
            <details className="mt-10 border-t border-black/10 pt-5">
              <summary className="cursor-pointer text-sm text-[#9d3027]">
                {isZh ? '为什么会这样解读？' : 'Why this interpretation?'}
              </summary>
              <p className="mt-4 leading-7 text-black/65">{answer.symbolism}</p>
            </details>
            <p className="mt-8 text-xs leading-6 text-black/45">
              {answer.limitation}
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

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
import {
  castCoinLine,
  deriveCoinReading,
  isCastContext,
  type CastContext,
  type CoinLine,
  type Hexagram,
  type SixKin,
  type SixSpirit,
} from '@/lib/iching';

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

const elementLabel = (element: Hexagram['palaceElement'], isZh: boolean) =>
  isZh
    ? ({ wood: '木', fire: '火', earth: '土', metal: '金', water: '水' })[
        element
      ]
    : element;

const kinLabel = (kin: SixKin, isZh: boolean) =>
  isZh
    ? kin
    : ({
        兄弟: 'Siblings',
        子孙: 'Descendants',
        妻财: 'Wealth',
        官鬼: 'Officer',
        父母: 'Parents',
      })[kin];

type NajiaChartDisplay = Pick<Hexagram, 'yao'> &
  Partial<
    Pick<
      Hexagram,
      | 'palace'
      | 'palaceElement'
      | 'sequence'
      | 'shi'
      | 'ying'
      | 'hiddenKinCandidates'
    >
  >;

function NajiaTable({
  chart,
  isZh,
}: {
  chart: NajiaChartDisplay;
  isZh: boolean;
}) {
  const heading = isZh
    ? ['爻位', '纳甲', '五行', '六亲', '六神', '标记']
    : ['Line', 'Na Jia', 'Element', 'Kin', 'Spirit', 'Mark'];
  return (
    <div className="mt-5 overflow-x-auto">
      <p className="mb-3 text-xs leading-5 text-black/50">
        {chart.palace && chart.palaceElement && chart.sequence && chart.shi && chart.ying
          ? isZh
            ? `本卦属${chart.palace}宫（${elementLabel(chart.palaceElement, true)}），${chart.sequence}；世爻在第${chart.shi}爻，应爻在第${chart.ying}爻。`
            : `${chart.palace} palace (${chart.palaceElement}), ${chart.sequence}; Shi at line ${chart.shi}, Ying at line ${chart.ying}.`
          : isZh
            ? '之卦爻位沿用本卦宫位的六亲参照；不另立宫位。'
            : 'Changed lines are shown against the original palace kin reference; no separate palace is assigned.'}
      </p>
      <table className="w-full min-w-[520px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-y border-black/10 text-black/45">
            {heading.map((label) => (
              <th className="px-2 py-2 font-medium" key={label}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.yao.slice().reverse().map((line) => {
            const spiritNames: Record<SixSpirit, string> = {
              青龙: isZh ? '青龙' : 'Azure Dragon',
              朱雀: isZh ? '朱雀' : 'Vermilion Bird',
              勾陈: isZh ? '勾陈' : 'Gou Chen',
              螣蛇: isZh ? '螣蛇' : 'Teng She',
              白虎: isZh ? '白虎' : 'White Tiger',
              玄武: isZh ? '玄武' : 'Black Tortoise',
            };
            const marks = [
              line.isShi ? (isZh ? '世' : 'Shi') : '',
              line.isYing ? (isZh ? '应' : 'Ying') : '',
              line.isMoving ? (isZh ? '动' : 'Moving') : '',
            ].filter(Boolean);
            return (
              <tr className="border-b border-black/8" key={line.position}>
                <td className="px-2 py-2 text-black/55">
                  {isZh ? `第${line.position}爻` : `Line ${line.position}`}
                </td>
                <td className="px-2 py-2 font-medium">
                  {line.stem}{line.branch}
                </td>
                <td className="px-2 py-2">
                  {elementLabel(line.element, isZh)}
                </td>
                <td className="px-2 py-2">{kinLabel(line.kin, isZh)}</td>
                <td className="px-2 py-2 text-black/65">
                  {line.spirit ? spiritNames[line.spirit] : '—'}
                </td>
                <td className="px-2 py-2 text-[#9d3027]">
                  {marks.join(' · ') || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {chart.hiddenKinCandidates?.length ? (
        <p className="mt-3 text-xs leading-5 text-black/55">
          {isZh ? '伏神候选：' : 'Hidden-kin candidates: '}
          {chart.hiddenKinCandidates
            .map(
              (line) =>
                `${kinLabel(line.kin, isZh)} ${line.stem}${line.branch}（${elementLabel(line.element, isZh)}，${isZh ? `本宫卦第${line.position}爻` : `palace line ${line.position}`}）`,
            )
            .join('；')}
          {isZh
            ? '。此处只列本宫卦候选，不自动认定为本题用神。'
            : '. Candidates only; the app does not assign one as the useful spirit for this question.'}
        </p>
      ) : null}
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
  const [shaking, setShaking] = useState(false);
  const [castContext, setCastContext] = useState<CastContext | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileGeneration, setTurnstileGeneration] = useState(0);
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const answerRef = useRef<HTMLElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const shakeLockRef = useRef(false);
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
          const savedThrows =
            Array.isArray(saved.throws) &&
            saved.throws.length <= 6 &&
            saved.throws.every((line) => [6, 7, 8, 9].includes(line))
              ? (saved.throws as CoinLine[])
              : null;
          const savedCastContext = isCastContext(saved.castContext)
            ? saved.castContext
            : null;
          if (savedThrows && (savedThrows.length === 0 || savedCastContext)) {
            setThrows(savedThrows);
            setCastContext(savedCastContext);
          } else if (savedThrows && savedThrows.length > 0) {
            setThrows([]);
            setError(
              requestedLocale === 'zh'
                ? '旧版起卦记录缺少起卦时区，已清除卦爻；请重新起卦以确保六神计算正确。'
                : 'This saved cast has no casting time zone. Its lines were cleared so six spirits can be calculated correctly; please cast again.',
            );
          }
          if (
            Array.isArray(saved.throws) &&
            saved.throws.length === 6 &&
            savedCastContext &&
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
      JSON.stringify({ question, timeframe, throws, castContext, answer, locale }),
    );
  }, [restored, question, timeframe, throws, castContext, answer, locale]);

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
  const cast =
    throws.length === 6 && castContext
      ? deriveCoinReading(throws, castContext)
      : null;
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
          castContext,
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
    if (shaking) return;
    setThrows([]);
    setCastContext(null);
    setAnswer(null);
    setError('');
  }

  async function castNextLine() {
    if (
      shakeLockRef.current ||
      shaking ||
      pending ||
      throws.length >= 6 ||
      question.trim().length < 8
    )
      return;
    shakeLockRef.current = true;
    setError('');
    if (throws.length === 0) {
      setCastContext({
        castAt: new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
    }
    setShaking(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setThrows((current) =>
      current.length < 6 ? [...current, castCoinLine()] : current,
    );
    setShaking(false);
    shakeLockRef.current = false;
  }

  function clearSession() {
    if (shaking) return;
    sessionStorage.removeItem(sessionKey);
    setQuestion('');
    setTimeframe('quarter');
    setThrows([]);
    setCastContext(null);
    setAnswer(null);
    setError('');
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

      {pending ? (
        <section
          aria-live="polite"
          aria-busy="true"
          className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-[760px] content-center px-6 py-16 text-center sm:px-10"
        >
          <div
            aria-hidden="true"
            className="coin-shake mx-auto flex items-center justify-center gap-3"
          >
            {[0, 1, 2].map((coin) => (
              <span className="coin-token" key={coin}>
                易
              </span>
            ))}
          </div>
          <p className="mt-10 text-[10px] font-semibold tracking-[0.2em] text-[#9d3027] uppercase">
            {isZh ? '六爻解读 · 正在分析' : 'Six-line reading · in progress'}
          </p>
          <h1 className="mt-4 break-words font-serif text-3xl leading-tight sm:text-5xl">
            {isZh ? '正在回应你的问题' : 'Reading your question'}
          </h1>
          <p className="mx-auto mt-5 max-w-lg break-words text-sm leading-7 text-black/55">
            {isZh
              ? '正在结合你的问题、时间范围与卦象整理解读。请稍候，完成后结果会自动显示。'
              : 'Your question, timeframe, and cast are being considered together. Please wait; the answer will appear here when ready.'}
          </p>
          <div
            className="mx-auto mt-10 flex w-full max-w-sm items-center gap-2"
            aria-hidden="true"
          >
            {throws.map((line, index) => (
              <span
                className={`h-1.5 flex-1 ${line === 6 || line === 9 ? 'bg-[#9d3027]' : 'bg-[#1b1a17]/45'}`}
                key={`${line}-${index}`}
              />
            ))}
          </div>
          <p className="mt-4 text-xs text-black/40">
            {isZh
              ? '六爻已完成 · AI 正在整理结果'
              : 'Cast complete · preparing the interpretation'}
          </p>
        </section>
      ) : (
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
                ? '专注一个当下可行动的问题。每次点击，摇动三枚铜钱并记录一爻；六次后从下往上形成卦象。结果提供思考角度，不替你做决定。'
                : 'Focus on one actionable question. Each tap shakes three coins and records one line; after six casts, the hexagram is built from the bottom up. It offers perspective, not a decision.'}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-black/46">
              {isZh
                ? '系统会按选定的纳甲规则排出本卦结构，AI 只解释这些已计算的事实；目前不计算月建日辰旺衰，也不会替你自动选用神。'
                : 'The app computes the core Na Jia chart using a declared convention; AI interprets those facts only. Month/day strength and automatic useful-spirit selection are not yet included.'}
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
              disabled={throws.length > 0 || pending || shaking}
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
              disabled={throws.length > 0 || pending || shaking}
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
                  question.trim().length < 8 || throws.length === 6 || pending || shaking
                }
                onClick={castNextLine}
                type="button"
              >
                {shaking
                  ? isZh
                    ? '铜钱摇动中…'
                    : 'Shaking the coins…'
                  : throws.length === 6
                  ? isZh
                    ? '六爻已完成'
                    : 'Six lines complete'
                  : isZh
                    ? `摇第 ${throws.length + 1} 爻`
                    : `Shake for line ${throws.length + 1}`}
                <ArrowRight className="size-4" />
              </button>
              {throws.length > 0 ? (
                <button
                  disabled={shaking}
                  className="inline-flex min-h-12 items-center gap-2 px-3 text-xs text-black/50 hover:text-[#9d3027]"
                  onClick={resetCast}
                  type="button"
                >
                  <RotateCcw className="size-4" />
                  {isZh ? '重新起卦／修改问题' : 'Start again / edit question'}
                </button>
              ) : null}
              <button
                disabled={shaking}
                className="min-h-12 px-3 text-xs text-black/40 underline-offset-4 hover:text-[#9d3027] hover:underline"
                onClick={clearSession}
                type="button"
              >
                {isZh ? '清除此页记录' : 'Clear this session'}
              </button>
            </div>
            <p aria-live="polite" className="mt-4 text-sm text-black/50">
              {isZh
                ? `已完成 ${throws.length} / 6 爻 · 从下往上记录`
                : `${throws.length} / 6 lines · building bottom up`}
            </p>
            <ol
              aria-label={isZh ? '起卦进度' : 'Casting progress'}
              className="mt-4 flex max-w-sm items-center gap-2"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <li
                  aria-label={
                    isZh
                      ? `第 ${index + 1} 爻${throws.length > index ? '已完成' : ''}`
                      : `Line ${index + 1}${throws.length > index ? ', complete' : ''}`
                  }
                  aria-current={throws.length === index ? 'step' : undefined}
                  className={`grid size-8 shrink-0 place-items-center rounded-full border text-[10px] tabular-nums transition-colors ${throws.length > index ? 'border-[#9d3027] bg-[#9d3027] text-white' : 'border-black/15 text-black/40'}`}
                  key={index}
                >
                  {index + 1}
                </li>
              ))}
            </ol>
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
                  disabled={pending || shaking}
                  onClick={requestReading}
                  type="button"
                >
                  {pending
                    ? isZh
                      ? '正在解读卦象…'
                      : 'Interpreting the cast…'
                    : isZh
                      ? '开始 AI 解读'
                      : 'Begin AI interpretation'}
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
            <div
              aria-hidden="true"
              className={`mx-auto mt-8 flex items-center justify-center gap-3 ${shaking ? 'coin-shake' : ''}`}
            >
              {[0, 1, 2].map((coin) => (
                <span className="coin-token" key={coin}>
                  易
                </span>
              ))}
            </div>
            <p aria-live="polite" className="mt-4 text-center text-xs text-black/45">
              {shaking
                ? isZh
                  ? '三枚铜钱摇动中…'
                  : 'The coins are moving…'
                : throws.length === 6
                  ? isZh
                    ? '卦象已成，确认后开始 AI 解读'
                    : 'Cast complete — begin the interpretation when ready'
                  : isZh
                    ? '点击一次摇卦，记录一爻'
                    : 'Tap once to cast and record one line'}
            </p>
            <div className="mt-8 space-y-4">
              {Array.from({ length: 6 }, (_, index) => {
                const throwIndex = 5 - index;
                const line = throws[throwIndex];
                return (
                  <div
                    className="flex items-center justify-between border-b border-black/8 pb-3"
                    key={index}
                  >
                    <span className="text-xs text-black/40">
                      {isZh ? `第 ${throwIndex + 1} 爻` : `Line ${throwIndex + 1}`}
                    </span>
                    <span className="font-serif text-lg">
                      {line
                        ? line === 6 || line === 8
                          ? '– –'
                          : '——'
                        : '· · ·'}
                    </span>
                    <span className="w-24 shrink-0 text-right text-xs text-[#9d3027]">
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
                <details className="mt-3 w-full border-t border-black/10 pt-5">
                  <summary className="cursor-pointer text-sm text-[#9d3027]">
                    {isZh ? '查看纳甲排盘细节' : 'View Na Jia chart details'}
                  </summary>
                  <NajiaTable chart={cast.original} isZh={isZh} />
                  {cast.changed ? (
                    <details className="mt-5 border-t border-black/8 pt-4">
                      <summary className="cursor-pointer text-xs text-black/65">
                        {isZh ? '展开之卦爻位' : 'Show changed-hexagram lines'}
                      </summary>
                      <NajiaTable chart={cast.changed} isZh={isZh} />
                    </details>
                  ) : null}
                </details>
                <p className="w-full text-xs leading-5 text-black/45">
                  {isZh
                    ? `起卦本地日期：${cast.castingDay?.localDate ?? '—'}（${cast.castingDay?.ganzhi ?? '—'}日）。六神按日干起例排布；各家口诀存在差异。伏神仅列候选，未按问题自动取用神。`
                    : `Local casting date: ${cast.castingDay?.localDate ?? '—'} (${cast.castingDay?.ganzhi ?? '—'} day). Six spirits use the declared day-stem starting rule; schools vary. Hidden kin are candidates, not an automatically selected useful spirit.`}
                </p>
              </div>
            ) : null}
            <p className="mt-10 text-xs leading-6 text-black/40">
              {isZh
                ? '约定：三枚硬币正面记 3，反面记 2；6、9 为变爻。第一掷是最下方一爻。排盘使用常见八宫纳甲、六亲生克和六神日干起例；流派存在差异。本版本暂不判断月建日辰旺衰、空破合冲，也不自动选用神。'
                : 'Method: heads count 3, tails 2; totals 6 and 9 are moving. The first cast is the bottom line. The chart uses a common Ba Gong/Na Jia, six-kin, and day-stem six-spirit convention; schools vary. Month/day strength, clashes, voids, and automatic useful-spirit selection are not implemented yet.'}
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
      )}
    </main>
  );
}

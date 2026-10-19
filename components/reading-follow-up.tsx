'use client';

import { useState } from 'react';
import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { TurnstileField } from '@/components/turnstile-field';

type Locale = 'en' | 'zh';

interface FollowUpAnswer {
  answer: string;
  basis: string;
}

const maxQuestionLength = 240;
const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export function ReadingFollowUp({
  locale,
  context,
}: {
  locale: Locale;
  context: string;
}) {
  const isZh = locale === 'zh';
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<FollowUpAnswer | null>(null);
  const [token, setToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const trimmedQuestion = question.trim();
    if (
      pending ||
      trimmedQuestion.length < 4 ||
      trimmedQuestion.length > maxQuestionLength ||
      (hasTurnstile && !token)
    )
      return;

    setPending(true);
    setError('');
    setAnswer(null);
    try {
      const response = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmedQuestion,
          context,
          locale,
          turnstileToken: token,
        }),
      });
      const payload = (await response.json()) as {
        answer?: FollowUpAnswer;
        error?: string;
        requestId?: string;
      };
      if (!response.ok || !payload.answer) {
        throw new Error(
          payload.requestId
            ? `${payload.error ?? (isZh ? '暂时无法生成追问解答' : 'Could not generate a follow-up answer')} (${payload.requestId})`
            : (payload.error ??
                (isZh
                  ? '暂时无法生成追问解答，请稍后再试。'
                  : 'Could not generate a follow-up answer. Please try again.')),
        );
      }
      setAnswer(payload.answer);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : isZh
            ? '发生意外错误，请稍后再试。'
            : 'Something went wrong. Please try again.',
      );
    } finally {
      setPending(false);
      setToken('');
      setResetKey((value) => value + 1);
    }
  }

  return (
    <section aria-labelledby="reading-follow-up-title">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-[#9d3027] uppercase">
        {isZh ? '围绕这份解读' : 'About this reading'}
      </p>
      <h2
        className="mt-3 font-serif text-3xl tracking-[-0.025em] sm:text-4xl"
        id="reading-follow-up-title"
      >
        {isZh ? '继续追问' : 'Ask a follow-up'}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
        {isZh
          ? '针对这份人生解读补充一个问题，AI 会参考本次报告的内容回答。'
          : 'Ask about something in this reading. The AI will use this report as context.'}
      </p>

      <label
        className="mt-6 block text-xs font-semibold text-black/65"
        htmlFor="reading-follow-up-question"
      >
        {isZh ? '你的问题' : 'Your question'}
      </label>
      <textarea
        className="mt-2 min-h-28 w-full resize-y border border-black/12 bg-white/40 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#9d3027]/50"
        id="reading-follow-up-question"
        maxLength={maxQuestionLength}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder={
          isZh
            ? '例如：这份解读提到我容易承担过多责任，遇到现在的工作选择时该如何判断？'
            : 'For example: This reading says I may take on too much responsibility. How should I weigh my current work choice?'
        }
        value={question}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] leading-4 text-black/40">
        <span>
          {isZh
            ? '问题与本次解读摘要会发送给 AI；请勿输入姓名或敏感信息。'
            : 'Your question and a summary of this reading go to the AI. Avoid names or sensitive details.'}
        </span>
        <span className="shrink-0 tabular-nums">
          {question.length} / {maxQuestionLength}
        </span>
      </div>

      <div className="mt-4">
        <TurnstileField
          action="reading-followup"
          locale={locale}
          onToken={setToken}
          resetKey={resetKey}
        />
      </div>
      <button
        className="glow-control mt-5 inline-flex min-h-12 items-center justify-center gap-3 bg-[#1b1a17] px-5 text-xs font-semibold tracking-[0.1em] text-white uppercase transition-colors hover:bg-[#9d3027] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={
          pending ||
          question.trim().length < 4 ||
          (hasTurnstile && !token)
        }
        onClick={submit}
        type="button"
      >
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            {isZh ? '正在整理回答…' : 'Preparing an answer…'}
          </>
        ) : (
          <>
            {isZh ? '提交追问' : 'Ask about this reading'}
            <ArrowUpRight className="size-4" />
          </>
        )}
      </button>

      {error ? (
        <p aria-live="polite" className="mt-4 text-sm text-[#9d3027]">
          {error}
        </p>
      ) : null}
      {answer ? (
        <article className="mt-7 border-l-2 border-[#9d3027] bg-white/35 p-5 sm:p-6">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#9d3027] uppercase">
            {isZh ? '追问解答' : 'Your follow-up'}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/80">
            {answer.answer}
          </p>
          {answer.basis ? (
            <details className="mt-5 border-t border-black/8 pt-4">
              <summary className="cursor-pointer text-xs text-black/55">
                {isZh ? '回答依据与边界' : 'Basis and limits'}
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-black/55">
                {answer.basis}
              </p>
            </details>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}

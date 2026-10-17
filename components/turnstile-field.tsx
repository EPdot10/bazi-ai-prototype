'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function TurnstileField({
  onToken,
  locale = 'en',
}: {
  onToken: (token: string) => void;
  locale?: 'en' | 'zh';
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    const mount = () => {
      if (!window.turnstile || !containerRef.current || widgetRef.current)
        return;
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-ming-turnstile]',
    );
    if (existing) {
      mount();
      existing.addEventListener('load', mount);
      return () => existing.removeEventListener('load', mount);
    }

    const script = document.createElement('script');
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.mingTurnstile = 'true';
    script.addEventListener('load', mount);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', mount);
      if (widgetRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetRef.current);
      }
      widgetRef.current = undefined;
    };
  }, [onToken]);

  if (!siteKey) {
    return (
      <p className="text-[10px] leading-4 text-black/35">
        {locale === 'zh'
          ? '正式环境配置完成后会启用防机器人验证。'
          : 'Bot protection is enabled after the site is configured for production.'}
      </p>
    );
  }

  return (
    <div
      aria-label={locale === 'zh' ? '防机器人验证' : 'Bot protection'}
      ref={containerRef}
    />
  );
}

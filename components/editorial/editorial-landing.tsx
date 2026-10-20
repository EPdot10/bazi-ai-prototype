'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowUpRight, MoveRight } from 'lucide-react';

type Locale = 'en' | 'zh';

const pillars = [
  {
    id: 'year',
    zh: '年',
    en: 'Year',
    stem: '甲',
    branch: '子',
    descriptionZh: '故事从哪里开始。年柱指向早年的环境与来处。',
    descriptionEn: 'Where the story begins. The year pillar speaks to origin and early context.',
  },
  {
    id: 'month',
    zh: '月',
    en: 'Month',
    stem: '丙',
    branch: '寅',
    descriptionZh: '你生于怎样的时节。月柱为整张命盘定下季节的重量。',
    descriptionEn: 'The season you entered. The month pillar sets the weight of the whole chart.',
  },
  {
    id: 'day',
    zh: '日',
    en: 'Day',
    stem: '辛',
    branch: '酉',
    descriptionZh: '解读的中心。日干被称为「日主」，其他关系由此展开。',
    descriptionEn: 'The reading’s center. The day stem is the self from which other relations unfold.',
  },
  {
    id: 'hour',
    zh: '时',
    en: 'Hour',
    stem: '癸',
    branch: '巳',
    descriptionZh: '时间最细的一笔。若不知出生时辰，也可以开始。',
    descriptionEn: 'The finest mark of time. You can begin even without a known birth hour.',
  },
] as const;

const elements = [
  { zh: '木', en: 'Wood', lineZh: '生长与伸展', lineEn: 'Growth and reach', textZh: '木描绘向外生长的力量。命盘看的是它与其他元素如何相处。', textEn: 'Wood suggests growth. A reading asks how it relates to every other element.' },
  { zh: '火', en: 'Fire', lineZh: '表达与照亮', lineEn: 'Expression and light', textZh: '火关乎表达与热度。强弱只有放进整张命盘才有意义。', textEn: 'Fire speaks to expression and heat. Its weight matters only in the full chart.' },
  { zh: '土', en: 'Earth', lineZh: '承载与转化', lineEn: 'Holding and change', textZh: '土让事物有落脚点，也连接不同的力量。', textEn: 'Earth offers a place to land and a bridge between different forces.' },
  { zh: '金', en: 'Metal', lineZh: '边界与形状', lineEn: 'Boundary and form', textZh: '金使轮廓变得清晰。它可以是判断，也可以是取舍。', textEn: 'Metal gives a clear outline: discernment, precision, and choice.' },
  { zh: '水', en: 'Water', lineZh: '流动与深度', lineEn: 'Movement and depth', textZh: '水指向流动与潜藏。它与时节、位置共同构成解读。', textEn: 'Water suggests movement and depth, read together with season and position.' },
] as const;

export function EditorialLanding({
  locale,
  onBegin,
}: {
  locale: Locale;
  onBegin: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const chart = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<number | null>(null);
  const [pillar, setPillar] = useState(2);
  const [element, setElement] = useState(3);
  const isZh = locale === 'zh';

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .from('.ed-word', { y: 18, rotationX: -7, duration: 0.7, stagger: 0.08 }, 0)
        .from('.ed-hero-support', { y: 12, duration: 0.5, stagger: 0.07 }, 0.12)
        .from('.ed-chart-frame', { y: 20, duration: 0.7 }, 0.12)
        .from('.ed-chart-pillar', { y: 15, stagger: 0.05, duration: 0.45 }, 0.3);

      gsap.utils.toArray<HTMLElement>('[data-ed-reveal]').forEach((node) => {
        gsap.from(node, {
          y: 24,
          opacity: 0.72,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: { trigger: node, start: 'top 88%', once: true },
        });
      });

      const rule = root.current?.querySelector<HTMLElement>('.ed-chapter-rule-fill');
      if (rule) {
        gsap.fromTo(
          rule,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.ed-elements',
              start: 'top 82%',
              end: 'bottom 30%',
              scrub: true,
            },
          },
        );
      }
    },
    { scope: root },
  );

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(
        '.ed-pillar-note-inner',
        { y: 14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.48, ease: 'power2.out' },
      );
    },
    { scope: chart, dependencies: [pillar], revertOnUpdate: true },
  );

  function onChartPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    swipeStart.current = event.clientX;
  }

  function onChartPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (swipeStart.current === null) return;
    const distance = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(distance) > 45) {
      setPillar((current) => Math.min(3, Math.max(0, current + (distance < 0 ? 1 : -1))));
    }
  }

  return (
    <div className={`ed-page ${isZh ? 'ed-zh' : 'ed-en'}`} ref={root}>
      <section className="ed-hero" aria-labelledby="ed-hero-title">
        <div className="ed-hero-copy">
          <div className="ed-kicker ed-hero-support">
            <span className="ed-kicker-line" />
            {isZh ? '以出生之时，读人生之势' : 'A reading from the moment you were born'}
          </div>
          <h1 id="ed-hero-title" className="ed-hero-title">
            {isZh ? (
              <>
                <span className="ed-word-mask"><span className="ed-word">你出生的</span></span>
                <span className="ed-word-mask"><span className="ed-word">那一刻，</span></span>
                <span className="ed-word-mask"><span className="ed-word ed-word-accent">有迹可循。</span></span>
              </>
            ) : (
              <>
                <span className="ed-word-mask"><span className="ed-word">The moment</span></span>
                <span className="ed-word-mask"><span className="ed-word">you began</span></span>
                <span className="ed-word-mask"><span className="ed-word ed-word-accent">left a pattern.</span></span>
              </>
            )}
          </h1>
          <p className="ed-hero-description ed-hero-support">
            {isZh
              ? 'MING 以四柱八字为线索，呈现性格、关系与人生阶段中的结构。由你判断哪些与你相符。'
              : 'MING uses the Four Pillars of Chinese astrology to explore character, relationships, and chapters of life. You decide what rings true.'}
          </p>
          <div className="ed-hero-actions ed-hero-support">
            <button className="ed-button ed-button-dark" onClick={onBegin} type="button">
              <span>{isZh ? '开始我的解读' : 'Begin my reading'}</span>
              <ArrowUpRight size={18} strokeWidth={1.5} />
            </button>
            <a className="ed-text-link" href={`/question?lang=${locale}`}>
              {isZh ? '或问一个问题' : 'Or ask one question'} <MoveRight size={17} strokeWidth={1.4} />
            </a>
          </div>
          <p className="ed-hero-footnote ed-hero-support">
            {isZh ? '无需注册 · 不知道时辰也可以开始' : 'No account · Unknown birth time is welcome'}
          </p>
        </div>

        <div className="ed-hero-art ed-chart-frame" ref={chart}>
          <div className="ed-chart-topline">
            <span>{isZh ? '四柱 · 命盘结构' : 'FOUR PILLARS · CHART ANATOMY'}</span>
            <span>01 / 04</span>
          </div>
          <div
            className="ed-chart-interactive"
            onPointerDown={onChartPointerDown}
            onPointerUp={onChartPointerUp}
            onPointerCancel={() => { swipeStart.current = null; }}
          >
            <div className="ed-chart-columns" aria-label={isZh ? '选择四柱了解含义' : 'Choose a pillar to learn its meaning'}>
              {pillars.map((item, index) => (
                <button
                  className={`ed-chart-pillar ${pillar === index ? 'is-active' : ''}`}
                  key={item.id}
                  onClick={() => setPillar(index)}
                  type="button"
                  aria-pressed={pillar === index}
                >
                  <span className="ed-pillar-index">0{index + 1}</span>
                  <span className="ed-pillar-hanzi">{item.stem}<br />{item.branch}</span>
                  <span className="ed-pillar-label">{isZh ? `${item.zh}柱` : item.en}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="ed-pillar-note" aria-live="polite">
            <div className="ed-pillar-note-inner" key={pillar}>
              <span className="ed-note-number">0{pillar + 1} / 04</span>
              <p>{isZh ? pillars[pillar].descriptionZh : pillars[pillar].descriptionEn}</p>
            </div>
          </div>
          <div className="ed-chart-caption">
            <span>{isZh ? '点击或左右滑动四柱' : 'TAP OR SWIPE THE PILLARS'}</span>
            <span>{isZh ? '示意结构 · 非真实命盘' : 'ILLUSTRATION · NOT A PERSONAL CHART'}</span>
          </div>
        </div>
        <a className="ed-scroll-cue" href="#ed-method">
          <span>{isZh ? '继续探索' : 'SCROLL TO EXPLORE'}</span><ArrowDown size={16} strokeWidth={1.5} />
        </a>
      </section>

      <section className="ed-statement" id="ed-method">
        <div className="ed-section-index" data-ed-reveal>01 / {isZh ? '解读的方式' : 'THE METHOD'}</div>
        <div className="ed-statement-body" data-ed-reveal>
          <span className="ed-statement-mark">“</span>
          <h2>
            {isZh ? <>命盘不是一句<br /><em>预言。</em></> : <>A chart is not<br /><em>a prediction.</em></>}
          </h2>
          <p>
            {isZh
              ? '它是一套观察时间与关系的古老语言。我们把排盘结构和解读分开呈现，让每个判断都能回到它的依据。'
              : 'It is an old language for observing time and relationships. We show the chart beside its interpretation, so every thought has a visible starting point.'}
          </p>
        </div>
        <div className="ed-statement-side" data-ed-reveal>{isZh ? '看见依据，再理解自己。' : 'See the structure. Consider the story.'}</div>
      </section>

      <section className="ed-elements" aria-labelledby="ed-elements-title">
        <div className="ed-elements-heading" data-ed-reveal>
          <p className="ed-section-index">02 / {isZh ? '五行' : 'FIVE ELEMENTS'}</p>
          <h2 id="ed-elements-title">{isZh ? <>五种力量，<br />一种关系。</> : <>Five forces.<br />One relationship.</>}</h2>
          <p>{isZh ? '触摸或点击，看看每个元素在这套语言中如何被理解。' : 'Touch or choose an element to see what it means in this language.'}</p>
        </div>
        <div className="ed-elements-interaction" data-ed-reveal>
          <fieldset className="ed-elements-list" aria-label={isZh ? '选择五行' : 'Choose an element'}>
            {elements.map((item, index) => (
              <button
                className={`ed-element-row ${element === index ? 'is-active' : ''}`}
                key={item.en}
                onClick={() => setElement(index)}
                onMouseEnter={() => setElement(index)}
                type="button"
                aria-pressed={element === index}
              >
                <span className="ed-element-index">0{index + 1}</span>
                <span className="ed-element-name">{isZh ? item.zh : item.en}</span>
                <span className="ed-element-line">{isZh ? item.lineZh : item.lineEn}</span>
                <ArrowUpRight size={20} strokeWidth={1.3} />
              </button>
            ))}
          </fieldset>
          <div className="ed-element-detail" aria-live="polite">
            <span className="ed-element-detail-mark">{elements[element].zh}</span>
            <span className="ed-element-detail-label">{isZh ? elements[element].lineZh : elements[element].lineEn}</span>
            <p key={element}>{isZh ? elements[element].textZh : elements[element].textEn}</p>
            <span className="ed-element-detail-counter">0{element + 1} — 05</span>
          </div>
        </div>
        <div className="ed-chapter-rule"><span className="ed-chapter-rule-fill" /></div>
      </section>

      <section className="ed-paths" aria-labelledby="ed-paths-title">
        <div className="ed-paths-intro" data-ed-reveal>
          <p className="ed-section-index">03 / {isZh ? '从这里开始' : 'BEGIN HERE'}</p>
          <h2 id="ed-paths-title">{isZh ? <>从你的时间，<br />或此刻的问题。</> : <>Your birth moment.<br />Or this moment.</>}</h2>
        </div>
        <div className="ed-path-grid" data-ed-reveal>
          <button className="ed-path ed-path-primary" onClick={onBegin} type="button">
            <span className="ed-path-number">01 / {isZh ? '四柱八字' : 'FOUR PILLARS'}</span>
            <span className="ed-path-title">{isZh ? '看见自己的结构' : 'Read your pattern'}</span>
            <span className="ed-path-text">{isZh ? '输入出生日期、时间与城市，获得个人解读。' : 'Enter your birth date, time, and city for a personal reading.'}</span>
            <ArrowUpRight size={26} strokeWidth={1.25} />
          </button>
          <a className="ed-path ed-path-secondary" href={`/question?lang=${locale}`}>
            <span className="ed-path-number">02 / {isZh ? '六爻问事' : 'SIX-LINE CAST'}</span>
            <span className="ed-path-title">{isZh ? '问一个具体的问题' : 'Ask one clear question'}</span>
            <span className="ed-path-text">{isZh ? '聚焦眼前的一件事，用六次起卦梳理思路。' : 'Focus on one situation and cast six lines for another perspective.'}</span>
            <ArrowUpRight size={26} strokeWidth={1.25} />
          </a>
        </div>
      </section>
      <footer className="ed-footer"><span>MING / 命</span><span>{isZh ? '一份关于时间的解读' : 'A reading of time'}</span><span>© 2026</span></footer>
    </div>
  );
}

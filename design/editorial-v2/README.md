# MING · Editorial Motion (local design study)

This is the second UI direction for MING. It lives in its own Git worktree and branch (`codex/uiux-editorial-motion-v2`); the original checkout and the earlier immersive direction remain untouched.

## Direction

- Paper, ink, and one restrained vermilion accent replace the luminous observatory look.
- The first screen explains the Four Pillars through an interactive chart anatomy. The characters are **illustrative, not a generated personal chart**, and the page says so beside the chart.
- Desktop visitors can click a pillar; desktop and touch visitors can swipe across it. Each action changes the explanatory note.
- The Five Elements section reveals their meanings on hover or tap. These interactions teach the system rather than merely moving decoration.
- GSAP animates the title, chart, and chapter entrances; ScrollTrigger drives chapter reveals and the progress rule. Text and chart remain visible while animation is pending. Reduced-motion preferences are respected.
- The existing birth, place confirmation, report, and Six Yao logic stay connected. The mobile report uses a chapter selector instead of eight horizontally scrolling tabs. The Six Yao question field appears on the first phone screen, with method details expandable.

The motion patterns follow GreenSock's [official GSAP skills](https://github.com/greensock/gsap-skills), especially scoped `useGSAP`, cleanup, ScrollTrigger, transforms, and reduced-motion handling.

## Local preview

From this worktree, run `npm install` and `npm run dev -- --port 3002`, then open `http://localhost:3002/`. `.env.local` is ignored and is needed locally for existing API-backed flows. This design is local only and has not been pushed or deployed.

## Checks

- `npm run build`
- `npx tsc --noEmit`
- `npx oxlint app/page.tsx app/question/page.tsx app/layout.tsx components/editorial/editorial-landing.tsx`
- `npm run test:unit` (23 passing)
- Browser checked at 360, 390, 768, 1024, and 1440 pixels without horizontal overflow. Birth intake reached city confirmation; the city was confirmed. First Six Yao line cast correctly. Saved reading was used to verify the mobile chapter selector without triggering a new interpretation request.

Screenshots are in [`screenshots/`](./screenshots/).

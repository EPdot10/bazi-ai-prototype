'use client';

import { useEffect, useRef } from 'react';

type WindVariant = 'paper' | 'chart' | 'casting';

interface Particle {
  x: number;
  y: number;
  depth: number;
  phase: number;
  radius: number;
  speed: number;
  dash: boolean;
}

const counts: Record<WindVariant, number> = {
  paper: 92,
  chart: 108,
  casting: 64,
};

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    depth: 0.22 + Math.random() * 0.78,
    phase: Math.random() * Math.PI * 2,
    radius: 0.6 + Math.random() * 1.1,
    speed: 0.55 + Math.random() * 0.9,
    dash: Math.random() < 0.14,
  }));
}

export function WindParticles({ variant }: { variant: WindVariant }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: true });
    if (!root || !canvas || !context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = !document.hidden;
    let inView = true;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollKick = 0;
    let lastScrollY = window.scrollY;
    let pulse: { x: number; y: number; started: number } | null = null;
    const particles = createParticles(
      Math.round(counts[variant] * (window.innerWidth < 640 ? 0.58 : 1)),
    );

    function resize() {
      if (!root || !canvas || !context) return;
      const bounds = root.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const scale = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.setTransform(scale, 0, 0, scale, 0, 0);
    }

    function onPointerMove(event: PointerEvent) {
      if (!root) return;
      const bounds = root.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) {
        targetX = 0;
        targetY = 0;
        return;
      }
      targetX = (event.clientX - bounds.left) / bounds.width - 0.5;
      targetY = (event.clientY - bounds.top) / bounds.height - 0.5;
    }

    function onPointerDown(event: PointerEvent) {
      if (!root) return;
      const bounds = root.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) return;
      pulse = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        started: performance.now(),
      };
    }

    function onScroll() {
      const next = window.scrollY;
      scrollKick = Math.max(-1, Math.min(1, scrollKick + (next - lastScrollY) * 0.006));
      lastScrollY = next;
    }

    function draw(now: number) {
      if (!context || !visible) return;
      context.clearRect(0, 0, width, height);
      pointerX += (targetX - pointerX) * 0.045;
      pointerY += (targetY - pointerY) * 0.045;
      scrollKick *= 0.955;

      const breath = Math.sin(now * 0.00052);
      const drift = now * 0.0000045;
      const wind = Math.sin(now * 0.00039) * 5 + scrollKick * 20;

      for (let i = 0; i < 3; i += 1) {
        const center = height * (0.31 + i * 0.18);
        context.beginPath();
        context.moveTo(-20, center + breath * 8);
        context.bezierCurveTo(
          width * 0.3, center - height * 0.13 + wind,
          width * 0.68, center + height * 0.15 - wind,
          width + 20, center - breath * 7,
        );
        context.strokeStyle = `rgba(170, 58, 47, ${0.032 + i * 0.009})`;
        context.lineWidth = 0.8;
        context.stroke();
      }

      const pulseLife = pulse ? (now - pulse.started) / 1150 : 2;
      if (pulseLife >= 1) pulse = null;

      for (const particle of particles) {
        const depth = particle.depth;
        const progress = ((particle.x + drift * particle.speed * depth) % 1.28 + 1.28) % 1.28;
        let x = (progress - 0.14) * width;
        let y = (0.2 + particle.y * 0.6) * height;
        y += Math.sin(progress * Math.PI * 2 + now * 0.00038 + particle.phase) * height * 0.075;
        x += wind * depth + pointerX * 22 * depth + breath * 4 * depth;
        y += pointerY * 14 * depth + Math.cos(now * 0.0006 + particle.phase) * 4 * depth;

        if (pulse && pulseLife < 1) {
          const dx = x - pulse.x;
          const dy = y - pulse.y;
          const distance = Math.hypot(dx, dy) || 1;
          const reach = Math.min(width, height) * 0.38;
          const force = Math.exp(-(distance * distance) / (reach * reach)) *
            Math.sin(pulseLife * Math.PI) * 22 * depth;
          x += (dx / distance) * force;
          y += (dy / distance) * force;
        }

        const alpha = (0.12 + depth * 0.31) * (0.78 + breath * 0.22);
        const radius = particle.radius * (0.75 + depth * 0.75);
        context.fillStyle = `rgba(170, 58, 47, ${alpha})`;
        context.strokeStyle = `rgba(170, 58, 47, ${alpha * 0.7})`;
        if (particle.dash) {
          context.beginPath();
          context.moveTo(x - radius * 2.2, y + radius * 0.45);
          context.lineTo(x + radius * 2.2, y - radius * 0.45);
          context.lineWidth = Math.max(0.5, radius * 0.6);
          context.stroke();
        } else {
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
      }

      frame = requestAnimationFrame(draw);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    function syncVisibility() {
      const nextVisible = inView && !document.hidden;
      if (nextVisible === visible) return;
      visible = nextVisible;
      if (visible) frame = requestAnimationFrame(draw);
      else cancelAnimationFrame(frame);
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncVisibility();
    });
    visibilityObserver.observe(root);
    resize();
    if (visible) frame = requestAnimationFrame(draw);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', syncVisibility);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [variant]);

  return (
    <div aria-hidden="true" className={`wind-particles wind-particles--${variant}`} ref={rootRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}

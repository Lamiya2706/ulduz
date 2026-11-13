import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { SIGN_GLYPHS } from "@shared/zodiac";

/** Slow twinkling starfield behind everything. */
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const cv = ref.current!;
    const cx = cv.getContext("2d")!;
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
    let raf = 0;
    const size = () => {
      const d = devicePixelRatio || 1;
      cv.width = innerWidth * d; cv.height = innerHeight * d;
      stars = Array.from({ length: Math.round((innerWidth * innerHeight) / 9000) }, () => ({
        x: Math.random() * cv.width, y: Math.random() * cv.height, r: (Math.random() * 1.1 + 0.25) * d, p: Math.random() * 6.3, s: 0.3 + Math.random(),
      }));
    };
    const draw = (t: number) => {
      cx.clearRect(0, 0, cv.width, cv.height);
      for (const s of stars) {
        const a = reduce ? 0.45 : 0.18 + 0.5 * (Math.sin((t / 1000) * s.s + s.p) + 1) / 2;
        cx.fillStyle = `rgba(244,237,226,${a})`;
        cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    size(); draw(0);
    addEventListener("resize", size);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, [reduce]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8, delay, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

/** Thin gold divider with an abstracted buta (paisley) motif, inspired by Azerbaijani carpets. */
export function CarpetDivider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center gap-4 text-gold/40 ${className}`}>
      <span className="hairline flex-1" />
      <svg width="132" height="22" viewBox="0 0 132 22" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M66 3c5 0 8 4 8 8s-3 8-8 8c3-2 4-5 2-8-2-2-5-1-6 1-1-5 1-9 4-9z" />
        <path d="M44 11l6-6 6 6-6 6zM76 11l6-6 6 6-6 6z" />
        <path d="M24 11h14M94 11h14M10 11l4-4 4 4-4 4zM114 11l4-4 4 4-4 4z" />
        <circle cx="66" cy="11" r="1.2" fill="currentColor" />
      </svg>
      <span className="hairline flex-1" />
    </div>
  );
}

/** Decorative, slowly rotating line-art zodiac wheel for the hero. */
export function HeroWheel({ className = "" }: { className?: string }) {
  const C = 200, R1 = 190, R2 = 158, R3 = 120;
  const pt = (deg: number, r: number) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];
  return (
    <svg viewBox="0 0 400 400" className={`animate-spinSlow ${className}`} aria-hidden>
      <g fill="none" stroke="#D6B47C" strokeOpacity=".45">
        <circle cx={C} cy={C} r={R1} /><circle cx={C} cy={C} r={R2} /><circle cx={C} cy={C} r={R3} strokeOpacity=".25" />
        <circle cx={C} cy={C} r={60} strokeOpacity=".2" strokeDasharray="2 6" />
        {Array.from({ length: 12 }, (_, i) => { const [x1, y1] = pt(i * 30, R2); const [x2, y2] = pt(i * 30, R1); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />; })}
        {Array.from({ length: 72 }, (_, i) => { const [x1, y1] = pt(i * 5, R2); const [x2, y2] = pt(i * 5, R2 - (i % 6 ? 4 : 8)); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity=".35" />; })}
        {[[20, 140], [95, 250], [140, 330], [200, 40], [260, 160], [300, 280]].map(([a, b], i) => { const [x1, y1] = pt(a, R3 - 4); const [x2, y2] = pt(b, R3 - 4); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity=".22" />; })}
      </g>
      {SIGN_GLYPHS.map((g, i) => { const [x, y] = pt(i * 30 + 15, (R1 + R2) / 2); return <text key={i} x={x} y={y} className="glyph" fontSize="17" fill="#D6B47C" fillOpacity=".75" textAnchor="middle" dominantBaseline="central">{g}</text>; })}
      {[[35, 140], [118, 90], [205, 130], [290, 100], [330, 145]].map(([a, r], i) => { const [x, y] = pt(a, r); return <circle key={i} cx={x} cy={y} r="2.4" fill="#F4EDE2" fillOpacity=".8" />; })}
    </svg>
  );
}

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2l1.9 7.1L21 12l-7.1 1.9L12 22l-1.9-8.1L3 12l7.1-2.9z" fill="currentColor" />
    </svg>
  );
}

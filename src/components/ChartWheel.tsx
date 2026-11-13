import { useState } from "react";
import { degreeIn, isSoft, PLANETS, SIGN_ELEMENT, SIGN_GLYPHS, signOf, type Chart, type PlanetKey } from "@shared/astro";
import type { Content } from "@/content";

const EL_COLOR = { Fire: "#D6B47C", Earth: "#8FAE96", Air: "#9FB3D1", Water: "#B79CC9" } as const;

export default function ChartWheel({ chart, content, noonLabel }: { chart: Chart; content: Content; noonLabel: string }) {
  const [active, setActive] = useState<PlanetKey | null>(null);
  const W = 600, C = 300, R1 = 288, R2 = 244, RP = 210, RD = 184, RH = 150, RA = 126;
  const off = chart.angles ? chart.angles.asc : 0;
  const P = (lon: number, r: number) => {
    const t = ((180 + lon - off) * Math.PI) / 180;
    return [C + r * Math.cos(t), C - r * Math.sin(t)] as const;
  };

  const list = PLANETS.map((p) => ({ ...p, lon: chart.pos[p.key].lon, d: chart.pos[p.key].lon })).sort((a, b) => a.lon - b.lon);
  for (let pass = 0; pass < 4; pass++) for (let i = 1; i < list.length; i++) if (list[i].d - list[i - 1].d < 8) list[i].d = list[i - 1].d + 8;

  const act = active ? chart.pos[active] : null;
  return (
    <figure className="relative mx-auto w-full max-w-[600px]">
      <svg viewBox={`-30 -30 ${W + 60} ${W + 60}`} className="w-full" role="img" aria-label="Natal chart wheel">
        <defs>
          <radialGradient id="wheelGlow"><stop offset="0" stopColor="#D6B47C" stopOpacity=".06" /><stop offset="1" stopColor="#D6B47C" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R1} fill="url(#wheelGlow)" stroke="#D6B47C" strokeOpacity=".35" />
        <circle cx={C} cy={C} r={R2} fill="none" stroke="#D6B47C" strokeOpacity=".3" />
        <circle cx={C} cy={C} r={RA} fill="rgba(11,13,23,.35)" stroke="#D6B47C" strokeOpacity=".18" />
        {Array.from({ length: 12 }, (_, i) => {
          const a0 = i * 30, a1 = a0 + 30;
          const [x1, y1] = P(a0, R1), [x2, y2] = P(a0, R2), [x3, y3] = P(a1, R1), [x4, y4] = P(a1, R2);
          const col = EL_COLOR[SIGN_ELEMENT[i]];
          const [gx, gy] = P(a0 + 15, (R1 + R2) / 2);
          return (
            <g key={i}>
              <path d={`M${x1} ${y1}A${R1} ${R1} 0 0 0 ${x3} ${y3}L${x4} ${y4}A${R2} ${R2} 0 0 1 ${x2} ${y2}Z`} fill={col} fillOpacity=".05" stroke="#D6B47C" strokeOpacity=".22" />
              <text x={gx} y={gy} className="glyph" fontSize="21" fill={col} textAnchor="middle" dominantBaseline="central">{SIGN_GLYPHS[i]}<title>{content.signNames[i]}</title></text>
              {[5, 10, 15, 20, 25].map((k) => { const [a, b] = P(a0 + k, R2), [c, d] = P(a0 + k, R2 - (k % 10 ? 4 : 7)); return <line key={k} x1={a} y1={b} x2={c} y2={d} stroke="#D6B47C" strokeOpacity=".3" />; })}
              {chart.angles && (() => {
                const h = ((i - signOf(chart.angles.asc) + 12) % 12) + 1;
                const [hx, hy] = P(a0 + 15, RH - 10); const [l1, l2] = P(a0, RA), [l3, l4] = P(a0, R2);
                return <><line x1={l1} y1={l2} x2={l3} y2={l4} stroke="#D6B47C" strokeOpacity=".08" /><text x={hx} y={hy} fontSize="11" fill="#A79E92" fillOpacity=".7" textAnchor="middle" dominantBaseline="central" fontFamily="Inter">{h}</text></>;
              })()}
            </g>
          );
        })}
        {chart.aspects.slice(0, 16).filter((a) => a.type !== "conjunction" && a.a !== "Node" && a.b !== "Node").map((a, i) => {
          const [x1, y1] = P(chart.pos[a.a].lon, RA - 4), [x2, y2] = P(chart.pos[a.b].lon, RA - 4);
          const on = !active || active === a.a || active === a.b;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isSoft(a.type) ? "#8FAE96" : "#C98B84"} strokeWidth="1" strokeOpacity={on ? Math.max(0.3, 0.9 - a.orb / 8) : 0.06} />;
        })}
        {chart.angles && ([[chart.angles.asc, "ASC"], [chart.angles.mc, "MC"]] as const).map(([lon, lab]) => {
          const [x1, y1] = P(lon, RA), [x2, y2] = P(lon, R1 + 8), [tx, ty] = P(lon, R1 + 22);
          return <g key={lab}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D6B47C" strokeWidth="1.6" /><text x={tx} y={ty} fontSize="12" fill="#D6B47C" textAnchor="middle" dominantBaseline="central" fontFamily="Inter" fontWeight="600" letterSpacing="1">{lab}</text></g>;
        })}
        {list.map((p) => {
          const [t1x, t1y] = P(p.lon, R2), [t2x, t2y] = P(p.lon, R2 - 10), [px, py] = P(p.d, RP), [dx, dy] = P(p.d, RD);
          const pos = chart.pos[p.key];
          const on = !active || active === p.key;
          return (
            <g key={p.key} className="cursor-pointer" opacity={on ? 1 : 0.35}
              onMouseEnter={() => setActive(p.key)} onMouseLeave={() => setActive(null)} onClick={() => setActive(active === p.key ? null : p.key)}
              tabIndex={0} role="button" aria-label={`${content.planetNames[p.key]} ${content.signIn[pos.sign]}`}
              onFocus={() => setActive(p.key)} onBlur={() => setActive(null)}>
              <line x1={t1x} y1={t1y} x2={t2x} y2={t2y} stroke="#F4EDE2" strokeWidth="1.4" />
              <circle cx={px} cy={py} r="15" fill="transparent" />
              <text x={px} y={py} className="glyph" fontSize="20" fill={active === p.key ? "#D6B47C" : "#F4EDE2"} textAnchor="middle" dominantBaseline="central">{p.glyph}</text>
              <text x={dx} y={dy} fontSize="10" fill="#A79E92" textAnchor="middle" dominantBaseline="central" fontFamily="Inter">{degreeIn(p.lon).d}°{pos.retro ? "℞" : ""}</text>
            </g>
          );
        })}
        {!chart.timeKnown && <text x={C} y={C} fontSize="12" fill="#A79E92" textAnchor="middle" fontFamily="Inter" letterSpacing="2">{noonLabel.toUpperCase()}</text>}
      </svg>
      <figcaption aria-live="polite" className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto w-max -translate-y-1/2 text-center">
        {act && active && (
          <span className="rounded-full border border-gold/30 bg-night/90 px-4 py-2 text-sm text-ivory shadow-glow">
            <span className="glyph mr-1.5 text-gold">{PLANETS.find((x) => x.key === active)!.glyph}</span>
            {content.planetNames[active]} {content.signIn[act.sign]} · {degreeIn(act.lon).d}°{String(degreeIn(act.lon).m).padStart(2, "0")}′
            {act.house ? ` · ${content.ordinal(act.house)}` : ""}{act.retro ? " ℞" : ""}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

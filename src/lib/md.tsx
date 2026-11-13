import { Fragment, type ReactNode } from "react";

/** Tiny, safe markdown subset → React: ## headings, - bullets, **bold**, *italic*, paragraphs. */
function inline(s: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*([^*\n]+)\*/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push(m[1] ? <strong key={`${key}-${i++}`}>{m[1]}</strong> : <em key={`${key}-${i++}`}>{m[2]}</em>);
    last = re.lastIndex;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let para: string[] = [], list: string[] | null = null;
  const flushP = () => { if (para.length) { blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(" "), `p${blocks.length}`)}</p>); para = []; } };
  const flushL = () => { if (list) { const k = `l${blocks.length}`; blocks.push(<ul key={k}>{list.map((it, j) => <li key={j}>{inline(it, `${k}-${j}`)}</li>)}</ul>); list = null; } };
  for (const raw of text.split("\n")) {
    const l = raw.trim();
    if (/^#{1,4}\s/.test(l)) { flushP(); flushL(); blocks.push(<h3 key={`h${blocks.length}`}>{inline(l.replace(/^#+\s*/, ""), `h${blocks.length}`)}</h3>); }
    else if (/^[-•*]\s+/.test(l)) { flushP(); (list ??= []).push(l.replace(/^[-•*]\s+/, "")); }
    else if (!l) { flushP(); flushL(); }
    else { flushL(); para.push(l); }
  }
  flushP(); flushL();
  return <Fragment>{blocks}</Fragment>;
}

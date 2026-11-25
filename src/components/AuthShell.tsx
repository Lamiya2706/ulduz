import type { ReactNode } from "react";
import { motion } from "framer-motion";

/** Centered page frame shared by the log-in, reset-password and account pages. */
export default function AuthShell({ eyebrow, title, sub, children, wide = false }: { eyebrow: string; title: string; sub?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 lg:pt-14">
      <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 text-4xl leading-[1.08] sm:text-5xl">{title}</h1>
        {sub && <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{sub}</p>}
      </motion.header>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}
        className={`card mx-auto mt-10 grid gap-5 bg-night-2/85 backdrop-blur-md sm:p-9 ${wide ? "max-w-2xl" : "max-w-md"}`}>
        {children}
      </motion.div>
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

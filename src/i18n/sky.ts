// Short strings for the lunar calendar outside its own page (header, footer, SEO).
const en = {
  nav: "Lunar calendar",
  meta: { title: "Lunar calendar and haircut calendar for today — Ulduz", description: "Moon sign and phase, lunar day, retrograde planets and the number of the day: what today is good for, what to avoid, and the best days for a haircut this month." },
};
type SkyUI = typeof en;
const az: SkyUI = {
  nav: "Ay təqvimi",
  meta: { title: "Bu gün üçün Ay təqvimi və saç kəsimi təqvimi — Ulduz", description: "Ayın bürcü və fazası, Ay günü, retroqrad planetlər və günün rəqəmi: bu gün nəyə yaxşıdır, nədən çəkinmək lazımdır və bu ay saç kəsdirmək üçün ən yaxşı günlər." },
};
const ru: SkyUI = {
  nav: "Лунный календарь",
  meta: { title: "Лунный календарь и календарь стрижек на сегодня — Ulduz", description: "Знак и фаза Луны, лунный день, ретроградные планеты и число дня: для чего хорош сегодняшний день, чего избегать и лучшие дни для стрижки в этом месяце." },
};
export const SKY_UI = { en, az, ru };

// Short strings for the lunar calendar outside its own page (header, footer, SEO).
const en = {
  nav: "Lunar calendar",
  exploreTitle: "More to discover",
  teaser: { eyebrow: "Every day", title: "Lunar calendar", text: "The Moon's phase and sign, what the day is good for, and the best days for a haircut this month.", cta: "Open the calendar" },
  meta: { title: "Lunar calendar and haircut calendar for today — Ulduz", description: "Moon sign and phase, lunar day, retrograde planets and the number of the day: what today is good for, what to avoid, and the best days for a haircut this month." },
};
type SkyUI = typeof en;
const az: SkyUI = {
  nav: "Ay təqvimi",
  exploreTitle: "Daha nələr var",
  teaser: { eyebrow: "Hər gün", title: "Ay təqvimi", text: "Ayın fazası və bürcü, günün nəyə yaxşı olduğu və bu ay saç kəsdirmək üçün ən yaxşı günlər.", cta: "Təqvimi aç" },
  meta: { title: "Bu gün üçün Ay təqvimi və saç kəsimi təqvimi — Ulduz", description: "Ayın bürcü və fazası, Ay günü, retroqrad planetlər və günün rəqəmi: bu gün nəyə yaxşıdır, nədən çəkinmək lazımdır və bu ay saç kəsdirmək üçün ən yaxşı günlər." },
};
const ru: SkyUI = {
  nav: "Лунный календарь",
  exploreTitle: "Что ещё есть в Ulduz",
  teaser: { eyebrow: "Каждый день", title: "Лунный календарь", text: "Фаза и знак Луны, для чего хорош день и лучшие дни для стрижки в этом месяце.", cta: "Открыть календарь" },
  meta: { title: "Лунный календарь и календарь стрижек на сегодня — Ulduz", description: "Знак и фаза Луны, лунный день, ретроградные планеты и число дня: для чего хорош сегодняшний день, чего избегать и лучшие дни для стрижки в этом месяце." },
};
export const SKY_UI = { en, az, ru };

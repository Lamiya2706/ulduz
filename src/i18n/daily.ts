// Short strings for the personal daily horoscope outside its own page (header, footer, SEO).
const en = {
  nav: "Your day",
  teaser: { eyebrow: "Every day", title: "Your day", text: "Your personal horoscope: today's planets over your own birth chart, with love, money, work and mood.", cta: "Open my day" },
  meta: { title: "Personal daily horoscope from your birth chart — Ulduz", description: "Not a horoscope for a whole zodiac sign: today's planets over your own natal chart. The Moon's house, the contacts to your planets, and your day in love, money, work and wellbeing." },
};
type DailyUI = typeof en;
const az: DailyUI = {
  nav: "Sənin günün",
  teaser: { eyebrow: "Hər gün", title: "Sənin günün", text: "Şəxsi falın: bu günün planetləri sənin doğum xəritənin üzərində, sevgi, pul, iş və əhval üzrə.", cta: "Günümü aç" },
  meta: { title: "Doğum xəritənə görə şəxsi gündəlik ulduz falı — Ulduz", description: "Bütün bürc üçün ümumi fal deyil: bu günün planetləri sənin öz natal xəritənin üzərində. Ayın evi, planetlərinə toxunuşlar və sevgi, pul, iş və əhval üzrə günün." },
};
const ru: DailyUI = {
  nav: "Твой день",
  teaser: { eyebrow: "Каждый день", title: "Твой день", text: "Личный гороскоп: сегодняшние планеты на фоне твоей натальной карты, с любовью, деньгами, работой и настроением.", cta: "Открыть мой день" },
  meta: { title: "Личный гороскоп на день по натальной карте — Ulduz", description: "Не гороскоп для целого знака: сегодняшние планеты на фоне твоей натальной карты. Дом Луны, связи с твоими планетами и твой день в любви, деньгах, работе и самочувствии." },
};
export const DAILY_UI = { en, az, ru };

// Short strings for the year forecast outside its own page (header, footer, home, SEO).
const en = {
  nav: "Year forecast",
  teaser: { eyebrow: "By date of birth", title: "Your year ahead", text: "Your personal year, the theme of every month, the planets' influence on your Sun, retrogrades and eclipses.", cta: "See my year" },
  meta: { title: "Personal year forecast by date of birth — Ulduz", description: "A free forecast for the year: personal year by numerology, month-by-month themes, transits of Jupiter and Saturn to your Sun, Mercury retrograde dates and eclipses." },
};
type YearUI = typeof en;
const az: YearUI = {
  nav: "İllik proqnoz",
  teaser: { eyebrow: "Doğum tarixinə görə", title: "Qarşıdakı ilin", text: "Şəxsi ilin, hər ayın mövzusu, planetlərin Günəşinə təsiri, retroqrad dövrlər və tutulmalar.", cta: "İlimə bax" },
  meta: { title: "Doğum tarixinə görə şəxsi illik proqnoz — Ulduz", description: "Pulsuz illik proqnoz: numerologiyaya görə şəxsi il, ay-ay mövzular, Yupiter və Saturnun Günəşinə tranzitləri, retroqrad Merkuri tarixləri və tutulmalar." },
};
const ru: YearUI = {
  nav: "Прогноз на год",
  teaser: { eyebrow: "По дате рождения", title: "Твой год", text: "Личный год, тема каждого месяца, влияние планет на твоё Солнце, ретроградные периоды и затмения.", cta: "Посмотреть мой год" },
  meta: { title: "Личный прогноз на год по дате рождения — Ulduz", description: "Бесплатный прогноз на год: личный год по нумерологии, темы по месяцам, транзиты Юпитера и Сатурна к твоему Солнцу, даты ретроградного Меркурия и затмения." },
};
export const YEAR_UI = { en, az, ru };

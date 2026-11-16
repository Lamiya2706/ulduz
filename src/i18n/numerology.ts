// Short UI strings for the numerology section that live outside its own page (header, footer, home, chart page).
const en = {
  meta: { title: "Free numerology by name and date of birth — Ulduz", description: "Life Path, Expression, Soul and Personality numbers, karmic debts and lessons, the Pythagoras square, pinnacles and your personal year — a detailed free numerology profile." },
  nav: "Numerology",
  teaser: { eyebrow: "Only a name and a date", title: "Your numbers, in full", text: "Core numbers, karmic lessons, the Pythagoras square and the big periods of your life — by name and date only.", cta: "Calculate my numbers" },
  fromChart: "Open the detailed numerology profile",
};
type NumUI = typeof en;
const az: NumUI = {
  meta: { title: "Ad və doğum tarixinə görə pulsuz numerologiya — Ulduz", description: "Həyat Yolu, İfadə, Ruh və Şəxsiyyət rəqəmləri, karmik borclar və dərslər, Pifaqor kvadratı, həyat dövrləri və şəxsi il — ətraflı pulsuz numerologiya profili." },
  nav: "Numerologiya",
  teaser: { eyebrow: "Yalnız ad və tarix", title: "Rəqəmlərin — tam şəkildə", text: "Əsas rəqəmlər, karmik dərslər, Pifaqor kvadratı və həyatının böyük dövrləri — yalnız ad və tarixə görə.", cta: "Rəqəmlərimi hesabla" },
  fromChart: "Ətraflı numerologiya profilini aç",
};
const ru: NumUI = {
  meta: { title: "Бесплатная нумерология по имени и дате рождения — Ulduz", description: "Число пути жизни, выражения, души и личности, кармические долги и уроки, квадрат Пифагора, периоды жизни и личный год — подробный бесплатный нумерологический профиль." },
  nav: "Нумерология",
  teaser: { eyebrow: "Только имя и дата", title: "Твои числа — полностью", text: "Основные числа, кармические уроки, квадрат Пифагора и большие периоды жизни — только по имени и дате.", cta: "Рассчитать мои числа" },
  fromChart: "Открыть подробный нумерологический профиль",
};
export const NUM_UI = { en, az, ru };

// Short strings for the Full Moon ritual outside its own page (header, footer, home, SEO, banners).
const en = {
  nav: "Full Moon ritual",
  teaser: { eyebrow: "Every full moon", title: "Full Moon ritual", text: "Manifestation methods, a step-by-step ritual and the theme of this Full Moon by its sign.", cta: "Open the ritual" },
  banner: { now: "Full Moon tonight — time to let go and call in what you want.", cta: "Full Moon ritual" },
  meta: { title: "Full Moon manifestation: ritual and methods — Ulduz", description: "How to manifest on the Full Moon: a step-by-step ritual, release letter, moon water, scripting, the 3-6-9 method, and the theme of this Full Moon by zodiac sign." },
};
type FullMoonUI = typeof en;
const az: FullMoonUI = {
  nav: "Bədirlənmiş Ay ritualı",
  teaser: { eyebrow: "Hər Bədirlənmiş Ayda", title: "Bədirlənmiş Ay ritualı", text: "Manifestasiya üsulları, addım-addım ritual və bu Bədirlənmiş Ayın bürcünə görə mövzusu.", cta: "Ritualı aç" },
  banner: { now: "Bu gecə Bədirlənmiş Aydır — buraxmaq və istədiyini çağırmaq vaxtıdır.", cta: "Bədirlənmiş Ay ritualı" },
  meta: { title: "Bədirlənmiş Ayda manifestasiya: ritual və üsullar — Ulduz", description: "Bədirlənmiş Ayda necə manifestasiya etməli: addım-addım ritual, buraxma məktubu, Ay suyu, skriptinq, 3-6-9 üsulu və bu Bədirlənmiş Ayın bürcə görə mövzusu." },
};
const ru: FullMoonUI = {
  nav: "Ритуал полнолуния",
  teaser: { eyebrow: "Каждое полнолуние", title: "Ритуал полнолуния", text: "Техники манифестации, ритуал шаг за шагом и тема этого полнолуния по его знаку.", cta: "Открыть ритуал" },
  banner: { now: "Сегодня полнолуние — время отпустить лишнее и позвать желаемое.", cta: "Ритуал полнолуния" },
  meta: { title: "Манифестация в полнолуние: ритуал и техники — Ulduz", description: "Как манифестировать в полнолуние: ритуал шаг за шагом, письмо отпускания, лунная вода, скриптинг, метод 3-6-9 и тема этого полнолуния по знаку зодиака." },
};
export const FULLMOON_UI = { en, az, ru };

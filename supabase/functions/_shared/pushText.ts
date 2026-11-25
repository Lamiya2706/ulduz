// Texts for the daily horoscope push notification, copied from src/content/daily so the edge function can use them.
// Keep in sync with src/content/daily/{az,en,ru}.ts (a test checks that they match).
export type PushLang = "az" | "en" | "ru";
export interface PushText { title: string; titleNoName: string; overall: string[]; focus: string[] }

export const PUSH_TEXT: Record<PushLang, PushText> = {
  "az": {
    "title": "{name}, ulduzlarda sənin günün",
    "titleNoName": "Ulduzlarda sənin günün",
    "overall": [
      "Çətin gün. Tələsmə, planları sadə saxla və özünə qarşı mülayim ol.",
      "Diqqət tələb edən gün. Hər şeyi yoxla və müqavimət göstərəni zorlama.",
      "Sabit gün. Ardıcıl iş və kiçik addımlar yaxşı alınır.",
      "Yaxşı gün. Səma sənin tərəfindədir, onu sənin üçün vacib olan işə yönəlt.",
      "Parlaq gün. Qapılar asan açılır: «hə» de, başla və insanlara yaxınlaş."
    ],
    "focus": [
      "Diqqət mərkəzindəsən. Bədənin, görünüşün və necə təsir bağışladığın diqqət istəyir.",
      "Pul, rahatlıq və sənin üçün dəyərli olanlar ön plana çıxır.",
      "Söhbətlər, mesajlar, qısa səfərlər və öyrənmək günü doldurur.",
      "Ev, ailə və daxili təhlükəsizlik hissi əsas mövzudur.",
      "Sevinc, romantika və yaradıcılıq bu gün yer istəyir.",
      "Gündəlik iş, sağlamlıq və vərdişlər diqqət mərkəzindədir.",
      "Tərəfdaşlar və təkbətək münasibətlər ön plana çıxır.",
      "Dərin hisslər, yaxınlıq və ortaq pul mövzuları üzə çıxır.",
      "Üfüqün genişlənir: səyahət, təhsil və böyük ideyalar çağırır.",
      "Karyera, məqsədlər və nüfuzun göz önündədir.",
      "Dostlar, həmfikirlər və gələcək arzular əsas mövzudur.",
      "Dincəlmək, xəyallar və şəfa üçün sakit, içə dönük gün."
    ]
  },
  "en": {
    "title": "{name}, your day in the stars",
    "titleNoName": "Your day in the stars",
    "overall": [
      "A demanding day. Go slowly, keep plans simple and be gentle with yourself.",
      "A day that asks for care. Double-check things and don't force what resists.",
      "An even day. Steady work and small steps go well.",
      "A good day. The sky is on your side; use it for what matters to you.",
      "A bright day. Doors open easily, so say yes, start and reach out."
    ],
    "focus": [
      "You are in focus. Your body, your look and how you come across ask for attention.",
      "Money, comfort and what you value come forward.",
      "Talks, messages, short trips and learning fill the day.",
      "Home, family and your inner sense of safety are the theme.",
      "Joy, romance and creativity want space today.",
      "Daily work, health and routines are in focus.",
      "Partners and one-to-one relationships come forward.",
      "Deep feelings, intimacy and shared money surface.",
      "Your horizon widens: travel, study and big ideas call.",
      "Career, goals and your reputation are on display.",
      "Friends, groups and hopes for the future are the theme.",
      "A quieter, inward day for rest, dreams and healing."
    ]
  },
  "ru": {
    "title": "{name}, твой день по звёздам",
    "titleNoName": "Твой день по звёздам",
    "overall": [
      "Непростой день. Не спеши, упрости планы и береги себя.",
      "День, который просит внимания. Всё перепроверяй и не дави на то, что сопротивляется.",
      "Ровный день. Хорошо идут спокойная работа и маленькие шаги.",
      "Хороший день. Небо на твоей стороне: используй его для того, что важно тебе.",
      "Яркий день. Двери открываются легко: соглашайся, начинай и иди навстречу людям."
    ],
    "focus": [
      "Ты в центре внимания. Тело, внешность и то, как ты производишь впечатление, просят заботы.",
      "На первый план выходят деньги, комфорт и то, что ты ценишь.",
      "День наполнен разговорами, сообщениями, поездками и учёбой.",
      "Главная тема — дом, семья и внутреннее чувство безопасности.",
      "Радость, романтика и творчество просят места.",
      "В фокусе работа, здоровье и повседневные привычки.",
      "На первый план выходят партнёры и отношения один на один.",
      "Поднимаются глубокие чувства, близость и вопросы общих денег.",
      "Горизонт расширяется: зовут путешествия, учёба и большие идеи.",
      "Карьера, цели и репутация на виду.",
      "Главная тема — друзья, единомышленники и мечты о будущем.",
      "Тихий день, обращённый внутрь: отдых, мечты и восстановление."
    ]
  }
};

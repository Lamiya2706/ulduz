// UI strings for the couples compatibility feature (merged into each language's translation namespace).
const en = {
  nav: "Compatibility",
  teaser: { eyebrow: "For two", title: "How do your stars meet?", text: "Compare two birth charts: emotional bond, attraction, communication, commitment and growth — plus where your planets touch.", cta: "Check compatibility" },
  form: { eyebrow: "Synastry · compatibility", title1: "Two skies,", title2: "one conversation.", sub: "Enter both birth moments. We compare your real charts planet by planet and read how you meet — where it flows, and where it asks for care.",
    first: "First person", second: "Second person", submit: "Read our compatibility", errSecond: "Please complete the second person's details." },
  result: { eyebrow: "Compatibility of", overall: "Overall harmony", scoresTitle: "Your harmony, area by area", scoresIntro: "Scores show how much your charts naturally support each other in each area — not whether a relationship will work. That part is yours.",
    contactsEyebrow: "Synastry", contactsTitle: "Where your charts touch", contactsIntro: "The strongest contacts between one person's planets and the other's.", flow: "harmony", tension: "tension", orb: "orb",
    elementsEyebrow: "Elements", elementsTitle: "How your natures blend", numbersEyebrow: "Numerology", numbersTitle: "Your numbers together", lifePath: "Life Path",
    overlaysEyebrow: "House overlays", overlaysTitle: "In each other's houses", overlaysIntro: "Where one person's planets fall in the other's chart — the part of life each of you touches in the other.",
    noTimeNote: "One or both birth times are unknown, so Ascendant contacts and house overlays are left out.",
    openChart: "{{name}}'s full chart", nav: { scores: "Harmony", contacts: "Contacts", elements: "Elements", numbers: "Numbers", overlays: "Houses", reading: "✦ Couple reading" } },
  locked: { eyebrow: "Written only for the two of you", title: "Your couple reading",
    intro: "A long, warm reading of your two charts woven together — what draws you to each other, where you clash, how each of you loves and attaches, and what this relationship asks of you both.",
    sections: ["What brings you together", "The magnetism between you", "How each of you loves", "Where you clash — and why", "Your emotional world together", "Talking and understanding", "What your numbers say", "Your path together", "A last word for you both"],
    cta: "Unlock your couple reading — 1 ₼" },
  checkout: { title: "Your couple reading", includes: ["A 9-part reading of both charts together", "3 questions to ask about your relationship", "Saved at a private link, with PDF"] },
  reading: { writtenFor: "Written for {{a}} & {{b}}", chips: ["What do we need to work on most?", "How can we argue better?", "What does each of us need to feel loved?", "What is this relationship teaching us?"] },
};
type CoupleUI = typeof en;

const az: CoupleUI = {
  nav: "Uyğunluq",
  teaser: { eyebrow: "İki nəfər üçün", title: "Ulduzlarınız necə görüşür?", text: "İki doğum xəritəsini müqayisə et: emosional bağ, cazibə, ünsiyyət, bağlılıq və inkişaf — üstəlik planetlərinizin toxunduğu nöqtələr.", cta: "Uyğunluğu yoxla" },
  form: { eyebrow: "Sinastriya · uyğunluq", title1: "İki səma,", title2: "bir söhbət.", sub: "Hər ikinizin doğum anını yazın. Həqiqi xəritələrinizi planet-planet müqayisə edib necə görüşdüyünüzü oxuyuruq — harada asan axır, harada qayğı istəyir.",
    first: "Birinci şəxs", second: "İkinci şəxs", submit: "Uyğunluğumuzu oxu", errSecond: "Zəhmət olmasa, ikinci şəxsin məlumatlarını tamamla." },
  result: { eyebrow: "Uyğunluq:", overall: "Ümumi ahəng", scoresTitle: "Sahə-sahə ahənginiz", scoresIntro: "Ballar xəritələrinizin hər sahədə bir-birini nə qədər təbii dəstəklədiyini göstərir — münasibətin alınıb-alınmayacağını yox. O hissə sizindir.",
    contactsEyebrow: "Sinastriya", contactsTitle: "Xəritələriniz harada toxunur", contactsIntro: "Birinizin planetləri ilə digərinizin planetləri arasındakı ən güclü təmaslar.", flow: "ahəng", tension: "gərginlik", orb: "orb",
    elementsEyebrow: "Elementlər", elementsTitle: "Təbiətləriniz necə qarışır", numbersEyebrow: "Numerologiya", numbersTitle: "Rəqəmləriniz birlikdə", lifePath: "Həyat Yolu",
    overlaysEyebrow: "Ev keçidləri", overlaysTitle: "Bir-birinizin evlərində", overlaysIntro: "Birinizin planetlərinin digərinin xəritəsində düşdüyü yer — hər birinizin digərində toxunduğu həyat sahəsi.",
    noTimeNote: "Doğum saatlarından biri və ya hər ikisi məlum deyil, ona görə Asendent təmasları və ev keçidləri göstərilmir.",
    openChart: "{{name}} — tam xəritə", nav: { scores: "Ahəng", contacts: "Təmaslar", elements: "Elementlər", numbers: "Rəqəmlər", overlays: "Evlər", reading: "✦ Cütlük oxunuşu" } },
  locked: { eyebrow: "Yalnız ikiniz üçün yazılıb", title: "Cütlük oxunuşunuz",
    intro: "İki xəritənizi bir-birinə hörən uzun, isti oxunuş — sizi bir-birinizə nə çəkir, harada toqquşursunuz, hər biriniz necə sevir və bağlanır, bu münasibət hər ikinizdən nə istəyir.",
    sections: ["Sizi nə birləşdirir", "Aranızdakı cazibə", "Hər biriniz necə sevir", "Harada toqquşursunuz — və niyə", "Birgə emosional dünyanız", "Danışmaq və anlamaq", "Rəqəmləriniz nə deyir", "Birgə yolunuz", "Hər ikinizə son söz"],
    cta: "Cütlük oxunuşunu aç — 1 ₼" },
  checkout: { title: "Cütlük oxunuşunuz", includes: ["Hər iki xəritənin birlikdə 9 hissəli oxunuşu", "Münasibətiniz haqqında 3 sual", "Şəxsi linkdə və PDF olaraq saxlanılır"] },
  reading: { writtenFor: "{{a}} və {{b}} üçün yazılıb", chips: ["Ən çox nə üzərində işləməliyik?", "Necə daha yaxşı mübahisə edə bilərik?", "Hər birimiz sevildiyini hiss etmək üçün nəyə ehtiyac duyur?", "Bu münasibət bizə nə öyrədir?"] },
};

const ru: CoupleUI = {
  nav: "Совместимость",
  teaser: { eyebrow: "Для двоих", title: "Как встречаются ваши звёзды?", text: "Сравните две натальные карты: эмоциональная связь, притяжение, общение, верность и рост — и где соприкасаются ваши планеты.", cta: "Проверить совместимость" },
  form: { eyebrow: "Синастрия · совместимость", title1: "Два неба,", title2: "один разговор.", sub: "Укажите оба момента рождения. Мы сравним ваши настоящие карты планета за планетой и прочитаем, как вы встречаетесь, — где всё течёт легко, а где нужна забота.",
    first: "Первый человек", second: "Второй человек", submit: "Прочитать нашу совместимость", errSecond: "Пожалуйста, заполните данные второго человека." },
  result: { eyebrow: "Совместимость:", overall: "Общая гармония", scoresTitle: "Ваша гармония по сферам", scoresIntro: "Баллы показывают, насколько ваши карты естественно поддерживают друг друга в каждой сфере, — а не получатся ли отношения. Это зависит от вас.",
    contactsEyebrow: "Синастрия", contactsTitle: "Где соприкасаются ваши карты", contactsIntro: "Самые сильные контакты между планетами одного и планетами другого.", flow: "гармония", tension: "напряжение", orb: "орбис",
    elementsEyebrow: "Стихии", elementsTitle: "Как смешиваются ваши натуры", numbersEyebrow: "Нумерология", numbersTitle: "Ваши числа вместе", lifePath: "Путь Жизни",
    overlaysEyebrow: "Наложения домов", overlaysTitle: "В домах друг друга", overlaysIntro: "Куда планеты одного попадают в карте другого — сфера жизни, которой каждый из вас касается в другом.",
    noTimeNote: "Время рождения одного или обоих неизвестно, поэтому контакты с Асцендентом и наложения домов не показаны.",
    openChart: "Полная карта: {{name}}", nav: { scores: "Гармония", contacts: "Контакты", elements: "Стихии", numbers: "Числа", overlays: "Дома", reading: "✦ Разбор для пары" } },
  locked: { eyebrow: "Написано только для вас двоих", title: "Ваш разбор для пары",
    intro: "Длинный, тёплый разбор, сплетающий ваши две карты, — что вас притягивает, где вы сталкиваетесь, как каждый из вас любит и привязывается и чего эти отношения просят от вас обоих.",
    sections: ["Что вас соединяет", "Притяжение между вами", "Как любит каждый из вас", "Где вы сталкиваетесь — и почему", "Ваш общий эмоциональный мир", "Говорить и понимать", "Что говорят ваши числа", "Ваш общий путь", "Последнее слово вам обоим"],
    cta: "Открыть разбор для пары — 1 ₼" },
  checkout: { title: "Ваш разбор для пары", includes: ["Разбор обеих карт вместе из 9 частей", "3 вопроса о ваших отношениях", "Сохраняется по личной ссылке, есть PDF"] },
  reading: { writtenFor: "Написано для: {{a}} и {{b}}", chips: ["Над чем нам важнее всего работать?", "Как нам лучше ссориться?", "Что нужно каждому из нас, чтобы чувствовать себя любимым?", "Чему нас учат эти отношения?"] },
};

export const COUPLE_UI = { en, az, ru };

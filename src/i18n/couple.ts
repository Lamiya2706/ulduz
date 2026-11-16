// UI strings for the couples compatibility feature (merged into each language's translation namespace).
const en = {
  meta: { title: "Couple compatibility by natal charts — Ulduz", description: "Compare two real birth charts: emotional bond, attraction, communication, commitment and growth, plus where your planets touch. Free synastry in Azerbaijani, English and Russian." },
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
    cta: "Unlock your couple reading — 2 ₼" },
  checkout: { title: "Your couple reading", includes: ["A 9-part reading of both charts together", "3 questions to ask about your relationship", "Saved at a private link, with PDF"] },
  reading: { writtenFor: "Written for {{a}} & {{b}}", chips: ["What do we need to work on most?", "How can we argue better?", "What does each of us need to feel loved?", "What is this relationship teaching us?"] },
};
type CoupleUI = typeof en;

const az: CoupleUI = {
  meta: { title: "Natal xəritəyə görə cütlük uyğunluğu — Ulduz", description: "İki həqiqi doğum xəritəsini müqayisə et: hisslər, cazibə, ünsiyyət, etibar və birlikdə inkişaf, üstəlik planetlərinizin toxunduğu nöqtələr. Pulsuz sinastriya." },
  nav: "Uyğunluq",
  teaser: { eyebrow: "İki nəfər üçün", title: "Ulduzlarınız necə görüşür?", text: "İki natal xəritəni yan-yana qoyaq: hisslər, cazibə, ünsiyyət, etibar və birlikdə inkişaf — üstəlik planetlərinizin bir-birinə harada toxunduğu.", cta: "Uyğunluğu yoxla" },
  form: { eyebrow: "Sinastriya · uyğunluq", title1: "İki səma —", title2: "bir hekayə.", sub: "Hər ikinizin doğum anını yazın. Həqiqi xəritələrinizi planet-planet müqayisə edəcəyik və aranızda nəyin asan alındığını, nəyin qayğı istədiyini göstərəcəyik.",
    first: "Birinci insan", second: "İkinci insan", submit: "Uyğunluğumuzu göstər", errSecond: "Zəhmət olmasa, ikinci insanın məlumatlarını da doldur." },
  result: { eyebrow: "Uyğunluq:", overall: "Ümumi ahəng", scoresTitle: "Sahələr üzrə ahənginiz", scoresIntro: "Ballar xəritələrinizin hər sahədə bir-birini nə qədər təbii dəstəklədiyini göstərir — münasibətin alınıb-alınmayacağını yox. Bu, artıq sizin əlinizdədir.",
    contactsEyebrow: "Sinastriya", contactsTitle: "Xəritələriniz harada görüşür", contactsIntro: "Birinizin planetləri ilə digərinizin planetləri arasındakı ən güclü əlaqələr.", flow: "ahəng", tension: "gərginlik", orb: "orb",
    elementsEyebrow: "Elementlər", elementsTitle: "Təbiətləriniz necə uyuşur", numbersEyebrow: "Numerologiya", numbersTitle: "Rəqəmləriniz yan-yana", lifePath: "Həyat Yolu",
    overlaysEyebrow: "Ev keçidləri", overlaysTitle: "Bir-birinizin evlərində", overlaysIntro: "Birinizin planetləri digərinin xəritəsində hansı evə düşür — yəni hər biriniz digərinin həyatının hansı sahəsinə toxunursunuz.",
    noTimeNote: "Doğum saatlarından biri və ya hər ikisi məlum deyil, ona görə Asendentlə əlaqələr və ev keçidləri göstərilmir.",
    openChart: "{{name}} — tam xəritə", nav: { scores: "Ahəng", contacts: "Əlaqələr", elements: "Elementlər", numbers: "Rəqəmlər", overlays: "Evlər", reading: "✦ Cütlük təhlili" } },
  locked: { eyebrow: "Yalnız ikiniz üçün", title: "Cütlük təhlili",
    intro: "İki xəritəni bir yerdə oxuyan uzun, səmimi təhlil: sizi bir-birinizə nə çəkir, harada toqquşursunuz, hər biriniz necə sevir və bağlanır, bu münasibət ikinizdən nə gözləyir.",
    sections: ["Sizi nə birləşdirir", "Aranızdakı cazibə", "Hər biriniz necə sevir", "Harada toqquşursunuz — və niyə", "Ortaq emosional dünyanız", "Danışmaq və anlaşmaq", "Rəqəmləriniz nə deyir", "Birgə yolunuz", "İkinizə son söz"],
    cta: "Cütlük təhlilini aç — 2 ₼" },
  checkout: { title: "Cütlük təhlili", includes: ["İki xəritənin birlikdə oxunduğu 9 hissəli təhlil", "Münasibətiniz haqqında 3 sual", "Təhlil şəxsi linkdə qalır, PDF kimi də yükləmək olar"] },
  reading: { writtenFor: "{{a}} və {{b}}, bu sizin üçündür", chips: ["Ən çox nə üzərində işləməliyik?", "Necə daha sağlam mübahisə edə bilərik?", "Hər birimizə sevildiyini hiss etmək üçün nə lazımdır?", "Bu münasibət bizə nə öyrədir?"] },
};

const ru: CoupleUI = {
  meta: { title: "Совместимость пары по натальным картам — Ulduz", description: "Сравни две настоящие натальные карты: эмоциональная связь, притяжение, общение, надёжность и рост, а также точки соприкосновения ваших планет. Бесплатная синастрия." },
  nav: "Совместимость",
  teaser: { eyebrow: "Для двоих", title: "Как встречаются ваши звёзды?", text: "Сравните две натальные карты: эмоциональная связь, притяжение, общение, надёжность и общий рост — и то, где соприкасаются ваши планеты.", cta: "Проверить совместимость" },
  form: { eyebrow: "Синастрия · совместимость", title1: "Два неба —", title2: "один разговор.", sub: "Укажите моменты рождения обоих. Мы сравним ваши настоящие карты планета за планетой и расскажем, как вы встречаетесь: где всё складывается легко, а где нужна бережность.",
    first: "Первый человек", second: "Второй человек", submit: "Узнать нашу совместимость", errSecond: "Заполните, пожалуйста, данные второго человека." },
  result: { eyebrow: "Совместимость", overall: "Общая гармония", scoresTitle: "Гармония по сферам", scoresIntro: "Проценты показывают, насколько ваши карты естественно поддерживают друг друга в каждой сфере, — но не то, сложатся ли отношения. Это зависит только от вас.",
    contactsEyebrow: "Синастрия", contactsTitle: "Где соприкасаются ваши карты", contactsIntro: "Самые сильные связи между планетами одного и планетами другого.", flow: "гармония", tension: "напряжение", orb: "орбис",
    elementsEyebrow: "Стихии", elementsTitle: "Как сочетаются ваши натуры", numbersEyebrow: "Нумерология", numbersTitle: "Ваши числа вместе", lifePath: "Путь Жизни",
    overlaysEyebrow: "Наложение домов", overlaysTitle: "В домах друг друга", overlaysIntro: "В какие дома карты партнёра попадают ваши планеты — то есть какой сфере жизни другого касается каждый из вас.",
    noTimeNote: "У одного или у обоих неизвестно время рождения, поэтому связи с Асцендентом и наложение домов не показаны.",
    openChart: "Карта: {{name}}", nav: { scores: "Гармония", contacts: "Связи", elements: "Стихии", numbers: "Числа", overlays: "Дома", reading: "✦ Разбор для пары" } },
  locked: { eyebrow: "Только для вас двоих", title: "Разбор для пары",
    intro: "Длинный, тёплый разбор, который сводит ваши карты воедино: что вас притягивает, где вы сталкиваетесь, как каждый из вас любит и привязывается — и чему эти отношения учат вас обоих.",
    sections: ["Что вас соединяет", "Притяжение между вами", "Как любит каждый из вас", "Где вы сталкиваетесь — и почему", "Ваш общий эмоциональный мир", "Как вы говорите и понимаете друг друга", "Что говорят ваши числа", "Ваш общий путь", "Напоследок — вам обоим"],
    cta: "Открыть разбор для пары — 2 ₼" },
  checkout: { title: "Разбор для пары", includes: ["Разбор обеих карт вместе — 9 частей", "3 вопроса о ваших отношениях", "Сохранится по личной ссылке, можно скачать PDF"] },
  reading: { writtenFor: "{{a}} и {{b}}: ваш разбор", chips: ["Над чем нам важнее всего поработать?", "Как нам ссориться бережнее?", "Что нужно каждому из нас, чтобы чувствовать себя любимым?", "Чему нас учат эти отношения?"] },
};

export const COUPLE_UI = { en, az, ru };

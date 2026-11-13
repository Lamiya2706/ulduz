import type { Lang } from "@/i18n";

export type Slug = "about" | "terms" | "privacy" | "refund" | "contact";
type Page = { title: string; body: string[]; draft?: boolean };

// Placeholders in [brackets] must be filled in before launch. Legal pages are drafts — have them reviewed.
const PAGES: Record<Lang, Record<Slug, Page>> = {
  en: {
    about: { title: "How your chart is calculated", body: [
      "## Real astronomy",
      "Ulduz computes the geocentric positions of the Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto for the exact moment of your birth using Astronomy Engine, an open-source library accurate to well within one arc-minute for these purposes. The North Node is the mean lunar node.",
      "## Your local time, correctly",
      "Your birth time is converted to Universal Time with the official IANA time-zone database, including historical daylight-saving rules — for example, Azerbaijan observed summer time until 2016.",
      "## Rising sign and houses",
      "From your birthplace and time we compute local sidereal time and the obliquity of the ecliptic, then the Ascendant and Midheaven. Houses use the whole-sign system, the oldest house system in astrology. Signs are tropical.",
      "## Numerology",
      "We use the Pythagorean system. Azerbaijani letters (ə, ı, ş, ç, ğ, ö, ü) and Cyrillic are converted to their Latin base before counting. Master numbers 11, 22 and 33 are kept.",
      "## The personal reading",
      "The personal reading is written by an AI model (Anthropic's Claude) from your fully calculated chart, with instructions to synthesise rather than list, and never to predict illness, death or specific events.",
      "## An honest note",
      "Astrology and numerology are symbolic languages, not science. Ulduz is a mirror for reflection — please trust your own experience above any chart.",
    ] },
    terms: { draft: true, title: "Terms of use (public offer)", body: [
      "These terms govern the use of Ulduz ([website address]), operated by [legal name], VÖEN [tax number], [address] (“we”).",
      "## The service", "The free natal chart is provided as is. The personal reading is a one-time digital service priced at 1 AZN, delivered immediately after payment as a text written by an AI model and stored at a private link.",
      "## Nature of the content", "Readings are for entertainment and self-reflection. They are not medical, psychological, legal or financial advice, and no outcome is predicted or guaranteed.",
      "## Payment", "Payments are processed by Epoint (licensed by the Central Bank of the Republic of Azerbaijan). We never receive or store your card details.",
      "## Acceptance", "By paying you accept this offer. The contract is concluded when payment is confirmed.",
      "## Contact", "[email] · [phone]",
    ] },
    privacy: { draft: true, title: "Privacy policy", body: [
      "## What we process", "The free chart is calculated in your browser; we do not store it. When you unlock a personal reading we store your name, birth date, time and place, the generated reading, your questions and answers, and — if you give it — your email, so the reading stays available at its private link.",
      "## Why", "Only to provide the reading you bought, to answer support requests and to meet legal obligations. We do not sell data or use it for advertising.",
      "## Processors", "Supabase (database and functions), Anthropic (AI text generation — your chart data is sent to generate the reading), Epoint (payments), and our hosting provider.",
      "## Retention and deletion", "Readings are kept so your link keeps working. Write to [email] and we will delete your data.",
      "## Your rights", "You can request access, correction or deletion of your personal data under the Law of the Republic of Azerbaijan “On Personal Data”.",
    ] },
    refund: { draft: true, title: "Refund policy", body: [
      "The personal reading is a digital service delivered immediately after payment.",
      "If your reading could not be generated, or you were charged twice, write to [email] with your order link within 14 days and we will refund the full amount to your card.",
      "Because the reading is created and delivered instantly, we cannot otherwise refund a completed reading — but if something feels wrong, tell us. We read every message.",
    ] },
    contact: { title: "Contact", body: ["We'd love to hear from you.", "Email: [email]", "Instagram: [@handle]", "For anything about a reading, please include your private reading link."] },
  },
  az: {
    about: { title: "Xəritən necə hesablanır", body: [
      "## Həqiqi astronomiya",
      "Ulduz doğulduğun dəqiq an üçün Günəşin, Ayın, Merkurinin, Veneranın, Marsın, Yupiterin, Saturnun, Uranın, Neptunun və Plutonun geosentrik mövqelərini açıq mənbəli Astronomy Engine kitabxanası ilə hesablayır — bu məqsəd üçün bir qövs dəqiqəsindən də dəqiq. Şimal Düyünü orta Ay düyünüdür.",
      "## Yerli vaxtın — düzgün",
      "Doğum saatın rəsmi IANA saat qurşaqları bazası ilə, tarixi yay vaxtı qaydaları daxil olmaqla, Ümumdünya vaxtına çevrilir — məsələn, Azərbaycan 2016-cı ilə qədər yay vaxtından istifadə edib.",
      "## Yüksələn bürc və evlər",
      "Doğum yerin və saatından yerli ulduz vaxtını və ekliptikanın meylini, sonra Asendenti və Ərşin ortasını hesablayırıq. Evlər astrologiyanın ən qədim sistemi olan bütöv bürc sistemi ilə hesablanır. Bürclər tropikdir.",
      "## Numerologiya",
      "Pifaqor sistemindən istifadə edirik. Azərbaycan hərfləri (ə, ı, ş, ç, ğ, ö, ü) və kiril hərfləri saymazdan əvvəl latın əsasına çevrilir. 11, 22 və 33 ustad rəqəmləri saxlanılır.",
      "## Şəxsi oxunuş",
      "Şəxsi oxunuşu tam hesablanmış xəritən əsasında süni intellekt modeli (Anthropic-in Claude modeli) yazır — sadalamaq yox, birləşdirmək təlimatı ilə, xəstəlik, ölüm və ya konkret hadisələr proqnozlaşdırmadan.",
      "## Dürüst qeyd",
      "Astrologiya və numerologiya elm deyil, simvolik dillərdir. Ulduz özünü düşünmək üçün güzgüdür — öz təcrübənə hər hansı xəritədən çox güvən.",
    ] },
    terms: { draft: true, title: "İstifadə şərtləri (ictimai oferta)", body: [
      "Bu şərtlər [legal ad], VÖEN [vergi nömrəsi], [ünvan] (\"biz\") tərəfindən idarə olunan Ulduz ([sayt ünvanı]) xidmətindən istifadəni tənzimləyir.",
      "## Xidmət", "Pulsuz natal xəritə olduğu kimi təqdim olunur. Şəxsi oxunuş 1 AZN dəyərində birdəfəlik rəqəmsal xidmətdir; ödənişdən dərhal sonra süni intellekt modelinin yazdığı mətn kimi təqdim olunur və şəxsi linkdə saxlanılır.",
      "## Məzmunun xarakteri", "Oxunuşlar əyləncə və özünü dərk etmək üçündür. Onlar tibbi, psixoloji, hüquqi və ya maliyyə məsləhəti deyil və heç bir nəticə proqnozlaşdırılmır və ya zəmanət verilmir.",
      "## Ödəniş", "Ödənişlər Azərbaycan Respublikası Mərkəzi Bankı tərəfindən lisenziyalaşdırılmış Epoint vasitəsilə həyata keçirilir. Kart məlumatlarını heç vaxt almırıq və saxlamırıq.",
      "## Qəbul", "Ödəniş etməklə bu ofertanı qəbul edirsən. Müqavilə ödəniş təsdiqləndiyi anda bağlanmış sayılır.",
      "## Əlaqə", "[e-poçt] · [telefon]",
    ] },
    privacy: { draft: true, title: "Məxfilik siyasəti", body: [
      "## Nəyi emal edirik", "Pulsuz xəritə brauzerində hesablanır, biz onu saxlamırıq. Şəxsi oxunuşu açanda adını, doğum tarixini, saatını və yerini, yaradılmış oxunuşu, suallarını və cavabları, həmçinin — versən — e-poçtunu saxlayırıq ki, oxunuş şəxsi linkdə əlçatan qalsın.",
      "## Nə üçün", "Yalnız aldığın oxunuşu təqdim etmək, dəstək sorğularına cavab vermək və qanuni öhdəlikləri yerinə yetirmək üçün. Məlumatları satmırıq və reklam üçün istifadə etmirik.",
      "## Emalçılar", "Supabase (verilənlər bazası və funksiyalar), Anthropic (süni intellektlə mətn yaradılması — oxunuşu yaratmaq üçün xəritə məlumatların göndərilir), Epoint (ödənişlər) və hostinq provayderimiz.",
      "## Saxlama və silmə", "Oxunuşlar linkin işləməyə davam etməsi üçün saxlanılır. [e-poçt] ünvanına yaz, məlumatlarını silək.",
      "## Hüquqların", "\"Fərdi məlumatlar haqqında\" Azərbaycan Respublikası Qanununa əsasən fərdi məlumatlarına çıxış, onların düzəldilməsi və ya silinməsini tələb edə bilərsən.",
    ] },
    refund: { draft: true, title: "Geri qaytarma qaydaları", body: [
      "Şəxsi oxunuş ödənişdən dərhal sonra təqdim olunan rəqəmsal xidmətdir.",
      "Oxunuşun yaradıla bilməyibsə və ya səndən iki dəfə ödəniş tutulubsa, 14 gün ərzində sifariş linki ilə [e-poçt] ünvanına yaz — məbləği tam olaraq kartına qaytaracağıq.",
      "Oxunuş dərhal yaradılıb təqdim olunduğu üçün tamamlanmış oxunuşun dəyərini başqa hallarda qaytara bilmirik — amma nəsə düz görünmürsə, bizə yaz. Hər mesajı oxuyuruq.",
    ] },
    contact: { title: "Əlaqə", body: ["Səndən eşitmək bizə xoş olar.", "E-poçt: [e-poçt]", "Instagram: [@hesab]", "Oxunuşla bağlı müraciətdə şəxsi oxunuş linkini də əlavə et."] },
  },
  ru: {
    about: { title: "Как рассчитывается твоя карта", body: [
      "## Настоящая астрономия",
      "Ulduz вычисляет геоцентрические положения Солнца, Луны, Меркурия, Венеры, Марса, Юпитера, Сатурна, Урана, Нептуна и Плутона на точный момент твоего рождения с помощью открытой библиотеки Astronomy Engine — с точностью лучше угловой минуты. Северный узел — средний лунный узел.",
      "## Твоё местное время — правильно",
      "Время рождения переводится во всемирное время по официальной базе часовых поясов IANA с учётом исторических правил летнего времени — например, в Азербайджане летнее время действовало до 2016 года.",
      "## Асцендент и дома",
      "По месту и времени рождения мы вычисляем местное звёздное время и наклон эклиптики, а затем Асцендент и Середину неба. Дома считаются по системе целых знаков — старейшей системе домов в астрологии. Знаки тропические.",
      "## Нумерология",
      "Мы используем пифагорейскую систему. Азербайджанские буквы (ə, ı, ş, ç, ğ, ö, ü) и кириллица переводятся в латинскую основу перед подсчётом. Мастер-числа 11, 22 и 33 сохраняются.",
      "## Личный разбор",
      "Личный разбор пишет модель ИИ (Claude от Anthropic) по твоей полностью рассчитанной карте — с указанием соединять, а не перечислять, и никогда не предсказывать болезни, смерть или конкретные события.",
      "## Честно",
      "Астрология и нумерология — символические языки, а не наука. Ulduz — зеркало для размышлений; доверяй своему опыту больше, чем любой карте.",
    ] },
    terms: { draft: true, title: "Условия использования (публичная оферта)", body: [
      "Эти условия регулируют использование сервиса Ulduz ([адрес сайта]), которым управляет [юр. наименование], VÖEN [ИНН], [адрес] («мы»).",
      "## Сервис", "Бесплатная натальная карта предоставляется «как есть». Личный разбор — разовая цифровая услуга стоимостью 1 AZN, предоставляемая сразу после оплаты в виде текста, написанного моделью ИИ, и сохраняемая по личной ссылке.",
      "## Характер контента", "Разборы предназначены для развлечения и самопознания. Они не являются медицинской, психологической, юридической или финансовой консультацией; никакие результаты не прогнозируются и не гарантируются.",
      "## Оплата", "Платежи обрабатывает Epoint (лицензия Центрального банка Азербайджанской Республики). Мы никогда не получаем и не храним данные карты.",
      "## Акцепт", "Оплачивая, ты принимаешь эту оферту. Договор считается заключённым с момента подтверждения оплаты.",
      "## Контакты", "[email] · [телефон]",
    ] },
    privacy: { draft: true, title: "Политика конфиденциальности", body: [
      "## Что мы обрабатываем", "Бесплатная карта рассчитывается в браузере; мы её не храним. Когда ты открываешь личный разбор, мы сохраняем имя, дату, время и место рождения, созданный разбор, вопросы и ответы и — если ты его укажешь — email, чтобы разбор оставался доступен по личной ссылке.",
      "## Зачем", "Только чтобы предоставить купленный разбор, отвечать на обращения и выполнять требования закона. Мы не продаём данные и не используем их для рекламы.",
      "## Обработчики", "Supabase (база данных и функции), Anthropic (генерация текста ИИ — данные карты отправляются для создания разбора), Epoint (платежи) и наш хостинг-провайдер.",
      "## Хранение и удаление", "Разборы хранятся, чтобы ссылка продолжала работать. Напиши на [email], и мы удалим твои данные.",
      "## Твои права", "Ты можешь запросить доступ, исправление или удаление своих персональных данных согласно Закону Азербайджанской Республики «О персональных данных».",
    ] },
    refund: { draft: true, title: "Правила возврата", body: [
      "Личный разбор — цифровая услуга, предоставляемая сразу после оплаты.",
      "Если разбор не удалось создать или деньги списались дважды, напиши на [email] со ссылкой на заказ в течение 14 дней — мы вернём полную сумму на карту.",
      "Так как разбор создаётся и предоставляется мгновенно, в остальных случаях мы не можем вернуть оплату за готовый разбор — но если что-то не так, напиши нам. Мы читаем каждое сообщение.",
    ] },
    contact: { title: "Контакты", body: ["Будем рады услышать тебя.", "Email: [email]", "Instagram: [@аккаунт]", "По вопросам о разборе, пожалуйста, приложи личную ссылку на него."] },
  },
};
export const getPage = (lang: Lang, slug: string): Page | null => (slug in PAGES[lang] ? PAGES[lang][slug as Slug] : null);

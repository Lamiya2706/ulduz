import type { YearContent } from "./types";

const az: YearContent = {
  ui: {
    eyebrow: "Ulduz · illik proqnoz", title1: "Bu il sənin üçün", title2: "nə haqqında olacaq?",
    sub: "Numerologiyaya görə şəxsi ilin, hər ayın mövzusu, böyük planetlərin Günəşinə təsiri və səmanın əsas hadisələri — retroqrad dövrlər və tutulmalar.",
    date: "Doğum tarixi", submit: "İlimi göstər", hint: "Yalnız doğum tarixi lazımdır.",
    resultTitle: (y) => `Sənin ${y}-ci ilin`, age: (n) => `${n} yaşın tamam olduğu il`,
    nav: { year: "İlin mövzusu", months: "Aylar üzrə", transits: "Planetlər və sən", sky: "Səma təqvimi" },
    personalYear: "Şəxsi il", loveL: "Sevgi", workL: "İş və pul", adviceL: "İl üçün məsləhət",
    monthsTitle: "Ay-ay", monthsIntro: "Hər ayın öz rəqəmi və il daxilində öz vəzifəsi var.", nowBadge: "indi",
    transitsTitle: "Böyük planetlər və sənin Günəşin", transitsIntro: (s) => `Günəşin ${s} bürcündədir. Bu il yavaş planetlər ona belə toxunur — bunlar ilin əsas fon mövzularıdır.`,
    noTransits: "Bu il yavaş planetlər Günəşinə dəqiq aspekt qurmur — tempi özün müəyyən etdiyin daha sakit bir il.",
    period: (f, t) => (f === t ? f : `${f} – ${t}`),
    skyTitle: "İlin səma təqvimi", skyIntro: "Bu hadisələr hamı üçün eynidir — planlaşdırarkən nəzərə almaq faydalıdır.",
    retroTitle: "Retroqrad dövrlər", eclipsesTitle: "Tutulmalar", ingressTitle: "Yupiter və Saturn bürc dəyişir",
    solar: (s) => `Günəş tutulması · ${s}`, lunar: (s) => `Ay tutulması · ${s}`,
    eclipseNote: "Günəş tutulmaları yeni fəsillər açır, Ay tutulmaları köhnələri bağlayır. Bu tarixlərə yaxın tələsik qərar verməmək yaxşıdır.",
    enters: (p, s) => `${p} ${s} bürcünə keçir`, noEclipses: "Bu il böyük tutulma yoxdur.",
    another: "Başqa tarix", copy: "Linki kopyala", copied: "Link kopyalandı ✦", toChart: "Natal xəritəmi qur", disclaimer: "Astrologiya və numerologiya elm yox, simvolik dillərdir. Proqnozu öncəgörmə kimi yox, düşünmək üçün bir fürsət kimi qəbul et.",
  },
  years: {
    1: { title: "Başlanğıclar ili", theme: "Yeni doqquzillik dövr başlayır. İndi başladığın iş illər boyu istiqamətini müəyyən edir, ona görə cəsarətlə və düşünərək seç.", love: "Yeni tanışlıqlar və ya mövcud münasibətdə yeni başlanğıc; nə istədiyini açıq de.", work: "Yeni iş, layihə və ya öz biznesin üçün yaxşı vaxtdır. Təşəbbüs öz bəhrəsini verir.", advice: "İdeal anı gözləmə — başla." },
    2: { title: "Səbir və tərəfdaşlıq ili", theme: "Temp yavaşlayır. Keçən il əkdiklərin səssizcə böyüyür; əsas şeylər insanlar və əməkdaşlıq vasitəsilə baş verir.", love: "Münasibətlər üçün güclü il: yaxınlıq, etibar, vacib söhbətlər.", work: "Nəticə təzyiqlə yox, komanda işi və diplomatiya ilə gəlir. Xırdalıqlar vacibdir.", advice: "Səbirli ol və hadisələri tələsdirmə." },
    3: { title: "Sevinc və özünüifadə ili", theme: "Yüngül, ünsiyyətli il. Yaradıcılıq, dostlar, səfərlər və öz səsin ön plana çıxır.", love: "Flirt, romantika və əyləncə; münasibətə yüngüllük qaytarmaq üçün yaxşı vaxtdır.", work: "Uğuru ideyalar, çıxışlar, yaradıcı layihələr və tanışlıqlar gətirir. Xərclərinə diqqət et.", advice: "Özünü göstər — və başladığını sona çatdır." },
    4: { title: "Zəhmət və təməl ili", theme: "Qurmaq ilidir: nizam, intizam, sağlamlıq və sabitlik. Parıltı az olsa da, nəticə illərlə qalır.", love: "Münasibətlər ciddiləşir; birgə planlar və etibar vaxtıdır.", work: "Çox sabit, inadlı iş. Daşınmaz əmlak, yığım və peşə öyrənmək üçün yaxşıdır.", advice: "Addım-addım qur və bədəninə qayğı göstər." },
    5: { title: "Dəyişiklik və azadlıq ili", theme: "Dövrün ən dinamik ili: köçlər, səfərlər, gözlənilməz dönüşlər və yeni imkanlar.", love: "Parlaq görüşlər və azadlıq ehtiyacı; uzun münasibətlərə təzə hava lazımdır.", work: "İşi, sahəni və ya formatı dəyişmək mümkündür. Çeviklik və ağıllı risk lazımdır.", advice: "Dəyişikliyə \"hə\" de, amma dağılma." },
    6: { title: "Sevgi və məsuliyyət ili", theme: "Mərkəzdə ev, ailə və yaxınlar dayanır. Belə illərdə çoxlu vacib şəxsi qərarlar verilir.", love: "Toy, birgə həyat, uşaq ili — və ya münasibət haqqında dürüst qərarlar.", work: "Daha çox məsuliyyət və etibar; insanlarla iş və gözəllik sahəsi üçün yaxşıdır.", advice: "Özünü unutmadan başqalarına qayğı göstər." },
    7: { title: "Düşüncə ili", theme: "Daxili iş üçün sakit il: təhsil, istirahət, sağlamlıq və \"əslində nə istəyirəm\" sualı.", love: "Dərinlik və sükut istəyirsən; münasibətlər səmimiyyətlə sınanır.", work: "Kəskin sıçrayışlar ili deyil. Ən yaxşısı təhsil, araşdırma və ixtisasını artırmaqdır.", advice: "Yavaşla və özünü dinlə." },
    8: { title: "Güc və məhsul ili", theme: "Nəticələr ili: karyera, pul, status. Qurduqların bəhrə verməyə başlayır.", love: "Güclü tərəf-müqabillər və ciddi qərarlar; işin şəxsi həyatını udmasına imkan vermə.", work: "Vəzifə artımı, böyük sövdələşmələr, gəlirin artması. İnamla hərəkət et və böyük düşün.", advice: "Haqq etdiyini götür — və ədalətli ol." },
    9: { title: "Tamamlanma ili", theme: "Dövr bitir. Tamamlamaq, bağışlamaq və ömrünü başa vurmuşu buraxmaq vaxtıdır — yeniyə yer açmaq üçün.", love: "Bəzi hekayələr bitir, bəziləri yeni səviyyəyə keçir. Ən vacibi dürüstlükdür.", work: "Layihələri bitir, yarımçıq işləri bağla; böyük yeni işə gələn il başlamaq daha yaxşıdır.", advice: "Yüngülcə burax — yeni dövr artıq yaxındır." },
  },
  transits: {
    Jupiter: { conjunction: "Yupiter Günəşinlə birləşir — bu, on iki ildə bir dəfə olur. İnkişaf, uğur və yeni imkanlar ili: daha yüksəyi hədəflə.", soft: "Yupiter Günəşini dəstəkləyir: hər şey daha asan alınır, lazımlı insanlar və fürsətlər yaranır. Onlardan istifadə et.", hard: "Yupiter Günəşini irəli itələyir: böyük iddialar və həddindən çox iş götürmək vəsvəsəsi. Böyü, amma gücünü ölç." },
    Saturn: { conjunction: "Saturn Günəşinlə birləşir — ciddi, həlledici dövr. Daha çox məsuliyyət və yetkinlik sınağı; indi qurduğun uzun müddət qalacaq.", soft: "Saturn Günəşini dəstəkləyir: intizam təbii gəlir, sabit zəhmət möhkəm nəticə verir.", hard: "Saturn Günəşini sınayır: maneələr, yorğunluq və əlavə vəzifələr. Yavaş get, artığı at və sağlamlığını qoru." },
    Uranus: { conjunction: "Uran Günəşinlə birləşir — bu, ömürdə bir dəfə olur. Oyanış vaxtı: qəfil dəyişikliklər və güclü azadlıq istəyi.", soft: "Uran Günəşini təzələyir: xoş dəyişikliklər, yeni ideyalar və öz bildiyin kimi yaşamaq cəsarəti.", hard: "Uran Günəşini silkələyir: gözlənilməz dönüşlər və daxili narahatlıq. Çevik qal və emosiya ilə körpüləri yandırma." },
    Neptune: { conjunction: "Neptun Günəşinlə birləşir — ilham və həssaslıq vaxtı, amma sərhədlər də bulanır. Reallıqdan qopma.", soft: "Neptun Günəşinə ilham verir: sezgi, yaradıcılıq və mərhəmət artır.", hard: "Neptun Günəşini dumanlandırır: çaşqınlıq və illüziyalar mümkündür. Faktları yoxla və insanları ideallaşdırma." },
    Pluto: { conjunction: "Pluton Günəşinlə birləşir — dərin və nadir dəyişim. Köhnə \"mən\" gedir, daha güclüsü gəlir.", soft: "Pluton Günəşini gücləndirir: daxili güc və həyatını yaxşılığa doğru dəyişmək bacarığı.", hard: "Pluton Günəşinə təzyiq edir: nüfuz uğrunda mübarizə və dərin dəyişikliklər. Artıq işləməyən yerdə nəzarəti burax." },
  },
  retroNotes: {
    Mercury: "Sənədləri, biletləri və mesajları iki dəfə yoxla; vacib müqavilələri imzalamamaq yaxşıdır.",
    Venus: "Toy, böyük alış-veriş və görünüşü kəskin dəyişmək üçün ən yaxşı vaxt deyil; köhnə hisslər qayıda bilər.",
    Mars: "Enerji azdır: köhnə işləri bitir, münaqişədən və böyük yeni başlanğıclardan çəkin.",
  },
  ingressNotes: { Jupiter: "Hamı üçün uğur və inkişaf sahəsi dəyişir.", Saturn: "Hamı üçün dərs və məsuliyyət sahəsi dəyişir." },
};
export default az;

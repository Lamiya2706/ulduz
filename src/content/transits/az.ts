import type { TransitContent } from "./types";

const az: TransitContent = {
  ui: {
    title: "Tranzit xəbərdarlıqları", intro: "Yupiterdən Plutona qədər yavaş planetlər həyatının böyük mövzularını müəyyən edir. Bu il onların doğum xəritənə toxunduğu vaxtlar bunlardır.",
    now: "İndi", soon: "Yaxında", none: "Gələn il heç bir yavaş planet xəritənə dəqiq toxunmur. Tempi özünün təyin etdiyin daha sakit dövrdür.",
    period: (f, t) => (f === t ? f : `${f} – ${t}`), exact: (d) => `Dəqiq: ${d}`, touches: "Toxunur",
    showAll: (n) => `Hamısını göstər (${n})`, showLess: "Daha az göstər",
    noTimeNote: "Doğum vaxtı olmadan Ay, Assendent və Göyün ortası nəzərə alınmır. Onları da görmək üçün doğum vaxtını əlavə et.",
    accountTitle: "Sənin tranzitlərin", accountActive: (n) => `İndi ${n} tranzit aktivdir`,
    accountNone: "Hazırda böyük tranzit yoxdur. Bu il nələrin gəldiyinə bax.", accountOpen: "Tranzitlərinə bax",
  },
  points: {
    Sun: "mənliyin və həyat enerjin", Moon: "hisslərin, evin və daxili ehtiyacların", Mercury: "ağlın, sözlərin və planların",
    Venus: "sevgi, gözəllik və pul", Mars: "iradən, cəsarətin və enerjin", Asc: "necə görünməyin və bədənin",
    MC: "karyeran, nüfuzun və həyat istiqamətin",
  },
  planets: {
    Jupiter: {
      conjunction: "Yupiter burada inkişaf və bəxt gətirir. Qapılar açılır: daha yüksəyə hədəflən və yaxşı təkliflərə «hə» de.",
      soft: "Yupiter səssizcə kömək edir: işlər asanlaşır, köməkçi insanlar və imkanlar çıxır. Onlardan istifadə et.",
      hard: "Yupiter hər şeyi böyüdür: böyük ümidlər və həddi aşmaq istəyi. İnkişaf et, amma gücünü və büdcəni ölç.",
    },
    Saturn: {
      conjunction: "Saturn burada yetkinlik istəyir: daha çox məsuliyyət, aydın sərhədlər və illərlə qalan səbirli iş.",
      soft: "Saturn struktur verir: nizam-intizam təbii gəlir, ardıcıl əmək möhkəm nəticə verir.",
      hard: "Saturn bu sahəni sınayır: gecikmələr, yorğunluq və əlavə vəzifələr. Yavaşla, lazımsızı burax və dincəl.",
    },
    Uranus: {
      conjunction: "Uran bu sahəni oyadır: qəfil dəyişikliklər, azadlıq və öz yolunla yaşamaq ehtiyacı.",
      soft: "Uran təzələyir: xoş sürprizlər, yeni ideyalar və fərqli bir şey sınamağa cəsarət.",
      hard: "Uran silkələyir: gözlənilməz dönüşlər və narahatlıq. Çevik ol, bir anlıq hisslə körpüləri yandırma.",
    },
    Neptune: {
      conjunction: "Neptun burada kəskinlikləri yumşaldır: ilham və həssaslıq artır, amma sərhədlər bulanıqlaşır. Ayağın yerdə olsun.",
      soft: "Neptun ilham verir: intuisiya, yaradıcılıq və mərhəmət asan gəlir.",
      hard: "Neptun duman gətirir: çaşqınlıq və illüziyalar mümkündür. Faktları yoxla, insanları ideallaşdırma.",
    },
    Pluto: {
      conjunction: "Pluton bu sahəni dərindən dəyişir. Köhnə bir şey bitir ki, daha güclüsü yaransın.",
      soft: "Pluton güc verir: daxili qüvvə və həyatını yaxşılığa doğru dəyişmək bacarığı.",
      hard: "Pluton güclü təzyiq edir: hakimiyyət uğrunda mübarizə və dərin dəyişiklik. Artıq işləməyən yerdə nəzarəti burax.",
    },
  },
};
export default az;

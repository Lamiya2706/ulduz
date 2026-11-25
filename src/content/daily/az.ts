import type { DailyContent } from "./types";

const az: DailyContent = {
  ui: {
    eyebrow: "Gündəlik ulduz falın", title: "Ulduzlarda sənin günün", titleFor: (n) => `${n}, ulduzlarda sənin günün`,
    intro: "Bütün bürc üçün yazılmış ümumi fal deyil: bu günün planetləri sənin öz doğum xəritənin üzərində. Hər gün dəyişir.",
    today: "Bu gün", tomorrow: "Sabah",
    overallTitle: "Günün ab-havası",
    overall: [
      "Çətin gün. Tələsmə, planları sadə saxla və özünə qarşı mülayim ol.",
      "Diqqət tələb edən gün. Hər şeyi yoxla və müqavimət göstərəni zorlama.",
      "Sabit gün. Ardıcıl iş və kiçik addımlar yaxşı alınır.",
      "Yaxşı gün. Səma sənin tərəfindədir, onu sənin üçün vacib olan işə yönəlt.",
      "Parlaq gün. Qapılar asan açılır: «hə» de, başla və insanlara yaxınlaş.",
    ],
    moonTitle: (h, s) => `Ay sənin ${h} evindədir, ${s}`, tipTitle: "Günün məsləhəti",
    transitsTitle: "Xəritənə nə toxunur", transitsIntro: "Bu günün planetləri sənin doğum xəritənin planetləri ilə bu əlaqələri qurur.",
    noTransits: "Bu gün planetlər xəritənə dəqiq toxunmur. Sakit, sərbəst gün: onu istədiyin kimi keçir.", touches: "Toxunur",
    spheresTitle: "Sahələr üzrə sənin proqnozun",
    sunHouses: "Doğum vaxtı olmadan evlər Günəş bürcündən sayılır. Daha dəqiq gün üçün doğum vaxtını və yerini əlavə et.",
    formTitle: "Şəxsi gününə bax", formText: "Doğum məlumatlarını bir dəfə yaz. Vaxt və yer proqnozu daha dəqiq edir.", formBtn: "Günümü göstər",
    signInTitle: "Hər səhər öz gününü al", signInText: "Pulsuz hesab yarat, şəxsi falın heç bir forma olmadan dərhal açılacaq.", signInBtn: "Hesab yarat",
    saveTitle: "Doğum məlumatlarını əlavə et", saveText: "Doğum anını hesabında saxla, gündəlik falın hər gün burada səni gözləyəcək.", saveBtn: "Məlumatlarımı əlavə et",
    change: "Məlumatları dəyiş", openChart: "Natal xəritəmi aç", asc: "Assendent",
    disclaimer: "Sənin saat qurşağın üçün planetlərin real mövqelərinə görə hesablanıb. Astrologiya simvollar dilidir: günü qayda kimi yox, yumşaq bələdçi kimi qəbul et.",
    teaser: "Doğum xəritənə əsaslanan bu günkü şəxsi falın",
  },
  houses: [
    { focus: "Diqqət mərkəzindəsən. Bədənin, görünüşün və necə təsir bağışladığın diqqət istəyir.", tip: "Yalnız özün üçün bir şey et: gəzinti, yeni geyim, erkən yuxu." },
    { focus: "Pul, rahatlıq və sənin üçün dəyərli olanlar ön plana çıxır.", tip: "Büdcəni yoxla və ya ani istəklə yox, lazımlı bir şey al." },
    { focus: "Söhbətlər, mesajlar, qısa səfərlər və öyrənmək günü doldurur.", tip: "Çoxdan təxirə saldığın mesajı yaz." },
    { focus: "Ev, ailə və daxili təhlükəsizlik hissi əsas mövzudur.", tip: "İsti bir yemək bişir, ailənə zəng et və ya evin bir küncünü səliqəyə sal." },
    { focus: "Sevinc, romantika və yaradıcılıq bu gün yer istəyir.", tip: "Oyuna vaxt ayır: görüş, hobbi, səni gülümsədən bir şey." },
    { focus: "Gündəlik iş, sağlamlıq və vərdişlər diqqət mərkəzindədir.", tip: "Siyahında çoxdan qalan bir işi bitir və daha çox su iç." },
    { focus: "Tərəfdaşlar və təkbətək münasibətlər ön plana çıxır.", tip: "Danışmaqdan çox dinlə və qarşı tərəfə bir addım at." },
    { focus: "Dərin hisslər, yaxınlıq və ortaq pul mövzuları üzə çıxır.", tip: "Səmimi söhbəti et və ya artıq böyüdüyün bir şeyi burax." },
    { focus: "Üfüqün genişlənir: səyahət, təhsil və böyük ideyalar çağırır.", tip: "Oxu, səfər planla və ya yarım saat da olsa yeni bir şey öyrən." },
    { focus: "Karyera, məqsədlər və nüfuzun göz önündədir.", tip: "Məqsədinə doğru görünən bir addım at, qoy işini görsünlər." },
    { focus: "Dostlar, həmfikirlər və gələcək arzular əsas mövzudur.", tip: "Bir dostuna yaz və ya önəm verdiyin bir işdə başqalarına qoşul." },
    { focus: "Dincəlmək, xəyallar və şəfa üçün sakit, içə dönük gün.", tip: "Yavaşla, yaxşı yat və böyük başlanğıcları sonraya saxla." },
  ],
  points: {
    Sun: "mənliyin və həyat enerjin", Moon: "hisslərin və daxili ehtiyacların", Mercury: "ağlın, sözlərin və planların",
    Venus: "sevgi, zövq və dəyər verdiklərin", Mars: "iradən, cəsarətin və enerjin", Jupiter: "bəxtin, inkişafın və inamın",
    Saturn: "vəzifələrin, sərhədlərin və uzunmüddətli məqsədlərin", Asc: "necə görünməyin və bədənin",
  },
  bodies: {
    Moon: {
      soft: "Hisslər rahat axır. İnsanlara yaxın olmaq və duyğularına güvənmək üçün yaxşı an.",
      hard: "Emosiyalar səndən qabağa qaça bilər. Reaksiya verməzdən əvvəl dayan, xırda şeyləri ürəyinə salma.",
      conj: "Əhvalın bu gün güclü və göz önündədir. Əslində nəyə ehtiyacın olduğunu hiss et.",
    },
    Sun: {
      soft: "Özünəinam və enerji sənin tərəfindədir. Özünü göstər və öndə ol.",
      hard: "İradən müqavimətlə qarşılaşır. Döyüşlərini seç və həddən artıq təzyiq etmə.",
      conj: "Şəxsi parlaq an: səni görürlər. Sənin üçün vacib olan bir işə başla.",
    },
    Mercury: {
      soft: "Sözlər asan gəlir. Söhbət, razılaşma, yazı və təhsil üçün yaxşıdır.",
      hard: "Anlaşılmazlıq ehtimalı var. Mesajları yenidən oxu, razılaşmazdan əvvəl aydınlaşdır.",
      conj: "Ağlın məşğul və itidir. Siyahı və planlar qur, düşündüyünü de.",
    },
    Venus: {
      soft: "Cazibə və istilik təbii gəlir. Sevgi, gözəllik və barışıq üçün yaxşıdır.",
      hard: "İstəklərlə reallıq üst-üstə düşməyə bilər. Artıq xərcləmə və başqalarından çox şey gözləmə.",
      conj: "Şirin, cazibədar gün. Özünü əzizlə və başqalarının yanında olmaqdan zövq al.",
    },
    Mars: {
      soft: "Güclü, faydalı enerji. İdman, çətin işlər və təşəbbüs üçün yaxşıdır.",
      hard: "Əsəbilik və tələskənlik yaxındır. Çox hərəkət et, mübahisə və riskdən çəkin.",
      conj: "Enerji dalğası. Onu münaqişəyə yox, işə yönəlt.",
    },
  },
};
export default az;

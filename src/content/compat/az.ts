import type { CompatContent } from "./types";

// Neytral ifadələr: "biriniz … digəriniz …" — kimin kim olduğunu göstərmədən.
const az: CompatContent = {
  ascendant: "Asendent",
  pairs: {
    "Moon-Moon": ["Emosional ritminiz üst-üstə düşür: bir-birinizə demək olar ki, sözsüz təsəlli verirsiniz, \"ev\" deyəndə ikiniz də eyni şeyi nəzərdə tutursunuz.", "Özünüzü təhlükəsiz hiss etmək üçün sizə fərqli şeylər lazımdır: biriniz yaxınlıq istəyəndə digəriniz məkan istəyir. Bunu ucadan danışsanız, fərq anlaşmaya çevrilər."],
    "Sun-Moon": ["Ürəklərin klassik birliyi: biriniz işıq saçır, digəriniz bu işıqda özünü isti və rahat hiss edir. Bu, cütlükdə uzunmüddətli rahatlığın ən etibarlı əlamətlərindən biridir.", "Birinizin can atdığı ilə digərinizin ehtiyac duyduğu şey fərqli tərəflərə çəkir. Bu gərginlik cəzb edir — və səbir tələb edir."],
    "Moon-Venus": ["Aranızda zəriflik asanlıqla axır: birinizə digərinin sevmə tərzi qayğı hiss etmək üçün kifayət edir.", "Nəvazişlə emosional ehtiyaclar həmişə eyni dildə danışmır: biriniz şirin söz deyəndə digərinizə o an arxayınlıq lazım olur."],
    "Venus-Mars": ["Güclü, təbii cazibə: istək və nəvaziş bir-birini tapır. Buradakı qığılcım həqiqidir və adətən illərlə sönmür.", "Qığılcımlı kimya — ehtiras, zarafatlaşma, bəzən toqquşma. Ehtiyatlı və incə davransanız, çox həyəcanlıdır."],
    "Sun-Venus": ["Biriniz digərinə səmimi heyrandır: aranızda hərarət, təqdir və olduğun kimi dəyərləndirilmək hissi var.", "Heyranlıq var, amma zövqlər və dəyərlər bəzən ayrılır: birinizə cazibədar gələn şey digərinizə həddindən artıq görünə bilər."],
    "Venus-Venus": ["Oxşar tərzdə sevirsiniz və eyni şeylərdən zövq alırsınız — ortaq gözəllik, ortaq zövq, asan nəvaziş.", "Sevgi dilləriniz fərqlidir: biriniz hisslərini bir cür ifadə edir, digəriniz başqa cür gözləyir. Bir-birinizin \"ləhcəsini\" öyrənmək — ortaq işinizdir."],
    "Mars-Mars": ["Enerjiləriniz eyni ritmdə hərəkət edir — görüləsi, qurulası və ya müdafiə ediləsi bir iş olanda əla komandasınız.", "İki güclü iradə: rəqabət və tez özündən çıxmaq mümkündür. Bu gücü bir-birinizə qarşı yox, ortaq məqsədlərə yönəldin."],
    "Sun-Mars": ["Biriniz digərinə enerji verir — birlikdə işləri tez hərəkətə gətirirsiniz, aranızda sağlam fiziki cazibə də var.", "Birinizə elə gələ bilər ki, digəri həddindən artıq təzyiq edir; qığılcımlar hər iki mənada uçur. Bir-birinizin tempinə hörmət edin."],
    "Moon-Mars": ["Ehtiras və hisslər burada qoruyucu şəkildə görüşür: biriniz digərinə arxa durmağa həmişə hazırdır.", "Birinizin birbaşalığı digərini incidə və ya tələsdirə bilər. Burada sürətdən çox yumşaqlıq vacibdir."],
    "Mercury-Mercury": ["Oxşar düşünürsünüz və asan danışırsınız — söhbətlər bu bağın ən böyük sevinclərindən birinə çevrilir.", "Fərqli düşünürsünüz, ona görə anlaşılmazlıqlar asan yaranır. Bir az yavaşlayıb \"nə demək istəyirsən?\" deyə soruşmaq möcüzə yaradır."],
    "Moon-Mercury": ["Biriniz digərinin hiss etdiyini sözə çevirməyi bacarır — danışaraq bir-birinizin əhvalını anlayırsınız.", "Sözlər və hisslər bir-birini qaçıra bilər: biriniz təhlil etməyə başlayanda digərinizə sadəcə dinlənilmək lazım olur."],
    "Sun-Mercury": ["Biriniz digərini həqiqətən eşidir — ideyalar və planlar aranızda asanlıqla axır.", "Fikirlər toqquşa bilər: birinizə elə gələ bilər ki, digəri sözünü kəsir və ya dediklərinə şübhə ilə yanaşır."],
    "Mercury-Venus": ["İsti, yüngül ünsiyyət — iltifatlar, zarafat və şirin sözlər öz-özünə gəlir.", "Sevgi barədə fərqli danışırsınız, kiçik sözlər bəzən istədiyinizdən daha çox yaralaya bilər."],
    "Mercury-Mars": ["Canlı, ruhlandırıcı mübahisələr — bir-birinizin düşüncəsini itiləyirsiniz.", "Mübahisələr tez qızışa bilər. \"Dayan, bir az ara verək\" mənasını verən bir söz barədə əvvəlcədən razılaşın."],
    "Sun-Saturn": ["Möhkəmləndirən bağ: biriniz digərinin həyatına dayaq və sədaqət gətirir. Bu, çox vaxt ciddi və uzunmüddətli münasibətin əlamətidir.", "Birinizə elə gələ bilər ki, digəri onu qiymətləndirir və ya saxlayır. Amma məhz belə münasibətlər çox vaxt hər ikinizə yetkinlik öyrədir."],
    "Moon-Saturn": ["Sakit emosional sədaqət — biriniz digərinə etibar və dayaq hissi verir.", "Birinizə elə gələ bilər ki, digəri hisslərində soyuq və ya həddindən artıq tənqidçidir. Ucadan deyilən isti söz çox şeyi əridir."],
    "Venus-Saturn": ["Möhkəm sevgi: öhdəlik, sədaqət və birlikdə həqiqi bir şey qurmaq istəyi.", "Nəvaziş təmkinli və ya sanki sınaqdan keçən kimi görünə bilər — amma bu aspektlə yaranan bağlar çox vaxt ən uzunömürlü olur."],
    "Mercury-Saturn": ["Ciddi, ayağı yerə basan söhbətlər — bir-birinizə hər şeyi götür-qoy etməyə və ağılla planlaşdırmağa kömək edirsiniz.", "Birinizə elə gələ bilər ki, digəri onun fikirlərini ciddiyə almır. Burada səbir və başqasının düşünmə tərzinə hörmət vacibdir."],
    "Mars-Saturn": ["İntizam qətiyyətlə görüşür — birlikdə böyük məqsədlərə inadla irəliləyə bilərsiniz.", "Birinizə elə gələ bilər ki, digəri onu ləngidir və ya nəzarətdə saxlayır. Kimin nəyə cavabdeh olduğunu razılaşdırın."],
    "Sun-Jupiter": ["Səxavət və nikbinlik: bir-birinizin yanında özünüzü daha böyük, daha şanslı və arzularınızda daha cəsarətli hiss edirsiniz.", "Dəstək ifrata keçə bilər — birlikdə həddindən artıq söz vermək və ya xərcləmək. Bir ayağınız yerdə qalsın."],
    "Moon-Jupiter": ["Səxavətli emosional dəstək — biriniz digərinin əhvalını asanlıqla qaldırır.", "Təsəlli güzəştə çevrilə bilər: problemləri danışmaqdansa, üstündən keçmək daha asan gəlir."],
    "Venus-Jupiter": ["Sevinc, nəvaziş və xoş günlər asan gəlir — bu aspekt sevgiyə uğur və hərarət gətirir.", "Çoxlu şirinlik var, amma xoş ab-havanı qorumaq üçün çətin söhbətlərdən yan keçə bilərsiniz."],
    "Mercury-Jupiter": ["Bir-birinizin dünyagörüşünü genişləndirirsiniz — birlikdə səyahət etmək, ideyaları müzakirə etmək və öyrənmək təbii gəlir.", "Böyük sözlər çox, xırda detallar az: praktik hissəni kimsə üzərinə götürməsə, planlar plan olaraq qalacaq."],
    "Sun-Sun": ["Təbiətləriniz ahəngdardır — bir-birinizin necə \"qurulduğunu\" anlayır və ona hörmət edirsiniz.", "Temperamentləriniz fərqlidir: birinizi enerji ilə dolduran digərinizi yora bilər. Bu fərqə hörmət etsəniz, o sizin gücünüzə çevrilər."],
    "Sun-Ascendant": ["Biriniz ilk görüşdən hiss edir ki, digəri onu həqiqətən \"görüb\" — güclü \"olduğun kimi xoşuma gəlirsən\" hissi.", "İlk təəssüratlar üst-üstə düşməyə bilər — bir-birinizi zahiri üslubun arxasında görmək üçün vaxt lazımdır."],
    "Moon-Ascendant": ["Biriniz lap əvvəldən digərinin yanında özünü emosional olaraq rahat, evdəki kimi hiss edir.", "Birinizin davranışı digərinə olduğundan daha soyuq və ya sərt görünə bilər."],
    "Venus-Ascendant": ["Fiziki və estetik cazibə — biriniz digərini sadəcə çox gözəl tapır.", "Cazibə var, amma üslub və zövqlər həmişə üst-üstə düşmür."],
    "Mars-Ascendant": ["Dərhal yaranan kimya və enerji — biriniz digərini hərəkətə təşviq edir.", "Biriniz digərinə həddindən artıq israrlı görünə bilər. Yumşaqlıq kömək edir."],
  },
  categories: {
    emotional: { name: "Emosional bağ", high: "Hissləriniz eyni dildə danışır — təsəlli və yaxınlıq asan gəlir.", mid: "Həqiqi emosional bağ var, amma bəzi ehtiyacları bir-birinizə açıq deməyi öyrənməli olacaqsınız.", low: "Siz fərqli hiss edirsiniz. Burada yaxınlıq səbir və şüurlu qayğı ilə böyüyür." },
    romance: { name: "Cazibə və romantika", high: "Güclü, təbii kimya — cazibə və nəvaziş bir-birini tapır.", mid: "Öz ritmi olan isti cazibə: romantikaya qayğı göstərdikcə böyüyür.", low: "Qığılcım daha sakitdir. Cazibə çox vaxt dostluqdan və zamanla yaranır." },
    communication: { name: "Ünsiyyət", high: "Bir-birinizi asanlıqla anlayırsınız — söhbətləriniz əsl hədiyyədir.", mid: "Ünsiyyət əsasən asandır, amma yadda saxlamalı olduğunuz bir-iki kor nöqtə var.", low: "Fərqli düşünürsünüz. Soruşmaq, dinləmək və tələsməmək hər şeyi dəyişir." },
    commitment: { name: "Etibar və sədaqət", high: "Sədaqət və möhkəmliyin güclü əlamətləri — bu bağ uzun ömür üçün yaranıb.", mid: "Ciddi münasibət üçün yaxşı təməl — birgə səylə daha da möhkəmlənir.", low: "Sabitlik burada öz-özünə yaranmır — onu aydın razılaşmalar və etibarla qurmaq lazımdır." },
    growth: { name: "Birlikdə inkişaf", high: "Bir-birinizin ən yaxşı tərəflərini üzə çıxarır və eyni istiqamətdə böyüyürsünüz.", mid: "Bir-birinizin böyüməsinə kömək edirsiniz, bəzən isə bir-birinizə meydan oxuyaraq.", low: "Fərqli istiqamətlərdə böyüyürsünüz — açar bir-birinizə məkan verməkdədir." },
  },
  overall: {
    high: "Təbii olaraq ahəngdar bir bağ — xəritələriniz arasında əsl rahatlıq var.",
    mid: "Dərin bir bağ: kifayət qədər ahəng və hər ikinizin böyüməsi üçün kifayət qədər fərq var.",
    low: "Ziddiyyətlər bağı: daha çox şüurlu əmək istəyir — və hər ikinizə çox şey öyrədə bilər.",
  },
  elements: {
    sun: { same: "Günəşləriniz eyni elementdədir — bir-birinizin təbiəti sizə tanış və anlaşıqlı gəlir.", compatible: "Günəşləriniz dost elementlərdədir — fərqlisiniz, amma təbii olaraq bir-birinizi dəstəkləyirsiniz.", different: "Günəşləriniz ziddiyyətli elementlərdədir — həyata fərqli baxırsınız, bu isə həm sürtünmə, həm də cazibə ola bilər." },
    moon: { same: "Aylarınız eyni elementdədir: oxşar hiss edir, oxşar təsəlli verirsiniz.", compatible: "Aylarınız uyğun elementlərdədir: emosional ehtiyaclarınız bir-birini tamamlayır.", different: "Aylarınız ziddiyyətli elementlərdədir: bir-birinizin necə hiss etdiyini öyrənməli olacaqsınız." },
    venusMars: { same: "Birinizin Venerası ilə digərinizin Marsı eyni elementdədir — cazibə təbiidir.", compatible: "Birinizin Venerası ilə digərinizin Marsı dost elementlərdədir — isti, yüngül cazibə.", different: "Birinizin Venerası ilə digərinizin Marsı ziddiyyətli elementlərdədir — içində bir az sirr olan cazibə." },
  },
  lifePath: {
    mirror: "Həyat Yolu rəqəminiz eynidir — bir-birinizdə özünüzü görürsünüz, həm güclü tərəflərdə, həm də dərslərdə.",
    harmonious: "Həyat Yolu rəqəmləriniz eyni \"ailədəndir\" — həyat məqsədləriniz həmahəng səslənir.",
    complementary: "Həyat Yolu rəqəmləriniz təbiətcə fərqlidir — hər biriniz cütlüyə digərində olmayanı gətirir.",
  },
};
export default az;

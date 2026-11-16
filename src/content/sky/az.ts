import type { SkyContent } from "./types";

const az: SkyContent = {
  ui: {
    eyebrow: "Bu gün səma", todayTitle: (d) => `Bu gün, ${d}`, dayTitle: (d) => d,
    moonIn: (s) => `Ay ${s}`, moonMoves: (s) => `axşama ${s} bürcünə keçir`, illumination: (p) => `${p}% işıqlıdır`,
    lunarDay: (n) => `Ay günü: ${n}`, dayNumber: "Günün rəqəmi",
    doTitle: "Bunun üçün yaxşıdır", avoidTitle: "Bundan çəkinmək yaxşıdır",
    haircutTitle: "Saç kəsimi", verdict: { good: "Uğurlu gün", neutral: "Neytral gün", bad: "Bu gün kəsdirməmək yaxşıdır" },
    retroTitle: "Retroqrad planetlər", noRetro: "Hazırda heç bir planet retroqrad deyil — yeni başlanğıclar üçün təmiz səma.",
    toCalendar: "Ay təqvimini aç",
    calTitle: "Ay təqvimi", calIntro: "Ayın hər günü üçün bürcü və fazası, üstəlik ənənəvi saç kəsimi təqvimi. Günün nəyə yaxşı olduğunu görmək üçün üzərinə toxun.",
    weekdays: ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"], prev: "Əvvəlki ay", next: "Növbəti ay", today: "Bu gün",
    legendGood: "saç kəsdirmək olar", legendNeutral: "neytral", legendBad: "kəsdirməmək yaxşıdır", tapHint: "Ətraflı görmək üçün istənilən günə toxun",
    disclaimer: "Sənin saat qurşağına görə hesablanıb. Ay təqvimi elm yox, ənənədir — onu yumşaq bir ipucu kimi qəbul et.",
  },
  phases: {
    new: { name: "Təzə Ay", text: "Sakit yenilənmə. Niyyətlərini müəyyən et və planlaşdır, böyük başlanğıcları isə bir-iki gün sonraya saxla." },
    waxing: { name: "Böyüyən Ay", text: "Enerji artır. Başlamaq, qurmaq, öyrənmək və həyatına yeni şeylər qatmaq üçün yaxşı vaxtdır." },
    full: { name: "Bədirlənmiş Ay", text: "Hisslər zirvədədir, çox şey üzə çıxır. Tamamla, bayram et və qızğın mübahisələrdən uzaq dur." },
    waning: { name: "Azalan Ay", text: "Enerji içə yönəlir. Səliqə yaratmaq, işləri bitirmək, buraxmaq və dincəlmək üçün yaxşı vaxtdır." },
  },
  moonSigns: [
    { mood: "Enerjili və səbirsiz gün", do: ["Yeni bir işə başlamaq", "İdman və hərəkət"], avoid: ["Mübahisə və ultimatum", "Tələsik qərarlar"], hair: "Saç tez uzanır, amma kövrək ola bilər." },
    { mood: "Sakit və ayağı yerə basan gün", do: ["Pul işləri və alış-veriş", "Gözəllik, rahatlıq, dadlı yemək"], avoid: ["Qəfil dəyişikliklər", "Fikirləşmədən xərcləmək"], hair: "Saç qalınlaşır və möhkəmlənir — ən yaxşı günlərdən biri." },
    { mood: "Maraqlı və danışqan gün", do: ["Söhbət, zəng, qısa səfər", "Təhsil və sənədlər"], avoid: ["Oxumadan imzalamaq", "Dedi-qodu"], hair: "Saç tez uzanır, amma kəsimin forması çox qalmır." },
    { mood: "Yumşaq və həssas gün", do: ["Ev, ailə, yemək bişirmək", "İstirahət və özünə qayğı"], avoid: ["Emosiya ilə vacib qərar", "Köhnə incikliklər"], hair: "Ənənəyə görə uğursuz gündür: saç sözə baxmaya bilər." },
    { mood: "Parlaq və səxavətli gün", do: ["Yaradıcılıq, görüş, bayram", "Özünü və işini göstərmək"], avoid: ["Qürur və gözə soxmaq", "Riskli mərclər"], hair: "Saç həcm və parıltı qazanır — yeni obraz üçün əla gündür." },
    { mood: "Praktik və dəqiq gün", do: ["Təmizlik, sağlamlıq, planlaşdırma", "Xırdalıqlarla iş"], avoid: ["Həddindən artıq tənqid", "Çox iş götürmək"], hair: "Kəsim formasını yaxşı saxlayır — səliqəli, dəqiq kəsimlər üçün uyğundur." },
    { mood: "Yüngül və ünsiyyətcil gün", do: ["Görüşlər və danışıqlar", "Gözəllik, incəsənət, paltar alışı"], avoid: ["Təzyiq altında qərar", "Ultimatumlar"], hair: "Salon üçün gözəl gündür: kəsim zərif görünür." },
    { mood: "Dərin və gərgin gün", do: ["Dürüst söhbət və araşdırma", "Ömrünü başa vurmuşu buraxmaq"], avoid: ["Qısqanclıq və nəzarət", "Münaqişəni qızışdırmaq"], hair: "Ənənəyə görə kəsdirmirlər: istədiyindən çox şeyi dəyişə bilər." },
    { mood: "Nikbin və narahat gün", do: ["Səfər və təhsil", "Gələcək planları"], avoid: ["Çox söz vermək", "Artıq xərc"], hair: "Neytral gün: ucunu aldırmaq olar, obrazı kökündən dəyişmək — yox." },
    { mood: "Ciddi və yığcam gün", do: ["Karyera və uzunmüddətli planlar", "İşləri qaydaya salmaq"], avoid: ["Sərtlik", "Dincəlmədən işləmək"], hair: "Saç yavaş uzanır, amma möhkəmlənir; kəsim uzun müddət qalır." },
    { mood: "Azad və qeyri-adi gün", do: ["Dostlar və icmalar", "Yeni ideyalar və texnologiya"], avoid: ["Sərt planlar", "İnsanlardan qapanmaq"], hair: "Təcrübə üçün yaxşı gündür, amma nəticə gözlənilməz ola bilər." },
    { mood: "Xəyalpərvər və həssas gün", do: ["İstirahət, incəsənət, meditasiya", "Başqalarına kömək"], avoid: ["Müqavilə və vacib qərarlar", "İfrata varmaq"], hair: "Ənənəyə görə uğursuz gündür: saç zəifləyə və dolaşa bilər." },
  ],
  haircutReason: {
    newFull: "Təzə Ay və bədirlənmiş Ay günlərində Ay təqvimi saça toxunmamağı məsləhət görür.",
    lunarDay: "Bu Ay günü ənənəyə görə saç kəsimi üçün uğursuz sayılır.",
  },
  hairGrowth: { waxing: "Ay böyüyür: saç daha tez uzanacaq — saçını uzatmaq istəyirsənsə, yaxşıdır.", waning: "Ay azalır: saç yavaş uzanır və kəsim formasını daha uzun saxlayır." },
  retro: {
    Mercury: "Retroqrad Merkuri: mesajları, sənədləri və planları iki dəfə yoxla; mümkünsə, vacib müqavilələri təxirə sal.",
    Venus: "Retroqrad Venera: münasibətə başlamaq və görünüşü kökündən dəyişmək üçün ən yaxşı vaxt deyil.",
    Mars: "Retroqrad Mars: enerji azdır — yeni döyüşlərə başlamaqdansa, köhnə işləri bitir.",
    other: (n) => `${n} — bu planetlərin idarə etdiyi mövzularda daha yavaş bir fon.`,
  },
};
export default az;

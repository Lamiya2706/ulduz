// Builds public/cities.json from the city-timezones dataset + a hand-curated Azerbaijan list.
// Usage: node scripts/build-cities.mjs /path/to/city-timezones/data/cityMap.json
import fs from "node:fs";
const src = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

// [Azerbaijani name, English name, lat, lon]
const AZ = [
  ["Bakı","Baku",40.41,49.87],["Gəncə","Ganja",40.68,46.36],["Sumqayıt","Sumgait",40.59,49.67],["Mingəçevir","Mingachevir",40.76,47.06],
  ["Lənkəran","Lankaran",38.75,48.85],["Şirvan","Shirvan",39.93,48.92],["Naxçıvan","Nakhchivan",39.21,45.41],["Şəki","Shaki",41.19,47.17],
  ["Yevlax","Yevlakh",40.62,47.15],["Xankəndi","Khankendi",39.82,46.75],["Şuşa","Shusha",39.76,46.75],["Quba","Quba",41.36,48.51],
  ["Qusar","Qusar",41.43,48.43],["Xaçmaz","Khachmaz",41.46,48.80],["Şamaxı","Shamakhi",40.63,48.64],["İsmayıllı","Ismayilli",40.79,48.15],
  ["Qəbələ","Gabala",40.98,47.85],["Oğuz","Oghuz",41.07,47.47],["Qax","Gakh",41.42,46.92],["Zaqatala","Zaqatala",41.63,46.64],
  ["Balakən","Balakan",41.73,46.40],["Ağdaş","Agdash",40.65,47.48],["Göyçay","Goychay",40.65,47.74],["Ucar","Ujar",40.52,47.65],
  ["Kürdəmir","Kurdamir",40.34,48.16],["Ağsu","Agsu",40.57,48.40],["Hacıqabul","Hajigabul",40.04,48.94],["Salyan","Salyan",39.60,48.98],
  ["Neftçala","Neftchala",39.38,49.25],["Biləsuvar","Bilasuvar",39.46,48.55],["Cəlilabad","Jalilabad",39.21,48.50],["Masallı","Masally",39.03,48.67],
  ["Yardımlı","Yardimli",38.91,48.24],["Lerik","Lerik",38.77,48.41],["Astara","Astara",38.46,48.87],["İmişli","Imishli",39.87,48.06],
  ["Saatlı","Saatly",39.93,48.37],["Sabirabad","Sabirabad",40.01,48.48],["Zərdab","Zardab",40.22,47.71],["Bərdə","Barda",40.37,47.13],
  ["Tərtər","Tartar",40.34,46.93],["Ağcabədi","Aghjabadi",40.05,47.46],["Beyləqan","Beylagan",39.77,47.62],["Füzuli","Fuzuli",39.60,47.14],
  ["Ağdam","Aghdam",39.99,46.93],["Xocalı","Khojaly",39.91,46.79],["Xocavənd","Khojavend",39.79,47.11],["Cəbrayıl","Jabrayil",39.40,47.03],
  ["Zəngilan","Zangilan",39.09,46.65],["Qubadlı","Gubadly",39.34,46.58],["Laçın","Lachin",39.64,46.55],["Kəlbəcər","Kalbajar",40.10,46.04],
  ["Goranboy","Goranboy",40.61,46.79],["Naftalan","Naftalan",40.51,46.82],["Samux","Samukh",40.76,46.41],["Şəmkir","Shamkir",40.83,46.02],
  ["Tovuz","Tovuz",40.99,45.63],["Qazax","Gazakh",41.09,45.37],["Ağstafa","Agstafa",41.12,45.45],["Gədəbəy","Gadabay",40.57,45.81],
  ["Daşkəsən","Dashkasan",40.52,46.08],["Göygöl","Goygol",40.59,46.32],["Xızı","Khizi",40.91,49.07],["Siyəzən","Siyazan",41.08,49.11],
  ["Şabran","Shabran",41.22,48.99],["Qobustan","Gobustan",40.53,48.93],["Xırdalan","Khirdalan",40.45,49.76],["Ordubad","Ordubad",38.91,46.02],
  ["Şərur","Sharur",39.55,44.98],["Culfa","Julfa",38.96,45.63],["Babək","Babek",39.15,45.45],["Şahbuz","Shahbuz",39.41,45.57],
  ["Kəngərli","Kangarli",39.39,45.16],["Sədərək","Sadarak",39.71,44.88],
];
const RU_AZ = { "Baku":"Баку","Ganja":"Гянджа","Sumgait":"Сумгаит","Mingachevir":"Мингечаур","Lankaran":"Ленкорань","Nakhchivan":"Нахичевань","Shaki":"Шеки","Shirvan":"Ширван","Quba":"Губа","Shusha":"Шуша","Khankendi":"Ханкенди","Yevlakh":"Евлах","Shamakhi":"Шамахы","Gabala":"Габала","Barda":"Барда","Agdam":"Агдам","Salyan":"Сальяны" };

// Extra aliases for foreign cities [English, ...aliases]
const ALIASES = {
  "Moscow":["Москва","Moskva"],"Saint Petersburg":["Санкт-Петербург","Sankt-Peterburq","Петербург"],"Istanbul":["İstanbul","Стамбул"],"Ankara":["Анкара"],
  "Izmir":["İzmir","Измир"],"Tbilisi":["Tiflis","Тбилиси"],"Batumi":["Батуми"],"Tehran":["Tehran","Тегеран"],"Tabriz":["Təbriz","Тебриз"],"Ardabil":["Ərdəbil","Ардебиль"],
  "Kiev":["Kyiv","Kiyev","Киев"],"Kharkiv":["Харьков","Xarkov"],"Odesa":["Odessa","Одесса"],"Minsk":["Минск"],"Almaty":["Алматы"],"Astana":["Астана"],"Tashkent":["Daşkənd","Ташкент"],
  "Samarkand":["Səmərqənd","Самарканд"],"Bishkek":["Бишкек"],"Ashgabat":["Aşqabad","Ашхабад"],"Yerevan":["İrəvan","Ереван"],"Derbent":["Dərbənd","Дербент"],
  "Makhachkala":["Mahaçqala","Махачкала"],"Kazan":["Казань"],"Novosibirsk":["Новосибирск"],"Yekaterinburg":["Екатеринбург"],"Rostov":["Rostov-on-Don","Ростов-на-Дону"],
  "London":["Лондон"],"Paris":["Париж"],"Berlin":["Берлин"],"New York":["Nyu-York","Нью-Йорк"],"Dubai":["Dubay","Дубай"],"Rome":["Roma","Рим"],"Madrid":["Мадрид"],
  "Vienna":["Vyana","Вена"],"Prague":["Praqa","Прага"],"Warsaw":["Varşava","Варшава"],"Budapest":["Будапешт"],"Athens":["Afina","Афины"],"Cairo":["Qahirə","Каир"],
};

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const out = [];
const seen = new Set();
for (const [azn, en, lat, lon] of AZ) {
  const aliases = [en, RU_AZ[en]].filter(Boolean).filter((a) => a !== azn);
  out.push({ n: azn, c: "AZ", lat, lon, tz: "Asia/Baku", a: aliases, p: 1e9 - out.length });
  seen.add("AZ|" + norm(en));
}
const PRIORITY = new Set(["TR","GE","RU","IR","KZ","UZ","UA","BY","TM","KG","TJ","AM","IL","AE","SA","QA","DE","GB","FR","IT","ES","NL","US","CA"]);
const SKIP_CITIES = new Set(["Stepanakert","Kapan"]); // mislabeled or replaced by the curated Azerbaijan list
for (const c of src) {
  if (c.iso2 === "AZ" || SKIP_CITIES.has(c.city)) continue;
  const min = PRIORITY.has(c.iso2) ? 80000 : 400000;
  if ((c.pop || 0) < min && !ALIASES[c.city]) continue;
  if (!c.timezone) continue;
  const key = c.iso2 + "|" + norm(c.city);
  if (seen.has(key)) continue;
  seen.add(key);
  out.push({ n: c.city, c: c.iso2, lat: +c.lat.toFixed(3), lon: +c.lng.toFixed(3), tz: c.timezone, a: ALIASES[c.city] || [], p: c.pop || 0 });
}
out.sort((a, b) => b.p - a.p);
const compact = out.map(({ n, c, lat, lon, tz, a }) => (a.length ? [n, c, lat, lon, tz, a] : [n, c, lat, lon, tz]));
fs.writeFileSync(new URL("../public/cities.json", import.meta.url), JSON.stringify(compact));
console.log("cities:", compact.length);

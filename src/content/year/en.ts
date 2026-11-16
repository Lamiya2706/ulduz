import type { YearContent } from "./types";

const en: YearContent = {
  ui: {
    eyebrow: "Ulduz · year forecast", title1: "What will your year", title2: "be about?",
    sub: "Your personal year by numerology, the theme of every month, the big planets' influence on your Sun and the main sky events — retrogrades and eclipses.",
    date: "Date of birth", submit: "Show my year", hint: "Only your date of birth is needed.",
    resultTitle: (y) => `Your ${y}`, age: (n) => `the year you turn ${n}`,
    nav: { year: "Theme of the year", months: "Month by month", transits: "Planets and you", sky: "Sky calendar" },
    personalYear: "Personal year", loveL: "Love", workL: "Work and money", adviceL: "Advice for the year",
    monthsTitle: "Month by month", monthsIntro: "Each month has its own number and its own task inside the year.", nowBadge: "now",
    transitsTitle: "The big planets and your Sun", transitsIntro: (s) => `Your Sun is in ${s}. This is how the slow planets touch it this year — these are the main background themes.`,
    noTransits: "This year the slow planets make no exact aspects to your Sun — a calmer year in which you set the pace yourself.",
    period: (f, t) => (f === t ? f : `${f} – ${t}`),
    skyTitle: "Sky calendar of the year", skyIntro: "These events are the same for everyone — good to know when planning.",
    retroTitle: "Retrograde periods", eclipsesTitle: "Eclipses", ingressTitle: "Jupiter and Saturn change signs",
    solar: (s) => `Solar eclipse in ${s}`, lunar: (s) => `Lunar eclipse in ${s}`,
    eclipseNote: "Solar eclipses open new chapters, lunar eclipses close old ones. Around these dates avoid hasty decisions.",
    enters: (p, s) => `${p} enters ${s}`, noEclipses: "No major eclipses this year.",
    another: "Another date", copy: "Copy link", copied: "Link copied ✦", toChart: "Build my natal chart", disclaimer: "Astrology and numerology are symbolic languages, not a science. Use the forecast as a guide for reflection, not a prediction.",
  },
  years: {
    1: { title: "A year of beginnings", theme: "A new nine-year cycle starts. What you begin now sets the direction for years ahead, so choose boldly and deliberately.", love: "New acquaintances and a fresh start in an existing relationship; say clearly what you want.", work: "A good time for a new job, project or your own business. Initiative pays off.", advice: "Don't wait for the perfect moment — start." },
    2: { title: "A year of patience and partnership", theme: "The pace slows down. What you planted last year grows quietly; the main things happen through people and cooperation.", love: "A strong year for relationships: closeness, trust, important conversations.", work: "Results come through teamwork and diplomacy, not pressure. Details matter.", advice: "Be patient and don't force things." },
    3: { title: "A year of joy and self-expression", theme: "A light, sociable year. Creativity, friends, travel and your own voice come to the fore.", love: "Flirting, romance and fun; a good time to bring lightness back into a relationship.", work: "Ideas, presentations, creative projects and networking bring success. Watch your spending.", advice: "Show yourself — and finish what you start." },
    4: { title: "A year of work and foundations", theme: "A year to build: order, discipline, health and stability. Less glamour, but the results last for years.", love: "Relationships become more serious; a time for joint plans and reliability.", work: "Hard, steady work. Good for property, savings, learning a profession.", advice: "Build step by step and take care of your body." },
    5: { title: "A year of change and freedom", theme: "The most dynamic year of the cycle: moves, trips, unexpected turns and new opportunities.", love: "Bright encounters and a need for freedom; long relationships need fresh air.", work: "A change of job, field or format is possible. Be flexible and take reasonable risks.", advice: "Say yes to change, but don't scatter yourself." },
    6: { title: "A year of love and responsibility", theme: "Home, family and loved ones are at the centre. Many important personal decisions are made in such years.", love: "A year of weddings, moving in together, children — or honest decisions about a relationship.", work: "More responsibility and the trust of others; good for work with people and beauty.", advice: "Care for others without forgetting yourself." },
    7: { title: "A year of reflection", theme: "A quiet year for inner work: study, rest, health and the question of what you really want.", love: "A need for depth and silence; relationships are tested for sincerity.", work: "Not a year for big leaps. Study, research and improving your skills work best.", advice: "Slow down and listen to yourself." },
    8: { title: "A year of power and harvest", theme: "The year of results: career, money, status. What you have been building pays off.", love: "Strong partners and serious decisions; don't let work swallow your personal life.", work: "Promotions, big deals, growth in income. Act confidently and think big.", advice: "Take what you have earned — and be fair." },
    9: { title: "A year of completion", theme: "The cycle ends. A time to finish, forgive and let go of what has run its course, making room for the new.", love: "Some stories end, others move to a new level. Honesty matters most.", work: "Finish projects and tidy up loose ends; don't start anything big until the next year.", advice: "Let go lightly — a new cycle is close." },
  },
  transits: {
    Jupiter: { conjunction: "Jupiter joins your Sun — once in twelve years. A year of growth, luck and new opportunities: aim higher.", soft: "Jupiter supports your Sun: things come easier, helpful people and chances appear. Use them.", hard: "Jupiter pushes your Sun: big ambitions and a temptation to take on too much. Grow, but measure your strength." },
    Saturn: { conjunction: "Saturn joins your Sun — a serious, defining period. More responsibility and a test of maturity; what you build now lasts.", soft: "Saturn supports your Sun: discipline comes naturally and steady effort brings solid results.", hard: "Saturn tests your Sun: obstacles, fatigue and extra duties. Go slower, drop the unnecessary and look after your health." },
    Uranus: { conjunction: "Uranus joins your Sun — a once-in-a-lifetime time of awakening. Sudden changes and a strong urge for freedom.", soft: "Uranus refreshes your Sun: pleasant changes, new ideas and courage to live your own way.", hard: "Uranus shakes your Sun: unexpected turns and restlessness. Stay flexible and don't burn bridges in a moment of impulse." },
    Neptune: { conjunction: "Neptune joins your Sun — a time of inspiration and sensitivity, but also blurred boundaries. Stay grounded.", soft: "Neptune inspires your Sun: intuition, creativity and compassion grow.", hard: "Neptune fogs your Sun: confusion and illusions are possible. Check facts and don't idealize people." },
    Pluto: { conjunction: "Pluto joins your Sun — a deep, rare transformation. The old self goes, a stronger one arrives.", soft: "Pluto empowers your Sun: inner strength and the ability to change your life for the better.", hard: "Pluto presses on your Sun: power struggles and deep change. Let go of control where it no longer works." },
  },
  retroNotes: {
    Mercury: "Double-check documents, tickets and messages; avoid signing important contracts.",
    Venus: "Not the best time for weddings, big purchases and radical beauty changes; old feelings may return.",
    Mars: "Energy is lower: finish old tasks, avoid conflicts and new big launches.",
  },
  ingressNotes: { Jupiter: "The area of luck and growth shifts for everyone.", Saturn: "The area of lessons and responsibility shifts for everyone." },
};
export default en;

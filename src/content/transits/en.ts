import type { TransitContent } from "./types";

const en: TransitContent = {
  ui: {
    title: "Transit alerts", intro: "The slow planets, from Jupiter to Pluto, set the big themes of your life. These are the times they touch your birth chart this year.",
    now: "Now", soon: "Coming up", none: "No slow planet touches your chart exactly in the coming year. A calmer stretch in which you set the pace yourself.",
    period: (f, t) => (f === t ? f : `${f} – ${t}`), exact: (d) => `Exact: ${d}`, touches: "Touches",
    showAll: (n) => `Show all ${n}`, showLess: "Show fewer",
    noTimeNote: "Without a birth time, the Moon, Ascendant and Midheaven are left out. Add your time of birth to see them too.",
    accountTitle: "Your transits", accountActive: (n) => (n === 1 ? "1 transit is active now" : `${n} transits are active now`),
    accountNone: "No big transits right now. See what's coming this year.", accountOpen: "See your transits",
  },
  points: {
    Sun: "your sense of self and your vitality", Moon: "your feelings, home and inner needs", Mercury: "your mind, words and plans",
    Venus: "love, beauty and money", Mars: "your drive, courage and energy", Asc: "how you come across and your body",
    MC: "your career, reputation and direction in life",
  },
  planets: {
    Jupiter: {
      conjunction: "Jupiter brings growth and luck here. Doors open, so aim higher and say yes to good offers.",
      soft: "Jupiter helps quietly: things go easier, and helpful people and chances appear. Use them.",
      hard: "Jupiter inflates things: big hopes and a pull to overdo it. Grow, but measure your strength and budget.",
    },
    Saturn: {
      conjunction: "Saturn asks for maturity here: more responsibility, clear limits, and slow work that lasts for years.",
      soft: "Saturn gives structure: discipline comes naturally and steady effort brings solid results.",
      hard: "Saturn tests this part of you: delays, fatigue and extra duties. Slow down, drop what isn't needed and rest.",
    },
    Uranus: {
      conjunction: "Uranus wakes this part of you up: sudden change, freedom and a need to live your own way.",
      soft: "Uranus refreshes: welcome surprises, new ideas and the courage to try something different.",
      hard: "Uranus shakes things up: unexpected turns and restlessness. Stay flexible and don't burn bridges on impulse.",
    },
    Neptune: {
      conjunction: "Neptune softens the edges here: inspiration and sensitivity grow, but boundaries blur. Stay grounded.",
      soft: "Neptune inspires: intuition, creativity and compassion come easily.",
      hard: "Neptune brings fog: confusion and illusions are possible. Check facts and don't idealize people.",
    },
    Pluto: {
      conjunction: "Pluto transforms this part of you deeply. Something old ends so that something stronger can grow.",
      soft: "Pluto empowers: inner strength and the ability to change your life for the better.",
      hard: "Pluto presses hard: power struggles and deep change. Let go of control where it no longer works.",
    },
  },
};
export default en;

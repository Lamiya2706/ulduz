import type { SkyContent } from "./types";

const en: SkyContent = {
  ui: {
    eyebrow: "The sky today", todayTitle: (d) => `Today, ${d}`, dayTitle: (d) => d,
    moonIn: (s) => `Moon ${s}`, moonMoves: (s) => `moves into ${s} by evening`, illumination: (p) => `${p}% lit`,
    lunarDay: (n) => `Lunar day ${n}`, dayNumber: "Number of the day",
    doTitle: "Good for", avoidTitle: "Better to avoid",
    haircutTitle: "Haircut", verdict: { good: "Good day", neutral: "Neutral day", bad: "Better not today" },
    retroTitle: "Retrograde now", noRetro: "No planets are retrograde — a clear sky for new starts.",
    toCalendar: "Open the lunar calendar",
    calTitle: "Lunar calendar", calIntro: "The Moon's sign and phase for every day of the month, with the traditional haircut calendar. Tap a day to see what it is good for.",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], prev: "Previous month", next: "Next month", today: "Today",
    legendGood: "good for a haircut", legendNeutral: "neutral", legendBad: "better not to cut", tapHint: "Tap any day for details",
    disclaimer: "Calculated for your time zone. The lunar calendar is a tradition, not a science — use it as a gentle guide.",
  },
  phases: {
    new: { name: "New Moon", text: "A quiet restart. Set intentions and plan, but give big launches a day or two." },
    waxing: { name: "Waxing Moon", text: "Energy is growing. A good time to start, build, learn and add new things to your life." },
    full: { name: "Full Moon", text: "Emotions run high and things come to light. Finish, celebrate, and avoid heated arguments." },
    waning: { name: "Waning Moon", text: "Energy turns inward. A good time to clean up, finish, let go and rest." },
  },
  moonSigns: [
    { mood: "Energetic and impatient", do: ["Start something new", "Sport and physical activity"], avoid: ["Quarrels and ultimatums", "Rushed decisions"], hair: "Hair grows fast but can become brittle." },
    { mood: "Calm and down to earth", do: ["Money matters and purchases", "Beauty, comfort, good food"], avoid: ["Sudden changes", "Impulsive spending"], hair: "Hair becomes thicker and stronger — one of the best days." },
    { mood: "Curious and talkative", do: ["Conversations, calls, short trips", "Learning and paperwork"], avoid: ["Signing without reading", "Gossip"], hair: "Hair grows quickly, but the cut may not hold its shape long." },
    { mood: "Soft and emotional", do: ["Home, family, cooking", "Rest and caring for yourself"], avoid: ["Big decisions on emotions", "Old grievances"], hair: "Traditionally considered a bad day: hair may get unruly." },
    { mood: "Bright and generous", do: ["Creativity, dates, celebrations", "Presenting yourself and your work"], avoid: ["Pride and showing off", "Risky bets"], hair: "Hair gets volume and shine — a great day for a new look." },
    { mood: "Practical and precise", do: ["Cleaning, health, planning", "Detailed work"], avoid: ["Over-criticism", "Taking on too much"], hair: "The haircut keeps its shape well; good for neat, precise styles." },
    { mood: "Light and sociable", do: ["Meetings and negotiations", "Beauty, art, shopping for clothes"], avoid: ["Deciding under pressure", "Ultimatums"], hair: "A beautiful day for the salon: the cut looks elegant." },
    { mood: "Deep and intense", do: ["Honest talks and research", "Letting go of what has run its course"], avoid: ["Jealousy and control", "Stirring up conflicts"], hair: "Traditionally avoided: it may change more than you planned." },
    { mood: "Optimistic and restless", do: ["Travel and study", "Plans for the future"], avoid: ["Promising too much", "Overspending"], hair: "A neutral day: fine for a trim, not for a dramatic change." },
    { mood: "Serious and focused", do: ["Career and long-term plans", "Putting things in order"], avoid: ["Rigidity", "Working without rest"], hair: "Hair grows slower but becomes stronger; the cut lasts long." },
    { mood: "Free and unusual", do: ["Friends and communities", "New ideas and technology"], avoid: ["Rigid plans", "Isolating yourself"], hair: "A good day to experiment, but the result can be unpredictable." },
    { mood: "Dreamy and sensitive", do: ["Rest, art, meditation", "Helping others"], avoid: ["Contracts and big decisions", "Overdoing it"], hair: "Traditionally a bad day: hair may get weak or tangled." },
  ],
  haircutReason: {
    newFull: "Around the New and Full Moon, the lunar calendar advises leaving your hair alone.",
    lunarDay: "This lunar day is traditionally considered unlucky for haircuts.",
  },
  hairGrowth: { waxing: "The Moon is waxing: hair will grow back faster — good if you are growing it.", waning: "The Moon is waning: hair grows back slower, so the cut keeps its shape longer." },
  retro: {
    Mercury: "Mercury retrograde: double-check messages, documents and plans; avoid signing important contracts if you can.",
    Venus: "Venus retrograde: not the best time to start a relationship or make big beauty changes.",
    Mars: "Mars retrograde: energy is lower — finish old tasks rather than launching new battles.",
    other: (n) => `${n} — a slower background for the themes these planets rule.`,
  },
};
export default en;

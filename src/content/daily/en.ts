import type { DailyContent } from "./types";

const en: DailyContent = {
  ui: {
    eyebrow: "Your daily horoscope", title: "Your day in the stars", titleFor: (n) => `${n}, your day in the stars`,
    intro: "Not a horoscope for a whole zodiac sign: today's planets laid over your own birth chart. It changes every day.",
    today: "Today", tomorrow: "Tomorrow",
    overallTitle: "The tone of the day",
    overall: [
      "A demanding day. Go slowly, keep plans simple and be gentle with yourself.",
      "A day that asks for care. Double-check things and don't force what resists.",
      "An even day. Steady work and small steps go well.",
      "A good day. The sky is on your side; use it for what matters to you.",
      "A bright day. Doors open easily, so say yes, start and reach out.",
    ],
    moonTitle: (h, s) => `The Moon is in your ${h} house, ${s}`, tipTitle: "Tip for the day",
    transitsTitle: "What touches your chart", transitsIntro: "Today's planets make these contacts with the planets of your birth chart.",
    noTransits: "Today's planets make no tight contacts with your chart. A quiet, free day to spend as you like.", touches: "Touches",
    spheresTitle: "Your forecast by area",
    sunHouses: "Without a birth time, the houses are counted from your Sun sign. Add your time and place of birth for a more precise day.",
    signInTitle: "Get your day every morning", signInText: "Your daily horoscope is part of your free account. Sign up once with your birth details and it opens here every day.", logIn: "I have an account", signInBtn: "Create an account",
    saveTitle: "Add your birth details", saveText: "Save your birth moment in your account and your daily horoscope will be waiting here every day.", saveBtn: "Add my details",
    change: "Change details", openChart: "Open my natal chart", asc: "Ascendant",
    disclaimer: "Calculated for your time zone from real planet positions. Astrology is a symbolic language: use the day as a gentle guide, not a rule.",
  },
  houses: [
    { focus: "You are in focus. Your body, your look and how you come across ask for attention.", tip: "Do one thing just for yourself: a walk, a new outfit, an early night." },
    { focus: "Money, comfort and what you value come forward.", tip: "Check your budget or buy something useful, not something impulsive." },
    { focus: "Talks, messages, short trips and learning fill the day.", tip: "Write the message you have been putting off." },
    { focus: "Home, family and your inner sense of safety are the theme.", tip: "Cook something warm, call family or tidy one corner of your home." },
    { focus: "Joy, romance and creativity want space today.", tip: "Make time for play: a date, a hobby, something that makes you smile." },
    { focus: "Daily work, health and routines are in focus.", tip: "Clear one task that has been sitting on your list, and drink more water." },
    { focus: "Partners and one-to-one relationships come forward.", tip: "Listen more than you speak, and meet someone halfway." },
    { focus: "Deep feelings, intimacy and shared money surface.", tip: "Have the honest talk, or let go of something you've outgrown." },
    { focus: "Your horizon widens: travel, study and big ideas call.", tip: "Read, plan a trip or learn something new, even for half an hour." },
    { focus: "Career, goals and your reputation are on display.", tip: "Take one visible step towards a goal, and let people see your work." },
    { focus: "Friends, groups and hopes for the future are the theme.", tip: "Reach out to a friend or join others in something you care about." },
    { focus: "A quieter, inward day for rest, dreams and healing.", tip: "Slow down, sleep well and leave big launches for later." },
  ],
  points: {
    Sun: "your sense of self and your vitality", Moon: "your feelings and inner needs", Mercury: "your mind, words and plans",
    Venus: "love, pleasure and what you value", Mars: "your drive, courage and energy", Jupiter: "your luck, growth and faith",
    Saturn: "your duties, limits and long-term goals", Asc: "how you come across and your body",
  },
  bodies: {
    Moon: {
      soft: "Feelings flow easily. A good moment to be close to people and trust your instincts.",
      hard: "Emotions may run ahead of you. Pause before reacting and don't take small things personally.",
      conj: "Your mood is strong and visible today. Notice what you really need.",
    },
    Sun: {
      soft: "Confidence and energy are on your side. Show yourself and lead.",
      hard: "Your will meets resistance. Choose your battles and don't push too hard.",
      conj: "A personal highlight: you are seen. Start something that matters to you.",
    },
    Mercury: {
      soft: "Words come easily. Good for talks, deals, writing and study.",
      hard: "Misunderstandings are likely. Re-read messages and clarify before you agree.",
      conj: "Your mind is busy and sharp. Make lists and plans, and say what you think.",
    },
    Venus: {
      soft: "Charm and warmth come naturally. Good for love, beauty and making peace.",
      hard: "Desires and reality may not match. Don't overspend or ask too much of others.",
      conj: "A sweet, attractive day. Treat yourself and enjoy the company of others.",
    },
    Mars: {
      soft: "Strong, useful energy. Good for sport, hard tasks and taking initiative.",
      hard: "Irritation and haste are close. Move your body, and avoid arguments and risks.",
      conj: "A surge of energy. Use it for action rather than conflict.",
    },
  },
};
export default en;

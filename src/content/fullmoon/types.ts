/** Texts for the Full Moon manifestation page. */
export interface FullMoonContent {
  ui: {
    eyebrow: string; title: string; intro: string;
    tonight: (signIn: string) => string; upcoming: (signIn: string) => string; justPassed: (signIn: string) => string;
    exact: (date: string, time: string) => string; inDays: (n: number) => string; windowNote: string;
    themeTitle: (signIn: string) => string; releaseL: string; callL: string; affirmL: string;
    ritualTitle: string; ritualIntro: string;
    methodsTitle: string; methodsIntro: string; whenL: string;
    journalTitle: string; journalIntro: string;
    gratitudeL: string; gratitudePh: string; releaseJL: string; releasePh: string; intentL: string; intentPh: string;
    releaseBtn: string; releasedMsg: string; savedNote: string; clearBtn: string;
    doTitle: string; avoidTitle: string;
    toCalendar: string; safety: string; disclaimer: string;
  };
  steps: { title: string; text: string }[];                                    // 7
  methods: { icon: string; title: string; when: string; text: string; steps: string[] }[]; // 8
  signs: { theme: string; release: string; call: string; affirmation: string }[];  // 12, by the Moon's sign
  do: string[]; avoid: string[];
}

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Three real dictionary entries.
 *
 * The previous three were `Ɛyaɖɛ` ("Hello"), `Ɖɔɔzɩ` ("Thank you") and `Ɛsɔɔlɩ`
 * ("Goodbye"). Checked against the merged lexicon, the first two are attested by no
 * source at all, and the glosses on all three were assigned rather than looked up. The
 * app's first principle is that every word traces to a source; the marketing site is
 * where a learner meets Kabiyè first, so it is the last place to break it.
 *
 * These three are in the 9,738-entry lexicon with the glosses the dictionary gives them.
 * `fɛŋgɛ` has a French gloss and no English one -- roughly a quarter of the dictionary is
 * like that -- so it carries the same FR tag the app shows rather than being quietly
 * translated here.
 */
const WORDS = [
  {
    kabiye: "Kabɩyɛ",
    english: "Kabiye language",
    french: "kabiyè",
    frenchOnly: false,
  },
  {
    kabiye: "ɛyʋ",
    english: "human being",
    french: "être humain",
    frenchOnly: false,
  },
  {
    kabiye: "fɛŋgɛ",
    english: "léger(ère) sans poids",
    french: "léger(ère) sans poids",
    frenchOnly: true,
  },
] as const;

interface SampleLessonProps {
  lang?: "en" | "fr";
}

export default function SampleLesson({ lang = "en" }: SampleLessonProps) {
  const [current, setCurrent] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  const nextWord = () => {
    setCurrent((prev) => (prev + 1) % WORDS.length);
    setShowTranslation(false);
  };

  const translations = {
    en: {
      title: "Three words from the dictionary",
      showTranslation: "Show meaning",
      hideTranslation: "Hide meaning",
      nextWord: "Next word",
    },
    fr: {
      title: "Trois mots du dictionnaire",
      showTranslation: "Afficher le sens",
      hideTranslation: "Masquer le sens",
      nextWord: "Mot suivant",
    },
  };

  const t = translations[lang];
  const word = WORDS[current];

  return (
    <motion.div
      className="bg-leaf border-ink mx-auto max-w-md rounded-[14px] border-[1.5px] p-8"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <h3 className="text-laterite mb-6 text-[13px] font-semibold uppercase tracking-[0.1em]">
        {t.title}
      </h3>

      <motion.div
        className="mb-6"
        key={current}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="kbp text-ink text-[44px] font-bold leading-[1.05]">{word.kabiye}</p>
        <AnimatePresence>
          {showTranslation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-ink-quiet mt-2 text-[18px]">
                {lang === "en" ? word.english : word.french}
                {word.frenchOnly && (
                  <span className="bg-paper-recessed text-ink-quiet ml-2 rounded-[4px] px-2 py-[2px] text-[11px] font-bold">
                    FR
                  </span>
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* No speaker button. There are no recordings, and the previous one pointed at
          /audio/*.mp3 files that do not exist in this repo -- it played nothing. */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="border-ink text-ink rounded-full border-[1.5px] px-4 py-3 text-[16px] font-semibold transition-transform active:scale-[0.98]"
        >
          {showTranslation ? t.hideTranslation : t.showTranslation}
        </button>
        <button
          onClick={nextWord}
          className="bg-ink text-paper rounded-full px-4 py-3 text-[17px] font-semibold transition-transform active:scale-[0.98]"
        >
          {t.nextWord}
        </button>
      </div>
    </motion.div>
  );
}

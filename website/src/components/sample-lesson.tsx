import { useState } from "react";
import { SpeakerHigh } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

const lessons = [
  {
    kabiye: "Ɛyaɖɛ",
    english: "Hello",
    french: "Bonjour",
    audio: "/audio/hello.mp3",
  },
  {
    kabiye: "Ɖɔɔzɩ",
    english: "Thank you",
    french: "Merci",
    audio: "/audio/thank-you.mp3",
  },
  {
    kabiye: "Ɛsɔɔlɩ",
    english: "Goodbye",
    french: "Au revoir",
    audio: "/audio/goodbye.mp3",
  },
];

interface SampleLessonProps {
  lang?: "en" | "fr";
}

export default function SampleLesson({ lang = "en" }: SampleLessonProps) {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  const playAudio = () => {
    const audio = new Audio(lessons[currentLesson].audio);
    audio.play();
  };

  const nextLesson = () => {
    setCurrentLesson((prev) => (prev + 1) % lessons.length);
    setShowTranslation(false);
  };

  const translations = {
    en: {
      title: "Learn Basic Greetings",
      showTranslation: "Show Translation",
      hideTranslation: "Hide Translation",
      nextWord: "Next Word",
    },
    fr: {
      title: "Apprenez les salutations de base",
      showTranslation: "Afficher la traduction",
      hideTranslation: "Masquer la traduction",
      nextWord: "Mot suivant",
    },
  };

  const t = translations[lang];

  return (
    <motion.div
      className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-2xl font-bold mb-4 text-[#6200EE]">{t.title}</h3>
      <motion.div
        className="mb-6"
        key={currentLesson}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-3xl font-bold mb-2">
          {lessons[currentLesson].kabiye}
        </p>
        <AnimatePresence>
          {showTranslation && (
            <motion.p
              className="text-xl text-[#757575]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {lessons[currentLesson][lang === "en" ? "english" : "french"]}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
      <div className="flex justify-between items-center mb-4">
        <motion.button
          onClick={playAudio}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#03DAC6] text-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <SpeakerHigh />
        </motion.button>
        <motion.button
          onClick={() => setShowTranslation(!showTranslation)}
          className="px-4 py-2 bg-[#F5F5F5] text-[#212121] rounded-md"
          whileHover={{ backgroundColor: "#E0E0E0" }}
          whileTap={{ scale: 0.95 }}
        >
          {showTranslation ? t.hideTranslation : t.showTranslation}
        </motion.button>
      </div>
      <motion.button
        onClick={nextLesson}
        className="w-full py-2 bg-[#FF5722] text-white rounded-md hover:bg-opacity-90 transition-colors"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {t.nextWord}
      </motion.button>
    </motion.div>
  );
}

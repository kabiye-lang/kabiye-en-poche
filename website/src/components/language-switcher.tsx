import { motion } from "motion/react";

type Language = "en" | "fr";

interface LanguageSwitcherProps {
  lang: Language;
  onLanguageChange: () => void;
}

export default function LanguageSwitcher({
  lang,
  onLanguageChange,
}: LanguageSwitcherProps) {
  return (
    <motion.button
      className="border-ink text-ink fixed top-4 right-4 z-50 rounded-full border-[1.5px] bg-white px-4 py-2"
      onClick={onLanguageChange}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={lang === "en" ? "Switch to French" : "Switch to English"}
    >
      {lang === "en" ? "Français" : "English"}
    </motion.button>
  );
}

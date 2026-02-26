import { motion } from "framer-motion";

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
      className="fixed top-4 right-4 bg-white text-[#6200EE] px-4 py-2 rounded-full shadow-md z-50"
      onClick={onLanguageChange}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={lang === "en" ? "Switch to French" : "Switch to English"}
    >
      {lang === "en" ? "Français" : "English"}
    </motion.button>
  );
}

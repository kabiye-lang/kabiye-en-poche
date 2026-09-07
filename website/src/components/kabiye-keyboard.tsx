import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { XIcon, CopyIcon, LinkIcon } from "@phosphor-icons/react";

interface KabiyeKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "en" | "fr";
}

const kabiyeCharacters = {
  uppercase: ["Ɖ", "Ɛ", "Ɣ", "Ɩ", "Ŋ", "Ɔ", "Ʊ", "Ñ"],
  lowercase: ["ɖ", "ɛ", "ɣ", "ɩ", "ŋ", "ɔ", "ʊ", "ñ"],
};

const letterMap: { [key: string]: string } = {
  d: "ɖ",
  D: "Ɖ",
  e: "ɛ",
  E: "Ɛ",
  g: "ɣ",
  G: "Ɣ",
  i: "ɩ",
  I: "Ɩ",
  n: "ŋ",
  N: "Ŋ",
  o: "ɔ",
  O: "Ɔ",
  u: "ʊ",
  U: "Ʊ",
};

const translations = {
  en: {
    title: "Kabiyè Keyboard",
    instruction: "Type = followed by a letter to get the diacritical variant",
    placeholder: "Type your text here...",
    copy: "Copy",
    copied: "Copied!",
    close: "Close",
    externalKeyboard: "Use Lexilogos Keyboard",
    examples: "Examples:",
  },
  fr: {
    title: "Clavier Kabiyè",
    instruction:
      "Tapez = suivi d'une lettre pour obtenir la variante diacritique",
    placeholder: "Tapez votre texte ici...",
    copy: "Copier",
    copied: "Copié !",
    close: "Fermer",
    externalKeyboard: "Utiliser le clavier Lexilogos",
    examples: "Exemples :",
  },
};

export default function KabiyeKeyboard({
  isOpen,
  onClose,
  lang,
}: KabiyeKeyboardProps) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const t = translations[lang];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const input = e.currentTarget.value;
    const lastTwoChars = input.slice(-2);
    const lastThreeChars = input.slice(-3);

    if (lastThreeChars === "==n") {
      setText(input.slice(0, -3) + "ñ");
    } else if (lastThreeChars === "==N") {
      setText(input.slice(0, -3) + "Ñ");
    } else if (lastTwoChars[0] === "=" && letterMap[lastTwoChars[1]]) {
      setText(input.slice(0, -2) + letterMap[lastTwoChars[1]]);
    } else {
      setText(input);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-laterite">{t.title}</h2>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.lexilogos.com/clavier/kabiye.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-laterite hover:text-ink flex items-center"
                >
                  <LinkIcon size={18} className="mr-1" />
                  {t.externalKeyboard}
                </a>
                <button
                  onClick={onClose}
                  className="text-ink-quiet hover:text-laterite transition-colors"
                  aria-label={t.close}
                >
                  <XIcon size={24} />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-ink-quiet">{t.instruction}</p>
              <p className="text-ink-quiet text-sm">{t.examples}</p>
              <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-sm text-ink-quiet">
                {Object.entries(letterMap)
                  .filter(([key]) => key.toLowerCase() === key)
                  .map(([key, value]) => (
                    <div key={key}>
                      =<span className="font-bold">{key}</span> → {value}
                    </div>
                  ))}
                <div>
                  ==<span className="font-bold">n</span> → ñ
                </div>
              </div>
            </div>

            <textarea
              ref={inputRef}
              value={text}
              onInput={handleInput}
              placeholder={t.placeholder}
              className="w-full h-32 p-3 border border-line rounded-sm mb-4 focus:outline-hidden focus:ring-2 focus:ring-ink font-mono"
              aria-label={t.placeholder}
            />

            <div className="flex items-center flex-col md:flex-row gap-y-4">
              <div className="grid grid-cols-8 gap-2 items-center md:basis-2/3">
                {kabiyeCharacters.lowercase
                  .concat(kabiyeCharacters.uppercase)
                  .map((char) => (
                    <motion.button
                      key={char}
                      onClick={() => setText((prev) => prev + char)}
                      className="bg-ink text-white px-3 py-1 rounded-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {char}
                    </motion.button>
                  ))}
              </div>
              <div className="md:basis-1/3">
                <motion.button
                  onClick={copyToClipboard}
                  className="flex items-center bg-ink text-white px-4 py-2 rounded-sm ml-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={copied}
                >
                  <CopyIcon className="mr-2" size={18} />
                  {copied ? t.copied : t.copy}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

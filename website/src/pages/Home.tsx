import { useState, useEffect } from "react";
import { BookOpen, Globe, GithubLogo, Keyboard } from "@phosphor-icons/react";
import { motion } from "motion/react";
import SampleLesson from "@/components/sample-lesson";
import LanguageSwitcher from "@/components/language-switcher";
import NewsletterSignup from "@/components/newsletter-signup";
import KabiyeKeyboard from "@/components/kabiye-keyboard";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const translations = {
  en: {
    title: "Kabiyè en poche",
    subtitle: "A pocket primer for Kabiyè",
    heroLead: "Read it. Write it.",
    heroWord: "Kabɩyɛ.",
    heroBody:
      "Lessons, a dictionary of 9,738 words and a keyboard for the letters your phone doesn't have — for the language of northern Togo, in English and French. Free, open source, no ads.",
    availability: "iOS on TestFlight today · Android soon",
    glyphCaption:
      "One of eight letters French cannot write. There are 32 in all.",
    discoverTitle: "One of Togo's two national languages.",
    discoverText:
      "Kabiyè is a Gur language of northern Togo. This is a place to read it, to write it, and to pass it on.",
    // What the app actually does today. No audio: there are no recordings yet, and
    // saying otherwise is the one claim a learner would catch us on first.
    features: [
      "Lessons that teach one word at a time, then ask you to write it",
      "A dictionary of 9,738 entries, from a printed Kabiyè–French dictionary",
      "A keyboard for ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ — the letters no French keyboard has",
      "Free and open source. No paywall, no ads, no tracking.",
    ],
    whyChoose: "What it does",
    alphabetTitle: "Eight letters your keyboard doesn't have. Ours does.",
    dictionaryTitle: "Every word, with its meaning, in your pocket.",
    dictionaryMore: "…and 9,735 more in the app",
    sampleLesson: "How a lesson works",
    sampleLessonLead: "One word at a time. Then you write it.",
    joinCommunity: "We need a voice.",
    communityLabel: "Open source · help wanted",
    communityText:
      "Kabiyè en poche is built in the open. The largest gap is audio: no recordings exist yet, and they need a Kabiyè speaker rather than a synthesiser.",
    viewGithub: "GitHub",
    joinUs: "Record with us",
    readyToStart: "Get the app",
    downloadNow:
      "An independent, community-run project. No ads, no tracking, no paywall.",
    openKeyboard: "Open Kabiyè Keyboard",
  },
  fr: {
    title: "Kabiyè en poche",
    subtitle: "Un abécédaire de poche pour le kabiyè",
    heroLead: "Lisez-le. Écrivez-le.",
    heroWord: "Kabɩyɛ.",
    heroBody:
      "Des leçons, un dictionnaire de 9 738 mots et un clavier pour les lettres que votre téléphone n'a pas — pour la langue du nord du Togo, en français et en anglais. Gratuit, libre, sans publicité.",
    availability: "iOS sur TestFlight aujourd'hui · Android bientôt",
    glyphCaption:
      "L'une des huit lettres que le français ne peut pas écrire. Il y en a 32 en tout.",
    discoverTitle: "L'une des deux langues nationales du Togo.",
    discoverText:
      "Le kabiyè est une langue gur du nord du Togo. Ici, on le lit, on l'écrit, et on le transmet.",
    features: [
      "Des leçons qui enseignent un mot à la fois, puis vous demandent de l'écrire",
      "Un dictionnaire de 9 738 entrées, tiré d'un dictionnaire kabiyè–français imprimé",
      "Un clavier pour ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ — les lettres qu'aucun clavier français ne porte",
      "Gratuit et libre. Sans abonnement, sans publicité, sans traçage.",
    ],
    whyChoose: "Ce qu'elle fait",
    alphabetTitle: "Huit lettres que votre clavier n'a pas. Le nôtre, si.",
    dictionaryTitle: "Chaque mot, avec son sens, dans votre poche.",
    dictionaryMore: "…et 9 735 autres dans l'application",
    sampleLesson: "Comment se déroule une leçon",
    sampleLessonLead: "Un mot à la fois. Puis vous l'écrivez.",
    joinCommunity: "Il nous manque une voix.",
    communityLabel: "Libre · appel à contributions",
    communityText:
      "Kabiyè en poche se construit à découvert. Le plus grand manque, c'est l'audio : aucun enregistrement n'existe encore, et il faudra une voix kabiyè, pas un synthétiseur.",
    viewGithub: "GitHub",
    joinUs: "Enregistrer avec nous",
    readyToStart: "Obtenir l'application",
    downloadNow:
      "Un projet indépendant, porté par la communauté. Sans publicité, sans traçage, sans abonnement.",
    openKeyboard: "Ouvrir le clavier Kabiyè",
  },
};

export default function Home() {
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const detectLanguage = () => {
      const browserLang = navigator.language.split("-")[0];
      console.log(browserLang);
      return browserLang === "fr" ? "fr" : "en";
    };
    setLang(detectLanguage());
  }, []);

  const toggleLanguage = () => {
    setLang((prevLang) => (prevLang === "en" ? "fr" : "en"));
  };

  const t = translations[lang];

  return (
    <div className="mx-auto">
      <LanguageSwitcher lang={lang} onLanguageChange={toggleLanguage} />
      <KabiyeKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        lang={lang}
      />

      {/* Paper, not a photograph. The previous hero was an AI-generated image with a
          black scrim over it and white text on top -- its own alt text said so. Laterite
          has no illustration and no AI imagery: the hero is the letterform. */}
      <header className="bg-paper px-8 pt-28 pb-20">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <motion.p
              className="text-laterite text-[13px] font-semibold uppercase tracking-[0.1em]"
              {...fadeIn}
            >
              {t.subtitle}
            </motion.p>
            <motion.h1
              className="text-ink mt-4 font-semibold leading-[0.98] tracking-[-0.03em]"
              style={{ fontSize: "clamp(44px, 6vw, 84px)" }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {t.heroLead}{" "}
              <span className="kbp text-laterite">{t.heroWord}</span>
            </motion.h1>
            <motion.p
              className="text-ink-quiet mt-6 max-w-[46ch] text-[17px] leading-[1.5]"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            >
              {t.heroBody}
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.34, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <a href="#" className="w-40">
                <img src="/app-store-badge.png" alt="Download on the App Store" className="h-auto w-full" />
              </a>
              <a href="#" className="w-40">
                <img src="/google-play-badge.png" alt="Get it on Google Play" className="h-auto w-full" />
              </a>
            </motion.div>
            <p className="text-ink-quiet mt-4 text-[14px]">{t.availability}</p>
          </div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {/* line-height 0.85 makes the box shorter than the glyph, so ɖ's descender
                runs into whatever follows. The padding buys back the overhang. */}
            <div
              className="kbp text-laterite overflow-hidden font-bold leading-[0.85] tracking-[-0.04em]"
              style={{ fontSize: "clamp(160px, 20vw, 340px)", paddingBottom: "0.22em" }}
            >
              Ɖɖ
            </div>
            <p className="text-ink-quiet mx-auto mt-6 max-w-[34ch] text-[14px] leading-[1.4]">
              {t.glyphCaption}
            </p>
          </motion.div>
        </div>
      </header>
      <motion.section
        className="bg-white px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center py-16">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-ink">
              {t.discoverTitle}
            </h2>
            <p className="text-lg text-ink-quiet mb-6">{t.discoverText}</p>
            <ul className="space-y-4">
              {t.features.map((item, index) => (
                <motion.li
                  key={index}
                  className="flex items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <span className="text-laterite mr-2">✓</span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <motion.div
            className="relative h-80 rounded-lg overflow-hidden shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img
              src="/1024px-Togo_Taberma_house_02.jpg"
              alt="Beautiful landscape of Togo"
              title="Erik Kristensen, CC BY 2.0 &lt;https://creativecommons.org/licenses/by/2.0&gt;, via Wikimedia Commons"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </motion.section>
      <motion.section
        className="py-16 bg-paper px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-ink">
            {t.whyChoose}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <BookOpen
                    className="w-12 h-12 text-laterite"
                    weight="thin"
                  />
                ),
                title:
                  lang === "en"
                    ? "Learn Anytime, Anywhere"
                    : "Apprenez n'importe quand, n'importe où",
                description:
                  lang === "en"
                    ? "Our mobile app lets you learn Kabiyè at your own pace, wherever you are."
                    : "Notre application mobile vous permet d'apprendre le Kabiyè à votre rythme, où que vous soyez.",
              },
              {
                // Was "Connect with Native Speakers", promising audio from native
                // speakers. No recording exists yet, so the claim was untrue and it was
                // the first thing a learner would have caught us on. The keyboard is
                // the real differentiator and it actually ships.
                icon: (
                  <Keyboard className="w-12 h-12 text-laterite" weight="thin" />
                ),
                title:
                  lang === "en"
                    ? "Letters your keyboard doesn't have"
                    : "Les lettres que votre clavier n'a pas",
                description:
                  lang === "en"
                    ? "ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ — eight of the 32 Kabiyè letters are on no French keyboard. This one has them."
                    : "ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ — huit des 32 lettres kabiyè ne figurent sur aucun clavier français. Celui-ci les porte.",
              },
              {
                icon: (
                  <Globe className="w-12 h-12 text-laterite" weight="thin" />
                ),
                title:
                  lang === "en"
                    ? "Immerse in Culture"
                    : "Immergez-vous dans la culture",
                description:
                  lang === "en"
                    ? "Go beyond language—dive into the rich cultural heritage of the Kabiyè people."
                    : "Allez au-delà de la langue - plongez dans le riche patrimoine culturel du peuple Kabiyè.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center bg-white p-6 rounded-lg shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-ink-quiet">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
      <motion.section
        className="py-16 bg-white px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-8 text-center text-ink">
          {t.sampleLesson}
        </h2>
        <SampleLesson lang={lang} />
      </motion.section>
      <motion.section
        className="py-16 bg-paper px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-ink">
          {t.joinCommunity}
        </h2>
        <p className="text-xl mb-8 text-ink-quiet max-w-2xl mx-auto text-center">
          {t.communityText}
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6">
          <motion.a
            href="https://github.com/kabiye-lang/kabiye-en-poche"
            className="flex items-center justify-center px-6 py-3 bg-ink text-white rounded-full hover:bg-opacity-90 transition-colors text-lg font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            target="_blank"
          >
            <GithubLogo className="mr-2" /> {t.viewGithub}
          </motion.a>
          <motion.a
            href="#"
            className="flex items-center justify-center px-6 py-3 bg-ink text-white rounded-full hover:bg-opacity-90 transition-colors text-lg font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t.joinUs}
          </motion.a>
        </div>
      </motion.section>
      <motion.section
        className="py-16 bg-white px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <NewsletterSignup lang={lang} />
      </motion.section>
      <motion.section
        className="py-16 text-center bg-ink text-white px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-6">{t.readyToStart}</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          {t.downloadNow}
        </p>
        <motion.div
          className="flex justify-center space-x-4 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <a href="#" className="w-48">
            <img
              src="/google-play-badge.png"
              alt="Get it on Google Play"
              className="w-full h-auto"
            />
          </a>
          <a href="#" className="w-48">
            <img
              src="/app-store-badge.png"
              alt="Download on the App Store"
              className="w-full h-auto"
            />
          </a>
        </motion.div>
      </motion.section>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  BookOpen,
  Globe,
  Users,
  GithubLogo,
  Keyboard,
} from "@phosphor-icons/react";
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
    subtitle: "Your gateway to the Kabiyè language and culture",
    discoverTitle: "Discover Kabiyè",
    discoverText:
      "Embark on a journey to learn Kabiyè, a vibrant language spoken by over 1 million people in Togo and beyond. Connect with a rich culture and open new doors of understanding.",
    features: [
      "Interactive lessons designed for mobile learning",
      "Native speaker audio for perfect pronunciation",
      "Cultural insights to deepen your understanding",
      "Gamified experience to keep you motivated",
    ],
    whyChoose: "Why Choose Kabiyè en poche?",
    sampleLesson: "Try a Sample Lesson",
    joinCommunity: "Join Our Open Source Community",
    communityText:
      "Kabiyè en poche is an open-source project, and we welcome contributors from all backgrounds. Help us preserve and promote the Kabiyè language!",
    viewGithub: "View on GitHub",
    joinUs: "Join Our Community",
    readyToStart: "Ready to Start Your Kabiyè Journey?",
    downloadNow:
      "Download the Kabiyè en poche app now and join thousands of learners discovering the beauty of Kabiyè language and culture.",
    openKeyboard: "Open Kabiyè Keyboard",
  },
  fr: {
    title: "Kabiyè en poche",
    subtitle: "Votre passerelle vers la langue et la culture Kabiyè",
    discoverTitle: "Découvrez le Kabiyè",
    discoverText:
      "Embarquez pour un voyage d'apprentissage du Kabiyè, une langue vivante parlée par plus d'un million de personnes au Togo et au-delà. Connectez-vous à une riche culture et ouvrez de nouvelles portes de compréhension.",
    features: [
      "Leçons interactives conçues pour l'apprentissage mobile",
      "Audio de locuteurs natifs pour une prononciation parfaite",
      "Aperçus culturels pour approfondir votre compréhension",
      "Expérience ludique pour rester motivé",
    ],
    whyChoose: "Pourquoi choisir Kabiyè en poche ?",
    sampleLesson: "Essayez une leçon d'exemple",
    joinCommunity: "Rejoignez notre communauté Open Source",
    communityText:
      "Kabiyè en poche est un projet open-source, et nous accueillons les contributeurs de tous horizons. Aidez-nous à préserver et à promouvoir la langue Kabiyè !",
    viewGithub: "Voir sur GitHub",
    joinUs: "Rejoignez notre communauté",
    readyToStart: "Prêt à commencer votre voyage Kabiyè ?",
    downloadNow:
      "Téléchargez l'application Kabiyè en poche maintenant et rejoignez des milliers d'apprenants découvrant la beauté de la langue et de la culture Kabiyè.",
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
      <motion.button
        className="fixed top-16 right-4 bg-white text-[#6200EE] px-4 py-2 rounded-full shadow-md z-50 flex items-center"
        onClick={() => setIsKeyboardOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t.openKeyboard}
      >
        <Keyboard className="mr-2" size={18} />
        {t.openKeyboard}
      </motion.button>
      <KabiyeKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        lang={lang}
      />

      <header className="relative text-center py-64 px-4 overflow-hidden bg-[#6200EE]">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg-ai.webp"
            alt="Togolese cultural background, AI generated"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        <div className="relative z-10">
          <motion.h1
            className="text-6xl font-bold mb-6 text-white text-shadow"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {t.title}
          </motion.h1>
          <motion.p
            className="text-2xl mb-8 text-white text-shadow max-w-2xl mx-auto"
            {...fadeIn}
          >
            {t.subtitle}
          </motion.p>
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
            <h2 className="text-3xl font-bold mb-4 text-[#212121]">
              {t.discoverTitle}
            </h2>
            <p className="text-lg text-[#757575] mb-6">{t.discoverText}</p>
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
                  <span className="text-[#03DAC6] mr-2">✓</span>
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
        className="py-16 bg-[#F5F5F5] px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-[#212121]">
            {t.whyChoose}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <BookOpen
                    className="w-12 h-12 text-[#6200EE]"
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
                icon: (
                  <Users className="w-12 h-12 text-[#6200EE]" weight="thin" />
                ),
                title:
                  lang === "en"
                    ? "Connect with Native Speakers"
                    : "Connectez-vous avec des locuteurs natifs",
                description:
                  lang === "en"
                    ? "Practice with audio from native Kabiyè speakers to perfect your pronunciation."
                    : "Pratiquez avec l'audio de locuteurs natifs Kabiyè pour perfectionner votre prononciation.",
              },
              {
                icon: (
                  <Globe className="w-12 h-12 text-[#6200EE]" weight="thin" />
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
                <p className="text-[#757575]">{feature.description}</p>
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
        <h2 className="text-3xl font-bold mb-8 text-center text-[#212121]">
          {t.sampleLesson}
        </h2>
        <SampleLesson lang={lang} />
      </motion.section>
      <motion.section
        className="py-16 bg-[#F5F5F5] px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-[#212121]">
          {t.joinCommunity}
        </h2>
        <p className="text-xl mb-8 text-[#757575] max-w-2xl mx-auto text-center">
          {t.communityText}
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6">
          <motion.a
            href="https://github.com/kabiye-lang/kabiye-en-poche"
            className="flex items-center justify-center px-6 py-3 bg-[#6200EE] text-white rounded-full hover:bg-opacity-90 transition-colors text-lg font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            target="_blank"
          >
            <GithubLogo className="mr-2" /> {t.viewGithub}
          </motion.a>
          <motion.a
            href="#"
            className="flex items-center justify-center px-6 py-3 bg-[#03DAC6] text-white rounded-full hover:bg-opacity-90 transition-colors text-lg font-semibold"
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
        className="py-16 text-center bg-[#6200EE] text-white px-4"
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

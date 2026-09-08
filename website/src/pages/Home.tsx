import { useState, useEffect } from "react";
import { GithubLogo } from "@phosphor-icons/react";
import { motion } from "motion/react";
import NewsletterSignup from "@/components/newsletter-signup";
import KabiyeKeyboard from "@/components/kabiye-keyboard";
import Lockup from "@/components/lockup";

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
    statEntries: "dictionary entries",
    statLanguages: "languages — Kabiyè, French, English",
    statLetters: "letters, 8 not in French",
    statPrice: "forever — no paywall, no ads",
    padPlaceholder: "Tap a letter to write it here",
    padDelete: "Delete",
    padClear: "Clear",
    padCopy: "Copy",
    padCopied: "Copied",
    navDictionary: "Dictionary",
    navAlphabet: "Alphabet",
    navLessons: "Lessons",
    navContribute: "Contribute",
    audienceTitle: "Who it's for",
    audienceLead: "Three ways to arrive at the same word.",
    audienceSpeaker: "I speak it. I want to write it.",
    audienceSpeakerBody:
      "The path starts with the alphabet and spelling — ɩ against i, ʋ against u. The dictionary is your spell-checker.",
    audienceHeritage: "I grew up hearing it.",
    audienceHeritageBody:
      "Words you half-know, made whole. Short private lessons, each ending with the words you met, saved to your own list.",
    audienceNew: "I'm new to it.",
    audienceNewBody:
      "Greetings and everyday words first — practical Kabiyè for living and working in the Kara region.",
    // The mock says "five words"; the generator asks for four to eight, so the site
    // says what the app does rather than what the mock guessed.
    howBody:
      "Every lesson teaches a handful of words. Each is shown, explained letter by letter, and then you spell it with the Kabiyè keyboard. Mistakes come back at the end. There is no score — just the words you can now read and write, each linking to its dictionary entry.",
    howProvenance:
      "Every word, example and sentence in a lesson traces to a source. Nothing is generated. Where we have no recording, you hear nothing — a wrong voice teaches a wrong word.",
    shotTeach: "Teach — the word, letter by letter",
    shotSpell: "Spell it — on the Kabiyè keyboard",
    contributeRoles: [
      {
        title: "Speakers",
        body: "Lend your voice to the words and phrases in the lessons.",
      },
      {
        title: "Teachers",
        body: "Read new lessons before they ship and tell us what a learner would stumble on.",
      },
      {
        title: "Developers",
        body: "The app is open source. Pick an issue, or bring your own.",
      },
      {
        title: "Everyone",
        body: "Spotted a word that is wrong or missing? Tell us from inside the app.",
      },
    ],
    footerTagline: "sɔɔlɩm — love.",
    footerProject: "Project",
    footerLinks: ["Dictionary", "Alphabet", "Lessons", "Contribute"],
    footerMore: "More",
    footerMoreLinks: ["GitHub", "Sources & licences", "Privacy", "Terms"],
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
    statEntries: "entrées du dictionnaire",
    statLanguages: "langues — kabiyè, français, anglais",
    statLetters: "lettres, dont 8 absentes du français",
    statPrice: "pour toujours — sans abonnement, sans publicité",
    padPlaceholder: "Touchez une lettre pour l'écrire ici",
    padDelete: "Supprimer",
    padClear: "Effacer",
    padCopy: "Copier",
    padCopied: "Copié",
    navDictionary: "Dictionnaire",
    navAlphabet: "Alphabet",
    navLessons: "Leçons",
    navContribute: "Contribuer",
    audienceTitle: "À qui s'adresse-t-elle",
    audienceLead: "Trois façons d'arriver au même mot.",
    audienceSpeaker: "Je le parle. Je veux l'écrire.",
    audienceSpeakerBody:
      "Le parcours commence par l'alphabet et l'orthographe — ɩ face à i, ʋ face à u. Le dictionnaire fait office de correcteur.",
    audienceHeritage: "J'ai grandi en l'entendant.",
    audienceHeritageBody:
      "Les mots à moitié connus, rendus entiers. De courtes leçons privées, chacune se terminant par les mots rencontrés, gardés dans votre liste.",
    audienceNew: "Je le découvre.",
    audienceNewBody:
      "D'abord les salutations et les mots de tous les jours — du kabiyè utile pour vivre et travailler dans la région de la Kara.",
    howBody:
      "Chaque leçon enseigne une poignée de mots. Chacun est montré, expliqué lettre par lettre, puis vous l'écrivez avec le clavier kabiyè. Les erreurs reviennent à la fin. Il n'y a pas de score — seulement les mots que vous savez désormais lire et écrire, chacun renvoyant à son entrée du dictionnaire.",
    howProvenance:
      "Chaque mot, exemple et phrase d'une leçon remonte à une source. Rien n'est inventé. Là où nous n'avons pas d'enregistrement, vous n'entendez rien — une mauvaise voix enseigne un mauvais mot.",
    shotTeach: "Apprendre — le mot, lettre par lettre",
    shotSpell: "L'écrire — sur le clavier kabiyè",
    contributeRoles: [
      {
        title: "Locuteurs",
        body: "Prêtez votre voix aux mots et aux phrases des leçons.",
      },
      {
        title: "Enseignants",
        body: "Relisez les nouvelles leçons avant leur sortie et dites-nous où un apprenant trébucherait.",
      },
      {
        title: "Développeurs",
        body: "L'application est libre. Prenez un ticket, ou apportez le vôtre.",
      },
      {
        title: "Tout le monde",
        body: "Un mot faux ou manquant ? Signalez-le depuis l'application.",
      },
    ],
    footerTagline: "sɔɔlɩm — l'amour.",
    footerProject: "Le projet",
    footerLinks: ["Dictionnaire", "Alphabet", "Leçons", "Contribuer"],
    footerMore: "Plus",
    footerMoreLinks: ["GitHub", "Sources et licences", "Confidentialité", "Conditions"],
  },
};

/** The 32 Kabiyè letters, in the order the alphabet teaches them. */
const ALPHABET = [
  "a", "aɣ", "b", "c", "d", "ɖ", "e", "eɣ", "ɛ", "ɛɣ", "f", "g", "gb", "ɣ", "h", "i",
  "iɣ", "ɩ", "ɩɣ", "j", "k", "kp", "l", "m", "n", "ñ", "ŋ", "o", "ɔ", "p", "r", "s",
];

/** The eight a French keyboard cannot reach. These are the laterite tiles. */
const KABIYE_ONLY = "ɖɛɣɩŋɔʋñ";

export default function Home() {
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [pad, setPad] = useState("");
  const [copied, setCopied] = useState(false);
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

  const handleCopyPad = async () => {
    if (!pad) return;
    await navigator.clipboard.writeText(pad);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const t = translations[lang];

  return (
    <div className="mx-auto">
      {/* Sticky rather than floating: the old EN|FR button hovered over the hero with
          nothing around it, and the direction asks for a nav that names the four things
          the site is about. Anchors, because this is one page. */}
      <nav className="border-line bg-paper/90 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-8 py-4">
          <a href="#top" aria-label={t.title}>
            <Lockup className="h-8 w-auto" />
          </a>
          <div className="hidden flex-1 items-center gap-6 md:flex">
            {(
              [
                ['#dictionary', t.navDictionary],
                ['#alphabet', t.navAlphabet],
                ['#lessons', t.navLessons],
                ['#contribute', t.navContribute],
              ] as const
            ).map(([href, label]) => (
              <a key={href} href={href} className="text-ink-quiet hover:text-ink text-[15px]">
                {label}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleLanguage}
            className="border-ink text-ink ml-auto rounded-full border-[1.5px] px-4 py-2 text-[14px] font-semibold md:ml-0"
            aria-label={lang === "en" ? "Switch to French" : "Switch to English"}
          >
            {lang === "en" ? "FR" : "EN"}
          </button>
          <a
            href="#get-the-app"
            className="bg-ink rounded-full px-5 py-2 text-[14px] font-semibold text-white"
          >
            {t.readyToStart}
          </a>
        </div>
      </nav>
      <KabiyeKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        lang={lang}
      />

      {/* Paper, not a photograph. The previous hero was an AI-generated image with a
          black scrim over it and white text on top -- its own alt text said so. Laterite
          has no illustration and no AI imagery: the hero is the letterform. */}
      <header id="top" className="bg-paper px-8 pt-20 pb-20">
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

      {/* Four numbers, all of them checkable. The dictionary count is the one no
          neighbouring product can copy; "0 € forever" is a commitment, not a promise
          about a trial. */}
      <section className="bg-ink px-8 py-14">
        <div className="mx-auto grid max-w-[1200px] gap-8 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          {[
            { n: "9,738", label: t.statEntries },
            { n: "3", label: t.statLanguages },
            { n: "32", label: t.statLetters },
            { n: "0 €", label: t.statPrice },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-paper text-[44px] font-semibold leading-[1.0]">{stat.n}</div>
              <div className="text-paper/70 mt-2 text-[15px] leading-[1.35]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* The alphabet, playable. Tapping a tile appends the letter to the pad, so a
          visitor can produce a Kabiyè letter before installing anything -- which is the
          single most convincing thing this site can do. */}
      <section id="dictionary" className="bg-paper px-8 py-20">
        <div className="mx-auto max-w-[1200px]">
          <h2
            className="text-ink font-semibold leading-[1.02] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
          >
            {t.alphabetTitle}
          </h2>
          <div className="mt-10 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(88px,1fr))]">
            {ALPHABET.map((letter) => {
              const special = KABIYE_ONLY.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => setPad((value) => value + letter)}
                  aria-label={letter}
                  className={
                    special
                      ? "kbp bg-laterite aspect-square rounded-xl text-[30px] font-bold text-white transition-transform hover:-translate-y-[3px] active:scale-[0.94]"
                      : "kbp bg-leaf border-line text-ink aspect-square rounded-xl border text-[30px] font-bold transition-transform hover:-translate-y-[3px] active:scale-[0.94]"
                  }
                >
                  {letter}
                </button>
              );
            })}
          </div>

          <div className="border-ink mt-8 rounded-[14px] border-[1.5px] p-5">
            <div className="kbp text-ink min-h-[44px] break-words text-[28px]" aria-live="polite">
              {pad || <span className="text-ink-quiet text-[17px]">{t.padPlaceholder}</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setPad((value) => [...value].slice(0, -1).join(""))}
                className="border-ink text-ink rounded-full border-[1.5px] px-5 py-2 text-[15px] font-semibold"
              >
                {t.padDelete}
              </button>
              <button
                onClick={() => setPad("")}
                className="border-ink text-ink rounded-full border-[1.5px] px-5 py-2 text-[15px] font-semibold"
              >
                {t.padClear}
              </button>
              <button
                onClick={handleCopyPad}
                className="bg-ink text-paper rounded-full px-5 py-2 text-[15px] font-semibold"
              >
                {copied ? t.padCopied : t.padCopy}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* The same three audiences onboarding asks about, so the site and the app agree
          about who this is for. Each card is headed by a letter from that audience's
          first lesson. */}
      <section id="alphabet" className="bg-paper px-8 pb-20">
        <div className="mx-auto max-w-[1200px]">
          <h2
            className="text-ink font-semibold leading-[1.02] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
          >
            {t.audienceTitle}
          </h2>
          <p className="text-ink-quiet mt-3 text-[18px]">{t.audienceLead}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                glyph: "ɩ",
                title: t.audienceSpeaker,
                body: t.audienceSpeakerBody,
                ink: false,
              },
              {
                glyph: "Ɛ",
                title: t.audienceHeritage,
                body: t.audienceHeritageBody,
                ink: true,
              },
              {
                glyph: "Ŋ",
                title: t.audienceNew,
                body: t.audienceNewBody,
                ink: false,
              },
            ].map((card) => (
              <div
                key={card.title}
                className={
                  card.ink
                    ? "bg-ink rounded-[18px] p-7"
                    : "border-ink rounded-[18px] border-[1.5px] p-7"
                }
              >
                <div
                  className={
                    card.ink
                      ? "kbp text-paper/60 text-[56px] font-bold leading-[1]"
                      : "kbp text-laterite text-[56px] font-bold leading-[1]"
                  }
                >
                  {card.glyph}
                </div>
                <p
                  className={
                    card.ink
                      ? "text-paper mt-5 text-[20px] leading-[1.3]"
                      : "text-ink mt-5 text-[20px] leading-[1.3]"
                  }
                >
                  {card.title}
                </p>
                <p
                  className={
                    card.ink
                      ? "text-paper/70 mt-3 text-[15px] leading-[1.5]"
                      : "text-ink-quiet mt-3 text-[15px] leading-[1.5]"
                  }
                >
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How a lesson works. The two shots are the app's own Teach and Spell steps —
          the provenance note under them is the project's first principle, so it is on
          the page rather than only in the repo. */}
      <section id="lessons" className="bg-paper-recessed px-8 py-20">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 md:grid-cols-2">
          <div>
            <h2
              className="text-ink font-semibold leading-[1.02] tracking-[-0.02em]"
              style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
            >
              {t.sampleLesson}
            </h2>
            <p className="text-ink mt-4 text-[22px] leading-[1.3]">
              {t.sampleLessonLead}
            </p>
            <p className="text-ink-quiet mt-5 text-[17px] leading-[1.6]">
              {t.howBody}
            </p>
            <p className="border-line text-ink-quiet mt-6 border-l-[3px] pl-4 text-[15px] leading-[1.6]">
              {t.howProvenance}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[
              { src: "/app-teach.png", caption: t.shotTeach },
              { src: "/app-spell.png", caption: t.shotSpell },
            ].map((shot) => (
              <figure key={shot.src}>
                <img
                  src={shot.src}
                  alt={shot.caption}
                  className="border-line w-full rounded-[22px] border"
                />
                <figcaption className="text-ink-quiet mt-3 text-[13px] leading-[1.4]">
                  {shot.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

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
            className="border-line relative h-80 overflow-hidden rounded-[18px] border"
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
      {/* Contribute. Laterite ground — the one place the accent carries a whole
          section, and the only ask on the page. */}
      <section id="contribute" className="bg-laterite px-8 py-20 text-white">
        <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-2">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.14em] text-white/70 uppercase">
              {t.communityLabel}
            </p>
            <h2
              className="mt-4 font-semibold leading-[1.02] tracking-[-0.02em]"
              style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
            >
              {t.joinCommunity}
            </h2>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-[1.6] text-white/85">
              {t.communityText}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="mailto:hello@kabiye-en-poche.org?subject=Record%20with%20us"
                className="bg-ink rounded-full px-6 py-3 text-[16px] font-semibold text-white"
              >
                {t.joinUs}
              </a>
              <a
                href="https://github.com/kabiye-lang/kabiye-en-poche"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full border-[1.5px] border-white/70 px-6 py-3 text-[16px] font-semibold"
              >
                <GithubLogo weight="bold" /> {t.viewGithub}
              </a>
            </div>
          </div>
          <ul className="divide-y divide-white/25 border-y border-white/25">
            {t.contributeRoles.map((role) => (
              <li key={role.title} className="py-5">
                <p className="text-[18px] font-semibold">{role.title}</p>
                <p className="mt-1 text-[15px] leading-[1.5] text-white/80">
                  {role.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper px-8 py-20">
        <NewsletterSignup lang={lang} />
      </section>

      <footer id="get-the-app" className="bg-ink text-paper px-8 py-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <p className="text-[22px] font-semibold">{t.title}</p>
              <p className="kbp text-paper/60 mt-2 text-[18px]">
                {t.footerTagline}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <a href="#" className="w-36">
                  <img
                    src="/app-store-badge.png"
                    alt="Download on the App Store"
                    className="h-auto w-full"
                  />
                </a>
                <a href="#" className="w-36">
                  <img
                    src="/google-play-badge.png"
                    alt="Get it on Google Play"
                    className="h-auto w-full"
                  />
                </a>
              </div>
            </div>
            {[
              { heading: t.footerProject, links: t.footerLinks },
              { heading: t.footerMore, links: t.footerMoreLinks },
            ].map((column) => (
              <div key={column.heading}>
                <p className="text-paper/60 text-[13px] font-semibold tracking-[0.14em] uppercase">
                  {column.heading}
                </p>
                <ul className="mt-4 space-y-2">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-paper/85 text-[15px]">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-paper/55 mt-12 border-t border-white/15 pt-8 text-[14px]">
            {t.downloadNow}
          </p>
        </div>
      </footer>
    </div>
  );
}

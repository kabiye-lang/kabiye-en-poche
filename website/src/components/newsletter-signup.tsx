import { useState } from "react";
import { motion } from "motion/react";

interface NewsletterSignupProps {
  lang: "en" | "fr";
}

const translations = {
  en: {
    label: "Newsletter",
    title: "A word a week, and what's new.",
    description:
      "One email. Word of the week with its entry, plus new lessons as they land. Unsubscribe any time.",
    placeholder: "you@example.com",
    button: "Subscribe",
    success: "Thank you for subscribing.",
    error: "Something went wrong. Please try again.",
  },
  fr: {
    label: "Infolettre",
    title: "Un mot par semaine, et les nouveautés.",
    description:
      "Un seul courriel. Le mot de la semaine avec son entrée, et les nouvelles leçons dès leur sortie. Désabonnement à tout moment.",
    placeholder: "vous@exemple.com",
    button: "S'abonner",
    success: "Merci de votre abonnement.",
    error: "Une erreur s'est produite. Veuillez réessayer.",
  },
};

export default function NewsletterSignup({ lang }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    // TODO: Implement actual newsletter signup logic
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulating success for now
    setStatus("success");
    setEmail("");
  };

  return (
    <motion.div
      className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div>
        <p className="text-ink-quiet text-[13px] font-semibold tracking-[0.14em] uppercase">
          {t.label}
        </p>
        <h2
          className="text-ink mt-4 font-semibold leading-[1.02] tracking-[-0.02em]"
          style={{ fontSize: "clamp(28px, 3.4vw, 44px)" }}
        >
          {t.title}
        </h2>
        <p className="text-ink-quiet mt-4 max-w-[46ch] text-[17px] leading-[1.6]">
          {t.description}
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            className="border-ink text-ink placeholder:text-ink-quiet grow rounded-full border-[1.5px] bg-transparent px-6 py-3 text-[16px] focus:outline-hidden"
            required
            aria-label={t.placeholder}
          />
          <motion.button
            type="submit"
            className="bg-ink rounded-full px-7 py-3 text-[16px] font-semibold text-white"
            whileTap={{ scale: 0.96 }}
            disabled={status === "loading"}
          >
            {status === "loading" ? "…" : t.button}
          </motion.button>
        </div>
        {/* No green tick, no red banner — feedback is ink and laterite, as everywhere
            else in this system. */}
        {status === "success" && (
          <p className="text-ink mt-4 text-[15px]">{t.success}</p>
        )}
        {status === "error" && (
          <p className="text-laterite mt-4 text-[15px]">{t.error}</p>
        )}
      </form>
    </motion.div>
  );
}

import { useState } from "react";
import { motion } from "motion/react";

interface NewsletterSignupProps {
  lang: "en" | "fr";
}

const translations = {
  en: {
    title: "Stay Updated",
    description:
      "Subscribe to our newsletter for the latest Kabiyè en poche updates and Kabiyè learning tips.",
    placeholder: "Enter your email",
    button: "Subscribe",
    success: "Thank you for subscribing!",
    error: "An error occurred. Please try again.",
  },
  fr: {
    title: "Restez Informé",
    description:
      "Abonnez-vous à notre newsletter pour les dernières mises à jour de Kabiyè en poche et des conseils d'apprentissage du Kabiyè.",
    placeholder: "Entrez votre email",
    button: "S'abonner",
    success: "Merci de vous être abonné !",
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
      className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-2xl font-bold mb-4 text-[#6200EE]">{t.title}</h3>
      <p className="text-[#757575] mb-6">{t.description}</p>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            className="grow px-4 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#6200EE]"
            required
            aria-label={t.placeholder}
          />
          <motion.button
            type="submit"
            className="px-6 py-2 bg-[#FF5722] text-white rounded-md hover:bg-opacity-90 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={status === "loading"}
          >
            {status === "loading" ? "..." : t.button}
          </motion.button>
        </div>
      </form>
      {status === "success" && (
        <p className="mt-4 text-green-600">{t.success}</p>
      )}
      {status === "error" && <p className="mt-4 text-red-600">{t.error}</p>}
    </motion.div>
  );
}

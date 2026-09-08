/* The logo lockup: the K bubble, the ɖɛɣ bubble replying, and the wordmark.
   Geometry is logo_export/svg/lockup.svg on its 176x48 viewBox.

   Inline rather than <img src="/lockup.svg">: the exported SVG sets its type in Andika
   and Bricolage, and an SVG loaded through <img> cannot reach the page's fonts, so it
   would fall back to whatever the browser has and the wordmark would come out wrong.
   Inlined, it uses the two faces index.css already loads. The exported file leaves the
   weights to its .kbp/.ui classes, which do not exist here -- they are set explicitly
   below, Andika Bold and Bricolage 600, as the logo specifies. */
export default function Lockup({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 176 48"
      className={className}
      role="img"
      aria-label="Kabiyè en Poche"
    >
      {/* K bubble */}
      <path
        d="M10 4h14a8 8 0 0 1 8 8v6a8 8 0 0 1-8 8H2V12a8 8 0 0 1 8-8z"
        className="fill-laterite"
      />
      <path d="M2 26h6l-6 6z" className="fill-laterite" />
      <text
        x="17"
        y="15"
        fontFamily="var(--font-kabiye)"
        fontSize="15"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-paper"
      >
        K
      </text>

      {/* the reply */}
      <path
        d="M27 24h12a7 7 0 0 1 7 7v9H27a7 7 0 0 1-7-7v-2a7 7 0 0 1 7-7z"
        className="fill-ink"
      />
      <path d="M46 40v6l-6-6z" className="fill-ink" />
      <text
        x="33"
        y="32"
        fontFamily="var(--font-kabiye)"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.18"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-paper"
      >
        ɖɛɣ
      </text>

      {/* wordmark */}
      <text
        x="58"
        y="19"
        fontFamily="var(--font-kabiye)"
        fontSize="30"
        fontWeight="700"
        letterSpacing="-0.9"
        dominantBaseline="central"
        className="fill-ink"
      >
        Kabiyè
      </text>
      <text
        x="58"
        y="40"
        fontFamily="var(--font-sans)"
        fontSize="11"
        fontWeight="600"
        letterSpacing="1.76"
        dominantBaseline="central"
        className="fill-laterite"
      >
        EN POCHE
      </text>
    </svg>
  );
}

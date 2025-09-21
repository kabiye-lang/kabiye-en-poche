/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand colors from your design system
        primary: '#6200EE',
        secondary: '#03DAC6',
        accent: '#FF5722',
        'bg-grey': '#F5F5F5',
        'text-dark': '#212121',
        'text-light': '#FFFFFF',
        'text-grey': '#757575',

        // Letter type colors
        grapheme: '#7577CD',
        vowel: '#29ADB2',
        consonant: '#0766AD',
        indication: '#968C83',
      },
      fontFamily: {
        // IBM Plex Sans Hebrew fonts
        'ibm-thin': ['IBMPlexSansHebrew_100Thin'],
        'ibm-extralight': ['IBMPlexSansHebrew_200ExtraLight'],
        'ibm-light': ['IBMPlexSansHebrew_300Light'],
        'ibm-regular': ['IBMPlexSansHebrew_400Regular'],
        'ibm-medium': ['IBMPlexSansHebrew_500Medium'],
        'ibm-semibold': ['IBMPlexSansHebrew_600SemiBold'],
        'ibm-bold': ['IBMPlexSansHebrew_700Bold'],

        // Figtree fonts
        'fig-light': ['Figtree_300Light'],
        'fig-light-italic': ['Figtree_300Light_Italic'],
        'fig-regular': ['Figtree_400Regular'],
        'fig-regular-italic': ['Figtree_400Regular_Italic'],
        'fig-medium': ['Figtree_500Medium'],
        'fig-medium-italic': ['Figtree_500Medium_Italic'],
        'fig-semibold': ['Figtree_600SemiBold'],
        'fig-semibold-italic': ['Figtree_600SemiBold_Italic'],
        'fig-bold': ['Figtree_700Bold'],
        'fig-bold-italic': ['Figtree_700Bold_Italic'],
        'fig-extrabold': ['Figtree_800ExtraBold'],
        'fig-extrabold-italic': ['Figtree_800ExtraBold_Italic'],
        'fig-black': ['Figtree_900Black'],
        'fig-black-italic': ['Figtree_900Black_Italic'],
      },
      fontSize: {
        xs: ['10px', '13px'], // xs
        sm: ['12px', '15px'], // sm
        base: ['14px', '16px'], // normal
        lg: ['16px', '22px'], // lg
        xl: ['18px', '24px'], // h6
        '2xl': ['20px', '28px'], // h5
        '3xl': ['24px', '32px'], // h4
        '4xl': ['28px', '36px'], // h3
        '5xl': ['32px', '40px'], // h2
        '6xl': ['36px', '42px'], // h1
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 2px 2px rgba(0, 0, 0, 0.2)',
        'card-lg': '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F4F1FD',
          100: '#E9E2FB',
          200: '#D5C7F7',
          300: '#B8A1F1',
          400: '#9472EB',
          500: '#7A57E8',
          600: '#6038D8', // Primary deep royal purple
          700: '#502EC2',
          800: '#4124A0',
          900: '#341D7F',
          950: '#1F1054',
        },
        coral: {
          50: '#FFF4F1',
          100: '#FFE6E0',
          200: '#FFD0C5',
          300: '#FFAF9D',
          400: '#FF886F',
          500: '#FF7657', // Accent vivid coral
          600: '#E85B3A',
          700: '#C74424',
          800: '#9E341B',
          900: '#7A2C18',
        },
        surface: {
          warm: '#FAF9F6', // Main background warm white
          card: '#FFFFFF',
          subtle: '#F4F2EC',
          border: '#E6E4DF',
        },
        charcoal: {
          50: '#F5F5F7',
          100: '#E5E5EB',
          200: '#C7C7D4',
          300: '#A4A4B8',
          400: '#707080', // Secondary text muted grey
          500: '#505060',
          600: '#3A3A48',
          700: '#2A2A35',
          800: '#1F1F28',
          900: '#191923', // Primary text deep charcoal
        },
        emerald: {
          50: '#E8F7EE',
          100: '#C5EDD5',
          500: '#108A4E', // Accessible success green
          600: '#0B6F3E',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(25, 25, 35, 0.05), 0 1px 2px rgba(25, 25, 35, 0.03)',
        'soft-md': '0 4px 14px rgba(25, 25, 35, 0.07), 0 2px 6px rgba(25, 25, 35, 0.04)',
        'soft-lg': '0 10px 25px rgba(25, 25, 35, 0.09), 0 4px 10px rgba(25, 25, 35, 0.05)',
        'purple-glow': '0 8px 24px rgba(96, 56, 216, 0.22)',
        'coral-glow': '0 8px 24px rgba(255, 118, 87, 0.28)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

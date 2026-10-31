/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cam: 'rgb(var(--accent) / <alpha-value>)',
        camDam: 'rgb(var(--accent-dark) / <alpha-value>)',
        camNhat: 'rgb(var(--accent-light) / <alpha-value>)',
        kem: 'rgb(var(--page, 237 242 253) / <alpha-value>)',
        vutru: '#14204A',
        vutruNhat: '#56618A',
        sao: '#FFB020',
        night: {
          page: '#0D1426',
          body: '#0D1426',
          surface: '#152038',
          elevated: '#1D2A46',
          border: '#2A3858',
          muted: '#94A2C4',
          text: '#E9EEF8',
        },
        edu: {
          blue: '#E0F2FE', // soft blue
          green: '#DCFCE7', // soft green
          yellow: '#FEF9C3', // soft yellow
          purple: '#F3E8FF', // soft purple
          red: '#FEE2E2', // soft red
        }
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        body: ['Lexend', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        cam: 'var(--shadow-accent, 0 8px 24px rgba(47,107,255,.18))',
        soft: '0 1px 2px rgba(20,32,74,.06), 0 8px 24px -12px rgba(20,32,74,.16)',
        bouncy: '0 4px 0px rgba(0,0,0,0.1)',
      },
      accentColor: {
        cam: 'rgb(var(--accent) / <alpha-value>)',
      },
      borderRadius: {
        xl: '18px',
        '2xl': '24px',
        '3xl': '32px',
      },
      animation: {
        'bounce-sm': 'bounceSm 2s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        bounceSm: {
          '0%, 100%': { transform: 'translateY(-2%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}

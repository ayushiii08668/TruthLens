/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F9FC',
        surface: '#FFFFFF',
        brand: {
          blue: '#2457D6',
          teal: '#12A88A',
          orange: '#F28A45',
        },
        slate: {
          main: '#172B4D',
          muted: '#64748B',
          border: '#E5EAF2',
        },
        verdict: {
          success: '#16865D',
          warning: '#D68A22',
          danger: '#D64B55',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(23, 43, 77, 0.04), 0 1px 2px -1px rgba(23, 43, 77, 0.04)',
        'editorial': '0 4px 12px 0 rgba(23, 43, 77, 0.06), 0 1px 3px 0 rgba(23, 43, 77, 0.04)',
        'elevated': '0 10px 25px -5px rgba(23, 43, 77, 0.08), 0 8px 10px -6px rgba(23, 43, 77, 0.04)',
      }
    },
  },
  plugins: [],
}


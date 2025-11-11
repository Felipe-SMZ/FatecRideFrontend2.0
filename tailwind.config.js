// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Cores da FATEC
        fatec: {
          red: '#E31E24',
          blue: '#0057B7',
          'blue-dark': '#003F8A',
          'blue-light': '#4D88E8'
        },
        // Cores do sistema
        primary: {
          DEFAULT: '#0057B7',
          hover: '#003F8A',
          light: '#E6F0FF'
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px'
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.15)'
      }
    }
  },
  plugins: []
}
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Identidade Visual FatecRide
        fatecride: {
          blue: '#0052cc',
          'blue-dark': '#003d99',
          'blue-darker': '#002966',
          'blue-light': '#3377dd',
          'blue-lighter': '#f5f9ff',
        },
        // Cores do sistema
        primary: {
          DEFAULT: '#0052cc',
          hover: '#003d99',
          dark: '#002966',
          light: '#f5f9ff'
        },
        text: {
          primary: '#333333',
          secondary: '#666666',
          light: '#999999'
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#0052cc'
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px'
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.15)'
      }
    }
  },
  plugins: []
}
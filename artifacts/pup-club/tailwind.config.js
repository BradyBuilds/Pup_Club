/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:         '#0B0A07',
        surface:    '#1A1712',
        elevated:   '#252218',
        border:     '#3A3220',
        gold:       '#C9922A',
        'gold-lt':  '#F0C040',
        'gold-dk':  '#7A5C10',
        'gold-dim': '#6B5010',
        red:        '#CC2200',
        'red-lt':   '#FF3B1A',
        cream:      '#F5E0C0',
        'cream-dk': '#BFA882',
        ink:        '#E8D8B8',
        muted:      '#7A6A50',
        chain:      '#B8922A',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        script:  ['Pacifico', 'cursive'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F0C040, #C9922A, #7A5C10)',
        'gold-shine':    'linear-gradient(105deg, #7A5C10 0%, #F0C040 45%, #C9922A 55%, #7A5C10 100%)',
        'dark-gradient': 'linear-gradient(180deg, #252218 0%, #1A1712 100%)',
        'card-gradient': 'linear-gradient(145deg, #2A2518 0%, #1A1712 100%)',
      },
    },
  },
  plugins: [],
}

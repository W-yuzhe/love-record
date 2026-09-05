import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: {
          DEFAULT: '#0B0812',
          light: '#151025',
        },
        star: {
          pink: '#FFB8D0',
          rose: '#FF6B9D',
          gold: '#FFE4A1',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.12)',
          border: 'rgba(255, 255, 255, 0.16)',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'love-gradient': 'linear-gradient(135deg, #FF8FA3 0%, #FF6B9D 50%, #FFB86C 100%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'glow': '0 0 40px rgba(255, 107, 157, 0.3)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'cloud-drift': 'cloud-drift 20s ease-in-out infinite',
        'cloud-drift-slow': 'cloud-drift 35s ease-in-out infinite reverse',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.8s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'cloud-drift': {
          '0%, 100%': { transform: 'translateX(-8%) translateY(0)' },
          '50%': { transform: 'translateX(8%) translateY(-4%)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

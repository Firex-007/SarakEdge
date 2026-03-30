/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        'base':        '#07090e',
        'surface':     '#0d1117',
        'surface-2':   '#131a24',
        'surface-3':   '#1a2332',
        'border':      'rgba(255,255,255,0.06)',
        // Live accent — cyan-teal
        'live':        '#1affd4',
        'live-dim':    '#0fd4ae',
        'live-glow':   'rgba(26,255,212,0.12)',
        // Buffered accent — amber
        'buf':         '#ffab40',
        'buf-dim':     '#e0932e',
        'buf-glow':    'rgba(255,171,64,0.12)',
        // Text
        'text-1':      '#e2eaf4',
        'text-2':      '#7b92aa',
        'text-3':      '#445566',
      },
      fontFamily: {
        sans:  ['var(--font-space)', 'sans-serif'],
        mono:  ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'pulse-live':  'pulse-live 2s ease-in-out infinite',
        'pulse-buf':   'pulse-buf 2s ease-in-out infinite',
        'slide-in':    'slide-in 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':     'fade-in 0.3s ease',
        'count-up':    'count-up 0.5s ease',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(26,255,212,0.4)' },
          '50%':       { boxShadow: '0 0 0 6px rgba(26,255,212,0)' },
        },
        'pulse-buf': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,171,64,0.5)' },
          '50%':       { boxShadow: '0 0 0 6px rgba(255,171,64,0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(26,255,212,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(26,255,212,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
}

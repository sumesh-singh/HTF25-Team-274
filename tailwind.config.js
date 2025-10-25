/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": {
          DEFAULT: "#4338CA",
          light: "#6366F1",
          dark: "#312E81"
        },
        "background-light": "#F8F7FF",
        "background-dark": "#111827",
        "secondary": "#10B981",
        "text-light-primary": "#1F2937",
        "text-light-secondary": "#6B7280",
        "text-dark-primary": "#F9FAFB",
        "text-dark-secondary": "#9CA3AF",
        "card-light": "#FFFFFF",
        "card-dark": "#1F2937",
        "border-light": "#E5E7EB",
        "border-dark": "#374151",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "full": "9999px"
      },
      animation: {
        'card-entry': 'card-entry-animation 0.5s ease-out forwards',
        'notification-feed': 'notification-feed-animation 0.4s ease-out forwards'
      },
      keyframes: {
        'card-entry-animation': {
          'to': {
            opacity: 1,
            transform: 'translateY(0)',
          }
        },
        'notification-feed-animation': {
          'to': {
            opacity: 1,
            transform: 'translateX(0)',
          }
        }
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

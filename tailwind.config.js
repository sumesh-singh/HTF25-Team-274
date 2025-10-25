/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4338CA",
          light: "#6366F1",
          dark: "#312E81",
        },
        "background-light": "#F8F7FF",
        "background-dark": "#111827",
        secondary: "#10B981",
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
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px",
      },
      animation: {
        "card-entry": "card-entry-animation 0.5s ease-out forwards",
        "notification-feed":
          "notification-feed-animation 0.4s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
      },
      keyframes: {
        "card-entry-animation": {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "notification-feed-animation": {
          from: { opacity: 0, transform: "translateX(-20px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "slide-in-right": {
          from: { opacity: 0, transform: "translateX(20px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: 0, transform: "translateX(-20px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

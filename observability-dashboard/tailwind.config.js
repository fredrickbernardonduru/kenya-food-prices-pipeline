/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        sans: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        bg:      "#080C10",
        surface: "#0D1117",
        border:  "#1C2433",
        muted:   "#2A3545",
        dim:     "#4A5A6B",
        text:    "#E8EDF3",
        sub:     "#7A8FA3",
        green:   "#00E5A0",
        red:     "#FF4560",
        amber:   "#FFB547",
        blue:    "#3B82F6",
        purple:  "#A855F7",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "scan": "scan 2s linear infinite",
        "fade-in": "fadeIn 0.5s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)", opacity: "0.6" },
          "100%": { transform: "translateY(400%)", opacity: "0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
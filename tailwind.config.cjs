const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Montserrat", ...defaultTheme.fontFamily.serif],
        inter: ["Inter", ...defaultTheme.fontFamily.serif],
      },
      backgroundImage: {
        "score-crystal": "url('/assets/crystal.png')",
        home: "url('/assets/home.png')",
        "play-button": "url('/assets/play_button.png')",
      },
    },
  },
  plugins: [],
};

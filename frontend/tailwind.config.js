/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        sand: "#f4efe6",
        coral: "#ff6b57",
        mist: "#d8e2dc",
        leaf: "#1f6f5f",
      },
      boxShadow: {
        soft: "0 20px 50px rgba(20, 33, 61, 0.12)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

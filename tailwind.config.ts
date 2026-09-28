import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F7F3EC",
        linen: "#EFE8DC",
        beige: "#E3D7C4",
        sand: "#CDBBA1",
        taupe: "#9A8B78",
        clay: "#7A624C",
        umber: "#5A4636",
        graphite: "#2B2926",
        ink: "#1C1B19",
        mist: "#B9B4AC",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: { eyebrow: "0.24em" },
      boxShadow: {
        soft: "0 1px 2px rgba(43,41,38,.04), 0 12px 32px -12px rgba(43,41,38,.18)",
        lift: "0 2px 4px rgba(43,41,38,.05), 0 30px 60px -20px rgba(43,41,38,.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;

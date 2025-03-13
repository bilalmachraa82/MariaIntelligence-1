import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        'maria': {
          primary: '#E5A4A4',
          'primary-light': '#F8E6E6',
          accent: '#98D8D8',
          dark: '#2C2C2C',
          gray: '#757575',
          white: '#FFFFFF',
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: '#E5A4A4',
          foreground: '#FFFFFF',
          light: '#F8E6E6',
        },
        secondary: {
          DEFAULT: '#98D8D8',
          foreground: '#2C2C2C',
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: '#98D8D8',
          foreground: '#2C2C2C',
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: '#E5A4A4',
        chart: {
          "1": '#E5A4A4',
          "2": '#98D8D8',
          "3": '#F8E6E6',
          "4": '#2C2C2C',
          "5": '#757575',
        },
        sidebar: {
          DEFAULT: "#FFFFFF",
          foreground: "#2C2C2C",
          primary: '#E5A4A4',
          "primary-foreground": '#FFFFFF',
          accent: '#98D8D8',
          "accent-foreground": '#2C2C2C',
          border: '#F8E6E6',
          ring: '#E5A4A4',
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

/**
 * ZTTeam VIA Management System
 * Developer: ZTTeam (ztteam.site)
 * File: tailwind.config.js
 * Description: Cấu hình Tailwind CSS chuẩn 100% màu sắc, font chữ và forms plugin của MetaManager
 */

import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /** 4 custom brand colors từ bản thiết kế MetaManager */
      colors: {
        primary: "#2563eb",
        live: "#10b981",
        checkpoint: "#f59e0b",
        die: "#ef4444"
      },
      fontFamily: {
        sans: ["Mulish", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      }
    },
  },
  plugins: [forms],
};

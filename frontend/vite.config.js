import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // ถ้าต้องใช้อีกค่อยเพิ่มกลับมา
      // animejs: 'animejs/lib/anime.es.js',
    },
  },
})

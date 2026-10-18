import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Lets us write imports like `@/components/ui/Card` instead of relative paths.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

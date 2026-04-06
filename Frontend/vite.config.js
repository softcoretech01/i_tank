import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  return {
    plugins: [react()],
    // If dev, use root. If build/prod, use /iti/
    base: isDev ? '/' : '/iti/',
    server: {
      open: true,
    }
  }
})
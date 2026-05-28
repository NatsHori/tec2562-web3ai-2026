import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
      }
    }
  }
})

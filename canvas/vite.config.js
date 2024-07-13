import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        controller: 'controller.html',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 7541,
    watch: {
      // also watch controller changes
      ignored: ['!**/controller.html'],
    },
  },
})

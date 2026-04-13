import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces so subdomains like dps.localhost:5173 reach this server.
    // Modern browsers resolve *.localhost to 127.0.0.1 (RFC 6761) out of the box.
    host: true,
    port: 5173,
  },
})

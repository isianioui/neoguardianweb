// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   // Use relative base so assets resolve correctly on GitHub Pages/subpaths
//   base: './',
// })


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use absolute base for hosting at domain root (e.g., Vercel) so assets
  // resolve correctly on client-side routes like "/dashboard"
  base: '/',
})



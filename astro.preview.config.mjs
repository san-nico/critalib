// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// Local preview config: `astro preview` is not supported by @astrojs/vercel,
// so we build with the Node adapter into a separate directory.
export default defineConfig({
  output: 'server',

  outDir: './dist-preview',

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: node({ mode: 'standalone' })
});
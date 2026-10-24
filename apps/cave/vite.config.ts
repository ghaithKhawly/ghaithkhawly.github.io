import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths, so a build works at the site root and in previews under a sub-path.
  base: './',
  // Content is read from the classic site's data, one level up.
  server: { fs: { allow: ['..'] } },
  build: { target: 'es2022', sourcemap: true },
});

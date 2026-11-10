// Writes the CV page (src/content/page.ts) into index.html where `<!-- cv page -->`
// stands, and the title, description and share tags where `<!-- head -->` does. It runs before Vite resolves the page's assets, so the paintings and screens it
// shows are bundled like any other image.
//
// Also preloads the cave's script: main.ts imports it only where the cave can be drawn,
// so without a hint the browser would find it one round trip late.
import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { headHtml, pageHtml } from '../src/content/page.ts';

export function cvPage(): Plugin {
  return {
    name: 'cave-cv-page',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('<!-- head -->', headHtml()).replace('<!-- cv page -->', pageHtml()),
    },
  };
}

// The 404 page stands alone (GitHub Pages serves it at whatever address was asked for,
// so it can't use the hashed, relative assets). It gets the heading font at a fixed address.
export function standaloneFont(): Plugin {
  return {
    name: 'cave-404-font',
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'fonts/alegreya.woff2', source: await readFile(new URL('../src/assets/fonts/alegreya.woff2', import.meta.url)) });
    },
  };
}

export function preloadCave(): Plugin {
  return {
    name: 'cave-preload',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const chunk = Object.values(ctx.bundle ?? {}).find((c) => c.type === 'chunk' && c.facadeModuleId?.endsWith('/src/cave.ts'));
        return chunk ? [{ tag: 'link', attrs: { rel: 'modulepreload', crossorigin: true, href: `./${chunk.fileName}` }, injectTo: 'head' }] : [];
      },
    },
  };
}

// Writes the CV page (src/content/page.ts) into index.html where `<!-- cv page -->`
// stands. It runs before Vite resolves the page's assets, so the paintings and screens it
// shows are bundled like any other image.
//
// Also preloads the cave's script: main.ts imports it only where the cave can be drawn,
// so without a hint the browser would find it one round trip late.
import type { Plugin } from 'vite';
import { pageHtml } from '../src/content/page.ts';

export function cvPage(): Plugin {
  return {
    name: 'cave-cv-page',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('<!-- cv page -->', pageHtml()),
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

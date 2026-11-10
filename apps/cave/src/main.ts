import './fonts.css';
import './styles.css';
import './page.css';

// The page is two things: the CV as plain HTML, written in at build time (see
// src/content/page.ts), and the cave drawn over it. The script in <head> marks the page
// `cave` where the cave can be drawn; everywhere else, and without JavaScript, the CV
// page is the site. While the cave is up, the page stays in the document for screen
// readers and search, out of sight and out of the tab order.
const root = document.documentElement;
const pageLinks = () => document.querySelectorAll<HTMLElement>('#page a');
export function showPage(why?: string) {
  root.classList.remove('cave');
  for (const a of pageLinks()) a.removeAttribute('tabindex');
  if (why) document.getElementById('page-why').textContent = why;
}
if (new URLSearchParams(location.search).has('lost')) showPage('The cave stopped drawing: the browser took its graphics back. Here is the same CV as a page.');
if (root.classList.contains('cave')) {
  for (const a of pageLinks()) a.tabIndex = -1;
  import('./cave').catch((e) => {
    console.error(e);
    showPage('This browser couldn’t draw the cave in 3D, so here is the same CV as a page.');
  });
}

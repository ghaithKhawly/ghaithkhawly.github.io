import type { ProjectInfo, Screen } from './projects';

// Screens load only when their project opens: Vite gives a URL per file, nothing more.
// (Kept out of projects.ts, which the build also reads to write the page copy.)
const SCREEN_URLS = import.meta.glob('../assets/screens/*/*.webp', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;

export function screenUrl(project: ProjectInfo, screen: Screen): Promise<string> {
  const load = SCREEN_URLS[`../assets/screens/${project.id}/${screen.file}.webp`];
  if (!load) return Promise.reject(new Error(`No screen ${project.id}/${screen.file}`));
  return load();
}

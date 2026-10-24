// The projects on the wall. Each one is a painting (a picture of what it does, in the
// same Palaeolithic style as the rest) that steps out as the device it runs on, showing
// real screens. Facts come from each project's own README.

// Screens load only when their project opens: Vite gives a URL per file, nothing more.
const SCREEN_URLS = import.meta.glob('../assets/screens/*/*.webp', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;

export interface Screen { file: string; caption: string }
export interface ProjectInfo {
  id: string;
  title: string;
  status: string;
  what: string;
  points: string[];
  stack: string[];
  link?: string;            // public repositories only
  note?: string;            // shown small under the screens
  device?: 'phone' | 'laptop';
  screens: Screen[];
  painting: { kind: string; x: number; y: number; w: number; h: number; seed: number };   // paint-layer pixels
}

export const PROJECTS: ProjectInfo[] = [
  {
    id: 'rakeb',
    title: 'Rakeb',
    status: 'In development',
    what: 'A journey planner for Damascus, which has no official transit feed: route knowledge lives in drivers’ heads. Tap two points on the map or type the trip in Arabic, and Rakeb ranks routes across the city’s buses and microbuses, with the walking and the changes.',
    points: [
      'About 45 routes, traced from the real lines and rebuilt into a routing graph whenever the route files change.',
      'A* runs in a worker thread, so a heavy search never blocks the server. Walking links are made during the search, inside hard limits on how far you walk.',
      'Trips typed in everyday Arabic are resolved to places on the map.',
    ],
    stack: ['Expo', 'React Native', 'Fastify', 'PostgreSQL with PostGIS', 'Python'],
    link: 'https://github.com/ghaithKhawly/Rakeb',
    note: 'The network drawn from Rakeb’s own route files.',
    device: 'phone',
    screens: [
      { file: '1-network-centre', caption: 'The routes through central Damascus' },
      { file: '2-network', caption: 'Every route Rakeb plans over' },
    ],
    painting: { kind: 'routes', x: 598, y: 212, w: 285, h: 168, seed: 31 },
  },
  {
    id: 'office-order',
    title: 'Office Order',
    status: 'In daily use at an office',
    what: 'Group food ordering for an office. Everyone adds to one shared order, an admin approves it and calls the restaurant, and the app works out what each person owes, their share of the delivery included.',
    points: [
      'Runs air-gapped on the office network: no internet, no CDN, everything it needs ships with it.',
      'Arabic first, right to left, with an English toggle.',
      'Live updates over server-sent events, and a wall display counting down to the order cut-off.',
    ],
    stack: ['Express', 'SQLite', 'React', 'Vite', 'Tailwind'],
    link: 'https://github.com/ghaithKhawly/office-order',
    note: 'Screens from the real app, with a made-up office.',
    device: 'phone',
    screens: [
      { file: '1-today-member', caption: 'Today’s order' },
      { file: '2-menu-member', caption: 'The menu' },
      { file: '3-money-admin', caption: 'Who owes what' },
    ],
    painting: { kind: 'feast', x: 905, y: 218, w: 232, h: 158, seed: 32 },
  },
  {
    id: 'aquarium',
    title: 'Aquarium Object Detection',
    status: 'University project, with Ammar Alzoubi',
    what: 'Finds and labels seven kinds of sea creature in aquarium photos, and uses the task to compare two detectors under the same conditions: one written from scratch, one fine-tuned.',
    points: [
      'The scratch grid detector: 4.7 million parameters, 27 frames a second, mAP@0.5 of 0.27.',
      'Faster R-CNN fine-tuned from COCO: 41.3 million parameters, 2 frames a second, mAP@0.5 of 0.54.',
      'Same data, preprocessing and decoding for both, so only the models differ.',
    ],
    stack: ['PyTorch', 'torchvision', 'Python'],
    link: 'https://github.com/ghaithKhawly/aquarium-object-detection',
    note: 'Figures from the project notebook.',
    device: 'laptop',
    screens: [
      { file: '1-compare', caption: 'Both models on the same test photos' },
      { file: '2-pr-curves', caption: 'Precision against recall' },
      { file: '3-quality-speed', caption: 'Quality against speed' },
      { file: '4-workflow', caption: 'The pipeline both models share' },
    ],
    painting: { kind: 'fish', x: 1160, y: 222, w: 240, h: 150, seed: 33 },
  },
  {
    id: 'savings-tracker',
    title: 'Savings Tracker',
    status: 'Finished',
    what: 'Tracks savings kept in dollars, Syrian pounds, gold and silver, values them at live prices, and follows goals over time.',
    points: [
      'Prices fall back from live to cached to demo, so it always has a number to show.',
      'Goals, a searchable history, and backups to JSON and CSV.',
      'One codebase for Android, iOS and the web.',
    ],
    stack: ['Expo', 'React Native', 'TypeScript', 'Zustand', 'Victory charts'],
    link: 'https://github.com/ghaithKhawly/savings-tracker',
    note: 'Screens from the web build, with sample savings.',
    device: 'phone',
    screens: [
      { file: '1-dashboard', caption: 'The dashboard' },
      { file: '2-dashboard-2', caption: 'A year of saving' },
      { file: '3-assets', caption: 'Assets' },
      { file: '4-history', caption: 'History' },
    ],
    painting: { kind: 'hoard', x: 628, y: 412, w: 168, h: 152, seed: 34 },
  },
  {
    id: 'justacalc',
    title: 'justacalc',
    status: 'Finished',
    what: 'Fourteen calculators in one app, sharing one history and one set of settings: pick degrees once and geometry and physics both use it.',
    points: [
      'Two engines: mathjs with decimal.js for exact numbers, nerdamer for algebra that simplifies, factors, solves, differentiates and integrates.',
      'Every result, from any calculator, lands in the same history.',
    ],
    stack: ['Expo Router', 'TypeScript', 'mathjs', 'decimal.js', 'nerdamer'],
    note: 'The code is private. Screens from the web build.',
    device: 'phone',
    screens: [
      { file: '1-home', caption: 'Fourteen calculators' },
      { file: '2-calculator-sum', caption: 'Arithmetic' },
      { file: '3-algebra-solved', caption: 'Solving an equation' },
      { file: '4-calculus-solved', caption: 'Differentiating' },
    ],
    painting: { kind: 'counting', x: 814, y: 418, w: 142, h: 144, seed: 35 },
  },
  {
    id: 'taza',
    title: 'Taza',
    status: 'Won a Startup Weekend in Syria',
    what: 'A startup idea: restaurants, bakeries and cafés sell the day’s surplus as surprise bags at half price, and customers reserve them in Telegram and pay on pickup. It won a Startup Weekend in Syria.',
    points: [
      'Built for it: the landing page for merchants, and a Telegram bot with a mini app for reserving bags.',
      'All in Arabic, cash on pickup, no delivery.',
      'The bot runs on a free tier, with a Google Sheet as its database.',
    ],
    stack: ['React', 'Vite', 'Python', 'python-telegram-bot', 'Google Sheets'],
    link: 'https://github.com/ghaithKhawly/TazaWebsite',
    note: 'The mini app is shown with sample bags.',
    device: 'phone',
    screens: [
      { file: '1-landing-phone', caption: 'The landing page' },
      { file: '2-landing-phone-2', caption: 'How it works' },
      { file: '3-bot', caption: 'Reserving a bag in the bot' },
    ],
    painting: { kind: 'bread', x: 976, y: 414, w: 178, h: 150, seed: 36 },
  },
  {
    id: 'gym',
    title: 'Gym Management System',
    status: 'Finished coursework',
    what: 'Runs a gym’s front desk: members, memberships with partial payments, payments, check-in and check-out, coaches, and where the money came from.',
    points: [
      'Offline first: SQLite on the device and no server, so a bad connection never stops the desk.',
      'Three roles, admin, receptionist and coach, enforced in the database schema.',
    ],
    stack: ['Flutter', 'Dart', 'SQLite'],
    note: 'The code is private.',
    screens: [],
    painting: { kind: 'lifters', x: 1172, y: 408, w: 232, h: 160, seed: 37 },
  },
];

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);
export function screenUrl(project: ProjectInfo, screen: Screen): Promise<string> {
  const load = SCREEN_URLS[`../assets/screens/${project.id}/${screen.file}.webp`];
  if (!load) return Promise.reject(new Error(`No screen ${project.id}/${screen.file}`));
  return load();
}

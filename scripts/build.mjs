// Builds both sites into dist/: the cave at the root, the classic site under /classic.
import { execSync } from 'node:child_process';
import { cpSync, rmSync, writeFileSync } from 'node:fs';

const run = (cmd, cwd, env = {}) => execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

rmSync('dist', { recursive: true, force: true });
run('npm run build', 'apps/cave');
// CI=false: Create React App otherwise fails the build on lint warnings when CI=true.
run('npm run build', 'apps/classic', { PUBLIC_URL: '/classic', CI: 'false' });
cpSync('apps/cave/dist', 'dist', { recursive: true });
cpSync('apps/classic/build', 'dist/classic', { recursive: true });
writeFileSync('dist/.nojekyll', '');
console.log('Built dist/ (cave at /, classic at /classic/)');

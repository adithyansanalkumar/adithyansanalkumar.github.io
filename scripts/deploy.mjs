// Publishes the site: builds it, then pushes the "dist" folder to the
// gh-pages branch, which GitHub Pages serves.   Run:  npm run deploy
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const run = (cmd, cwd = '.') => execSync(cmd, { stdio: 'inherit', cwd });
const remote = execSync('git remote get-url origin').toString().trim();

run('npm run build');
rmSync('dist/.git', { recursive: true, force: true });
run('git init -q -b gh-pages', 'dist');
run('git add -A', 'dist');
run(`git commit -q -m "Deploy ${new Date().toISOString()}"`, 'dist');
run(`git push -f "${remote}" gh-pages`, 'dist');
rmSync('dist/.git', { recursive: true, force: true });
console.log('\n✓ Published. The site updates in ~1 minute.');

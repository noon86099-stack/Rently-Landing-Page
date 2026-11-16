import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Match Vite's JSX/env transforms without making network requests or using
// real Supabase credentials. Bare tsx cannot execute these browser modules.
const web = fileURLToPath(new URL('../../rently/', import.meta.url));
const output = path.join(web, 'node_modules/.cache/rently-ui-tests');
await build({
  absWorkingDir: web,
  entryPoints: [
    'src/lib/i18n.test.tsx',
    'src/features/portfolio/guided-setup.test.tsx',
    'src/features/portfolio/owner-dashboard.test.tsx',
  ],
  outdir: output,
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  alias: {
    '@': path.join(web, 'src'),
    '@workspace/api-client-react': fileURLToPath(new URL('../../../lib/api-client-react/src/index.ts', import.meta.url)),
  },
  define: { 'import.meta.env': '{}' },
  jsx: 'automatic',
});
const run = spawnSync(process.execPath, ['--test',
  path.join(output, 'lib/i18n.test.mjs'),
  path.join(output, 'features/portfolio/guided-setup.test.mjs'),
  path.join(output, 'features/portfolio/owner-dashboard.test.mjs'),
], { stdio: 'inherit' });
if (run.error) throw run.error;
process.exitCode = run.status ?? 1;

// Packages the app for Vercel using the Build Output API (https://vercel.com/docs/build-output-api/v3):
//   - dist/ (built by `vite build`) is served as static files from the CDN
//   - server.ts is bundled into a single Node.js function that handles every /api/* request
// Run via `npm run build:vercel` (vercel.json sets this as the build command).
import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const out = path.join(root, '.vercel', 'output');
const fnDir = path.join(out, 'functions', 'api.func');

if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
  throw new Error('dist/index.html not found - run `vite build` first.');
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(fnDir, { recursive: true });
fs.cpSync(path.join(root, 'dist'), path.join(out, 'static'), { recursive: true });

await build({
  entryPoints: [path.join(root, 'server.ts')],
  outfile: path.join(fnDir, 'index.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // Vite is only loaded for local development and is never reached on Vercel.
  external: ['vite'],
  // Bundled CommonJS dependencies (express, dotenv) still call require().
  banner: {
    js: "import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: 'warning',
});

fs.writeFileSync(
  path.join(fnDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      maxDuration: 300,
    },
    null,
    2
  )
);

fs.writeFileSync(
  path.join(out, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '^/api(?:/.*)?$', dest: '/api' },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2
  )
);

console.log('Vercel build output written to .vercel/output');

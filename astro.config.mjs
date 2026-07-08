import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
const owner = process.env.GITHUB_REPOSITORY_OWNER || 'usuario';
const isUserPage = repository.endsWith('.github.io');
const githubPagesBase = repository && !isUserPage ? repository : '/';

function normalizeBase(value) {
  if (!value || value === '/') return '/';
  return `/${String(value).replace(/^\/+|\/+$/g, '')}/`;
}

export default defineConfig({
  site: process.env.PUBLIC_SITE || `https://${owner}.github.io`,
  base: normalizeBase(process.env.PUBLIC_BASE_PATH || (process.env.GITHUB_ACTIONS ? githubPagesBase : '/')),
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  }
});

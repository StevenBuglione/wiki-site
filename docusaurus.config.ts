import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'AI Wiki',
  url: 'https://stevenbuglione.github.io',
  baseUrl: '/wiki-site/',
  organizationName: 'StevenBuglione',
  projectName: 'wiki-site',
  trailingSlash: false,
  presets: [['classic', { docs: false, blog: false, theme: { customCss: './src/css/custom.css' } }]],
  themeConfig: {
    navbar: {
      title: 'AI Wiki',
      items: [
        { to: '/wiki/', label: 'Wiki', position: 'left' },
        { to: '/search', label: 'Search', position: 'left' },
        { href: 'https://github.com/StevenBuglione/wiki-data-registry', label: 'Registry', position: 'right' },
      ],
    },
  },
};

export default config;

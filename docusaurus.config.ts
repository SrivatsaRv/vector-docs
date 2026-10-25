import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const sourceRepo = 'https://github.com/SrivatsaRv/vector-engagements-labs';

const config: Config = {
  title: 'Vector Engagement Labs',
  tagline: 'Engineering contracts and architecture for the browser engagement lab.',
  favicon: 'img/favicon.ico',

  url: 'https://labs.reachdefence.com',
  // Served under /docs so the site can sit beside the application on one hostname.
  baseUrl: '/docs/',
  organizationName: 'SrivatsaRv',
  projectName: 'vector-docs',
  onBrokenLinks: 'throw',
  trailingSlash: false,

  i18n: {defaultLocale: 'en', locales: ['en']},

  markdown: {
    // .md contracts stay CommonMark so prose like `<` or `{` never trips MDX.
    format: 'detect',
    mermaid: true,
    hooks: {onBrokenMarkdownLinks: 'throw'},
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: ({docPath}) =>
            docPath.startsWith('contracts/')
              ? `${sourceRepo}/edit/main/docs/${docPath.slice('contracts/'.length)}`
              : undefined,
        },
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {defaultMode: 'dark', respectPrefersColorScheme: true},
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
      options: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        flowchart: {curve: 'basis', padding: 14, nodeSpacing: 42, rankSpacing: 52},
        sequence: {mirrorActors: false, showSequenceNumbers: true},
      },
    },
    navbar: {
      title: 'Vector Engagement Labs',
      items: [
        {to: '/architecture/overview', label: 'Architecture', position: 'left'},
        {to: '/contracts', label: 'Contracts', position: 'left'},
        {href: sourceRepo, label: 'Source', position: 'right'},
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Vector Engagement Labs by Reach Defence · ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust', 'bash', 'json', 'sql'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

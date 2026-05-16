import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'WaslGenie',
  tagline: 'Universal synchronization layer for AI agent orchestrators',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://The-Untitled-Org.github.io',
  baseUrl: '/wasla-genie/',

  organizationName: 'The-Untitled-Org',
  projectName: 'wasla-genie',
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/The-Untitled-Org/wasla-genie/tree/main/docs/',
          routeBasePath: '/',
        },
        blog: {
          path: './blog',
          routeBasePath: '/blog',
          authorsMapPath: 'authors.yml',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      respectPrefersColorScheme: false,
      defaultMode: 'light',
      disableSwitch: false,
    },
    navbar: {
      title: 'WaslGenie',
      logo: {
        alt: 'WaslGenie Logo',
        src: 'img/logo.png',
        width: 40,
        height: 40,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },
        {
          to: '/team',
          label: 'Team',
          position: 'right',
        },
        {
          to: '/contributing',
          label: 'Contributing',
          position: 'right',
        },
        {
          href: 'https://github.com/The-Untitled-Org/wasla-genie',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Project Spec',
              to: '/specs/project-spec',
            },
            {
              label: 'Design Discussion',
              to: '/specs/design-discussion',
            },
            {
              label: 'Meetings of Mind',
              to: '/mom',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Organization',
              href: 'https://github.com/The-Untitled-Org',
            },
            {
              label: 'Contributors',
              href: 'https://github.com/The-Untitled-Org/wasla-genie/graphs/contributors',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Repository',
              href: 'https://github.com/The-Untitled-Org/wasla-genie',
            },
            {
              label: 'Issues',
              href: 'https://github.com/The-Untitled-Org/wasla-genie/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} The Untitled Org. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

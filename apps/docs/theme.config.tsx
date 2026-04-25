import type { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  logo: (
    <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>
      lore-ai <span style={{ color: '#a1a1aa', marginLeft: 6 }}>/ docs</span>
    </span>
  ),
  project: {
    link: 'https://github.com/terracelab/lore-ai',
  },
  docsRepositoryBase: 'https://github.com/terracelab/lore-ai/tree/main/apps/docs',
  editLink: {
    content: '이 페이지 편집 →',
  },
  feedback: {
    content: '피드백 / 이슈 제보 →',
    labels: 'docs',
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    backToTop: true,
  },
  search: {
    placeholder: '검색…',
  },
  footer: {
    content: (
      <span>
        MIT © 2026 <a href="https://terracelab.co.kr">Terracelab</a>.
      </span>
    ),
  },
  i18n: [],
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Lore AI Docs" />
      <meta
        property="og:description"
        content="Living business-logic documentation for AI-assisted dev teams."
      />
      <meta property="og:url" content="https://lore-ai-docs.vercel.app" />
      <meta property="og:type" content="website" />
    </>
  ),
};

export default config;

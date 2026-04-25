import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';
import type { ReactNode } from 'react';

export const metadata = {
  metadataBase: new URL('https://docs.lore-ai.vercel.app'),
  title: {
    default: 'Lore AI Docs',
    template: '%s · Lore AI',
  },
  description: 'Living business-logic documentation for AI-assisted dev teams.',
};

const navbar = (
  <Navbar
    logo={
      <span className="font-mono text-base font-semibold tracking-tight">
        lore-ai <span className="text-zinc-400">/ docs</span>
      </span>
    }
    projectLink="https://github.com/terracelab/lore-ai"
  />
);

const footer = (
  <Footer>
    MIT © 2026 <a href="https://terracelab.co.kr">Terracelab</a>.
  </Footer>
);

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/terracelab/lore-ai/tree/main/apps/docs"
          editLink="이 페이지 편집 →"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}

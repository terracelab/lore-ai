import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { Story } from '@/components/Story';
import { HowItWorks } from '@/components/HowItWorks';
import { Features } from '@/components/Features';
import { Demo } from '@/components/Demo';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <main>
      <Nav />
      <Hero />
      <Story />
      <HowItWorks />
      <Features />
      <Demo />
      <CTA />
      <Footer />
    </main>
  );
}

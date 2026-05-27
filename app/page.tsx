import type { Metadata } from 'next';
import SnlUniverseExplorer from '@/components/SnlUniverseExplorer';

export const metadata: Metadata = {
  title: 'Saturday Night Live Alumni Universe',
  description:
    'Explore SNL alumni, characters, films, shows, collaborations, timelines, trivia, and connection-chain gameplay in an interactive comedy universe.',
  keywords: [
    'Saturday Night Live alumni',
    'SNL cast connections',
    'SNL trivia game',
    'comedy universe map',
    'SNL character explorer',
  ],
  alternates: {
    languages: { en: '/' },
  },
  openGraph: {
    title: 'Saturday Night Live Alumni Universe',
    description: 'A living interactive comedy universe for SNL alumni and their creative connections.',
    locale: 'en_US',
    type: 'website',
  },
};

export default function Home() {
  return <SnlUniverseExplorer />;
}

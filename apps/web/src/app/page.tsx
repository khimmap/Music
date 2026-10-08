import { QualityProvider } from '@/effects/quality/QualityProvider';
import { Landing } from '@/features/landing/Landing';

export default function HomePage() {
  return (
    <QualityProvider>
      <Landing />
    </QualityProvider>
  );
}

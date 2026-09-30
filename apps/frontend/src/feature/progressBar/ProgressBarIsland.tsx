import ClientHydration from '@/components/ClientHydration';
import ProgressBar from './ProgressBar';

export default function ProgressBarIsland() {
  return (
    <ClientHydration>
      <ProgressBar />
    </ClientHydration>
  );
}

import type { FileWithCode } from '@/registry/prompt';
import { OrbCard, type OrbCardData } from './orb-card';

export const Gallery = ({ orbs, shared }: { orbs: OrbCardData[]; shared: FileWithCode[] }) => (
  <div className="grid gap-6 md:grid-cols-2">
    {orbs.map((orb) => (
      <OrbCard key={orb.id} orb={orb} shared={shared} />
    ))}
  </div>
);

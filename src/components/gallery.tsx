import { OrbCard, type OrbCardData } from './orb-card';

export const Gallery = ({ orbs }: { orbs: OrbCardData[] }) => (
  <div className="grid gap-6 md:grid-cols-2">
    {orbs.map((orb) => (
      <OrbCard key={orb.id} orb={orb} />
    ))}
  </div>
);

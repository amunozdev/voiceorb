export interface OrbFile {
  label: string;
  path: string;
  lang: string;
}

export interface OrbMeta {
  id: string;
  name: string;
  tagline: string;
  tech: string;
  dependencies: string[];
  defaultColorFrom: string;
  defaultColorTo: string;
  defaultSize: number;
  files: OrbFile[];
}

const SHARED_FILES: OrbFile[] = [
  { label: 'lib/orb-state.ts', path: 'src/registry/lib/orb-state.ts', lang: 'ts' },
  { label: 'lib/use-orb-level.ts', path: 'src/registry/lib/use-orb-level.ts', lang: 'ts' },
  { label: 'lib/use-audio-level.ts', path: 'src/registry/lib/use-audio-level.ts', lang: 'ts' },
];

export { SHARED_FILES };

export const orbs: OrbMeta[] = [
  {
    id: 'pulse-orb',
    name: 'Pulse Orb',
    tagline: 'Núcleo con anillos expansivos y arco de carga. Minimalista y SSR-safe.',
    tech: 'CSS puro',
    dependencies: [],
    defaultColorFrom: '#818cf8',
    defaultColorTo: '#22d3ee',
    defaultSize: 168,
    files: [
      { label: 'pulse-orb.tsx', path: 'src/registry/orbe/pulse-orb/pulse-orb.tsx', lang: 'tsx' },
      { label: 'pulse-orb.module.css', path: 'src/registry/orbe/pulse-orb/pulse-orb.module.css', lang: 'css' },
      { label: 'pulse-orb-tw.tsx (Tailwind)', path: 'src/registry/orbe/pulse-orb/pulse-orb-tw.tsx', lang: 'tsx' },
    ],
  },
  {
    id: 'glass-orb',
    name: 'Glass Orb',
    tagline: 'Glassmorphism iridiscente con aura cónica giratoria y reflejo especular.',
    tech: 'CSS puro',
    dependencies: [],
    defaultColorFrom: '#a78bfa',
    defaultColorTo: '#38bdf8',
    defaultSize: 168,
    files: [
      { label: 'glass-orb.tsx', path: 'src/registry/orbe/glass-orb/glass-orb.tsx', lang: 'tsx' },
      { label: 'glass-orb.module.css', path: 'src/registry/orbe/glass-orb/glass-orb.module.css', lang: 'css' },
      { label: 'glass-orb-tw.tsx (Tailwind)', path: 'src/registry/orbe/glass-orb/glass-orb-tw.tsx', lang: 'tsx' },
    ],
  },
  {
    id: 'gooey-orb',
    name: 'Gooey Orb',
    tagline: 'Blob líquido cuyos bordes "hierven" con ruido SVG y desplazamiento.',
    tech: 'SVG filters',
    dependencies: [],
    defaultColorFrom: '#f472b6',
    defaultColorTo: '#8b5cf6',
    defaultSize: 168,
    files: [{ label: 'gooey-orb.tsx', path: 'src/registry/orbe/gooey-orb/gooey-orb.tsx', lang: 'tsx' }],
  },
  {
    id: 'plasma-orb',
    name: 'Plasma Orb',
    tagline: 'Mesh gradient de shader sobre canvas, sin Three.js. Distorsión orgánica.',
    tech: 'Shader (canvas)',
    dependencies: ['@paper-design/shaders-react'],
    defaultColorFrom: '#7c3aed',
    defaultColorTo: '#06b6d4',
    defaultSize: 168,
    files: [{ label: 'plasma-orb.tsx', path: 'src/registry/orbe/plasma-orb/plasma-orb.tsx', lang: 'tsx' }],
  },
  {
    id: 'nebula-orb',
    name: 'Nebula Orb',
    tagline: 'Esfera 3D con displacement de simplex noise y fresnel. El "voice mode".',
    tech: 'WebGL (R3F + GLSL)',
    dependencies: ['three', '@react-three/fiber'],
    defaultColorFrom: '#8b5cf6',
    defaultColorTo: '#22d3ee',
    defaultSize: 184,
    files: [
      { label: 'nebula-orb.tsx', path: 'src/registry/orbe/nebula-orb/nebula-orb.tsx', lang: 'tsx' },
      { label: 'nebula-scene.tsx', path: 'src/registry/orbe/nebula-orb/nebula-scene.tsx', lang: 'tsx' },
    ],
  },
];

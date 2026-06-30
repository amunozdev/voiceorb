import type { OrbFile } from './registry';

export interface FileWithCode extends OrbFile {
  code: string;
}

export const buildAiPrompt = (
  name: string,
  dependencies: string[],
  files: FileWithCode[],
  shared: FileWithCode[],
): string => {
  const deps = dependencies.length
    ? `First install: \`${dependencies.join(' ')}\`.`
    : 'No extra dependencies are required.';
  const block = (f: FileWithCode) => `\n${f.label}\n\`\`\`${f.lang}\n${f.code}\`\`\`\n`;

  return `Integrate the "${name}" animated AI-assistant orb into my React / Next.js (App Router) project.

${deps}

Create these shared utilities once (path: src/registry/lib):
${shared.map(block).join('')}
Create the component files:
${files.map(block).join('')}
Notes:
- It is a client component ("use client").
- Props: state ('idle' | 'connecting' | 'listening' | 'thinking' | 'speaking'), size (px), speed (multiplier), colorFrom, colorTo, levelRef (RefObject<number>; 0..1 live audio amplitude, a negative value means "no live audio" and the orb falls back to a procedural animation), label, className.
- Wire \`state\` to my assistant lifecycle and pass a \`levelRef\` driven by the Web Audio API (mic while listening, TTS output while speaking).
- Respect \`prefers-reduced-motion\`.`;
};

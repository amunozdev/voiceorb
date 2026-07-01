# Orb distribution

This project is a **copy-paste gallery**: each orb lives in `src/registry/orbe/<orb>/` and is the
source of truth. There are two ways for a user to take an orb into their project.

## 1. Copy code

Each gallery card exposes **"View code"** with a tab per file (`*.tsx`,
`*.module.css`, Tailwind variant) and a **"Copy code"** button that copies the file to the
clipboard. The user pastes the files, adds the shared utilities from
`src/registry/lib/` (`orb-state.ts`, `use-orb-level.ts`, `use-audio-level.ts`) and installs the
dependencies listed on the card.

## 2. Copy AI prompt

A **"Copy AI prompt"** button per orb. It copies a self-contained prompt (shared utilities
+ orb files + props/state contract) optimized to paste into
Cursor / Copilot / Claude Code so the assistant recreates the orb and adapts it to the project.
The prompt is generated in `src/registry/prompt.ts`.

## Shared contract (for customization)

Props: `state`, `size`, `speed`, `colorFrom`, `colorTo`, `levelRef`, `label`, `className`.
Public CSS vars: `--orb-size`, `--orb-speed`, `--orb-color-from`, `--orb-color-to`,
`--orb-level`.

- CSS-driven orbs (`pulse-orb`, `glass-orb`): Tailwind variant (`*-tw.tsx`) and CSS Module.
- Logic-driven orbs (`gooey`, `plasma`, `nebula`): JS/SVG/GLSL with `className` passthrough,
  a single implementation.

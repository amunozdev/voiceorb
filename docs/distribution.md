# Distribución de los orbes

Este proyecto es una **galería copy-paste**: cada orbe vive en `src/registry/orbe/<orb>/` y es la
fuente de verdad. Hay tres vías para que un usuario se lleve un orbe a su proyecto. Hoy están
implementadas (1) y (2); la (3) está documentada aquí para la siguiente fase.

## 1. Copy code (implementado)

Cada tarjeta de la galería expone **"Ver código"** con tabs por archivo (`*.tsx`,
`*.module.css`, variante Tailwind) y un botón **"Copiar código"** que copia el archivo al
portapapeles. El usuario pega los archivos, añade las utilidades compartidas de
`src/registry/lib/` (`orb-state.ts`, `use-orb-level.ts`, `use-audio-level.ts`) e instala las
dependencias que indique la tarjeta.

## 2. Copy prompt para IA (implementado)

Botón **"Copiar prompt para IA"** por orbe. Copia un prompt autocontenido (utilidades
compartidas + archivos del orbe + contrato de props/estados) optimizado para pegar en
Cursor / Copilot / Claude Code y que el asistente recree el orbe adaptándolo al proyecto.
El prompt se genera en `src/registry/prompt.ts`.

## 3. Registry CLI shadcn + Open in v0 (siguiente fase)

El estándar del ecosistema para componentes copy-paste es el **registry de shadcn**: se sirve
cada componente como JSON sobre HTTP y el usuario lo instala con
`npx shadcn@latest add <url>`, que escribe los archivos, instala dependencias y mergea los
tokens CSS automáticamente.

### Pasos para habilitarlo

1. **`registry.json`** en la raíz, con un item por orbe. Reusar la metadata de
   `src/registry/registry.ts` (id, dependencies, files) para generarlo:

   ```json
   {
     "$schema": "https://ui.shadcn.com/schema/registry.json",
     "name": "orbe",
     "homepage": "https://orbe.dev",
     "items": [
       {
         "name": "pulse-orb",
         "type": "registry:component",
         "title": "Pulse Orb",
         "description": "Animated pulsing orb for AI assistants.",
         "dependencies": [],
         "registryDependencies": [],
         "files": [
           { "path": "src/registry/orbe/pulse-orb/pulse-orb.tsx", "type": "registry:component" },
           { "path": "src/registry/orbe/pulse-orb/pulse-orb.module.css", "type": "registry:component" },
           { "path": "src/registry/lib/orb-state.ts", "type": "registry:lib" },
           { "path": "src/registry/lib/use-orb-level.ts", "type": "registry:lib" }
         ],
         "cssVars": {
           "theme": { "--orb-size": "160px", "--orb-speed": "1" }
         }
       }
     ]
   }
   ```

   Para `plasma-orb` añadir `@paper-design/shaders-react` a `dependencies`; para `nebula-orb`,
   `three` y `@react-three/fiber`.

2. **Build**: `npx shadcn@latest build` genera los JSON aplanados en `public/r/<name>.json`
   y el catálogo en `public/r/registry.json` (servidos como estáticos).

3. **Instalación por el usuario**:

   ```bash
   npx shadcn@latest add https://orbe.dev/r/pulse-orb.json
   # o registrando el namespace:
   npx shadcn@latest registry add @orbe=https://orbe.dev/r/{name}.json
   npx shadcn@latest add @orbe/pulse-orb
   ```

4. **Open in v0**: botón con enlace `https://v0.dev/chat/api/open?url=<.../r/pulse-orb.json>`
   para abrir el orbe precargado en v0.

5. **MCP server de shadcn**: el mismo `registry.json` alimenta el servidor MCP para que
   asistentes de IA naveguen e instalen orbes por lenguaje natural. Mantener
   `title`/`description` ricos porque los LLM los leen.

### Variantes Tailwind vs CSS plano

- Orbes CSS-driven (`pulse-orb`, `glass-orb`) traen variante Tailwind (`*-tw.tsx`) y CSS
  Module. En el registry se publican como items separados o como `files` alternativos.
- Orbes logic-driven (`gooey`, `plasma`, `nebula`) son JS/SVG/GLSL con `className`
  passthrough: una sola implementación, el estilo del contenedor es indistinto.

### Customización (contrato común)

Props: `state`, `size`, `speed`, `colorFrom`, `colorTo`, `levelRef`, `label`, `className`.
CSS vars públicas: `--orb-size`, `--orb-speed`, `--orb-color-from`, `--orb-color-to`,
`--orb-level`. Exponer estos tokens vía `cssVars.theme` en cada item del registry.

## Referencias

- shadcn registry: https://ui.shadcn.com/docs/registry
- registry-item.json: https://ui.shadcn.com/docs/registry/registry-item-json
- Open in v0: https://ui.shadcn.com/docs/registry/open-in-v0
- MCP server: https://ui.shadcn.com/docs/mcp
- Plantilla: https://github.com/shadcn-ui/registry-template

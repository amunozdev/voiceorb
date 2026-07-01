'use client';

import * as Tabs from '@radix-ui/react-tabs';
import type { FileWithCode } from '@/registry/prompt';
import { CopyButton } from './copy-button';

interface CodeBlockProps {
  files: FileWithCode[];
}

export const CodeBlock = ({ files }: CodeBlockProps) => (
  <Tabs.Root defaultValue={files[0]?.label} className="overflow-hidden rounded-lg border border-border bg-[#080a12]">
    <Tabs.List className="flex flex-wrap gap-1 border-b border-border bg-panel px-2 py-1.5">
      {files.map((file) => (
        <Tabs.Trigger
          key={file.label}
          value={file.label}
          className="rounded-md px-2.5 py-1 text-xs text-muted transition-colors hover:text-foreground data-[state=active]:bg-[#080a12] data-[state=active]:text-accent"
        >
          {file.label}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
    {files.map((file) => (
      <Tabs.Content key={file.label} value={file.label} className="relative">
        <div className="absolute right-2 top-2 z-10">
          <CopyButton value={file.code} label="Copy code" />
        </div>
        <pre className="max-h-80 overflow-auto p-4 text-xs leading-relaxed">
          <code className="font-mono text-[#c9d1e9]">{file.code}</code>
        </pre>
      </Tabs.Content>
    ))}
  </Tabs.Root>
);

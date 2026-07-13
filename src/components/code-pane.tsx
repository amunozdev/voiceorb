'use client';

import { Highlight, themes } from 'prism-react-renderer';
import type { Language } from 'prism-react-renderer';
import { CopyButton } from './copy-button';

interface CodePaneProps {
  code: string;
  lang?: Language;
}

export const CodePane = ({ code, lang = 'tsx' }: CodePaneProps) => (
  <div
    className="relative rounded-lg border border-code-border bg-code"
    style={{ boxShadow: 'var(--code-shadow)' }}
  >
    <div className="absolute right-2 top-2 z-10">
      <CopyButton value={code} label="Copy" />
    </div>
    <Highlight theme={themes.vsDark} code={code} language={lang}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre
          className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-code-foreground"
          style={{ background: 'transparent' }}
        >
          {tokens.map((line, lineIndex) => (
            <div key={lineIndex} {...getLineProps({ line })}>
              {line.map((token, tokenIndex) => (
                <span key={tokenIndex} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  </div>
);

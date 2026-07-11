import { GitHubIcon } from '@/components/github-link';

const REPO_URL = 'https://github.com/amunozdev/voiceorbs';
const CONTRIBUTE_URL = 'https://github.com/amunozdev/voiceorbs/blob/main/CONTRIBUTING.md';
const GOOD_FIRST_ISSUE_URL =
  'https://github.com/amunozdev/voiceorbs/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22';
const X_URL = 'https://x.com/alexmunoz1_';

const LINK_CLASS = 'text-muted transition-colors hover:text-foreground';

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
    <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.29l13.32 17.41z" />
  </svg>
);

export const Footer = () => (
  <footer className="mt-auto border-t border-border">
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-10">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent-foreground"
          >
            <GitHubIcon />
            amunozdev/voiceorbs
          </a>
        </div>
        <p className="text-xs text-muted">
          Open source under the{' '}
          <a
            href={`${REPO_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-foreground hover:underline"
          >
            MIT License
          </a>
          . Built by{' '}
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-foreground hover:underline"
          >
            @alexmunoz1_
          </a>
          .
        </p>
      </div>

      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <a href={CONTRIBUTE_URL} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          Contribute
        </a>
        <a
          href={GOOD_FIRST_ISSUE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          Good first issues
        </a>
        <a href="/llms.txt" className={LINK_CLASS}>
          llms.txt
        </a>
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow the creator on X"
          className={`inline-flex items-center ${LINK_CLASS}`}
        >
          <XIcon />
          <span className="sr-only">X (Twitter)</span>
        </a>
      </nav>
    </div>
  </footer>
);

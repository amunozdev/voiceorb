const REPO_URL = 'https://github.com/amunozdev/orbe-assistants';
const API_URL = 'https://api.github.com/repos/amunozdev/orbe-assistants';

const StarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="currentColor"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.3l-5.8 3.06 1.11-6.46-4.7-4.58 6.49-.94L12 2.5z" />
  </svg>
);

const getStars = async (): Promise<number | null> => {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(API_URL, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data: { stargazers_count?: number } = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
};

export const GitHubStars = async () => {
  const stars = await getStars();

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
    >
      <StarIcon />
      {stars === null ? (
        <span>Star</span>
      ) : (
        <span className="tabular-nums">{stars.toLocaleString('en-US')}</span>
      )}
      <span className="sr-only">stars on GitHub</span>
    </a>
  );
};

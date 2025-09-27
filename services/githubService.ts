import type { GitHubRepoContent } from '../types';

const API_BASE_URL = 'https://api.github.com';

type LogFunction = (message: string) => void;

export async function getRepoContents(owner: string, repo: string, path: string = '', addLog?: LogFunction): Promise<GitHubRepoContent[]> {
  const url = `${API_BASE_URL}/repos/${owner}/${repo}/contents/${path}`;
  // Add a cache-busting parameter to prevent stale cached responses
  const urlWithCacheBust = `${url}?t=${new Date().getTime()}`;
  
  addLog?.(`Fetching from URL: ${urlWithCacheBust}`);
  
  const response = await fetch(urlWithCacheBust, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHubCodeViewer/1.0',
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
    addLog?.(`Fetch failed with status ${response.status}: ${errorData.message}`);
    throw new Error(errorData.message || 'Failed to fetch repository contents.');
  }
  
  addLog?.(`Fetch successful from URL: ${url}`);

  const data: GitHubRepoContent[] = await response.json();
  // Sort directories first, then files, both alphabetically
  return data.sort((a, b) => {
    if (a.type === 'dir' && b.type === 'file') {
      return -1;
    }
    if (a.type === 'file' && b.type === 'dir') {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function getFileContent(downloadUrl: string): Promise<string> {
  const response = await fetch(downloadUrl);
  
  if (!response.ok) {
    throw new Error('Failed to fetch file content.');
  }

  return response.text();
}
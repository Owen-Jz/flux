export function getAppUrl(): string {
  const port = process.env.PORT || '3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://localhost:${port}`;
}

export function getAppUrlWithPath(path: string): string {
  return `${getAppUrl()}${path}`;
}
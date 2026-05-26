export function getAppUrl(): string {
  // NEXTAUTH_URL is always set to the canonical domain in every environment
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  const port = process.env.PORT || '3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://localhost:${port}`;
}

export function getAppUrlWithPath(path: string): string {
  return `${getAppUrl()}${path}`;
}
export { setupOfflineSync } from './offline-sync';

export function onUpdateAvailable(callback: () => void): () => void {
  window.addEventListener('pwa-update-available', callback);
  return () => window.removeEventListener('pwa-update-available', callback);
}

export async function applyUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;
  // By the time the user clicks "Refresh" the new SW is usually `waiting`,
  // not `installing` — fall back to `installing` only for the rare in-flight case.
  const newWorker = registration.waiting ?? registration.installing;
  if (!newWorker) return;
  newWorker.postMessage({ type: 'SKIP_WAITING' });
  await new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.location.reload();
        resolve();
      },
      { once: true }
    );
  });
}

export { setupOfflineSync } from './offline-sync';

export function onUpdateAvailable(callback: () => void): () => void {
  window.addEventListener('pwa-update-available', callback);
  return () => window.removeEventListener('pwa-update-available', callback);
}

export async function applyUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.installing) return;
  registration.installing.postMessage({ type: 'SKIP_WAITING' });
  // Reload once the new SW activates
  await new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
      resolve();
    }, { once: true });
  });
}

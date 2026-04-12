export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newSW = registration.installing;
      if (!newSW) return;

      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          broadcastUpdateAvailable();
        }
      });
    });

    console.log('[PWA] Service worker registered:', registration.scope);
  } catch (error) {
    console.error('[PWA] SW registration failed:', error);
  }
}

function broadcastUpdateAvailable(): void {
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

export function onUpdateAvailable(callback: () => void): () => void {
  window.addEventListener('pwa-update-available', callback);
  return () => window.removeEventListener('pwa-update-available', callback);
}

export async function applyUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.installing) return;
  registration.installing.postMessage({ type: 'SKIP_WAITING' });
  registration.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

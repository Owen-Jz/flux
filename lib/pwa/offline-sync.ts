import { checkStorageQuota } from './indexeddb';

export function setupOfflineSync(): () => void {
  const onlineHandler = async () => {
    console.log('[PWA] Back online — checking storage quota');
    await checkStorageQuota();
    window.dispatchEvent(new CustomEvent('pwa-reconnected'));
  };

  const offlineHandler = () => {
    console.log('[PWA] Went offline');
    window.dispatchEvent(new CustomEvent('pwa-offline'));
  };

  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);

  return () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  };
}

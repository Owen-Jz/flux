import { getCachedBoards, checkStorageQuota } from './indexeddb';

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

export async function refreshCachedBoards(): Promise<void> {
  const boards = await getCachedBoards();
  await Promise.allSettled(
    boards.map(async (board) => {
      try {
        const res = await fetch(`/api/boards/${board.id}/cached-data`);
        if (res.ok) {
          const data = await res.json();
          const { cacheBoard, cacheTasks } = await import('./indexeddb');
          await cacheBoard({ ...board, lastAccessed: Date.now() });
          if (data.tasks) {
            await cacheTasks(data.tasks);
          }
        }
      } catch {
        // Silent fail — user is offline or data not available
      }
    })
  );
}

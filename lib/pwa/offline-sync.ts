import { getCachedBoards, checkStorageQuota } from './indexeddb';

export function setupOfflineSync(): void {
  window.addEventListener('online', async () => {
    console.log('[PWA] Back online — checking storage quota');
    await checkStorageQuota();
    window.dispatchEvent(new CustomEvent('pwa-reconnected'));
  });

  window.addEventListener('offline', () => {
    console.log('[PWA] Went offline');
    window.dispatchEvent(new CustomEvent('pwa-offline'));
  });
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

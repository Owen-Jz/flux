/**
 * IndexedDB helpers for offline PWA data storage.
 * DB name: flux-pwa-db, version 1
 */

export interface CachedBoard {
  id: string;
  name: string;
  slug: string;
  lastAccessed: number; // Unix timestamp ms
}

export interface CachedTask {
  id: string;
  title: string;
  status: string;
  columnId: string;
  boardId: string;
  updatedAt: number;
}

export interface CachedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  activeWorkspaceId?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  workspaceId?: string;
  createdAt: number;
}

const DB_NAME = 'flux-pwa-db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // boards store — keyPath: id, stores last 10 accessed boards
      if (!db.objectStoreNames.contains('boards')) {
        db.createObjectStore('boards', { keyPath: 'id' });
      }

      // tasks store — keyPath: id, index: boardId
      if (!db.objectStoreNames.contains('tasks')) {
        const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
        tasksStore.createIndex('boardId', 'boardId', { unique: false });
      }

      // user store — keyPath: id
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }

      // subscriptions store — keyPath: endpoint
      if (!db.objectStoreNames.contains('subscriptions')) {
        db.createObjectStore('subscriptions', { keyPath: 'endpoint' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function cacheBoard(board: CachedBoard): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('boards', 'readwrite');
    const store = tx.objectStore('boards');
    const record: CachedBoard = { ...board, lastAccessed: Date.now() };
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    db.close();
  });
}

export async function getCachedBoards(limit = 10): Promise<CachedBoard[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('boards', 'readonly');
    const store = tx.objectStore('boards');
    const request = store.getAll();
    request.onsuccess = () => {
      const boards: CachedBoard[] = request.result;
      // Sort by lastAccessed descending, return top N
      boards.sort((a, b) => b.lastAccessed - a.lastAccessed);
      resolve(boards.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
    db.close();
  });
}

export async function cacheTasks(tasks: CachedTask[]): Promise<void> {
  if (tasks.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    tasks.forEach((task) => store.put(task));
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getTasksByBoardId(boardId: string): Promise<CachedTask[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tasks', 'readonly');
    const store = tx.objectStore('tasks');
    const index = store.index('boardId');
    const request = index.getAll(boardId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    db.close();
  });
}

export async function cacheUser(user: CachedUser): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user', 'readwrite');
    const store = tx.objectStore('user');
    const request = store.put(user);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    db.close();
  });
}

export async function getCachedUser(): Promise<CachedUser | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user', 'readonly');
    const store = tx.objectStore('user');
    const request = store.getAll();
    request.onsuccess = () => {
      const users: CachedUser[] = request.result;
      resolve(users[0]);
    };
    request.onerror = () => reject(request.error);
    db.close();
  });
}

export async function savePushSubscription(sub: PushSubscription): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('subscriptions', 'readwrite');
    const store = tx.objectStore('subscriptions');
    const request = store.put(sub);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    db.close();
  });
}

export async function getPushSubscriptions(): Promise<PushSubscription[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('subscriptions', 'readonly');
    const store = tx.objectStore('subscriptions');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    db.close();
  });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('subscriptions', 'readwrite');
    const store = tx.objectStore('subscriptions');
    const request = store.delete(endpoint);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    db.close();
  });
}

export async function evictOldestBoards(keepCount = 10): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('boards', 'readwrite');
    const store = tx.objectStore('boards');
    const request = store.getAll();
    request.onsuccess = () => {
      const boards: CachedBoard[] = request.result;
      boards.sort((a, b) => b.lastAccessed - a.lastAccessed);
      const toDelete = boards.slice(keepCount);
      toDelete.forEach((board) => store.delete(board.id));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function checkStorageQuota(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return false;
  }
  const estimate = await navigator.storage.estimate();
  const used = estimate.usage ?? 0;
  const quota = estimate.quota ?? 1;
  const percentUsed = used / quota;
  if (percentUsed > 0.9) {
    await evictOldestBoards(5);
    return true;
  }
  return false;
}

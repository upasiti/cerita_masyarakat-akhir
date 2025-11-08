// src/data/sync-db.js
const DB_NAME = 'story-sync-db';
const STORE_NAME = 'pending-stories';
const DB_VERSION = 1;

export function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'createdAt' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function savePendingStory(storyData) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(storyData);
    tx.oncomplete = () => resolve();
    tx.onerror = (err) => reject(err);
  });
}

export async function getAllPendingStories() {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (err) => reject(err);
  });
}

export async function deletePendingStory(createdAt) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(createdAt);
    tx.oncomplete = () => resolve();
    tx.onerror = (err) => reject(err);
  });
}

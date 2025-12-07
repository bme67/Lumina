import { VideoData, VideoMetadata } from '../types';

const DB_NAME = 'LuminaDB';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

export const saveVideo = async (video: VideoData): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(video);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllVideos = async (): Promise<VideoMetadata[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const request = index.openCursor(null, 'prev');
    const videos: VideoMetadata[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        // Exclude the heavy blob from the list view
        const { id, title, category, thumbnailUrl, createdAt, duration } = cursor.value;
        videos.push({ 
          id, 
          title, 
          category: category || 'Other', // Default to 'Other' for existing videos
          thumbnailUrl, 
          createdAt, 
          duration 
        });
        cursor.continue();
      } else {
        resolve(videos);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const getVideoById = async (id: string): Promise<VideoData | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteVideo = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
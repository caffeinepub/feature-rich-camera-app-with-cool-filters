import { Photo, Video } from '../App';

const DB_NAME = 'SnapStudioDB';
const DB_VERSION = 2;
const PHOTOS_STORE = 'photos';
const VIDEOS_STORE = 'videos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create photos store if it doesn't exist
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: 'id' });
      }
      
      // Create videos store if it doesn't exist
      if (!db.objectStoreNames.contains(VIDEOS_STORE)) {
        db.createObjectStore(VIDEOS_STORE, { keyPath: 'id' });
      }
    };
  });
}

// Photo operations
export async function savePhotoToGallery(photo: Photo): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHOTOS_STORE], 'readwrite');
    const store = transaction.objectStore(PHOTOS_STORE);
    const request = store.put(photo);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllPhotos(): Promise<Photo[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHOTOS_STORE], 'readonly');
    const store = transaction.objectStore(PHOTOS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function deletePhoto(photoId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHOTOS_STORE], 'readwrite');
    const store = transaction.objectStore(PHOTOS_STORE);
    const request = store.delete(photoId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearAllPhotos(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHOTOS_STORE], 'readwrite');
    const store = transaction.objectStore(PHOTOS_STORE);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Video operations
export async function saveVideoToGallery(video: Omit<Video, 'url'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VIDEOS_STORE], 'readwrite');
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.put(video);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllVideos(): Promise<Video[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VIDEOS_STORE], 'readonly');
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const videos = request.result.map((video: Omit<Video, 'url'>) => ({
        ...video,
        url: URL.createObjectURL(video.blob),
      }));
      resolve(videos);
    };
  });
}

export async function deleteVideo(videoId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VIDEOS_STORE], 'readwrite');
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.delete(videoId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearAllVideos(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VIDEOS_STORE], 'readwrite');
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Combined operations
export async function clearAllMedia(): Promise<void> {
  await Promise.all([clearAllPhotos(), clearAllVideos()]);
}

export async function getStorageSize(): Promise<string> {
  const [photos, videos] = await Promise.all([getAllPhotos(), getAllVideos()]);
  
  // Calculate photo storage
  const photoBytes = photos.reduce((sum, photo) => {
    const base64Length = photo.dataUrl.length - (photo.dataUrl.indexOf(',') + 1);
    return sum + (base64Length * 0.75);
  }, 0);
  
  // Calculate video storage
  const videoBytes = videos.reduce((sum, video) => {
    return sum + video.blob.size;
  }, 0);
  
  const totalBytes = photoBytes + videoBytes;

  if (totalBytes < 1024) return `${totalBytes.toFixed(0)} B`;
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
  return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
}

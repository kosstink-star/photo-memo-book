/**
 * storage.js - IndexedDB 저장소 모듈
 * 사진 Blob, EXIF 메타데이터, 사용자 메모를 로컬 PC 내에만 안전하게 보관합니다.
 */
import { openDB } from 'idb';

const DB_NAME = 'PhotoMemoDB';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

/**
 * IndexedDB 인스턴스를 열거나 생성합니다.
 */
function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
  });
}

/**
 * 사진 메모를 저장합니다.
 * @param {Object} photoData
 * @param {string} photoData.id - UUID
 * @param {Blob} photoData.imageBlob - 사진 원본 Blob
 * @param {string} photoData.thumbnailDataUrl - 리사이즈된 썸네일 (Base64 Data URL)
 * @param {string|null} photoData.date - 촬영 일시 (ISO 문자열)
 * @param {number|null} photoData.lat - 위도
 * @param {number|null} photoData.lng - 경도
 * @param {string} photoData.memo - 사용자 메모
 * @param {string} photoData.fileName - 원본 파일명
 * @param {number} photoData.createdAt - 저장 시각 타임스탬프
 */
export async function savePhoto(photoData) {
  const db = await getDB();
  await db.put(STORE_NAME, photoData);
}

/**
 * 모든 사진 메모를 날짜 역순(최신순)으로 가져옵니다.
 */
export async function getAllPhotos() {
  const db = await getDB();
  const allPhotos = await db.getAll(STORE_NAME);
  // 날짜 역순 정렬 (최신 → 과거)
  return allPhotos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * 특정 사진 메모를 가져옵니다.
 * @param {string} id
 */
export async function getPhoto(id) {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

/**
 * 특정 사진 메모를 삭제합니다.
 * @param {string} id
 */
export async function deletePhoto(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * 사진 개수를 반환합니다.
 */
export async function getPhotoCount() {
  const db = await getDB();
  return db.count(STORE_NAME);
}

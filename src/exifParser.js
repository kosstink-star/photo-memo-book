/**
 * exifParser.js - EXIF 데이터 추출 모듈
 * 서버 업로드 없이 브라우저 단에서 즉시 EXIF(촬영 일시, GPS 좌표) 추출
 */
import exifr from 'exifr';

/**
 * 사진 파일(File 객체)에서 EXIF 메타데이터를 추출합니다.
 * @param {File} file - 이미지 파일
 * @returns {Promise<{ date: string|null, lat: number|null, lng: number|null, allTags: Object }>}
 */
export async function extractExif(file) {
  try {
    // exifr은 HEIC, JPEG, PNG 등의 메타데이터를 네이티브로 파싱하며,
    // 날짜와 위/경도(소수점)를 자동으로 변환해서 줍니다.
    const tags = await exifr.parse(file, true);
    
    if (!tags) {
      return { date: null, lat: null, lng: null, allTags: {} };
    }

    let date = null;
    if (tags.DateTimeOriginal) {
      date = new Date(tags.DateTimeOriginal).toISOString();
    } else if (tags.CreateDate) {
      date = new Date(tags.CreateDate).toISOString();
    }

    // exifr은 latitude, longitude 속성으로 소수점 좌표를 바로 제공합니다
    const lat = tags.latitude != null ? tags.latitude : null;
    const lng = tags.longitude != null ? tags.longitude : null;

    return { date, lat, lng, allTags: tags };
  } catch (err) {
    console.warn('EXIF parsing error (exifr):', err);
    return { date: null, lat: null, lng: null, allTags: {} };
  }
}

/**
 * 사진 파일을 리사이즈하여 썸네일 Data URL을 생성합니다.
 * @param {File} file
 * @param {number} maxWidth
 * @returns {Promise<string>}
 */
export function createThumbnail(file, maxWidth = 600) {
  return new Promise((resolve) => {
    // 타임아웃 3초 설정
    const timeout = setTimeout(() => {
      resolve(null);
    }, 3000);

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () {
        // 브라우저가 지원하지 않는 포맷(예: HEIC)일 경우 썸네일 생성 실패로 간주하되 중단되진 않게 함
        clearTimeout(timeout);
        resolve(e.target.result); // 원본 데이터 URL을 그대로 반환 (브라우저가 렌더링 못할 수도 있음)
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      clearTimeout(timeout);
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
}

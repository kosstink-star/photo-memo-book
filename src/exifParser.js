/**
 * exifParser.js - EXIF 데이터 추출 모듈
 * 서버 업로드 없이 브라우저 단에서 즉시 EXIF(촬영 일시, GPS 좌표) 추출
 */
import EXIF from 'exif-js';

/**
 * GPS 도분초(DMS)를 십진수(Decimal Degrees)로 변환합니다.
 * @param {number[]} dms - [도, 분, 초]
 * @param {string} ref - 방향 ('N', 'S', 'E', 'W')
 * @returns {number|null}
 */
function dmsToDecimal(dms, ref) {
  if (!dms || dms.length < 3) return null;
  const degrees = dms[0] + dms[1] / 60 + dms[2] / 3600;
  return (ref === 'S' || ref === 'W') ? -degrees : degrees;
}

/**
 * EXIF 날짜 문자열("YYYY:MM:DD HH:MM:SS")을 ISO 문자열로 변환합니다.
 * @param {string} exifDate
 * @returns {string|null}
 */
function parseExifDate(exifDate) {
  if (!exifDate) return null;
  // "2023:10:24 14:30:22" → "2023-10-24T14:30:22"
  const cleaned = exifDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T');
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * 사진 파일(File 객체)에서 EXIF 메타데이터를 추출합니다.
 * @param {File} file - 이미지 파일
 * @returns {Promise<{ date: string|null, lat: number|null, lng: number|null, allTags: Object }>}
 */
export function extractExif(file) {
  return new Promise((resolve) => {
    // 1. 만약 EXIF.getData가 실패하거나 무한 로딩될 경우를 대비한 타임아웃
    const timeout = setTimeout(() => {
      resolve({ date: null, lat: null, lng: null, allTags: {} });
    }, 3000);

    try {
      // EXIF.js는 File 객체를 직접 읽을 수 있습니다. Image 태그 변환 과정을 생략하여 속도와 안정성을 높입니다.
      EXIF.getData(file, function () {
        clearTimeout(timeout);
        const allTags = EXIF.getAllTags(this) || {};

        const dateTimeOriginal = EXIF.getTag(this, 'DateTimeOriginal');
        const date = parseExifDate(dateTimeOriginal);

        const gpsLat = EXIF.getTag(this, 'GPSLatitude');
        const gpsLatRef = EXIF.getTag(this, 'GPSLatitudeRef');
        const gpsLng = EXIF.getTag(this, 'GPSLongitude');
        const gpsLngRef = EXIF.getTag(this, 'GPSLongitudeRef');

        const lat = dmsToDecimal(gpsLat, gpsLatRef);
        const lng = dmsToDecimal(gpsLng, gpsLngRef);

        resolve({ date, lat, lng, allTags });
      });
    } catch (err) {
      clearTimeout(timeout);
      console.warn('EXIF parsing error:', err);
      resolve({ date: null, lat: null, lng: null, allTags: {} });
    }
  });
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

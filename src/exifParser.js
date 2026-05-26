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
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        EXIF.getData(img, function () {
          const allTags = EXIF.getAllTags(this);

          // 촬영 일시 추출
          const dateTimeOriginal = EXIF.getTag(this, 'DateTimeOriginal');
          const date = parseExifDate(dateTimeOriginal);

          // GPS 좌표 추출
          const gpsLat = EXIF.getTag(this, 'GPSLatitude');
          const gpsLatRef = EXIF.getTag(this, 'GPSLatitudeRef');
          const gpsLng = EXIF.getTag(this, 'GPSLongitude');
          const gpsLngRef = EXIF.getTag(this, 'GPSLongitudeRef');

          const lat = dmsToDecimal(gpsLat, gpsLatRef);
          const lng = dmsToDecimal(gpsLng, gpsLngRef);

          resolve({ date, lat, lng, allTags });
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

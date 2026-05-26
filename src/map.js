/**
 * map.js - Leaflet 지도 모듈
 * OpenStreetMap을 활용한 촬영 위치 시각화
 */
import L from 'leaflet';
import 'leaflet.markercluster';

let mapInstance = null;
let markersLayer = null;

/**
 * 지도를 초기화합니다.
 * @param {string} containerId - 지도를 렌더링할 DOM 요소 ID
 */
export function initMap(containerId) {
  if (mapInstance) {
    mapInstance.invalidateSize();
    return mapInstance;
  }

  mapInstance = L.map(containerId, {
    zoomControl: true,
    attributionControl: true,
  }).setView([37.5665, 126.9780], 6); // 서울 중심, 한국 전체 보이는 줌

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapInstance);

  markersLayer = L.markerClusterGroup({
    chunkedLoading: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 50,
  });
  mapInstance.addLayer(markersLayer);

  return mapInstance;
}

/**
 * 지도 크기를 갱신합니다. (탭 전환 후 호출 필요)
 */
export function refreshMap() {
  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 100);
  }
}

/**
 * 사진 데이터 배열을 기반으로 마커를 지도에 표시합니다.
 * @param {Array} photos - { lat, lng, thumbnailDataUrl, memo, date, fileName } 배열
 */
export function renderMarkers(photos) {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  const validPhotos = photos.filter((p) => p.lat != null && p.lng != null);
  if (validPhotos.length === 0) return;

  validPhotos.forEach((photo) => {
    const dateStr = photo.date
      ? new Date(photo.date).toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : '날짜 미상';

    const popupContent = `
      <div style="max-width:220px;font-family:'Noto Sans KR','Plus Jakarta Sans',sans-serif;">
        <img src="${photo.thumbnailDataUrl}" 
             style="width:100%;border-radius:12px;margin-bottom:8px;object-fit:cover;max-height:150px;" 
             alt="${photo.fileName || '사진'}" />
        <p style="font-size:12px;color:#87726e;margin:0 0 4px;">${dateStr}</p>
        <p style="font-size:14px;color:#1c1c19;margin:0;line-height:1.5;">
          ${photo.memo || '<span style="color:#87726e;">메모 없음</span>'}
        </p>
      </div>
    `;

    // 커스텀 마커 아이콘
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width:36px;height:36px;
        background:linear-gradient(135deg,#964735,#d97b66);
        border:3px solid #fff;
        border-radius:50%;
        box-shadow:0 2px 8px rgba(150,71,53,0.4);
        display:flex;align-items:center;justify-content:center;
      "><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 24 24'>
        <path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/>
      </svg></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    L.marker([photo.lat, photo.lng], { icon: markerIcon })
      .bindPopup(popupContent, {
        maxWidth: 240,
        className: 'photo-popup',
      })
      .addTo(markersLayer);
  });

  // 모든 마커가 보이도록 지도 범위 조정
  if (validPhotos.length > 0) {
    const bounds = L.latLngBounds(validPhotos.map((p) => [p.lat, p.lng]));
    mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }
}

/**
 * 지도 인스턴스를 반환합니다.
 */
export function getMap() {
  return mapInstance;
}

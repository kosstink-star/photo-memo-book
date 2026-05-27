/**
 * map.js - Leaflet 지도 모듈
 * OpenStreetMap을 활용한 촬영 위치 시각화
 */
import L from 'leaflet';
import './leaflet-setup.js';
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
    zoomControl: false, // 커스텀 디자인을 위해 기본 줌 컨트롤 숨김
    attributionControl: false, // 화면 깔끔하게 유지
  }).setView([37.5665, 126.9780], 6); // 서울 중심, 한국 전체 보이는 줌

  // 다크 테마 CartoDB Dark Matter 타일
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd',
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
      <div style="max-width:220px;font-family:'Inter',sans-serif;">
        <img src="${photo.thumbnailDataUrl}" 
             style="width:100%;border-radius:12px;margin-bottom:8px;object-fit:cover;max-height:150px;" 
             alt="${photo.fileName || '사진'}" />
        <p style="font-size:12px;color:rgba(255,255,255,0.7);margin:0 0 4px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">${dateStr}</p>
        <p style="font-size:14px;color:#fff;margin:0;line-height:1.5;font-weight:500;">
          ${photo.memo || '<span style="color:rgba(255,255,255,0.5);">메모 없음</span>'}
        </p>
      </div>
    `;

    // 썸네일을 포함한 고급 커스텀 마커
    const markerHtml = `
      <div class="thumbnail-marker group">
        <img src="${photo.thumbnailDataUrl}" class="thumbnail-img" alt="marker"/>
        <div class="thumbnail-ring"></div>
      </div>
    `;

    const markerIcon = L.divIcon({
      className: 'bg-transparent border-none', // 배경/보더 제거
      html: markerHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 40], // 핀의 뾰족한 부분이 바닥 중앙
      popupAnchor: [0, -42],
    });

    L.marker([photo.lat, photo.lng], { icon: markerIcon })
      .bindPopup(popupContent, {
        maxWidth: 240,
        className: 'photo-popup',
      })
      .addTo(markersLayer);
  });

  // 모든 마커가 보이도록 지도 범위 조정
  if (validPhotos.length === 1) {
    mapInstance.setView([validPhotos[0].lat, validPhotos[0].lng], 14);
  } else if (validPhotos.length > 1) {
    const bounds = markersLayer.getBounds();
    if (bounds && bounds.isValid()) {
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}

/**
 * 지도 인스턴스를 반환합니다.
 */
export function getMap() {
  return mapInstance;
}

/**
 * map.js - Leaflet 지도 모듈
 * OpenStreetMap을 활용한 촬영 위치 시각화
 *
 * 기능:
 *  - 3가지 타일 테마 순환 (standard / dark / satellite)
 *  - 마커 클릭 시 콜백 호출 (바텀 시트 연동)
 *  - 여정 폴리라인 토글
 *  - 히트맵 토글 (마커 레이어와 상호 전환)
 */
import L from 'leaflet';
import './leaflet-setup.js';
import 'leaflet.markercluster';
import 'leaflet.heat'; // L.heatLayer 등록 (window.L 필요)

/* ------------------------------------------------------------------ */
/*  모듈 상태                                                          */
/* ------------------------------------------------------------------ */

let mapInstance = null;
let markersLayer = null;

/** 타일 레이어 관련 */
let currentTileLayer = null;
let currentThemeIndex = 0;

const TILE_THEMES = [
  {
    name: 'standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { maxZoom: 19, attribution: '&copy; OpenStreetMap' },
  },
  {
    name: 'dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: { maxZoom: 20, attribution: '&copy; CartoDB' },
  },
  {
    name: 'satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: { maxZoom: 18, attribution: '&copy; Esri' },
  },
];

/** 마커 클릭 콜백 */
let markerClickCallback = null;

/** 여정 폴리라인 */
let journeyLine = null;

/** 히트맵 레이어 */
let heatLayer = null;

/* ------------------------------------------------------------------ */
/*  지도 초기화                                                        */
/* ------------------------------------------------------------------ */

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
  }).setView([37.5665, 126.978], 6); // 서울 중심, 한국 전체 보이는 줌

  // 기본 타일 레이어 (standard)
  const defaultTheme = TILE_THEMES[0];
  currentTileLayer = L.tileLayer(defaultTheme.url, defaultTheme.options).addTo(mapInstance);
  currentThemeIndex = 0;

  // 마커 클러스터 그룹
  markersLayer = L.markerClusterGroup({
    chunkedLoading: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 50,
  });
  mapInstance.addLayer(markersLayer);

  return mapInstance;
}

/* ------------------------------------------------------------------ */
/*  타일 테마 순환                                                      */
/* ------------------------------------------------------------------ */

/**
 * 타일 테마를 순환합니다 (standard → dark → satellite → …).
 * @returns {string} 새 테마 이름 ('standard' | 'dark' | 'satellite')
 */
export function cycleMapTheme() {
  if (!mapInstance) return TILE_THEMES[0].name;

  // 현재 타일 제거
  if (currentTileLayer) {
    mapInstance.removeLayer(currentTileLayer);
  }

  // 다음 인덱스로 순환
  currentThemeIndex = (currentThemeIndex + 1) % TILE_THEMES.length;
  const next = TILE_THEMES[currentThemeIndex];

  currentTileLayer = L.tileLayer(next.url, next.options).addTo(mapInstance);

  return next.name;
}

/* ------------------------------------------------------------------ */
/*  마커 클릭 콜백 등록                                                 */
/* ------------------------------------------------------------------ */

/**
 * 마커 클릭 시 호출될 콜백을 등록합니다.
 * @param {(photo: object) => void} cb - 사진 객체를 인자로 받는 콜백
 */
export function setMarkerClickCallback(cb) {
  markerClickCallback = cb;
}

/* ------------------------------------------------------------------ */
/*  마커 렌더링                                                        */
/* ------------------------------------------------------------------ */

/**
 * 사진 데이터 배열을 기반으로 마커를 지도에 표시합니다.
 * 팝업 대신 등록된 콜백(onMarkerClick)을 호출합니다.
 * @param {Array} photos - { lat, lng, thumbnailDataUrl, memo, date, fileName } 배열
 */
export function renderMarkers(photos) {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  const validPhotos = photos.filter((p) => p.lat != null && p.lng != null);
  if (validPhotos.length === 0) return;

  validPhotos.forEach((photo) => {
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

    // 마커 클릭 → 콜백 호출 (바텀 시트 연동)
    const marker = L.marker([photo.lat, photo.lng], { icon: markerIcon });

    marker.on('click', () => {
      if (markerClickCallback) {
        markerClickCallback(photo);
      }
    });

    marker.addTo(markersLayer);
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

/* ------------------------------------------------------------------ */
/*  여정 폴리라인 토글                                                  */
/* ------------------------------------------------------------------ */

/**
 * GPS 사진을 날짜순으로 연결하는 폴리라인을 토글합니다.
 * @param {Array} photos - 사진 배열
 * @returns {boolean} 라인이 표시되면 true, 숨겨지면 false
 */
export function toggleJourneyLine(photos) {
  if (!mapInstance) return false;

  // 이미 표시 중이면 제거
  if (journeyLine) {
    mapInstance.removeLayer(journeyLine);
    journeyLine = null;
    return false;
  }

  // GPS 좌표가 있는 사진만 필터 후 날짜순 정렬
  const sorted = photos
    .filter((p) => p.lat != null && p.lng != null)
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  if (sorted.length < 2) return false;

  const latlngs = sorted.map((p) => [p.lat, p.lng]);

  journeyLine = L.polyline(latlngs, {
    color: '#00f0ff',
    dashArray: '10, 8',
    weight: 3,
    opacity: 0.7,
  }).addTo(mapInstance);

  return true;
}

/* ------------------------------------------------------------------ */
/*  히트맵 토글                                                        */
/* ------------------------------------------------------------------ */

/**
 * 사진 위치 기반 히트맵을 토글합니다.
 * 히트맵이 켜지면 마커 레이어는 숨기고, 꺼지면 마커를 다시 표시합니다.
 * @param {Array} photos - 사진 배열
 * @returns {boolean} 히트맵이 표시되면 true, 숨겨지면 false
 */
export function toggleHeatmap(photos) {
  if (!mapInstance) return false;

  // 이미 표시 중이면 제거하고 마커 복원
  if (heatLayer) {
    mapInstance.removeLayer(heatLayer);
    heatLayer = null;

    if (markersLayer && !mapInstance.hasLayer(markersLayer)) {
      mapInstance.addLayer(markersLayer);
    }
    return false;
  }

  // 히트맵 데이터 준비 — [lat, lng, intensity]
  const points = photos
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => [p.lat, p.lng, 0.6]);

  if (points.length === 0) return false;

  heatLayer = L.heatLayer(points, {
    radius: 25,
    blur: 20,
  }).addTo(mapInstance);

  // 마커 레이어 숨기기
  if (markersLayer && mapInstance.hasLayer(markersLayer)) {
    mapInstance.removeLayer(markersLayer);
  }

  return true;
}

/* ------------------------------------------------------------------ */
/*  유틸리티                                                           */
/* ------------------------------------------------------------------ */

/**
 * 지도 크기를 갱신합니다. (탭 전환 후 호출 필요)
 */
export function refreshMap() {
  if (mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 100);
  }
}

/**
 * 지도 인스턴스를 반환합니다.
 */
export function getMap() {
  return mapInstance;
}

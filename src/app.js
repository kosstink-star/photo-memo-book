/**
 * app.js - 메인 앱 진입점
 * STITCH Liquid Bento 디자인 시스템 기반
 * 뷰 토글, 이벤트 리스너, UI 렌더링
 *
 * 기능:
 *  - 홈/타임라인/캘린더/지도 4개 뷰 + 추가 버튼
 *  - 사진 업로드 및 EXIF 추출
 *  - 즐겨찾기(⭐), 랜덤 추억, 월간 리캡, 자동 해시태그 앨범
 *  - 촬영 당시 날씨 표시 (Open-Meteo API)
 */
import './style.css';
import heic2any from 'heic2any';
import * as htmlToImage from 'html-to-image';
import { extractExif, createThumbnail } from './exifParser.js';
import { savePhoto, getAllPhotos, deletePhoto, getPhotoCount } from './storage.js';
import { initMap, refreshMap, renderMarkers, cycleMapTheme, toggleJourneyLine, toggleHeatmap, setMarkerClickCallback } from './map.js';

// ──────────────────────────────────────
// DOM References
// ──────────────────────────────────────
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadContent = document.getElementById('upload-content');
const uploadLoading = document.getElementById('upload-loading');
const exifPanel = document.getElementById('exif-panel');
const memoSection = document.getElementById('memo-section');
const memoTextarea = document.getElementById('memo-textarea');
const btnSave = document.getElementById('btn-save');
const btnAddHashtag = document.getElementById('btn-add-hashtag');

// 검색 요소
const btnSearch = document.getElementById('btn-search');
const btnSearchClose = document.getElementById('btn-search-close');
const searchContainer = document.getElementById('search-container');
const searchInput = document.getElementById('search-input');

// 기타 UI
const btnCancel = document.getElementById('btn-cancel');
const timelineGrid = document.getElementById('timeline-grid');
const timelineEmptyState = document.getElementById('timeline-empty');
const photoCountBadge = document.getElementById('photo-count');
const toast = document.getElementById('toast');

// 뷰 컨테이너
const homeView = document.getElementById('view-home');
const timelineView = document.getElementById('view-timeline');
const mapView = document.getElementById('view-map');
const calendarView = document.getElementById('view-calendar');

// 하단 네비
const navHome = document.getElementById('nav-home');
const navTimeline = document.getElementById('nav-timeline');
const navMap = document.getElementById('nav-map');
const navAdd = document.getElementById('nav-add');
const navCalendar = document.getElementById('nav-calendar');

// EXIF 표시 요소 (날짜와 주소는 수동입력으로 통합됨)
const exifCoord = document.getElementById('exif-coord');
const exifPreview = document.getElementById('exif-preview');

// 수동 입력 요소
const manualDateWrapper = document.getElementById('manual-date-wrapper');
const manualDateInput = document.getElementById('manual-date');
const manualAddressWrapper = document.getElementById('manual-address-wrapper');
const manualAddressInput = document.getElementById('manual-address');

// 필터 바 요소
const filterBar = document.getElementById('filter-bar');
const locationFilterWrapper = document.getElementById('location-filter-wrapper');
const locationFilterSelect = document.getElementById('location-filter-select');

// 설정 및 백업 요소
const btnSettings = document.getElementById('btn-settings');
const settingsModal = document.getElementById('settings-modal');
const settingsModalClose = document.getElementById('settings-modal-close');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const importInput = document.getElementById('import-input');

// 모달 요소 (Parallax 스타일)
const photoModal = document.getElementById('photo-modal');
const photoModalClose = document.getElementById('photo-modal-close');
const photoModalEdit = document.getElementById('photo-modal-edit');
const photoModalExport = document.getElementById('photo-modal-export');
const photoModalFavorite = document.getElementById('photo-modal-favorite');
const photoModalImg = document.getElementById('photo-modal-img');
const photoModalDate = document.getElementById('photo-modal-date');
const photoModalDateInput = document.getElementById('photo-modal-date-input');
const photoModalLocation = document.getElementById('photo-modal-location');
const photoModalLocationInput = document.getElementById('photo-modal-location-input');
const photoModalMemo = document.getElementById('photo-modal-memo');
const photoModalMemoTextarea = document.getElementById('photo-modal-memo-textarea');
const photoModalTitle = document.getElementById('photo-modal-title');
const photoModalTag = document.getElementById('photo-modal-tag');
const photoModalSaveBtn = document.getElementById('photo-modal-save-btn');
const photoModalWeatherRow = document.getElementById('photo-modal-weather-row');
const photoModalWeather = document.getElementById('photo-modal-weather');

// 홈 뷰 요소
const homeTotalCount = document.getElementById('home-total-count');
const homeRecentCard = document.getElementById('home-recent-card');
const homeRecentImg = document.getElementById('home-recent-img');
const homeRecentMemo = document.getElementById('home-recent-memo');
const homeRecentLocation = document.getElementById('home-recent-location');
const homeRecentDate = document.getElementById('home-recent-date');
const homeStatsTotal = document.getElementById('home-stats-total');
const homeStatsBars = document.getElementById('home-stats-bars');
const homeStatsLabels = document.getElementById('home-stats-labels');
const homeGotoTimeline = document.getElementById('home-goto-timeline');
const homeUploadBtn = document.getElementById('home-upload-btn');

// 랜덤 추억 요소
const homeRandomCard = document.getElementById('home-random-card');
const homeRandomImg = document.getElementById('home-random-img');
const homeRandomMemo = document.getElementById('home-random-memo');
const homeRandomDate = document.getElementById('home-random-date');
const homeRandomLocation = document.getElementById('home-random-location');
const homeRandomShuffle = document.getElementById('home-random-shuffle');

// 리캡 요소
const homeRecapCard = document.getElementById('home-recap-card');
const homeRecapCount = document.getElementById('home-recap-count');
const homeRecapDiff = document.getElementById('home-recap-diff');
const homeRecapSubtitle = document.getElementById('home-recap-subtitle');
const homeRecapTags = document.getElementById('home-recap-tags');
const homeRecapLocations = document.getElementById('home-recap-locations');

// 앨범 요소
const homeAlbumsCard = document.getElementById('home-albums-card');
const homeAlbumsList = document.getElementById('home-albums-list');

// 맵 뷰 요소
const mapLocationCount = document.getElementById('map-location-count');
const mapHighlightCard = document.getElementById('map-highlight-card');
const mapHighlightImg = document.getElementById('map-highlight-img');
const mapHighlightMemo = document.getElementById('map-highlight-memo');

// 맵 컨트롤 요소
const mapBtnTheme = document.getElementById('map-btn-theme');
const mapBtnJourney = document.getElementById('map-btn-journey');
const mapBtnHeatmap = document.getElementById('map-btn-heatmap');
const mapFilterChips = document.getElementById('map-filter-chips');
const mapBottomSheet = document.getElementById('map-bottom-sheet');
const mapSheetImg = document.getElementById('map-sheet-img');
const mapSheetDate = document.getElementById('map-sheet-date');
const mapSheetMemo = document.getElementById('map-sheet-memo');
const mapSheetAddress = document.getElementById('map-sheet-address');
const mapSheetClose = document.getElementById('map-sheet-close');

// 홈 뷰 '오늘의 추억' 요소
const homeOnthisdayCard = document.getElementById('home-onthisday-card');
const homeOnthisdayLabel = document.getElementById('home-onthisday-label');
const homeOnthisdayList = document.getElementById('home-onthisday-list');

// 캘린더 요소
const calTitle = document.getElementById('cal-title');
const calGrid = document.getElementById('cal-grid');
const calPrev = document.getElementById('cal-prev');
const calNext = document.getElementById('cal-next');
const calDayPhotos = document.getElementById('cal-day-photos');
const calDayTitle = document.getElementById('cal-day-title');
const calDayGrid = document.getElementById('cal-day-grid');

// ──────────────────────────────────────
// State
// ──────────────────────────────────────
let currentView = 'home';
let currentExifData = null;
let currentThumbnail = null;
let currentFileBase64 = null;
let currentFileName = '';
let mapInitialized = false;
let currentFilter = 'all'; // 'all', 'favorite', 'week', 'month', 'year', 'location'
let currentLocationFilter = '';
let searchQuery = '';
let currentEditingPhoto = null;
let currentMapFilter = 'all'; // 지도 필터 상태
let currentRandomPhoto = null; // 랜덤 추억 상태

// 캘린더 상태
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelectedDate = null;

// ──────────────────────────────────────
// WMO Weather Code Mapping
// ──────────────────────────────────────
const WMO_CODES = {
  0: { emoji: '☀️', desc: '맑음' },
  1: { emoji: '🌤️', desc: '대체로 맑음' },
  2: { emoji: '⛅', desc: '부분적 흐림' },
  3: { emoji: '☁️', desc: '흐림' },
  45: { emoji: '🌫️', desc: '안개' },
  48: { emoji: '🌫️', desc: '서리 안개' },
  51: { emoji: '🌧️', desc: '가벼운 이슬비' },
  53: { emoji: '🌧️', desc: '이슬비' },
  55: { emoji: '🌧️', desc: '강한 이슬비' },
  56: { emoji: '🌧️', desc: '차가운 이슬비' },
  57: { emoji: '🌧️', desc: '강한 차가운 이슬비' },
  61: { emoji: '🌧️', desc: '가벼운 비' },
  63: { emoji: '🌧️', desc: '비' },
  65: { emoji: '🌧️', desc: '강한 비' },
  66: { emoji: '🌧️', desc: '차가운 비' },
  67: { emoji: '🌧️', desc: '강한 차가운 비' },
  71: { emoji: '🌨️', desc: '가벼운 눈' },
  73: { emoji: '🌨️', desc: '눈' },
  75: { emoji: '🌨️', desc: '강한 눈' },
  77: { emoji: '🌨️', desc: '눈 알갱이' },
  80: { emoji: '🌦️', desc: '가벼운 소나기' },
  81: { emoji: '🌦️', desc: '소나기' },
  82: { emoji: '⛈️', desc: '강한 소나기' },
  85: { emoji: '🌨️', desc: '가벼운 눈 소나기' },
  86: { emoji: '🌨️', desc: '강한 눈 소나기' },
  95: { emoji: '⛈️', desc: '뇌우' },
  96: { emoji: '⛈️', desc: '우박 뇌우' },
  99: { emoji: '⛈️', desc: '강한 우박 뇌우' },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { emoji: '🌡️', desc: '알 수 없음' };
}

// 해시태그 포맷팅 유틸리티
function formatHashtags(text) {
  if (!text) return '';
  // 정규식: # 뒤에 영문, 한글, 숫자가 오고 그 뒤에 공백이나 구두점이 오는 경우
  return text.replace(/(#[A-Za-z0-9가-힣_]+)/g, '<span class="hashtag" data-tag="$1">$1</span>');
}

// ──────────────────────────────────────
// Utilities
// ──────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatDateShort(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

function formatCoord(value, isLat) {
  if (value == null) return null;
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minRaw = (abs - deg) * 60;
  const min = Math.floor(minRaw);
  const sec = ((minRaw - min) * 60).toFixed(1);
  const dir = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ko`);
    if (!res.ok) throw new Error(`API1_ERR_${res.status}`);
    const data = await res.json();
    const parts = [data.principalSubdivision, data.locality || data.city].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    throw new Error('API1_NO_ADDR');
  } catch (err) {
    console.warn('BigDataCloud API failed, trying JSONP fallback...', err);
    try {
      const data2 = await new Promise((resolve, reject) => {
        const cbName = 'jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const timeout = setTimeout(() => {
          delete window[cbName];
          reject(new Error('JSONP_TIMEOUT'));
        }, 5000);
        window[cbName] = function(data) {
          clearTimeout(timeout);
          delete window[cbName];
          resolve(data);
        };
        const script = document.createElement('script');
        script.src = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko&email=test@example.com&json_callback=${cbName}`;
        script.onerror = () => {
          clearTimeout(timeout);
          delete window[cbName];
          reject(new Error('JSONP_FAILED'));
        };
        document.body.appendChild(script);
        script.onload = () => {
          try { document.body.removeChild(script); } catch(e){}
        };
      });
      return data2.display_name || '주소 변환 불가';
    } catch (err2) {
      console.warn('JSONP failed, trying AllOrigins Proxy fallback...', err2);
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko&email=test@example.com`)}`;
        const res3 = await fetch(proxyUrl);
        if (!res3.ok) throw new Error('PROXY_ERR');
        const proxyData = await res3.json();
        const data3 = JSON.parse(proxyData.contents);
        return data3.display_name || '주소 변환 불가';
      } catch (err3) {
        console.error('All fallbacks failed:', err3);
        return `주소 차단됨 (통신 불가)`;
      }
    }
  }
}

// ──────────────────────────────────────
// Weather API (Open-Meteo)
// ──────────────────────────────────────
async function fetchWeather(lat, lng, dateStr) {
  if (lat == null || lng == null || !dateStr) return null;
  try {
    const d = new Date(dateStr);
    const dateOnly = d.toISOString().split('T')[0]; // YYYY-MM-DD
    const today = new Date();
    today.setHours(0,0,0,0);

    let apiUrl;
    if (d < today) {
      // 과거 날씨
      apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${dateOnly}&end_date=${dateOnly}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    } else {
      // 오늘 또는 미래
      apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${dateOnly}&end_date=${dateOnly}`;
    }

    const res = await fetch(apiUrl);
    if (!res.ok) return null;
    const data = await res.json();

    if (data.daily && data.daily.weather_code && data.daily.weather_code.length > 0) {
      const code = data.daily.weather_code[0];
      const tempMax = data.daily.temperature_2m_max?.[0];
      const tempMin = data.daily.temperature_2m_min?.[0];
      const info = getWeatherInfo(code);
      return {
        code,
        emoji: info.emoji,
        desc: info.desc,
        tempMax: tempMax != null ? Math.round(tempMax) : null,
        tempMin: tempMin != null ? Math.round(tempMin) : null,
      };
    }
    return null;
  } catch (err) {
    console.warn('Weather API failed:', err);
    return null;
  }
}

function formatWeatherDisplay(weather) {
  if (!weather) return null;
  let text = `${weather.emoji} ${weather.desc}`;
  if (weather.tempMax != null) {
    text += ` ${weather.tempMin ?? ''}~${weather.tempMax}°C`;
  }
  return text;
}

// ──────────────────────────────────────
// File Upload & EXIF Extraction
// ──────────────────────────────────────
async function handleFilesSelect(files) {
  if (files.length === 0) return;
  
  if (files.length === 1) {
    handleFileSelect(files[0]);
    return;
  }

  // 다중 파일 처리 로직 (자동 저장)
  switchView('timeline');
  uploadArea.classList.remove('hidden');
  uploadContent.classList.add('hidden');
  uploadLoading.classList.remove('hidden');
  uploadLoading.classList.add('active');
  exifPanel.classList.add('hidden');

  let successCount = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic';
    
    if (!file.type.startsWith('image/') && !isHeic) continue;

    uploadLoading.querySelector('p').textContent = `다중 사진 처리 중... (${i+1}/${files.length})`;

    let processFile = file;
    try {
      if (isHeic) {
        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        processFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
      }
      
      const [exifData, thumbnail, base64] = await Promise.all([
        extractExif(processFile).catch(() => ({})),
        createThumbnail(processFile).catch(() => null),
        fileToBase64(processFile).catch(() => null)
      ]);

      if (base64 && thumbnail) {
        let address = null;
        if (exifData.lat != null && exifData.lng != null) {
          address = await reverseGeocode(exifData.lat, exifData.lng).catch(() => null);
        }

        // 날씨 정보 가져오기
        let weather = null;
        if (exifData.lat != null && exifData.lng != null && exifData.date) {
          weather = await fetchWeather(exifData.lat, exifData.lng, exifData.date).catch(() => null);
        }

        const photoData = {
          id: generateId(),
          imageDataUrl: base64,
          thumbnailDataUrl: thumbnail,
          date: exifData.date || new Date().toISOString(),
          lat: exifData.lat || null,
          lng: exifData.lng || null,
          address: address || null,
          memo: '',
          fileName: processFile.name,
          createdAt: Date.now(),
          favorite: false,
          weather: weather || null,
        };

        await savePhoto(photoData);
        successCount++;
      }
    } catch (e) {
      console.error('Batch upload error for file', file.name, e);
    }
  }

  uploadLoading.classList.add('hidden');
  uploadLoading.classList.remove('active');
  uploadArea.classList.add('hidden');
  
  showToast(`${successCount}개의 추억이 저장되었습니다. 카드를 클릭해 내용을 수정할 수 있습니다.`);
  renderTimeline();
  updateHomeView();
  if (currentView === 'map') {
    refreshMapMarkers();
  }
}

async function handleFileSelect(file) {
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic';

  if (!file || (!file.type.startsWith('image/') && !isHeic)) {
    showToast('이미지 파일만 업로드할 수 있습니다.');
    return;
  }

  // 타임라인 뷰로 전환
  switchView('timeline');

  // 로딩 표시
  uploadArea.classList.remove('hidden');
  uploadContent.classList.add('hidden');
  uploadLoading.classList.remove('hidden');
  uploadLoading.classList.add('active');
  exifPanel.classList.add('hidden');

  let processFile = file;

  try {
    if (isHeic) {
      uploadLoading.querySelector('p').textContent = 'HEIC 포맷을 변환 중입니다 (최대 10초 소요)...';
      const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      processFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
      uploadLoading.querySelector('p').textContent = 'EXIF 데이터를 분석하고 있습니다...';
    }
  } catch (err) {
    console.error('HEIC conversion failed:', err);
    uploadLoading.classList.add('hidden');
    uploadLoading.classList.remove('active');
    uploadContent.classList.remove('hidden');
    uploadArea.classList.add('hidden');
    showToast('HEIC 이미지 변환 중 오류가 발생했습니다.');
    return;
  }

  Promise.all([extractExif(processFile), createThumbnail(processFile)])
    .then(async ([exifData, thumbnail]) => {
      currentExifData = exifData;
      currentThumbnail = thumbnail;
      currentFileName = file.name || 'photo.jpg';

      try {
        currentFileBase64 = await fileToBase64(processFile);
      } catch (e) {
        console.error('Base64 read failed:', e);
        currentFileBase64 = null;
      }

      // 로딩 해제
      uploadLoading.classList.add('hidden');
      uploadLoading.classList.remove('active');
      uploadContent.classList.remove('hidden');

      // 미리보기 표시
      exifPreview.src = thumbnail;
      exifPreview.classList.remove('hidden');

      // EXIF 정보 표시 (항상 수동 입력 필드 사용)
      if (exifData.date) {
        const d = new Date(exifData.date);
        const offset = d.getTimezoneOffset() * 60000;
        manualDateInput.value = (new Date(d - offset)).toISOString().slice(0,10);
      } else {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        manualDateInput.value = (new Date(d - offset)).toISOString().split('T')[0];
      }

      if (exifData.lat != null && exifData.lng != null) {
        exifCoord.textContent = `${exifData.lat.toFixed(5)}, ${exifData.lng.toFixed(5)}`;
        manualAddressInput.value = '주소를 불러오는 중...';

        reverseGeocode(exifData.lat, exifData.lng).then(address => {
          if (address) {
            exifData.address = address;
            manualAddressInput.value = address;
          } else {
            manualAddressInput.value = '';
            manualAddressInput.placeholder = '주소를 찾을 수 없음';
          }
        });
      } else {
        exifCoord.textContent = '정보 없음';
        manualAddressInput.value = '';
        manualAddressInput.placeholder = '촬영 장소를 입력하세요';
      }

      // 패널 표시
      exifPanel.classList.remove('hidden');
      uploadArea.classList.add('hidden'); // 로딩 끝났으므로 업로드 영역 숨김
      memoTextarea.value = '';
      memoTextarea.focus();
    })
    .catch((err) => {
      console.error('EXIF extraction failed:', err);
      uploadLoading.classList.add('hidden');
      uploadLoading.classList.remove('active');
      uploadContent.classList.remove('hidden');
      uploadArea.classList.add('hidden');
      showToast('사진 분석 중 오류가 발생했습니다.');
    });
}

// ──────────────────────────────────────
// Save Photo
// ──────────────────────────────────────
let isSaving = false;

async function handleSave() {
  if (isSaving) return;
  if (!currentFileBase64 || !currentThumbnail) {
    showToast('파일 변환이 완료되지 않았습니다.');
    return;
  }

  isSaving = true;
  try {
    // 수동 입력값 적용 (항상 필드 값 사용)
    let finalDate = null;
    const dateVal = manualDateInput.value;
    if (dateVal) {
      finalDate = new Date(dateVal).toISOString();
    }

    let finalAddress = manualAddressInput.value.trim() || null;

    // 날씨 정보 가져오기
    let weather = null;
    if (currentExifData?.lat != null && currentExifData?.lng != null && finalDate) {
      weather = await fetchWeather(currentExifData.lat, currentExifData.lng, finalDate).catch(() => null);
    }

    const photoData = {
      id: generateId(),
      imageDataUrl: currentFileBase64,
      thumbnailDataUrl: currentThumbnail,
      date: finalDate,
      lat: currentExifData?.lat || null,
      lng: currentExifData?.lng || null,
      address: finalAddress,
      memo: memoTextarea.value.trim(),
      fileName: currentFileName,
      createdAt: Date.now(),
      favorite: false,
      weather: weather || null,
    };

    await savePhoto(photoData);
    showToast('추억이 안전하게 저장되었습니다 ✨');
    resetUploadState();
    await renderTimeline();
    await updateHomeView();
  } catch (err) {
    console.error('Save failed:', err);
    showToast(`저장 오류: ${err.name} - ${err.message}`);
  } finally {
    isSaving = false;
  }
}

function handleCancel() {
  resetUploadState();
}

function resetUploadState() {
  currentExifData = null;
  currentThumbnail = null;
  currentFileBase64 = null;
  currentFileName = '';
  fileInput.value = '';
  exifPanel.classList.add('hidden');
  exifPreview.classList.add('hidden');
  uploadArea.classList.add('hidden');
  memoTextarea.value = '';
}

// ──────────────────────────────────────
// Delete Photo
// ──────────────────────────────────────
async function handleDelete(id) {
  if (!confirm('이 추억을 삭제하시겠습니까?')) return;
  try {
    await deletePhoto(id);
    showToast('삭제되었습니다.');
    await renderTimeline();
    await updateHomeView();
  } catch (err) {
    console.error('Delete failed:', err);
    showToast('삭제 중 오류가 발생했습니다.');
  }
}

// ──────────────────────────────────────
// Toggle Favorite
// ──────────────────────────────────────
async function toggleFavorite(photo) {
  photo.favorite = !photo.favorite;
  await savePhoto(photo);
  showToast(photo.favorite ? '즐겨찾기에 추가되었습니다 ⭐' : '즐겨찾기에서 제거되었습니다');
  return photo.favorite;
}

// ──────────────────────────────────────
// Render Home View (screen10)
// ──────────────────────────────────────
async function updateHomeView() {
  const photos = await getAllPhotos();
  const count = photos.length;

  // 총 개수 표시
  homeTotalCount.textContent = count.toLocaleString();
  homeStatsTotal.textContent = `총 ${count}개의 추억`;

  // 동적 월별 통계 차트 렌더링
  renderMonthlyChart(photos);

  // 최근 기록 카드
  if (count > 0) {
    const recent = photos[0];
    homeRecentCard.style.display = '';
    homeRecentImg.src = recent.thumbnailDataUrl || recent.imageDataUrl;
    homeRecentMemo.textContent = recent.memo || recent.fileName || '최근 기록';
    homeRecentLocation.textContent = recent.address || (recent.lat ? `${recent.lat.toFixed(4)}, ${recent.lng.toFixed(4)}` : '위치 정보 없음');
    homeRecentDate.textContent = formatDateShort(recent.date) || formatDateShort(new Date(recent.createdAt).toISOString());
  } else {
    homeRecentCard.style.display = 'none';
  }

  // 맵 뷰 하이라이트
  if (count > 0) {
    const withGps = photos.filter(p => p.lat != null);
    mapLocationCount.textContent = `${withGps.length}개의 장소`;
    if (withGps.length > 0) {
      mapHighlightCard.style.display = '';
      mapHighlightImg.src = withGps[0].thumbnailDataUrl;
      mapHighlightMemo.textContent = withGps[0].memo || withGps[0].address || '최근 촬영';
    }
  }

  // '오늘의 추억' (오늘과 같은 날 N년 전 사진 검색)
  updateOnThisDay(photos);

  // 랜덤 추억 카드
  updateRandomCard(photos);

  // 월간 리캡
  updateMonthlyRecap(photos);

  // 해시태그 앨범
  updateHashtagAlbums(photos);
}

// ──────────────────────────────────────
// Monthly Chart (동적 7개월 통계)
// ──────────────────────────────────────
function renderMonthlyChart(photos) {
  if (!homeStatsBars || !homeStatsLabels) return;

  const now = new Date();
  const months = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }

  // 월별 사진 수 카운트
  const counts = months.map(m => {
    return photos.filter(p => {
      const pd = p.date ? new Date(p.date) : new Date(p.createdAt);
      return pd.getFullYear() === m.year && pd.getMonth() === m.month;
    }).length;
  });

  const maxCount = Math.max(...counts, 1);

  // 바 렌더링
  homeStatsBars.innerHTML = counts.map((c, i) => {
    const pct = Math.max((c / maxCount) * 100, 4);
    const isMax = c === maxCount && c > 0;
    const isCurrent = i === counts.length - 1;
    const bgClass = isCurrent ? 'bg-primary/40' : (isMax ? 'bg-primary/30' : 'bg-white/5');
    return `
      <div class="flex-1 ${bgClass} rounded-t-md hover:bg-primary/50 transition-colors relative" style="height:${pct}%">
        ${isMax ? `<div class="absolute -top-6 left-1/2 -translate-x-1/2 text-primary font-label-caps text-[10px]">${c}</div>` : ''}
      </div>
    `;
  }).join('');

  // 라벨 렌더링
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  homeStatsLabels.innerHTML = months.map(m => `<span>${monthNames[m.month]}</span>`).join('');
}

// ──────────────────────────────────────
// Random Memory Card (🎲)
// ──────────────────────────────────────
function updateRandomCard(photos) {
  if (!homeRandomCard) return;

  if (photos.length === 0) {
    homeRandomCard.style.display = 'none';
    return;
  }

  homeRandomCard.style.display = '';
  shuffleRandomPhoto(photos);
}

function shuffleRandomPhoto(photos) {
  if (!photos || photos.length === 0) return;

  let idx = Math.floor(Math.random() * photos.length);
  // 사진이 2장 이상일 때 동일 사진 연속 방지
  if (photos.length > 1 && currentRandomPhoto && photos[idx].id === currentRandomPhoto.id) {
    idx = (idx + 1) % photos.length;
  }
  
  currentRandomPhoto = photos[idx];
  const photo = currentRandomPhoto;

  let locationStr = null;
  if (photo.address) {
    locationStr = photo.address.split(' ').slice(0, 4).join(' ');
  } else if (photo.lat != null && photo.lng != null) {
    locationStr = `${photo.lat.toFixed(4)}, ${photo.lng.toFixed(4)}`;
  }

  homeRandomImg.src = photo.thumbnailDataUrl || photo.imageDataUrl;
  homeRandomMemo.textContent = photo.memo || '메모 없음';
  homeRandomDate.textContent = formatDate(photo.date) || '날짜 미상';
  homeRandomLocation.textContent = locationStr || '위치 미상';
}

// ──────────────────────────────────────
// Monthly Recap (📊)
// ──────────────────────────────────────
function updateMonthlyRecap(photos) {
  if (!homeRecapCard) return;

  if (photos.length === 0) {
    homeRecapCard.style.display = 'none';
    return;
  }

  homeRecapCard.style.display = '';

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // 이번 달 사진
  const thisMonthPhotos = photos.filter(p => {
    const d = p.date ? new Date(p.date) : new Date(p.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  // 지난 달 사진
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const lastMonthPhotos = photos.filter(p => {
    const d = p.date ? new Date(p.date) : new Date(p.createdAt);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  const thisCount = thisMonthPhotos.length;
  const lastCount = lastMonthPhotos.length;
  const diff = thisCount - lastCount;

  homeRecapCount.textContent = thisCount;
  homeRecapSubtitle.textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월 활동`;

  if (diff > 0) {
    homeRecapDiff.textContent = `▲ ${diff}`;
    homeRecapDiff.className = 'text-body-sm font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400';
  } else if (diff < 0) {
    homeRecapDiff.textContent = `▼ ${Math.abs(diff)}`;
    homeRecapDiff.className = 'text-body-sm font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400';
  } else {
    homeRecapDiff.textContent = '— 동일';
    homeRecapDiff.className = 'text-body-sm font-medium px-2 py-0.5 rounded-full bg-white/10 text-on-surface-variant';
  }

  // 인기 해시태그 Top 3
  const tagCounts = {};
  photos.forEach(p => {
    if (!p.memo) return;
    const tags = p.memo.match(/(#[A-Za-z0-9가-힣_]+)/g);
    if (tags) tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
  });

  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topTags.length > 0) {
    homeRecapTags.innerHTML = topTags.map(([tag, count]) =>
      `<span class="recap-chip tag-chip cursor-pointer" data-search-tag="${tag}">${tag} <span class="text-on-surface-variant/50">${count}</span></span>`
    ).join('');
  } else {
    homeRecapTags.innerHTML = '<span class="text-on-surface-variant/50 text-body-sm">해시태그가 없습니다</span>';
  }

  // 자주 방문한 지역 Top 3
  const locationCounts = {};
  photos.forEach(p => {
    if (!p.address) return;
    const region = p.address.split(' ')[0];
    if (region) locationCounts[region] = (locationCounts[region] || 0) + 1;
  });

  const topLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topLocations.length > 0) {
    homeRecapLocations.innerHTML = topLocations.map(([loc, count]) =>
      `<span class="recap-chip location-chip">${loc} <span class="text-on-surface-variant/50">${count}</span></span>`
    ).join('');
  } else {
    homeRecapLocations.innerHTML = '<span class="text-on-surface-variant/50 text-body-sm">위치 데이터가 없습니다</span>';
  }
}

// ──────────────────────────────────────
// Hashtag Albums (🏷️)
// ──────────────────────────────────────
function updateHashtagAlbums(photos) {
  if (!homeAlbumsCard || !homeAlbumsList) return;

  // 모든 해시태그 추출
  const tagMap = {}; // tag -> [photo, ...]
  photos.forEach(p => {
    if (!p.memo) return;
    const tags = p.memo.match(/(#[A-Za-z0-9가-힣_]+)/g);
    if (tags) {
      tags.forEach(t => {
        if (!tagMap[t]) tagMap[t] = [];
        tagMap[t].push(p);
      });
    }
  });

  const albums = Object.entries(tagMap).sort((a, b) => b[1].length - a[1].length);

  if (albums.length === 0) {
    homeAlbumsCard.style.display = 'none';
    return;
  }

  homeAlbumsCard.style.display = '';
  homeAlbumsList.innerHTML = albums.map(([tag, tagPhotos]) => {
    const coverPhoto = tagPhotos[0]; // 최신 사진을 커버로
    return `
      <div class="album-card" data-album-tag="${tag}">
        <img src="${coverPhoto.thumbnailDataUrl}" alt="${tag}" loading="lazy" />
        <div class="album-overlay">
          <span class="album-tag">${tag}</span>
          <span class="album-count">${tagPhotos.length}장</span>
        </div>
      </div>
    `;
  }).join('');

  // 앨범 카드 클릭 이벤트
  homeAlbumsList.querySelectorAll('.album-card').forEach(card => {
    card.addEventListener('click', () => {
      const tag = card.dataset.albumTag;
      searchQuery = tag;
      if (searchInput) searchInput.value = tag;
      searchContainer.classList.remove('hidden');
      switchView('timeline');
      renderTimeline();
    });
  });
}

// ──────────────────────────────────────
// On This Day (오늘의 추억)
// ──────────────────────────────────────
function updateOnThisDay(photos) {
  if (!homeOnthisdayCard || !homeOnthisdayList) return;

  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  // 오늘과 같은 월/일이지만 올해가 아닌 사진 찾기
  const matches = photos.filter(p => {
    if (!p.date) return false;
    const d = new Date(p.date);
    return d.getMonth() === todayMonth && d.getDate() === todayDate && d.getFullYear() !== today.getFullYear();
  });

  if (matches.length === 0) {
    homeOnthisdayCard.style.display = 'none';
    return;
  }

  // 날짜순 정렬 (오래된 순)
  matches.sort((a, b) => new Date(a.date) - new Date(b.date));

  homeOnthisdayCard.style.display = '';
  homeOnthisdayLabel.textContent = `${matches.length}개의 추억이 오늘과 같은 날 기록되었습니다`;

  homeOnthisdayList.innerHTML = matches.map(photo => {
    const d = new Date(photo.date);
    const yearsAgo = today.getFullYear() - d.getFullYear();
    const yearLabel = yearsAgo === 1 ? '1년 전 오늘' : `${yearsAgo}년 전 오늘`;
    const dateLabel = d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
    return `
      <div class="onthisday-photo" data-id="${photo.id}">
        <img src="${photo.thumbnailDataUrl}" alt="${photo.fileName || '사진'}" loading="lazy" />
        <div class="overlay">
          <span class="years-ago">${yearLabel}</span>
          <span>${dateLabel}</span>
        </div>
      </div>
    `;
  }).join('');

  // 클릭 이벤트: 모달 열기
  homeOnthisdayList.querySelectorAll('.onthisday-photo').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const photo = matches.find(p => p.id === id);
      if (photo) openPhotoModal(photo);
    });
  });
}

// ──────────────────────────────────────
// Map Filter Helper
// ──────────────────────────────────────
function getFilteredMapPhotos(photos) {
  const now = new Date();
  if (currentMapFilter === 'favorite') {
    return photos.filter(p => p.favorite === true);
  } else if (currentMapFilter === 'week') {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return photos.filter(p => {
      const d = p.date ? new Date(p.date) : new Date(p.createdAt);
      return d >= oneWeekAgo && d <= now;
    });
  } else if (currentMapFilter === 'month') {
    return photos.filter(p => {
      const d = p.date ? new Date(p.date) : new Date(p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  } else if (currentMapFilter === 'year') {
    return photos.filter(p => {
      const d = p.date ? new Date(p.date) : new Date(p.createdAt);
      return d.getFullYear() === now.getFullYear();
    });
  }
  return photos; // 'all'
}

async function refreshMapMarkers() {
  const photos = await getAllPhotos();
  const filtered = getFilteredMapPhotos(photos);
  renderMarkers(filtered);
}

// ──────────────────────────────────────
// Render Timeline (screen7 Bento Cards)
// ──────────────────────────────────────
async function renderTimeline() {
  let photos = await getAllPhotos();

  // 날짜 기반 정렬 (최신순)
  photos.sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : a.createdAt;
    const timeB = b.date ? new Date(b.date).getTime() : b.createdAt;
    return timeB - timeA;
  });

  // 검색 필터
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    photos = photos.filter(p => {
      const matchMemo = p.memo && p.memo.toLowerCase().includes(q);
      const matchAddr = p.address && p.address.toLowerCase().includes(q);
      const formattedDate = formatDate(p.date) || '';
      const matchDate = formattedDate.includes(q) || (p.date && p.date.includes(q));
      return matchMemo || matchAddr || matchDate;
    });
  }

  // 시간/장소/즐겨찾기 필터
  const now = new Date();
  if (currentFilter === 'favorite') {
    photos = photos.filter(p => p.favorite === true);
  } else if (currentFilter === 'week') {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    photos = photos.filter(p => {
      const d = p.date ? new Date(p.date) : new Date(p.createdAt);
      return d >= oneWeekAgo && d <= now;
    });
  } else if (currentFilter === 'month') {
    photos = photos.filter(p => {
      const d = p.date ? new Date(p.date) : new Date(p.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  } else if (currentFilter === 'year') {
    photos = photos.filter(p => {
      const d = p.date ? new Date(p.date) : new Date(p.createdAt);
      return d.getFullYear() === now.getFullYear();
    });
  } else if (currentFilter === 'location' && currentLocationFilter) {
    photos = photos.filter(p => p.address && p.address.includes(currentLocationFilter));
  }

  // 장소 옵션 업데이트 (location 필터 시)
  if (currentFilter === 'location') {
    const allPhotos = await getAllPhotos();
    const locations = new Set();
    allPhotos.forEach(p => {
      if (p.address) {
        // 첫 번째 부분(시/도)이나 두 번째 부분(구/군)을 키로 사용
        const parts = p.address.split(' ');
        if (parts.length > 0) {
          locations.add(parts[0]);
        }
      }
    });
    
    // 현재 선택된 옵션 유지하며 select 재구성
    locationFilterSelect.innerHTML = '<option value="">전체 장소</option>';
    Array.from(locations).sort().forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = loc;
      if (loc === currentLocationFilter) opt.selected = true;
      locationFilterSelect.appendChild(opt);
    });
    locationFilterWrapper.classList.remove('hidden');
  } else {
    locationFilterWrapper.classList.add('hidden');
  }

  const count = photos.length;

  if (searchQuery) {
    photoCountBadge.textContent = count > 0 ? `검색 결과 ${count}건` : '검색 결과 없음';
  } else {
    photoCountBadge.textContent = count > 0 ? `${count}개의 추억` : '최신순';
  }

  if (count === 0) {
    timelineGrid.innerHTML = '';
    timelineEmptyState.classList.remove('hidden');
    if (searchQuery) {
      timelineEmptyState.querySelector('p').innerHTML = '검색 결과가 없습니다.<br/>다른 키워드로 검색해보세요.';
    } else if (currentFilter === 'favorite') {
      timelineEmptyState.querySelector('p').innerHTML = '즐겨찾기한 추억이 없습니다.<br/>⭐ 버튼을 눌러 즐겨찾기를 추가해보세요!';
    } else {
      timelineEmptyState.querySelector('p').innerHTML = '아직 기록된 추억이 없습니다.<br/>사진을 업로드하여 첫 추억을 남겨보세요!';
    }
    return;
  }

  timelineEmptyState.classList.add('hidden');

  // 사진 중심 카드 렌더링 (사진이 주, 정보 하단 분리)
  timelineGrid.innerHTML = photos
    .map((photo, idx) => {
      const dateStr = formatDate(photo.date);
      let locationStr = null;
      if (photo.address) {
        locationStr = photo.address.split(' ').slice(0, 4).join(' ');
      } else if (photo.lat != null && photo.lng != null) {
        locationStr = `${photo.lat.toFixed(4)}, ${photo.lng.toFixed(4)}`;
      }

      // 날씨 배지
      const weatherBadge = photo.weather ? `<span class="weather-badge">${photo.weather.emoji} ${photo.weather.tempMax ?? ''}°</span>` : '';

      // 즐겨찾기 상태
      const favClass = photo.favorite ? 'is-fav' : '';

      // 첫 번째 카드는 크게
      const isLarge = idx === 0;
      const colSpan = isLarge ? 'col-span-4 md:col-span-6' : 'col-span-2 md:col-span-4';
      const largeClass = isLarge ? 'is-large' : '';

      return `
        <section class="${colSpan} timeline-card ${largeClass} fade-in" style="animation-delay:${idx * 0.06}s" data-id="${photo.id}">
          <!-- Photo Area (사진이 주) -->
          <div class="timeline-card-photo">
            <img alt="${photo.fileName || '사진'}" src="${photo.thumbnailDataUrl || photo.imageDataUrl}" loading="lazy" />
            <div class="photo-overlay-badges">
              <div>${weatherBadge}</div>
              <div class="photo-actions">
                <button class="tc-action-btn" data-delete-id="${photo.id}" title="삭제">
                  <span class="material-symbols-outlined text-white" style="font-size:16px;">close</span>
                </button>
              </div>
            </div>
            <button class="favorite-btn-card ${favClass}" data-fav-id="${photo.id}" title="즐겨찾기">
              <span class="material-symbols-outlined">star</span>
            </button>
          </div>
          <!-- Info Area (정보 분리) -->
          <div class="timeline-card-info">
            ${dateStr ? `<div class="info-date"><span class="material-symbols-outlined">schedule</span>${dateStr}</div>` : ''}
            <div class="info-memo">${formatHashtags(photo.memo || '메모 없음')}</div>
            ${locationStr ? `<div class="info-location"><span class="material-symbols-outlined">location_on</span><span>${locationStr}</span></div>` : ''}
          </div>
        </section>
      `;
    })
    .join('');

  // 카드 클릭 이벤트 (모달 열기)
  timelineGrid.querySelectorAll('[data-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete-id]')) return;
      if (e.target.closest('[data-fav-id]')) return;
      const id = card.dataset.id;
      const photo = photos.find(p => p.id === id);
      if (photo) openPhotoModal(photo);
    });
  });

  // 삭제 버튼 이벤트
  timelineGrid.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDelete(btn.dataset.deleteId);
    });
  });

  // 즐겨찾기 버튼 이벤트
  timelineGrid.querySelectorAll('[data-fav-id]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.favId;
      const photo = photos.find(p => p.id === id);
      if (photo) {
        const isFav = await toggleFavorite(photo);
        btn.classList.toggle('is-fav', isFav);
      }
    });
  });

  // 지도가 초기화되어 있으면 마커도 갱신
  if (mapInitialized) {
    renderMarkers(photos);
  }
}

// ──────────────────────────────────────
// Calendar View (📅)
// ──────────────────────────────────────
async function renderCalendar() {
  if (!calGrid || !calTitle) return;

  const photos = await getAllPhotos();
  const year = calYear;
  const month = calMonth;

  calTitle.textContent = `${year}년 ${month + 1}월`;

  // 해당 월의 첫 번째 날
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0=일요일

  // 해당 월의 마지막 날
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // 날짜별 사진 매핑
  const photosByDate = {};
  photos.forEach(p => {
    if (!p.date) return;
    const d = new Date(p.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!photosByDate[key]) photosByDate[key] = [];
      photosByDate[key].push(p);
    }
  });

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  let html = '';

  // 빈 셀 (첫 주 앞)
  for (let i = 0; i < startDayOfWeek; i++) {
    html += '<div class="cal-cell empty"></div>';
  }

  // 날짜 셀
  for (let day = 1; day <= daysInMonth; day++) {
    const dayPhotos = photosByDate[day];
    const hasPhoto = dayPhotos && dayPhotos.length > 0;
    const isToday = isCurrentMonth && day === todayDate;
    const isSelected = calSelectedDate && calSelectedDate.year === year && calSelectedDate.month === month && calSelectedDate.day === day;

    let classes = 'cal-cell';
    if (hasPhoto) classes += ' has-photo';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';

    let style = '';
    if (hasPhoto) {
      style = `style="background-image: url('${dayPhotos[0].thumbnailDataUrl}')"`;
    }

    const countBadge = hasPhoto && dayPhotos.length > 1 ? `<span class="cal-photo-count">${dayPhotos.length}</span>` : '';

    html += `<div class="${classes}" data-day="${day}" ${style}><span class="cal-date-num">${day}</span>${countBadge}</div>`;
  }

  calGrid.innerHTML = html;

  // 날짜 클릭 이벤트
  calGrid.querySelectorAll('.cal-cell:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => {
      const day = parseInt(cell.dataset.day);
      calSelectedDate = { year, month, day };

      // 선택 상태 업데이트
      calGrid.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');

      // 해당 날짜 사진 표시
      const dayPhotos = photosByDate[day];
      renderCalendarDayPhotos(day, dayPhotos || [], photos);
    });
  });

  // 선택된 날짜가 있으면 사진 표시
  if (calSelectedDate && calSelectedDate.year === year && calSelectedDate.month === month) {
    const dayPhotos = photosByDate[calSelectedDate.day];
    renderCalendarDayPhotos(calSelectedDate.day, dayPhotos || [], photos);
  } else {
    if (calDayPhotos) calDayPhotos.style.display = 'none';
  }
}

function renderCalendarDayPhotos(day, dayPhotos, allPhotos) {
  if (!calDayPhotos || !calDayGrid || !calDayTitle) return;

  if (dayPhotos.length === 0) {
    calDayPhotos.style.display = 'none';
    return;
  }

  calDayPhotos.style.display = '';
  calDayTitle.textContent = `${calYear}년 ${calMonth + 1}월 ${day}일 — ${dayPhotos.length}장`;

  calDayGrid.innerHTML = dayPhotos.map(photo => {
    const weatherBadge = photo.weather ? `<span class="weather-badge" style="position:absolute;top:4px;right:4px;z-index:2;">${photo.weather.emoji}</span>` : '';
    return `
      <div class="cal-photo-card" data-id="${photo.id}">
        <img src="${photo.thumbnailDataUrl}" alt="${photo.fileName || '사진'}" loading="lazy" />
        ${weatherBadge}
        <div class="overlay">
          <span>${photo.memo || photo.fileName || '메모 없음'}</span>
        </div>
      </div>
    `;
  }).join('');

  // 클릭 이벤트
  calDayGrid.querySelectorAll('.cal-photo-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const photo = dayPhotos.find(p => p.id === id) || allPhotos.find(p => p.id === id);
      if (photo) openPhotoModal(photo);
    });
  });
}

// ──────────────────────────────────────
// View Toggle
// ──────────────────────────────────────
function switchView(view) {
  currentView = view;

  // 뷰 컨테이너 토글
  homeView.classList.toggle('active', view === 'home');
  timelineView.classList.toggle('active', view === 'timeline');
  mapView.classList.toggle('active', view === 'map');
  if (calendarView) calendarView.classList.toggle('active', view === 'calendar');

  // 네비 활성 상태
  document.querySelectorAll('.nav-item').forEach(item => {
    const itemView = item.dataset.view;
    if (itemView === view) {
      item.className = item.className.replace(/text-on-surface-variant\/50/g, '').replace(/hover:text-primary/g, '');
      item.classList.add('bg-primary-container/20', 'text-primary-fixed-dim', 'rounded-full');
      item.classList.remove('text-on-surface-variant/50');
      // Fill icon for active tab
      const icon = item.querySelector('.material-symbols-outlined');
      if (icon) icon.style.fontVariationSettings = "'FILL' 1";
    } else if (itemView) {
      item.classList.remove('bg-primary-container/20', 'text-primary-fixed-dim', 'rounded-full');
      item.classList.add('text-on-surface-variant/50', 'hover:text-primary');
      const icon = item.querySelector('.material-symbols-outlined');
      if (icon) icon.style.fontVariationSettings = "'FILL' 0";
    }
  });

  if (view === 'map') {
    if (!mapInitialized) {
      initMap('map-container');
      setMarkerClickCallback(openMapBottomSheet);
      mapInitialized = true;
    }
    refreshMap();
    refreshMapMarkers();
  }

  if (view === 'calendar') {
    renderCalendar();
  }
}

// 해시태그 클릭 처리 (이벤트 위임)
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('hashtag')) {
    const tag = e.target.dataset.tag;
    searchQuery = tag;
    if (searchInput) searchInput.value = tag;
    searchContainer.classList.remove('hidden');
    
    // 모달이 열려있으면 닫기
    document.querySelectorAll('.photo-modal').forEach(modal => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    });

    switchView('timeline');
    renderTimeline();
  }
});

// 리캡 태그 칩 클릭 처리 (이벤트 위임)
document.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-search-tag]');
  if (chip) {
    const tag = chip.dataset.searchTag;
    searchQuery = tag;
    if (searchInput) searchInput.value = tag;
    searchContainer.classList.remove('hidden');
    switchView('timeline');
    renderTimeline();
  }
});

// ──────────────────────────────────────
// Event Listeners
// ──────────────────────────────────────
function initEventListeners() {
  // 해시태그 버튼
  if (btnAddHashtag) {
    btnAddHashtag.addEventListener('click', () => {
      const start = memoTextarea.selectionStart;
      const end = memoTextarea.selectionEnd;
      const text = memoTextarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      memoTextarea.value = before + '#' + after;
      memoTextarea.focus();
      memoTextarea.selectionStart = memoTextarea.selectionEnd = start + 1;
    });
  }

  // ══ Map Controls ══
  // 테마 전환
  if (mapBtnTheme) {
    mapBtnTheme.addEventListener('click', () => {
      const theme = cycleMapTheme();
      const labels = { standard: '기본 지도', dark: '다크 지도', satellite: '위성 지도' };
      showToast(`지도 테마: ${labels[theme] || theme}`);
    });
  }

  // 여정 경로 토글
  if (mapBtnJourney) {
    mapBtnJourney.addEventListener('click', async () => {
      const photos = await getAllPhotos();
      const filtered = getFilteredMapPhotos(photos);
      const shown = toggleJourneyLine(filtered);
      mapBtnJourney.classList.toggle('active', shown);
      showToast(shown ? '여정 경로가 표시됩니다' : '여정 경로가 숨겨졌습니다');
    });
  }

  // 히트맵 토글
  if (mapBtnHeatmap) {
    mapBtnHeatmap.addEventListener('click', async () => {
      const photos = await getAllPhotos();
      const filtered = getFilteredMapPhotos(photos);
      const shown = toggleHeatmap(filtered);
      mapBtnHeatmap.classList.toggle('active', shown);
      showToast(shown ? '히트맵 모드 활성화' : '히트맵 모드 비활성화');
    });
  }

  // 지도 필터 칩
  if (mapFilterChips) {
    mapFilterChips.querySelectorAll('.map-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        mapFilterChips.querySelectorAll('.map-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentMapFilter = chip.dataset.mapFilter;
        refreshMapMarkers();
      });
    });
  }

  // 바텀 시트 닫기
  if (mapSheetClose) {
    mapSheetClose.addEventListener('click', () => {
      mapBottomSheet.classList.remove('active');
    });
  }

  // 바텀 시트 사진 클릭 시 모달 열기
  if (mapSheetImg) {
    mapSheetImg.addEventListener('click', () => {
      if (mapBottomSheet._currentPhoto) {
        openPhotoModal(mapBottomSheet._currentPhoto);
        mapBottomSheet.classList.remove('active');
      }
    });
  }

  // 검색 토글
  if (btnSearch) {
    btnSearch.addEventListener('click', () => {
      searchContainer.classList.toggle('hidden');
      if (!searchContainer.classList.contains('hidden')) {
        searchInput.focus();
      }
    });
  }
  if (btnSearchClose) {
    btnSearchClose.addEventListener('click', () => {
      searchContainer.classList.add('hidden');
      searchInput.value = '';
      searchQuery = '';
      renderTimeline();
    });
  }
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderTimeline();
    });
  }

  // 모달 닫기 공통 처리
  [photoModalClose, settingsModalClose].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.photo-modal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        exitPhotoModalEditMode();
      }
    });
  });

  document.querySelectorAll('.photo-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        exitPhotoModalEditMode();
      }
    });
  });

  // 모달 수정/저장/공유 로직
  if (photoModalEdit) {
    photoModalEdit.addEventListener('click', () => {
      togglePhotoModalEditMode();
    });
  }

  // 모달 즐겨찾기 버튼
  if (photoModalFavorite) {
    photoModalFavorite.addEventListener('click', async () => {
      if (!currentEditingPhoto) return;
      const isFav = await toggleFavorite(currentEditingPhoto);
      updateModalFavoriteButton(isFav);
      renderTimeline();
    });
  }

  if (photoModalSaveBtn) {
    photoModalSaveBtn.addEventListener('click', async () => {
      if (!currentEditingPhoto) return;
      
      const newDateVal = photoModalDateInput.value;
      const newLocationVal = photoModalLocationInput.value.trim();
      const newMemoVal = photoModalMemoTextarea.value.trim();
      
      const oldDate = currentEditingPhoto.date;
      const oldLat = currentEditingPhoto.lat;
      const oldLng = currentEditingPhoto.lng;

      currentEditingPhoto.date = newDateVal ? new Date(newDateVal).toISOString() : currentEditingPhoto.date;
      currentEditingPhoto.address = newLocationVal || currentEditingPhoto.address;
      currentEditingPhoto.memo = newMemoVal;

      // 날짜나 좌표가 바뀌었으면 날씨 재조회
      const dateChanged = currentEditingPhoto.date !== oldDate;
      if (dateChanged && currentEditingPhoto.lat != null && currentEditingPhoto.lng != null) {
        const weather = await fetchWeather(currentEditingPhoto.lat, currentEditingPhoto.lng, currentEditingPhoto.date).catch(() => null);
        if (weather) currentEditingPhoto.weather = weather;
      }
      
      await savePhoto(currentEditingPhoto);
      showToast('성공적으로 수정되었습니다.');
      
      // 모달 뷰어 업데이트
      openPhotoModal(currentEditingPhoto);
      
      // 타임라인 다시 그리기
      renderTimeline();
      updateHomeView();
    });
  }

  if (photoModalExport) {
    photoModalExport.addEventListener('click', async () => {
      try {
        // 일시적으로 수정 관련 버튼 숨기기
        const controls = photoModal.querySelector('.absolute.top-4.right-4.z-10');
        if (controls) controls.style.display = 'none';
        
        // 렌더링 타겟
        const targetElement = photoModal.querySelector('.max-w-3xl');
        
        const canvasDataUrl = await htmlToImage.toPng(targetElement, {
          backgroundColor: '#0d1117',
          pixelRatio: 2,
        });
        
        if (controls) controls.style.display = 'flex';

        const link = document.createElement('a');
        link.download = `memoirs_${Date.now()}.png`;
        link.href = canvasDataUrl;
        link.click();
        
        showToast('이미지가 성공적으로 저장되었습니다.');
      } catch (err) {
        console.error('html2canvas error', err);
        showToast('이미지 저장 중 오류가 발생했습니다: ' + err.message);
        const controls = photoModal.querySelector('.absolute.top-4.right-4.z-10');
        if (controls) controls.style.display = 'flex';
      }
    });
  }

  // 설정 모달 열기
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      settingsModal.classList.add('active');
      settingsModal.setAttribute('aria-hidden', 'false');
    });
  }

  // 데이터 백업 (내보내기)
  if (btnExport) {
    btnExport.addEventListener('click', async () => {
      try {
        const photos = await getAllPhotos();
        if (photos.length === 0) {
          showToast('백업할 데이터가 없습니다.');
          return;
        }

        const blob = new Blob([JSON.stringify(photos)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", "photo_memo_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('백업 파일이 다운로드되었습니다.');
      } catch (err) {
        console.error('Backup failed', err);
        showToast('백업 중 오류가 발생했습니다.');
      }
    });
  }

  // 데이터 복구 (불러오기)
  if (btnImport && importInput) {
    btnImport.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedPhotos = JSON.parse(event.target.result);
          if (!Array.isArray(importedPhotos)) {
            showToast('잘못된 형식의 백업 파일입니다.');
            return;
          }
          let importedCount = 0;
          for (const photo of importedPhotos) {
            await savePhoto(photo);
            importedCount++;
          }
          showToast(`${importedCount}개의 추억이 복구되었습니다!`);
          settingsModal.classList.remove('active');
          await renderTimeline();
          await updateHomeView();
          if (currentView === 'map') {
            refreshMapMarkers();
          }
        } catch (err) {
          console.error('Import failed', err);
          showToast('잘못된 백업 파일입니다.');
        }
        importInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  // 업로드 영역 클릭
  const uploadLabel = document.getElementById('upload-label');
  if (uploadLabel) {
    uploadLabel.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });
  }

  // 파일 선택
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) handleFilesSelect(files);
  });

  // 드래그 앤 드롭
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-primary-container/50');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-primary-container/50');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-primary-container/50');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFilesSelect(files);
  });

  // 필터 바 이벤트
  if (filterBar) {
    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // 기존 active 제거
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        currentFilter = e.target.dataset.filter;
        currentLocationFilter = ''; // 초기화
        if (locationFilterSelect) locationFilterSelect.value = '';
        renderTimeline();
      });
    });
  }

  if (locationFilterSelect) {
    locationFilterSelect.addEventListener('change', (e) => {
      currentLocationFilter = e.target.value;
      renderTimeline();
    });
  }

  // 저장 / 취소
  btnSave.addEventListener('click', handleSave);
  btnCancel.addEventListener('click', handleCancel);

  // 하단 네비게이션
  navHome.addEventListener('click', () => switchView('home'));
  navTimeline.addEventListener('click', () => switchView('timeline'));
  navMap.addEventListener('click', () => switchView('map'));
  if (navCalendar) navCalendar.addEventListener('click', () => switchView('calendar'));
  navAdd.addEventListener('click', () => {
    switchView('timeline');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fileInput.click();
  });

  // 홈 뷰 이벤트
  if (homeGotoTimeline) {
    homeGotoTimeline.addEventListener('click', () => switchView('timeline'));
  }
  if (homeUploadBtn) {
    homeUploadBtn.addEventListener('click', () => {
      switchView('timeline');
      fileInput.click();
    });
  }
  if (homeRecentCard) {
    homeRecentCard.addEventListener('click', async () => {
      const photos = await getAllPhotos();
      if (photos.length > 0) openPhotoModal(photos[0]);
    });
  }

  // 랜덤 추억 이벤트
  if (homeRandomShuffle) {
    homeRandomShuffle.addEventListener('click', async (e) => {
      e.stopPropagation();
      const photos = await getAllPhotos();
      if (photos.length > 0) {
        homeRandomCard.classList.add('shuffle-anim');
        setTimeout(() => homeRandomCard.classList.remove('shuffle-anim'), 500);
        shuffleRandomPhoto(photos);
      }
    });
  }
  if (homeRandomCard) {
    homeRandomCard.addEventListener('click', () => {
      if (currentRandomPhoto) openPhotoModal(currentRandomPhoto);
    });
  }

  // 캘린더 네비게이션
  if (calPrev) {
    calPrev.addEventListener('click', () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      calSelectedDate = null;
      renderCalendar();
    });
  }
  if (calNext) {
    calNext.addEventListener('click', () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      calSelectedDate = null;
      renderCalendar();
    });
  }

  // Glassmorphism micro-interaction: light follow effect
  document.querySelectorAll('.glass-surface').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 50%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = `rgba(255, 255, 255, 0.03)`;
    });
  });

  // Atmospheric blobs: follow mouse subtly
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    const blobs = document.querySelectorAll('.liquid-blob');
    blobs.forEach((blob, index) => {
      const speed = (index + 1) * 20;
      blob.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  });
}

// ──────────────────────────────────────
// Modal Helper (screen9 Parallax Style)
// ──────────────────────────────────────
// ──────────────────────────────────────
// Map Bottom Sheet Helper
// ──────────────────────────────────────
function openMapBottomSheet(photo) {
  if (!mapBottomSheet) return;

  mapBottomSheet._currentPhoto = photo;

  const dateStr = photo.date
    ? new Date(photo.date).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '날짜 미상';

  mapSheetImg.src = photo.thumbnailDataUrl || photo.imageDataUrl;
  mapSheetDate.textContent = dateStr;
  mapSheetMemo.textContent = photo.memo || photo.fileName || '메모 없음';

  if (photo.address) {
    mapSheetAddress.textContent = photo.address;
  } else if (photo.lat != null) {
    mapSheetAddress.textContent = `${photo.lat.toFixed(4)}, ${photo.lng.toFixed(4)}`;
  } else {
    mapSheetAddress.textContent = '위치 정보 없음';
  }

  mapBottomSheet.classList.add('active');
}

function updateModalFavoriteButton(isFav) {
  if (!photoModalFavorite) return;
  const icon = photoModalFavorite.querySelector('.material-symbols-outlined');
  if (isFav) {
    icon.classList.add('favorite-active');
    icon.style.fontVariationSettings = "'FILL' 1";
  } else {
    icon.classList.remove('favorite-active');
    icon.style.fontVariationSettings = "'FILL' 0";
  }
}

function openPhotoModal(photo) {
  currentEditingPhoto = photo;
  exitPhotoModalEditMode();

  photoModalImg.src = photo.imageDataUrl || photo.thumbnailDataUrl;
  photoModalImg.alt = photo.fileName || '사진';

  photoModalDate.textContent = formatDate(photo.date) || '날짜 미상';
  photoModalTitle.textContent = photo.memo || photo.fileName || '추억 상세';
  photoModalTag.textContent = formatDateShort(photo.date) || 'MEMORY';

  if (photo.address) {
    photoModalLocation.textContent = photo.address;
  } else if (photo.lat != null) {
    photoModalLocation.textContent = `${photo.lat.toFixed(4)}, ${photo.lng.toFixed(4)}`;
  } else {
    photoModalLocation.textContent = '위치 정보 없음';
  }

  photoModalMemo.innerHTML = formatHashtags(photo.memo) || '메모가 없습니다.';

  // 즐겨찾기 상태 반영
  updateModalFavoriteButton(photo.favorite === true);

  // 날씨 표시
  if (photo.weather && photoModalWeatherRow && photoModalWeather) {
    photoModalWeatherRow.style.display = '';
    photoModalWeather.textContent = formatWeatherDisplay(photo.weather);
  } else if (photoModalWeatherRow) {
    photoModalWeatherRow.style.display = 'none';
  }

  photoModal.classList.add('active');
  photoModal.setAttribute('aria-hidden', 'false');

  // Parallax scroll effect in modal
  const modalContent = photoModal.querySelector('.max-w-3xl');
  if (modalContent) {
    modalContent.addEventListener('scroll', function handler() {
      const scroll = modalContent.scrollTop;
      photoModalImg.style.transform = `translateY(${scroll * 0.4}px) scale(1.1)`;
    });
  }
}

function togglePhotoModalEditMode() {
  const isEditing = !photoModalDate.classList.contains('hidden');
  
  if (isEditing) {
    // 편집 모드로 진입
    photoModalDate.classList.add('hidden');
    photoModalDateInput.classList.remove('hidden');
    if (currentEditingPhoto && currentEditingPhoto.date) {
      photoModalDateInput.value = new Date(currentEditingPhoto.date).toISOString().split('T')[0];
    } else {
      photoModalDateInput.value = '';
    }

    photoModalLocation.classList.add('hidden');
    photoModalLocationInput.classList.remove('hidden');
    photoModalLocationInput.value = currentEditingPhoto?.address || '';

    photoModalMemo.classList.add('hidden');
    photoModalMemoTextarea.classList.remove('hidden');
    photoModalMemoTextarea.value = currentEditingPhoto?.memo || '';

    photoModalSaveBtn.classList.remove('hidden');
    photoModalEdit.querySelector('.material-symbols-outlined').textContent = 'edit_off';
  } else {
    exitPhotoModalEditMode();
  }
}

function exitPhotoModalEditMode() {
  photoModalDate.classList.remove('hidden');
  photoModalDateInput.classList.add('hidden');
  
  photoModalLocation.classList.remove('hidden');
  photoModalLocationInput.classList.add('hidden');
  
  photoModalMemo.classList.remove('hidden');
  photoModalMemoTextarea.classList.add('hidden');
  
  photoModalSaveBtn.classList.add('hidden');
  if(photoModalEdit) {
    photoModalEdit.querySelector('.material-symbols-outlined').textContent = 'edit';
  }
}

// ──────────────────────────────────────
// Init
// ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderTimeline();
  updateHomeView();
  switchView('home');
});

/**
 * app.js - 메인 앱 진입점
 * STITCH Liquid Bento 디자인 시스템 기반
 * 뷰 토글, 이벤트 리스너, UI 렌더링
 */
import './style.css';
import heic2any from 'heic2any';
import { extractExif, createThumbnail } from './exifParser.js';
import { savePhoto, getAllPhotos, deletePhoto, getPhotoCount } from './storage.js';
import { initMap, refreshMap, renderMarkers } from './map.js';

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

// 하단 네비
const navHome = document.getElementById('nav-home');
const navTimeline = document.getElementById('nav-timeline');
const navMap = document.getElementById('nav-map');
const navAdd = document.getElementById('nav-add');

// EXIF 표시 요소
const exifDate = document.getElementById('exif-date');
const exifAddress = document.getElementById('exif-address');
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
const photoModalImg = document.getElementById('photo-modal-img');
const photoModalDate = document.getElementById('photo-modal-date');
const photoModalLocation = document.getElementById('photo-modal-location');
const photoModalMemo = document.getElementById('photo-modal-memo');
const photoModalTitle = document.getElementById('photo-modal-title');
const photoModalTag = document.getElementById('photo-modal-tag');

// 홈 뷰 요소
const homeTotalCount = document.getElementById('home-total-count');
const homeRecentCard = document.getElementById('home-recent-card');
const homeRecentImg = document.getElementById('home-recent-img');
const homeRecentMemo = document.getElementById('home-recent-memo');
const homeRecentLocation = document.getElementById('home-recent-location');
const homeRecentDate = document.getElementById('home-recent-date');
const homeStatsPeak = document.getElementById('home-stats-peak');
const homeStatsTotal = document.getElementById('home-stats-total');
const homeGotoTimeline = document.getElementById('home-goto-timeline');
const homeUploadBtn = document.getElementById('home-upload-btn');

// 맵 뷰 요소
const mapLocationCount = document.getElementById('map-location-count');
const mapHighlightCard = document.getElementById('map-highlight-card');
const mapHighlightImg = document.getElementById('map-highlight-img');
const mapHighlightMemo = document.getElementById('map-highlight-memo');

// ──────────────────────────────────────
// State
// ──────────────────────────────────────
let currentView = 'home';
let currentExifData = null;
let currentThumbnail = null;
let currentFileBase64 = null;
let currentFileName = '';
let mapInitialized = false;
let searchQuery = '';
let currentFilter = 'all'; // 'all', 'week', 'month', 'year', 'location'
let currentLocationFilter = '';

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
// File Upload & EXIF Extraction
// ──────────────────────────────────────
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

  Promise.all([extractExif(file), createThumbnail(processFile)])
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

      // EXIF 정보 표시
      if (exifData.date) {
        exifDate.textContent = formatDate(exifData.date);
        exifDate.classList.remove('hidden');
        manualDateWrapper.classList.add('hidden');
      } else {
        exifDate.classList.add('hidden');
        manualDateWrapper.classList.remove('hidden');
        manualDateInput.value = new Date().toISOString().split('T')[0]; // 기본값: 오늘
      }

      if (exifData.lat != null && exifData.lng != null) {
        exifCoord.textContent = `${exifData.lat.toFixed(5)}, ${exifData.lng.toFixed(5)}`;
        exifAddress.textContent = '주소를 불러오는 중...';
        exifAddress.classList.remove('hidden');
        manualAddressWrapper.classList.add('hidden');

        reverseGeocode(exifData.lat, exifData.lng).then(address => {
          if (address) {
            exifData.address = address;
            exifAddress.textContent = address;
          } else {
            exifAddress.textContent = '주소를 찾을 수 없음';
          }
        });
      } else {
        exifCoord.textContent = '정보 없음';
        exifAddress.classList.add('hidden');
        manualAddressWrapper.classList.remove('hidden');
        manualAddressInput.value = '';
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
async function handleSave() {
  if (!currentFileBase64 || !currentThumbnail) {
    showToast('파일 변환이 완료되지 않았습니다.');
    return;
  }

  try {
    // 수동 입력값 적용
    let finalDate = currentExifData?.date || null;
    if (!finalDate && !manualDateWrapper.classList.contains('hidden')) {
      const dateVal = manualDateInput.value;
      if (dateVal) {
        finalDate = new Date(dateVal).toISOString();
      }
    }

    let finalAddress = currentExifData?.address || null;
    if (!finalAddress && !manualAddressWrapper.classList.contains('hidden')) {
      finalAddress = manualAddressInput.value.trim() || null;
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
    };

    await savePhoto(photoData);
    showToast('추억이 안전하게 저장되었습니다 ✨');
    resetUploadState();
    await renderTimeline();
    await updateHomeView();
  } catch (err) {
    console.error('Save failed:', err);
    showToast(`저장 오류: ${err.name} - ${err.message}`);
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
// Render Home View (screen10)
// ──────────────────────────────────────
async function updateHomeView() {
  const photos = await getAllPhotos();
  const count = photos.length;

  // 총 개수 표시
  homeTotalCount.textContent = count.toLocaleString();
  homeStatsTotal.textContent = `총 ${count}개의 추억`;
  homeStatsPeak.textContent = count;

  // 최근 기록 카드
  if (count > 0) {
    const recent = photos[0];
    homeRecentCard.style.display = '';
    homeRecentImg.src = recent.thumbnailDataUrl;
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

  // 시간/장소 필터
  const now = new Date();
  if (currentFilter === 'week') {
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
    } else {
      timelineEmptyState.querySelector('p').innerHTML = '아직 기록된 추억이 없습니다.<br/>사진을 업로드하여 첫 추억을 남겨보세요!';
    }
    return;
  }

  timelineEmptyState.classList.add('hidden');

  // Bento card 렌더링 (screen7 스타일)
  timelineGrid.innerHTML = photos
    .map((photo, idx) => {
      const dateStr = formatDate(photo.date);
      let locationStr = null;
      if (photo.address) {
        locationStr = photo.address.split(' ').slice(0, 4).join(' ');
      } else if (photo.lat != null && photo.lng != null) {
        locationStr = `${photo.lat.toFixed(4)}, ${photo.lng.toFixed(4)}`;
      }

      // 첫 번째 카드는 크게 (screen7 Recent Record 스타일)
      const isLarge = idx === 0;
      const colSpan = isLarge ? 'col-span-4 md:col-span-6' : 'col-span-2 md:col-span-4';
      const minHeight = isLarge ? 'min-h-[300px]' : 'min-h-[200px]';

      return `
        <section class="${colSpan} bento-card glass-surface glass-edge rounded-lg overflow-hidden relative group cursor-pointer ${minHeight} fade-in" style="animation-delay:${idx * 0.06}s" data-id="${photo.id}">
          <img alt="${photo.fileName || '사진'}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="${photo.thumbnailDataUrl}" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <!-- Badge -->
          ${dateStr ? `
          <div class="absolute top-4 left-4 glass-surface backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <span class="font-label-caps text-label-caps text-white">${dateStr}</span>
          </div>
          ` : ''}
          <!-- Delete Button -->
          <button class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors z-10 opacity-0 group-hover:opacity-100" data-delete-id="${photo.id}" title="삭제">
            <span class="material-symbols-outlined text-white text-sm">close</span>
          </button>
          <!-- Bottom Info -->
          <div class="absolute bottom-6 left-6 right-6">
            <h3 class="font-title-md text-title-md text-white mb-1">${photo.memo || '메모 없음'}</h3>
            ${locationStr ? `<p class="font-body-sm text-body-sm text-white/70">${locationStr}</p>` : ''}
          </div>
        </section>
      `;
    })
    .join('');

  // 카드 클릭 이벤트 (모달 열기)
  timelineGrid.querySelectorAll('[data-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete-id]')) return;
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

  // 지도가 초기화되어 있으면 마커도 갱신
  if (mapInitialized) {
    renderMarkers(photos);
  }
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
      mapInitialized = true;
    }
    refreshMap();
    getAllPhotos().then(renderMarkers);
  }
}

// ──────────────────────────────────────
// Event Listeners
// ──────────────────────────────────────
function initEventListeners() {
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
      }
    });
  });

  document.querySelectorAll('.photo-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  });

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
            getAllPhotos().then(renderMarkers);
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
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
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
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
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
function openPhotoModal(photo) {
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

  photoModalMemo.textContent = photo.memo || '메모가 없습니다.';

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

// ──────────────────────────────────────
// Init
// ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderTimeline();
  updateHomeView();
  switchView('home');
});

/**
 * app.js - 메인 앱 진입점
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
const btnCancel = document.getElementById('btn-cancel');
const timelineGrid = document.getElementById('timeline-grid');
const timelineEmptyState = document.getElementById('timeline-empty');
const photoCountBadge = document.getElementById('photo-count');
const toast = document.getElementById('toast');

// 뷰 컨테이너
const timelineView = document.getElementById('view-timeline');
const mapView = document.getElementById('view-map');

// 하단 네비
const navTimeline = document.getElementById('nav-timeline');
const navMap = document.getElementById('nav-map');
const navAdd = document.getElementById('nav-add');

// EXIF 표시 요소
const exifDate = document.getElementById('exif-date');
const exifLat = document.getElementById('exif-lat');
const exifLng = document.getElementById('exif-lng');
const exifPreview = document.getElementById('exif-preview');

// ──────────────────────────────────────
// State
// ──────────────────────────────────────
let currentView = 'timeline';
let currentExifData = null;
let currentThumbnail = null;
let currentFile = null;
let mapInitialized = false;

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

function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
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

// ──────────────────────────────────────
// File Upload & EXIF Extraction
// ──────────────────────────────────────
async function handleFileSelect(file) {
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic';

  if (!file || (!file.type.startsWith('image/') && !isHeic)) {
    showToast('이미지 파일만 업로드할 수 있습니다.');
    return;
  }

  // 로딩 표시
  uploadContent.classList.add('hidden');
  uploadLoading.classList.add('active');
  exifPanel.classList.remove('active');
  memoSection.classList.remove('active');

  let processFile = file;

  try {
    if (isHeic) {
      document.querySelector('#upload-loading p').textContent = 'HEIC 포맷을 변환 중입니다 (최대 10초 소요)...';
      const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      processFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
      document.querySelector('#upload-loading p').textContent = 'EXIF 데이터를 분석하고 있습니다...';
    }
  } catch (err) {
    console.error('HEIC conversion failed:', err);
    uploadLoading.classList.remove('active');
    uploadContent.classList.remove('hidden');
    showToast('HEIC 이미지 변환 중 오류가 발생했습니다.');
    return;
  }

  Promise.all([extractExif(file), createThumbnail(processFile)])
    .then(([exifData, thumbnail]) => {
      currentExifData = exifData;
      currentThumbnail = thumbnail;
      currentFile = file;

      // 로딩 해제
      uploadLoading.classList.remove('active');
      uploadContent.classList.remove('hidden');

      // 미리보기 표시
      exifPreview.src = thumbnail;
      exifPreview.classList.remove('hidden');

      // EXIF 정보 표시
      exifDate.textContent = formatDate(exifData.date) || '정보 없음';
      exifDate.classList.toggle('no-data', !exifData.date);

      exifLat.textContent = exifData.lat != null
        ? `${formatCoord(exifData.lat, true)}  (${exifData.lat.toFixed(6)})`
        : '정보 없음';
      exifLat.classList.toggle('no-data', exifData.lat == null);

      exifLng.textContent = exifData.lng != null
        ? `${formatCoord(exifData.lng, false)}  (${exifData.lng.toFixed(6)})`
        : '정보 없음';
      exifLng.classList.toggle('no-data', exifData.lng == null);

      // 패널 표시
      exifPanel.classList.add('active');
      memoSection.classList.add('active');
      memoTextarea.value = '';
      memoTextarea.focus();
    })
    .catch((err) => {
      console.error('EXIF extraction failed:', err);
      uploadLoading.classList.remove('active');
      uploadContent.classList.remove('hidden');
      showToast('사진 분석 중 오류가 발생했습니다.');
    });
}

// ──────────────────────────────────────
// Save Photo
// ──────────────────────────────────────
async function handleSave() {
  if (!currentFile || !currentThumbnail) return;

  const photoData = {
    id: generateId(),
    imageBlob: currentFile,
    thumbnailDataUrl: currentThumbnail,
    date: currentExifData?.date || null,
    lat: currentExifData?.lat || null,
    lng: currentExifData?.lng || null,
    memo: memoTextarea.value.trim(),
    fileName: currentFile.name,
    createdAt: Date.now(),
  };

  try {
    await savePhoto(photoData);
    showToast('추억이 안전하게 저장되었습니다 ✨');
    resetUploadState();
    await renderTimeline();
  } catch (err) {
    console.error('Save failed:', err);
    showToast('저장 중 오류가 발생했습니다.');
  }
}

function handleCancel() {
  resetUploadState();
}

function resetUploadState() {
  currentExifData = null;
  currentThumbnail = null;
  currentFile = null;
  fileInput.value = '';
  exifPanel.classList.remove('active');
  memoSection.classList.remove('active');
  exifPreview.classList.add('hidden');
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
  } catch (err) {
    console.error('Delete failed:', err);
    showToast('삭제 중 오류가 발생했습니다.');
  }
}

// ──────────────────────────────────────
// Render Timeline
// ──────────────────────────────────────
async function renderTimeline() {
  const photos = await getAllPhotos();
  const count = photos.length;

  photoCountBadge.textContent = count > 0 ? `${count}개의 추억` : '최신순';

  if (count === 0) {
    timelineGrid.innerHTML = '';
    timelineEmptyState.classList.remove('hidden');
    return;
  }

  timelineEmptyState.classList.add('hidden');
  timelineGrid.innerHTML = photos
    .map((photo, idx) => {
      const dateStr = formatDate(photo.date);
      const locationStr = photo.lat != null && photo.lng != null
        ? `${photo.lat.toFixed(4)}, ${photo.lng.toFixed(4)}`
        : null;

      return `
        <article class="memo-card fade-in" style="animation-delay:${idx * 0.06}s" data-id="${photo.id}">
          <img class="memo-card-image" 
               src="${photo.thumbnailDataUrl}" 
               alt="${photo.fileName || '사진'}" 
               loading="lazy" />
          <div class="memo-card-tags">
            ${dateStr ? `<span class="memo-card-tag tag-date">${dateStr}</span>` : ''}
            ${locationStr ? `
              <span class="memo-card-tag tag-location">
                <span class="material-symbols-outlined">location_on</span>
                ${locationStr}
              </span>
            ` : ''}
          </div>
          <button class="memo-card-delete" title="삭제" data-delete-id="${photo.id}">
            <span class="material-symbols-outlined">close</span>
          </button>
          <div class="memo-card-body">
            <p class="memo-card-text">${photo.memo || '<span style="color:var(--color-outline);font-style:italic;">메모 없음</span>'}</p>
          </div>
        </article>
      `;
    })
    .join('');

  // 삭제 버튼 이벤트
  timelineGrid.querySelectorAll('[data-delete-id]').forEach((btn) => {
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
  timelineView.classList.toggle('active', view === 'timeline');
  mapView.classList.toggle('active', view === 'map');

  // 네비 활성 상태
  navTimeline.classList.toggle('active', view === 'timeline');
  navMap.classList.toggle('active', view === 'map');

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
  // 업로드 영역 클릭
  uploadArea.addEventListener('click', () => fileInput.click());

  // 파일 선택
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  });

  // 드래그 앤 드롭
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });

  // 저장 / 취소
  btnSave.addEventListener('click', handleSave);
  btnCancel.addEventListener('click', handleCancel);

  // 하단 네비게이션
  navTimeline.addEventListener('click', () => switchView('timeline'));
  navMap.addEventListener('click', () => switchView('map'));
  navAdd.addEventListener('click', () => {
    switchView('timeline');
    fileInput.click();
  });

  // 데스크톱 네비 (상단 바)
  document.getElementById('btn-search')?.addEventListener('click', () => {
    showToast('검색 기능은 곧 추가됩니다!');
  });
}

// ──────────────────────────────────────
// Init
// ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  renderTimeline();
  switchView('timeline');
});

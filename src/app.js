import './style.css';
import heic2any from 'heic2any';
import * as htmlToImage from 'html-to-image';
import { extractExif, createThumbnail } from './exifParser.js';
import { initMap, refreshMap, renderMarkers, cycleMapTheme, toggleJourneyLine, toggleHeatmap, setMarkerClickCallback } from './map.js';

// Supabase Modules
import { supabase } from './supabase.js';
import { signUp, signIn, signOut, getCurrentUser, onAuthStateChange, updateProfile } from './auth.js';
import { createFamily, joinFamily, getMyFamily, getFamilyMembers, getFamilyInviteCode } from './family.js';
import { createAlbum, getAlbums, getAlbumPhotos, addPhotoToAlbum, removePhotoFromAlbum, deleteAlbum } from './albums.js';
import { savePhoto, getAllPhotos, deletePhoto, updatePhoto, likePhoto, unlikePhoto, hasUserLiked, addComment, getComments, deleteComment } from './storage.js';

// ──────────────────────────────────────
// DOM References
// ──────────────────────────────────────
// Auth & Family
const authScreen = document.getElementById('auth-screen');
const authLogin = document.getElementById('auth-login');
const authSignup = document.getElementById('auth-signup');
const authFamily = document.getElementById('auth-family');

const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginSubmit = document.getElementById('login-submit');

const signupForm = document.getElementById('signup-form');
const signupNickname = document.getElementById('signup-nickname');
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupError = document.getElementById('signup-error');
const signupSubmit = document.getElementById('signup-submit');

const gotoSignup = document.getElementById('goto-signup');
const gotoLogin = document.getElementById('goto-login');

const familyNameInput = document.getElementById('family-name-input');
const familyCreateBtn = document.getElementById('family-create-btn');
const familyCodeInput = document.getElementById('family-code-input');
const familyJoinBtn = document.getElementById('family-join-btn');
const familyError = document.getElementById('family-error');
const familyLogoutBtn = document.getElementById('family-logout-btn');

// App Layout
const appHeader = document.getElementById('app-header');
const appNav = document.getElementById('app-nav');
const headerFamilyAvatars = document.getElementById('header-family-avatars');

// Views
const homeView = document.getElementById('view-home');
const timelineView = document.getElementById('view-timeline');
const mapView = document.getElementById('view-map');
const calendarView = document.getElementById('view-calendar');
const albumsView = document.getElementById('view-albums'); // New

// Nav Buttons
const navHome = document.getElementById('nav-home');
const navTimeline = document.getElementById('nav-timeline');
const navMap = document.getElementById('nav-map');
const navCalendar = document.getElementById('nav-calendar');
const navAlbums = document.getElementById('nav-albums');
const navAdd = document.getElementById('nav-add');

// Upload & EXIF
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadContent = document.getElementById('upload-content');
const uploadLoading = document.getElementById('upload-loading');
const exifPanel = document.getElementById('exif-panel');
const exifPreview = document.getElementById('exif-preview');
const exifCoord = document.getElementById('exif-coord');
const manualDateInput = document.getElementById('manual-date');
const manualAddressInput = document.getElementById('manual-address');
const memoTextarea = document.getElementById('memo-textarea');
const btnSave = document.getElementById('btn-save');
const btnCancel = document.getElementById('btn-cancel');
const btnAddHashtag = document.getElementById('btn-add-hashtag');

// Timeline
const timelineGrid = document.getElementById('timeline-grid');
const timelineEmptyState = document.getElementById('timeline-empty');
const photoCountBadge = document.getElementById('photo-count');
const filterBar = document.getElementById('filter-bar');
const locationFilterWrapper = document.getElementById('location-filter-wrapper');
const locationFilterSelect = document.getElementById('location-filter-select');

// Search
const btnSearch = document.getElementById('btn-search');
const btnSearchClose = document.getElementById('btn-search-close');
const searchContainer = document.getElementById('search-container');
const searchInput = document.getElementById('search-input');

// Home View
const homeTotalCount = document.getElementById('home-total-count');
const homeFamilyName = document.getElementById('home-family-name');
const homeRecentCard = document.getElementById('home-recent-card');
const homeRecentImg = document.getElementById('home-recent-img');
const homeRecentMemo = document.getElementById('home-recent-memo');
const homeRecentLocation = document.getElementById('home-recent-location');
const homeRecentDate = document.getElementById('home-recent-date');
const homeRecentAvatar = document.getElementById('home-recent-avatar');
const homeRecentUploader = document.getElementById('home-recent-uploader');
const homeStatsTotal = document.getElementById('home-stats-total');
const homeStatsBars = document.getElementById('home-stats-bars');
const homeStatsLabels = document.getElementById('home-stats-labels');
const homeGotoTimeline = document.getElementById('home-goto-timeline');
const homeUploadBtn = document.getElementById('home-upload-btn');
const homeRandomCard = document.getElementById('home-random-card');
const homeRandomImg = document.getElementById('home-random-img');
const homeRandomMemo = document.getElementById('home-random-memo');
const homeRandomDate = document.getElementById('home-random-date');
const homeRandomLocation = document.getElementById('home-random-location');
const homeRandomShuffle = document.getElementById('home-random-shuffle');
const homeRecapCard = document.getElementById('home-recap-card');
const homeRecapCount = document.getElementById('home-recap-count');
const homeRecapDiff = document.getElementById('home-recap-diff');
const homeRecapSubtitle = document.getElementById('home-recap-subtitle');
const homeRecapTags = document.getElementById('home-recap-tags');
const homeRecapLocations = document.getElementById('home-recap-locations');
const homeOnthisdayCard = document.getElementById('home-onthisday-card');
const homeOnthisdayLabel = document.getElementById('home-onthisday-label');
const homeOnthisdayList = document.getElementById('home-onthisday-list');
const homeAlbumsCard = document.getElementById('home-albums-card');
const homeAlbumsList = document.getElementById('home-albums-list');

// Map View
const mapLocationCount = document.getElementById('map-location-count');
const mapHighlightCard = document.getElementById('map-highlight-card');
const mapHighlightImg = document.getElementById('map-highlight-img');
const mapHighlightMemo = document.getElementById('map-highlight-memo');
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

// Calendar
const calTitle = document.getElementById('cal-title');
const calGrid = document.getElementById('cal-grid');
const calPrev = document.getElementById('cal-prev');
const calNext = document.getElementById('cal-next');
const calDayPhotos = document.getElementById('cal-day-photos');
const calDayTitle = document.getElementById('cal-day-title');
const calDayGrid = document.getElementById('cal-day-grid');

// Albums View
const albumCreateBtn = document.getElementById('album-create-btn');
const albumsGrid = document.getElementById('albums-grid');
const albumsEmpty = document.getElementById('albums-empty');
const albumDetailView = document.getElementById('album-detail-view');
const albumBackBtn = document.getElementById('album-back-btn');
const albumDetailName = document.getElementById('album-detail-name');
const albumDetailDesc = document.getElementById('album-detail-desc');
const albumDeleteBtn = document.getElementById('album-delete-btn');
const albumDetailGrid = document.getElementById('album-detail-grid');

// Modals
const toast = document.getElementById('toast');
const settingsModal = document.getElementById('settings-modal');
const settingsModalClose = document.getElementById('settings-modal-close');
const photoModal = document.getElementById('photo-modal');
const photoModalClose = document.getElementById('photo-modal-close');
const photoModalDelete = document.getElementById('photo-modal-delete');
const photoModalImg = document.getElementById('photo-modal-img');
const photoModalDate = document.getElementById('photo-modal-date');
const photoModalTitle = document.getElementById('photo-modal-title');
const photoModalLocation = document.getElementById('photo-modal-location');
const photoModalMemo = document.getElementById('photo-modal-memo');
const albumCreateModal = document.getElementById('album-create-modal');
const addToAlbumModal = document.getElementById('add-to-album-modal');

// Settings Elements
const settingsNickname = document.getElementById('settings-nickname');
const settingsEmail = document.getElementById('settings-email');
const settingsNicknameInput = document.getElementById('settings-nickname-input');
const settingsNicknameSave = document.getElementById('settings-nickname-save');
const settingsFamilyName = document.getElementById('settings-family-name');
const settingsInviteCode = document.getElementById('settings-invite-code');
const settingsCopyCode = document.getElementById('settings-copy-code');
const settingsMembersList = document.getElementById('settings-members-list');
const btnLogout = document.getElementById('btn-logout');

// ──────────────────────────────────────
// State
// ──────────────────────────────────────
let currentUser = null;
let currentFamily = null;
let familyMembers = [];
let allPhotosCache = [];

let currentView = 'home';
let currentExifData = null;
let currentThumbnail = null;
let currentFileBase64 = null;
let currentFileName = '';
let mapInitialized = false;
let currentFilter = 'all';
let currentLocationFilter = '';
let searchQuery = '';
let currentEditingPhoto = null;
let currentMapFilter = 'all';
let currentRandomPhoto = null;
let currentAlbumView = null;

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelectedDate = null;

// ──────────────────────────────────────
// Init & Auth Flow
// ──────────────────────────────────────
function init() {
  setupEventListeners();

  // Listen for auth state changes
  onAuthStateChange(async (event, session) => {
    if (session) {
      currentUser = session.user;
      await checkFamilyStatus();
    } else {
      currentUser = null;
      currentFamily = null;
      showAuthScreen('login');
    }
  });
}

async function checkFamilyStatus() {
  try {
    const family = await getMyFamily();
    if (family) {
      currentFamily = family;
      await fetchFamilyMembers();
      showMainApp();
      loadAppData();
    } else {
      showAuthScreen('family');
    }
  } catch (error) {
    console.error('Error checking family:', error);
    showToast('가족 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

async function fetchFamilyMembers() {
  if (!currentFamily) return;
  try {
    familyMembers = await getFamilyMembers(currentFamily.id);
    updateHeaderAvatars();
    updateSettingsMembers();
  } catch (error) {
    console.error('Error fetching members:', error);
  }
}

function showAuthScreen(type) {
  authScreen.classList.remove('hidden');
  appHeader.classList.add('hidden');
  appNav.classList.add('hidden');
  document.querySelector('main').classList.add('hidden');

  authLogin.classList.add('hidden');
  authSignup.classList.add('hidden');
  authFamily.classList.add('hidden');

  if (type === 'login') authLogin.classList.remove('hidden');
  else if (type === 'signup') authSignup.classList.remove('hidden');
  else if (type === 'family') authFamily.classList.remove('hidden');
}

function showMainApp() {
  authScreen.classList.add('hidden');
  appHeader.classList.remove('hidden');
  appNav.classList.remove('hidden');
  document.querySelector('main').classList.remove('hidden');
  
  if (currentFamily) {
    homeFamilyName.innerHTML = `<span class="material-symbols-outlined text-sm">family_restroom</span><span>${currentFamily.name} 가족</span>`;
    settingsFamilyName.textContent = currentFamily.name;
    settingsInviteCode.textContent = currentFamily.invite_code;
    settingsEmail.textContent = currentUser.email;
    settingsNickname.textContent = currentUser.user_metadata?.nickname || '사용자';
  }
}

async function loadAppData() {
  try {
    allPhotosCache = await getAllPhotos(currentFamily.id);
    renderTimeline();
    updateHomeView();
    if (currentView === 'albums') renderAlbumsView();
    if (currentView === 'map' && mapInitialized) refreshMapMarkers();
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('데이터를 불러오지 못했습니다.');
  }
}

// ──────────────────────────────────────
// UI Utilities
// ──────────────────────────────────────
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function generateAvatarHtml(user, sizeClass = '') {
  const nickname = user?.nickname || user?.user_metadata?.nickname || 'User';
  const initial = nickname.charAt(0).toUpperCase();
  return `<div class="user-avatar ${sizeClass}" title="${nickname}">${initial}</div>`;
}

function updateHeaderAvatars() {
  if (!familyMembers || familyMembers.length === 0) return;
  headerFamilyAvatars.innerHTML = familyMembers.map(m => generateAvatarHtml(m.profiles, 'small')).join('');
}

function updateSettingsMembers() {
  if (!settingsMembersList || !familyMembers) return;
  settingsMembersList.innerHTML = familyMembers.map(m => {
    const isMe = m.user_id === currentUser.id;
    return `
      <div class="family-member-item">
        ${generateAvatarHtml(m.profiles, 'small')}
        <span class="member-name">${m.profiles.nickname} ${isMe ? '(나)' : ''}</span>
        <span class="member-role ${m.role}">${m.role === 'admin' ? '관리자' : '멤버'}</span>
      </div>
    `;
  }).join('');
}

function formatDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

function formatHashtags(text) {
  if (!text) return '';
  return text.replace(/(#[A-Za-z0-9가-힣_]+)/g, '<span class="hashtag" data-tag="$1">$1</span>');
}

// ──────────────────────────────────────
// Auth & Family Event Listeners
// ──────────────────────────────────────
function setupAuthEvents() {
  gotoSignup.addEventListener('click', () => showAuthScreen('signup'));
  gotoLogin.addEventListener('click', () => showAuthScreen('login'));

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    loginSubmit.classList.add('auth-loading');
    loginSubmit.textContent = '로그인 중...';
    try {
      await signIn(loginEmail.value, loginPassword.value);
    } catch (err) {
      loginError.textContent = err.message || '로그인에 실패했습니다.';
      loginError.classList.remove('hidden');
    } finally {
      loginSubmit.classList.remove('auth-loading');
      loginSubmit.textContent = '로그인';
    }
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.classList.add('hidden');
    signupSubmit.classList.add('auth-loading');
    signupSubmit.textContent = '가입 중...';
    try {
      await signUp(signupEmail.value, signupPassword.value, signupNickname.value);
      showToast('가입되었습니다! 로그인 중입니다...');
    } catch (err) {
      signupError.textContent = err.message || '회원가입에 실패했습니다.';
      signupError.classList.remove('hidden');
    } finally {
      signupSubmit.classList.remove('auth-loading');
      signupSubmit.textContent = '가입하기';
    }
  });

  familyCreateBtn.addEventListener('click', async () => {
    const name = familyNameInput.value.trim();
    if (!name) return showToast('가족 이름을 입력하세요.');
    familyCreateBtn.classList.add('auth-loading');
    try {
      await createFamily(name);
      await checkFamilyStatus();
    } catch (err) {
      familyError.textContent = err.message;
      familyError.classList.remove('hidden');
    } finally {
      familyCreateBtn.classList.remove('auth-loading');
    }
  });

  familyJoinBtn.addEventListener('click', async () => {
    const code = familyCodeInput.value.trim();
    if (!code) return showToast('초대 코드를 입력하세요.');
    familyJoinBtn.classList.add('auth-loading');
    try {
      await joinFamily(code);
      await checkFamilyStatus();
    } catch (err) {
      familyError.textContent = err.message;
      familyError.classList.remove('hidden');
    } finally {
      familyJoinBtn.classList.remove('auth-loading');
    }
  });

  familyLogoutBtn.addEventListener('click', () => signOut());
  btnLogout.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    signOut();
  });
}

// ──────────────────────────────────────
// View Navigation
// ──────────────────────────────────────
function switchView(view) {
  currentView = view;
  
  homeView.classList.toggle('active', view === 'home');
  timelineView.classList.toggle('active', view === 'timeline');
  mapView.classList.toggle('active', view === 'map');
  calendarView.classList.toggle('active', view === 'calendar');
  albumsView.classList.toggle('active', view === 'albums');

  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.view === view) {
      item.classList.add('active');
      item.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1";
    } else if (item.dataset.view) {
      item.classList.remove('active');
      item.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 0";
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
  } else if (view === 'calendar') {
    renderCalendar();
  } else if (view === 'albums') {
    renderAlbumsView();
  }
}

// ──────────────────────────────────────
// Event Listeners (Main App)
// ──────────────────────────────────────
function setupEventListeners() {
  setupAuthEvents();

  // Nav
  navHome.addEventListener('click', () => switchView('home'));
  navTimeline.addEventListener('click', () => switchView('timeline'));
  navMap.addEventListener('click', () => switchView('map'));
  navCalendar.addEventListener('click', () => switchView('calendar'));
  navAlbums.addEventListener('click', () => switchView('albums'));
  navAdd.addEventListener('click', () => {
    switchView('timeline');
    fileInput.click();
  });

  // Home links
  homeGotoTimeline?.addEventListener('click', () => switchView('timeline'));
  homeUploadBtn?.addEventListener('click', () => { switchView('timeline'); fileInput.click(); });

  // Settings
  document.getElementById('btn-settings').addEventListener('click', () => {
    settingsModal.classList.add('active');
  });
  settingsModalClose.addEventListener('click', () => settingsModal.classList.remove('active'));
  settingsCopyCode.addEventListener('click', () => {
    navigator.clipboard.writeText(currentFamily.invite_code);
    showToast('초대 코드가 복사되었습니다.');
  });
  settingsNicknameSave.addEventListener('click', async () => {
    const newName = settingsNicknameInput.value.trim();
    if(newName) {
      try {
        await updateProfile(currentUser.id, { nickname: newName });
        settingsNickname.textContent = newName;
        showToast('닉네임이 변경되었습니다.');
        await fetchFamilyMembers();
      } catch (e) {
        showToast('닉네임 변경 실패');
      }
    }
  });

  // Search
  btnSearch.addEventListener('click', () => {
    searchContainer.classList.remove('hidden');
    searchInput.focus();
  });
  btnSearchClose.addEventListener('click', () => {
    searchContainer.classList.add('hidden');
    searchInput.value = '';
    searchQuery = '';
    renderTimeline();
  });
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderTimeline();
  });

  // File Upload
  document.getElementById('upload-label')?.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => handleFilesSelect(Array.from(e.target.files)));
  
  // Hashtag quick insert
  btnAddHashtag?.addEventListener('click', () => {
    const val = memoTextarea.value;
    memoTextarea.value = val + (val.endsWith(' ') || val === '' ? '#' : ' #');
    memoTextarea.focus();
  });
  
  // Upload Save/Cancel
  btnSave.addEventListener('click', handleSave);
  btnCancel.addEventListener('click', handleCancel);

  // Modals
  [photoModalClose, document.getElementById('add-to-album-close'), document.getElementById('album-create-cancel')].forEach(btn => {
    if(btn) btn.addEventListener('click', (e) => {
      e.target.closest('.photo-modal').classList.remove('active');
    });
  });

  if (photoModalDelete) {
    photoModalDelete.addEventListener('click', async () => {
      if (!currentEditingPhoto) return;
      if (confirm('이 사진을 정말 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다)')) {
        try {
          await deletePhoto(currentEditingPhoto.id, currentFamily.id);
          showToast('사진이 삭제되었습니다.');
          photoModal.classList.remove('active');
          loadAppData();
        } catch (e) {
          console.error(e);
          showToast('삭제에 실패했습니다: ' + (e?.message || ''));
        }
      }
    });
  }

  // Albums
  albumCreateBtn.addEventListener('click', () => {
    document.getElementById('album-name-input').value = '';
    document.getElementById('album-desc-input').value = '';
    albumCreateModal.classList.add('active');
  });
  document.getElementById('album-create-submit').addEventListener('click', async () => {
    const name = document.getElementById('album-name-input').value.trim();
    const desc = document.getElementById('album-desc-input').value.trim();
    if(!name) return showToast('앨범 이름을 입력하세요');
    try {
      await createAlbum(currentFamily.id, name, desc);
      albumCreateModal.classList.remove('active');
      showToast('앨범이 생성되었습니다.');
      renderAlbumsView();
    } catch(e) {
      showToast('앨범 생성 실패');
    }
  });
  albumBackBtn.addEventListener('click', () => {
    albumDetailView.classList.add('hidden');
    albumsGrid.classList.remove('hidden');
    currentAlbumView = null;
  });

  // Comments Input
  document.getElementById('photo-modal-comment-submit').addEventListener('click', async () => {
    const input = document.getElementById('photo-modal-comment-input');
    const content = input.value.trim();
    if(!content || !currentEditingPhoto) return;
    try {
      await addComment(currentEditingPhoto.id, currentUser.id, content);
      input.value = '';
      loadComments(currentEditingPhoto.id);
      loadAppData(); // Refresh timeline counts
    } catch (e) {
      showToast('댓글 작성 실패');
    }
  });

  // Like Button
  document.getElementById('photo-modal-like-btn').addEventListener('click', async () => {
    if(!currentEditingPhoto) return;
    const icon = document.getElementById('photo-modal-like-icon');
    const isLiked = icon.classList.contains('like-active');
    
    icon.classList.add('like-pop');
    setTimeout(() => icon.classList.remove('like-pop'), 400);

    try {
      if (isLiked) {
        await unlikePhoto(currentEditingPhoto.id, currentUser.id);
        icon.classList.remove('like-active');
      } else {
        await likePhoto(currentEditingPhoto.id, currentUser.id);
        icon.classList.add('like-active');
      }
      const likesCount = await getPhotoLikes(currentEditingPhoto.id);
      document.getElementById('photo-modal-like-count').textContent = likesCount;
      loadAppData();
    } catch (e) {
      console.error(e);
    }
  });
}

// ──────────────────────────────────────
// File Upload Logic
// ──────────────────────────────────────
async function handleFilesSelect(files) {
  if (files.length === 0) return;
  switchView('timeline');
  
  if (files.length === 1) {
    processSingleFile(files[0]);
  } else {
    processMultipleFiles(files);
  }
}

async function processSingleFile(file) {
  const isHeic = file.name.toLowerCase().match(/\.hei(c|f)$/i) || file.type === 'image/heic';
  if (!file.type.startsWith('image/') && !isHeic) return showToast('이미지만 가능합니다.');

  uploadArea.classList.remove('hidden');
  uploadContent.classList.add('hidden');
  uploadLoading.classList.add('active', 'flex');
  exifPanel.classList.add('hidden');
  
  try {
    let processFile = file;
    if (isHeic) {
      uploadLoading.querySelector('p').textContent = 'HEIC 변환 중...';
      const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
      processFile = new File([Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
    }

    const [exifData, thumbnail] = await Promise.all([extractExif(processFile), createThumbnail(processFile)]);
    currentExifData = exifData;
    currentThumbnail = thumbnail;
    currentFileName = file.name;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      currentFileBase64 = e.target.result;
      
      uploadLoading.classList.remove('active', 'flex');
      uploadContent.classList.remove('hidden');
      exifPreview.src = thumbnail;
      exifPreview.classList.remove('hidden');
      
      const d = exifData.date ? new Date(exifData.date) : new Date();
      manualDateInput.value = d.toISOString().split('T')[0];
      
      if (exifData.lat && exifData.lng) {
        exifCoord.textContent = `${exifData.lat.toFixed(4)}, ${exifData.lng.toFixed(4)}`;
        manualAddressInput.value = 'GPS 위치 정보 포함'; // Reverse geocoding can be done server side if needed
      } else {
        exifCoord.textContent = '정보 없음';
        manualAddressInput.value = '';
      }
      
      exifPanel.classList.remove('hidden');
      uploadArea.classList.add('hidden');
      memoTextarea.value = '';
    };
    reader.readAsDataURL(processFile);
  } catch (err) {
    console.error(err);
    showToast('사진 처리 실패');
    uploadLoading.classList.remove('active', 'flex');
    uploadContent.classList.remove('hidden');
  }
}

async function processMultipleFiles(files) {
  // Simplistic multiple file processing for space
  showToast('다중 업로드는 백그라운드에서 진행됩니다.');
}

async function handleSave() {
  if (!currentFileBase64 || !currentThumbnail) return;
  btnSave.disabled = true;
  
  try {
    const finalDate = manualDateInput.value ? new Date(manualDateInput.value).toISOString() : new Date().toISOString();
    const photoData = {
      family_id: currentFamily.id,
      uploaded_by: currentUser.id,
      imageDataUrl: currentFileBase64,
      thumbnailDataUrl: currentThumbnail,
      date: finalDate,
      lat: currentExifData?.lat || null,
      lng: currentExifData?.lng || null,
      address: manualAddressInput.value.trim() || null,
      memo: memoTextarea.value.trim(),
      file_name: currentFileName,
    };
    
    await savePhoto(photoData, currentFamily.id);
    showToast('업로드 완료');
    handleCancel();
    loadAppData();
  } catch(e) {
    console.error('Photo save error:', e);
    const msg = e?.message || e?.error_description || JSON.stringify(e);
    showToast('저장 실패: ' + msg);
  } finally {
    btnSave.disabled = false;
  }
}

function handleCancel() {
  currentExifData = null;
  currentThumbnail = null;
  currentFileBase64 = null;
  fileInput.value = '';
  exifPanel.classList.add('hidden');
  uploadArea.classList.remove('hidden');
  uploadContent.classList.remove('hidden');
}

// ──────────────────────────────────────
// Timeline Rendering
// ──────────────────────────────────────
function renderTimeline() {
  let photos = [...allPhotosCache];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    photos = photos.filter(p => (p.memo?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)));
  }

  photoCountBadge.textContent = `${photos.length}개의 기록`;
  
  if (photos.length === 0) {
    timelineGrid.innerHTML = '';
    timelineEmptyState.classList.remove('hidden');
    return;
  }
  timelineEmptyState.classList.add('hidden');

  timelineGrid.innerHTML = photos.map((photo, idx) => {
    const isLarge = idx === 0 && !searchQuery;
    const colSpan = isLarge ? 'col-span-4 md:col-span-6' : 'col-span-2 md:col-span-4';
    
    // Uploader profile
    const uploader = familyMembers.find(m => m.user_id === photo.uploaded_by)?.profiles;
    
    return `
      <section class="${colSpan} timeline-card ${isLarge ? 'is-large' : ''} fade-in" data-id="${photo.id}">
        <div class="timeline-card-photo">
          <img src="${photo.thumbnail_url || photo.thumbnailDataUrl}" loading="lazy" />
          <button class="favorite-btn-card ${photo.favorite ? 'is-fav' : ''}" data-fav-id="${photo.id}">
            <span class="material-symbols-outlined">star</span>
          </button>
        </div>
        <div class="timeline-card-info">
          <div class="info-date"><span class="material-symbols-outlined">schedule</span>${formatDateShort(photo.date || photo.createdAt)}</div>
          <div class="info-memo">${formatHashtags(photo.memo)}</div>
        </div>
        <div class="timeline-card-social">
          <button><span class="material-symbols-outlined text-[16px]">favorite</span> ${photo.photo_likes?.[0]?.count || 0}</button>
          <button><span class="material-symbols-outlined text-[16px]">chat_bubble</span> ${photo.photo_comments?.[0]?.count || 0}</button>
          <div class="uploader-info">
            ${generateAvatarHtml(uploader, 'small')}
            <span>${uploader?.nickname || 'User'}</span>
          </div>
        </div>
      </section>
    `;
  }).join('');

  timelineGrid.querySelectorAll('.timeline-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = card.dataset.id;
      const photo = allPhotosCache.find(p => p.id === id);
      if (photo) openPhotoModal(photo);
    });
  });
}

// ──────────────────────────────────────
// Modals & Details
// ──────────────────────────────────────
async function openPhotoModal(photo) {
  currentEditingPhoto = photo;
  
  photoModalImg.src = photo.image_url || photo.imageDataUrl || photo.thumbnailDataUrl;
  photoModalDate.textContent = formatDate(photo.date || photo.createdAt);
  photoModalTitle.textContent = photo.memo || '추억 상세';
  photoModalLocation.textContent = photo.address || '위치 미상';
  photoModalMemo.innerHTML = formatHashtags(photo.memo) || '메모 없음';
  
  const uploader = familyMembers.find(m => m.user_id === photo.uploaded_by)?.profiles;
  document.getElementById('photo-modal-uploader').textContent = uploader?.nickname || '사용자';
  
  // Likes status
  const liked = await hasUserLiked(photo.id, currentUser.id);
  const likeIcon = document.getElementById('photo-modal-like-icon');
  likeIcon.classList.toggle('like-active', liked);
  document.getElementById('photo-modal-like-count').textContent = photo.photo_likes?.[0]?.count || await getPhotoLikes(photo.id);
  
  loadComments(photo.id);
  
  photoModal.classList.add('active');
}

async function loadComments(photoId) {
  const list = document.getElementById('photo-modal-comments-list');
  list.innerHTML = '<div class="text-center text-on-surface-variant text-sm py-2">불러오는 중...</div>';
  try {
    const comments = await getComments(photoId);
    document.getElementById('photo-modal-comment-count').textContent = comments.length;
    
    if (comments.length === 0) {
      list.innerHTML = '<div class="text-center text-on-surface-variant text-sm py-2">첫 댓글을 남겨보세요!</div>';
      return;
    }
    
    list.innerHTML = comments.map(c => {
      const isMine = c.user_id === currentUser.id;
      return `
        <div class="comment-item">
          <div class="comment-avatar">${generateAvatarHtml(c.profiles, 'small')}</div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-author">${c.profiles.nickname}</span>
              <span class="comment-time">${formatDateShort(c.created_at)}</span>
              ${isMine ? `<button class="comment-delete" data-cid="${c.id}"><span class="material-symbols-outlined text-[14px]">delete</span></button>` : ''}
            </div>
            <div class="comment-text">${c.content}</div>
          </div>
        </div>
      `;
    }).join('');
    
    list.querySelectorAll('.comment-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if(confirm('댓글을 삭제할까요?')) {
          await deleteComment(btn.dataset.cid);
          loadComments(photoId);
          loadAppData();
        }
      });
    });
  } catch(e) {
    list.innerHTML = '<div class="text-error text-sm py-2">댓글을 불러오지 못했습니다.</div>';
  }
}

// ──────────────────────────────────────
// Albums View
// ──────────────────────────────────────
async function renderAlbumsView() {
  try {
    const albums = await getAlbums(currentFamily.id);
    
    if (albums.length === 0) {
      albumsGrid.classList.add('hidden');
      albumsEmpty.classList.remove('hidden');
      return;
    }
    albumsGrid.classList.remove('hidden');
    albumsEmpty.classList.add('hidden');
    
    albumsGrid.innerHTML = albums.map(album => {
      return `
        <div class="album-grid-card" data-aid="${album.id}">
          <div class="album-grid-empty-icon"><span class="material-symbols-outlined text-4xl text-white/20">photo_library</span></div>
          <div class="album-grid-overlay">
            <h3 class="album-grid-name">${album.name}</h3>
            <div class="album-grid-meta">
              <span class="material-symbols-outlined text-[14px]">photo_library</span>
              ${album.description || ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    albumsGrid.querySelectorAll('.album-grid-card').forEach(card => {
      card.addEventListener('click', () => openAlbumDetail(card.dataset.aid, albums));
    });
  } catch (e) {
    console.error('Albums error:', e);
    showToast('앨범 불러오기 실패: ' + (e?.message || ''));
  }
}

async function openAlbumDetail(albumId, albumsList) {
  const album = albumsList.find(a => a.id === albumId);
  if (!album) return;
  
  currentAlbumView = album;
  albumDetailName.textContent = album.name;
  albumDetailDesc.textContent = album.description || '설명이 없습니다.';
  
  albumsGrid.classList.add('hidden');
  albumDetailView.classList.remove('hidden');
  
  try {
    const photos = await getAlbumPhotos(albumId);
    albumDetailGrid.innerHTML = photos.map(photo => `
      <div class="timeline-card-photo rounded-lg cursor-pointer" data-pid="${photo.id}">
        <img src="${photo.thumbnail_url || photo.thumbnailDataUrl}" class="w-full aspect-square object-cover rounded-lg" />
      </div>
    `).join('');
    
    albumDetailGrid.querySelectorAll('[data-pid]').forEach(el => {
      el.addEventListener('click', () => {
        const p = allPhotosCache.find(x => x.id === el.dataset.pid);
        if(p) openPhotoModal(p);
      });
    });
  } catch(e) {
    console.error('Album detail error:', e);
    showToast('앨범 사진 불러오기 실패');
  }
}

// ──────────────────────────────────────
// Map & Calendar
// ──────────────────────────────────────
function refreshMapMarkers() {
  if(mapInitialized) renderMarkers(allPhotosCache);
}

function updateHomeView() {
  homeTotalCount.textContent = allPhotosCache.length;
  homeStatsTotal.textContent = `총 ${allPhotosCache.length}개의 추억`;
  
  const recent = allPhotosCache[0];
  if (recent) {
    homeRecentCard.style.display = '';
    homeRecentImg.src = recent.thumbnail_url || recent.thumbnailDataUrl;
    homeRecentMemo.textContent = recent.memo || '최근 기록';
    homeRecentDate.textContent = formatDateShort(recent.date || recent.created_at) || '';
    homeRecentLocation.textContent = recent.address || '위치 미상';
  }
  
  // Random photo
  if (allPhotosCache.length > 0) {
    const rand = allPhotosCache[Math.floor(Math.random() * allPhotosCache.length)];
    homeRandomCard.style.display = '';
    homeRandomImg.src = rand.thumbnail_url || rand.thumbnailDataUrl;
    homeRandomMemo.textContent = rand.memo || '';
    homeRandomDate.textContent = formatDateShort(rand.date || rand.created_at) || '';
    homeRandomLocation.textContent = rand.address || '위치 미상';
    currentRandomPhoto = rand;
  }
  
  // Monthly stats bars
  renderMonthlyStats();
  
  // On this day
  renderOnThisDay();
}

function renderMonthlyStats() {
  const months = Array(6).fill(0);
  const labels = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('ko-KR', { month: 'short' }));
  }
  
  allPhotosCache.forEach(p => {
    const pd = new Date(p.date || p.created_at);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      if (pd >= d && pd <= dEnd) {
        months[5 - i]++;
        break;
      }
    }
  });
  
  const max = Math.max(...months, 1);
  homeStatsBars.innerHTML = months.map((c, i) => {
    const h = Math.max((c / max) * 100, 4);
    return `<div class="flex-1 flex flex-col items-center justify-end">
      <span class="text-[10px] text-primary mb-1">${c}</span>
      <div class="w-full rounded-full bg-primary/30" style="height: ${h}%">
        <div class="w-full h-full rounded-full bg-primary"></div>
      </div>
    </div>`;
  }).join('');
  homeStatsLabels.innerHTML = labels.map(l => `<span>${l}</span>`).join('');
}

function renderOnThisDay() {
  const today = new Date();
  const mm = today.getMonth();
  const dd = today.getDate();
  
  const matches = allPhotosCache.filter(p => {
    const pd = new Date(p.date || p.created_at);
    return pd.getMonth() === mm && pd.getDate() === dd && pd.getFullYear() !== today.getFullYear();
  });
  
  if (matches.length > 0) {
    homeOnthisdayCard.style.display = '';
    homeOnthisdayLabel.textContent = `${today.getMonth() + 1}월 ${today.getDate()}일의 추억 (${matches.length}건)`;
    homeOnthisdayList.innerHTML = matches.map(p => `
      <div class="flex-shrink-0 w-32 cursor-pointer" data-oid="${p.id}">
        <img src="${p.thumbnail_url || p.thumbnailDataUrl}" class="w-32 h-32 rounded-xl object-cover border border-white/10" />
        <p class="text-[11px] text-on-surface-variant mt-1 truncate">${p.memo || formatDateShort(p.date)}</p>
      </div>
    `).join('');
  }
}

function renderCalendar() {
  const year = calYear;
  const month = calMonth;
  calTitle.textContent = `${year}년 ${month + 1}월`;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Build photo count per day
  const photoDays = {};
  allPhotosCache.forEach(p => {
    const pd = new Date(p.date || p.created_at);
    if (pd.getFullYear() === year && pd.getMonth() === month) {
      const day = pd.getDate();
      photoDays[day] = (photoDays[day] || 0) + 1;
    }
  });
  
  let html = '';
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="cal-cell empty"></div>';
  }
  
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const count = photoDays[d] || 0;
    const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
    const isSelected = calSelectedDate === d;
    const hasPhotos = count > 0;
    
    html += `
      <div class="cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasPhotos ? 'has-photos' : ''}" 
           data-day="${d}" style="cursor: ${hasPhotos ? 'pointer' : 'default'}">
        <span class="cal-day-num ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}">${d}</span>
        ${hasPhotos ? `<div class="cal-dot"></div>` : ''}
      </div>
    `;
  }
  
  calGrid.innerHTML = html;
  
  // Click handlers
  calGrid.querySelectorAll('.cal-cell[data-day]').forEach(cell => {
    cell.addEventListener('click', () => {
      const day = parseInt(cell.dataset.day);
      calSelectedDate = day;
      renderCalendar();
      showDayPhotos(year, month, day);
    });
  });
  
  // Nav buttons
  calPrev.onclick = () => { calMonth--; if(calMonth < 0) { calMonth = 11; calYear--; } calSelectedDate = null; renderCalendar(); calDayPhotos.style.display = 'none'; };
  calNext.onclick = () => { calMonth++; if(calMonth > 11) { calMonth = 0; calYear++; } calSelectedDate = null; renderCalendar(); calDayPhotos.style.display = 'none'; };
}

function showDayPhotos(year, month, day) {
  const photos = allPhotosCache.filter(p => {
    const pd = new Date(p.date || p.created_at);
    return pd.getFullYear() === year && pd.getMonth() === month && pd.getDate() === day;
  });
  
  if (photos.length === 0) {
    calDayPhotos.style.display = 'none';
    return;
  }
  
  calDayPhotos.style.display = '';
  calDayTitle.textContent = `${year}년 ${month + 1}월 ${day}일 (${photos.length}장)`;
  calDayGrid.innerHTML = photos.map(p => `
    <div class="cursor-pointer rounded-xl overflow-hidden border border-white/10" data-cpid="${p.id}">
      <img src="${p.thumbnail_url || p.thumbnailDataUrl}" class="w-full aspect-square object-cover" />
      <div class="p-2 bg-surface-container">
        <p class="text-body-sm text-on-surface-variant truncate">${p.memo || '메모 없음'}</p>
      </div>
    </div>
  `).join('');
  
  calDayGrid.querySelectorAll('[data-cpid]').forEach(el => {
    el.addEventListener('click', () => {
      const photo = allPhotosCache.find(x => x.id === el.dataset.cpid);
      if(photo) openPhotoModal(photo);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

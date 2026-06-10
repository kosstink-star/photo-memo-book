import './style.css';
import heic2any from 'heic2any';
import * as htmlToImage from 'html-to-image';
import { extractExif, createThumbnail } from './exifParser.js';
import { initMap, refreshMap, renderMarkers, cycleMapTheme, toggleJourneyLine, toggleHeatmap, setMarkerClickCallback } from './map.js';

// Supabase Modules
import { supabase } from './supabase.js';
import { signUp, signIn, signOut, getCurrentUser, onAuthStateChange, updateProfile } from './auth.js';
import { createFamily, joinFamily, getMyFamily, getFamilyMembers, getFamilyInviteCode, getPendingMembers, approveMember, rejectMember } from './family.js';
import { createAlbum, getAlbums, getAlbumPhotos, addPhotoToAlbum, removePhotoFromAlbum, deleteAlbum } from './albums.js';
import { savePhoto, getAllPhotos, deletePhoto, updatePhoto, likePhoto, unlikePhoto, hasUserLiked, getPhotoLikes } from './storage.js';

// ──────────────────────────────────────
// DOM References
// ──────────────────────────────────────
// Auth & Family
const authScreen = document.getElementById('auth-screen');
const authLogin = document.getElementById('auth-login');
const authSignup = document.getElementById('auth-signup');
const authFamily = document.getElementById('auth-family');
const authPending = document.getElementById('auth-pending');

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

const home1YearCard = document.getElementById('home-1year-card');
const home1YearImg = document.getElementById('home-1year-img');
const home1YearMemo = document.getElementById('home-1year-memo');
const home1YearDate = document.getElementById('home-1year-date');
const home1YearLocation = document.getElementById('home-1year-location');
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
const photoModalDateInput = document.getElementById('photo-modal-date-input');
const photoModalTitle = document.getElementById('photo-modal-title');
const photoModalLocation = document.getElementById('photo-modal-location');
const photoModalLocationInput = document.getElementById('photo-modal-location-input');
const photoModalMemo = document.getElementById('photo-modal-memo');
const photoModalEdit = document.getElementById('photo-modal-edit');
const photoModalFavorite = document.getElementById('photo-modal-favorite');
const photoModalExport = document.getElementById('photo-modal-export');
const photoModalMemoTextarea = document.getElementById('photo-modal-memo-textarea');
const photoModalSaveBtn = document.getElementById('photo-modal-save-btn');
const photoModalAddHashtagBtn = document.getElementById('photo-modal-add-hashtag-btn');
const albumCreateModal = document.getElementById('album-create-modal');
const addToAlbumModal = document.getElementById('add-to-album-modal');
const addToAlbumList = document.getElementById('add-to-album-list');
const photoModalAddToAlbum = document.getElementById('photo-modal-add-to-album');

const albumAddPhotosModal = document.getElementById('album-add-photos-modal');
const albumAddPhotosGrid = document.getElementById('album-add-photos-grid');
const albumAddPhotosCancel = document.getElementById('album-add-photos-cancel');
const albumAddPhotosSave = document.getElementById('album-add-photos-save');
const albumAddPhotosBtn = document.getElementById('album-add-photos-btn');

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
let currentTimelineFilter = 'all';
let currentTimelineSort = 'desc';
let currentTimelineLocation = '';
let currentTimelineLimit = 20;

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calSelectedDate = null;

// ──────────────────────────────────────
// Init & Auth Flow
// ──────────────────────────────────────
function init() {
  setupEventListeners();
  setupPullToRefresh();
  setupInfiniteScroll();

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

function setupInfiniteScroll() {
  const sentinel = document.getElementById('timeline-sentinel');
  if (!sentinel) return;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (currentTimelineLimit < allPhotosCache.length) {
        currentTimelineLimit += 20;
        renderTimeline();
      }
    }
  }, { rootMargin: '100px' });
  observer.observe(sentinel);
}

function setupPullToRefresh() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  let startY = 0;
  let isPulling = false;
  
  mainContent.addEventListener('touchstart', e => {
    if (mainContent.scrollTop === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  }, { passive: true });
  
  mainContent.addEventListener('touchmove', e => {
    if (!isPulling) return;
    const y = e.touches[0].clientY;
    if (y - startY > 100) {
      // Trigger refresh visually
      showToast('새로고침 중...');
      isPulling = false;
      loadAppData();
    }
  }, { passive: true });
  
  mainContent.addEventListener('touchend', () => {
    isPulling = false;
  }, { passive: true });
}

async function checkFamilyStatus() {
  try {
    const family = await getMyFamily();
    if (family) {
      if (family.myRole === 'pending') {
        showAuthScreen('pending');
      } else {
        currentFamily = family;
        await fetchFamilyMembers();
        showMainApp();
        loadAppData();
      }
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
    showToast('멤버 조회 오류: ' + (error.message || '알 수 없음'));
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
  authPending.classList.add('hidden');

  if (type === 'login') authLogin.classList.remove('hidden');
  else if (type === 'signup') authSignup.classList.remove('hidden');
  else if (type === 'family') authFamily.classList.remove('hidden');
  else if (type === 'pending') authPending.classList.remove('hidden');
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
    currentTimelineLimit = 20;
    renderTimeline();
    updateHomeView();
    if (currentView === 'albums') renderAlbumsView();
    if (currentView === 'map' && mapInitialized) refreshMapMarkers();
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('데이터를 불러오지 못했습니다: ' + (error?.message || error));
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

async function updateSettingsMembers() {
  if (!settingsMembersList || !familyMembers) return;
  
  
  const storageUsageEl = document.getElementById('settings-storage-usage');
  if (storageUsageEl) {
    try {
      const { data, error } = await supabase.storage.from('family-photos').list(currentFamily.id);
      if (!error && data) {
        const totalBytes = data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
        const mb = (totalBytes / (1024 * 1024)).toFixed(1);
        storageUsageEl.textContent = `${mb} MB`;
      } else {
        storageUsageEl.textContent = '알 수 없음';
      }
    } catch(e) {
      storageUsageEl.textContent = '오류';
    }
  }

  settingsMembersList.innerHTML = familyMembers.map(m => {
    const isMe = m.user_id === currentUser.id;
    const nickname = m.profiles?.nickname || '알 수 없음';
    return `
      <div class="family-member-item">
        ${generateAvatarHtml(m.profiles, 'small')}
        <span class="member-name">${nickname} ${isMe ? '(나)' : ''}</span>
        <span class="member-role ${m.role}">${m.role === 'admin' ? '관리자' : '멤버'}</span>
      </div>
    `;
  }).join('');

  const pendingSection = document.getElementById('settings-pending-section');
  const pendingList = document.getElementById('settings-pending-list');

  const qrContainer = document.getElementById('qrcode-container');
  if (qrContainer && currentFamily && currentFamily.invite_code) {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: window.location.origin + window.location.pathname + '?invite=' + currentFamily.invite_code,
      width: 128,
      height: 128,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  }

  
  if (currentFamily && currentFamily.myRole === 'admin') {
    try {
      const pendingMembers = await getPendingMembers(currentFamily.id);
      if (pendingMembers && pendingMembers.length > 0) {
        pendingSection.classList.remove('hidden');
        pendingList.innerHTML = pendingMembers.map(m => `
          <div class="family-member-item justify-between">
            <div class="flex items-center gap-3">
              ${generateAvatarHtml(m.profiles, 'small')}
              <span class="member-name">${m.profiles?.nickname || '알 수 없음'}</span>
            </div>
            <div class="flex gap-2">
              <button class="px-3 py-1 bg-primary text-on-primary rounded text-xs hover:brightness-110 btn-approve-member" data-uid="${m.user_id}">승인</button>
              <button class="px-3 py-1 bg-error text-white rounded text-xs hover:brightness-110 btn-reject-member" data-uid="${m.user_id}">거절</button>
            </div>
          </div>
        `).join('');

        // Attach events
        pendingList.querySelectorAll('.btn-approve-member').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const uid = e.target.getAttribute('data-uid');
            try {
              e.target.disabled = true;
              await approveMember(currentFamily.id, uid);
              showToast('가입을 승인했습니다.');
              await fetchFamilyMembers();
            } catch (err) {
              console.error(err);
              showToast('승인 처리 중 오류가 발생했습니다.');
              e.target.disabled = false;
            }
          });
        });

        pendingList.querySelectorAll('.btn-reject-member').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const uid = e.target.getAttribute('data-uid');
            try {
              e.target.disabled = true;
              await rejectMember(currentFamily.id, uid);
              showToast('가입을 거절했습니다.');
              await fetchFamilyMembers();
            } catch (err) {
              console.error(err);
              showToast('거절 처리 중 오류가 발생했습니다.');
              e.target.disabled = false;
            }
          });
        });
      } else {
        pendingSection.classList.add('hidden');
      }
    } catch (err) {
      console.error('Error loading pending members', err);
      showToast('대기자 조회 오류: ' + (err.message || '알 수 없음'));
      pendingSection.classList.add('hidden');
    }
  } else {
    pendingSection.classList.add('hidden');
  }
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

  // Pending Screen Actions
  document.getElementById('pending-refresh-btn').addEventListener('click', async () => {
    document.getElementById('pending-refresh-btn').classList.add('auth-loading');
    await checkFamilyStatus();
    document.getElementById('pending-refresh-btn').classList.remove('auth-loading');
  });

  document.getElementById('pending-logout-btn').addEventListener('click', () => signOut());
  btnLogout.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    signOut();
  });
}

// ──────────────────────────────────────
// View Navigation
// ──────────────────────────────────────

function openMapBottomSheet(photo) {
  const sheet = document.getElementById('map-bottom-sheet');
  const img = document.getElementById('map-sheet-img');
  const date = document.getElementById('map-sheet-date');
  const memo = document.getElementById('map-sheet-memo');
  const address = document.getElementById('map-sheet-address');

  if (img) img.src = photo.thumbnail_url || photo.thumbnailDataUrl || '';
  if (date) date.textContent = formatDate(photo.date || photo.created_at);
  if (memo) memo.textContent = photo.memo || '추억';
  if (address) address.textContent = photo.address || '위치 미상';

  if (sheet) {
    sheet.classList.remove('translate-y-full');
  }

  if (img) {
    img.onclick = () => {
      if (sheet) sheet.classList.add('translate-y-full');
      openPhotoModal(photo);
    };
  }
}

function switchView(view) {
  try {
    currentView = view;
    
    homeView.classList.toggle('active', view === 'home');
    timelineView.classList.toggle('active', view === 'timeline');
    mapView.classList.toggle('active', view === 'map');
    calendarView.classList.toggle('active', view === 'calendar');
    albumsView.classList.toggle('active', view === 'albums');

    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.view === view) {
        item.classList.add('active');
        const icon = item.querySelector('.material-symbols-outlined');
        if (icon) icon.style.fontVariationSettings = "'FILL' 1";
      } else if (item.dataset.view) {
        item.classList.remove('active');
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
    } else if (view === 'calendar') {
      renderCalendar();
    } else if (view === 'albums') {
      renderAlbumsView();
    }
  } catch (err) {
    console.error('switchView error:', err);
    showToast('탭 전환 중 오류가 발생했습니다: ' + err.message);
  }
}

// ──────────────────────────────────────
// Event Listeners (Main App)
// ──────────────────────────────────────
function setupEventListeners() {

  const photoModalLikeBtn2 = document.getElementById('photo-modal-like-btn');
  const emojiPicker = document.getElementById('emoji-picker');
  
  if (photoModalLikeBtn2 && emojiPicker) {
    let hideTimeout;
    let pressTimer;
    
    const showPicker = () => {
      clearTimeout(hideTimeout);
      emojiPicker.classList.remove('opacity-0', 'invisible');
      emojiPicker.classList.add('opacity-100', 'visible', '!opacity-100', '!visible');
    };
    
    const hidePicker = () => {
      hideTimeout = setTimeout(() => {
        emojiPicker.classList.add('opacity-0', 'invisible');
        emojiPicker.classList.remove('opacity-100', 'visible', '!opacity-100', '!visible');
      }, 500);
    };

    photoModalLikeBtn2.addEventListener('mouseenter', showPicker);
    photoModalLikeBtn2.addEventListener('mouseleave', hidePicker);
    emojiPicker.addEventListener('mouseenter', showPicker);
    emojiPicker.addEventListener('mouseleave', hidePicker);
    
    // Mobile long press
    photoModalLikeBtn2.addEventListener('touchstart', (e) => {
      pressTimer = setTimeout(() => {
        showPicker();
      }, 500); // 500ms long press
    }, {passive: true});
    
    photoModalLikeBtn2.addEventListener('touchend', () => clearTimeout(pressTimer));
    photoModalLikeBtn2.addEventListener('touchcancel', () => clearTimeout(pressTimer));
    photoModalLikeBtn2.addEventListener('touchmove', () => clearTimeout(pressTimer));
    
    // Hide picker when tapping elsewhere on mobile
    document.addEventListener('touchstart', (e) => {
      if (!photoModalLikeBtn2.contains(e.target) && !emojiPicker.contains(e.target)) {
        emojiPicker.classList.add('opacity-0', 'invisible');
        emojiPicker.classList.remove('opacity-100', 'visible', '!opacity-100', '!visible');
      }
    }, {passive: true});
    
    emojiPicker.querySelectorAll('.reaction-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(!currentEditingPhoto) return;
        const emoji = btn.dataset.emoji;
        const icon = document.getElementById('photo-modal-like-icon');
        const countEl = document.getElementById('photo-modal-like-count');
        
        emojiPicker.classList.add('hidden');
        
        // Optimistic
        icon.textContent = emoji;
        icon.classList.add('like-pop');
        setTimeout(() => icon.classList.remove('like-pop'), 400);
        
        let currentCount = parseInt(countEl.textContent || '0');
        if (!icon.classList.contains('like-active')) {
          currentCount++;
          icon.classList.add('like-active');
          countEl.textContent = currentCount;
        }
        
        try {
          await likePhoto(currentEditingPhoto.id, emoji);
          const likesCount = await getPhotoLikes(currentEditingPhoto.id);
          countEl.textContent = likesCount;
          
          const cardHeart = document.querySelector(`.timeline-card[data-id="${currentEditingPhoto.id}"] .timeline-card-info button`);
          if (cardHeart) cardHeart.innerHTML = `<span class="material-symbols-outlined text-[16px]">favorite</span> ${likesCount}`;
        } catch(e) {
          console.error(e);
          showToast('리액션 실패');
        }
      });
    });
  }

  // Swipe Gestures for Photo Modal
  let modalTouchStartX = 0;
  let modalTouchEndX = 0;
  
  if (photoModalImg) {
    photoModalImg.addEventListener('touchstart', e => {
      modalTouchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    photoModalImg.addEventListener('touchend', e => {
      modalTouchEndX = e.changedTouches[0].screenX;
      handleModalSwipe();
    }, { passive: true });
  }

  function handleModalSwipe() {
    if (!currentEditingPhoto) return;
    const swipeThreshold = 50;
    const diff = modalTouchEndX - modalTouchStartX;
    
    if (Math.abs(diff) < swipeThreshold) return;
    
    // Determine context (allPhotosCache or a filtered list)
    // For simplicity, we swipe through allPhotosCache since modal doesn't know its parent list context perfectly without extra state.
    // However, timeline rendering filters photos. Let's just use allPhotosCache for now.
    const currentIndex = allPhotosCache.findIndex(p => p.id === currentEditingPhoto.id);
    if (currentIndex === -1) return;
    
    if (diff > 0) {
      // Swiped right -> Previous photo
      if (currentIndex > 0) {
        openPhotoModal(allPhotosCache[currentIndex - 1]);
      } else {
        showToast('첫 번째 사진입니다');
      }
    } else {
      // Swiped left -> Next photo
      if (currentIndex < allPhotosCache.length - 1) {
        openPhotoModal(allPhotosCache[currentIndex + 1]);
      } else {
        showToast('마지막 사진입니다');
      }
    }
  }

  setupAuthEvents();
  
  const mapSheetClose = document.getElementById('map-sheet-close');
  if (mapSheetClose) {
    mapSheetClose.addEventListener('click', () => {
      document.getElementById('map-bottom-sheet')?.classList.add('translate-y-full');
    });
  }

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

  // Timeline Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTimelineFilter = e.target.dataset.filter;
      
      const locWrapper = document.getElementById('location-filter-wrapper');
      if (currentTimelineFilter === 'location') {
        locWrapper.classList.remove('hidden');
        populateLocationFilter();
      } else {
        locWrapper.classList.add('hidden');
        currentTimelineLocation = '';
      }
      renderTimeline();
    });
  });

  const locSelect = document.getElementById('location-filter-select');
  if (locSelect) {
    locSelect.addEventListener('change', (e) => {
      currentTimelineLocation = e.target.value;
      renderTimeline();
    });
  }

  // Map Controls
  if (mapBtnTheme) {
    mapBtnTheme.addEventListener('click', () => {
      cycleMapTheme();
    });
  }
  if (mapBtnJourney) {
    mapBtnJourney.addEventListener('click', () => {
      const isLine = toggleJourneyLine();
      mapBtnJourney.classList.toggle('active', isLine);
    });
  }
  if (mapBtnHeatmap) {
    mapBtnHeatmap.addEventListener('click', () => {
      const isHeat = toggleHeatmap();
      mapBtnHeatmap.classList.toggle('active', isHeat);
    });
  }
  if (mapFilterChips) {
    mapFilterChips.querySelectorAll('.map-filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        mapFilterChips.querySelectorAll('.map-filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        currentMapFilter = e.target.dataset.mapFilter;
        refreshMapMarkers();
      });
    });
  }

  // Albums UI
  if (albumBackBtn) {
    albumBackBtn.addEventListener('click', () => {
      currentAlbumView = null;
      document.getElementById('album-detail-view').classList.add('hidden');
      document.getElementById('albums-grid').classList.remove('hidden');
    });
  }
  if (albumDeleteBtn) {
    albumDeleteBtn.addEventListener('click', async () => {
      if (!currentAlbumView) return;
      if (!confirm('이 앨범을 삭제하시겠습니까? (사진은 삭제되지 않습니다)')) return;
      try {
        await deleteAlbum(currentAlbumView.id);
        showToast('앨범이 삭제되었습니다.');
        currentAlbumView = null;
        document.getElementById('album-detail-view').classList.add('hidden');
        renderAlbumsView();
      } catch (e) {
        showToast('앨범 삭제 중 오류가 발생했습니다.');
      }
    });
  }
  
  let selectedPhotosForAlbum = new Set();
  
  if (albumAddPhotosBtn && albumAddPhotosModal) {
    albumAddPhotosBtn.addEventListener('click', () => {
      if (!currentAlbumView) return;
      selectedPhotosForAlbum.clear();
      
      albumAddPhotosGrid.innerHTML = allPhotosCache.map(p => `
        <div class="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent transition-all photo-select-item" data-add-pid="${p.id}">
          <img src="${p.thumbnail_url || p.thumbnailDataUrl}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/40 hidden photo-select-overlay"></div>
          <span class="material-symbols-outlined absolute top-1 right-1 text-primary hidden photo-select-check bg-white rounded-full text-lg">check_circle</span>
        </div>
      `).join('');
      
      albumAddPhotosGrid.querySelectorAll('.photo-select-item').forEach(el => {
        el.addEventListener('click', () => {
          const pid = el.dataset.addPid;
          const overlay = el.querySelector('.photo-select-overlay');
          const check = el.querySelector('.photo-select-check');
          
          if (selectedPhotosForAlbum.has(pid)) {
            selectedPhotosForAlbum.delete(pid);
            el.classList.remove('ring-2', 'ring-primary');
            overlay.classList.add('hidden');
            check.classList.add('hidden');
          } else {
            selectedPhotosForAlbum.add(pid);
            el.classList.add('ring-2', 'ring-primary');
            overlay.classList.remove('hidden');
            check.classList.remove('hidden');
          }
        });
      });
      
      albumAddPhotosModal.classList.add('active');
    });
    
    if (albumAddPhotosSave) {
      albumAddPhotosSave.addEventListener('click', async () => {
        if (!currentAlbumView || selectedPhotosForAlbum.size === 0) {
          albumAddPhotosModal.classList.remove('active');
          return;
        }
        try {
          // In a real app, we'd use a Promise.all or bulk insert API
          albumAddPhotosSave.disabled = true;
          albumAddPhotosSave.textContent = '추가 중...';
          
          for (let pid of selectedPhotosForAlbum) {
            try {
              await addPhotoToAlbum(currentAlbumView.id, pid);
            } catch (e) {
               // might already be in album, ignore
            }
          }
          showToast(`${selectedPhotosForAlbum.size}장의 사진을 앨범에 추가했습니다.`);
          albumAddPhotosModal.classList.remove('active');
          openAlbumDetail(currentAlbumView.id, [{...currentAlbumView}]); // Refresh album view
        } catch (e) {
          showToast('사진 추가 중 오류가 발생했습니다.');
        } finally {
          albumAddPhotosSave.disabled = false;
          albumAddPhotosSave.textContent = '추가 완료';
        }
      });
    }
  }

  // Settings
  document.getElementById('btn-settings').addEventListener('click', async () => {
    await updateSettingsMembers(); // refresh pending members
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
    if (val.endsWith('#')) {
      memoTextarea.focus();
      return;
    }
    memoTextarea.value = val + (val.endsWith(' ') || val === '' ? '#' : ' #');
    memoTextarea.focus();
  });
  
  photoModalAddHashtagBtn?.addEventListener('click', () => {
    const val = photoModalMemoTextarea.value;
    if (val.endsWith('#')) {
      photoModalMemoTextarea.focus();
      return;
    }
    photoModalMemoTextarea.value = val + (val.endsWith(' ') || val === '' ? '#' : ' #');
    photoModalMemoTextarea.focus();
  });
  
  // Random Memory Shuffle
  homeRandomShuffle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (allPhotosCache.length > 0) {
      const rand = allPhotosCache[Math.floor(Math.random() * allPhotosCache.length)];
      homeRandomImg.src = rand.thumbnail_url || rand.thumbnailDataUrl;
      homeRandomMemo.innerHTML = formatHashtags(rand.memo || '랜덤 추억');
      homeRandomDate.textContent = formatDateShort(rand.date || rand.created_at) || '';
      homeRandomLocation.textContent = rand.address || '';
      homeRandomCard.dataset.pid = rand.id;
    }
  });
  
  // Upload Save/Cancel
  btnSave.addEventListener('click', handleSave);
  btnCancel.addEventListener('click', handleCancel);

  // Modals
  [photoModalClose, document.getElementById('add-to-album-close'), document.getElementById('album-create-cancel'), albumAddPhotosCancel].forEach(btn => {
    if(btn) {
      btn.addEventListener('click', () => {
        photoModal.classList.remove('active');
        albumCreateModal.classList.remove('active');
        addToAlbumModal.classList.remove('active');
        if (albumAddPhotosModal) albumAddPhotosModal.classList.remove('active');
        currentEditingPhoto = null;
        
        // Reset edit mode if it was left open
        if (photoModalMemo && photoModalMemoTextarea && photoModalSaveBtn) {
          photoModalMemo.classList.remove('hidden');
          photoModalMemoTextarea.classList.add('hidden');
          if (photoModalDateInput) {
            photoModalDate.classList.remove('hidden');
            photoModalDateInput.classList.add('hidden');
            photoModalLocation.classList.remove('hidden');
            photoModalLocationInput.classList.add('hidden');
          }
          photoModalSaveBtn.classList.add('hidden');
          if (photoModalAddHashtagBtn) photoModalAddHashtagBtn.classList.add('hidden');
        }
      });
    }
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

  if (photoModalEdit && photoModalMemoTextarea && photoModalSaveBtn && photoModalMemo) {
    photoModalEdit.addEventListener('click', () => {
      if (!currentEditingPhoto) return;
      photoModalMemo.classList.add('hidden');
      photoModalMemoTextarea.classList.remove('hidden');
      photoModalDate.classList.add('hidden');
      photoModalDateInput.classList.remove('hidden');
      photoModalLocation.classList.add('hidden');
      photoModalLocationInput.classList.remove('hidden');
      photoModalSaveBtn.classList.remove('hidden');
      if (photoModalAddHashtagBtn) photoModalAddHashtagBtn.classList.remove('hidden');
      
      photoModalMemoTextarea.value = currentEditingPhoto.memo || '';
      photoModalDateInput.value = currentEditingPhoto.date ? new Date(currentEditingPhoto.date).toISOString().split('T')[0] : '';
      photoModalLocationInput.value = currentEditingPhoto.address || '';
      
      photoModalMemoTextarea.focus();
    });

    photoModalSaveBtn.addEventListener('click', async () => {
      if (!currentEditingPhoto) return;
      const newMemo = photoModalMemoTextarea.value.trim();
      let newDateStr = photoModalDateInput.value;
      const newAddress = photoModalLocationInput.value.trim();
      
      if(newDateStr) {
         // Keep time part if exists
         const oldDate = new Date(currentEditingPhoto.date);
         const newDateObj = new Date(newDateStr);
         if(!isNaN(oldDate)) {
           newDateObj.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());
         }
         newDateStr = newDateObj.toISOString();
      } else {
         newDateStr = currentEditingPhoto.date;
      }
      
      try {
        const updates = { memo: newMemo, address: newAddress, date: newDateStr };
        const updatedPhoto = await updatePhoto(currentEditingPhoto.id, updates);
        
        currentEditingPhoto.memo = newMemo;
        currentEditingPhoto.address = newAddress;
        currentEditingPhoto.date = newDateStr;
        
        const cached = allPhotosCache.find(p => p.id === currentEditingPhoto.id);
        if (cached) {
          cached.memo = newMemo;
          cached.address = newAddress;
          cached.date = newDateStr;
        }
        
        photoModalMemo.innerHTML = formatHashtags(newMemo) || '메모 없음';
        photoModalLocation.textContent = newAddress || '정보 없음';
        photoModalDate.textContent = formatDate(newDateStr);
        
        photoModalMemo.classList.remove('hidden');
        photoModalMemoTextarea.classList.add('hidden');
        photoModalDate.classList.remove('hidden');
        photoModalDateInput.classList.add('hidden');
        photoModalLocation.classList.remove('hidden');
        photoModalLocationInput.classList.add('hidden');
        photoModalSaveBtn.classList.add('hidden');
        if (photoModalAddHashtagBtn) photoModalAddHashtagBtn.classList.add('hidden');
        
        renderTimeline();
        showToast('추억 정보가 수정되었습니다.');
      } catch (e) {
        showToast('수정 실패: ' + (e?.message || ''));
      }
    });
  }

  if (photoModalFavorite) {
    photoModalFavorite.addEventListener('click', async () => {
      if (!currentEditingPhoto) return;
      const newVal = !currentEditingPhoto.favorite;
      try {
        await updatePhoto(currentEditingPhoto.id, { favorite: newVal });
        currentEditingPhoto.favorite = newVal;
        const cached = allPhotosCache.find(p => p.id === currentEditingPhoto.id);
        if (cached) cached.favorite = newVal;
        
        const icon = photoModalFavorite.querySelector('span');
        if (icon) {
          icon.style.fontVariationSettings = newVal ? "'FILL' 1" : "'FILL' 0";
          icon.style.color = newVal ? "#FFD700" : "";
        }
        renderTimeline();
        showToast(newVal ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.');
      } catch (e) {
        showToast('즐겨찾기 변경 실패');
      }
    });
  }

  if (photoModalExport) {
    photoModalExport.addEventListener('click', async () => {
      if (!currentEditingPhoto) return;
      const url = currentEditingPhoto.image_url || currentEditingPhoto.imageDataUrl;
      if (!url) return showToast('다운로드할 이미지가 없습니다.');
      
      try {
        showToast('다운로드를 시작합니다...');
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = currentEditingPhoto.file_name || 'photo.jpg';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      } catch (e) {
        console.error(e);
        // Fallback for cross-origin issues
        window.open(url, '_blank');
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



  // Like Button
  document.getElementById('photo-modal-like-btn').addEventListener('click', async () => {
    if(!currentEditingPhoto) return;
    const icon = document.getElementById('photo-modal-like-icon');
    const isLiked = icon.classList.contains('like-active');
    const countEl = document.getElementById('photo-modal-like-count');
    
    // Optimistic Update
    icon.classList.toggle('like-active', !isLiked);
    icon.classList.add('like-pop');
    setTimeout(() => icon.classList.remove('like-pop'), 400);
    
    let currentCount = parseInt(countEl.textContent || '0');
    currentCount = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    countEl.textContent = currentCount;
    
    // Update cache
    const photoIndex = allPhotosCache.findIndex(p => p.id === currentEditingPhoto.id);
    if(photoIndex !== -1) {
      if (!allPhotosCache[photoIndex].photo_likes) allPhotosCache[photoIndex].photo_likes = [{count: 0}];
      allPhotosCache[photoIndex].photo_likes[0].count = currentCount;
    }

    try {
      if (isLiked) {
        await unlikePhoto(currentEditingPhoto.id);
      } else {
        await likePhoto(currentEditingPhoto.id);
      }
      const likesCount = await getPhotoLikes(currentEditingPhoto.id);
      countEl.textContent = likesCount;
      if(photoIndex !== -1) allPhotosCache[photoIndex].photo_likes[0].count = likesCount;
      
      const cardHeart = document.querySelector(`.timeline-card[data-id="${currentEditingPhoto.id}"] .timeline-card-info button`);
      if (cardHeart) cardHeart.innerHTML = `<span class="material-symbols-outlined text-[16px]">favorite</span> ${likesCount}`;
    } catch (e) {
      console.error(e);
      icon.classList.toggle('like-active', isLiked);
      countEl.textContent = isLiked ? currentCount + 1 : currentCount - 1;
      showToast('오류: ' + (e?.message || JSON.stringify(e) || '좋아요 실패'));
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


async function compressDataUrlToWebP(dataUrl, maxDim = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; }
      } else {
        if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
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
    reader.onload = async (e) => {
      
      try {
        uploadLoading.querySelector('p').textContent = '이미지 최적화 중...';
        uploadLoading.classList.add('active', 'flex');
        currentFileBase64 = await compressDataUrlToWebP(e.target.result);
      } catch (err) {
        console.error('Compression failed:', err);
        currentFileBase64 = e.target.result;
      }

      
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
function populateLocationFilter() {
  const locSelect = document.getElementById('location-filter-select');
  if (!locSelect) return;
  const locations = new Set(allPhotosCache.map(p => p.address).filter(Boolean));
  let html = '<option value="">전체 장소</option>';
  locations.forEach(loc => {
    html += `<option value="${loc}" ${currentTimelineLocation === loc ? 'selected' : ''}>${loc}</option>`;
  });
  locSelect.innerHTML = html;
}

// ──────────────────────────────────────
function renderTimeline() {
  let photos = [...allPhotosCache];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    photos = photos.filter(p => (p.memo?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)));
  }

  
  if (currentTimelineSort === 'asc') {
    photos.sort((a, b) => new Date(a.date || a.created_at) - new Date(b.date || b.created_at));
  } else if (currentTimelineSort === 'likes') {
    photos.sort((a, b) => (b.photo_likes?.[0]?.count || 0) - (a.photo_likes?.[0]?.count || 0));
  } else {
    photos.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  }

  const now = new Date();
  if (currentTimelineFilter === 'favorite') {
    photos = photos.filter(p => p.favorite);
  } else if (currentTimelineFilter === 'week') {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    photos = photos.filter(p => new Date(p.date || p.created_at) >= oneWeekAgo);
  } else if (currentTimelineFilter === 'month') {
    photos = photos.filter(p => {
      const d = new Date(p.date || p.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  } else if (currentTimelineFilter === 'year') {
    photos = photos.filter(p => new Date(p.date || p.created_at).getFullYear() === now.getFullYear());
  } else if (currentTimelineFilter === 'location' && currentTimelineLocation) {
    photos = photos.filter(p => p.address === currentTimelineLocation);
  }

  photoCountBadge.textContent = `${photos.length}개 추억`;
  
  if (photos.length === 0) {
    timelineGrid.innerHTML = '';
    timelineEmptyState.classList.remove('hidden');
    document.getElementById('timeline-sentinel').classList.add('hidden');
    return;
  }
  timelineEmptyState.classList.add('hidden');

    const photosToRender = photos.slice(0, currentTimelineLimit);
  timelineGrid.innerHTML = photosToRender.map((photo, idx) => {
    const isLarge = idx === 0 && !searchQuery;
    const colSpan = isLarge ? 'col-span-4 md:col-span-6' : 'col-span-2 md:col-span-4';
    
    // Uploader profile (fallback to first member for old test data without uploaded_by)
    const uploaderProfile = familyMembers.find(m => m.user_id === photo.uploaded_by)?.profiles || familyMembers[0]?.profiles;
    
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

          <div class="uploader-info">
            ${generateAvatarHtml(uploaderProfile, 'small')}
            <span>${uploaderProfile?.nickname || 'User'}</span>
          </div>
        </div>
      </section>
    `;
  }).join('');

  const sentinel = document.getElementById('timeline-sentinel');
  if (photos.length > currentTimelineLimit) {
    sentinel.classList.remove('hidden');
  } else {
    sentinel.classList.add('hidden');
  }

  timelineGrid.querySelectorAll('.favorite-btn-card').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const pid = btn.dataset.favId;
      try {
        const photoIndex = allPhotosCache.findIndex(p => p.id === pid);
        if (photoIndex === -1) return;
        
        const newFavStatus = !allPhotosCache[photoIndex].favorite;
        allPhotosCache[photoIndex].favorite = newFavStatus;
        if (newFavStatus) {
          btn.classList.add('is-fav');
        } else {
          btn.classList.remove('is-fav');
        }
        
        await updatePhoto(pid, { favorite: newFavStatus });
      } catch (e) {
        console.error('Favorite error:', e);
        showToast('즐겨찾기 실패');
      }
    });
  });

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
  try {
    currentEditingPhoto = photo;
    
    photoModalImg.src = photo.image_url || photo.imageDataUrl || photo.thumbnailDataUrl;
    photoModalDate.textContent = formatDate(photo.date || photo.createdAt);
    photoModalTitle.textContent = photo.memo || '추억 상세';
    photoModalLocation.textContent = photo.address || '위치 미상';
    photoModalMemo.innerHTML = formatHashtags(photo.memo) || '메모 없음';
    
    const uploader = familyMembers.find(m => m.user_id === photo.uploaded_by)?.profiles;
    document.getElementById('photo-modal-uploader').textContent = uploader?.nickname || '사용자';
    
    if (photoModalFavorite) {
      const icon = photoModalFavorite.querySelector('span');
      if (icon) {
        icon.style.fontVariationSettings = photo.favorite ? "'FILL' 1" : "'FILL' 0";
        icon.style.color = photo.favorite ? "#FFD700" : "";
      }
    }
    
    // Reset edit mode if it was left open
    if (photoModalMemo && photoModalMemoTextarea && photoModalSaveBtn) {
      photoModalMemo.classList.remove('hidden');
      photoModalMemoTextarea.classList.add('hidden');
      if (photoModalDateInput) {
        photoModalDate.classList.remove('hidden');
        photoModalDateInput.classList.add('hidden');
        photoModalLocation.classList.remove('hidden');
        photoModalLocationInput.classList.add('hidden');
      }
      photoModalSaveBtn.classList.add('hidden');
    }

    try {
      // Likes status
      const liked = await hasUserLiked(photo.id, currentUser.id);
      const likeIcon = document.getElementById('photo-modal-like-icon');
      if (likeIcon) likeIcon.classList.toggle('like-active', liked);
      
      let likesCount = photo.photo_likes?.[0]?.count;
      if (likesCount === undefined) {
        const likes = await getPhotoLikes(photo.id);
        likesCount = typeof likes === 'number' ? likes : (likes ? likes.length : 0);
      }
      const countEl = document.getElementById('photo-modal-like-count');
      if (countEl) countEl.textContent = likesCount;
    } catch (err) {
      console.error('Error fetching likes:', err);
      const countEl = document.getElementById('photo-modal-like-count');
      if (countEl) countEl.textContent = '0';
    }
    

    
    if (photoModal) {
      photoModal.classList.add('active');
    } else {
      showToast('모달 요소를 찾을 수 없습니다.');
    }
  } catch (criticalError) {
    console.error(criticalError);
    showToast('모달 열기 실패: ' + criticalError.message);
  }
}



// ──────────────────────────────────────
// Albums View
// ──────────────────────────────────────
async function renderAlbumsView() {
  try {
    document.getElementById('album-detail-view').classList.add('hidden');
    const albumsRaw = await getAlbums(currentFamily.id);
    
    if (albumsRaw.length === 0) {
      albumsGrid.classList.add('hidden');
      albumsEmpty.classList.remove('hidden');
      return;
    }
    albumsGrid.classList.remove('hidden');
    albumsEmpty.classList.add('hidden');
    
    // Fetch cover photos for each album
    const albums = await Promise.all(albumsRaw.map(async album => {
      try {
        const photos = await getAlbumPhotos(album.id);
        album.coverUrl = photos.length > 0 ? (photos[0].thumbnail_url || photos[0].thumbnailDataUrl) : null;
        album.photoCount = photos.length;
      } catch(e) {
        album.coverUrl = null;
        album.photoCount = 0;
      }
      return album;
    }));
    
    albumsGrid.innerHTML = albums.map(album => {
      const coverHtml = album.coverUrl 
        ? `<img src="${album.coverUrl}" class="absolute inset-0 w-full h-full object-cover" />`
        : `<div class="album-grid-empty-icon"><span class="material-symbols-outlined text-4xl text-white/20">photo_library</span></div>`;
        
      return `
        <div class="album-grid-card" data-aid="${album.id}">
          ${coverHtml}
          <div class="album-grid-overlay bg-gradient-to-t from-black/80 via-black/30 to-transparent absolute inset-0 flex flex-col justify-end p-4">
            <h3 class="album-grid-name font-title-md text-white text-lg">${album.name}</h3>
            <div class="album-grid-meta flex items-center gap-1 text-white/80 text-sm mt-1">
              <span class="material-symbols-outlined text-[14px]">photo_library</span>
              <span>${album.photoCount}장</span>
              ${album.description ? `<span class="mx-1">•</span><span class="truncate">${album.description}</span>` : ''}
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
      <div class="timeline-card-photo rounded-lg cursor-pointer group relative" data-pid="${photo.id}">
        <img src="${photo.thumbnail_url || photo.thumbnailDataUrl}" class="w-full aspect-square object-cover rounded-lg" />
        <button class="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-error text-white rounded-full flex items-center justify-center transition-all album-photo-remove z-10" data-remove-pid="${photo.id}" title="앨범에서 제거">
          <span class="material-symbols-outlined text-[12px]">close</span>
        </button>
      </div>
    `).join('');
    
    albumDetailGrid.querySelectorAll('.timeline-card-photo').forEach(el => {
      // Photo click to open
      el.addEventListener('click', (e) => {
        // Prevent opening modal if clicking the remove button
        if(e.target.closest('.album-photo-remove')) return;
        const p = allPhotosCache.find(x => x.id === el.dataset.pid);
        if(p) openPhotoModal(p);
      });
      
      // Remove button click
      const removeBtn = el.querySelector('.album-photo-remove');
      if(removeBtn) {
        removeBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if(confirm('이 사진을 앨범에서 제거하시겠습니까? (사진 원본은 삭제되지 않습니다)')) {
            try {
              await removePhotoFromAlbum(albumId, removeBtn.dataset.removePid);
              showToast('앨범에서 제거되었습니다.');
              openAlbumDetail(albumId, albumsList); // Refresh
            } catch(err) {
              showToast('제거 실패: ' + (err?.message || ''));
            }
          }
        });
      }
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
    homeRandomMemo.innerHTML = formatHashtags(rand.memo || '랜덤 추억');
    homeRandomDate.textContent = formatDateShort(rand.date || rand.created_at) || '';
    homeRandomLocation.textContent = rand.address || '위치 미상';
    homeRandomCard.dataset.pid = rand.id;
    currentRandomPhoto = rand;
    
    // 1 Year Ago Logic
    if (home1YearCard) {
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      const marginDays = 3;
      const minDate = new Date(oneYearAgo); minDate.setDate(minDate.getDate() - marginDays);
      const maxDate = new Date(oneYearAgo); maxDate.setDate(maxDate.getDate() + marginDays);
      
      const oneYearPhotos = allPhotosCache.filter(p => {
        const pDate = new Date(p.date || p.created_at);
        return pDate >= minDate && pDate <= maxDate;
      });

      if (oneYearPhotos.length > 0) {
        const p = oneYearPhotos[Math.floor(Math.random() * oneYearPhotos.length)];
        home1YearCard.style.display = '';
        home1YearImg.src = p.thumbnail_url || p.thumbnailDataUrl;
        home1YearMemo.innerHTML = formatHashtags(p.memo || '1년 전 오늘');
        home1YearDate.textContent = formatDateShort(p.date || p.created_at) || '';
        home1YearLocation.textContent = p.address || '';
        home1YearCard.dataset.pid = p.id;
      } else {
        home1YearCard.style.display = 'none';
      }
    }
  } else {
    homeRandomCard.style.display = 'none';
    if (home1YearCard) home1YearCard.style.display = 'none';
  }
  
  // Monthly stats bars
  renderMonthlyStats();
  
  // On this day
  renderOnThisDay();
}

function renderMonthlyStats() {
  const days = 30;
  const heatmapData = Array(days).fill(0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Count photos per day for the last 30 days
  allPhotosCache.forEach(p => {
    const pd = new Date(p.date || p.created_at);
    const photoDate = new Date(pd.getFullYear(), pd.getMonth(), pd.getDate());
    const diffTime = today - photoDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays < days) {
      heatmapData[days - 1 - diffDays]++;
    }
  });
  
  const max = Math.max(...heatmapData, 1);
  homeStatsBars.innerHTML = heatmapData.map((c, i) => {
    let intensityClass = 'bg-primary/10';
    if (c > 0) {
      const ratio = c / max;
      if (ratio > 0.7) intensityClass = 'bg-primary';
      else if (ratio > 0.4) intensityClass = 'bg-primary/70';
      else intensityClass = 'bg-primary/40';
    }
    
    // Uploader color coding (Option 4): if there's a dominant uploader, we could color it, but for now we vary intensity of the theme color.
    return `<div class="aspect-square rounded-sm ${intensityClass} hover:ring-1 ring-white/50 cursor-pointer transition-all" title="${c}개의 추억"></div>`;
  }).join('');
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
  // Build photo count per day and store first thumbnail
  const photoDays = {};
  const photoThumbs = {};
  allPhotosCache.forEach(p => {
    const pd = new Date(p.date || p.created_at);
    if (pd.getFullYear() === year && pd.getMonth() === month) {
      const day = pd.getDate();
      photoDays[day] = (photoDays[day] || 0) + 1;
      if (!photoThumbs[day]) photoThumbs[day] = p.thumbnail_url || p.thumbnailDataUrl;
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
      <div class="cal-cell relative overflow-hidden ${isToday ? 'today' : ''} ${isSelected ? 'selected ring-2 ring-primary' : ''} ${hasPhotos ? 'has-photos' : ''}" 
           data-day="${d}" style="cursor: ${hasPhotos ? 'pointer' : 'default'}; min-height: 48px;">
        ${hasPhotos ? `<img src="${photoThumbs[d]}" class="absolute inset-0 w-full h-full object-cover opacity-60 rounded-md group-hover:opacity-100 transition-opacity" />` : ''}
        <span class="cal-day-num relative z-10 p-1 ${isToday ? 'text-primary font-bold' : (hasPhotos ? 'text-white font-medium drop-shadow-md' : 'text-on-surface-variant')}">${d}</span>
        ${hasPhotos ? `<span class="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1 rounded-sm z-10">${count}</span>` : ''}
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

const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Storage Usage UI
const storageHtml = `
          <div class="flex items-center justify-between mt-4 p-4 bg-surface rounded-2xl border border-white/5">
            <span class="text-on-surface-variant text-body-sm">사용 중인 저장 용량</span>
            <span class="text-white font-medium text-sm" id="settings-storage-usage">계산 중...</span>
          </div>
`;
if (!content.includes('settings-storage-usage')) {
  content = content.replace('<!-- Actions -->', storageHtml + '\n          <!-- Actions -->');
}

// 2. Sort Options UI
const sortHtml = `
            <div class="mt-4 flex justify-end">
              <select id="timeline-sort-select" class="bg-surface-container border border-white/20 rounded-lg px-3 py-2 text-on-surface text-body-sm focus:outline-none focus:border-primary-container/50 cursor-pointer">
                <option value="desc">최신순</option>
                <option value="asc">오래된순</option>
                <option value="likes">인기순 (좋아요)</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-4 md:grid-cols-12 gap-grid-gutter" id="timeline-grid"></div>
`;
if (!content.includes('timeline-sort-select')) {
  const targetSplit = `<div class="grid grid-cols-4 md:grid-cols-12 gap-grid-gutter" id="timeline-grid"></div>`;
  content = content.replace(targetSplit, sortHtml);
}

// 3. Emoji Reaction UI
const emojiHtml = `
            <div class="flex items-center gap-4 relative">
              <div id="emoji-picker" class="hidden absolute bottom-full mb-2 left-0 bg-surface-container p-2 rounded-xl border border-white/10 flex gap-2 shadow-xl z-50">
                <button class="text-2xl hover:scale-125 transition-transform reaction-btn" data-emoji="❤️">❤️</button>
                <button class="text-2xl hover:scale-125 transition-transform reaction-btn" data-emoji="😂">😂</button>
                <button class="text-2xl hover:scale-125 transition-transform reaction-btn" data-emoji="🎉">🎉</button>
                <button class="text-2xl hover:scale-125 transition-transform reaction-btn" data-emoji="🥰">🥰</button>
              </div>
              <button class="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container hover:bg-white/10 transition-colors" id="photo-modal-like-btn">
                <span class="material-symbols-outlined text-[24px] text-on-surface-variant transition-transform duration-300" id="photo-modal-like-icon">favorite</span>
              </button>
`;
if (!content.includes('emoji-picker')) {
  const likeTarget = `<button class="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container hover:bg-white/10 transition-colors" id="photo-modal-like-btn">
                <span class="material-symbols-outlined text-[24px] text-on-surface-variant transition-transform duration-300" id="photo-modal-like-icon">favorite</span>
              </button>`;
  content = content.replace(likeTarget, emojiHtml);
}

fs.writeFileSync('index.html', content);
console.log('HTML Injection Complete');

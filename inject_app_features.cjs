const fs = require('fs');
let content = fs.readFileSync('src/app.js', 'utf8');

if(!content.includes("let currentTimelineSort = 'desc';")) {
  content = content.replace("let currentTimelineFilter = 'all';", "let currentTimelineFilter = 'all';\nlet currentTimelineSort = 'desc';");
}

const sortListener = `
  const sortSelect = document.getElementById('timeline-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentTimelineSort = e.target.value;
      renderTimeline();
    });
  }
`;
if(!content.includes("timeline-sort-select")) {
  content = content.replace("if (filterSelect) {", sortListener + "\n  if (filterSelect) {");
}

const sortLogic = `
  if (currentTimelineSort === 'asc') {
    photos.sort((a, b) => new Date(a.date || a.created_at) - new Date(b.date || b.created_at));
  } else if (currentTimelineSort === 'likes') {
    photos.sort((a, b) => (b.photo_likes?.[0]?.count || 0) - (a.photo_likes?.[0]?.count || 0));
  } else {
    photos.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  }
`;
if(!content.includes("currentTimelineSort === 'asc'")) {
  content = content.replace("const now = new Date();", sortLogic + "\n  const now = new Date();");
}

const storageLogic = `
  const storageUsageEl = document.getElementById('settings-storage-usage');
  if (storageUsageEl) {
    try {
      const { data, error } = await supabase.storage.from('family-photos').list(currentFamily.id);
      if (!error && data) {
        const totalBytes = data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
        const mb = (totalBytes / (1024 * 1024)).toFixed(1);
        storageUsageEl.textContent = \`\${mb} MB\`;
      } else {
        storageUsageEl.textContent = '알 수 없음';
      }
    } catch(e) {
      storageUsageEl.textContent = '오류';
    }
  }
`;
if(!content.includes("settings-storage-usage")) {
  content = content.replace("settingsMembersList.innerHTML =", storageLogic + "\n  settingsMembersList.innerHTML =");
}

const emojiLogic = `
  const photoModalLikeBtn2 = document.getElementById('photo-modal-like-btn');
  const emojiPicker = document.getElementById('emoji-picker');
  
  if (photoModalLikeBtn2 && emojiPicker) {
    let hideTimeout;
    photoModalLikeBtn2.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
      emojiPicker.classList.remove('hidden');
    });
    photoModalLikeBtn2.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => emojiPicker.classList.add('hidden'), 500);
    });
    emojiPicker.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    emojiPicker.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => emojiPicker.classList.add('hidden'), 500);
    });
    
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
          
          const cardHeart = document.querySelector(\`.timeline-card[data-id="\${currentEditingPhoto.id}"] .timeline-card-info button\`);
          if (cardHeart) cardHeart.innerHTML = \`<span class="material-symbols-outlined text-[16px]">favorite</span> \${likesCount}\`;
        } catch(e) {
          console.error(e);
          showToast('리액션 실패');
        }
      });
    });
  }
`;
if(!content.includes("emojiPicker.classList.remove")) {
  content = content.replace("function setupEventListeners() {", "function setupEventListeners() {\n" + emojiLogic);
}

fs.writeFileSync('src/app.js', content);
console.log('App logic injection complete');

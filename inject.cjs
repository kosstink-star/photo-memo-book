const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Add QR script
const scriptTag = '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>';
if (!content.includes(scriptTag)) {
  content = content.replace('</head>', `  ${scriptTag}\n</head>`);
}

// Add QR container
const oldStr = '<span class="text-primary font-mono text-sm tracking-[0.2em]" id="settings-invite-code">?</span>';
const newStr = `<span class="text-primary font-mono text-sm tracking-[0.2em]" id="settings-invite-code">?</span>
              <button class="w-8 h-8 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center" id="settings-copy-code" title="코드 복사">
                <span class="material-symbols-outlined text-on-surface-variant text-sm">content_copy</span>
              </button>
            </div>
          </div>
          <div class="flex flex-col items-center justify-center mt-6 p-4 bg-surface rounded-2xl border border-white/5">
            <div id="qrcode-container" class="p-2 bg-white rounded-xl mb-3"></div>
            <p class="text-on-surface-variant text-body-sm text-center">가족들을 초대하려면<br/>위 QR코드를 스캔하게 하세요</p>
          </div>
          <div class="hidden">
            <div>
              <span>`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('index.html', content);
console.log('Injection successful');

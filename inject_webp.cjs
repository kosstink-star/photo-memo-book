const fs = require('fs');
let content = fs.readFileSync('src/app.js', 'utf8');

const compressionFunc = `
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
`;

if(!content.includes('compressDataUrlToWebP')) {
  content = content.replace('async function processSingleFile', compressionFunc + '\nasync function processSingleFile');
}

const singleFileCompression = `
      try {
        uploadLoading.querySelector('p').textContent = '이미지 최적화 중...';
        uploadLoading.classList.add('active', 'flex');
        currentFileBase64 = await compressDataUrlToWebP(e.target.result);
      } catch (err) {
        console.error('Compression failed:', err);
        currentFileBase64 = e.target.result;
      }
`;

if (!content.includes('compressDataUrlToWebP(e.target.result)')) {
  content = content.replace("currentFileBase64 = e.target.result;", singleFileCompression);
}

fs.writeFileSync('src/app.js', content);
console.log('WebP compression injected');

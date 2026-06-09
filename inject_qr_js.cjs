const fs = require('fs');
let content = fs.readFileSync('src/app.js', 'utf8');

const qrLogic = `
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
`;

const oldStr = "const pendingList = document.getElementById('settings-pending-list');";

if (!content.includes('new QRCode(')) {
  content = content.replace(oldStr, oldStr + "\n" + qrLogic);
  fs.writeFileSync('src/app.js', content);
  console.log('app.js injection successful');
} else {
  console.log('already injected');
}

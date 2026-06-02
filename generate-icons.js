import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputFile = '아이콘.jpeg';
const outDir = 'public';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

async function generateIcons() {
  try {
    const img = sharp(inputFile);
    
    // Generate 192x192 (PWA)
    await img.resize(192, 192).toFile(path.join(outDir, 'icon-192x192.png'));
    
    // Generate 512x512 (PWA)
    await img.resize(512, 512).toFile(path.join(outDir, 'icon-512x512.png'));
    
    // Generate 180x180 (Apple Touch Icon)
    await img.resize(180, 180).toFile(path.join(outDir, 'apple-touch-icon.png'));
    
    // Generate 32x32 (Favicon)
    await img.resize(32, 32).toFile(path.join(outDir, 'favicon.png'));
    
    // Generate a maskable icon (often with some padding, but we'll just resize)
    await img.resize(512, 512).toFile(path.join(outDir, 'maskable-icon-512x512.png'));
    
    console.log('Icons generated successfully.');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();

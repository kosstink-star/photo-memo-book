import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Memoirs - 추억 기록',
        short_name: 'Memoirs',
        description: '사진의 EXIF 데이터를 브라우저에서 안전하게 추출하고 추억을 기록하세요.',
        theme_color: '#191f31',
        background_color: '#0d1117',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5000000 // 5MB
      }
    })
  ],
  // GitHub Pages 배포 시 하위 경로 설정
  base: '/photo-memo-book/',
  build: {
    // 소스맵 비활성화 (배포 시 원본 코드 노출 방지)
    sourcemap: false,
    // 빌드 출력 디렉토리
    outDir: 'dist',
  },
});

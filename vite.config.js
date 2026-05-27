import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
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

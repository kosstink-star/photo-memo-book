import { build } from 'vite';

async function testBuild() {
  try {
    await build({
      build: {
        minify: false,
        rollupOptions: {
          input: './src/map.js',
          output: {
            format: 'iife',
            name: 'MapApp'
          }
        }
      }
    });
    console.log("Build successful");
  } catch (err) {
    console.error("Build failed", err);
  }
}

testBuild();

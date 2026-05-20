import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    lib: {
      entry: 'src/messagePanel/index.js',
      formats: ['es'],
      fileName: () => 'messagePanel.js',
      cssFileName: 'messagePanel',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'messagePanel.css';
          return '[name][extname]';
        },
      },
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { articleMetaPlugin, searchIndexPlugin } from './build/vite-plugins.js';

// 文章元数据（virtual:article-meta）与搜索索引（virtual:search-index）
// 都在构建期由 @see build/article-data.js 扫描 src/articles/*.md 生成，
// 见 build/vite-plugins.js。
export default defineConfig({
  plugins: [react(), articleMetaPlugin(), searchIndexPlugin()],
  base: '/',
});

// Vite 插件：把「文章元数据」和「搜索索引」作为虚拟模块注入。
//
// - virtual:article-meta  —— 列表页需要的轻量元数据（无正文）；
// - virtual:search-index  —— 搜索页需要的纯文本索引（正文已剥离 Markdown）。
//
// 两者都在构建期由 build/article-data.js 扫描 src/articles/*.md 生成；
// dev 模式下文章新增 / 修改 / 删除会同时失效两个虚拟模块并刷新页面。

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectArticleMeta, buildSearchDocs } from './article-data.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_ARTICLES_DIR = path.resolve(currentDir, '../src/articles');

const VIRTUAL_META = 'virtual:article-meta';
const VIRTUAL_SEARCH = 'virtual:search-index';
const RESOLVED_IDS = [VIRTUAL_META, VIRTUAL_SEARCH].map((id) => `\0${id}`);

// 虚拟模块源码：JSON 数据直接作为 JS 字面量导出
const toModuleSource = (data) => `const data = ${JSON.stringify(data)};\nexport default data;\n`;

// 同一个 dev server 只注册一次文件监听（两个虚拟模块共用）
const watcherRegistry = new WeakSet();

const registerArticleWatcher = (server, articlesDir) => {
  if (watcherRegistry.has(server)) return;
  watcherRegistry.add(server);

  const normalizedDir = path.resolve(articlesDir);

  const refresh = (file) => {
    const absolute = path.resolve(file);
    if (path.dirname(absolute) !== normalizedDir || !absolute.endsWith('.md')) return;

    let invalidated = false;
    for (const id of RESOLVED_IDS) {
      const mod = server.moduleGraph.getModuleById(id);
      if (mod) {
        server.moduleGraph.invalidateModule(mod);
        invalidated = true;
      }
    }
    // 搜索索引被页面缓存持有，模块失效后整页刷新最稳妥
    if (invalidated) server.ws.send({ type: 'full-reload' });
  };

  // 注意：Vite 的 watcher 开启了 disableGlobbing，传 "*.md" 这样的 glob
  // 会被当成字面路径而完全收不到事件，必须直接监听文章目录本身。
  server.watcher.add(normalizedDir);
  for (const event of ['add', 'change', 'unlink']) {
    server.watcher.on(event, refresh);
  }
};

const createVirtualPlugin = ({ name, virtualId, buildPayload, articlesDir }) => ({
  name,
  resolveId(id) {
    if (id === virtualId) return `\0${virtualId}`;
    return null;
  },
  load(id) {
    if (id === `\0${virtualId}`) {
      return toModuleSource(buildPayload(articlesDir));
    }
    return null;
  },
  configureServer(server) {
    registerArticleWatcher(server, articlesDir);
  },
});

export const articleMetaPlugin = ({ articlesDir = DEFAULT_ARTICLES_DIR } = {}) =>
  createVirtualPlugin({
    name: 'article-meta',
    virtualId: VIRTUAL_META,
    buildPayload: collectArticleMeta,
    articlesDir,
  });

export const searchIndexPlugin = ({ articlesDir = DEFAULT_ARTICLES_DIR } = {}) =>
  createVirtualPlugin({
    name: 'article-search-index',
    virtualId: VIRTUAL_SEARCH,
    buildPayload: (dir) => {
      const docs = buildSearchDocs(dir);
      return {
        // 生成时间便于排查「页面里是不是旧索引」
        generatedAt: new Date().toISOString(),
        count: docs.length,
        docs,
      };
    },
    articlesDir,
  });

export const articlePlugins = (options = {}) => [
  articleMetaPlugin(options),
  searchIndexPlugin(options),
];

export default articlePlugins;

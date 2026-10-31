// 搜索索引的运行时入口。
//
// 索引由构建期插件生成（virtual:search-index），包含每篇文章的纯文本、
// 章节偏移等信息。这里把它：
//   1. 按需加载：只有访客真正输入关键词时才下载索引，首屏不受影响；
//   2. 只预处理一次：小写化等准备工作在索引就绪时完成，后续每次输入直接复用；
//   3. 统一对外暴露 searchArticles / getPopularTags。

import { prepareIndex, searchIndex } from './searchCore';

let indexPromise = null;
let preparedIndex = null;

/**
 * 加载并预处理全站搜索索引（多次调用只加载一次）。
 * @returns {Promise<Array<object>>}
 */
export const loadSearchIndex = () => {
  if (!indexPromise) {
    indexPromise = import('virtual:search-index')
      .then((module) => {
        const payload = module.default || {};
        preparedIndex = prepareIndex(payload.docs || []);
        return preparedIndex;
      })
      .catch((error) => {
        // 失败时允许下次重试（例如网络抖动导致的 chunk 加载失败）
        indexPromise = null;
        preparedIndex = null;
        throw error;
      });
  }
  return indexPromise;
};

export const isSearchIndexReady = () => preparedIndex !== null;

/**
 * 搜索文章。
 *
 * @param {string} query 访客输入的关键词（空格分隔 = 同时包含，英文引号包裹 = 精确短语）
 * @param {object} [options] { maxResults, snippetsPerDoc, contextChars }
 * @returns {Promise<{
 *   query: string,
 *   terms: string[],
 *   mode: 'all' | 'any',
 *   results: Array<object>,
 *   totalMatches: number,
 *   candidateCount: number
 * }>} results 中每篇文章都带有标题/摘要高亮分段与上下文预览片段
 */
export const searchArticles = async (query, options) => {
  const index = await loadSearchIndex();
  return searchIndex(index, query, options);
};

/**
 * 取出现次数最多的标签，用于搜索页的「试试这些关键词」提示。
 */
export const getPopularTags = async (limit = 8) => {
  const index = await loadSearchIndex();
  const counts = new Map();

  for (const doc of index) {
    for (const tag of doc.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
};

export default searchArticles;

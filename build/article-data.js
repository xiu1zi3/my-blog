// 构建期文章数据采集（Node 侧）。
//
// 只在这里读取 src/articles/*.md，产出两份数据：
//   1. 文章元数据（标题 / 日期 / 分类 / 标签 / 摘要 / 字数）—— 列表页、分类页、标签页用；
//   2. 搜索文档（纯文本正文 + 标题偏移 + 代码块区间）—— /search 页用。
//
// 两份数据都由 Vite 虚拟模块在构建期注入，正文仍然是按文章懒加载的独立 chunk。

import fs from 'node:fs';
import path from 'node:path';
import { markdownToSearchText } from '../src/utils/markdownText.js';

const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const FRONT_MATTER_ANY_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

// 宽松解析 [a, b, c] 形式的数组（兼容不带引号的中文元素）
export const parseArrayValue = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim())
      .map((item) => {
        if (
          (item.startsWith('"') && item.endsWith('"')) ||
          (item.startsWith("'") && item.endsWith("'"))
        ) {
          return item.slice(1, -1);
        }
        return item;
      });
  }
};

// 与客户端 search 展示保持一致的宽松 front matter 解析，
// 不依赖严格 YAML，兼容 title:📚xxx、无引号中文数组等写法
export const parseFrontMatter = (raw) => {
  const match = FRONT_MATTER_RE.exec(raw);
  if (!match) return {};

  const data = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const pair = /^(\w+):\s*(.+)$/.exec(line);
    if (!pair) return;

    const key = pair[1];
    let value = pair[2];

    if (value.startsWith('[')) {
      value = parseArrayValue(value);
    }

    data[key] = value;
  });

  return data;
};

// 统计正文「字数」：中文字符按 1 计，英文按单词计。
// 该数值用于文章页展示字数 & 阅读时长，以及首页的字数里程碑。
export const countWords = (content) => {
  const text = content
    // 围栏代码块
    .replace(/(^|\n)(```|~~~)[\s\S]*?(```|~~~)(?=\n|$)/g, '\n')
    // 行内代码
    .replace(/`[^`]*`/g, ' ')
    // 图片（连同替代文本一起去掉，避免图片描述计入字数）
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // 链接：保留链接文本
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // HTML 标签
    .replace(/<[^>]+>/g, ' ')
    // Markdown 标题、列表、引用标记
    .replace(/^#+\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^>\s?/gm, '')
    // 强调符号
    .replace(/[*_~`]/g, '');

  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
};

/**
 * 读取全部 Markdown 文章（按日期降序）。
 * @param {string} articlesDir
 * @returns {Array<{ id: string, data: object, body: string, raw: string }>}
 */
export const readArticleFiles = (articlesDir) => {
  if (!fs.existsSync(articlesDir)) return [];

  return fs
    .readdirSync(articlesDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const id = name.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(articlesDir, name), 'utf-8');
      return {
        id,
        raw,
        data: parseFrontMatter(raw),
        body: raw.replace(FRONT_MATTER_ANY_RE, ''),
      };
    })
    .sort((a, b) => {
      const diff = Date.parse(b.data.date || '') - Date.parse(a.data.date || '');
      return Number.isNaN(diff) ? 0 : diff;
    });
};

/**
 * 文章元数据列表（virtual:article-meta）。
 */
export const collectArticleMeta = (articlesDir) => {
  return readArticleFiles(articlesDir).map(({ id, data, body }) => ({
    id,
    ...data,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    date: data.date || '',
    wordCount: countWords(body),
  }));
};

/**
 * 搜索索引文档列表（virtual:search-index）。
 */
export const buildSearchDocs = (articlesDir) => {
  return readArticleFiles(articlesDir).map(({ id, data, body }) => {
    const { text, sections, codeRanges } = markdownToSearchText(body);

    return {
      id,
      title: String(data.title || ''),
      summary: String(data.summary || ''),
      category: String(data.category || ''),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      date: data.date || '',
      wordCount: countWords(body),
      text,
      sections,
      codeRanges,
    };
  });
};

export default buildSearchDocs;

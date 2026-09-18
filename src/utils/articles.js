// 文章元数据索引：由 Vite 插件在构建期扫描所有 Markdown 的 front matter 生成，
// 只包含标题/日期/分类/标签/摘要等列表信息，不含正文，体积很小
import articlesMeta from 'virtual:article-meta';

// 每篇文章的正文仍然是独立的懒加载 chunk，访问对应文章时才会下载
const markdownLoaders = import.meta.glob('../articles/*.md', { query: '?raw', import: 'default' });

// 已加载过的正文缓存，避免切换页面时重复请求
const contentCache = new Map();

// 手动解析 Markdown 文件的 front matter（用于从单篇正文中剥离头部元信息）
const parseFrontMatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content };
  }

  return { data: {}, content: match[2] };
};

// 获取所有文章的元数据列表（同步数据，保留 async 签名以兼容调用方）
export const getArticles = async () => articlesMeta;

// 获取单篇文章：只加载该文章对应的 Markdown chunk
export const getArticle = async (id) => {
  const meta = articlesMeta.find(article => String(article.id) === String(id));
  if (!meta) return null;

  const loaderKey = Object.keys(markdownLoaders).find(
    pathKey => pathKey.split(/[/\\]/).pop() === `${id}.md`
  );
  if (!loaderKey) return { ...meta, content: '' };

  let contentPromise = contentCache.get(id);
  if (!contentPromise) {
    contentPromise = markdownLoaders[loaderKey]()
      .then(raw => parseFrontMatter(raw).content);
    contentCache.set(id, contentPromise);
  }

  return { ...meta, content: await contentPromise };
};

// 获取所有分类
export const getCategories = async () => {
  return [...new Set(articlesMeta.map(article => article.category))];
};

// 根据分类获取文章
export const getArticlesByCategory = async (category) => {
  return articlesMeta.filter(article => article.category === category);
};

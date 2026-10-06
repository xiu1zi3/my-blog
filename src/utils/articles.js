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

// 估算阅读时长（分钟）：混合中英文内容按约 400 字/分钟计算，不足 1 分钟按 1 分钟计
export const estimateReadingTime = (wordCount) => {
  const words = Number(wordCount) || 0;
  const minutes = Math.ceil(words / 400);
  return minutes < 1 ? 1 : minutes;
};

// 全站总字数（所有文章字数之和）
export const getTotalWordCount = () =>
  articlesMeta.reduce((sum, article) => sum + (Number(article.wordCount) || 0), 0);

// 字数里程碑：返回已达到的最大里程碑，如 5k+、30k+、50k+
// 阶梯为 1k / 5k / 10k / 20k / 30k / 50k / 100k / 200k ...
const MILESTONE_THRESHOLDS = [
  1_000, 5_000, 10_000, 20_000, 30_000, 50_000,
  100_000, 200_000, 500_000, 1_000_000,
];

export const getWordMilestone = (totalWords) => {
  const words = Number(totalWords) || 0;
  let reached = 0;
  for (const threshold of MILESTONE_THRESHOLDS) {
    if (words >= threshold) {
      reached = threshold;
    } else {
      break;
    }
  }
  if (reached === 0) return '0';
  // 千级以上用 k 缩写，例如 5000 -> 5k，50000 -> 50k
  return `${Math.round(reached / 1000)}k+`;
};

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

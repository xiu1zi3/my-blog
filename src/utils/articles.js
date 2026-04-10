// 文章数据
const articles = [
  {
    id: 1,
    title: '前端性能优化实战指南',
    category: '前端开发',
    tags: ['性能优化', 'Webpack', '最佳实践'],
    summary: '从多个维度分析前端性能优化的方法和技巧',
    content: '# 前端性能优化实战指南\n\n## 从多个维度分析前端性能优化的方法和技巧\n\n### 代码分割\n代码分割是前端性能优化的重要手段之一。通过将代码分割成多个小块，可以减少初始加载时间，提高用户体验。\n\n```javascript\n// 使用动态导入进行代码分割\nconst LazyComponent = React.lazy(() => import(\'./LazyComponent\'));\n```\n\n### 懒加载\n懒加载可以避免加载用户当前不需要的资源，提高页面加载速度。\n\n```javascript\n// 图片懒加载\nconst img = new Image();\nimg.src = \'image.jpg\';\nimg.loading = \'lazy\';\n```\n\n### 图片优化\n图片是前端资源中体积较大的部分，优化图片可以显著提高页面加载速度。\n\n- 使用适当的图片格式（WebP、AVIF等）\n- 压缩图片\n- 使用响应式图片\n\n### 缓存策略\n合理的缓存策略可以减少重复请求，提高页面加载速度。\n\n- 浏览器缓存\n- 服务端缓存\n- CDN缓存\n',
    date: '2026-04-01'
  },
  {
    id: 2,
    title: 'Node.js 后端开发最佳实践',
    category: '后端实战',
    tags: ['Node.js', 'Express', 'MongoDB'],
    summary: '分享 Node.js 后端开发的最佳实践和常见问题解决方案',
    content: '# Node.js 后端开发最佳实践\n\n## 分享 Node.js 后端开发的最佳实践和常见问题解决方案\n\n### 项目结构\n合理的项目结构可以提高代码的可维护性和可读性。\n\n```javascript\n// 推荐的项目结构\n/\n├── src/\n│   ├── controllers/\n│   ├── models/\n│   ├── routes/\n│   ├── middlewares/\n│   ├── services/\n│   └── utils/\n├── config/\n├── tests/\n└── package.json\n```\n\n### 中间件使用\n中间件是 Express 框架的核心特性之一，合理使用中间件可以提高代码的复用性。\n\n```javascript\n// 示例中间件\nconst logger = (req, res, next) => {\n  console.log(`${req.method} ${req.url}`);\n  next();\n};\n\napp.use(logger);\n```\n\n### 数据库设计\n合理的数据库设计可以提高应用的性能和可扩展性。\n\n- 选择合适的数据库类型（关系型或非关系型）\n- 设计合理的数据模型\n- 使用索引优化查询性能\n',
    date: '2026-03-15'
  },
  {
    id: 3,
    title: 'VS Code 插件推荐',
    category: '工具测评',
    tags: ['VS Code', '开发工具', '效率提升'],
    summary: '推荐一些提高开发效率的 VS Code 插件',
    content: '# VS Code 插件推荐\n\n## 推荐一些提高开发效率的 VS Code 插件\n\n### 代码提示\n好的代码提示插件可以提高编码效率和准确性。\n\n- **IntelliSense for CSS class names**: 智能提示 CSS 类名\n- **ESLint**: 代码质量检查\n- **Prettier**: 代码格式化\n\n### 版本控制\n版本控制是开发过程中的重要环节，相关插件可以提高工作效率。\n\n- **GitLens**: 增强 Git 功能\n- **GitHub Pull Requests and Issues**: 直接在 VS Code 中管理 PR 和 Issues\n\n### 其他实用插件\n\n- **Live Server**: 本地开发服务器\n- **REST Client**: 直接在 VS Code 中发送 HTTP 请求\n- **Docker**: 容器管理\n',
    date: '2026-03-01'
  }
];

// 按日期降序排序
articles.sort((a, b) => new Date(b.date) - new Date(a.date));

// 获取所有文章列表
export const getArticles = () => {
  return articles;
};

// 获取单篇文章
export const getArticle = (id) => {
  return articles.find(article => article.id === parseInt(id)) || null;
};

// 获取所有分类
export const getCategories = () => {
  const categories = [...new Set(articles.map(article => article.category))];
  return categories;
};

// 根据分类获取文章
export const getArticlesByCategory = (category) => {
  return articles.filter(article => article.category === category);
};

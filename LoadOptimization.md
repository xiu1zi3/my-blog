# 博客首屏加载优化复盘（LoadOptimization）

> 日期：2026-09-18
> 项目：修子的日记（Vite 8 + React 19 + react-router 7 的静态博客，部署于 xiuzi.top）
> 背景：文章数量增长到 47 篇后，首次进入站点的等待时间明显变长

---

## 1. 问题背景

博客文章以 Markdown 文件形式存放在 `src/articles/*.md`，通过 Vite 的 `import.meta.glob` 在客户端加载。随着文章数量增加，首页首屏等待时间随文章数量线性增长。

## 2. 根因定位

通过阅读源码 + 基线构建（`npm run build`）分析，确认两个叠加问题：

### 2.1 首页下载并解析了全部文章正文

`src/utils/articles.js` 旧实现中：

```js
const markdownFiles = import.meta.glob('../articles/*.md', { query: '?raw', import: 'default' });

export const getArticles = async () => {
  for (const [path, contentPromise] of Object.entries(markdownFiles)) {
    const content = await contentPromise(); // 每篇文章都被下载
    // ...解析 front matter + 正文
  }
};
```

- 构建产物中每篇文章是一个独立 chunk（0.99 ~ 10 KB，47 篇合计约 150 KB / gzip 约 76 KB）。
- 首页 `Home.jsx` 调用 `getArticles()` 只为渲染卡片（标题、分类、摘要、标签、日期），却要下载**全部 47 个正文 chunk**。
- 每新增一篇文章，首屏就多 1 个网络请求和 1 份解析开销——这是"文章越多越慢"的直接原因。

### 2.2 重依赖被打进首屏主包

`App.jsx` 静态 `import` 了全部页面，而仅文章页使用的重库随之进入主入口包：

- `react-syntax-highlighter`（Prism 全量注册 **270+ 种语言**）
- `react-markdown`、`remark-*`、`mermaid` 相关依赖

基线构建主包：`index.js = 1,037 KB`（gzip **353 KB**），并触发 Vite 的 >500 KB 告警。

## 3. 优化方案

核心思路：**元数据与正文分离 + 路由级代码分割 + 重依赖按需加载**，使首屏体积与文章总数脱钩。

### 3.1 构建期生成文章元数据索引（vite.config.js）

新增一个内置 Vite 插件（不引入新依赖）：

- 构建时扫描 `src/articles/*.md` 的 front matter，只提取 `title/category/summary/tags/date/headerImage`，生成虚拟模块 `virtual:article-meta`（本质是一个小 JSON 数组）。
- 元数据按日期降序排序，`tags` 统一规整为数组，`date` 统一为 `YYYY-MM-DD` 字符串。
- dev 模式下监听 md 文件的新增/修改/删除，自动失效虚拟模块并刷新页面（HMR）。
- 解析器沿用项目原有客户端的**宽松正则规则**，而非严格 YAML（原因见第 6 节踩坑）。

### 3.2 列表读索引、正文按篇懒加载（src/utils/articles.js）

- `getArticles()` / `getCategories()` / `getArticlesByCategory()` 直接返回虚拟模块中的元数据，**同步数据、零网络请求**（保留 `async` 签名以兼容调用方）。
- `getArticle(id)` 通过 `import.meta.glob` 的懒加载函数**只下载当前这一篇**的 md chunk，并用 `Map` 做 Promise 级缓存，页面间来回切换不重复请求。
- 对外 API 签名完全不变，`Home/Categories/Tags/Article` 四个页面无需任何业务改动。

### 3.3 路由级代码分割（src/App.jsx）

- 7 个页面全部改为 `React.lazy(() => import(...))`，外层包 `<Suspense fallback={<Loading/>}>`。
- `react-markdown`、语法高亮等重依赖随之从主包移出，只在访问文章页时加载。

### 3.4 语法高亮按需注册（src/pages/Article.jsx）

统计全部文章后发现只用到 8 类代码块标记：`java / shell / python / javascript / cpp / text / xml / properties`（`text` 由 Prism core 内置，`mermaid` 走 CDN 渲染）。

- 由全量 `Prism` 改为 `PrismLight`。
- 只注册 7 个语言模块（bash、python、javascript、cpp、markup、properties、java），并补充常见别名（sh/bash、js、c、html、py）。
- refractor 语言模块会自动注册 `clike` 等依赖，无需手动处理。

## 4. 量化效果

| 指标 | 优化前 | 优化后 | 变化 |
|---|---|---|---|
| 主包 index.js | 1,037 KB（gzip 353 KB） | 201 KB（gzip 65 KB） | -81%（gzip） |
| 首页文章数据 | 47 个正文 chunk，约 150 KB / 47 次请求 | 1 个元数据索引 12.9 KB（gzip 3.9 KB）/ 1 次请求 | 请求数 47 → 1 |
| 首页首屏 JS 总量（gzip，含主包+页面+数据） | 约 429 KB | 约 89 KB | **约 -79%** |
| 文章页 Article chunk | 包含在主包内 | 177.6 KB（gzip 56 KB） | 仅打开文章时才下载 |
| 首屏体积与文章数量的关系 | 线性增长（O(n)） | 无关（O(1)） | 核心收益 |

> 说明：文章数继续增长时，元数据索引会略微变大（47 篇时仅 3.9 KB gzip），但正文 chunk 永远只在访问对应文章时才加载。

## 5. 验证记录

### 5.1 构建验证

- `npm run build` 成功，无 >500 KB 告警。
- 检查元数据 chunk 内容：47 篇齐全、日期降序正确、emoji 标题（如 `📚系列概览-Java笔记博客`）、tags 数组、headerImage 均正确。

### 5.2 浏览器实测（vite preview 生产产物）

| 验证项 | 结果 |
|---|---|
| 首页 Hero、6 张卡片、分页 | 正常 |
| 首页网络请求中的文章正文 chunk（数字命名 js） | **0 个**（优化前 47 个） |
| 首页是否加载元数据索引 articles-*.js | 是 |
| 首页是否加载 Article-*.js 重包 | 否 |
| 进入文章页 | 标题/正文/目录/代码块深色高亮/复制按钮正常，仅新增 1 个对应 id 的正文 chunk |
| /categories、/tags | 分类按钮、标签云（25 个标签）、卡片正常 |
| /article/not-exist-id | 正确显示"文章不存在" |
| /article/4（含 mermaid 图） | SVG 流程图正常渲染 |
| 各页面 console 红色报错 | 0（仅有 giscus "Discussion not found" 的正常提示） |

### 5.3 dev 模式验证

`npm run dev` 下虚拟模块（`/@id/__x00__virtual:article-meta`）返回 200 且内容正确，`articles.js` 的 import 被正确重写，开发体验不受影响。

## 6. 踩坑记录

1. **严格 YAML 解析失败**：最初用 `gray-matter` 解析 front matter，12.md 中 `title:📚系列概览...`（冒号后紧跟 emoji、无空格）不符合严格 YAML 规范导致构建直接报错。改为复用项目原有客户端的宽松正则解析，既与线上历史行为完全一致，也更健壮。
2. **Windows PowerShell 执行策略**：沙箱中 `npm`（`npm.ps1`）被执行策略拦截，需使用 `npm.cmd run build` 执行。
3. **Prism 语言别名**：博客代码块标记为 `shell`、`xml`，而 Prism 语言 id 分别是 `bash`、`markup`，注册时需手动建立别名映射，否则对应代码块无高亮。

## 7. 涉及文件清单

| 文件 | 改动 |
|---|---|
| `vite.config.js` | 新增 article-meta 虚拟模块插件（扫描 + HMR） |
| `src/utils/articles.js` | 重写：列表读元数据索引，单篇正文懒加载 + 缓存 |
| `src/App.jsx` | 7 个路由改为 React.lazy + Suspense |
| `src/pages/Article.jsx` | Prism 全量 → PrismLight，仅注册 7 种语言 |

页面组件（Home/Categories/Tags 等）、Markdown 文章、部署配置均**零改动**。

## 8. 后续可选优化

- [ ] `src/assets/gallery/` 中 `2023-2.jpg`（6.3 MB）、`2023-3.jpg`（5.7 MB）体积过大，建议压缩/转 WebP（当前仅 About 页使用，已随路由懒加载，不影响首页）。
- [ ] 可对路由 chunk 增加 hover/focus 预取，进一步消除点击文章卡片后的加载等待。
- [ ] 可在 `vite.config.js` 中配置 `manualChunks`，将 react/react-router 等稳定依赖拆为独立 vendor chunk，提升长期缓存命中率。
- [ ] 文章增多后若元数据索引变大（数百篇以上），可考虑分页接口或按需加载列表，但当前规模完全无需处理。

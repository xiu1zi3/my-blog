# 个人技术博客

一个基于 React + Vite 构建的现代化个人技术博客，用于分享技术文章、学习笔记和编程心得。
下·
## 技术栈

- **框架**: React 19
- **构建工具**: Vite 8
- **路由**: React Router 7
- **样式**: Tailwind CSS 3
- **Markdown 渲染**: React Markdown
- **代码高亮**: React Syntax Highlighter
- **图表支持**: Mermaid

## 功能特性

- 📝 **Markdown 文章管理**: 支持使用 Markdown 格式编写文章
- 🎨 **响应式设计**: 完美适配桌面端和移动端
- 🌙 **主题切换**: 支持深色/浅色主题
- 🏷️ **文章标签**: 支持按标签分类浏览
- 📁 **文章分类**: 支持按类别组织文章
- 🔍 **关键词搜索**: 全站检索文章标题/摘要/标签/正文，并展示命中位置的局部上下文
- 💻 **代码高亮**: 支持多种编程语言的语法高亮
- 📊 **图表渲染**: 支持 Mermaid 图表渲染
- 📱 **平滑导航**: 基于 React Router 的流畅页面导航

## 快速开始

## 环境要求

验证安装：

```bash
node -v   # 应输出 v20.19.0 以上，或 v22.12.0 以上
npm -v    # 应输出 10.x 以上
```

| 工具 | 版本要求 | 说明 |
| --- | --- | --- |
| Node.js | `^20.19.0` 或 `>=22.12.0`（推荐 22 LTS） | Vite 8 的硬性要求 |


### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173/ 查看博客效果。

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 项目结构

```
personalDiary/
├── build/                     # 构建期脚本
│   ├── article-data.js        # 扫描 Markdown，生成文章元数据与搜索索引数据
│   └── vite-plugins.js        # 注入 virtual:article-meta / virtual:search-index
├── public/                    # 静态资源目录
│   ├── assets/               # 文章图片资源
│   ├── favicon.svg           # 网站图标
│   └── icons.svg             # 图标资源
├── src/                      # 源代码目录
│   ├── articles/             # Markdown 文章文件
│   ├── assets/               # 应用资源文件
│   ├── components/           # 可复用组件
│   │   ├── Footer.jsx        # 页脚组件
│   │   └── Navbar.jsx        # 导航栏组件
│   ├── context/              # React Context
│   │   └── ThemeContext.jsx  # 主题上下文
│   ├── pages/                # 页面组件
│   │   ├── About.jsx         # 关于页面
│   │   ├── Article.jsx       # 文章详情页面
│   │   ├── Categories.jsx    # 分类页面
│   │   ├── Home.jsx          # 首页
│   │   ├── NotFound.jsx      # 404页面
│   │   ├── Resources.jsx     # 资源页面
│   │   ├── Search.jsx        # 关键词搜索页面
│   │   └── Tags.jsx          # 标签页面
│   ├── utils/                # 工具函数
│   │   ├── articles.js       # 文章处理工具
│   │   ├── markdownText.js   # Markdown → 搜索纯文本（构建期与浏览器共用）
│   │   ├── searchCore.js     # 搜索核心：关键词解析、排序、上下文切片、高亮
│   │   └── searchIndex.js    # 搜索索引的按需加载入口
│   ├── App.jsx               # 应用入口组件
│   ├── App.css               # 应用样式
│   ├── index.css             # 全局样式
│   └── main.jsx              # 应用入口文件
├── tests/
│   └── search.test.mjs       # 搜索回归测试（npm test）
├── .gitignore                # Git 忽略配置
├── eslint.config.js          # ESLint 配置
├── index.html                # HTML 模板
├── package.json              # 项目依赖配置
├── postcss.config.js         # PostCSS 配置
├── tailwind.config.js        # Tailwind CSS 配置
├── vercel.json               # Vercel 部署配置
└── vite.config.js            # Vite 配置
```

## 文章管理

### 创建新文章

在 `src/articles/` 目录下创建新的 Markdown 文件，文件命名格式为 `{序号}.md`，例如 `15.md`。

### 文章格式

文章采用 YAML Front Matter 格式定义元数据：

```markdown
---
title: 文章标题
date: 2024-01-15
category: 技术分享
tags: [React, JavaScript]
summary: 一句话摘要（列表页展示，也会参与搜索与摘要高亮）
headerImage: /assets/article-images/your-image.png
---

文章正文内容...
```

> 搜索索引只依赖 `title` / `summary` / `tags` / `category` 与正文，
> 新增文章后无需额外配置；开发模式下保存 Markdown 会自动重建索引。

## 关键词搜索

导航栏的放大镜进入 `/search`，支持：

- **多关键词**：空格分隔表示「同时包含」，例如 `多智能体 上下文`；若没有任何文章同时包含全部关键词，会自动退化为「包含任意关键词」并给出提示；
- **精确短语**：用英文或中文引号包裹，例如 `"Super-agent 设计"`；
- **相关度排序**：标题 > 标签 / 章节标题 > 摘要 > 正文，也可切换为按时间排序；
- **局部上下文预览**：每篇文章最多展示 3 段命中位置的邻近上下文（约 200 字以内），
  并标注命中所在章节；命中位于代码块时会标注「代码 · 语言」；
- **高亮**：标题、摘要、标签与上下文片段中的关键词都会高亮；
- **可分享的深链**：`/search?q=关键词` 可直接打开搜索结果；支持回车立即搜索、Esc 清空。

实现要点：

| 模块 | 作用 |
| --- | --- |
| `build/article-data.js` | 构建期扫描 `src/articles/*.md`，产出元数据与搜索文档（纯文本 + 章节偏移 + 代码块区间） |
| `build/vite-plugins.js` | 以虚拟模块注入 `virtual:article-meta` 与 `virtual:search-index` |
| `src/utils/markdownText.js` | Markdown → 纯文本（构建期与浏览器共用，含 CRLF/围栏代码块处理） |
| `src/utils/searchCore.js` | 关键词解析、相关度评分、上下文切片、高亮分段（纯函数） |
| `src/utils/searchIndex.js` | 索引按需加载（只在进入 /search 时下载）与搜索入口 |
| `tests/search.test.mjs` | 搜索回归测试 |

索引体积与站点规模成正比：当前 50 篇文章、约 8.6 万字，对应索引约 190 KB（gzip ≈ 76 KB），
且只在搜索页加载，不影响首屏。若将来文章数增长到数百篇，可在此基础上把索引拆成分片按需加载。

运行搜索测试：

```bash
npm test
```

## 部署

### Vercel 部署

1. 登录 Vercel 官网
2. 导入 GitHub 仓库
3. 配置构建命令：`npm run build`
4. 配置输出目录：`dist`
5. 点击部署

### 国内访问优化

由于 Vercel 在国内访问较慢，可通过以下方式优化：

1. 使用 Cloudflare CDN 加速
2. 配合阿里云域名解析

参考教程：
- [Cloudflare 配合阿里云域名实现国内访问 Vercel](https://juejin.cn/post/7301193497247727652)
- [使用 Cloudflare 加速 Vercel 网站](https://blog.wuzm219.cn/2024/12/register-domain-with-cloudflare/)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

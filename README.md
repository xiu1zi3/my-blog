# 个人技术博客

一个基于 React + Vite 构建的现代化个人技术博客，用于分享技术文章、学习笔记和编程心得。

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
- 🔍 **代码高亮**: 支持多种编程语言的语法高亮
- 📊 **图表渲染**: 支持 Mermaid 图表渲染
- 📱 **平滑导航**: 基于 React Router 的流畅页面导航

## 快速开始

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
│   │   └── Tags.jsx          # 标签页面
│   ├── utils/                # 工具函数
│   │   └── articles.js       # 文章处理工具
│   ├── App.jsx               # 应用入口组件
│   ├── App.css               # 应用样式
│   ├── index.css             # 全局样式
│   └── main.jsx              # 应用入口文件
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
tags:
  - React
  - JavaScript
description: 文章描述
---

文章正文内容...
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
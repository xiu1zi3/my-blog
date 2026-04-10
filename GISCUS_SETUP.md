# Giscus 评论系统配置指南

本文档将指导您如何配置和使用 Giscus 评论系统，集成到您的博客项目中。

## 1. 前提条件

- 一个 GitHub 账号
- 一个 GitHub 仓库（用于存储评论）
- 已部署到 Vercel 的博客项目

## 2. 配置步骤

### 步骤 1：启用 GitHub Discussions

1. 打开您的 GitHub 仓库
2. 点击 "Settings" 选项卡
3. 向下滚动到 "Features" 部分
4. 勾选 "Discussions" 选项
5. 点击 "Save changes" 保存设置

### 步骤 2：安装 Giscus 应用

1. 访问 [Giscus 官网](https://giscus.app/)
2. 点击 "Install" 按钮
3. 选择您要安装 Giscus 的仓库
4. 点击 "Install" 完成安装

### 步骤 3：获取 Giscus 配置参数

1. 访问 [Giscus 配置页面](https://giscus.app/)
2. 在 "Repository" 字段中输入您的仓库名称（格式：username/repo）
3. 选择 "Discussion Category" 为 "Announcements" 或创建一个新的类别
4. 选择 "Page ↔️ Discussion Mapping" 为 "Pathname"
5. 其他选项保持默认设置
6. 复制生成的脚本代码中的以下参数：
   - data-repo
   - data-repo-id
   - data-category
   - data-category-id

### 步骤 4：配置博客项目

1. 打开 `src/pages/Article.jsx` 文件
2. 找到以下代码行并替换为您的实际值：

```javascript
script.setAttribute('data-repo', 'yourusername/your-repo'); // 替换为你的 GitHub 仓库
script.setAttribute('data-repo-id', 'YOUR_REPO_ID'); // 替换为你的仓库 ID
script.setAttribute('data-category', 'Announcements'); // 替换为你的讨论类别
script.setAttribute('data-category-id', 'YOUR_CATEGORY_ID'); // 替换为你的类别 ID
```

3. 保存文件并重新部署到 Vercel

## 3. 主题集成

Giscus 评论系统已与博客的主题系统集成，会自动根据当前主题切换浅色/深色模式。当您在博客中切换主题时，评论系统会自动跟随变化。

## 4. 测试评论功能

1. 访问您的博客文章页面
2. 滚动到页面底部的评论区
3. 使用 GitHub 账号登录并发表评论
4. 测试主题切换功能，确认评论系统主题会相应变化

## 5. 常见问题

### 评论区不显示
- 检查 Giscus 应用是否已正确安装到您的仓库
- 确认 `data-repo`, `data-repo-id`, `data-category`, `data-category-id` 参数是否正确
- 检查浏览器控制台是否有错误信息

### 主题切换不生效
- 确保 `isDark` 状态正确传递给 Giscus 脚本
- 检查 `data-theme` 属性是否正确设置

### 评论功能无法使用
- 确认您的 GitHub 账号是否有权限在仓库中发表评论
- 检查仓库的 Discussions 功能是否已启用

## 6. 高级配置

### 自定义 Giscus 选项

您可以根据需要调整 Giscus 的配置参数：

- `data-reactions-enabled`：是否启用反应表情（默认：1）
- `data-input-position`：评论输入框位置（默认：bottom）
- `data-lang`：评论系统语言（默认：zh-CN）

### 性能优化

为了提高页面加载速度，Giscus 脚本已设置为异步加载。您可以进一步优化：

- 实现评论区的懒加载，仅在用户滚动到评论区时加载
- 考虑使用 Giscus 的 `loading="lazy"` 属性

## 7. 注意事项

- 评论者需要拥有 GitHub 账号才能发表评论
- 评论存储在 GitHub Discussions 中，依赖于 GitHub 服务的稳定性
- 确保您的仓库设置为公开，否则 Giscus 可能无法正常工作

## 8. 故障排除

如果遇到问题，请参考以下资源：

- [Giscus 官方文档](https://giscus.app/docs)
- [Giscus GitHub 仓库](https://github.com/giscus/giscus)
- [GitHub Discussions 文档](https://docs.github.com/en/discussions)

通过以上步骤，您应该能够成功配置和使用 Giscus 评论系统，为您的博客添加互动功能。
import React, { useState } from 'react';

const Tags = () => {
  // 示例文章数据
  const articles = [
    {
      id: 1,
      title: '前端性能优化实战指南',
      category: '前端开发',
      tags: ['性能优化', 'Webpack', '最佳实践'],
      summary: '从多个维度分析前端性能优化的方法和技巧',
      date: '2026-04-01'
    },
    {
      id: 2,
      title: 'React 18 新特性解析',
      category: '前端开发',
      tags: ['React', '新特性', '前端框架'],
      summary: '深入解析 React 18 的新特性和使用方法',
      date: '2026-03-20'
    },
    {
      id: 3,
      title: 'Node.js 后端开发最佳实践',
      category: '后端实战',
      tags: ['Node.js', 'Express', 'MongoDB'],
      summary: '分享 Node.js 后端开发的最佳实践和常见问题解决方案',
      date: '2026-03-15'
    },
    {
      id: 4,
      title: 'MongoDB 数据库设计技巧',
      category: '后端实战',
      tags: ['MongoDB', '数据库', '设计'],
      summary: 'MongoDB 数据库设计的最佳实践和技巧',
      date: '2026-03-05'
    },
    {
      id: 5,
      title: 'VS Code 插件推荐',
      category: '工具测评',
      tags: ['VS Code', '开发工具', '效率提升'],
      summary: '推荐一些提高开发效率的 VS Code 插件',
      date: '2026-03-01'
    },
    {
      id: 6,
      title: 'Docker 容器化部署指南',
      category: '工具测评',
      tags: ['Docker', '容器化', '部署'],
      summary: 'Docker 容器化部署的实践指南',
      date: '2026-02-20'
    }
  ];

  // 计算每个标签的文章数量
  const tagCounts = {};
  articles.forEach(article => {
    article.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // 提取所有标签并排序
  const tags = Object.keys(tagCounts).sort();
  const [selectedTag, setSelectedTag] = useState(null);

  // 筛选当前标签的文章
  const filteredArticles = selectedTag
    ? articles.filter(article => article.tags.includes(selectedTag))
    : [];

  // 根据文章数量计算字体大小
  const getFontSize = (count) => {
    const minSize = 14;
    const maxSize = 24;
    const minCount = Math.min(...Object.values(tagCounts));
    const maxCount = Math.max(...Object.values(tagCounts));
    
    if (minCount === maxCount) return minSize;
    
    const size = minSize + ((count - minCount) / (maxCount - minCount)) * (maxSize - minSize);
    return Math.round(size);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
          标签云
        </h1>

        {/* 标签云 */}
        <div className="card mb-8 p-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`transition-all hover:text-primary ${selectedTag === tag
                  ? 'text-primary font-bold'
                  : 'text-gray-600'
                  }`}
                style={{ fontSize: `${getFontSize(tagCounts[tag])}px` }}
              >
                {tag} ({tagCounts[tag]})
              </button>
            ))}
          </div>
        </div>

        {/* 筛选结果 */}
        {selectedTag && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              标签: {selectedTag} ({tagCounts[selectedTag]} 篇文章)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <div key={article.id} className="card">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
                      {article.category}
                    </span>
                    <h3 className="text-xl font-bold mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {article.summary}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      {article.tags.map((tag, index) => (
                        <span key={index} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {article.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
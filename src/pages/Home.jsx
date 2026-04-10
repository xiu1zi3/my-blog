import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  // 示例文章数据
  const articles = [
    {
      id: 1,
      title: '前端性能优化实战指南',
      category: '前端开发',
      tags: ['性能优化', 'Webpack', '最佳实践'],
      summary: '从多个维度分析前端性能优化的方法和技巧',
      content: '包括代码分割、懒加载、图片优化、缓存策略等',
      date: '2026-04-01'
    },
    {
      id: 2,
      title: 'Node.js 后端开发最佳实践',
      category: '后端实战',
      tags: ['Node.js', 'Express', 'MongoDB'],
      summary: '分享 Node.js 后端开发的最佳实践和常见问题解决方案',
      content: '包括项目结构、中间件使用、数据库设计等',
      date: '2026-03-15'
    },
    {
      id: 3,
      title: 'VS Code 插件推荐',
      category: '工具测评',
      tags: ['VS Code', '开发工具', '效率提升'],
      summary: '推荐一些提高开发效率的 VS Code 插件',
      content: '包括代码提示、格式化、版本控制等方面的插件',
      date: '2026-03-01'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero 区域 */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            欢迎来到修子的博客
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            专注全栈实战，分享踩坑笔记
          </p>
          <Link to="/about" className="btn-primary">
            了解更多
          </Link>
        </div>
      </section>

      {/* 最新文章列表 */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            最新文章
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link key={article.id} to={`/article/${article.id}`} className="block">
                <div className="card hover:shadow-lg transition-shadow duration-300">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
                      {article.category}
                    </span>
                    <h3 className="text-xl text-gray-600 font-bold mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-500 mb-4">
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
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
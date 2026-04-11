import React, { useState } from 'react';

const Resources = () => {
  // 资源分类数据
  const resourceCategories = [
    {
      id: 'learning',
      name: '学习网站',
      resources: [
        { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: 'Web 开发权威文档' },
        { name: 'GitHub Learning Lab', url: 'https://lab.github.com', description: 'GitHub 学习平台' },
        { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org', description: '免费编程学习平台' },
        { name: '前端工程师手册', url: 'https://frontend-dev-handbook.com', description: '前端开发全面指南' }
      ]
    },
    {
      id: 'tools',
      name: '开发工具',
      resources: [
        { name: 'VS Code', url: 'https://code.visualstudio.com', description: '轻量级代码编辑器' },
        { name: 'GitHub Desktop', url: 'https://desktop.github.com', description: 'GitHub 桌面客户端' },
        { name: 'Postman', url: 'https://www.postman.com', description: 'API 测试工具' },
        { name: 'Docker', url: 'https://www.docker.com', description: '容器化平台' }
      ]
    },
    {
      id: 'design',
      name: '设计资源',
      resources: [
        { name: 'Figma', url: 'https://www.figma.com', description: '协作设计工具' },
        { name: 'Canva', url: 'https://www.canva.com', description: '在线设计工具' },
        { name: 'Unsplash', url: 'https://unsplash.com', description: '免费高清图片' },
        { name: 'Iconify', url: 'https://iconify.design', description: '图标库' }
      ]
    },
    {
      id: 'api',
      name: 'API 接口',
      resources: [
        { name: 'GitHub API', url: 'https://docs.github.com/en/rest', description: 'GitHub 开发者 API' },
        { name: 'OpenAI API', url: 'https://platform.openai.com/docs/api-reference', description: 'OpenAI 人工智能 API' },
        { name: 'Weather API', url: 'https://openweathermap.org/api', description: '天气数据 API' },
        { name: 'REST Countries API', url: 'https://restcountries.com', description: '国家信息 API' }
      ]
    },
    {
      id: 'community',
      name: '技术社区',
      resources: [
        { name: 'GitHub Discussions', url: 'https://github.com/discussions', description: 'GitHub 社区讨论' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com', description: '编程问答平台' },
        { name: '掘金', url: 'https://juejin.cn', description: '技术分享平台' },
        { name: '知乎', url: 'https://www.zhihu.com', description: '问答社区' }
      ]
    }
  ];

  const [selectedCategory, setSelectedCategory] = useState(resourceCategories[0].id);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
          资源导航
        </h1>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {resourceCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full transition-colors ${selectedCategory === category.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-primary/10'
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="card">
          <h2 className="text-2xl text-gray-900 font-bold mb-6">
            {resourceCategories.find(cat => cat.id === selectedCategory)?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resourceCategories
              .find(cat => cat.id === selectedCategory)
              ?.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold">{resource.name}</h3>
                    <p className="text-sm text-gray-500">
                      {resource.description}
                    </p>
                  </div>
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
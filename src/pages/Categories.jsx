import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getArticles, getCategories } from '../utils/articles';

const Categories = () => {
  // 直接获取文章和分类数据
  const articles = getArticles();
  const categories = getCategories();
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');

  // 筛选当前分类的文章
  const filteredArticles = articles.filter(article => article.category === selectedCategory);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
          文章分类
        </h1>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full transition-colors ${selectedCategory === category
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-primary/10'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <Link key={article.id} to={`/article/${article.id}`} className="card hover:shadow-lg transition-shadow">
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
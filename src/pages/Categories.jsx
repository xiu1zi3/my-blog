import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles, getCategories } from '../utils/articles';
import Loading from '../components/Loading';

const Categories = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesData, categoriesData] = await Promise.all([
          getArticles(),
          getCategories()
        ]);
        setArticles(articlesData);
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 筛选当前分类的文章
  const filteredArticles = articles.filter(article => article.category === selectedCategory);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);

  if (loading) {
    return <Loading type="categories" />;
  }

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
              onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
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
          {currentArticles.map((article) => (
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

        {/* 分页导航 */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-2 mb-4 md:mb-0">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded-md ${currentPage === page ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">每页显示：</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border rounded-md"
              >
                <option value="3">3篇</option>
                <option value="6">6篇</option>
                <option value="9">9篇</option>
                <option value="12">12篇</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
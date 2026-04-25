import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles } from '../utils/articles';

const Tags = () => {
  const [articles, setArticles] = useState([]);
  const [tagCounts, setTagCounts] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await getArticles();
        setArticles(data);
        
        // 计算每个标签的文章数量
        const counts = {};
        data.forEach(article => {
          if (article.tags && Array.isArray(article.tags)) {
            article.tags.forEach(tag => {
              counts[tag] = (counts[tag] || 0) + 1;
            });
          }
        });
        setTagCounts(counts);
        
        // 提取所有标签并排序
        const sortedTags = Object.keys(counts).sort();
        setTags(sortedTags);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // 筛选当前标签的文章
  const filteredArticles = selectedTag
    ? articles.filter(article => article.tags && article.tags.includes(selectedTag))
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

  if (loading) {
    return <div className="container mx-auto px-4 py-12">Loading...</div>;
  }

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
                <Link key={article.id} to={`/article/${article.id}`} className="block">
                  <div className="card hover:shadow-lg transition-shadow duration-300">
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
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;
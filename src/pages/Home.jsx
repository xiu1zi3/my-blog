import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles, getTotalWordCount, getWordMilestone } from '../utils/articles';
import Loading from '../components/Loading';

// 加载不蒜子访客统计脚本（全局只加载一次），脚本会把访客数写入
// id 为 busuanzi_value_site_uv / busuanzi_value_site_pv 的 span 内。
const loadBusuanzi = () => {
  if (document.getElementById('busuanzi-script')) return;
  const script = document.createElement('script');
  script.id = 'busuanzi-script';
  script.async = true;
  script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
  document.body.appendChild(script);
};

// 模块级缓存：不蒜子脚本只在首次加载时写入一次目标 span，
// 组件重挂载时 span 会被重建为空，因此需要在内存里记住已读到的数值。
let cachedVisitorCount = null;

// 轮询读取不蒜子写入的站点 UV，拿到后回调并停止轮询
const readSiteUV = (onValue, timeout = 8000) => {
  if (cachedVisitorCount !== null) {
    onValue(cachedVisitorCount);
    return;
  }
  const start = Date.now();
  const timer = setInterval(() => {
    const el = document.getElementById('busuanzi_value_site_uv');
    if (el && el.textContent) {
      clearInterval(timer);
      cachedVisitorCount = el.textContent.trim();
      onValue(cachedVisitorCount);
      return;
    }
    if (Date.now() - start > timeout) {
      clearInterval(timer);
    }
  }, 300);
};

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [visitorCount, setVisitorCount] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await getArticles();
        setArticles(data);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // 加载访客统计脚本并读取站点 UV
  useEffect(() => {
    loadBusuanzi();
    readSiteUV((value) => setVisitorCount(value));
  }, []);

  if (loading) {
    return <Loading type="home" />;
  }

  // 计算当前页的文章
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentArticles = articles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(articles.length / itemsPerPage);

  // 全站统计数据
  const totalArticles = articles.length;
  const totalWords = getTotalWordCount();
  const milestone = getWordMilestone(totalWords);

  const stats = [
    {
      label: '访客总数',
      value: visitorCount ?? '—',
      hint: visitorCount ? '来自不蒜子统计' : '统计加载中…',
    },
    {
      label: '文章总数',
      value: `${totalArticles}`,
      hint: '篇',
    },
    {
      label: '字数里程碑',
      value: milestone,
      hint: `累计 ${totalWords.toLocaleString()} 字`,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero 区域 */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            修子的日记
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            专注全栈实战，分享踩坑笔记
          </p>
          <Link to="/about" className="btn-primary">
            了解更多
          </Link>
        </div>
      </section>

      {/* 站点统计 */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          {/* 不蒜子脚本的写入目标：带特定 ID 的隐藏 span，脚本把 UV/PV 写入此处，
              再由 readSiteUV 读出并交给 React 状态渲染，避免 React 重渲染覆盖。 */}
          <span id="busuanzi_value_site_uv" className="hidden" />
          <span id="busuanzi_value_site_pv" className="hidden" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {stats.map((item) => (
              <div
                key={item.label}
                className="card flex flex-col items-center justify-center text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary">
                  {item.value}
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {item.label}
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                    {item.hint}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 最新文章列表 */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            最新文章
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentArticles.map((article) => (
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
                    setCurrentPage(1); // 重置到第一页
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
      </section>
    </div>
  );
};

export default Home;
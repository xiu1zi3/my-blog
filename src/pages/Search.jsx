import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchArticles } from '../utils/articles';
import useDismissInitialLoader from '../hooks/useDismissInitialLoader';

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-muted"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
    />
  </svg>
);

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // 页面内容随组件挂载立即渲染，挂载后即移除初始加载动画
  useDismissInitialLoader();

  // 输入框自动聚焦
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // 关键词变化后防抖执行搜索
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const keyword = query.trim();
      if (!keyword) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      searchArticles(keyword)
        .then((data) => {
          setResults(data);
          setSearched(true);
        })
        .catch((error) => console.error('Error searching articles:', error))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    setSearchParams(value.trim() ? { q: value } : {}, { replace: true });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
          搜索文章
        </h1>

        {/* 搜索输入框 */}
        <div className="mb-8 flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-card shadow-sm">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="输入关键词，搜索文章标题、简介与正文…"
            aria-label="搜索关键词"
            className="flex-1 bg-transparent outline-none text-lg text-text placeholder:text-muted"
          />
          {loading && <span className="text-sm text-muted">搜索中…</span>}
        </div>

        {!query.trim() && (
          <p className="text-center text-muted">输入关键词开始搜索</p>
        )}

        {query.trim() && !loading && searched && results.length === 0 && (
          <p className="text-center text-muted">
            未找到与「{query.trim()}」相关的文章
          </p>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            <p className="text-sm text-muted">
              找到 {results.length} 篇相关文章
            </p>

            {results.map((article) => (
              <article key={article.id} className="card">
                <Link to={`/article/${article.id}`} className="block group">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {article.category}
                    </span>
                    <span className="text-xs text-muted">{article.date}</span>
                  </div>
                  <h2 className="text-xl text-text font-bold mb-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-sm text-muted mb-4">{article.summary}</p>
                </Link>

                {article.snippets && article.snippets.length > 0 && (
                  <ul className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    {article.snippets.map((snippet, index) => (
                      <li key={index} className="text-sm leading-6 text-muted">
                        {snippet.prefix}
                        <mark className="search-mark">{snippet.match}</mark>
                        {snippet.suffix}
                      </li>
                    ))}
                  </ul>
                )}

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {article.tags.map((tag, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

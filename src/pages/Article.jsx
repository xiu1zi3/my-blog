import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getArticle } from '../utils/articles';
import { useTheme } from '../context/ThemeContext';

const Article = () => {
  const { id } = useParams();
  const article = getArticle(id);
  const { isDark } = useTheme();
  const giscusRef = useRef(null);
  
  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">文章不存在</h1>
        <p className="mb-6">抱歉，您访问的文章不存在。</p>
        <Link to="/" className="btn-primary">返回首页</Link>
      </div>
    );
  }

  useEffect(() => {
    // 清除旧的 Giscus 脚本
    if (giscusRef.current) {
      giscusRef.current.innerHTML = '';
    }

    // 创建新的 Giscus 脚本
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', 'xiu1zi3/my-blog'); // 替换为你的 GitHub 仓库
    script.setAttribute('data-repo-id', 'R_kgDOR_G5cA'); // 替换为你的仓库 ID
    script.setAttribute('data-category', 'Announcements'); // 替换为你的讨论类别
    script.setAttribute('data-category-id', 'DIC_kwDOR_G5cM4C6iUW'); // 替换为你的类别 ID
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', isDark ? 'dark' : 'light');
    script.setAttribute('data-lang', 'zh-CN');

    if (giscusRef.current) {
      giscusRef.current.appendChild(script);
    }

    // 清理函数
    return () => {
      if (giscusRef.current) {
        giscusRef.current.innerHTML = '';
      }
    };
  }, [isDark, article.id]);
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {article.category}
          </span>
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          <div className="flex justify-between items-center mb-8">
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
        
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {children}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">评论</h2>
          <div ref={giscusRef} className="mt-8"></div>
        </div>
        
        <div className="mt-12">
          <Link to="/" className="btn-primary">返回首页</Link>
        </div>
      </div>
    </div>
  );
};

export default Article;
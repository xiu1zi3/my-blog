import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getArticle } from '../utils/articles';
import { useTheme } from '../context/ThemeContext';
import Loading from '../components/Loading';

const CodeBlock = ({ children, language, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          right: '8px',
          top: '8px',
          padding: '4px 8px',
          fontSize: '12px',
          backgroundColor: copied ? '#10b981' : '#374151',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        {copied ? '已复制' : '复制'}
      </button>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        {...props}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

// 提取标题的函数
const extractHeadings = (content) => {
  // 移除围栏代码块，避免代码注释（如 Python 的 # 注释）被误识别为标题
  const contentWithoutCode = content.replace(/(^|\n)(```|~~~)[\s\S]*?(```|~~~)(?=\n|$)/g, '\n');
  const headings = contentWithoutCode.match(/^(#+\s+.+)$/gm);
  if (!headings) return [];

  return headings.map(heading => {
    const levelMatch = heading.match(/^(#{1,6})\s+(.+)$/);
    if (levelMatch) {
      const level = levelMatch[1].length;
      const text = levelMatch[2];
      // 生成锚点 ID，保留汉字和字母数字字符
      const anchor = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '');
      return { level, text, anchor };
    }
    return null;
  }).filter(Boolean);
};

// TOC 组件（小屏下的文章内目录）
const TOC = ({ headings }) => {
  if (!headings || headings.length === 0) return null;

  return (
    <div className="toc mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">目录</h2>
      <ul className="space-y-2">
        {headings.map((heading, index) => {
          const indent = (heading.level - 1) * 20;
          return (
            <li key={index} style={{ marginLeft: `${indent}px` }}>
              <a href={`#${heading.anchor}`} className="hover:text-primary">
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// 各级标题在左侧目录中的左缩进（参考 vdoing 主题）
const HEADING_PADDING_LEFT = {
  1: 15,
  2: 15,
  3: 27,
  4: 37,
  5: 47,
  6: 57,
};

// 左侧悬浮目录组件（宽屏显示，参考 xiu1zi3.github.io 的 right-menu）
const SideTOC = ({ headings, activeAnchor, onHeadingClick }) => {
  if (!headings || headings.length === 0) return null;

  return (
    <aside className="hidden xl:block absolute top-0 bottom-0 right-full w-56 mr-5 pointer-events-none">
      <nav
        aria-label="文章目录"
        className="sticky top-20 pointer-events-auto"
      >
        <div className="text-base font-semibold text-gray-800 dark:text-gray-200 pb-2.5 border-b border-gray-200 dark:border-gray-700">
          目录
        </div>
        <ul className="toc-scroll mt-1 max-h-[75vh] overflow-hidden hover:overflow-y-auto focus-within:overflow-y-auto pr-1">
          {headings.map((heading, index) => {
            const isActive = heading.anchor === activeAnchor;
            return (
              <li key={index}>
                <a
                  href={`#${heading.anchor}`}
                  onClick={(event) => onHeadingClick(event, heading.anchor)}
                  title={heading.text}
                  className={`relative block py-1 pr-[15px] text-[13px] leading-5 truncate transition-colors duration-200 ${
                    isActive
                      ? 'text-primary font-medium opacity-100'
                      : 'text-gray-500 dark:text-gray-400 opacity-75 hover:opacity-100 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  style={{ paddingLeft: HEADING_PADDING_LEFT[heading.level] || 15 }}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3.5 bg-primary rounded-r" />
                  )}
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

const Article = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState([]);
  const [hasTOC, setHasTOC] = useState(false);
  const [contentWithoutTOC, setContentWithoutTOC] = useState('');
  const { isDark } = useTheme();
  const giscusRef = useRef(null);
  const markdownRef = useRef(null);
  const [activeAnchor, setActiveAnchor] = useState('');

  // 点击左侧目录：平滑滚动到对应标题并同步地址栏 hash
  const handleHeadingClick = (event, anchor) => {
    const target = document.getElementById(anchor);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${encodeURIComponent(anchor)}`);
    setActiveAnchor(anchor);
  };

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await getArticle(id);
        
        if (!data) {
          setArticle(null);
          return;
        }
        
        // 提取标题
        const extractedHeadings = extractHeadings(data.content);
        setHeadings(extractedHeadings);
        
        // 检查是否有 [TOC] 标记
        const hasTOCTag = /\[TOC\]|\[toc\]/i.test(data.content);
        setHasTOC(hasTOCTag);
        
        // 移除 [TOC] 标记
        const contentWithoutTOCTag = data.content.replace(/\[TOC\]|\[toc\]/i, '');
        setContentWithoutTOC(contentWithoutTOCTag);
        
        setArticle(data);
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  useEffect(() => {
    // 只有当文章存在时才执行
    if (!article) return;
    
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

    // 初始化 Mermaid
    const initMermaid = () => {
      if (window.mermaid) {
        window.mermaid.initialize({
          startOnLoad: true,
          theme: isDark ? 'dark' : 'default',
          themeVariables: {
            lineColor: '#ffffffff'
          }
        });
        // 手动扫描并渲染mermaid图表
        if (markdownRef.current) {
          window.mermaid.init(undefined, markdownRef.current.querySelectorAll('.mermaid'));
        }
      } else {
        // 如果 mermaid 没有加载，动态加载 mermaid 脚本
        const mermaidScript = document.createElement('script');
        mermaidScript.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.4.0/dist/mermaid.min.js';
        mermaidScript.async = true;
        mermaidScript.onload = () => {
          if (window.mermaid) {
            window.mermaid.initialize({
              startOnLoad: true,
              theme: isDark ? 'dark' : 'default'
            });
            // 手动扫描并渲染mermaid图表
            if (markdownRef.current) {
              window.mermaid.init(undefined, markdownRef.current.querySelectorAll('.mermaid'));
            }
          }
        };
        document.body.appendChild(mermaidScript);
      }
    };

    // 立即初始化
    initMermaid();

    // 延迟一段时间再次初始化，确保ReactMarkdown已经渲染完成
    const timer = setTimeout(() => {
      initMermaid();
    }, 100);

    // 清理函数
    return () => {
      if (giscusRef.current) {
        giscusRef.current.innerHTML = '';
      }
      clearTimeout(timer);
    };
  }, [isDark, article]);

  // 滚动监听：根据当前阅读位置高亮左侧目录项
  useEffect(() => {
    if (!article) return undefined;

    const headingElements = headings
      .map((heading) => document.getElementById(heading.anchor))
      .filter(Boolean);

    const setActiveByScroll = () => {
      // 真正滚动到页面底部（且最后一个标题已进入视口）时，高亮最后一个标题。
      // 可见性判断可避免评论等异步内容尚未加载、文档暂时变短时的误判。
      const last = headingElements[headingElements.length - 1];
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && last && last.getBoundingClientRect().top < window.innerHeight) {
        setActiveAnchor(last.id);
        return;
      }
      let current = '';
      for (const element of headingElements) {
        if (element.getBoundingClientRect().top <= 90) {
          current = element.id;
        } else {
          break;
        }
      }
      setActiveAnchor((prev) => (prev === current ? prev : current));
    };

    let ticking = false;
    const scheduleUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        setActiveByScroll();
      });
    };

    const handleHashChange = () => {
      setActiveAnchor(decodeURIComponent(window.location.hash.slice(1)));
    };

    // 评论、图片等异步内容会改变文档高度，监听尺寸变化重新计算高亮项
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.body);

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('hashchange', handleHashChange);

    // 通过带 hash 的链接打开（刷新/外链）时，等待正文渲染后定位到对应标题
    const hashAnchor = decodeURIComponent(window.location.hash.slice(1));
    const timer = setTimeout(() => {
      if (hashAnchor) {
        const target = document.getElementById(hashAnchor);
        if (target) {
          target.scrollIntoView({ block: 'start' });
          return;
        }
      }
      setActiveByScroll();
    }, 150);

    setActiveByScroll();

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('hashchange', handleHashChange);
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [article, headings]);

  if (loading) {
    return <Loading type="article" />;
  }
  
  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">文章不存在</h1>
        <p className="mb-6">抱歉，您访问的文章不存在。</p>
        <Link to="/" className="btn-primary">返回首页</Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="relative max-w-3xl mx-auto">
        {/* 宽屏下显示在文章左侧的悬浮目录 */}
        <SideTOC
          headings={headings}
          activeAnchor={activeAnchor}
          onHeadingClick={handleHeadingClick}
        />
        {/* 头图展示 */}
        {article.headerImage && (
          <div className="mb-8 flex justify-center">
            <div className="w-2/3 max-w-2xl rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
              <img 
                src={article.headerImage} 
                alt={`${article.title} 的头图`} 
                className="w-full h-auto object-cover aspect-[16/9]"
              />
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {article.category}
          </span>
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          <div className="flex justify-between items-center mb-8">
            <div className="flex space-x-2">
              {article.tags && Array.isArray(article.tags) ? article.tags.map((tag, index) => (
                <span key={index} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                  {tag}
                </span>
              )) : null}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {article.date}
            </span>
          </div>
        </div>
        
        <div className="prose dark:prose-invert max-w-none" ref={markdownRef}>
          {/* 文章内目录（始终显示；左侧悬浮目录为额外补充） */}
          {hasTOC && <TOC headings={headings} />}
          
          <ReactMarkdown
            components={{
              code({ inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                if (className && className.includes('language-mermaid')) {
                  return <div className="mermaid">{children}</div>;
                }
                return !inline && match ? (
                  <CodeBlock language={match[1]} {...props}>
                    {children}
                  </CodeBlock>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              // 为标题添加锚点 ID 和 scroll-margin-top
              h1({ children, ...props }) {
                // 提取标题文本
                const text = typeof children === 'string' ? children : children.map(child => typeof child === 'string' ? child : '').join('');
                // 生成锚点 ID，保留汉字和字母数字字符
                const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '');
                return <h1 id={id} style={{ scrollMarginTop: '80px' }} {...props}>{children}</h1>;
              },
              h2({ children, ...props }) {
                // 提取标题文本
                const text = typeof children === 'string' ? children : children.map(child => typeof child === 'string' ? child : '').join('');
                // 生成锚点 ID，保留汉字和字母数字字符
                const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '');
                return <h2 id={id} style={{ scrollMarginTop: '80px' }} {...props}>{children}</h2>;
              },
              h3({ children, ...props }) {
                // 提取标题文本
                const text = typeof children === 'string' ? children : children.map(child => typeof child === 'string' ? child : '').join('');
                // 生成锚点 ID，保留汉字和字母数字字符
                const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '');
                return <h3 id={id} style={{ scrollMarginTop: '80px' }} {...props}>{children}</h3>;
              },
              h4({ children, ...props }) {
                // 提取标题文本
                const text = typeof children === 'string' ? children : children.map(child => typeof child === 'string' ? child : '').join('');
                // 生成锚点 ID，保留汉字和字母数字字符
                const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '');
                return <h4 id={id} style={{ scrollMarginTop: '80px' }} {...props}>{children}</h4>;
              },
              h5({ children, ...props }) {
                // 提取标题文本
                const text = typeof children === 'string' ? children : children.map(child => typeof child === 'string' ? child : '').join('');
                // 生成锚点 ID，保留汉字和字母数字字符
                const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '');
                return <h5 id={id} style={{ scrollMarginTop: '80px' }} {...props}>{children}</h5>;
              },
              h6({ children, ...props }) {
                // 提取标题文本
                const text = typeof children === 'string' ? children : children.map(child => typeof child === 'string' ? child : '').join('');
                // 生成锚点 ID，保留汉字和字母数字字符
                const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '');
                return <h6 id={id} style={{ scrollMarginTop: '80px' }} {...props}>{children}</h6>;
              },
              // 确保br标签被正确渲染
              br({ ...props }) {
                return <br {...props} />;
              },
              // 确保div标签被正确渲染
              div({ children, ...props }) {
                return <div {...props}>{children}</div>;
              }
            }}
          >
            {contentWithoutTOC}
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
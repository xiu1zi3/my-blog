import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import javaLang from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import bashLang from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import pythonLang from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import javascriptLang from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import cppLang from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import markupLang from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import propertiesLang from 'react-syntax-highlighter/dist/esm/languages/prism/properties';
import { getArticle } from '../utils/articles';
import { useTheme } from '../context/ThemeContext';
import Loading from '../components/Loading';

// 只注册博客中实际使用的语言，避免把 Prism 全量 270+ 种语言打进文章页
SyntaxHighlighter.registerLanguage('java', javaLang);
SyntaxHighlighter.registerLanguage('shell', bashLang);
SyntaxHighlighter.registerLanguage('sh', bashLang);
SyntaxHighlighter.registerLanguage('bash', bashLang);
SyntaxHighlighter.registerLanguage('python', pythonLang);
SyntaxHighlighter.registerLanguage('py', pythonLang);
SyntaxHighlighter.registerLanguage('javascript', javascriptLang);
SyntaxHighlighter.registerLanguage('js', javascriptLang);
SyntaxHighlighter.registerLanguage('cpp', cppLang);
SyntaxHighlighter.registerLanguage('c', cppLang);
SyntaxHighlighter.registerLanguage('xml', markupLang);
SyntaxHighlighter.registerLanguage('html', markupLang);
SyntaxHighlighter.registerLanguage('properties', propertiesLang);

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

// Markdown 代码块渲染器（模块级，避免每次渲染重建 DOM）
const MarkdownCode = ({ inline, className, children, ...props }) => {
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
};

// 提取标题文本，生成与 extractHeadings 一致的锚点 ID
const getHeadingText = (children) => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children.map((child) => (typeof child === 'string' ? child : '')).join('');
  }
  return '';
};

const getHeadingAnchor = (children) =>
  getHeadingText(children)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u4e00-\u9fa5a-z0-9-]/g, '');

// 标题渲染器工厂：组件身份在各次渲染间保持稳定，
// 避免内联函数导致 ReactMarkdown 反复卸载重建标题节点（会使锚点失效、
// 滚动目录拿到脱离文档的旧节点而误判高亮）
const createHeadingRenderer = (Tag) =>
  function Heading({ children, ...props }) {
    return (
      <Tag id={getHeadingAnchor(children)} style={{ scrollMarginTop: '80px' }} {...props}>
        {children}
      </Tag>
    );
  };

// 稳定的 Markdown 渲染器集合（模块级单例）
const MARKDOWN_COMPONENTS = {
  code: MarkdownCode,
  h1: createHeadingRenderer('h1'),
  h2: createHeadingRenderer('h2'),
  h3: createHeadingRenderer('h3'),
  h4: createHeadingRenderer('h4'),
  h5: createHeadingRenderer('h5'),
  h6: createHeadingRenderer('h6'),
  br: (props) => <br {...props} />,
  div: ({ children, ...props }) => <div {...props}>{children}</div>,
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
  // 点击目录后的「目标锁」：平滑滚动期间强制高亮所点击的标题，
  // 直到滚动位置自然到达该标题后才交还给 scroll-spy，
  // 避免高亮随平滑滚动沿中间标题一路滑动
  const pendingAnchorRef = useRef(null);
  const lastScrollYRef = useRef(0);

  // 点击左侧目录：平滑滚动到对应标题并同步地址栏 hash
  const handleHeadingClick = (event, anchor) => {
    const target = document.getElementById(anchor);
    if (!target) return;
    event.preventDefault();
    // 先上锁再启动滚动：平滑滚动途中的 scroll 事件不得改写高亮
    pendingAnchorRef.current = anchor;
    // 点击瞬间立即点亮目标标题（不等滚动到达）
    setActiveAnchor(anchor);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${encodeURIComponent(anchor)}`);
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

    // 新文章挂载：丢弃上一篇文章可能残留的点击锁
    pendingAnchorRef.current = null;
    lastScrollYRef.current = window.scrollY;

    const setActiveByScroll = () => {
      // 常规判定：最后一个顶部越过判定线（90px）的标题为当前标题
      let current = '';
      for (const element of headingElements) {
        if (element.getBoundingClientRect().top <= 90) {
          current = element.id;
        } else {
          break;
        }
      }

      // 兜底：仅当没有任何标题越线（例如最后一节内容很短、滚动到底时
      // 最后一个标题仍未越过判定线）且确实到达页面底部时，才高亮最后一个标题。
      // 不能在已有标题越线时使用底部规则，否则评论加载失败导致文档偏短时，
      // 停留在倒数第二个标题也会被误判为最后一个标题。
      if (!current) {
        const last = headingElements[headingElements.length - 1];
        const atBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atBottom && last && last.getBoundingClientRect().top < window.innerHeight) {
          current = last.id;
        }
      }

      // 点击目录后的平滑滚动期间：保持点击瞬间的高亮，
      // 直到滚动位置自然到达目标标题；若滚动已停止（如目标已在
      // 视口顶部、页面无法继续滚动），也立即解除锁定交还给 scroll-spy
      const pending = pendingAnchorRef.current;
      if (pending) {
        const scrollStopped = window.scrollY === lastScrollYRef.current;
        if (current === pending || scrollStopped) {
          pendingAnchorRef.current = null;
        } else {
          lastScrollYRef.current = window.scrollY;
          return;
        }
      }
      lastScrollYRef.current = window.scrollY;

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

    // 图片、代码高亮、Giscus 评论等异步内容会不断改变文档高度，
    // 多源监听尺寸变化，避免在布局收缩的瞬态算出错误高亮后无人纠正
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);
    if (markdownRef.current) {
      resizeObserver.observe(markdownRef.current);
    }
    if (giscusRef.current) {
      resizeObserver.observe(giscusRef.current);
    }

    // 图片全部加载完成（触发 load 时页面高度可能已多次变化）
    const handleWindowLoad = scheduleUpdate;

    // 用户手动滚动（滚轮/触摸/键盘）时立即放弃点击锁，交还给正常 scroll-spy
    const cancelPendingLock = () => {
      pendingAnchorRef.current = null;
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('load', handleWindowLoad);
    window.addEventListener('wheel', cancelPendingLock, { passive: true });
    window.addEventListener('touchmove', cancelPendingLock, { passive: true });
    window.addEventListener('keydown', cancelPendingLock);

    // 挂载后短期内按退避间隔反复重算，覆盖高亮渲染、图片占位等布局抖动
    const settleTimers = [200, 500, 1000, 1800, 3000].map((delay) =>
      setTimeout(scheduleUpdate, delay),
    );

    // 通过带 hash 的链接打开（刷新/外链）时，等待正文渲染后定位到对应标题
    const hashAnchor = decodeURIComponent(window.location.hash.slice(1));
    const timer = setTimeout(() => {
      if (hashAnchor) {
        const target = document.getElementById(hashAnchor);
        if (target) {
          target.scrollIntoView({ block: 'start' });
        }
      }
      setActiveByScroll();
    }, 150);

    setActiveByScroll();

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('load', handleWindowLoad);
      window.removeEventListener('wheel', cancelPendingLock);
      window.removeEventListener('touchmove', cancelPendingLock);
      window.removeEventListener('keydown', cancelPendingLock);
      resizeObserver.disconnect();
      clearTimeout(timer);
      settleTimers.forEach(clearTimeout);
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
          
          <ReactMarkdown components={MARKDOWN_COMPONENTS}>
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
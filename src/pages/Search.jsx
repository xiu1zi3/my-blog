import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchArticles, loadSearchIndex, getPopularTags } from '../utils/searchIndex';
import useDismissInitialLoader from '../hooks/useDismissInitialLoader';

// 输入防抖：既保证「敲完再搜」不浪费算力，又不至于让访客觉得卡顿
const DEBOUNCE_MS = 220;

const EMPTY_OUTCOME = {
  query: '',
  terms: [],
  mode: 'all',
  results: [],
  totalMatches: 0,
  candidateCount: 0,
};

const SORT_OPTIONS = [
  { value: 'relevance', label: '相关度' },
  { value: 'date', label: '时间' },
];

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

const ClearIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Highlight = ({ segments }) => (
  <>
    {segments.map((segment, index) =>
      segment.hit ? (
        <mark key={index} className="search-mark">
          {segment.text}
        </mark>
      ) : (
        <React.Fragment key={index}>{segment.text}</React.Fragment>
      ),
    )}
  </>
);

const Snippet = ({ snippet }) => {
  const label = snippet.kind === 'code'
    ? `代码${snippet.lang ? ` · ${snippet.lang}` : ''}`
    : snippet.section || '正文';

  return (
    <li className={`search-snippet${snippet.kind === 'code' ? ' search-snippet--code' : ''}`}>
      <div className="search-snippet-meta">
        <span className="search-snippet-dot" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <p className="search-snippet-text">
        {snippet.leadingEllipsis && '…'}
        <Highlight segments={snippet.segments} />
        {snippet.trailingEllipsis && '…'}
      </p>
    </li>
  );
};

const ResultCard = ({ result }) => (
  <article className="card">
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {result.category && (
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
          {result.category}
        </span>
      )}
      <span className="text-xs text-muted">{result.date}</span>
      {typeof result.wordCount === 'number' && result.wordCount > 0 && (
        <span className="text-xs text-muted">· {result.wordCount} 字</span>
      )}
      <span className="ml-auto text-xs text-muted">
        匹配 {result.matchCount} 处
      </span>
    </div>

    <Link to={`/article/${result.id}`} className="block group">
      <h2 className="text-xl text-text font-bold mb-2 group-hover:text-primary transition-colors">
        <Highlight segments={result.titleSegments} />
      </h2>
      {result.summary && (
        <p className="text-sm text-muted leading-6">
          <Highlight segments={result.summarySegments} />
        </p>
      )}
    </Link>

    {result.snippets.length > 0 && (
      <ul className="mt-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        {result.snippets.map((snippet, index) => (
          <Snippet key={index} snippet={snippet} />
        ))}
      </ul>
    )}

    {result.snippets.length === 0 && result.matchedIn.title && (
      <p className="mt-3 text-xs text-muted">关键词出现在标题中，正文没有更多上下文。</p>
    )}

    <div className="mt-3 flex flex-wrap items-center gap-2">
      {result.tags.map((tag, index) => (
        <span
          key={index}
          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
        >
          {result.tagSegments[index] ? <Highlight segments={result.tagSegments[index]} /> : tag}
        </span>
      ))}
      {result.missingTerms.length > 0 && (
        <span className="text-xs text-muted">
          未包含：{result.missingTerms.join('、')}
        </span>
      )}
    </div>
  </article>
);

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState('idle');
  const [outcome, setOutcome] = useState(EMPTY_OUTCOME);
  const [sortMode, setSortMode] = useState('relevance');
  const [suggestions, setSuggestions] = useState([]);
  const [indexError, setIndexError] = useState(false);

  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const requestRef = useRef(0);
  const writtenQueryRef = useRef(initialQuery);

  // 页面内容随组件挂载立即渲染，挂载后即移除初始加载动画
  useDismissInitialLoader();

  // 输入框自动聚焦
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // 输入 → 地址栏（replace，避免每个字符都压入历史记录）
  useEffect(() => {
    const normalized = query.trim();
    if (writtenQueryRef.current === normalized) return;
    writtenQueryRef.current = normalized;
    setSearchParams(normalized ? { q: normalized } : {}, { replace: true });
  }, [query, setSearchParams]);

  // 地址栏 → 输入（浏览器前进 / 后退时，以地址栏为准同步输入框）
  useEffect(() => {
    const syncFromUrl = () => {
      const fromUrl = new URLSearchParams(window.location.search).get('q') || '';
      if (fromUrl === writtenQueryRef.current) return;
      writtenQueryRef.current = fromUrl;
      setQuery(fromUrl);
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // 预加载索引 + 收集「试试这些关键词」
  useEffect(() => {
    let alive = true;
    loadSearchIndex()
      .then(() => getPopularTags(8))
      .then((tags) => {
        if (alive) setSuggestions(tags);
      })
      .catch((error) => {
        if (!alive) return;
        console.error('搜索索引加载失败:', error);
        setIndexError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const runSearch = useCallback(async (keyword) => {
    const trimmed = keyword.trim();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!trimmed) {
      setOutcome(EMPTY_OUTCOME);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    try {
      const result = await searchArticles(trimmed);
      if (requestRef.current !== requestId) return;
      setOutcome(result);
      setStatus('ready');
      setIndexError(false);
    } catch (error) {
      if (requestRef.current !== requestId) return;
      console.error('搜索失败:', error);
      setOutcome(EMPTY_OUTCOME);
      setStatus('error');
      setIndexError(true);
    }
  }, []);

  // 关键词变化后防抖执行；组件卸载 / 关键词再次变化时丢弃旧定时器
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const resetResults = () => {
    // 让仍在飞行中的请求失效，避免清空后又被旧结果填满
    requestRef.current += 1;
    setOutcome(EMPTY_OUTCOME);
    setStatus('idle');
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    if (!value.trim()) resetResults();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runSearch(query);
  };

  const handleClear = () => {
    resetResults();
    setQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSuggestion = (keyword) => {
    setQuery(keyword);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && query) {
      event.preventDefault();
      handleClear();
    }
  };

  const sortedResults = useMemo(() => {
    if (sortMode !== 'date') return outcome.results;
    return [...outcome.results].sort((a, b) => {
      const diff = Date.parse(b.date) - Date.parse(a.date);
      return Number.isNaN(diff) || diff === 0 ? b.score - a.score : diff;
    });
  }, [outcome.results, sortMode]);

  const keyword = query.trim();
  const hasResults = outcome.results.length > 0;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">搜索文章</h1>

        <form role="search" onSubmit={handleSubmit} className="mb-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-card shadow-sm focus-within:border-primary transition-colors">
            <SearchIcon />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="输入关键词，搜索标题、摘要、标签与正文…"
              aria-label="搜索关键词"
              enterKeyHint="search"
              className="flex-1 bg-transparent outline-none text-lg text-text placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="清空关键词"
              >
                <ClearIcon />
              </button>
            )}
            {status === 'loading' && <span className="text-sm text-muted shrink-0">搜索中…</span>}
          </div>
        </form>

        <p className="mb-8 text-xs leading-5 text-muted">
          空格分隔多个关键词表示「同时包含」，英文双引号包裹表示精确短语（如
          <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700">"super-agent"</code>
          ）。结果会列出文章标题、摘要，以及关键词在正文中所属章节与邻近上下文；回车立即搜索，Esc 清空。
        </p>

        {!keyword && (
          <div className="text-center">
            <p className="text-muted mb-4">输入关键词开始搜索</p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <span className="text-sm text-muted py-1">试试：</span>
                {suggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSuggestion(tag)}
                    className="px-3 py-1 text-sm rounded-full border border-gray-200 dark:border-gray-700 text-text hover:border-primary hover:text-primary transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="card text-center">
            <p className="text-text mb-2">搜索索引加载失败</p>
            <p className="text-sm text-muted mb-4">
              请检查网络后重试；若持续失败，可能是构建产物尚未包含搜索索引。
            </p>
            <button type="button" onClick={() => runSearch(query)} className="btn-primary">
              重新加载
            </button>
          </div>
        )}

        {keyword && status === 'ready' && !hasResults && (
          <div className="card text-center" role="status">
            <p className="text-text mb-2">未找到与「{keyword}」相关的文章</p>
            <p className="text-sm text-muted mb-4">试试更短的关键词、换一种说法，或减少关键词数量。</p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, 6).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSuggestion(tag)}
                    className="px-3 py-1 text-sm rounded-full border border-gray-200 dark:border-gray-700 text-text hover:border-primary hover:text-primary transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {hasResults && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted" aria-live="polite">
                找到 {outcome.results.length} 篇相关文章
                <span className="mx-1">·</span>
                共 {outcome.totalMatches} 处匹配
                {outcome.mode === 'any' && (
                  <span className="ml-2 text-xs text-primary">（没有文章同时包含全部关键词，已改为匹配任意关键词）</span>
                )}
              </p>
              <div className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 p-0.5">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortMode(option.value)}
                    aria-pressed={sortMode === option.value}
                    className={`px-2.5 py-1 text-xs rounded transition-colors ${
                      sortMode === option.value
                        ? 'bg-primary text-white'
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {outcome.candidateCount > outcome.results.length && (
              <p className="text-xs text-muted">
                共 {outcome.candidateCount} 篇命中，仅展示前 {outcome.results.length} 篇，请输入更具体的关键词。
              </p>
            )}

            {sortedResults.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        )}

        {!keyword && indexError && (
          <p className="mt-6 text-center text-xs text-muted">
            搜索索引暂时不可用，请刷新页面重试。
          </p>
        )}
      </div>
    </div>
  );
};

export default Search;

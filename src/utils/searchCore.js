// 关键词搜索核心（纯函数，无 DOM / Node 依赖）。
//
// 设计目标：
//   1. 多关键词 AND 语义：`agent 上下文` 表示同时包含两个词；
//      英文双引号包裹表示短语精确匹配（`"super-agent"`）；
//   2. 相关度排序：标题 > 标签/章节标题 > 摘要 > 正文；
//   3. 上下文预览：为每篇文章生成若干「命中位置附近」的片段，
//      片段带高亮分段、所在章节标题、是否来自代码块；
//   4. 纯字符串 indexOf 匹配（不做正则），访客输入 `a.b(c)*` 不会崩。

const MAX_TERMS = 8;
const MAX_TITLE_HITS = 50;
const MAX_SUMMARY_HITS = 50;
const MAX_TAG_HITS = 20;
const MAX_HEADING_HITS = 20;
const MAX_BODY_HITS = 400;
const MAX_HIGHLIGHT_RANGES = 400;

const DEFAULTS = {
  maxResults: 100,
  snippetsPerDoc: 3,
  contextChars: 70,
};

// 小写化后长度变化（例如土耳其语 İ）会让偏移量错位，
// 这类少见字符直接退回原文匹配，保证高亮位置不会错乱。
const lowerForMatch = (value) => {
  const source = String(value ?? '');
  const lower = source.toLowerCase();
  return lower.length === source.length ? lower : source;
};

const countMatches = (haystack, needle, limit) => {
  if (!needle || !haystack) return 0;
  let count = 0;
  let from = 0;
  while (count < limit) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) break;
    count += 1;
    from = index + Math.max(1, needle.length);
  }
  return count;
};

/**
 * 解析访客输入。
 * - 空白分隔多个关键词（AND）；
 * - `"..."` / `“...”` 内的内容作为短语，整体匹配；
 * - 去重（忽略大小写），最多保留 8 个关键词，避免误粘贴长文拖慢检索。
 *
 * @returns {Array<{value: string, lower: string, phrase: boolean}>}
 */
export const parseQuery = (raw) => {
  const text = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return [];

  const terms = [];
  const seen = new Set();
  const tokenRe = /"([^"]+)"|“([^”]+)”|(\S+)/g;
  let match = tokenRe.exec(text);

  while (match) {
    const value = (match[1] || match[2] || match[3] || '').trim();
    const isPhrase = match[1] != null || match[2] != null;
    match = tokenRe.exec(text);
    if (!value) continue;

    const lower = value.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    terms.push({ value, lower, phrase: isPhrase });
    if (terms.length >= MAX_TERMS) break;
  }

  return terms;
};

/**
 * 为索引补上小写字段等检索辅助数据，只在索引加载时执行一次。
 */
export const prepareIndex = (docs) => {
  if (!Array.isArray(docs)) {
    throw new TypeError('搜索索引格式不正确：期望文章数组');
  }

  return docs.map((doc) => {
    const sections = Array.isArray(doc.sections) ? doc.sections : [];
    const tags = Array.isArray(doc.tags) ? doc.tags.map(String) : [];
    const text = typeof doc.text === 'string' ? doc.text : '';

    return {
      ...doc,
      tags,
      text,
      sections,
      codeRanges: Array.isArray(doc.codeRanges) ? doc.codeRanges : [],
      titleLower: lowerForMatch(doc.title),
      summaryLower: lowerForMatch(doc.summary),
      tagLowers: tags.map(lowerForMatch),
      textLower: lowerForMatch(text),
      sectionLowers: sections.map((section) => lowerForMatch(section.title)),
      dateValue: Number.isNaN(Date.parse(doc.date)) ? 0 : Date.parse(doc.date),
    };
  });
};

/**
 * 把一段文字按命中的关键词切成 [{ text, hit }] 分段，供 React 渲染 <mark>。
 */
export const buildHighlightSegments = (value, terms, limit = MAX_HIGHLIGHT_RANGES) => {
  const source = String(value ?? '');
  if (!source) return [];

  const haystack = lowerForMatch(source);
  const ranges = [];

  for (const term of terms) {
    if (!term.lower) continue;
    let from = 0;
    while (ranges.length < limit) {
      const index = haystack.indexOf(term.lower, from);
      if (index === -1) break;
      ranges.push({ start: index, end: index + term.lower.length });
      from = index + Math.max(1, term.lower.length);
    }
  }

  if (!ranges.length) return [{ text: source, hit: false }];

  ranges.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  const segments = [];
  let cursor = 0;
  for (const range of merged) {
    if (range.start > cursor) {
      segments.push({ text: source.slice(cursor, range.start), hit: false });
    }
    segments.push({ text: source.slice(range.start, range.end), hit: true });
    cursor = range.end;
  }
  if (cursor < source.length) {
    segments.push({ text: source.slice(cursor), hit: false });
  }

  return segments;
};

// sections 已按 offset 升序排列，二分查找命中位置所属的章节
const locateSection = (doc, offset) => {
  const sections = doc.sections;
  if (!sections.length) return null;

  let low = 0;
  let high = sections.length - 1;
  let found = null;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (sections[middle].offset <= offset) {
      found = sections[middle];
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
};

const locateCode = (doc, offset) => {
  for (const range of doc.codeRanges) {
    if (offset >= range.start && offset < range.end) return range;
    if (offset < range.start) break;
  }
  return null;
};

// 收集一个关键词在正文里的全部命中位置（有上限，避免极端关键词拖慢检索）
const collectPositions = (textLower, terms, limitPerTerm = 120) => {
  const positions = [];
  for (const term of terms) {
    if (!term.lower) continue;
    let from = 0;
    let guard = 0;
    while (guard < limitPerTerm) {
      const index = textLower.indexOf(term.lower, from);
      if (index === -1) break;
      positions.push({ start: index, end: index + term.lower.length });
      from = index + Math.max(1, term.lower.length);
      guard += 1;
    }
  }
  positions.sort((a, b) => a.start - b.start || a.end - b.end);
  return positions;
};

// 把相邻命中合并成同一个预览窗口
const clusterPositions = (positions, gap) => {
  const clusters = [];
  for (const position of positions) {
    const last = clusters[clusters.length - 1];
    if (last && position.start <= last.end + gap) {
      last.end = Math.max(last.end, position.end);
      last.hits += 1;
    } else {
      clusters.push({
        start: position.start,
        firstEnd: position.end,
        end: position.end,
        hits: 1,
      });
    }
  }
  return clusters;
};

// 预览窗口选择：优先覆盖不同章节，再按出现顺序补足
const selectClusters = (clusters, doc, maxSnippets) => {
  if (clusters.length <= maxSnippets) return clusters;

  const chosen = [];
  const chosenSet = new Set();
  const seenSections = new Set();

  for (const cluster of clusters) {
    const section = locateSection(doc, cluster.start);
    const key = section ? section.title : '__no_section__';
    if (seenSections.has(key)) continue;
    seenSections.add(key);
    chosen.push(cluster);
    chosenSet.add(cluster);
    if (chosen.length >= maxSnippets) break;
  }

  for (const cluster of clusters) {
    if (chosen.length >= maxSnippets) break;
    if (chosenSet.has(cluster)) continue;
    chosen.push(cluster);
  }

  return chosen.sort((a, b) => a.start - b.start);
};

// 单个预览片段的最大字符数：再长就不算「局部上下文」了
const MAX_SNIPPET_CHARS = 200;
const SENTENCE_BREAKS = ['。', '！', '？', '；', '…', '.', '!', '?', ';', ' '];

// 生成单个预览片段：以第一处命中为中心向两侧扩展，且不跨段落 / 代码块
const buildSnippet = (doc, terms, cluster, contextChars) => {
  const text = doc.text;

  // 命中所在段落的边界（段落之间用空行分隔，代码块内部保留换行）
  const blockStart = text.lastIndexOf('\n', cluster.start - 1) + 1;
  const nextBreak = text.indexOf('\n', cluster.firstEnd);
  const blockEnd = nextBreak === -1 ? text.length : nextBreak;

  let start = Math.max(blockStart, cluster.start - contextChars);
  let end = Math.min(blockEnd, cluster.firstEnd + contextChars);

  // 首尾可能截断到半个英文单词：向空格对齐
  if (start > blockStart) {
    const firstSpace = text.indexOf(' ', start);
    if (firstSpace !== -1 && firstSpace < cluster.start && firstSpace - start < 16) {
      start = firstSpace + 1;
    }
  }
  if (end < blockEnd) {
    const lastSpace = text.lastIndexOf(' ', end);
    if (lastSpace > cluster.firstEnd && end - lastSpace < 16) {
      end = lastSpace;
    }
  }

  let display = text.slice(start, end).replace(/\s*\n+\s*/g, ' ').trim();
  let trailingEllipsis = end < text.length;

  // 段落很长时按句末/空格截断，避免一条预览占满屏幕
  if (display.length > MAX_SNIPPET_CHARS) {
    const slice = display.slice(0, MAX_SNIPPET_CHARS);
    let cut = -1;
    for (const breakChar of SENTENCE_BREAKS) {
      cut = Math.max(cut, slice.lastIndexOf(breakChar));
    }
    display = (cut > MAX_SNIPPET_CHARS * 0.5 ? slice.slice(0, cut + 1) : slice).trim();
    trailingEllipsis = true;
  }

  // 兜底：修剪后若把第一处命中切掉了，退回到命中附近的窗口
  const displayLower = lowerForMatch(display);
  if (!terms.some((term) => term.lower && displayLower.includes(term.lower))) {
    start = Math.max(blockStart, cluster.start - 20);
    end = Math.min(blockEnd, cluster.firstEnd + MAX_SNIPPET_CHARS - 40);
    display = text.slice(start, end).replace(/\s*\n+\s*/g, ' ').trim();
    trailingEllipsis = end < text.length;
  }

  if (!display) return null;

  const section = locateSection(doc, cluster.start);
  const code = locateCode(doc, cluster.start);

  return {
    segments: buildHighlightSegments(display, terms),
    section: section ? section.title : null,
    kind: code ? 'code' : 'text',
    lang: code ? code.lang : '',
    leadingEllipsis: start > 0,
    trailingEllipsis,
  };
};

const buildDocSnippets = (doc, terms, { snippetsPerDoc, contextChars }) => {
  const positions = collectPositions(doc.textLower, terms);
  if (!positions.length) return [];

  const clusters = clusterPositions(positions, contextChars);
  const selected = selectClusters(clusters, doc, snippetsPerDoc);

  const snippets = [];
  const seen = new Set();

  for (const cluster of selected) {
    const snippet = buildSnippet(doc, terms, cluster, contextChars);
    if (!snippet) continue;

    // 长段落里相邻命中可能生成高度重叠的窗口，只保留第一份
    const key = snippet.segments.map((segment) => segment.text).join('').slice(0, 48);
    if (seen.has(key)) continue;
    seen.add(key);
    snippets.push(snippet);
  }

  return snippets;
};

/**
 * 执行一次搜索。
 *
 * @param {ReturnType<typeof prepareIndex>} prepared 预处理后的索引
 * @param {string} rawQuery 访客输入
 * @param {object} [options]
 * @returns {{
 *   query: string,
 *   terms: string[],
 *   mode: 'all' | 'any',
 *   results: Array<object>,
 *   totalMatches: number,
 *   candidateCount: number
 * }}
 *   mode 为 'all' 表示全部关键词均命中的结果；没有这种结果时退化为 'any'（命中任意关键词）。
 */
export const searchIndex = (prepared, rawQuery, options = {}) => {
  const terms = parseQuery(rawQuery);
  const { maxResults, snippetsPerDoc, contextChars } = { ...DEFAULTS, ...options };
  const query = String(rawQuery ?? '').trim();

  if (!terms.length) {
    return { query: '', terms: [], mode: 'all', results: [], totalMatches: 0, candidateCount: 0 };
  }

  const queryLower = lowerForMatch(query);
  const entries = [];

  for (const doc of prepared) {
    const stats = terms.map((term) => {
      const title = countMatches(doc.titleLower, term.lower, MAX_TITLE_HITS);
      const summary = countMatches(doc.summaryLower, term.lower, MAX_SUMMARY_HITS);
      const tags = doc.tagLowers.reduce(
        (sum, tag) => sum + countMatches(tag, term.lower, MAX_TAG_HITS),
        0,
      );
      const heading = doc.sectionLowers.reduce(
        (sum, sectionTitle) => sum + countMatches(sectionTitle, term.lower, MAX_HEADING_HITS),
        0,
      );
      const body = countMatches(doc.textLower, term.lower, MAX_BODY_HITS);
      return { title, summary, tags, heading, body, total: title + summary + tags + heading + body };
    });

    const matchedTerms = stats.filter((stat) => stat.total > 0).length;
    if (!matchedTerms) continue;

    const score = stats.reduce((sum, stat) => {
      return (
        sum +
        stat.title * 120 +
        stat.summary * 40 +
        stat.tags * 30 +
        stat.heading * 15 +
        Math.min(stat.body, 20) * 4
      );
    }, 0);

    entries.push({
      doc,
      stats,
      matchedTerms,
      score: doc.titleLower === queryLower ? score + 600 : score,
    });
  }

  const allMode = entries.some((entry) => entry.matchedTerms === terms.length);
  const candidates = allMode
    ? entries.filter((entry) => entry.matchedTerms === terms.length)
    : entries;

  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      b.doc.dateValue - a.doc.dateValue ||
      String(a.doc.id).localeCompare(String(b.doc.id)),
  );

  const results = candidates.slice(0, maxResults).map((entry) => {
    const doc = entry.doc;
    const snippets = buildDocSnippets(doc, terms, { snippetsPerDoc, contextChars });

    return {
      id: doc.id,
      title: doc.title,
      summary: doc.summary,
      category: doc.category,
      tags: doc.tags,
      date: doc.date,
      wordCount: doc.wordCount,
      score: entry.score,
      matchCount: entry.stats.reduce((sum, stat) => sum + stat.total, 0),
      missingTerms: terms
        .filter((_, index) => entry.stats[index].total === 0)
        .map((term) => term.value),
      titleSegments: buildHighlightSegments(doc.title, terms),
      summarySegments: buildHighlightSegments(doc.summary, terms),
      tagSegments: doc.tags.map((tag) => buildHighlightSegments(tag, terms)),
      snippets,
      matchedIn: {
        title: entry.stats.some((stat) => stat.title > 0),
        summary: entry.stats.some((stat) => stat.summary > 0),
        tags: entry.stats.some((stat) => stat.tags > 0),
        body: entry.stats.some((stat) => stat.body > 0),
      },
    };
  });

  return {
    query,
    terms: terms.map((term) => term.value),
    mode: allMode ? 'all' : 'any',
    results,
    totalMatches: results.reduce((sum, result) => sum + result.matchCount, 0),
    candidateCount: candidates.length,
  };
};

export { DEFAULTS as SEARCH_DEFAULTS };

// 把 Markdown 正文转换成「可搜索的纯文本」。
//
// 该模块不依赖任何浏览器 / Node 专有 API：
//   - 构建期由 build/article-data.js 调用，生成全站搜索索引；
//   - 浏览器的搜索核心、Node 测试脚本复用同一份实现，
//     保证「索引里的文本」和「预览里展示的文本」始终一致。
//
// 与旧实现（整段正则替换）相比，这里按行扫描，重点解决：
//   1. CRLF 换行导致 ``` 围栏代码块删不掉，搜索结果被代码淹没；
//   2. 代码块需要保留（方便搜索代码），但要标记区间，便于预览时注明「代码」；
//   3. 记录每个标题在正文中的偏移量，预览时可以告诉访客「命中在哪个章节」。

const FENCE_OPEN_RE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)[ \t]*$/;
const HEADING_RE = /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/;
const HR_RE = /^ {0,3}(?:(?:-[ \t]*){3,}|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})$/;
const TABLE_DIVIDER_RE = /^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(?:\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/;
const LIST_MARKER_RE = /^ {0,3}(?:[-*+]|\d{1,9}[.)])[ \t]+(?:\[[ xX]\][ \t]+)?/;
const QUOTE_MARKER_RE = /^ {0,3}>[ \t]?/;
const TOC_MARKER_RE = /^[ \t]*\[toc\][ \t]*$/i;
const FRONT_MATTER_RE = /^---\n[\s\S]*?\n---[ \t]*(?:\n|$)/;

// 行内 Markdown → 纯文本：保留可读文字，丢弃排版符号
const stripInlineMarkdown = (line) => {
  let text = String(line ?? '');

  // 目录占位标记（兼容 [TOC]、[[[toc]]] 这类手误写法）
  text = text.replace(/\[+\s*toc\s*\]+/gi, ' ');
  // 图片整体丢弃（替代文本多为图片说明，噪声大于信息量）
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  // 链接保留链接文字
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // 引用式链接 [文字][引用]
  text = text.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1');
  // 脚注引用
  text = text.replace(/\[\^[^\]]*\]/g, '');
  // 裸自动链接 <https://...>
  text = text.replace(/<((?:https?|mailto):[^>\s]+)>/gi, '$1');
  // HTML 注释与标签
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  text = text.replace(/<[^>\n]{0,200}>/g, ' ');
  // 行内代码：去掉反引号，保留代码文字（便于搜索 API / 关键字）
  text = text.replace(/``\s*([^`]*?)\s*``/g, '$1');
  text = text.replace(/`([^`]*)`/g, '$1');
  // 强调、删除线
  text = text.replace(/\*\*\*|\*\*|__|~~/g, '');
  text = text.replace(/\*/g, '');
  // Markdown 转义
  text = text.replace(/\\([\\`*_{}[\]()#+\-.!|>~])/g, '$1');
  // 常见 HTML 实体
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&');

  return text.replace(/\s+/g, ' ').trim();
};

// 标题行 → 标题文字（同时去掉标题中的行内标记）
const parseHeading = (line) => {
  const match = HEADING_RE.exec(line);
  if (!match) return null;
  return stripInlineMarkdown(match[2]) || null;
};

// 围栏闭合判定：同种字符、数量不少于 3、整行只有围栏
const isFenceClose = (line, fenceChar) => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed[0] !== fenceChar) return false;
  return /^(`{3,}|~{3,})$/.test(trimmed);
};

/**
 * 将 Markdown 正文转换为搜索用纯文本。
 *
 * @param {string} markdown Markdown 正文（可包含 front matter，会被忽略）
 * @returns {{ text: string, sections: Array<{offset: number, level: number, title: string}>, codeRanges: Array<{start: number, end: number, lang: string}> }}
 *   - text：归一化后的纯文本，段落之间用空行（\n\n）分隔，代码块内部保留换行；
 *   - sections：每个标题在 text 中的起始偏移；
 *   - codeRanges：代码块在 text 中的区间，预览时用来标注「代码」。
 */
export const markdownToSearchText = (markdown) => {
  const source = String(markdown ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(FRONT_MATTER_RE, '');

  const lines = source.split('\n');
  const blocks = [];
  let paragraph = [];
  let pendingHeading = null;
  let fenceChar = '';
  let fenceLang = '';
  let codeLines = [];

  const pushHeading = () => {
    if (!pendingHeading) return;
    blocks.push({ type: 'text', value: pendingHeading, heading: pendingHeading });
    pendingHeading = null;
  };

  const flushParagraph = () => {
    pushHeading();
    if (!paragraph.length) return;
    const value = paragraph.join(' ').replace(/\s+/g, ' ').trim();
    paragraph = [];
    if (value) blocks.push({ type: 'text', value });
  };

  const flushCode = () => {
    pushHeading();
    const value = codeLines.join('\n').replace(/^\s+|\s+$/g, '');
    const lang = fenceLang;
    codeLines = [];
    fenceLang = '';
    if (value) blocks.push({ type: 'code', value, lang });
  };

  for (const line of lines) {
    // 代码块内部：只找闭合围栏
    if (fenceChar) {
      if (isFenceClose(line, fenceChar)) {
        flushCode();
        fenceChar = '';
      } else {
        codeLines.push(line);
      }
      continue;
    }

    // 围栏代码块起始
    const fenceMatch = FENCE_OPEN_RE.exec(line);
    if (fenceMatch) {
      flushParagraph();
      fenceChar = fenceMatch[1][0];
      fenceLang = fenceMatch[2] || '';
      continue;
    }

    // 空行：段落结束
    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    // 目录占位标记
    if (TOC_MARKER_RE.test(line)) continue;

    // 分隔线
    if (HR_RE.test(line)) {
      flushParagraph();
      continue;
    }

    // 标题
    const headingTitle = parseHeading(line);
    if (headingTitle) {
      flushParagraph();
      const level = HEADING_RE.exec(line)[1].length;
      pendingHeading = headingTitle;
      // 记录层级，便于以后做「跳到章节」之类的扩展
      blocks.push({ type: 'marker', level });
      continue;
    }

    // 表格分隔行
    if (TABLE_DIVIDER_RE.test(line)) continue;

    // 表格行：去掉两侧竖线，单元格之间用空格分隔
    let content = line;
    if (/^ {0,3}\|/.test(content) || /\|[ \t]*$/.test(content)) {
      content = content
        .replace(/^[ \t]*\|/, '')
        .replace(/\|[ \t]*$/, '')
        .replace(/\|/g, ' ');
    }

    // 引用、无序/有序列表标记
    content = content.replace(QUOTE_MARKER_RE, '').replace(LIST_MARKER_RE, '');

    const cleaned = stripInlineMarkdown(content);
    if (cleaned) paragraph.push(cleaned);
  }

  // 文件末尾仍停留在代码块内（未闭合）：也要收录
  if (fenceChar) flushCode();
  flushParagraph();

  // 组装最终文本，同时计算各标题 / 代码块的偏移量
  const parts = [];
  const sections = [];
  const codeRanges = [];
  let offset = 0;
  let headingLevel = 2;

  blocks.forEach((block, index) => {
    if (block.type === 'marker') {
      headingLevel = block.level;
      return;
    }
    if (index > 0 && parts.length) {
      parts.push('\n\n');
      offset += 2;
    }
    if (block.heading) {
      sections.push({ offset, level: headingLevel, title: block.heading });
    }
    const start = offset;
    parts.push(block.value);
    offset += block.value.length;
    if (block.type === 'code') {
      codeRanges.push({ start, end: offset, lang: block.lang || '' });
    }
  });

  return { text: parts.join(''), sections, codeRanges };
};

export default markdownToSearchText;

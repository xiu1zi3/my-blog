// 搜索功能的回归测试（纯 Node，无浏览器依赖）。
//
// 运行：node tests/search.test.mjs
//
// 覆盖：
//   1. Markdown → 纯文本（CRLF、代码块、表格、列表、front matter）；
//   2. 构建期索引（真实文章）的完整性与大小；
//   3. 关键词解析（多词 AND、引号短语、去重）；
//   4. 搜索排序、命中统计、章节标注、代码片段标注；
//   5. 上下文预览的分段/高亮不丢字、不越界；
//   6. 边界输入（空串、正则元字符、极短词）不抛异常、不卡死。

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { markdownToSearchText } from '../src/utils/markdownText.js';
import {
  parseQuery,
  prepareIndex,
  searchIndex,
  buildHighlightSegments,
} from '../src/utils/searchCore.js';
import { buildSearchDocs, collectArticleMeta } from '../build/article-data.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const articlesDir = path.resolve(currentDir, '../src/articles');

let passed = 0;
const failures = [];

const test = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`  ✗ ${name}`);
    console.error(`     ${error.message}`);
  }
};

const joinSegments = (segments) => segments.map((segment) => segment.text).join('');
const hitSegments = (segments) => segments.filter((segment) => segment.hit).map((segment) => segment.text);

// ---------------------------------------------------------------------------
// 1. Markdown → 纯文本
// ---------------------------------------------------------------------------

console.log('\n[1] Markdown → 纯文本');

test('CRLF + 围栏代码块：完整剥离代码围栏并保留代码文字', () => {
  const markdown = [
    '---',
    'title: 测试文章',
    'tags: [A, B]',
    '---',
    '',
    '[toc]',
    '',
    '# 第一章',
    '',
    '这是 **正文**，包含 `inline` 与 [链接](https://example.com)。',
    '',
    '```python',
    'print("hello 代码")',
    '```',
    '',
    '## 小节',
    '',
    '第二段 &amp; 实体。',
  ].join('\r\n');

  const { text, sections, codeRanges } = markdownToSearchText(markdown);

  assert.ok(!text.includes('\r'), '不应残留 \\r');
  assert.ok(!text.includes('```'), '不应残留代码围栏');
  assert.ok(!text.includes('title:'), '不应包含 front matter');
  assert.ok(!text.includes('[toc]'), '不应包含 [toc]');
  assert.ok(!text.includes('**'), '不应包含强调标记');

  assert.ok(text.includes('第一章'), '标题应保留');
  assert.ok(text.includes('这是 正文'), '强调标记应被去掉');
  assert.ok(text.includes('inline'), '行内代码文字应保留');
  assert.ok(text.includes('链接'), '链接文字应保留');
  assert.ok(!text.includes('example.com'), '链接地址应去掉');
  assert.ok(text.includes('print("hello 代码")'), '代码块文字应保留');
  assert.ok(text.includes('第二段 & 实体'), 'HTML 实体应还原');

  assert.equal(sections.length, 2, '应记录两个标题');
  assert.deepEqual(sections.map((section) => section.title), ['第一章', '小节']);
  for (const section of sections) {
    assert.ok(
      text.slice(section.offset).startsWith(section.title),
      `章节偏移应指向标题文字：${section.title}`,
    );
  }

  assert.equal(codeRanges.length, 1, '应记录一个代码块区间');
  const [range] = codeRanges;
  assert.equal(range.lang, 'python');
  assert.ok(text.slice(range.start, range.end).includes('hello 代码'));
});

test('表格 / 列表 / 引用 / 分隔线 / 未闭合代码块', () => {
  const markdown = [
    '> 引用内容',
    '',
    '- 列表项一',
    '- 列表项二',
    '1. 有序项',
    '',
    '| 名称 | 说明 |',
    '| --- | --- |',
    '| A | B |',
    '',
    '---',
    '',
    '~~~',
    '未闭合的代码块内容',
  ].join('\n');

  const { text, codeRanges } = markdownToSearchText(markdown);

  assert.ok(text.includes('引用内容'));
  assert.ok(text.includes('列表项一'));
  assert.ok(text.includes('有序项'));
  assert.ok(text.includes('名称 说明'), '表格单元格应以空格分隔');
  assert.ok(!text.includes('|'), '不应残留表格竖线');
  assert.ok(!text.includes('---'), '不应残留分隔线');
  assert.ok(text.includes('未闭合的代码块内容'), '未闭合代码块也应收录');
  assert.equal(codeRanges.length, 1);
});

test('无 front matter / 空内容不抛异常', () => {
  assert.deepEqual(markdownToSearchText(''), { text: '', sections: [], codeRanges: [] });
  assert.deepEqual(markdownToSearchText(undefined), { text: '', sections: [], codeRanges: [] });
  const { text } = markdownToSearchText('普通一行文字');
  assert.equal(text, '普通一行文字');
});

// ---------------------------------------------------------------------------
// 2. 构建期索引
// ---------------------------------------------------------------------------

console.log('\n[2] 构建期索引（真实文章）');

const meta = collectArticleMeta(articlesDir);
const docs = buildSearchDocs(articlesDir);
const prepared = prepareIndex(docs);

test('索引覆盖全部文章且字段完整', () => {
  const mdFiles = fs.readdirSync(articlesDir).filter((name) => name.endsWith('.md'));
  assert.equal(docs.length, mdFiles.length, '索引文章数应与 Markdown 文件数一致');
  assert.equal(meta.length, mdFiles.length, '元数据文章数应与 Markdown 文件数一致');

  for (const doc of docs) {
    assert.ok(doc.id, '缺少 id');
    assert.ok(doc.title, `文章 ${doc.id} 缺少标题`);
    assert.ok(typeof doc.text === 'string' && doc.text.length > 0, `文章 ${doc.id} 正文为空`);
    assert.ok(Array.isArray(doc.tags), `文章 ${doc.id} tags 应为数组`);
  }
});

test('索引文本已清理 Markdown 标记', () => {
  for (const doc of docs) {
    assert.ok(!doc.text.includes('\r'), `文章 ${doc.id} 残留 \\r`);
    assert.ok(!doc.text.includes('```'), `文章 ${doc.id} 残留代码围栏`);
    assert.ok(!doc.text.includes('[toc]'), `文章 ${doc.id} 残留 [toc]`);
    assert.ok(!doc.text.startsWith('title:'), `文章 ${doc.id} 混入 front matter`);
  }
});

test('章节与代码块偏移量有效', () => {
  for (const doc of docs) {
    let lastOffset = -1;
    for (const section of doc.sections) {
      assert.ok(section.offset > lastOffset, `文章 ${doc.id} 章节偏移应递增`);
      lastOffset = section.offset;
      assert.ok(
        doc.text.slice(section.offset).startsWith(section.title),
        `文章 ${doc.id} 章节偏移未指向标题：${section.title}`,
      );
    }
    for (const range of doc.codeRanges) {
      assert.ok(range.start >= 0 && range.end > range.start, `文章 ${doc.id} 代码块区间无效`);
      assert.ok(range.end <= doc.text.length, `文章 ${doc.id} 代码块区间越界`);
    }
  }
});

test('索引体积可控（单文件即可承载）', () => {
  const payload = JSON.stringify({ docs });
  const bytes = Buffer.byteLength(payload, 'utf8');
  const plainChars = docs.reduce((sum, doc) => sum + doc.text.length, 0);
  console.log(`     索引 JSON 体积：${(bytes / 1024).toFixed(1)} KB，纯文本 ${plainChars.toLocaleString()} 字`);
  assert.ok(bytes < 2 * 1024 * 1024, `索引体积过大：${bytes} 字节`);
});

// ---------------------------------------------------------------------------
// 3. 关键词解析
// ---------------------------------------------------------------------------

console.log('\n[3] 关键词解析');

test('空白分隔多个关键词', () => {
  const terms = parseQuery('  agent   上下文 ');
  assert.deepEqual(terms.map((term) => term.value), ['agent', '上下文']);
  assert.ok(terms.every((term) => term.phrase === false));
});

test('英文双引号表示精确短语', () => {
  const terms = parseQuery('"Super-agent 设计" 架构');
  assert.equal(terms.length, 2);
  assert.equal(terms[0].value, 'Super-agent 设计');
  assert.equal(terms[0].phrase, true);
  assert.equal(terms[1].value, '架构');
});

test('中文引号同样支持，且忽略大小写去重', () => {
  const terms = parseQuery('“多智能体” Agent agent AGENT');
  assert.deepEqual(terms.map((term) => term.value), ['多智能体', 'Agent']);
  assert.equal(terms[0].phrase, true);
});

test('空输入 / 纯空白返回空数组', () => {
  assert.deepEqual(parseQuery(''), []);
  assert.deepEqual(parseQuery('   \t\n '), []);
});

test('最多保留 8 个关键词', () => {
  const terms = parseQuery('1 2 3 4 5 6 7 8 9 10');
  assert.equal(terms.length, 8);
});

// ---------------------------------------------------------------------------
// 4. 搜索行为
// ---------------------------------------------------------------------------

console.log('\n[4] 搜索行为');

test('基本命中：结果按相关度降序，字段齐全', () => {
  const outcome = searchIndex(prepared, 'Agent');
  assert.ok(outcome.results.length > 0, 'Agent 应有命中');
  assert.equal(outcome.mode, 'all');
  assert.equal(outcome.query, 'Agent');

  let previousScore = Infinity;
  for (const result of outcome.results) {
    assert.ok(result.id && result.title, '结果缺少 id / title');
    assert.ok(result.score <= previousScore, '结果应按 score 降序');
    previousScore = result.score;
    assert.ok(result.matchCount > 0, '命中数应大于 0');
    assert.ok(result.snippets.length <= 3, '每篇最多 3 段预览');
    assert.ok(Array.isArray(result.titleSegments) && result.titleSegments.length > 0);
    assert.ok(Array.isArray(result.summarySegments) && result.summarySegments.length > 0);
  }
});

test('标题高亮保留原文大小写且不丢字', () => {
  const outcome = searchIndex(prepared, 'agent');
  const withTitleHit = outcome.results.find((result) => result.matchedIn.title);
  assert.ok(withTitleHit, '应存在标题命中的结果');
  const joined = joinSegments(withTitleHit.titleSegments);
  assert.equal(joined, withTitleHit.title, '分段拼接必须还原标题原文');
  const hits = hitSegments(withTitleHit.titleSegments);
  assert.ok(hits.length > 0);
  assert.ok(hits.every((hit) => hit.toLowerCase() === 'agent'), '高亮内容应等于关键词原文');
});

test('预览片段：包含关键词、长度受控、无 Markdown 残留', () => {
  const outcome = searchIndex(prepared, '多智能体');
  assert.ok(outcome.results.length > 0, '多智能体 应有命中');

  for (const result of outcome.results) {
    for (const snippet of result.snippets) {
      const text = joinSegments(snippet.segments);
      assert.ok(text.length > 0, '预览片段不应为空');
      assert.ok(
        text.toLowerCase().includes('多智能体'),
        `预览片段应包含关键词：${text.slice(0, 40)}`,
      );
      assert.ok(text.length <= 320, `预览片段过长：${text.length}`);
      assert.ok(!text.includes('\r') && !text.includes('```'), '预览片段残留 Markdown 标记');
      const hits = hitSegments(snippet.segments);
      assert.ok(hits.length > 0, '预览片段应有高亮');
      assert.equal(snippet.kind === 'code' ? 'code' : 'text', snippet.kind);
    }
  }
});

test('章节标注指向正文中真实存在的标题', () => {
  const outcome = searchIndex(prepared, 'Agent');
  let labelled = 0;
  for (const result of outcome.results) {
    const doc = prepared.find((item) => item.id === result.id);
    for (const snippet of result.snippets) {
      if (!snippet.section) continue;
      labelled += 1;
      assert.ok(
        doc.sections.some((section) => section.title === snippet.section),
        `章节标注不在标题列表中：${snippet.section}`,
      );
      assert.ok(doc.text.includes(snippet.section), '章节标题应出现在正文中');
    }
  }
  assert.ok(labelled > 0, '至少有一个预览片段带章节标注');
});

test('多关键词 AND 语义：结果同时包含全部关键词', () => {
  const outcome = searchIndex(prepared, 'Agent 多智能体');
  if (outcome.mode === 'all') {
    assert.ok(outcome.results.length > 0);
    for (const result of outcome.results) {
      assert.deepEqual(result.missingTerms, [], 'AND 模式不应有缺失关键词');
    }
    const agentOnly = new Set(searchIndex(prepared, 'Agent').results.map((result) => result.id));
    for (const result of outcome.results) {
      assert.ok(agentOnly.has(result.id), 'AND 结果应是单词结果的子集');
    }
  } else {
    // 数据变化时允许退化为 OR，但必须给出提示标记
    assert.ok(outcome.results.length > 0);
    assert.equal(outcome.mode, 'any');
  }
});

test('没有文章同时包含全部关键词时退化为 OR 并给出缺失关键词', () => {
  const outcome = searchIndex(prepared, 'Agent 链表');
  if (outcome.mode === 'any') {
    assert.ok(outcome.results.length > 0);
    assert.ok(outcome.results.some((result) => result.missingTerms.length > 0));
  }
});

test('引号短语按整体匹配', () => {
  const phrase = searchIndex(prepared, '"Super-agent 设计"');
  assert.equal(phrase.terms.length, 1);
  assert.ok(phrase.results.length > 0, '短语应至少命中一篇文章');
  for (const result of phrase.results) {
    const haystack = [
      result.title,
      result.summary,
      result.tags.join(' '),
      result.snippets.map((snippet) => joinSegments(snippet.segments)).join(' '),
    ]
      .join(' ')
      .toLowerCase();
    assert.ok(haystack.includes('super-agent 设计'), `短语应整体命中：${result.id}`);
  }
});

test('空查询返回空结果', () => {
  const outcome = searchIndex(prepared, '   ');
  assert.deepEqual(outcome.results, []);
  assert.equal(outcome.totalMatches, 0);
  assert.deepEqual(outcome.terms, []);
});

test('正则元字符按普通字符处理', () => {
  assert.doesNotThrow(() => searchIndex(prepared, 'a.b(c)*[d]\\'));
  assert.equal(searchIndex(prepared, 'a.b(c)*[d]\\').results.length, 0);
});

test('单字查询也能工作且不超时', () => {
  const started = Date.now();
  const outcome = searchIndex(prepared, '的');
  const elapsed = Date.now() - started;
  console.log(`     单字「的」：${outcome.results.length} 篇 / ${outcome.totalMatches} 处，用时 ${elapsed} ms`);
  assert.ok(outcome.results.length > 0);
  assert.ok(elapsed < 500, `单字查询过慢：${elapsed} ms`);
});

// ---------------------------------------------------------------------------
// 5. 代码块命中标注
// ---------------------------------------------------------------------------

console.log('\n[5] 代码块命中标注');

test('代码块内的命中标注为 code，正文命中标注为 text', () => {
  const text = '开头段落\n\nconst useStateValue = 100;\n\n结尾段落';
  const start = text.indexOf('const useStateValue');
  const end = start + 'const useStateValue = 100;'.length;
  const mockIndex = prepareIndex([
    {
      id: 'mock',
      title: '模拟文章',
      summary: '摘要',
      category: '测试',
      tags: [],
      date: '2024-01-01',
      text,
      sections: [],
      codeRanges: [{ start, end, lang: 'js' }],
    },
  ]);

  const codeOutcome = searchIndex(mockIndex, 'useStateValue');
  assert.equal(codeOutcome.results.length, 1);
  assert.equal(codeOutcome.results[0].snippets.length, 1);
  assert.equal(codeOutcome.results[0].snippets[0].kind, 'code');
  assert.equal(codeOutcome.results[0].snippets[0].lang, 'js');

  const textOutcome = searchIndex(mockIndex, '结尾段落');
  assert.equal(textOutcome.results[0].snippets[0].kind, 'text');
});

// ---------------------------------------------------------------------------
// 6. 高亮分段
// ---------------------------------------------------------------------------

console.log('\n[6] 高亮分段');

test('分段拼接还原原文，且命中区间正确', () => {
  const terms = parseQuery('World 工具');
  const segments = buildHighlightSegments('Hello World，这是工具链。', terms);
  assert.equal(joinSegments(segments), 'Hello World，这是工具链。');
  assert.deepEqual(hitSegments(segments), ['World', '工具']);
});

test('重叠关键词合并为一个高亮区间', () => {
  const terms = parseQuery('agent "agent 系统"');
  const segments = buildHighlightSegments('agent 系统设计', terms);
  assert.equal(joinSegments(segments), 'agent 系统设计');
  assert.deepEqual(hitSegments(segments), ['agent 系统']);
});

test('没有命中时返回单段原文', () => {
  const segments = buildHighlightSegments('nothing here', parseQuery('react'));
  assert.deepEqual(segments, [{ text: 'nothing here', hit: false }]);
  assert.deepEqual(buildHighlightSegments('', parseQuery('x')), []);
});

// ---------------------------------------------------------------------------
// 7. 性能
// ---------------------------------------------------------------------------

console.log('\n[7] 性能');

test('索引预处理与常见查询耗时在预算内', () => {
  const prepareStart = Date.now();
  const fresh = prepareIndex(docs);
  const prepareElapsed = Date.now() - prepareStart;

  const queries = ['Agent', 'React', '链表', '上下文工程', '多智能体'];
  const queryStart = Date.now();
  for (const query of queries) searchIndex(fresh, query);
  const queryElapsed = Date.now() - queryStart;
  const average = (queryElapsed / queries.length).toFixed(1);

  console.log(`     预处理 ${prepareElapsed} ms，${queries.length} 次查询共 ${queryElapsed} ms（平均 ${average} ms）`);
  assert.ok(prepareElapsed < 3000, `预处理过慢：${prepareElapsed} ms`);
  assert.ok(queryElapsed / queries.length < 300, `平均查询过慢：${average} ms`);
});

// ---------------------------------------------------------------------------
// 汇总
// ---------------------------------------------------------------------------

console.log(`\n通过 ${passed} 项，失败 ${failures.length} 项`);

if (failures.length > 0) {
  console.error('\n失败详情：');
  for (const { name, error } of failures) {
    console.error(`- ${name}\n  ${error.stack || error.message}`);
  }
  process.exitCode = 1;
}

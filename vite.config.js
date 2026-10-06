import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const articlesDir = path.resolve(__dirname, 'src/articles')

// 虚拟模块：文章元数据索引（构建期由 front matter 生成）
const VIRTUAL_ID = 'virtual:article-meta'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

// 宽松解析 [a, b, c] 形式的数组（兼容不带引号的中文元素）
const parseArrayValue = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return value
      .slice(1, -1)
      .split(',')
      .map(item => item.trim())
      .map(item => {
        if (
          (item.startsWith('"') && item.endsWith('"')) ||
          (item.startsWith("'") && item.endsWith("'"))
        ) {
          return item.slice(1, -1)
        }
        return item
      })
  }
}

// 统计正文"字数"：中文字符按 1 计，英文按单词计。
// 该数值用于文章页展示字数 & 阅读时长，以及首页的字数里程碑。
const countWords = (content) => {
  let text = content
  // 围栏代码块
  .replace(/(^|\n)(```|~~~)[\s\S]*?(```|~~~)(?=\n|$)/g, '\n')
  // 行内代码
  .replace(/`[^`]*`/g, ' ')
  // 图片（连同替代文本一起去掉，避免图片描述计入字数）
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  // 链接：保留链接文本
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  // HTML 标签
  .replace(/<[^>]+>/g, ' ')
  // Markdown 标题、列表、引用标记
  .replace(/^#+\s+/gm, '')
  .replace(/^[-*+]\s+/gm, '')
  .replace(/^>\s?/gm, '')
  // 强调符号
  .replace(/[*_~`]/g, '');

  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
};

// 与客户端 src/utils/articles.js 一致的宽松 front matter 解析，
// 不依赖严格 YAML，兼容 title:📚xxx、无引号中文数组等写法
const parseFrontMatter = (raw) => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) return {}

  const data = {}
  match[1].split(/\r?\n/).forEach((line) => {
    const pair = line.match(/^(\w+):\s*(.+)$/)
    if (!pair) return

    const key = pair[1]
    let value = pair[2]

    if (value.startsWith('[')) {
      value = parseArrayValue(value)
    }
    if (key === 'tags' && typeof value === 'string' && value.startsWith('[')) {
      value = parseArrayValue(value)
    }

    data[key] = value
  })

  return data
}

// 扫描所有 Markdown 文件，只提取列表页需要的元数据（不含正文）
const collectArticleMeta = () => {
  if (!fs.existsSync(articlesDir)) return []

  const list = fs
    .readdirSync(articlesDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const id = name.replace(/\.md$/, '')
      const raw = fs.readFileSync(path.join(articlesDir, name), 'utf-8')
      const data = parseFrontMatter(raw)
      // 剥离 front matter 后再统计正文字数
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')

      return {
        id,
        ...data,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        date: data.date || '',
        wordCount: countWords(body),
      }
    })

  // 按日期降序排序
  return list.sort((a, b) => {
    const diff = Date.parse(b.date) - Date.parse(a.date)
    return Number.isNaN(diff) ? 0 : diff
  })
}

// 提供 virtual:article-meta 虚拟模块
const articleMetaPlugin = () => ({
  name: 'article-meta',
  resolveId(id) {
    if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
  },
  load(id) {
    if (id === RESOLVED_VIRTUAL_ID) {
      const meta = collectArticleMeta()
      return `const articles = ${JSON.stringify(meta)};\nexport default articles;\n`
    }
  },
  // dev 模式下文章新增/修改/删除时刷新虚拟模块
  configureServer(server) {
    const refresh = (file) => {
      if (path.dirname(file) !== articlesDir || !file.endsWith('.md')) return
      const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
      if (mod) {
        server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
    }
    server.watcher.add(path.join(articlesDir, '*.md'))
    server.watcher.on('add', refresh)
    server.watcher.on('change', refresh)
    server.watcher.on('unlink', refresh)
  },
})

export default defineConfig({
  plugins: [react(), articleMetaPlugin()],
  base: '/',
})

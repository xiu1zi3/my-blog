// 手动解析 Markdown 文件的 front matter
const parseFrontMatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content };
  }
  
  const frontMatter = match[1];
  const markdownContent = match[2];
  const data = {};
  
  // 解析 front matter
  frontMatter.split(/\r?\n/).forEach(line => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const key = match[1];
      let value = match[2];
      
      // 处理数组
      if (value.startsWith('[')) {
        try {
          // 尝试直接解析
          value = JSON.parse(value);
        } catch (e) {
          // 解析失败，尝试手动解析没有双引号的数组
          try {
            // 移除首尾的方括号
            const arrayContent = value.substring(1, value.length - 1);
            // 分割数组元素
            const elements = arrayContent.split(',').map(item => item.trim());
            // 移除元素中的引号（如果有）
            value = elements.map(item => {
              if ((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'"))) {
                return item.substring(1, item.length - 1);
              }
              return item;
            });
          } catch (e2) {
            // 解析失败，保持原样
          }
        }
      }
      
      // 确保 tags 是数组
      if (key === 'tags' && typeof value === 'string') {
        try {
          // 尝试直接解析
          value = JSON.parse(value);
        } catch (e) {
          // 解析失败，尝试手动解析没有双引号的数组
          try {
            // 移除首尾的方括号
            const arrayContent = value.substring(1, value.length - 1);
            // 分割数组元素
            const elements = arrayContent.split(',').map(item => item.trim());
            // 移除元素中的引号（如果有）
            value = elements.map(item => {
              if ((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'"))) {
                return item.substring(1, item.length - 1);
              }
              return item;
            });
          } catch (e2) {
            // 解析失败，转换为单元素数组
            value = [value];
          }
        }
      }
      
      data[key] = value;
    }
  });
  
  return { data, content: markdownContent };
};

// 使用 Vite 的 import.meta.glob 功能加载所有 Markdown 文件
const markdownFiles = import.meta.glob('../articles/*.md', { query: '?raw', import: 'default' });

// 获取所有文章列表
export const getArticles = async () => {
  const articles = [];
  
  // 遍历所有 Markdown 文件
  for (const [path, contentPromise] of Object.entries(markdownFiles)) {
    // 提取 ID，处理 Windows 和 Unix 路径
    const id = path.split(/[/\\]/).pop().replace(/\.md$/, '');
    
    // 获取文件内容
    const content = await contentPromise();
    
    // 解析 front matter 和内容
    const { data, content: markdownContent } = parseFrontMatter(content);
    
    articles.push({
      id,
      ...data,
      content: markdownContent
    });
  }
  
  // 按日期降序排序
  return articles.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// 获取单篇文章
export const getArticle = async (id) => {
  const articles = await getArticles();
  return articles.find(article => String(article.id) === String(id)) || null;
};

// 获取所有分类
export const getCategories = async () => {
  const articles = await getArticles();
  const categories = [...new Set(articles.map(article => article.category))];
  return categories;
};

// 根据分类获取文章
export const getArticlesByCategory = async (category) => {
  const articles = await getArticles();
  return articles.filter(article => article.category === category);
};

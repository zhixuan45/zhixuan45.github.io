const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// 自定义 Renderer，支持 `<figure>` 和路径自动寻址
const renderer = new marked.Renderer();
renderer.image = function ({href, title, text}) {
    let out = `<figure>\n`;
    out += `  <img src="${href}" alt="${text || ''}"`;
    if (title) {
        out += ` title="${title}"`;
    }
    out += ` />\n`;
    if (text) {
        out += `  <figcaption>${text}</figcaption>\n`;
    }
    out += `</figure>`;
    return out;
};
marked.use({ renderer });

// 路径配置
const REPO_URL = 'https://zhixuan45.github.io'; 
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const ARTICLES_DIR = path.join(__dirname, 'articles');
const DATA_FILE = path.join(__dirname, 'data', 'posts.json');
const ROOT_DIR = __dirname;

// 递归获取所有 Markdown 文件
function getAllMarkdownFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllMarkdownFiles(filePath, fileList);
        } else if (file.endsWith('.md')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const mdFiles = getAllMarkdownFiles(ARTICLES_DIR);
const posts = [];

// 解析文件数据
mdFiles.forEach(file => {
    const relativePath = path.relative(ARTICLES_DIR, file);
    const dirArr = path.dirname(relativePath).split(path.sep);
    
    // 如果文件就在 articles 根目录，则无分类；如果在子目录，则首个子目录名为分类名
    const category = dirArr[0] !== '.' ? dirArr[0] : '默认';
    const id = relativePath.slice(0, -3).replace(/\\/g, '/'); // 移除 .md，统一斜杠
    const fileName = path.basename(file, '.md');
    
    const stats = fs.statSync(file);
    const dateFormatted = stats.mtime.toISOString().split('T')[0];

    // 尝试提取文件内第一行作为文章开头摘要
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0 && !line.startsWith('#') && !line.startsWith('!'));
    let summary = '暂无摘要内容...';
    if(lines.length > 0) {
        summary = lines[0].substring(0, 50) + '...';
    }

    posts.push({
        id: id,
        title: fileName,
        date: dateFormatted,
        category: category,
        file: file,
        summary: summary,
        content: content
    });
});

// 按照时间倒序
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// 创建博客卡片 HTML
function createPostCardHTML(post) {
    return `
        <a href="articles/${post.id}.html" class="post-card glass-container" data-category="${post.category}">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-meta">${post.date} - ${post.category}</div>
            <p class="post-summary">${post.summary}</p>
        </a>
    `;
}

// 1. 构建主页 (index.html)
const indexTpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html'), 'utf-8');
const recentCards = posts.slice(0, 3).map(createPostCardHTML).join('\n');
fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), indexTpl.replace('{{RECENT_POSTS_INJECT}}', recentCards));

// 2. 构建归档页 (blog.html)
const blogTpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'blog.html'), 'utf-8');
const allCards = posts.map(createPostCardHTML).join('\n');

const categories = new Set(posts.map(p => p.category));
let btnHTML = `<button class="category-btn glass-container active" data-category="all" style="background: var(--primary-color); color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius: 0.5rem; transition: background 0.3s;">全部</button>`;
categories.forEach(cat => {
    btnHTML += `\n<button class="category-btn glass-container" data-category="${cat}" style="padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius: 0.5rem; background: var(--card-bg); color: var(--text-color); transition: background 0.3s, color 0.3s">${cat}</button>`;
});

fs.writeFileSync(path.join(ROOT_DIR, 'blog.html'), blogTpl
    .replace('{{ALL_POSTS_INJECT}}', allCards)
    .replace('{{CATEGORIES_INJECT}}', btnHTML)
);

// 3. 构建文章页面
const postTpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'post.html'), 'utf-8');
let sitemapUrls = `<url><loc>${REPO_URL}/</loc></url>\n<url><loc>${REPO_URL}/blog.html</loc></url>\n`;

posts.forEach(post => {
    const htmlContent = marked.parse(post.content);
    const postHtmlPath = path.join(ARTICLES_DIR, `${post.id}.html`);
    
    // 确保子文件夹的存在才能写入
    const targetDir = path.dirname(postHtmlPath);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const articleBlock = `
        <div class="glass-container article-content">
            <h1 style="color:var(--primary-color); margin-bottom:0.5rem;">${post.title}</h1>
            <div class="post-meta" style="margin-bottom:2rem;">发布日期：${post.date} | 分类：${post.category}</div>
            <div id="md-content">${htmlContent}</div>
        </div>
    `;

    const finalHtml = postTpl
        .replace('{{POST_TITLE}}', post.title)
        .replace('{{ARTICLE_CONTENT_INJECT}}', articleBlock);
    
    // 计算要跳回根目录返回多级路径
    const relativeToRoot = path.relative(targetDir, ROOT_DIR).replace(/\\/g, '/');
    const rootRef = relativeToRoot ? relativeToRoot + '/' : './';

    const resolvedHtml = finalHtml
        .replace(/href="index\.html"/g, `href="${rootRef}index.html"`)
        .replace(/href="blog\.html"/g, `href="${rootRef}blog.html"`)
        .replace(/href="assets\//g, `href="${rootRef}assets/`)
        .replace(/href="pages\//g, `href="${rootRef}pages/`)
        .replace(/src="assets\//g, `src="${rootRef}assets/`);

    fs.writeFileSync(postHtmlPath, resolvedHtml);

    // URI 编码应对中文路径
    const safeUrl = encodeURI(`${REPO_URL}/articles/${post.id}.html`);
    sitemapUrls += `<url><loc>${safeUrl}</loc></url>\n`;
});

// 4. 写入 Sitemap
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}</urlset>`;
fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemap);

// 自动生成一份新的 posts.json 供备份或第三方查询借用
fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 4));

console.log('Build completed successfully and auto-categorized!');

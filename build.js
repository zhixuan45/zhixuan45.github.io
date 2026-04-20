const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// 为图片添加 <figure> 排版注脚的自定义 Renderer
const renderer = new marked.Renderer();
renderer.image = function (href, title, text) {
    let out = `<figure>\n`;
    out += `  <img src="${href.href}" alt="${text || ''}"`; // marked 11 passes an object for href sometimes, wait, actually in marked 11, it's (token) or (href, title, text) depending on the config. 
    // Wait, marked 11 renderer signature for image is `image({ href, title, text })` ! Let me be careful.
    out += ` />\n`;
    if (text) {
        out += `  <figcaption>${text}</figcaption>\n`;
    }
    out += `</figure>`;
    return out;
};

// Update renderer for marked v11
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
const REPO_URL = 'https://zhixuan45.github.io'; // 用于 Sitemap
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DATA_FILE = path.join(__dirname, 'data', 'posts.json');
const ARTICLES_DIR = path.join(__dirname, 'articles');
const ROOT_DIR = __dirname;

// 读取文章数据
const posts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// 创建博客卡片 HTML
function createPostCardHTML(post) {
    const category = post.category || '未分类';
    return `
        <a href="articles/${post.id}.html" class="post-card glass-container" data-category="${category}">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-meta">${post.date} - ${category}</div>
            <p class="post-summary">${post.summary || ''}</p>
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

const categories = new Set(posts.map(p => p.category || '未分类'));
let btnHTML = `<button class="category-btn glass-container active" data-category="all" style="background: var(--primary-color); color: white; padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius: 0.5rem; transition: background 0.3s;">全部</button>`;
categories.forEach(cat => {
    btnHTML += `\n<button class="category-btn glass-container" data-category="${cat}" style="padding: 0.5rem 1rem; border: none; cursor: pointer; border-radius: 0.5rem; background: var(--card-bg); color: var(--text-color); transition: background 0.3s, color 0.3s">${cat}</button>`;
});

fs.writeFileSync(path.join(ROOT_DIR, 'blog.html'), blogTpl
    .replace('{{ALL_POSTS_INJECT}}', allCards)
    .replace('{{CATEGORIES_INJECT}}', btnHTML)
);

// 3. 构建文章页面 (articles/{id}.html)
const postTpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'post.html'), 'utf-8');
let sitemapUrls = `<url><loc>${REPO_URL}/</loc></url>\n<url><loc>${REPO_URL}/blog.html</loc></url>\n`;

posts.forEach(post => {
    const mdPath = path.join(__dirname, post.file);
    if (!fs.existsSync(mdPath)) {
        console.warn(`[WARN] 找不到 Markdown 文件: ${mdPath}`);
        return;
    }
    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    const htmlContent = marked.parse(mdContent);
    
    const articleBlock = `
        <div class="glass-container article-content">
            <h1 style="color:var(--primary-color); margin-bottom:0.5rem;">${post.title}</h1>
            <div class="post-meta" style="margin-bottom:2rem;">发布日期：${post.date} | 分类：${post.category || '未分类'}</div>
            <div id="md-content">${htmlContent}</div>
        </div>
    `;

    const finalHtml = postTpl
        .replace('{{POST_TITLE}}', post.title)
        .replace('{{ARTICLE_CONTENT_INJECT}}', articleBlock);
    
    // 修正子目录返回根目录的路径链接问题
    const resolvedHtml = finalHtml
        .replace(/href="index\.html"/g, 'href="../index.html"')
        .replace(/href="blog\.html"/g, 'href="../blog.html"')
        .replace(/href="assets\//g, 'href="../assets/')
        .replace(/href="pages\//g, 'href="../pages/')
        .replace(/src="assets\//g, 'src="../assets/');

    fs.writeFileSync(path.join(ARTICLES_DIR, `${post.id}.html`), resolvedHtml);

    // 加入 Sitemap 节点
    sitemapUrls += `<url><loc>${REPO_URL}/articles/${post.id}.html</loc></url>\n`;
});

// 4. 写入 Sitemap
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls}</urlset>`;
fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemap);

console.log('Build completed successfully!');

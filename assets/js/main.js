document.addEventListener('DOMContentLoaded', () => {
    setBackground();
    
    // Check which page we are on
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) {
        renderHome();
    } else if (path.endsWith('blog.html')) {
        renderBlog();
    } else if (path.endsWith('post.html')) {
        renderPost();
    }
});

async function setBackground() {
    try {
        // Using a reliable public API for Bing Images that supports CORS
        // If this fails, CSS fallback applies
        const res = await fetch('https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN');
        const data = await res.json();
        if (data.url) {
            const img = new Image();
            img.onload = () => {
                document.body.style.backgroundImage = `url(${data.url})`;
            };
            img.src = data.url;
        }
    } catch (e) {
        console.warn('Background fetch failed:', e);
        // Fallback is handled by CSS default or we can set a gradient here
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
}

async function loadPosts() {
    try {
        const response = await fetch('data/posts.json');
        if (!response.ok) throw new Error('Failed to load posts');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function renderHome() {
    const posts = await loadPosts();
    const container = document.getElementById('recent-posts');
    if (!container) return;

    // Show latest 3 posts
    const recent = posts.slice(0, 3);
    
    recent.forEach(post => {
        const card = createPostCard(post);
        container.appendChild(card);
    });
}

async function renderBlog() {
    const posts = await loadPosts();
    const container = document.getElementById('all-posts');
    if (!container) return;

    posts.forEach(post => {
        const card = createPostCard(post);
        container.appendChild(card);
    });
}

function createPostCard(post) {
    const a = document.createElement('a');
    a.href = `post.html?id=${post.id}`;
    a.className = 'post-card glass-container';
    
    a.innerHTML = `
        <h3 class="post-title">${post.title}</h3>
        <div class="post-meta">${post.date}</div>
        <p class="post-summary">${post.summary || ''}</p>
    `;
    return a;
}

async function renderPost() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    const container = document.getElementById('article-container');
    
    if (!postId || !container) return;

    const posts = await loadPosts();
    const post = posts.find(p => p.id === postId);

    if (!post) {
        container.innerHTML = '<h1>文章未找到</h1><p>Sorry, article not found.</p>';
        return;
    }

    document.title = `${post.title} - My Blog`;
    
    try {
        const res = await fetch(post.file);
        if (!res.ok) throw new Error('Markdown file not found');
        const markdown = await res.text();
        
        // Render Markdown using marked (assumed loaded via script tag)
        container.innerHTML = `
            <div class="glass-container article-content">
                <h1 style="color:var(--primary-color); margin-bottom:0.5rem;">${post.title}</h1>
                <div class="post-meta" style="margin-bottom:2rem;">${post.date}</div>
                <div id="md-content">${marked.parse(markdown)}</div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<h1>Error loading article</h1><p>${e.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setBackground();
    initMusicPlayer();
    
    initCategoryFilters();
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

function initMusicPlayer() {
    const container = document.querySelector('.music-widget');
    if (!container) return;

    // Clear existing content (hardcoded iframe)
    container.innerHTML = '';

    const sources = {
        cn: {
            name: '网易云 (CN)',
            html: '<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="//music.163.com/outchain/player?type=2&id=2130311359&auto=0&height=66"></iframe>'
        },
        global: {
            name: 'YouTube (Global)',
            html: '<iframe width="280" height="157" src="https://www.youtube.com/embed/0DugaZiG0HQ?si=SlcIz6N2lYIM7gJA&controls=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
        }
    };

    // Default source
    let currentSource = 'cn';

    // Create Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'music-toggle';
    toggleBtn.textContent = 'Switch to ' + sources.global.name;
    
    // Create Player Container
    const playerDiv = document.createElement('div');
    playerDiv.className = 'glass-container';
    playerDiv.style.padding = '10px';
    playerDiv.style.borderRadius = '20px'; // Matching the original somewhat
    playerDiv.innerHTML = sources.cn.html;

    // Toggle Logic
    toggleBtn.addEventListener('click', () => {
        if (currentSource === 'cn') {
            currentSource = 'global';
            playerDiv.innerHTML = sources.global.html;
            toggleBtn.textContent = 'Switch to ' + sources.cn.name;
        } else {
            currentSource = 'cn';
            playerDiv.innerHTML = sources.cn.html;
            toggleBtn.textContent = 'Switch to ' + sources.global.name;
        }
    });

    // Assemble
    container.appendChild(toggleBtn);
    container.appendChild(playerDiv);
}

function initCategoryFilters() {
    const filters = document.querySelectorAll('.category-btn');
    const posts = document.querySelectorAll('.post-card');
    
    if (!filters.length || !posts.length) return;

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(f => {
                f.style.background = 'var(--card-bg)';
                f.style.color = 'var(--text-color)';
            });
            btn.style.background = 'var(--primary-color)';
            btn.style.color = 'white';

            const category = btn.getAttribute('data-category');
            
            posts.forEach(post => {
                if (category === 'all' || post.getAttribute('data-category') === category) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });
        });
    });
}

    const OWNER = '你的用户名';           // 改成你的 GitHub 用户名
    const REPO = '你的用户名.github.io';  // 改成你的仓库名
    const POSTS_DIR = 'posts';

    async function fetchPosts() {
    const url = `./posts/index.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('无法获取列表');
    const files = await res.json();
    return files
    .filter(f => f.name.endsWith('.md'))
    .sort((a, b) => b.name.localeCompare(a.name));
}

    function renderPosts(posts) {
    const container = document.getElementById('posts-container');
    if (posts.length === 0) {
    container.innerHTML = '<p style="color: rgba(255,255,255,0.4);">还没有帖子 📝</p>';
    return;
}
    container.innerHTML = posts.map(post => {
    const name = post.name.replace(/\.md$/, '');
    const parts = name.split('-');
    let date = '未知日期', title = name;
    if (parts.length >= 4) {
    date = `${parts[0]}-${parts[1]}-${parts[2]}`;
    title = parts.slice(3).join('-');
}
    return `
                <div class="post-item" style="
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    justify-content: space-between;
                    cursor: pointer;
                " onclick="window.location.href='posts/post.html?url=${encodeURIComponent(post.download_url)}'">
                    <span style="color: rgba(255,255,255,0.9);">${title}</span>
                    <span style="color: rgba(255,255,255,0.3); font-size: 0.8rem;">${date}</span>
                </div>
            `;
}).join('');
}

    (async function init() {
    try {
    const posts = await fetchPosts();
    renderPosts(posts);
} catch (err) {
    document.getElementById('posts-container').innerHTML =
    `<p style="color: rgba(255,255,255,0.4);">⚠️ 加载失败：${err.message}</p>`;
}
})();
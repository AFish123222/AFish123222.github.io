import(genPostList())

    const OWNER = 'AFish12322';           // 改成你的 GitHub 用户名
    const REPO = 'AFish123222.github.io';  // 改成你的仓库名
    const POSTS_DIR = 'posts';

    async function fetchPosts() {
        return window.genPostList();
    }

    function renderPosts(posts) {
        const container = document.getElementById('posts-container');
        // ...
        container.innerHTML = posts.map(post => {
            // 注意：这里用 post.filename，而不是 name
            const filePath = `posts/postfiles/${post.filename}`;
            return `
            <div ... onclick="window.location.href='posts/post.html?url=${encodeURIComponent(filePath)}'">
                <span>${post.title}</span>
                <span>${post.date}</span>
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
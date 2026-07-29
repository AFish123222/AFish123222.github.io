// 浏览器版：直接通过 GitHub API 获取文件列表并返回
async function genPostList() {
    // ===== 配置 =====
    const OWNER = 'AFish123222';           // 改成你的
    const REPO = 'AFish123222.github.io';  // 改成你的仓库名
    const DIR = 'posts/postfiles';

    try {
        // 调 GitHub API 获取目录内容（这是唯一的外部依赖）
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DIR}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const files = await res.json();

        // === 以下逻辑完全照搬你 gen 脚本里的 ===
        const posts = files
            .filter(f => f.name.endsWith('.html'))
            .sort((a, b) => b.name.localeCompare(a.name))
            .map(f => {
                const name = f.name.replace(/\.html$/, '');
                const parts = name.split('-');
                let date = '未知日期', title = name;
                if (parts.length >= 4) {
                    date = `${parts[0]}-${parts[1]}-${parts[2]}`;
                    title = parts.slice(3).join('-');
                }
                return {
                    filename: f.name,
                    title: title,
                    date: date
                };
            });

        return posts;  // 直接返回数组

    } catch (err) {
        console.error('生成列表失败:', err);
        return [];  // 失败时返回空数组
    }
}

// 暴露给浏览器使用
if (typeof window !== 'undefined') {
    window.genPostList = genPostList;
}
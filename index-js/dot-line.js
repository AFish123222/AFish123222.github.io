
    (function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const CONFIG = {
    count: 50,                // 初始粒子数量
    maxParticles: 300,        // 粒子总数上限（防止卡顿）
    maxDist: 140,             // 连线最大距离（px）
    minLinks: 1-1,           // ★ 新增：最小连接数（每个粒子至少连接1条）
    maxLinks: 4-1,              // ★ 每个粒子最多连接数（已改为2）
    radius: 1.0,              // 粒子半径
    lineColor: '120, 200, 255',   // 线条颜色 (R,G,B)
    particleColor: '180, 220, 255', // 粒子颜色

    baseSpeed: 5,           // 基础游走速度（越大越快）
    turnSpeed: 0.2,          // 随机转向幅度（越大转弯越猛）
    speedJitter: 0.04,        // 速度波动（越大速度变化越随机）

    mouseStrength: 0.02,      // 鼠标吸引强度（正数）
    mouseRepulsion: 0.12,     // 鼠标排斥强度（正数）
    mouseBalance: 60,         // 鼠标斥吸平衡距离（小于此值排斥，大于吸引）
    mouseRadius: 80,          // ★ 鼠标影响半径（已缩小至80）

    repulsionRange: 50,       // 粒子间排斥作用范围
    repulsionStrength: 0.01,  // 粒子间排斥强度（0.01已极弱）

    boundarySoft: 0.02,       // 边界软推力（推回边缘的力度）
    boundaryMargin: 30,       // 边界软推力开始生效的距离
    damping: 0.97,            // 速度阻尼（越接近1运动越滑）
    maxSpeed: 2.0,            // 粒子最大速度（防止失控）
    fadeSpeed: 0.045,         // 连线渐隐速度（越大连线出现/消失越快）

    spawnRadius: 80,          // 点击生成时粒子散布半径
    spawnCount: 3,            // 每次点击生成粒子数量

        bondLength: 60,          // 键的平衡长度 (px)
        bondFormDist: 75,        // 形成新键的最大距离
        bondBreakDist: 100,      // 断开键的阈值距离
        bondSpring: 0.08,        // 弹簧刚度
        bondDamping: 0.5,        // 键阻尼（抑制振荡）

    targetSelector: [
        '#main-title',
        '#avatar',
        '#name',
        '.card',
        '.card-link'
    ]   // ★ 要碰撞的元素选择器（支持任何 CSS 选择器）
};

        class Bond {
            constructor(p1, p2, targetLen) {
                this.p1 = p1;
                this.p2 = p2;
                this.targetLen = targetLen;
                this.active = true;
            }
        }

    class Particle {
    constructor(x, y, w, h) {
    if (x !== undefined && y !== undefined) {
    this.x = x;
    this.y = y;
} else {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
}
    const angle = Math.random() * Math.PI * 2;
    const spd = CONFIG.baseSpeed * (0.5 + Math.random() * 0.5);
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.radius = CONFIG.radius;
        this.bonds = [];
    this.linkAlphas = {};
        // 随机生成该粒子允许的最大连接数（在 minLinks 和 maxLinks 之间）
    this.maxLinks = CONFIG.minLinks + Math.floor(Math.random() * (CONFIG.maxLinks - CONFIG.minLinks + 1));
}

    update(w, h) {
    const angleShift = (Math.random() - 0.5) * CONFIG.turnSpeed;
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const currentAngle = Math.atan2(this.vy, this.vx);
    const newAngle = currentAngle + angleShift;
    const newSpd = Math.max(0.1, spd + (Math.random() - 0.5) * CONFIG.speedJitter);
    this.vx = Math.cos(newAngle) * newSpd;
    this.vy = Math.sin(newAngle) * newSpd;

    const spdLimit = CONFIG.maxSpeed;
    const currentSpd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        // ---- 应用键的弹簧力 ----
        for (let bond of this.bonds) {
            const other = (bond.p1 === this) ? bond.p2 : bond.p1;
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 0.01) continue;
            const force = (dist - bond.targetLen) * CONFIG.bondSpring;
            const normX = dx / dist, normY = dy / dist;
            this.vx += normX * force * 0.5;
            this.vy += normY * force * 0.5;
            // 阻尼（可减缓振荡）
            this.vx *= (1 - CONFIG.bondDamping * 0.01);
            this.vy *= (1 - CONFIG.bondDamping * 0.01);
        }
// ---- 碰撞检测：与多个目标 DOM 元素反弹 ----
        if (CONFIG.targetSelector && CONFIG.targetSelector.length) {
            // ★ 关键：获取 canvas 的缩放比例，将视口坐标转换为 canvas 像素坐标
            const canvasRect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / canvasRect.width;
            const scaleY = canvas.height / canvasRect.height;

            let collided = false;
            for (let sel of CONFIG.targetSelector) {
                if (collided) break;
                const elements = document.querySelectorAll(sel);
                for (let el of elements) {
                    if (collided) break;
                    const rect = el.getBoundingClientRect();

                    // ★ 将元素边界从视口坐标转换到 canvas 像素坐标
                    const left = (rect.left - canvasRect.left) * scaleX;
                    const right = (rect.right - canvasRect.left) * scaleX;
                    const top = (rect.top - canvasRect.top) * scaleY;
                    const bottom = (rect.bottom - canvasRect.top) * scaleY;

                    const r = this.radius;

                    // 检测粒子是否进入元素区域
                    if (this.x + r > left && this.x - r < right &&
                        this.y + r > top && this.y - r < bottom) {

                        // 计算元素中心
                        const cx = (left + right) / 2;
                        const cy = (top + bottom) / 2;
                        const dx = this.x - cx;
                        const dy = this.y - cy;
                        const len = Math.sqrt(dx * dx + dy * dy);

                        // 粒子在元素中心附近 → 强制弹出（防止卡死）
                        if (len < 0.01) {
                            this.x = left - r - 1;
                            this.vx = Math.abs(this.vx) + 0.3;
                            this.vy = (Math.random() - 0.5) * 0.3;
                            collided = true;
                            break;
                        }

                        // ★ 改进：根据粒子从哪个方向进入来决定反弹方向
                        // 计算粒子与元素边界的重叠量
                        const overlapLeft = (this.x + r) - left;
                        const overlapRight = right - (this.x - r);
                        const overlapTop = (this.y + r) - top;
                        const overlapBottom = bottom - (this.y - r);

                        // 找到最小重叠方向（粒子从哪个方向穿入）
                        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                        if (minOverlap === overlapLeft) {
                            // 从左边界穿入 → 水平反弹，推出到左边界外
                            this.vx = -Math.abs(this.vx) * 0.8;
                            this.x = left - r - 0.5;
                        } else if (minOverlap === overlapRight) {
                            // 从右边界穿入 → 水平反弹
                            this.vx = Math.abs(this.vx) * 0.8;
                            this.x = right + r + 0.5;
                        } else if (minOverlap === overlapTop) {
                            // 从顶边界穿入 → 垂直反弹
                            this.vy = -Math.abs(this.vy) * 0.8;
                            this.y = top - r - 0.5;
                        } else if (minOverlap === overlapBottom) {
                            // 从底边界穿入 → 垂直反弹
                            this.vy = Math.abs(this.vy) * 0.8;
                            this.y = bottom + r + 0.5;
                        }

                        // 加少量随机扰动，使反弹更自然
                        this.vx += (Math.random() - 0.5) * 0.15;
                        this.vy += (Math.random() - 0.5) * 0.15;

                        collided = true;
                        break;
                    }
                }
            }
        }
// ---- 碰撞检测结束 ----
    if (currentSpd > spdLimit) {
    this.vx = (this.vx / currentSpd) * spdLimit;
    this.vy = (this.vy / currentSpd) * spdLimit;
}

    this.x += this.vx;
    this.y += this.vy;

    const margin = CONFIG.boundaryMargin;
    const soft = CONFIG.boundarySoft;
    if (this.x < margin) this.vx += soft * (margin - this.x) / margin;
    if (this.x > w - margin) this.vx -= soft * (this.x - (w - margin)) / margin;
    if (this.y < margin) this.vy += soft * (margin - this.y) / margin;
    if (this.y > h - margin) this.vy -= soft * (this.y - (h - margin)) / margin;

    this.x = Math.max(0, Math.min(w, this.x));
    this.y = Math.max(0, Math.min(h, this.y));

    this.vx *= CONFIG.damping;
    this.vy *= CONFIG.damping;
}

    draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${CONFIG.particleColor}, 0.85)`;
    ctx.fill();
}
}

        function manageBonds() {
            const maxDist = CONFIG.bondFormDist;
            const breakDist = CONFIG.bondBreakDist;
            const targetLen = CONFIG.bondLength;

            // 1. 检查现有键，超距则断开
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                for (let j = p.bonds.length - 1; j >= 0; j--) {
                    const bond = p.bonds[j];
                    const other = (bond.p1 === p) ? bond.p2 : bond.p1;
                    const dx = other.x - p.x;
                    const dy = other.y - p.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > breakDist) {
                        // 从两个粒子的 bonds 中移除该键
                        const idx1 = bond.p1.bonds.indexOf(bond);
                        if (idx1 !== -1) bond.p1.bonds.splice(idx1, 1);
                        const idx2 = bond.p2.bonds.indexOf(bond);
                        if (idx2 !== -1) bond.p2.bonds.splice(idx2, 1);
                        // 删除键对象（不用管，垃圾回收）
                    }
                }
            }

            // 2. 尝试形成新键（遍历粒子对）
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i], p2 = particles[j];
                    // 检查是否已连接（避免重复键）
                    let already = false;
                    for (let b of p1.bonds) {
                        if (b.p1 === p2 || b.p2 === p2) { already = true; break; }
                    }
                    if (already) continue;
                    // 检查连接数限制
                    if (p1.bonds.length >= p1.maxLinks || p2.bonds.length >= p2.maxLinks) continue;
                    const dx = p2.x - p1.x, dy = p2.y - p1.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist < maxDist) {
                        const bond = new Bond(p1, p2, targetLen);
                        p1.bonds.push(bond);
                        p2.bonds.push(bond);
                    }
                }
            }
        }

    let W, H;
    let particles = [];
    let mouse = { x: null, y: null };
    let mouseLineAlphas = [0, 0];

    // 强制初始化
    function initParticles() {
        const docWidth = document.documentElement.scrollWidth;
        const docHeight = document.documentElement.scrollHeight;
        W=canvas.width = docWidth;
        H=canvas.height = docHeight;
        // 生成粒子时使用文档尺寸
        particles = Array.from({ length: CONFIG.count }, () => new Particle(undefined, undefined, W, H));
}

    function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (particles.length > 0) {
    particles.forEach(p => {
    p.x = Math.random() * W;
    p.y = Math.random() * H;
});
} else {
    initParticles();
}
}

    canvas.addEventListener('mousemove', function(e) {
        const rect = canvas.getBoundingClientRect();
        // 计算画布像素坐标
        const scaleX = canvas.width / rect.width;   // 像素与CSS比例
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        mouse.x = x;
        mouse.y = y;
});
    canvas.addEventListener('mouseleave', function() {
    mouse.x = null;
    mouse.y = null;
});

    canvas.addEventListener('click', function(e) {
            // 1. 获取 canvas 的边界和实际像素尺寸
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;   // 像素与CSS比例
            const scaleY = canvas.height / rect.height;

            // 2. 计算鼠标在画布像素坐标中的位置
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;

            // 3. 限制在画布范围内
            const clampedX = Math.max(0, Math.min(canvas.width, mx));
            const clampedY = Math.max(0, Math.min(canvas.height, my));

            // 4. 生成粒子
            const count = CONFIG.spawnCount;
            const radius = CONFIG.spawnRadius;
            const maxP = CONFIG.maxParticles;

            if (particles.length + count > maxP) {
                const removeCount = particles.length + count - maxP;
                particles.splice(0, removeCount);
            }

            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * radius;
                const px = clampedX + Math.cos(angle) * dist;
                const py = clampedY + Math.sin(angle) * dist;

                // 限制在画布范围内
                const finalX = Math.max(0, Math.min(canvas.width, px));
                const finalY = Math.max(0, Math.min(canvas.height, py));

                const p = new Particle(finalX, finalY, canvas.width, canvas.height);
                let spd;
                spd = CONFIG.baseSpeed * (0.3 + Math.random() * 0.7);
                const a = Math.random() * Math.PI * 2;
                p.vx = Math.cos(a) * spd;
                p.vy = Math.sin(a) * spd;
                particles.push(p);
            }
            console.log(`✨ 生成 ${count} 个粒子，当前总数: ${particles.length}`);
        });

    canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (t) {
    const r = canvas.getBoundingClientRect();
    mouse.x = t.clientX - r.left;
    mouse.y = t.clientY - r.top;
}
}, { passive: false });
    canvas.addEventListener('touchend', function() {
    mouse.x = null;
    mouse.y = null;
});
    canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (t) {
    const r = canvas.getBoundingClientRect();
    const mx = t.clientX - r.left;
    const my = t.clientY - r.top;
    const count = CONFIG.spawnCount;
    const radius = CONFIG.spawnRadius;
    const maxP = CONFIG.maxParticles;
    if (particles.length + count > maxP) {
    const removeCount = particles.length + count - maxP;
    particles.splice(0, removeCount);
}
    for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius;
    const px = mx + Math.cos(angle) * dist;
    const py = my + Math.sin(angle) * dist;
    const clampedX = Math.max(0, Math.min(W, px));
    const clampedY = Math.max(0, Math.min(H, py));
    const p = new Particle(clampedX, clampedY, W, H);
    const spd = CONFIG.baseSpeed * (0.3 + Math.random() * 0.7);
    const a = Math.random() * Math.PI * 2;
    p.vx = Math.cos(a) * spd;
    p.vy = Math.sin(a) * spd;
    particles.push(p);
}
}
}, { passive: false });

    function applyRepulsion() {
    const range = CONFIG.repulsionRange;
    const strength = CONFIG.repulsionStrength;
    for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
    const dx = particles[i].x - particles[j].x;
    const dy = particles[i].y - particles[j].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < range && dist > 0.01) {
    const force = strength * (1 - dist / range);
    const normX = dx / dist;
    const normY = dy / dist;
    particles[i].vx += normX * force;
    particles[i].vy += normY * force;
    particles[j].vx -= normX * force;
    particles[j].vy -= normY * force;
}
}
}
}

    function applyMouseForce() {
    if (mouse.x === null || mouse.y === null) return;
    const mx = mouse.x, my = mouse.y;
    const radius = CONFIG.mouseRadius;
    const balance = CONFIG.mouseBalance;
    const attract = CONFIG.mouseStrength;
    const repel = CONFIG.mouseRepulsion;

    for (let p of particles) {
    const dx = p.x - mx;
    const dy = p.y - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius && dist > 0.5) {
    const diff = dist - balance;
    let forceMag = diff / balance * 0.5;
    forceMag = Math.min(Math.max(forceMag, -0.8), 0.8);
    const dirX = dx / dist;
    const dirY = dy / dist;
    const sign = diff > 0 ? 1 : -1;
    const strength = sign * Math.abs(forceMag) * (diff > 0 ? attract : repel);
    p.vx += dirX * strength;
    p.vy += dirY * strength;
}
}
}

    function updateLinkAlphas() {
    const maxDist = CONFIG.maxDist;
        // const maxLinks = this.maxLinks;   // 使用每个粒子自己的连接数上限
    const fadeSpeed = CONFIG.fadeSpeed;

    for (let i = 0; i < particles.length; i++) {
    const pi = particles[i];
        const maxLinks = pi.maxLinks;   // ← 使用粒子自身的连接数
    const neighbors = [];
    for (let j = 0; j < particles.length; j++) {
    if (i === j) continue;
    const dx = pi.x - particles[j].x;
    const dy = pi.y - particles[j].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < maxDist) {
    neighbors.push({ idx: j, dist: dist });
}
}
    neighbors.sort(function(a, b) { return a.dist - b.dist; });
    const selected = neighbors.slice(0, maxLinks);

    const newTargets = new Set(selected.map(function(n) { return n.idx; }));

    const oldKeys = Object.keys(pi.linkAlphas);
    for (let k = 0; k < oldKeys.length; k++) {
    const key = oldKeys[k];
    const idx = parseInt(key);
    if (!newTargets.has(idx)) {
    pi.linkAlphas[key] -= fadeSpeed;
    if (pi.linkAlphas[key] <= 0) {
    delete pi.linkAlphas[key];
}
}
}

    for (let n of selected) {
    const key = n.idx;
    const targetAlpha = 1 - n.dist / maxDist;
    if (pi.linkAlphas.hasOwnProperty(key)) {
    if (pi.linkAlphas[key] < targetAlpha) {
    pi.linkAlphas[key] = Math.min(targetAlpha, pi.linkAlphas[key] + fadeSpeed);
}
} else {
    pi.linkAlphas[key] = Math.min(targetAlpha, fadeSpeed);
}
}
}
}

        function drawSparseLines() {
            const lineColor = CONFIG.lineColor;
            for (let p of particles) {
                for (let bond of p.bonds) {
                    // 只绘制一次（避免重复绘制同一条键）
                    if (bond.p1 !== p) continue; // 让每个键只由一端绘制
                    const other = bond.p2;
                    const dx = other.x - p.x, dy = other.y - p.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    const ratio = 1 - Math.min(dist / CONFIG.bondLength * 0.5, 1); // 基于距离调整透明度
                    const alpha = 0.3 + ratio * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`;
                    ctx.lineWidth = 0.8 + ratio * 1.2;
                    ctx.stroke();
                }
            }
        }

    function updateMouseLines() {
    const fadeSpeed = CONFIG.fadeSpeed;
    if (mouse.x === null || mouse.y === null) {
    for (let i = 0; i < mouseLineAlphas.length; i++) {
    mouseLineAlphas[i] = Math.max(0, mouseLineAlphas[i] - fadeSpeed);
}
    return;
}

    const sorted = particles.slice().sort(function(a, b) {
    const da = (a.x - mouse.x) * (a.x - mouse.x) + (a.y - mouse.y) * (a.y - mouse.y);
    const db = (b.x - mouse.x) * (b.x - mouse.x) + (b.y - mouse.y) * (b.y - mouse.y);
    return da - db;
});
    const nearest = sorted.slice(0, 2);

    for (let i = 0; i < nearest.length; i++) {
    const p = nearest[i];
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxD = CONFIG.maxDist * 1.2;
    if (dist < maxD) {
    const targetAlpha = (1 - dist / maxD) * 0.6 + 0.05;
    mouseLineAlphas[i] = Math.min(targetAlpha, mouseLineAlphas[i] + fadeSpeed);
} else {
    mouseLineAlphas[i] = Math.max(0, mouseLineAlphas[i] - fadeSpeed);
}
}
    for (let i = nearest.length; i < mouseLineAlphas.length; i++) {
    mouseLineAlphas[i] = Math.max(0, mouseLineAlphas[i] - fadeSpeed);
}
}

    function drawMouseLines() {
    if (mouse.x === null || mouse.y === null) return;
    const nearest = particles.slice().sort(function(a, b) {
    const da = (a.x - mouse.x) * (a.x - mouse.x) + (a.y - mouse.y) * (a.y - mouse.y);
    const db = (b.x - mouse.x) * (b.x - mouse.x) + (b.y - mouse.y) * (b.y - mouse.y);
    return da - db;
}).slice(0, 2);

    for (let i = 0; i < nearest.length; i++) {
    const p = nearest[i];
    const alpha = mouseLineAlphas[i];
    if (alpha <= 0) continue;
    ctx.beginPath();
    ctx.moveTo(mouse.x, mouse.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = 'rgba(' + CONFIG.lineColor + ', ' + (alpha * 0.7) + ')';
    ctx.lineWidth = 0.3 + alpha * 0.8;
    ctx.stroke();
}
}



    function animate() {
    ctx.clearRect(0, 0, W, H);

    applyRepulsion();
    applyMouseForce();

    for (let p of particles) p.update(W, H);

    // updateLinkAlphas();

    for (let p of particles) p.draw(ctx);

    manageBonds();

    drawSparseLines();

    updateMouseLines();
    drawMouseLines();

    requestAnimationFrame(animate);
}

    // ===== 启动 =====
    initParticles();
    window.addEventListener('resize', resize);
    animate();

    console.log('✅ 每个粒子最多 2 条连线，已初始化');
})();

    (function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const CONFIG = {
    count: 50,                // 初始粒子数量
    maxParticles: 300,        // 粒子总数上限（防止卡顿）
    maxDist: 140,             // 连线最大距离（px）
    maxLinks: 2,              // ★ 每个粒子最多连接数（已改为2）
    radius: 2.0,              // 粒子半径
    lineColor: '120, 200, 255',   // 线条颜色 (R,G,B)
    particleColor: '180, 220, 255', // 粒子颜色

    baseSpeed: 0.9,           // 基础游走速度（越大越快）
    turnSpeed: 0.08,          // 随机转向幅度（越大转弯越猛）
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

    targetSelector: ['#main-title']   // ★ 要碰撞的元素选择器（支持任何 CSS 选择器）
};

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
    this.linkAlphas = {};
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
        // ---- 碰撞检测：与目标 DOM 元素反弹 ----
// ---- 碰撞检测：与多个目标 DOM 元素反弹 ----
        if (CONFIG.targetSelector && CONFIG.targetSelector.length) {
            // 遍历每个选择器
            for (let sel of CONFIG.targetSelector) {
                const elements = document.querySelectorAll(sel);
                for (let el of elements) {
                    const rect = el.getBoundingClientRect();
                    const left = rect.left, right = rect.right, top = rect.top, bottom = rect.bottom;
                    const r = this.radius;

                    // 如果粒子进入元素区域
                    if (this.x + r > left && this.x - r < right &&
                        this.y + r > top && this.y - r < bottom) {

                        const cx = (left + right) / 2;
                        const cy = (top + bottom) / 2;
                        const dx = this.x - cx;
                        const dy = this.y - cy;
                        const len = Math.sqrt(dx*dx + dy*dy);
                        if (len < 0.01) {
                            this.x = left - r - 5;
                            this.vx = Math.abs(this.vx) + 0.5;
                            this.vy = (Math.random() - 0.5) * 0.5;
                            break;
                        }
                        const nx = dx / len, ny = dy / len;

                        // 计算重叠方向
                        const overlapX = (this.x + r - left) < (right - (this.x - r))
                            ? (this.x + r - left) : (right - (this.x - r));
                        const overlapY = (this.y + r - top) < (bottom - (this.y - r))
                            ? (this.y + r - top) : (bottom - (this.y - r));

                        if (overlapX < overlapY) {
                            this.vx = -this.vx * 0.8;
                            if (this.x < cx) this.x = left - r - 1;
                            else this.x = right + r + 1;
                        } else {
                            this.vy = -this.vy * 0.8;
                            if (this.y < cy) this.y = top - r - 1;
                            else this.y = bottom + r + 1;
                        }
                        this.vx += (Math.random() - 0.5) * 0.3;
                        this.vy += (Math.random() - 0.5) * 0.3;
                        break; // 撞到一个就退出循环，防止多重反弹
                    }
                }
            }
        }
// ---- 碰撞检测结束 ----
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

    let W, H;
    let particles = [];
    let mouse = { x: null, y: null };
    let mouseLineAlphas = [0, 0];

    // 强制初始化
    function initParticles() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    particles = Array.from({ length: CONFIG.count }, () => new Particle(undefined, undefined, W, H));
    console.log(`✅ 已生成 ${particles.length} 个粒子`);
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
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});
    canvas.addEventListener('mouseleave', function() {
    mouse.x = null;
    mouse.y = null;
});

    canvas.addEventListener('click', function(e) {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

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
    const maxLinks = CONFIG.maxLinks;
    const fadeSpeed = CONFIG.fadeSpeed;

    for (let i = 0; i < particles.length; i++) {
    const pi = particles[i];
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
    const maxDist = CONFIG.maxDist;
    for (let i = 0; i < particles.length; i++) {
    const pi = particles[i];
    const alphas = pi.linkAlphas;
    for (let key in alphas) {
    if (!alphas.hasOwnProperty(key)) continue;
    const j = parseInt(key);
    if (j <= i) continue;
    const pj = particles[j];
    const alpha = alphas[key];
    if (alpha <= 0) continue;
    const dx = pi.x - pj.x;
    const dy = pi.y - pj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ratio = 1 - Math.min(dist / maxDist, 1);
    const finalAlpha = alpha * ratio * 0.8 + 0.05;
    if (finalAlpha <= 0) continue;
    ctx.beginPath();
    ctx.moveTo(pi.x, pi.y);
    ctx.lineTo(pj.x, pj.y);
    ctx.strokeStyle = 'rgba(' + lineColor + ', ' + finalAlpha + ')';
    ctx.lineWidth = 0.3 + ratio * 0.9;
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

    updateLinkAlphas();

    for (let p of particles) p.draw(ctx);

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
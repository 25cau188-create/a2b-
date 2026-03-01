(() => {
  const $ = (s) => document.querySelector(s);
  const canvas = $('#game');
  const ctx = canvas.getContext('2d');

  // UI elements
  const scoreEl = $('#score');
  const multEl = $('#mult');
  const coinsEl = $('#coins');
  const bestEl = $('#best');
  const ovBestEl = $('#ov-best');
  const ovTotalCoinsEl = $('#ov-total-coins');
  const overlay = $('#overlay');
  const startBtn = $('#startBtn');

  // Persisted stats
  const store = {
    get(key, def) { try { const v = localStorage.getItem(key); return v == null ? def : JSON.parse(v); } catch { return def; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
  };

  let running = false;
  let t = 0;
  let dt = 0;
  let last = 0;

  // World
  const W = canvas.width;
  const H = canvas.height;
  const lanes = [-1, 0, 1];
  const laneX = (lane) => W/2 + lane * (W/6);

  const player = {
    lane: 0,
    y: H - 140,
    width: 46,
    height: 64,
    vy: 0,
    onGround: true,
    sliding: false,
    slideT: 0,
    color: '#80cbc4'
  };

  let speed = 6;
  let score = 0;
  let mult = 1;
  let coins = 0;
  let best = store.get('tr-best', 0);
  let totalCoins = store.get('tr-total-coins', 0);

  const objs = []; // obstacles and coins

  function reset() {
    running = true;
    t = 0; dt = 0; last = performance.now();
    speed = 6; score = 0; mult = 1; coins = 0;
    player.lane = 0; player.y = H - 140; player.vy = 0; player.onGround = true; player.sliding = false; player.slideT = 0;
    objs.length = 0;
    overlay.classList.remove('show');
    updateUI();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    best = Math.max(best, Math.floor(score));
    totalCoins += coins;
    store.set('tr-best', best);
    store.set('tr-total-coins', totalCoins);
    ovBestEl.textContent = String(best);
    ovTotalCoinsEl.textContent = String(totalCoins);
    overlay.classList.add('show');
  }

  function updateUI() {
    scoreEl.textContent = String(Math.floor(score));
    multEl.textContent = String(mult.toFixed(1));
    coinsEl.textContent = String(coins);
    bestEl.textContent = String(best);
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function spawnThings() {
    // Spawn lanes: 3 lanes; obstacles or coins
    // Every ~40-70 frames spawn a group
    if (t % Math.floor(40 - Math.min(25, speed*2)) === 0) {
      const typeRoll = Math.random();
      if (typeRoll < 0.6) {
        // Obstacles: one or two blocks
        const count = Math.random() < 0.4 ? 2 : 1;
        const used = new Set();
        for (let i=0;i<count;i++) {
          let l; do { l = lanes[(Math.random()*3)|0]; } while (used.has(l)); used.add(l);
          objs.push({ kind:'ob', lane:l, x: W + 50 + i*50, y: H - 120, w: 50, h: 60, col:'#ef5350' });
        }
      } else {
        // Coins: 2-5 in a line or arc
        const c = 2 + (Math.random()*4)|0;
        const l = lanes[(Math.random()*3)|0];
        for (let i=0;i<c;i++) {
          const y = H - 200 - Math.sin(i/ (c-1) * Math.PI) * 80;
          objs.push({ kind:'coin', lane:l, x: W + 60 + i*36, y, w: 26, h: 26, col:'#ffd54f' });
        }
      }
    }
  }

  function collide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // Speed ramps up slowly
    speed += 0.0009 * dt;
    mult = 1 + Math.min(4, (speed-6)/3);
    score += (speed * 0.35) * (dt/16.67) * mult;

    // Player physics
    player.vy += 0.9; // gravity
    player.y += player.vy;
    const ground = H - 140;
    if (player.y >= ground) { player.y = ground; player.vy = 0; player.onGround = true; }
    if (player.sliding) {
      player.slideT -= dt;
      if (player.slideT <= 0) player.sliding = false;
    }

    // Spawn and move objects
    spawnThings();
    for (let i = objs.length-1; i >= 0; i--) {
      const o = objs[i];
      o.x -= speed;
      // world y is o.y; x from right
      const px = laneX(player.lane) - player.width/2;
      const ph = player.sliding ? player.height*0.55 : player.height;
      const py = player.y + (player.height - ph);
      const a = { x: px, y: py, w: player.width, h: ph };
      const b = { x: o.x - o.w/2, y: o.y - o.h/2, w: o.w, h: o.h };

      if (o.kind === 'coin') {
        if (collide(a, b)) { coins += 1; objs.splice(i,1); continue; }
      } else {
        // obstacle
        if (collide(a, b)) { gameOver(); return; }
      }

      if (o.x < -100) objs.splice(i,1);
    }

    updateUI();
  }

  function drawRoad() {
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, 0, W, H);

    // Perspective road
    const roadW = W*0.7;
    const roadX = (W-roadW)/2;
    const laneW = roadW/3;

    // Moving stripes
    const stripeH = 40;
    const off = (t*speed*0.8)%stripeH;

    // Road base
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(roadX, 0, roadW, H);

    // Lane lines
    ctx.fillStyle = '#111';
    for (let i=1;i<3;i++) {
      ctx.fillRect(roadX + i*laneW - 4, 0, 8, H);
    }

    // Dashes per lane
    ctx.fillStyle = '#d7ccc8';
    for (let y=-stripeH;y<H;y+=stripeH*2) {
      ctx.fillRect(roadX + laneW/2 - 3, y + off, 6, stripeH);
      ctx.fillRect(roadX + laneW + laneW/2 - 3, y + off, 6, stripeH);
    }

    // Side walls
    ctx.fillStyle = '#795548';
    ctx.fillRect(roadX-20, 0, 20, H);
    ctx.fillRect(roadX+roadW, 0, 20, H);
  }

  function drawPlayer() {
    const x = laneX(player.lane) - player.width/2;
    const h = player.sliding ? player.height*0.55 : player.height;
    const y = player.y + (player.height - h);

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath();
    ctx.ellipse(laneX(player.lane), H-60, 28, 10, 0, 0, Math.PI*2);
    ctx.fill();

    // body
    ctx.fillStyle = player.color;
    ctx.fillRect(x, y, player.width, h);

    // head
    ctx.fillStyle = '#004d40';
    ctx.fillRect(x+10, y-10, 26, 14);
  }

  function drawObjects() {
    for (const o of objs) {
      const x = o.x - o.w/2;
      const y = o.y - o.h/2;
      if (o.kind === 'coin') {
        ctx.fillStyle = '#ffca28';
        ctx.beginPath();
        ctx.arc(x+o.w/2, y+o.h/2, o.w/2, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x+o.w/2, y+o.h/2, o.w/2-4, 0, Math.PI*2);
        ctx.stroke();
      } else {
        ctx.fillStyle = o.col;
        ctx.fillRect(x, y, o.w, o.h);
      }
    }
  }

  function render() {
    ctx.clearRect(0,0,W,H);
    drawRoad();
    drawObjects();
    drawPlayer();
  }

  function loop(now) {
    if (!running) return;
    dt = now - last; last = now; t += dt/16.67;
    // clamp dt to avoid huge jumps when tab is inactive
    const step = Math.min(32, dt);
    update(step);
    render();
    requestAnimationFrame(loop);
  }

  function jump() {
    if (player.onGround && !player.sliding) {
      player.vy = -16; player.onGround = false;
    }
  }
  function slide() {
    if (player.onGround && !player.sliding) {
      player.sliding = true; player.slideT = 450; // ms
    }
  }

  function left() { player.lane = clamp(player.lane - 1, -1, 1); }
  function right() { player.lane = clamp(player.lane + 1, -1, 1); }

  // Input
  window.addEventListener('keydown', (e) => {
    if (!running && (e.key === ' ' || e.key === 'Enter')) { reset(); return; }
    if (!running) return;
    if (e.repeat) return;
    switch (e.key) {
      case 'a': case 'A': case 'ArrowLeft': left(); break;
      case 'd': case 'D': case 'ArrowRight': right(); break;
      case 'w': case 'W': case 'ArrowUp': case ' ': jump(); break;
      case 's': case 'S': case 'ArrowDown': slide(); break;
    }
  });

  startBtn.addEventListener('click', reset);

  // Init overlay stats
  ovBestEl.textContent = String(best);
  ovTotalCoinsEl.textContent = String(totalCoins);
  overlay.classList.add('show');
  updateUI();
})();

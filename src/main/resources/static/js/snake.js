(() => {
  'use strict';

  const SIZE = 20;
  const CELL = 30;
  const STORAGE_KEY = 'snake-arcade-v1';
  const speeds = { slow: 175, normal: 125, fast: 85 };
  const vectors = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);

  let snake = [];
  let food = null;
  let direction = 'right';
  let nextDirection = 'right';
  let directionQueued = false;
  let score = 0;
  let best = 0;
  let speed = 'normal';
  let state = 'ready';
  let interval = null;

  const same = (a, b) => a.x === b.x && a.y === b.y;
  const inBounds = p => Number.isInteger(p?.x) && Number.isInteger(p?.y) && p.x >= 0 && p.x < SIZE && p.y >= 0 && p.y < SIZE;
  const format = value => String(value).padStart(2, '0');

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ snake, food, direction, score, best, speed, state }));
    } catch { /* Nếu bộ nhớ bị chặn, game vẫn chơi được. */ }
  }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!data || !Array.isArray(data.snake) || !data.snake.length || data.snake.length > SIZE * SIZE ||
          !data.snake.every(inBounds) || new Set(data.snake.map(p => `${p.x},${p.y}`)).size !== data.snake.length ||
          !vectors[data.direction] || !(data.speed in speeds) ||
          !Number.isSafeInteger(data.score) || data.score < 0 ||
          !Number.isSafeInteger(data.best) || data.best < 0 ||
          !['ready', 'running', 'paused', 'over', 'won'].includes(data.state) ||
          (data.state !== 'won' && (!inBounds(data.food) || data.snake.some(p => same(p, data.food))))) return false;
      snake = data.snake.map(p => ({ x: p.x, y: p.y }));
      food = data.food && inBounds(data.food) ? { x: data.food.x, y: data.food.y } : null;
      direction = nextDirection = data.direction;
      score = data.score;
      best = Math.max(data.best, score);
      speed = data.speed;
      state = data.state === 'running' ? 'paused' : data.state;
      return true;
    } catch { return false; }
  }

  function placeFood() {
    const occupied = new Set(snake.map(p => p.y * SIZE + p.x));
    const free = [];
    for (let i = 0; i < SIZE * SIZE; i++) if (!occupied.has(i)) free.push(i);
    if (!free.length) { food = null; return false; }
    const chosen = free[Math.floor(Math.random() * free.length)];
    food = { x: chosen % SIZE, y: Math.floor(chosen / SIZE) };
    return true;
  }

  function reset() {
    stopLoop();
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    direction = nextDirection = 'right';
    directionQueued = false;
    score = 0;
    state = 'ready';
    placeFood();
    update();
    save();
  }

  function stopLoop() { if (interval !== null) clearInterval(interval); interval = null; }
  function runLoop() { stopLoop(); interval = setInterval(tick, speeds[speed]); }

  function start() {
    if (state === 'over' || state === 'won') reset();
    if (state !== 'ready' && state !== 'paused') return;
    state = 'running';
    runLoop();
    update();
    save();
  }

  function pause() {
    if (state !== 'running') return;
    stopLoop();
    state = 'paused';
    update();
    save();
  }

  function toggle() { if (state === 'running') pause(); else start(); }

  function turn(dir) {
    if (!vectors[dir]) return;
    if (state === 'ready') start();
    if (state !== 'running' || directionQueued || dir === opposite[direction] || dir === direction) return;
    nextDirection = dir;
    directionQueued = true;
  }

  function end(finalState) {
    stopLoop();
    state = finalState;
    update();
    save();
    if (finalState === 'over' || finalState === 'won') {
      Leaderboard.promptAndSubmit({
        game: 'snake',
        score,
        onDone: () => Leaderboard.load('snake', document.getElementById('lb-container')),
      });
    }
  }

  function tick() {
    direction = nextDirection;
    directionQueued = false;
    const v = vectors[direction];
    const head = { x: snake[0].x + v.x, y: snake[0].y + v.y };
    const eating = food && same(head, food);
    const collisionBody = eating ? snake : snake.slice(0, -1);
    if (!inBounds(head) || collisionBody.some(part => same(part, head))) { end('over'); return; }
    snake.unshift(head);
    if (eating) {
      score += 10;
      best = Math.max(best, score);
      if (!placeFood()) { end('won'); return; }
    } else snake.pop();
    update();
    save();
  }

  function roundedRect(x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#14282e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff0b';
    ctx.lineWidth = 1;
    for (let i = 1; i < SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL + .5, 0); ctx.lineTo(i * CELL + .5, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL + .5); ctx.lineTo(canvas.width, i * CELL + .5); ctx.stroke();
    }
    if (food) {
      const x = food.x * CELL + CELL / 2, y = food.y * CELL + CELL / 2;
      ctx.shadowColor = '#fa9a78'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#f38d70'; ctx.beginPath(); ctx.arc(x, y + 1, 10, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fdd2ac'; ctx.beginPath(); ctx.arc(x - 3, y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#bfe987'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.quadraticCurveTo(x + 3, y - 15, x + 7, y - 14); ctx.stroke();
    }
    snake.slice().reverse().forEach((part, reverseIndex) => {
      const isHead = reverseIndex === snake.length - 1;
      const inset = isHead ? 2 : 3;
      const x = part.x * CELL + inset, y = part.y * CELL + inset;
      ctx.fillStyle = isHead ? '#d2f28b' : (reverseIndex % 2 ? '#97cf76' : '#a9db7d');
      if (isHead) { ctx.shadowColor = '#b0e780'; ctx.shadowBlur = 12; }
      roundedRect(x, y, CELL - 2 * inset, CELL - 2 * inset, isHead ? 8 : 7); ctx.fill(); ctx.shadowBlur = 0;
      if (isHead) {
        ctx.fillStyle = '#254237';
        const eyes = direction === 'right' ? [[x + 18,y + 7],[x + 18,y + 17]] :
          direction === 'left' ? [[x + 6,y + 7],[x + 6,y + 17]] :
          direction === 'up' ? [[x + 7,y + 6],[x + 17,y + 6]] : [[x + 7,y + 18],[x + 17,y + 18]];
        eyes.forEach(([ex,ey]) => { ctx.beginPath(); ctx.arc(ex,ey,2,0,Math.PI*2); ctx.fill(); });
      }
    });
  }

  function update() {
    $('score').textContent = format(score);
    $('best').textContent = format(best);
    $('length-label').textContent = `ĐỘ DÀI ${format(snake.length)}`;
    document.querySelectorAll('[data-speed]').forEach(button => {
      const active = button.dataset.speed === speed;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const states = {
      ready: ['CHƯA BẮT ĐẦU', 'Chọn Bắt đầu để vào game', 'Sẵn sàng săn mồi?', 'Ăn mồi để tăng điểm. Tránh tường và đuôi của chính mình.', 'Bắt đầu chơi', '✳'],
      running: ['ĐANG CHƠI', 'Ăn mồi và tránh va chạm', '', '', '', ''],
      paused: ['TẠM DỪNG', 'Ván chơi đã tạm dừng', 'Tạm nghỉ một chút?', 'Ván chơi của bạn đã được lưu. Tiếp tục khi sẵn sàng.', 'Tiếp tục', 'Ⅱ'],
      over: ['KẾT THÚC', `Đạt ${score} điểm`, 'Rắn đã va chạm!', `Bạn đạt ${score} điểm. Thử lại để vượt qua kỷ lục.`, 'Chơi lại', '↻'],
      won: ['HOÀN THÀNH', `Đạt ${score} điểm`, 'Bạn đã phủ kín bàn!', 'Không còn ô trống nào. Một ván chơi xuất sắc.', 'Chơi ván mới', '★']
    };
    const [label, status, title, message, button, symbol] = states[state];
    $('state-label').textContent = label;
    $('status-text').textContent = status;
    $('pause').textContent = state === 'running' ? 'Tạm dừng' : (state === 'paused' ? 'Tiếp tục' : state === 'ready' ? 'Bắt đầu' : 'Chơi lại');
    $('overlay').hidden = state === 'running';
    if (state !== 'running') {
      $('overlay-title').textContent = title;
      $('overlay-message').textContent = message;
      $('overlay-button').firstChild.textContent = button + ' ';
      $('overlay-symbol').textContent = symbol;
    }
    draw();
  }

  const keyDirections = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', a: 'left', s: 'down', d: 'right' };
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    const dir = keyDirections[event.key] || keyDirections[event.key.toLowerCase()];
    if (dir) { event.preventDefault(); turn(dir); }
    else if (event.code === 'Space') { event.preventDefault(); toggle(); }
  });

  let touchStart = null;
  canvas.addEventListener('touchstart', event => {
    if (event.touches.length === 1) touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }, { passive: true });
  canvas.addEventListener('touchcancel', () => { touchStart = null; });

  document.querySelectorAll('[data-dir]').forEach(button => button.addEventListener('click', () => turn(button.dataset.dir)));
  document.querySelectorAll('[data-speed]').forEach(button => button.addEventListener('click', () => {
    speed = button.dataset.speed;
    if (state === 'running') runLoop();
    update(); save();
  }));
  $('pause').addEventListener('click', toggle);
  $('restart').addEventListener('click', reset);
  $('overlay-button').addEventListener('click', start);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  if (load()) { update(); save(); }
  else reset();
  Leaderboard.load('snake', document.getElementById('lb-container'));
})();

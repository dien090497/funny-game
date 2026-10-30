(() => {
  'use strict';

  const KEY = 'mini-2048-v1';
  const boardElement = document.getElementById('board');
  const scoreElement = document.getElementById('score');
  const bestElement = document.getElementById('best');
  const statusElement = document.getElementById('status');
  const undoButton = document.getElementById('undo');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');
  const modalIcon = document.getElementById('modal-icon');
  const modalActions = document.getElementById('modal-actions');

  let board = Array(16).fill(0);
  let score = 0;
  let best = 0;
  let previous = null;
  let wonShown = false;
  let keepPlaying = false;
  let gameOver = false;
  let focusBeforeModal = null;

  function validBoard(values) {
    return Array.isArray(values) && values.length === 16 &&
      values.every(n => Number.isSafeInteger(n) && (n === 0 || (n >= 2 && Number.isInteger(Math.log2(n)))));
  }

  function validScore(value) { return Number.isSafeInteger(value) && value >= 0; }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ board, score, best, previous, wonShown, keepPlaying, gameOver }));
    } catch { /* Vẫn chơi được nếu trình duyệt không cho lưu. */ }
  }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!data || !validBoard(data.board) || !validScore(data.score)) return false;
      board = data.board.slice();
      score = data.score;
      best = validScore(data.best) ? Math.max(data.best, score) : score;
      previous = data.previous && validBoard(data.previous.board) && validScore(data.previous.score)
        ? { board: data.previous.board.slice(), score: data.previous.score,
            wonShown: !!data.previous.wonShown, keepPlaying: !!data.previous.keepPlaying }
        : null;
      wonShown = !!data.wonShown;
      keepPlaying = !!data.keepPlaying;
      gameOver = !hasMoves();
      return true;
    } catch { return false; }
  }

  function addTile() {
    const empty = [];
    board.forEach((value, index) => { if (value === 0) empty.push(index); });
    if (!empty.length) return -1;
    const index = empty[Math.floor(Math.random() * empty.length)];
    board[index] = Math.random() < 0.9 ? 2 : 4;
    return index;
  }

  function render(newIndex = -1) {
    const fragment = document.createDocumentFragment();
    board.forEach((value, index) => {
      const cell = document.createElement('div');
      cell.className = 'cell' + (value ? ' filled' : '') + (index === newIndex ? ' new' : '');
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Hàng ${Math.floor(index / 4) + 1}, cột ${index % 4 + 1}: ${value || 'trống'}`);
      if (value) {
        cell.dataset.value = value > 2048 ? 'super' : String(value);
        cell.textContent = String(value);
      }
      fragment.append(cell);
    });
    boardElement.replaceChildren(fragment);
    scoreElement.textContent = score.toLocaleString('vi-VN');
    bestElement.textContent = best.toLocaleString('vi-VN');
    undoButton.disabled = !previous;
  }

  function hasMoves() {
    for (let i = 0; i < 16; i++) {
      if (board[i] === 0) return true;
      if (i % 4 !== 3 && board[i] === board[i + 1]) return true;
      if (i < 12 && board[i] === board[i + 4]) return true;
    }
    return false;
  }

  function lineIndices(direction, line) {
    const indices = [];
    for (let step = 0; step < 4; step++) {
      if (direction === 'left') indices.push(line * 4 + step);
      if (direction === 'right') indices.push(line * 4 + (3 - step));
      if (direction === 'up') indices.push(step * 4 + line);
      if (direction === 'down') indices.push((3 - step) * 4 + line);
    }
    return indices;
  }

  function closeModal() {
    modal.hidden = true;
    if (focusBeforeModal?.isConnected) focusBeforeModal.focus();
    focusBeforeModal = null;
  }

  function showModal(type) {
    focusBeforeModal = document.activeElement;
    modalIcon.textContent = type === 'win' ? '✨' : '↗';
    modalTitle.textContent = type === 'win' ? 'Bạn đã đạt 2048!' : 'Hết nước đi rồi!';
    modalText.textContent = type === 'win'
      ? 'Đã ghép được ô 2048. Bạn có thể chơi tiếp để đạt số lớn hơn.'
      : `Bạn đạt ${score.toLocaleString('vi-VN')} điểm. Bắt đầu bàn mới và thử vượt kỷ lục nhé.`;
    modalActions.replaceChildren();
    if (type === 'win') {
      const continueButton = document.createElement('button');
      continueButton.type = 'button';
      continueButton.className = 'secondary';
      continueButton.textContent = 'Chơi tiếp';
      continueButton.addEventListener('click', () => {
        keepPlaying = true;
        save();
        closeModal();
        statusElement.textContent = 'Tiếp tục ghép các ô lớn hơn!';
        if (gameOver) showModal('lose');
      });
      modalActions.append(continueButton);
    }
    const restartButton = document.createElement('button');
    restartButton.type = 'button';
    restartButton.textContent = 'Chơi ván mới';
    restartButton.addEventListener('click', () => { closeModal(); newGame(); });
    modalActions.append(restartButton);
    modal.hidden = false;
    modalActions.querySelector('button').focus();
  }

  function move(direction) {
    if (gameOver || !modal.hidden) return;
    const before = board.slice();
    const snapshot = { board: before, score, wonShown, keepPlaying };
    let earned = 0;
    for (let line = 0; line < 4; line++) {
      const indices = lineIndices(direction, line);
      const values = indices.map(index => before[index]).filter(Boolean);
      const merged = [];
      for (let i = 0; i < values.length; i++) {
        if (i + 1 < values.length && values[i] === values[i + 1]) {
          const newValue = values[i] * 2;
          merged.push(newValue);
          earned += newValue;
          i++;
        } else {
          merged.push(values[i]);
        }
      }
      indices.forEach((index, position) => { board[index] = merged[position] || 0; });
    }
    if (board.every((value, index) => value === before[index])) {
      statusElement.textContent = 'Hướng này không có ô nào di chuyển.';
      return;
    }
    previous = snapshot;
    score += earned;
    best = Math.max(score, best);
    const newIndex = addTile();
    gameOver = !hasMoves();
    render(newIndex);
    save();
    statusElement.textContent = earned ? `+${earned} điểm · Tiếp tục ghép!` : 'Một ô mới vừa xuất hiện.';
    if (!wonShown && board.some(value => value >= 2048)) {
      wonShown = true;
      save();
      showModal('win');
      Leaderboard.submitAndRefresh({
        game: '2048',
        score,
        containerEl: document.getElementById('lb-container'),
      });
    } else if (gameOver) {
      statusElement.textContent = 'Hết nước đi.';
      showModal('lose');
      Leaderboard.submitAndRefresh({
        game: '2048',
        score,
        containerEl: document.getElementById('lb-container'),
      });
    }
  }

  function newGame() {
    board = Array(16).fill(0);
    score = 0;
    previous = null;
    wonShown = false;
    keepPlaying = false;
    gameOver = false;
    addTile();
    addTile();
    render();
    save();
    statusElement.textContent = 'Bàn mới đã sẵn sàng. Chọn một hướng!';
  }

  function undo() {
    if (!previous) return;
    if (!modal.hidden) closeModal();
    board = previous.board.slice();
    score = previous.score;
    wonShown = previous.wonShown;
    keepPlaying = previous.keepPlaying;
    gameOver = false;
    previous = null;
    render();
    save();
    statusElement.textContent = 'Đã hoàn tác một lượt.';
  }

  const keyDirections = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    const direction = keyDirections[event.key] || keyDirections[event.key.toLowerCase()];
    if (direction) { event.preventDefault(); move(direction); }
    else if ((event.key === 'u' || event.key === 'U') && modal.hidden) { event.preventDefault(); undo(); }
    if (!modal.hidden && event.key === 'Tab') {
      const buttons = [...modalActions.querySelectorAll('button')];
      if (buttons.length && (event.shiftKey && document.activeElement === buttons[0] || !event.shiftKey && document.activeElement === buttons[buttons.length - 1])) {
        event.preventDefault(); (event.shiftKey ? buttons[buttons.length - 1] : buttons[0]).focus();
      }
    }
  });

  let touchStart = null;
  boardElement.addEventListener('touchstart', event => {
    if (event.touches.length === 1) touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  boardElement.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }, { passive: true });
  boardElement.addEventListener('touchcancel', () => { touchStart = null; });

  document.querySelectorAll('[data-direction]').forEach(button => {
    button.addEventListener('click', () => move(button.dataset.direction));
  });
  document.getElementById('restart').addEventListener('click', newGame);
  undoButton.addEventListener('click', undo);

  if (load()) {
    render();
    statusElement.textContent = gameOver ? 'Ván trước đã hết nước đi. Bạn có thể hoàn tác hoặc chơi mới.' : 'Đã khôi phục ván chơi trước.';
  } else {
    newGame();
  }
  Leaderboard.init('2048', document.getElementById('lb-container'));
})();

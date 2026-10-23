/**
 * leaderboard.js — tiện ích dùng chung cho tất cả game
 *
 * Cách dùng:
 *   Leaderboard.submit({ game, score, extra })   → gửi điểm lên server
 *   Leaderboard.load(game, containerEl)           → render top 10 vào element
 *   Leaderboard.promptAndSubmit({ game, score, extra, onDone }) → hỏi tên rồi gửi
 */
const Leaderboard = (() => {
  'use strict';

  const API = '/api/scores';
  const NAME_KEY = 'leaderboard-player-name';

  // ── submit ──────────────────────────────────────────────────────────────────
  async function submit({ game, score, extra = null }) {
    let playerName = localStorage.getItem(NAME_KEY) || '';
    if (!playerName) return; // promptAndSubmit phải được gọi trước
    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, game, score, extra }),
      });
    } catch { /* im lặng nếu offline */ }
  }

  // ── load & render ────────────────────────────────────────────────────────────
  async function load(game, containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '<p class="lb-loading">Đang tải…</p>';
    try {
      const res = await fetch(`${API}/${game}`);
      if (!res.ok) throw new Error();
      const rows = await res.json();
      render(rows, containerEl);
    } catch {
      containerEl.innerHTML = '<p class="lb-error">Không tải được bảng xếp hạng.</p>';
    }
  }

  function render(rows, el) {
    if (!rows.length) {
      el.innerHTML = '<p class="lb-empty">Chưa có điểm nào. Hãy là người đầu tiên!</p>';
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    const playerName = localStorage.getItem(NAME_KEY) || '';
    el.innerHTML = `
      <ol class="lb-list">
        ${rows.map((r, i) => `
          <li class="lb-row${r.playerName === playerName ? ' lb-me' : ''}">
            <span class="lb-rank">${medals[i] ?? i + 1}</span>
            <span class="lb-name">${escHtml(r.playerName)}</span>
            <span class="lb-score">${r.score.toLocaleString('vi-VN')}</span>
            ${r.extra ? `<span class="lb-extra">${escHtml(r.extra)}</span>` : ''}
          </li>`).join('')}
      </ol>`;
  }

  // ── prompt dialog ────────────────────────────────────────────────────────────
  function promptAndSubmit({ game, score, extra = null, onDone }) {
    // Nếu đã có tên thì submit thẳng
    const saved = localStorage.getItem(NAME_KEY);
    if (saved) {
      submit({ game, score, extra }).then(onDone);
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'lb-dialog-backdrop';
    backdrop.innerHTML = `
      <div class="lb-dialog" role="dialog" aria-modal="true" aria-labelledby="lb-dialog-title">
        <h3 id="lb-dialog-title">🏆 Lưu điểm của bạn</h3>
        <p>Nhập tên để xuất hiện trên bảng xếp hạng.</p>
        <input id="lb-name-input" type="text" maxlength="50"
               placeholder="Tên của bạn…" autocomplete="off" spellcheck="false">
        <div class="lb-dialog-actions">
          <button id="lb-skip" type="button">Bỏ qua</button>
          <button id="lb-confirm" type="button" class="lb-primary">Lưu điểm →</button>
        </div>
      </div>`;

    document.body.appendChild(backdrop);
    const input = backdrop.querySelector('#lb-name-input');
    input.focus();

    function close() { backdrop.remove(); onDone?.(); }

    backdrop.querySelector('#lb-skip').addEventListener('click', close);
    backdrop.querySelector('#lb-confirm').addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      localStorage.setItem(NAME_KEY, name);
      backdrop.remove();
      submit({ game, score, extra }).then(onDone);
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') backdrop.querySelector('#lb-confirm').click();
      if (e.key === 'Escape') close();
    });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { submit, load, promptAndSubmit };
})();

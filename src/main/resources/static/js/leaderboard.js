/**
 * leaderboard.js — tiện ích dùng chung cho tất cả game
 * Yêu cầu: user đã đăng nhập (Spring Security session)
 *
 * Cách dùng:
 *   Leaderboard.submit({ game, score, extra })  → gửi điểm lên server
 *   Leaderboard.load(game, containerEl)          → render top 10 vào element
 *   Leaderboard.submitAndRefresh({ game, score, extra, containerEl }) → gửi rồi reload bảng
 */
const Leaderboard = (() => {
  'use strict';

  const API = '/api/scores';

  // ── Lấy username hiện tại từ meta tag inject bởi server ────────────────────
  function currentUser() {
    return document.querySelector('meta[name="current-user"]')?.content || '';
  }

  // ── submit ──────────────────────────────────────────────────────────────────
  async function submit({ game, score, extra = null }) {
    try {
      const csrf = document.querySelector('meta[name="_csrf"]')?.content;
      const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;
      const headers = { 'Content-Type': 'application/json' };
      if (csrf && csrfHeader) headers[csrfHeader] = csrf;

      await fetch(API, {
        method: 'POST',
        headers,
        body: JSON.stringify({ game, score, extra }),
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
    const me = currentUser();
    el.innerHTML = `
      <ol class="lb-list">
        ${rows.map((r, i) => `
          <li class="lb-row${r.playerName === me ? ' lb-me' : ''}">
            <span class="lb-rank">${medals[i] ?? i + 1}</span>
            <span class="lb-name">${escHtml(r.playerName)}</span>
            <span class="lb-score">${r.score.toLocaleString('vi-VN')}</span>
            ${r.extra ? `<span class="lb-extra">${escHtml(r.extra)}</span>` : ''}
          </li>`).join('')}
      </ol>`;
  }

  // ── submit + tự reload bảng ──────────────────────────────────────────────────
  async function submitAndRefresh({ game, score, extra = null, containerEl }) {
    await submit({ game, score, extra });
    if (containerEl) await load(game, containerEl);
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { submit, load, submitAndRefresh };
})();

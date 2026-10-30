/**
 * leaderboard.js — tiện ích dùng chung cho tất cả game
 *
 * API:
 *   Leaderboard.init(game, containerEl)
 *     → render widget đầy đủ với 2 tab: "Tháng này" + "Tất cả thời gian"
 *
 *   Leaderboard.submitAndRefresh({ game, score, extra, containerEl })
 *     → gửi điểm rồi reload tab đang active
 */
const Leaderboard = (() => {
  'use strict';

  const API = '/api/scores';

  function currentUser() {
    return document.querySelector('meta[name="current-user"]')?.content || '';
  }

  function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function monthLabel() {
    return new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  }

  // ── CSRF ─────────────────────────────────────────────────────────────────────
  function csrfHeaders() {
    const token  = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    const h = { 'Content-Type': 'application/json' };
    if (token && header) h[header] = token;
    return h;
  }

  // ── Submit điểm ──────────────────────────────────────────────────────────────
  async function submit({ game, score, extra = null }) {
    try {
      await fetch(API, {
        method: 'POST',
        headers: csrfHeaders(),
        body: JSON.stringify({ game, score, extra }),
      });
    } catch { /* offline — im lặng */ }
  }

  // ── Fetch data ────────────────────────────────────────────────────────────────
  async function fetchAll(game) {
    const res = await fetch(`${API}/${game}`);
    if (!res.ok) throw new Error();
    return res.json();
  }

  async function fetchMonthly(game, month) {
    const res = await fetch(`${API}/${game}/monthly?month=${month}`);
    if (!res.ok) throw new Error();
    return res.json();
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  function renderRows(rows, isMonthly) {
    if (!rows.length) return '<p class="lb-empty">Chưa có điểm nào trong kỳ này.</p>';
    const medals = ['🥇', '🥈', '🥉'];
    const me = currentUser();
    return `<ol class="lb-list">
      ${rows.map((r, i) => {
        const rank   = isMonthly ? r.rank  : i + 1;
        const name   = escHtml(isMonthly ? r.playerName : r.playerName);
        const score  = (isMonthly ? r.score : r.score).toLocaleString('vi-VN');
        const extra  = isMonthly ? r.extra : r.extra;
        const reward = isMonthly ? r.reward : null;
        const isMe   = (isMonthly ? r.playerName : r.playerName) === me;
        return `<li class="lb-row${isMe ? ' lb-me' : ''}${reward ? ' lb-has-reward' : ''}">
          <span class="lb-rank">${medals[rank - 1] ?? rank}</span>
          <span class="lb-name">${name}</span>
          <span class="lb-score">${score}</span>
          ${extra ? `<span class="lb-extra">${escHtml(extra)}</span>` : ''}
          ${reward ? `<span class="lb-reward" title="${escHtml(reward.description || '')}">
            ${escHtml(reward.icon)} <span>${escHtml(reward.title)}</span>
          </span>` : ''}
        </li>`;
      }).join('')}
    </ol>`;
  }

  // ── Widget với 2 tab ──────────────────────────────────────────────────────────
  function init(game, containerEl) {
    if (!containerEl) return;

    containerEl.innerHTML = `
      <div class="lb-tabs">
        <button class="lb-tab lb-tab-active" data-tab="monthly">
          📅 ${monthLabel()}
        </button>
        <button class="lb-tab" data-tab="all">Tất cả thời gian</button>
      </div>
      <div class="lb-body" data-loading="true">
        <p class="lb-loading">Đang tải…</p>
      </div>`;

    const body = containerEl.querySelector('.lb-body');

    async function loadTab(tab) {
      body.innerHTML = '<p class="lb-loading">Đang tải…</p>';
      try {
        if (tab === 'monthly') {
          const rows = await fetchMonthly(game, currentMonth());
          body.innerHTML = renderRows(rows, true);
        } else {
          const rows = await fetchAll(game);
          body.innerHTML = renderRows(rows, false);
        }
      } catch {
        body.innerHTML = '<p class="lb-error">Không tải được bảng xếp hạng.</p>';
      }
    }

    containerEl.querySelectorAll('.lb-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        containerEl.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('lb-tab-active'));
        btn.classList.add('lb-tab-active');
        loadTab(btn.dataset.tab);
      });
    });

    // Load tab mặc định là "monthly"
    loadTab('monthly');
  }

  // ── Submit + refresh tab đang active ─────────────────────────────────────────
  async function submitAndRefresh({ game, score, extra = null, containerEl }) {
    await submit({ game, score, extra });
    if (!containerEl) return;
    const activeTab = containerEl.querySelector('.lb-tab-active')?.dataset?.tab ?? 'monthly';
    const body = containerEl.querySelector('.lb-body');
    if (!body) { init(game, containerEl); return; }
    body.innerHTML = '<p class="lb-loading">Đang tải…</p>';
    try {
      if (activeTab === 'monthly') {
        const rows = await fetchMonthly(game, currentMonth());
        body.innerHTML = renderRows(rows, true);
      } else {
        const rows = await fetchAll(game);
        body.innerHTML = renderRows(rows, false);
      }
    } catch {
      body.innerHTML = '<p class="lb-error">Không tải được bảng xếp hạng.</p>';
    }
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init, submit, submitAndRefresh };
})();

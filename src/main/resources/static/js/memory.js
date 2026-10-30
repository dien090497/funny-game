    (() => {
      'use strict';
      const symbols = ['🍓','🌼','🦋','🍋','🍄','🐸','🌈','🪐','🦊','💎','🍉','🐙'];
      const levels = {easy:{pairs:6,label:'Dễ'},medium:{pairs:8,label:'Vừa'},hard:{pairs:12,label:'Khó'}};
      const storageKey = 'memory-garden-v1';
      const $ = id => document.getElementById(id);
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { saved = {}; }
      let level = levels[saved.level] ? saved.level : 'medium';
      let deck = [], open = [], matched = 0, moves = 0, elapsed = 0, timer = null, lock = false, completed = false, mismatchTimeout = null;
      let lastFocus = null;
      function persist() { try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch {} }
      function shuffle(items) { for (let i=items.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [items[i],items[j]]=[items[j],items[i]]; } return items; }
      function format(s) { return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }
      function updateStats() { $('time').textContent=format(elapsed); $('moves').textContent=String(moves); $('pairs').textContent=`${matched}/${levels[level].pairs}`; }
      function updateRecord() { const r=saved.records?.[level]; $('best').textContent=r ? `${r.moves} lượt · ${format(r.time)}` : 'Chưa có'; $('best-detail').textContent=r ? 'Ít lượt nhất, sau đó nhanh nhất' : 'Hoàn thành ván đầu tiên để lập kỷ lục'; }
      function setStatus(message) { $('status').textContent=message; }
      function stopTimer() { if (timer) clearInterval(timer); timer=null; }
      function startTimer() { if (timer) return; timer=setInterval(() => { elapsed++; updateStats(); },1000); }
      function closeVictory() { $('victory').hidden=true; if (lastFocus?.isConnected) lastFocus.focus(); lastFocus=null; }
      function newGame(nextLevel=level) {
        if (mismatchTimeout) clearTimeout(mismatchTimeout);
        mismatchTimeout=null; stopTimer(); if (!$('victory').hidden) closeVictory();
        level=nextLevel; saved.level=level; persist();
        deck=shuffle([...symbols.slice(0,levels[level].pairs),...symbols.slice(0,levels[level].pairs)]);
        open=[]; matched=0; moves=0; elapsed=0; lock=false; completed=false;
        $('game-title').textContent=`Bàn chơi · ${levels[level].label}`;
        document.querySelectorAll('.level').forEach(button => { const selected=button.dataset.level===level; button.classList.toggle('active',selected); button.setAttribute('aria-pressed',String(selected)); });
        const board=$('board'); board.replaceChildren(); board.classList.toggle('large',level==='hard');
        deck.forEach((symbol,index) => {
          const card=document.createElement('button'); card.type='button'; card.className='card'; card.dataset.index=String(index);
          card.setAttribute('aria-label',`Thẻ ${index+1}: úp`);
          const inner=document.createElement('span'); inner.className='card-inner';
          const back=document.createElement('span'); back.className='face back'; back.setAttribute('aria-hidden','true'); back.textContent='✦';
          const front=document.createElement('span'); front.className='face front'; front.setAttribute('aria-hidden','true'); front.textContent=symbol;
          inner.append(back,front); card.append(inner); card.addEventListener('click',() => flip(index)); board.append(card);
        });
        updateStats(); updateRecord(); setStatus('Chọn một thẻ để bắt đầu!');
      }
      function cardAt(i) { return $('board').children[i]; }
      function reveal(i) { const card=cardAt(i); card.classList.add('flipped'); card.setAttribute('aria-label',`Thẻ ${i+1}: ${deck[i]}`); }
      function conceal(i) { const card=cardAt(i); card.classList.remove('flipped'); card.setAttribute('aria-label',`Thẻ ${i+1}: úp`); }
      function finish() {
        completed=true; stopTimer(); setStatus('Bạn đã tìm thấy tất cả các cặp!');
        const previous=saved.records?.[level];
        const isBest=!previous || moves<previous.moves || (moves===previous.moves && elapsed<previous.time);
        if (isBest) { saved.records={...saved.records,[level]:{moves,time:elapsed}}; persist(); updateRecord(); }
        lastFocus=document.activeElement;
        $('victory-message').innerHTML=`Hoàn thành trong <strong>${moves} lượt</strong> và <strong>${format(elapsed)}</strong>. ${isBest?'Kỷ lục mới!':'Thử thêm một ván để vượt kỷ lục nhé.'}`;
        $('victory').hidden=false; $('play-again').focus();
        // score = số lượt đảo ngược để dễ so sánh (ít lượt hơn = tốt hơn → dùng 10000 - moves)
        const leaderboardScore = Math.max(0, 10000 - moves * 10 - elapsed);
        Leaderboard.submitAndRefresh({
          game: 'memory',
          score: leaderboardScore,
          extra: `moves=${moves},time=${elapsed},difficulty=${level}`,
          containerEl: document.getElementById('lb-container'),
        });
      }
      function flip(index) {
        if (lock || completed || open.includes(index) || cardAt(index).classList.contains('matched')) return;
        startTimer(); reveal(index); open.push(index);
        if (open.length===1) { setStatus('Tìm thẻ còn lại của cặp này.'); return; }
        moves++; updateStats(); lock=true;
        const [a,b]=open;
        if (deck[a]===deck[b]) {
          cardAt(a).classList.add('matched'); cardAt(b).classList.add('matched');
          cardAt(a).setAttribute('aria-label',`Thẻ ${a+1}: ${deck[a]}, đã ghép`);
          cardAt(b).setAttribute('aria-label',`Thẻ ${b+1}: ${deck[b]}, đã ghép`);
          cardAt(a).disabled=true; cardAt(b).disabled=true;
          matched++; open=[]; lock=false; updateStats();
          if (matched===levels[level].pairs) finish(); else setStatus('Ghép đúng! Tiếp tục tìm các cặp còn lại.');
        } else {
          setStatus('Chưa trùng. Hãy ghi nhớ vị trí của chúng!');
          mismatchTimeout=setTimeout(() => { conceal(a); conceal(b); open=[]; lock=false; mismatchTimeout=null; setStatus('Chọn hai thẻ tiếp theo.'); },900);
        }
      }
      document.querySelectorAll('.level').forEach(button => button.addEventListener('click',() => newGame(button.dataset.level)));
      $('reset').addEventListener('click',() => newGame());
      $('play-again').addEventListener('click',() => { newGame(); $('reset').focus(); });
      $('victory').addEventListener('keydown',e => { if (e.key==='Tab') { e.preventDefault(); $('play-again').focus(); } });
      newGame();
      Leaderboard.load('memory', document.getElementById('lb-container'));
    })();

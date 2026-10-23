(() => {
  'use strict';

  const WIDTH = 960, HEIGHT = 600, DURATION = 180, KEY = 'last-light-arena-v1';
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const random = (a,b) => a + Math.random() * (b-a);
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const timeText = t => `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
  const upgrades = [
    {id:'damage',icon:'✹',name:'Đạn mạnh',text:'Tăng sát thương Đạn sáng.',max:5},
    {id:'rapid',icon:'➶',name:'Bắn nhanh',text:'Giảm thời gian giữa hai phát bắn.',max:5},
    {id:'speed',icon:'↗',name:'Chân nhẹ',text:'Tăng tốc độ di chuyển.',max:4},
    {id:'magnet',icon:'✧',name:'Hút tinh thể',text:'Thu hút kinh nghiệm từ xa hơn.',max:4},
    {id:'health',icon:'♥',name:'Thêm sinh lực',text:'Tăng 1 máu tối đa và hồi 2 máu.',max:5},
    {id:'blade',icon:'◌',name:'Lưỡi xoay',text:'Mở khóa hoặc tăng sức mạnh vũ khí xoay.',max:4},
    {id:'pulse',icon:'◎',name:'Xung điện',text:'Mở khóa hoặc tăng sức mạnh sóng điện.',max:4}
  ];
  const keys = new Set();
  let joystick = {x:0,y:0};
  let phase = 'menu', game = null, best = {kills:0,time:0,wins:0}, snapshot = null;
  let lastFrame = 0, saveClock = 0;

  function freshGame() {
    return {time:0,kills:0,level:1,xp:0,player:{x:WIDTH/2,y:HEIGHT/2,hp:5,maxHp:5,invuln:0},
      enemies:[],gems:[],shots:[],spawnClock:.9,shotClock:.1,pulseClock:4,pulseEffect:0,bladeAngle:0,
      levels:{damage:1,rapid:0,speed:0,magnet:0,health:0,blade:0,pulse:0},choices:[]};
  }
  const neededXp = () => 4 + game.level * 3;
  function store() {
    try { localStorage.setItem(KEY,JSON.stringify({best,snapshot:game && phase!=='ended' ? {game,phase} : null})); } catch {}
  }
  function read() {
    try {
      const data=JSON.parse(localStorage.getItem(KEY)||'null');
      if (!data) return;
      if (data.best && Number.isFinite(data.best.kills) && Number.isFinite(data.best.time)) best={kills:Math.max(0,data.best.kills),time:Math.max(0,data.best.time),wins:Math.max(0,data.best.wins||0)};
      const s=data.snapshot, g=s?.game;
      if (g && Number.isFinite(g.time) && g.time>=0 && g.time<DURATION &&
          Number.isFinite(g.player?.x) && Number.isFinite(g.player?.y) && Number.isFinite(g.player?.hp) && g.player.hp>0 &&
          Array.isArray(g.enemies) && Array.isArray(g.gems) && Array.isArray(g.shots) && g.levels &&
          g.enemies.length<200 && g.gems.length<500 && g.shots.length<250 &&
          ['playing','paused','upgrade'].includes(s.phase)) snapshot=s;
    } catch {}
  }

  function updateHud() {
    $('timer').innerHTML=`${timeText(game?.time||0)} <small>/ 03:00</small>`;
    $('kills').textContent=String(game?.kills||0);
    $('level').textContent=String(game?.level||1);
    const hp=Math.max(0,Math.ceil(game?.player.hp||0)), max=Math.min(10,game?.player.maxHp||5);
    $('health').textContent='♥ '.repeat(Math.min(hp,max))+'♡ '.repeat(Math.max(0,max-hp));
    $('xp-label').textContent=`CẤP ${game?.level||1}`;
    $('xp-count').textContent=`${game?.xp||0} / ${game?neededXp():7} XP`;
    $('xp-fill').style.width=`${game?clamp(game.xp/neededXp()*100,0,100):0}%`;
    $('best-kills').textContent=String(best.kills);
    $('best-time').textContent=timeText(best.time);
    $('pause').innerHTML=phase==='playing'?'Ⅱ <span>Tạm dừng</span>':'▶ <span>Tiếp tục</span>';
    $('pause').disabled=!['playing','paused'].includes(phase);
    $('status').textContent={menu:'Sẵn sàng vào đấu trường',playing:'Đang chiến đấu',paused:'Ván chơi đã tạm dừng',upgrade:'Chọn một nâng cấp',ended:'Ván chơi kết thúc'}[phase];
  }

  function screen(html) { $('screen-content').innerHTML=html; $('screen').hidden=false; updateHud(); }
  function hideScreen() { $('screen').hidden=true; updateHud(); }
  function menu() {
    phase='menu'; game=null;
    screen(`<div class="screen-icon">✳</div><h3>Ba phút cuối cùng</h3><p>Di chuyển để né quái. Đạn sáng tự tìm mục tiêu. Nhặt tinh thể để lên cấp và chọn vũ khí mới.</p><button type="button" class="primary" id="start-game">Bắt đầu sinh tồn →</button>${snapshot?'<button type="button" class="secondary" id="resume-game">Tiếp tục ván đã lưu</button>':''}`);
    $('start-game').addEventListener('click',newGame);
    $('resume-game')?.addEventListener('click',resumeGame);
  }
  function newGame() { game=freshGame(); snapshot=null; phase='playing'; saveClock=0; hideScreen(); store(); }
  function resumeGame() {
    if (!snapshot) return;
    game=snapshot.game;
    phase=snapshot.phase==='upgrade'?'upgrade':'paused';
    snapshot=null;
    if (phase==='upgrade') showUpgrades(); else showPause();
  }
  function pause() {
    if (phase!=='playing') return;
    phase='paused'; keys.clear(); joystick={x:0,y:0}; showPause(); store();
  }
  function showPause() {
    screen(`<div class="screen-icon">Ⅱ</div><h3>Tạm dừng</h3><p>Ván chơi được lưu tự động. Còn ${timeText(Math.max(0,DURATION-game.time))} để sống sót.</p><button type="button" class="primary" id="continue-game">Tiếp tục →</button>`);
    $('continue-game').addEventListener('click',()=>{phase='playing';hideScreen();store();});
  }
  function end(win) {
    phase='ended'; keys.clear(); joystick={x:0,y:0};
    best.kills=Math.max(best.kills,game.kills);
    best.time=Math.max(best.time,Math.min(DURATION,game.time));
    if (win) best.wins++;
    store(); updateHud();
    screen(`<div class="screen-icon">${win?'★':'✕'}</div><h3>${win?'Bạn đã sống sót!':'Ánh sáng đã tắt'}</h3><p>${win?'Bạn trụ vững đủ 3 phút.':'Thử một cách kết hợp vũ khí khác ở ván tiếp theo.'}<br>Thời gian: <b>${timeText(game.time)}</b> · Hạ gục: <b>${game.kills}</b> · Cấp: <b>${game.level}</b></p><button type="button" class="primary" id="again">Chơi ván mới →</button>`);
    $('again').addEventListener('click',newGame);
    Leaderboard.promptAndSubmit({
      game: 'arena',
      score: game.kills,
      extra: `time=${Math.floor(game.time)},level=${game.level},win=${win?1:0}`,
      onDone: () => Leaderboard.load('arena', document.getElementById('lb-container')),
    });
  }

  function availableUpgrades() {
    return upgrades.filter(u=>game.levels[u.id]<u.max);
  }
  function offerUpgrades() {
    game.xp-=neededXp(); game.level++;
    phase='upgrade'; keys.clear(); joystick={x:0,y:0};
    const available=availableUpgrades().sort(()=>Math.random()-.5);
    game.choices=available.slice(0,3).map(u=>u.id);
    if (game.choices.length<3) game.choices.push('heal');
    showUpgrades(); store();
  }
  function showUpgrades() {
    screen('<div class="screen-icon">✦</div><h3>Lên cấp '+game.level+'!</h3><p>Chọn một nâng cấp. Thời gian được tạm dừng trong lúc chọn.</p><div class="upgrade-list" id="upgrade-list"></div>');
    const list=$('upgrade-list');
    game.choices.forEach(id=>{
      const u=upgrades.find(x=>x.id===id)||{id:'heal',icon:'♥',name:'Hồi phục',text:'Hồi 2 sinh lực.'};
      const button=document.createElement('button'); button.type='button'; button.className='upgrade-card';
      const icon=document.createElement('span'); icon.className='emoji'; icon.textContent=u.icon;
      const name=document.createElement('strong'); name.textContent=u.name;
      const description=document.createElement('small'); description.textContent=u.text+(id!=='heal'?` Cấp ${game.levels[id]+1}.`:'');
      button.append(icon,name,description); button.addEventListener('click',()=>chooseUpgrade(id)); list.append(button);
    });
  }
  function chooseUpgrade(id) {
    if (phase!=='upgrade'||!game.choices.includes(id)) return;
    if (id==='heal') game.player.hp=Math.min(game.player.maxHp,game.player.hp+2);
    else {
      game.levels[id]++;
      if (id==='health') { game.player.maxHp++; game.player.hp=Math.min(game.player.maxHp,game.player.hp+2); }
    }
    game.choices=[];
    if (game.xp>=neededXp()) offerUpgrades();
    else { phase='playing'; hideScreen(); store(); }
  }

  function spawnEnemy() {
    if (game.enemies.length>=85) return;
    const t=game.time, roll=Math.random();
    const kind=t>35 && roll<Math.min(.24,.09+t/900)?'brute':t>15 && roll<.42?'runner':'grunt';
    const side=Math.floor(Math.random()*4), margin=28;
    const x=side===0?-margin:side===1?WIDTH+margin:random(0,WIDTH);
    const y=side===2?-margin:side===3?HEIGHT+margin:random(0,HEIGHT);
    const data={grunt:{hp:2,speed:56,r:13,xp:1,points:10},runner:{hp:1,speed:102,r:10,xp:1,points:15},brute:{hp:7,speed:37,r:21,xp:3,points:35}}[kind];
    const hp=data.hp+(kind==='brute'&&t>105?2:0);
    game.enemies.push({x,y,kind,hp,maxHp:hp,speed:data.speed,r:data.r,xp:data.xp,points:data.points,bladeCooldown:0});
  }
  function nearest(maxRange) {
    let target=null, bestDistance=maxRange;
    for (const e of game.enemies) {const d=distance(e,game.player);if (e.hp>0&&d<bestDistance) {bestDistance=d;target=e;}}
    return target;
  }
  function damageEnemy(e,amount) {
    if (e.hp<=0) return;
    e.hp-=amount;
    if (e.hp<=0) {
      game.kills++; game.gems.push({x:e.x,y:e.y,value:e.xp});
    }
  }
  function inputVector() {
    let x=(keys.has('right')?1:0)-(keys.has('left')?1:0)+joystick.x;
    let y=(keys.has('down')?1:0)-(keys.has('up')?1:0)+joystick.y;
    const len=Math.hypot(x,y); if (len>1) {x/=len;y/=len;}
    return {x,y};
  }
  function update(dt) {
    game.time+=dt;
    if (game.time>=DURATION) {game.time=DURATION;end(true);return;}
    const p=game.player, input=inputVector();
    const moveSpeed=190+game.levels.speed*23;
    p.x=clamp(p.x+input.x*moveSpeed*dt,17,WIDTH-17);
    p.y=clamp(p.y+input.y*moveSpeed*dt,17,HEIGHT-17);
    p.invuln=Math.max(0,p.invuln-dt);
    game.spawnClock-=dt;
    if (game.spawnClock<=0) {
      spawnEnemy();
      game.spawnClock+=Math.max(.34,1.12-game.time*.0042);
    }
    for (const e of game.enemies) {
      if (e.hp<=0) continue;
      const dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy)||1;
      e.x+=dx/d*e.speed*dt; e.y+=dy/d*e.speed*dt;
      e.bladeCooldown=Math.max(0,e.bladeCooldown-dt);
      if (d<e.r+12 && p.invuln===0) {
        p.hp--; p.invuln=1.15;
        if (p.hp<=0) {end(false);return;}
      }
    }
    game.shotClock-=dt;
    if (game.shotClock<=0) {
      const target=nearest(520);
      if (target) {
        const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;
        game.shots.push({x:p.x,y:p.y,vx:dx/d*470,vy:dy/d*470,life:1.2,damage:2+(game.levels.damage-1)});
        game.shotClock=Math.max(.18,.53-game.levels.rapid*.07);
      } else game.shotClock=.08;
    }
    game.shots=game.shots.filter(s=>{
      s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
      if (s.life<=0||s.x<0||s.y<0||s.x>WIDTH||s.y>HEIGHT) return false;
      for (const e of game.enemies) if (e.hp>0&&distance(s,e)<e.r+5) {damageEnemy(e,s.damage);return false;}
      return true;
    });
    game.bladeAngle+=dt*3.6;
    if (game.levels.blade) {
      const count=game.levels.blade>=3?2:1, radius=49;
      for (let i=0;i<count;i++) {
        const angle=game.bladeAngle+i*Math.PI*2/count;
        const blade={x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius};
        for (const e of game.enemies) if (e.hp>0&&e.bladeCooldown<=0&&distance(e,blade)<e.r+12) {
          damageEnemy(e,game.levels.blade>=4?3:2);e.bladeCooldown=.48;
        }
      }
    }
    if (game.levels.pulse) {
      game.pulseClock-=dt;
      if (game.pulseClock<=0) {
        const radius=105+game.levels.pulse*18;
        for (const e of game.enemies) if (e.hp>0&&distance(e,p)<radius+e.r) damageEnemy(e,game.levels.pulse+1);
        game.pulseEffect=.38;
        game.pulseClock=Math.max(2.1,4.5-game.levels.pulse*.5);
      }
    }
    game.pulseEffect=Math.max(0,game.pulseEffect-dt);
    game.enemies=game.enemies.filter(e=>e.hp>0);
    const pickupRadius=25+game.levels.magnet*47;
    game.gems=game.gems.filter(g=>{
      const d=distance(g,p);
      if (d<pickupRadius+45 && d>1) {const pull=Math.min(d,dt*(120+game.levels.magnet*70));g.x+=(p.x-g.x)/d*pull;g.y+=(p.y-g.y)/d*pull;}
      if (distance(g,p)<pickupRadius) {game.xp+=g.value;return false;}
      return true;
    });
    if (game.xp>=neededXp()) {offerUpgrades();return;}
    saveClock+=dt;
    if (saveClock>=4) {saveClock=0;store();}
    updateHud();
  }

  function draw() {
    ctx.fillStyle='#132a35';ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.strokeStyle='#ffffff0a';ctx.lineWidth=1;
    for (let x=0;x<=WIDTH;x+=40) {ctx.beginPath();ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,HEIGHT);ctx.stroke();}
    for (let y=0;y<=HEIGHT;y+=40) {ctx.beginPath();ctx.moveTo(0,y+.5);ctx.lineTo(WIDTH,y+.5);ctx.stroke();}
    if (!game) {
      ctx.fillStyle='#d6ee9d55';ctx.beginPath();ctx.arc(WIDTH/2,HEIGHT/2,14,0,Math.PI*2);ctx.fill();return;
    }
    const p=game.player;
    for (const gem of game.gems) {
      ctx.save();ctx.translate(gem.x,gem.y);ctx.rotate(Math.PI/4);ctx.fillStyle=gem.value>1?'#f7d190':'#91e1e3';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.fillRect(-5,-5,10,10);ctx.restore();
    }
    for (const e of game.enemies) {
      const color=e.kind==='runner'?'#eea17e':e.kind==='brute'?'#ae9bdd':'#dc8790';
      ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=9;
      ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#233140';ctx.beginPath();ctx.arc(e.x-4,e.y-3,2,0,Math.PI*2);ctx.arc(e.x+4,e.y-3,2,0,Math.PI*2);ctx.fill();
      if (e.kind==='brute') {ctx.fillStyle='#0b1420';ctx.fillRect(e.x-17,e.y-e.r-9,34,3);ctx.fillStyle='#dfb3ed';ctx.fillRect(e.x-17,e.y-e.r-9,34*clamp(e.hp/e.maxHp,0,1),3);}
    }
    for (const s of game.shots) {ctx.fillStyle='#e6f7aa';ctx.shadowColor='#d8f69b';ctx.shadowBlur=15;ctx.beginPath();ctx.arc(s.x,s.y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
    if (game.pulseEffect>0) {ctx.strokeStyle=`rgba(175,231,243,${game.pulseEffect*1.8})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(p.x,p.y,105+game.levels.pulse*18*(1-game.pulseEffect/.38),0,Math.PI*2);ctx.stroke();}
    if (game.levels.blade) {
      const count=game.levels.blade>=3?2:1;
      for (let i=0;i<count;i++) {
        const a=game.bladeAngle+i*Math.PI*2/count,x=p.x+Math.cos(a)*49,y=p.y+Math.sin(a)*49;
        ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#e5e6fa';ctx.shadowColor='#c4c5fa';ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-9,-8);ctx.lineTo(-6,0);ctx.lineTo(-9,8);ctx.closePath();ctx.fill();ctx.restore();
      }
    }
    ctx.globalAlpha=p.invuln>0&&Math.floor(p.invuln*10)%2===0?.5:1;
    ctx.fillStyle='#d8f28c';ctx.shadowColor='#b9e987';ctx.shadowBlur=22;
    ctx.beginPath();ctx.arc(p.x,p.y,13,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='#f7ffdf';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,18,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }

  function frame(now) {
    const dt=Math.min(.05,(now-lastFrame)/1000||0);lastFrame=now;
    if (phase==='playing') update(dt);
    draw();requestAnimationFrame(frame);
  }
  const keyMap={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',a:'left',s:'down',d:'right'};
  document.addEventListener('keydown',e=>{
    if (e.altKey||e.ctrlKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const direction=keyMap[e.key]||keyMap[e.key.toLowerCase()];
    if (direction) {e.preventDefault();keys.add(direction);}
    if (e.code==='Space'||e.key.toLowerCase()==='p') {
      e.preventDefault();if (phase==='playing') pause();else if (phase==='paused') {phase='playing';hideScreen();store();}
    }
  });
  document.addEventListener('keyup',e=>{const direction=keyMap[e.key]||keyMap[e.key.toLowerCase()];if (direction) keys.delete(direction);});
  window.addEventListener('blur',()=>{keys.clear();pause();});
  document.addEventListener('visibilitychange',()=>{if (document.hidden) pause();});
  $('pause').addEventListener('click',()=>{if (phase==='playing') pause();else if (phase==='paused') {phase='playing';hideScreen();store();}});
  $('restart').addEventListener('click',newGame);
  const stick=$('joystick'),knob=$('joystick-knob');let pointerId=null;
  function moveStick(e) {
    const box=stick.getBoundingClientRect(), cx=box.left+box.width/2,cy=box.top+box.height/2;
    let x=(e.clientX-cx)/(box.width*.35),y=(e.clientY-cy)/(box.height*.35);
    const length=Math.hypot(x,y);if (length>1) {x/=length;y/=length;}
    joystick={x,y};knob.style.transform=`translate(${x*box.width*.28}px,${y*box.height*.28}px)`;
  }
  stick.addEventListener('pointerdown',e=>{pointerId=e.pointerId;stick.setPointerCapture(pointerId);moveStick(e);});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===pointerId)moveStick(e);});
  function releaseStick(e){if(e.pointerId!==pointerId)return;pointerId=null;joystick={x:0,y:0};knob.style.transform='';}
  stick.addEventListener('pointerup',releaseStick);stick.addEventListener('pointercancel',releaseStick);

  read();menu();requestAnimationFrame(frame);
  Leaderboard.load('arena', document.getElementById('lb-container'));
})();

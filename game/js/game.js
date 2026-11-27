// Plucky's Great Escape — game.js: the run itself. Plucky the turkey bolts
// from the farmhouse table and runs 1500 m to the forest while Farmer Bram
// gives chase. This file owns the state machine, the turkey's physics, the
// farmer's pursuit, collisions, scoring and the HUD; art.js draws, world.js
// deals the obstacles, audio.js makes the noise.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const A = PluckyArt;
  const W = A.W;
  const H = A.H;
  const GROUND_Y = A.GROUND_Y;

  const TURKEY_X = 252;
  const GRAVITY = 2500;
  const JUMP_VEL = -905;
  const DOUBLE_JUMP_VEL = -830;
  const PX_PER_METRE = 48;
  const CAUGHT_GAP = 62;

  const game = {
    state: 'title', // title | playing | paused | caught | escaped
    time: 0,
    runTime: 0,
    distanceM: 0,
    score: 0,
    best: 0,
    corn: 0,
    cleared: 0,
  };

  const turkey = {
    feetY: GROUND_Y,
    vy: 0,
    onGround: true,
    jumps: 0,
    ducking: false,
    runPhase: 0,
    stumbleTimer: 0,
    invulnTimer: 0,
    height: 96,
  };

  const farmer = {
    gap: 470,
    runPhase: 0,
    whistleTimer: 0,
  };

  let speed = 0;          // current px/s the world moves at
  let scrollX = 0;
  let stamina = 100;
  let tired = false;
  let shake = 0;
  let items = [];         // obstacles and corn, in screen space
  let particles = [];
  let floaters = [];
  let spawner = null;
  let stageIndex = 0;
  let bannerText = '';
  let bannerTimer = 0;
  let endTimer = 0;       // guards against instant accidental restarts
  let dustTimer = 0;

  // --- run setup -------------------------------------------------------------
  function resetRun() {
    game.runTime = 0;
    game.distanceM = 0;
    game.score = 0;
    game.corn = 0;
    game.cleared = 0;
    turkey.feetY = GROUND_Y;
    turkey.vy = 0;
    turkey.onGround = true;
    turkey.jumps = 0;
    turkey.ducking = false;
    turkey.stumbleTimer = 0;
    turkey.invulnTimer = 0;
    farmer.gap = 470;
    farmer.whistleTimer = 0;
    speed = 335;
    scrollX = 0;
    stamina = 100;
    tired = false;
    shake = 0;
    items = [];
    particles = [];
    floaters = [];
    spawner = PluckyWorld.makeSpawner(GROUND_Y);
    stageIndex = 0;
    bannerText = PluckyWorld.STAGES[0].banner;
    bannerTimer = 2.4;
  }

  function startRun() {
    resetRun();
    game.state = 'playing';
    PluckyAudio.click();
    PluckyAudio.startMusic();
  }

  function endRun(escaped) {
    game.state = escaped ? 'escaped' : 'caught';
    endTimer = 0;
    game.best = Math.max(game.best, game.score);
    PluckyAudio.stopMusic();
    if (escaped) PluckyAudio.escaped();
    else PluckyAudio.caught();
  }

  // --- actions -----------------------------------------------------------------
  function jump() {
    if (game.state !== 'playing') return;
    if (turkey.onGround) {
      turkey.vy = JUMP_VEL;
      turkey.onGround = false;
      turkey.jumps = 1;
      PluckyAudio.jump();
      puff(TURKEY_X - 10, GROUND_Y, 5, '#cbb27a');
    } else if (turkey.jumps < 2) {
      turkey.vy = DOUBLE_JUMP_VEL;
      turkey.jumps = 2;
      PluckyAudio.doubleJump();
      feathers(TURKEY_X - 16, turkey.feetY - 40, 5);
    }
  }

  function stumble(ob) {
    turkey.stumbleTimer = 0.95;
    turkey.invulnTimer = 1.35;
    stamina = Math.max(0, stamina - 12);
    shake = 0.4;
    feathers(TURKEY_X, turkey.feetY - 52, 12);
    addFloater(TURKEY_X + 30, turkey.feetY - 120, 'OUCH!', '#d64541');
    PluckyAudio.stumble();
    ob.passed = true; // the obstacle that tripped Plucky cannot trip twice
  }

  // --- particles and floaters ---------------------------------------------------
  function feathers(x, y, n) {
    const colors = ['#c1443c', '#d2691e', '#e9a13b', '#8a5a2b'];
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y,
        vx: -60 - Math.random() * 160,
        vy: -40 - Math.random() * 130,
        life: 0.7 + Math.random() * 0.5,
        t: 0,
        size: 4 + Math.random() * 5,
        color: colors[i % colors.length],
        grav: 300,
        spin: Math.random() * 6,
      });
    }
  }

  function puff(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 22,
        y: y - Math.random() * 6,
        vx: -40 - Math.random() * 70,
        vy: -12 - Math.random() * 30,
        life: 0.4 + Math.random() * 0.3,
        t: 0,
        size: 3 + Math.random() * 5,
        color,
        grav: -40,
        spin: 0,
      });
    }
  }

  function sparkle(x, y) {
    for (let i = 0; i < 7; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 130,
        vy: (Math.random() - 0.5) * 130,
        life: 0.35,
        t: 0,
        size: 2.5 + Math.random() * 2.5,
        color: '#ffe97a',
        grav: 0,
        spin: 0,
      });
    }
  }

  function addFloater(x, y, text, color) {
    floaters.push({ x, y, text, color, t: 0, life: 1.0 });
  }

  // --- the update ----------------------------------------------------------------
  function update(dt) {
    game.time += dt;
    if (game.state === 'caught' || game.state === 'escaped') endTimer += dt;
    if (game.state !== 'playing') return;
    game.runTime += dt;

    // speed: the run keeps getting faster; stumbling and exhaustion bite
    speed = Math.min(655, speed + 5.2 * dt);
    let factor = 1;
    if (turkey.stumbleTimer > 0) {
      factor = 0.45;
      turkey.stumbleTimer -= dt;
    }
    if (tired) factor = Math.min(factor, 0.74);
    const runSpeed = speed * factor;

    // stamina: running burns it, corn restores it
    stamina = Math.max(0, stamina - 1.55 * dt);
    if (stamina <= 0) tired = true;
    if (tired && stamina > 26) tired = false;

    game.distanceM += (runSpeed * dt) / PX_PER_METRE;
    game.score = Math.floor(game.distanceM) * 2 + game.corn * 150 + game.cleared * 25;
    scrollX += runSpeed * dt;

    // stages
    const now = PluckyWorld.stageAt(game.distanceM);
    if (now.index !== stageIndex) {
      stageIndex = now.index;
      bannerText = now.stage.banner;
      bannerTimer = 2.4;
      PluckyAudio.gobble();
    }
    if (bannerTimer > 0) bannerTimer -= dt;

    // turkey physics
    if (!turkey.onGround) {
      turkey.vy += GRAVITY * dt;
      if (turkey.ducking) turkey.vy = Math.max(turkey.vy, 980); // fast-fall
      turkey.feetY += turkey.vy * dt;
      if (turkey.feetY >= GROUND_Y) {
        turkey.feetY = GROUND_Y;
        turkey.vy = 0;
        turkey.onGround = true;
        turkey.jumps = 0;
        puff(TURKEY_X, GROUND_Y, 4, '#cbb27a');
      }
    }
    turkey.height = turkey.ducking && turkey.onGround ? 54 : 96;
    turkey.runPhase += dt * runSpeed * 0.048;
    if (turkey.invulnTimer > 0) turkey.invulnTimer -= dt;

    // farmer pursuit: he hovers just off-screen, surges when Plucky trips,
    // and rubber-bands so a clean run keeps him close but never hopeless
    let farmerSpeed = runSpeed * 0.972;
    if (turkey.stumbleTimer > 0) farmerSpeed = runSpeed * 1.32;
    else if (farmer.gap > 430) farmerSpeed = runSpeed * 1.07;
    else if (farmer.gap < 150) farmerSpeed = runSpeed * 0.93;
    farmer.gap += (runSpeed - farmerSpeed) * dt;
    farmer.gap = Math.max(0, farmer.gap);
    farmer.runPhase += dt * Math.max(120, farmerSpeed) * 0.042;
    if (farmer.gap < 235) {
      farmer.whistleTimer -= dt;
      if (farmer.whistleTimer <= 0) {
        PluckyAudio.whistle();
        farmer.whistleTimer = 2.6;
      }
    }
    if (farmer.gap <= CAUGHT_GAP) { endRun(false); return; }

    // spawning and item motion
    for (const s of spawner.update(runSpeed * dt, stageIndex)) items.push(s);
    const tBox = { l: TURKEY_X - 26, r: TURKEY_X + 36, top: turkey.feetY - turkey.height, bottom: turkey.feetY };
    for (const it of items) {
      it.x -= runSpeed * dt;
      if (it.kind === 'corn') {
        if (!it.taken &&
            Math.abs(it.x - TURKEY_X) < 42 &&
            Math.abs(it.y - (turkey.feetY - 50)) < 50) {
          it.taken = true;
          game.corn++;
          stamina = Math.min(100, stamina + 22);
          sparkle(it.x, it.y);
          addFloater(it.x, it.y - 34, '+150', '#e9b949');
          PluckyAudio.corn();
        }
        continue;
      }
      // obstacle: cleared?
      if (!it.passed && it.x + it.w < TURKEY_X - 30) {
        it.passed = true;
        game.cleared++;
        addFloater(TURKEY_X + 16, turkey.feetY - 118, '+25', '#7d9b3a');
      }
      // obstacle: collision
      if (turkey.invulnTimer <= 0 && it.x < tBox.r && it.x + it.w > tBox.l) {
        if (it.type === 'hangingknife') {
          if (tBox.top < GROUND_Y - 60) stumble(it);
        } else if (tBox.bottom > GROUND_Y - it.h + 12) {
          stumble(it);
        }
      }
    }
    items = items.filter((it) => it.x > -160 && !it.taken);

    // particles, floaters, dust
    dustTimer -= dt;
    if (turkey.onGround && dustTimer <= 0) {
      puff(TURKEY_X - 26, GROUND_Y, 1, '#d8c08d');
      dustTimer = 0.09;
    }
    for (const p of particles) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.grav * dt;
    }
    particles = particles.filter((p) => p.t < p.life);
    for (const f of floaters) { f.t += dt; f.y -= 34 * dt; }
    floaters = floaters.filter((f) => f.t < f.life);
    if (shake > 0) shake = Math.max(0, shake - dt * 1.4);

    // the forest!
    if (game.distanceM >= PluckyWorld.ESCAPE_DISTANCE) endRun(true);
  }

  // --- drawing ---------------------------------------------------------------------
  function drawScene() {
    const stage = PluckyWorld.STAGES[stageIndex];
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake * 22, (Math.random() - 0.5) * shake * 16);
    }
    A.drawFarLayer(ctx, stage.key, scrollX);
    A.drawMidLayer(ctx, stage.key, scrollX);
    A.drawGround(ctx, stage.key, scrollX);

    for (const it of items) {
      if (it.kind === 'corn') A.drawCorn(ctx, it.x, it.y, game.time);
      else A.drawObstacle(ctx, it);
    }

    // farmer (only his menace shows when he is far back)
    const farmerX = TURKEY_X - farmer.gap;
    if (farmerX > -130) {
      A.drawFarmer(ctx, farmerX, GROUND_Y, {
        runPhase: farmer.runPhase,
        surge: turkey.stumbleTimer > 0,
      });
      if (farmer.gap < 210 && Math.floor(game.time * 3) % 2 === 0) {
        ctx.fillStyle = '#d64541';
        ctx.font = '900 44px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', farmerX + 6, GROUND_Y - 196);
      }
    }

    // Plucky, blinking while untouchable after a stumble
    const blink = turkey.invulnTimer > 0 && Math.floor(game.time * 14) % 2 === 0;
    ctx.globalAlpha = blink ? 0.45 : 1;
    A.drawTurkey(ctx, TURKEY_X, turkey.feetY, {
      runPhase: turkey.runPhase,
      ducking: turkey.ducking && turkey.onGround,
      airborne: !turkey.onGround,
      tilt: turkey.onGround ? 0 : Math.max(-0.26, Math.min(0.34, turkey.vy / 2600)),
    });
    ctx.globalAlpha = 1;

    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin + p.t * 4);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    ctx.restore();

    for (const f of floaters) {
      ctx.globalAlpha = 1 - f.t / f.life;
      ctx.fillStyle = f.color;
      ctx.font = '800 22px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = 'rgba(43, 26, 18, 0.78)';
    A.roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(247, 232, 201, 0.5)';
    ctx.lineWidth = 2;
    A.roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();
  }

  function drawHUD() {
    const stage = PluckyWorld.STAGES[stageIndex];
    ctx.textBaseline = 'alphabetic';
    // score
    panel(16, 14, 218, 56);
    ctx.fillStyle = '#f7e8c9';
    ctx.font = '800 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 30, 36);
    ctx.font = '900 27px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#e9b949';
    ctx.fillText(String(game.score).padStart(6, '0'), 30, 64);

    // distance and the road to the forest
    panel(322, 14, 316, 56);
    ctx.fillStyle = '#f7e8c9';
    ctx.font = '800 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${stage.name.toUpperCase()} — ${Math.floor(game.distanceM)} m / ${PluckyWorld.ESCAPE_DISTANCE} m`, 480, 36);
    ctx.fillStyle = 'rgba(247, 232, 201, 0.25)';
    A.roundRect(ctx, 342, 46, 276, 12, 6); ctx.fill();
    ctx.fillStyle = '#7d9b3a';
    A.roundRect(ctx, 342, 46, 276 * Math.min(1, game.distanceM / PluckyWorld.ESCAPE_DISTANCE), 12, 6); ctx.fill();
    ctx.fillStyle = '#f7e8c9';
    for (const m of [500, 1000]) {
      const tx = 342 + 276 * (m / PluckyWorld.ESCAPE_DISTANCE);
      ctx.fillRect(tx - 1, 43, 2, 18);
    }

    // stamina and corn
    panel(726, 14, 218, 56);
    ctx.fillStyle = '#f7e8c9';
    ctx.font = '800 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(tired ? 'STAMINA — EXHAUSTED!' : 'STAMINA', 740, 36);
    ctx.fillStyle = 'rgba(247, 232, 201, 0.25)';
    A.roundRect(ctx, 740, 46, 128, 12, 6); ctx.fill();
    ctx.fillStyle = stamina > 30 ? '#7d9b3a' : '#d64541';
    A.roundRect(ctx, 740, 46, 128 * (stamina / 100), 12, 6); ctx.fill();
    A.drawCorn(ctx, 898, 50, game.time);
    ctx.fillStyle = '#e9b949';
    ctx.font = '900 22px "Trebuchet MS", sans-serif';
    ctx.fillText('× ' + game.corn, 912, 58);

    // farmer proximity meter
    panel(16, 470, 300, 52);
    const danger = farmer.gap < 190 && Math.floor(game.time * 3) % 2 === 0;
    ctx.font = '800 14px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    if (danger) {
      ctx.fillStyle = '#ff6b5e';
      ctx.font = '900 15px "Trebuchet MS", sans-serif';
      ctx.fillText("HE'S RIGHT BEHIND YOU!", 30, 492);
    } else {
      ctx.fillStyle = '#f7e8c9';
      ctx.fillText('FARMER BRAM', 30, 492);
    }
    const closeness = 1 - Math.min(1, farmer.gap / 520);
    ctx.fillStyle = 'rgba(247, 232, 201, 0.25)';
    A.roundRect(ctx, 30, 500, 200, 11, 5); ctx.fill();
    ctx.fillStyle = farmer.gap < 190 ? '#d64541' : '#e07b2a';
    A.roundRect(ctx, 30, 500, 200 * closeness, 11, 5); ctx.fill();

    if (bannerTimer > 0) {
      ctx.globalAlpha = Math.min(1, bannerTimer);
      ctx.fillStyle = 'rgba(43, 26, 18, 0.85)';
      A.roundRect(ctx, W / 2 - 330, 92, 660, 46, 12); ctx.fill();
      ctx.fillStyle = '#f7e8c9';
      ctx.font = '900 24px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bannerText, W / 2, 123);
      ctx.globalAlpha = 1;
    }
  }

  // --- frame loop ---------------------------------------------------------------------
  let lastTs = 0;
  function frame(ts) {
    const dt = Math.min(0.033, lastTs ? (ts - lastTs) / 1000 : 0.016);
    lastTs = ts;
    update(dt);
    ctx.clearRect(0, 0, W, H);
    if (game.state === 'title') drawTitle();
    else {
      drawScene();
      if (game.state === 'playing' || game.state === 'paused') drawHUD();
      if (game.state === 'paused') drawPaused();
      if (game.state === 'caught') drawEnd(false);
      if (game.state === 'escaped') drawEnd(true);
    }
    requestAnimationFrame(frame);
  }

  // --- title, pause and end screens ------------------------------------------------
  function drawTitle() {
    // a living farmyard behind the menu: the world scrolls gently, and the
    // two stars of the chase are drawn over the card at the end so the
    // cover always shows turkey and farmer at full brightness
    const drift = game.time * 46;
    A.drawFarLayer(ctx, 'farmyard', drift);
    A.drawMidLayer(ctx, 'farmyard', drift);
    A.drawGround(ctx, 'farmyard', drift);

    ctx.fillStyle = 'rgba(43, 26, 18, 0.38)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#7a3b14';
    ctx.font = '900 76px "Trebuchet MS", sans-serif';
    ctx.fillText("PLUCKY'S", W / 2 + 3, 128 + 3);
    ctx.fillText('GREAT ESCAPE', W / 2 + 3, 206 + 3);
    ctx.fillStyle = '#f7e8c9';
    ctx.fillText("PLUCKY'S", W / 2, 128);
    ctx.fillStyle = '#e9b949';
    ctx.fillText('GREAT ESCAPE', W / 2, 206);

    ctx.fillStyle = '#f7e8c9';
    ctx.font = '700 23px "Trebuchet MS", sans-serif';
    ctx.fillText('One turkey. One farmer. Zero intention of being dinner.', W / 2, 248);

    panel(W / 2 - 356, 276, 712, 118);
    ctx.fillStyle = '#f7e8c9';
    ctx.font = '600 19px "Trebuchet MS", sans-serif';
    ctx.fillText('Thanksgiving is coming and the oven is already hot.', W / 2, 308);
    ctx.fillText('Run 1500 m — farmyard, barnyard and kitchen — to the forest pardon.', W / 2, 336);
    ctx.fillStyle = '#e9b949';
    ctx.font = '700 19px "Trebuchet MS", sans-serif';
    ctx.fillText('SPACE / CLICK jump (×2 for a double) · ↓ duck · corn = stamina', W / 2, 372);

    // the chase, staged in front of the card: Bram closing in from the
    // left, Plucky already running for it on the right
    A.drawFarmer(ctx, 60, GROUND_Y, { runPhase: game.time * 7, surge: false });
    A.drawTurkey(ctx, 800, GROUND_Y, {
      runPhase: game.time * 9,
      ducking: false,
      airborne: false,
      tilt: 0,
    });
    A.drawCorn(ctx, 700, GROUND_Y - 40, game.time);

    ctx.fillStyle = '#fff3b0';
    ctx.font = '900 27px "Trebuchet MS", sans-serif';
    ctx.fillText('PRESS ENTER OR CLICK TO RUN FOR YOUR LIFE', W / 2, 486);
    if (game.best > 0) {
      ctx.fillStyle = '#f7e8c9';
      ctx.font = '800 17px "Trebuchet MS", sans-serif';
      ctx.fillText('Best score so far: ' + game.best, W / 2, 516);
    }
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20, 10, 6, 0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f7e8c9';
    ctx.font = '900 54px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, 268);
    ctx.font = '700 21px "Trebuchet MS", sans-serif';
    ctx.fillText('Press P to keep running', W / 2, 308);
  }

  function drawEnd(escaped) {
    // the frame loop has already drawn the frozen scene; this adds the veil
    ctx.fillStyle = escaped ? 'rgba(24, 44, 16, 0.52)' : 'rgba(52, 12, 8, 0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = '900 72px "Trebuchet MS", sans-serif';
    ctx.fillStyle = escaped ? '#b7e26b' : '#ff6b5e';
    ctx.fillText(escaped ? 'PARDONED!' : 'CAUGHT!', W / 2, 150);
    ctx.fillStyle = '#f7e8c9';
    ctx.font = '700 23px "Trebuchet MS", sans-serif';
    ctx.fillText(
      escaped
        ? 'Plucky reached the forest. No drumsticks today, Bram.'
        : `Bram's hands closed in at ${Math.floor(game.distanceM)} m. The table is set…`,
      W / 2, 196);

    panel(W / 2 - 240, 236, 480, 148);
    ctx.font = '800 21px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#f7e8c9';
    ctx.fillText(`SCORE  ${game.score}`, W / 2, 278);
    ctx.fillText(`DISTANCE  ${Math.floor(game.distanceM)} m  ·  CORN  ${game.corn}  ·  CLEARED  ${game.cleared}`, W / 2, 314);
    ctx.fillStyle = '#e9b949';
    ctx.fillText(`BEST  ${game.best}`, W / 2, 350);

    if (endTimer > 0.6 && Math.floor(game.time * 1.6) % 2 === 0) {
      ctx.fillStyle = '#fff3b0';
      ctx.font = '900 25px "Trebuchet MS", sans-serif';
      ctx.fillText('PRESS ENTER OR CLICK TO RUN AGAIN', W / 2, 448);
    }
  }

  // --- input -------------------------------------------------------------------------
  function pressJumpOrStart() {
    if (game.state === 'title') startRun();
    else if (game.state === 'playing') jump();
    else if ((game.state === 'caught' || game.state === 'escaped') && endTimer > 0.6) startRun();
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (!e.repeat) pressJumpOrStart();
    } else if (e.code === 'Enter') {
      e.preventDefault();
      if (!e.repeat) pressJumpOrStart();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      turkey.ducking = true;
    } else if (e.code === 'KeyP') {
      if (game.state === 'playing') { game.state = 'paused'; PluckyAudio.stopMusic(); }
      else if (game.state === 'paused') { game.state = 'playing'; PluckyAudio.startMusic(); }
    } else if (e.code === 'KeyM') {
      PluckyAudio.toggleMute();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown' || e.code === 'KeyS') turkey.ducking = false;
  });
  canvas.addEventListener('mousedown', () => pressJumpOrStart());
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    pressJumpOrStart();
  }, { passive: false });

  // A small handle so the maker (and only the maker) can stage screenshots:
  // start a run, hop it forward to a stage, or end it, from the console.
  window.PluckyGame = {
    get state() { return game.state; },
    get score() { return game.score; },
    get distanceM() { return game.distanceM; },
    start: startRun,
    jump,
    setDucking(v) { turkey.ducking = !!v; },
    teleport(m) {
      game.distanceM = m;
      stageIndex = PluckyWorld.stageAt(m).index;
      farmer.gap = Math.max(farmer.gap, 250);
    },
    end(escaped) { endRun(!!escaped); },
  };

  requestAnimationFrame(frame);
})();

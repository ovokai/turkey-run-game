// Plucky's Great Escape — art.js: every picture in the game is drawn here with
// canvas paths (no image files). Autumn palette throughout: pumpkin orange,
// cranberry red, wheat gold, barn brown. Characters live at the bottom of this
// file; scenery and props come first.

const PluckyArt = (() => {
  const W = 960;
  const H = 540;
  const GROUND_Y = 452;

  const COLORS = {
    skyTop: '#f9d976',
    skyBottom: '#f39f5a',
    duskTop: '#e88ca0',
    duskBottom: '#f6a95c',
    hillFar: '#c96f2e',
    hillNear: '#a34d1f',
    grass: '#7d9b3a',
    dirt: '#8a5a2b',
    dirtDark: '#6f421d',
    wheat: '#e9b949',
    barnRed: '#a83226',
    barnDark: '#7e241b',
    wood: '#9c6b30',
    woodDark: '#6f421d',
    cream: '#f7e8c9',
    kitchenWall: '#8a4b2a',
    kitchenWallDark: '#6f3a1f',
    tileA: '#e8d8b0',
    tileB: '#b3543a',
    steel: '#cfd6dd',
    steelDark: '#8d979f',
  };

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function polygon(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  // --- far scenery (slowest parallax) ------------------------------------
  function drawFarLayer(ctx, stage, scroll) {
    const off = -(scroll * 0.15 % 480);
    if (stage === 'kitchen') {
      // kitchen back wall: warm plaster, a window, a rail of hanging pans
      ctx.fillStyle = COLORS.kitchenWall;
      ctx.fillRect(0, 0, W, GROUND_Y);
      ctx.fillStyle = COLORS.kitchenWallDark;
      ctx.fillRect(0, 300, W, 10);
      for (let x = off; x < W + 480; x += 480) {
        // window with evening light and a checked curtain
        ctx.fillStyle = '#f9d976';
        roundRect(ctx, x + 90, 70, 150, 150, 10); ctx.fill();
        ctx.fillStyle = '#d64541';
        ctx.fillRect(x + 90, 70, 150, 26);
        ctx.fillStyle = '#f7e8c9';
        for (let i = 0; i < 5; i++) ctx.fillRect(x + 90, 82 + i * 26, 150, 6);
        ctx.strokeStyle = COLORS.woodDark; ctx.lineWidth = 8;
        roundRect(ctx, x + 90, 70, 150, 150, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 165, 70); ctx.lineTo(x + 165, 220); ctx.stroke();
        // hanging pans and a ladle on a rail
        ctx.fillStyle = COLORS.woodDark;
        ctx.fillRect(x + 330, 96, 130, 8);
        ctx.fillStyle = COLORS.steel;
        ellipse(ctx, x + 356, 138, 24, 28);
        ellipse(ctx, x + 420, 132, 18, 22);
        ctx.fillStyle = COLORS.steelDark;
        ctx.fillRect(x + 352, 100, 7, 16);
        ctx.fillRect(x + 416, 100, 7, 14);
      }
      return;
    }
    // farm sky
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    if (stage === 'farmyard') { grad.addColorStop(0, COLORS.skyTop); grad.addColorStop(1, COLORS.skyBottom); }
    else { grad.addColorStop(0, COLORS.duskTop); grad.addColorStop(1, COLORS.duskBottom); }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, GROUND_Y);
    // sun, low and big
    ctx.fillStyle = '#fff3b0';
    ellipse(ctx, 790, 108, 46, 46);
    ctx.fillStyle = 'rgba(255, 243, 176, 0.35)';
    ellipse(ctx, 790, 108, 74, 74);
    // drifting clouds
    ctx.fillStyle = 'rgba(255, 248, 225, 0.9)';
    const cloudOff = -(scroll * 0.05 % 620);
    for (let x = cloudOff; x < W + 620; x += 620) {
      ellipse(ctx, x + 140, 82, 52, 20);
      ellipse(ctx, x + 182, 70, 40, 24);
      ellipse(ctx, x + 470, 130, 44, 17);
    }
    // rolling hills
    ctx.fillStyle = COLORS.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= W; x += 60) {
      const wx = x - off * 0.4;
      ctx.lineTo(x, 330 + Math.sin(wx * 0.008) * 26);
    }
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath(); ctx.fill();
    // the big red barn the turkey is running away from (farmyard) or a silo (barnyard)
    for (let x = off; x < W + 480; x += 480) {
      if (stage === 'farmyard') drawBarn(ctx, x + 40, GROUND_Y - 128);
      else drawSilo(ctx, x + 300, GROUND_Y - 190);
    }
  }

  function drawBarn(ctx, x, baseY) {
    ctx.fillStyle = COLORS.barnRed;
    ctx.fillRect(x, baseY - 90, 190, 128);
    polygon(ctx, [[x - 12, baseY - 90], [x + 95, baseY - 148], [x + 202, baseY - 90]]);
    ctx.fillStyle = COLORS.barnDark;
    ctx.fillRect(x + 62, baseY - 58, 66, 96);
    ctx.strokeStyle = COLORS.cream; ctx.lineWidth = 5;
    ctx.strokeRect(x + 62, baseY - 58, 66, 96);
    ctx.beginPath();
    ctx.moveTo(x + 62, baseY - 58); ctx.lineTo(x + 128, baseY + 38);
    ctx.moveTo(x + 128, baseY - 58); ctx.lineTo(x + 62, baseY + 38);
    ctx.stroke();
    ctx.fillStyle = COLORS.cream;
    ctx.fillRect(x + 76, baseY - 108, 38, 30);
  }

  function drawSilo(ctx, x, baseY) {
    ctx.fillStyle = COLORS.steel;
    ctx.fillRect(x, baseY, 74, 190);
    ctx.fillStyle = COLORS.steelDark;
    ellipse(ctx, x + 37, baseY, 37, 16);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, baseY + 44, 74, 8);
    ctx.fillRect(x, baseY + 96, 74, 8);
    ctx.fillRect(x, baseY + 148, 74, 8);
  }

  // --- mid scenery ---------------------------------------------------------
  function drawMidLayer(ctx, stage, scroll) {
    const off = -(scroll * 0.45 % 240);
    if (stage === 'kitchen') {
      // counter with pots, a stove hood and spice jars along the back
      ctx.fillStyle = '#5d3520';
      ctx.fillRect(0, 356, W, 18);
      ctx.fillStyle = '#74452a';
      ctx.fillRect(0, 374, W, GROUND_Y - 374);
      for (let x = off; x < W + 240; x += 240) {
        ctx.fillStyle = COLORS.steelDark;
        roundRect(ctx, x + 30, 318, 62, 40, 8); ctx.fill();
        ctx.fillStyle = COLORS.steel;
        ctx.fillRect(x + 24, 312, 74, 10);
        // spice jars
        const jarColors = ['#d64541', '#e9b949', '#7d9b3a'];
        jarColors.forEach((c, i) => {
          ctx.fillStyle = c;
          roundRect(ctx, x + 130 + i * 30, 322, 20, 34, 4); ctx.fill();
          ctx.fillStyle = COLORS.woodDark;
          ctx.fillRect(x + 130 + i * 30, 316, 20, 8);
        });
      }
      return;
    }
    // autumn trees and fence posts marching past
    for (let x = off; x < W + 240; x += 240) {
      drawAutumnTree(ctx, x + 60, GROUND_Y - 96);
    }
    ctx.fillStyle = COLORS.wood;
    for (let x = -(scroll * 0.45 % 90); x < W + 90; x += 90) {
      ctx.fillRect(x, GROUND_Y - 64, 10, 64);
    }
    ctx.fillRect(0, GROUND_Y - 52, W, 7);
    ctx.fillRect(0, GROUND_Y - 26, W, 7);
  }

  function drawAutumnTree(ctx, x, baseY) {
    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(x - 7, baseY - 60, 14, 96);
    const blobs = [
      [0, -96, 44, '#d2691e'], [-34, -74, 32, '#e07b2a'], [34, -78, 34, '#c1443c'],
      [-12, -118, 30, '#e9a13b'], [22, -112, 26, '#d2691e'],
    ];
    for (const [dx, dy, r, c] of blobs) {
      ctx.fillStyle = c;
      ellipse(ctx, x + dx, baseY + dy, r, r * 0.82);
    }
  }

  // --- ground ---------------------------------------------------------------
  function drawGround(ctx, stage, scroll) {
    if (stage === 'kitchen') {
      // checkered kitchen floor rushing by
      const tile = 56;
      const off = -(scroll % tile);
      for (let row = 0; row < 2; row++) {
        for (let x = off - tile; x < W + tile; x += tile) {
          const odd = ((x + scroll) / tile + row) % 2 === 0;
          ctx.fillStyle = odd ? COLORS.tileA : COLORS.tileB;
          ctx.fillRect(x, GROUND_Y + row * 44, tile, 44);
        }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, GROUND_Y, W, 5);
      return;
    }
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, GROUND_Y, W, 26);
    ctx.fillStyle = COLORS.dirt;
    ctx.fillRect(0, GROUND_Y + 26, W, H - GROUND_Y - 26);
    // scrolling tufts and pebbles so the speed reads
    const off = -(scroll % 130);
    ctx.strokeStyle = '#5d7d2c';
    ctx.lineWidth = 3;
    for (let x = off; x < W + 130; x += 130) {
      ctx.beginPath();
      ctx.moveTo(x + 20, GROUND_Y + 16);
      ctx.lineTo(x + 14, GROUND_Y + 2);
      ctx.moveTo(x + 26, GROUND_Y + 16);
      ctx.lineTo(x + 28, GROUND_Y + 1);
      ctx.stroke();
      ctx.fillStyle = COLORS.dirtDark;
      ellipse(ctx, x + 82, GROUND_Y + 58, 10, 5);
    }
  }

  // --- obstacles and pickups -------------------------------------------------
  function drawObstacle(ctx, ob) {
    const x = ob.x;
    if (ob.type === 'fence') {
      ctx.fillStyle = COLORS.wood;
      ctx.fillRect(x, GROUND_Y - ob.h, 12, ob.h);
      ctx.fillRect(x + ob.w - 12, GROUND_Y - ob.h, 12, ob.h);
      ctx.fillRect(x - 4, GROUND_Y - ob.h + 8, ob.w + 8, 11);
      ctx.fillRect(x - 4, GROUND_Y - 26, ob.w + 8, 11);
      ctx.fillStyle = COLORS.woodDark;
      polygon(ctx, [[x - 2, GROUND_Y - ob.h], [x + 6, GROUND_Y - ob.h - 9], [x + 14, GROUND_Y - ob.h]]);
      polygon(ctx, [[x + ob.w - 14, GROUND_Y - ob.h], [x + ob.w - 6, GROUND_Y - ob.h - 9], [x + ob.w + 2, GROUND_Y - ob.h]]);
    } else if (ob.type === 'haybale') {
      ctx.fillStyle = COLORS.wheat;
      ellipse(ctx, x + ob.w / 2, GROUND_Y - ob.h / 2, ob.w / 2, ob.h / 2);
      ctx.strokeStyle = '#c9932b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x + ob.w / 2, GROUND_Y - ob.h / 2, ob.w / 2 - 6, ob.h / 2 - 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x + ob.w / 2, GROUND_Y - ob.h / 2, ob.w / 4, ob.h / 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#a83226';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + 6, GROUND_Y - ob.h + 8);
      ctx.lineTo(x + ob.w - 6, GROUND_Y - 8);
      ctx.stroke();
    } else if (ob.type === 'knifeblock') {
      // a butcher's block with carving knives standing in it, blades up
      ctx.fillStyle = COLORS.woodDark;
      roundRect(ctx, x, GROUND_Y - 34, ob.w, 34, 5); ctx.fill();
      ctx.fillStyle = COLORS.wood;
      ctx.fillRect(x, GROUND_Y - 34, ob.w, 8);
      for (let i = 0; i < 3; i++) {
        const kx = x + 12 + i * ((ob.w - 24) / 2);
        ctx.fillStyle = '#5d3a1a';
        ctx.fillRect(kx - 3, GROUND_Y - ob.h + 16, 6, 20);
        ctx.fillStyle = COLORS.steel;
        polygon(ctx, [[kx - 6, GROUND_Y - ob.h + 18], [kx + 6, GROUND_Y - ob.h + 18], [kx + 2, GROUND_Y - ob.h - 4], [kx - 4, GROUND_Y - ob.h + 2]]);
      }
    } else if (ob.type === 'oven') {
      // a big black range oven, door ajar with firelight — jump it or else
      ctx.fillStyle = '#2e2a28';
      roundRect(ctx, x, GROUND_Y - ob.h, ob.w, ob.h, 8); ctx.fill();
      ctx.fillStyle = '#45403c';
      ctx.fillRect(x, GROUND_Y - ob.h, ob.w, 16);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#171413';
        ellipse(ctx, x + 14 + i * ((ob.w - 28) / 3), GROUND_Y - ob.h + 8, 7, 4);
      }
      // glowing door
      const grad = ctx.createLinearGradient(0, GROUND_Y - ob.h + 30, 0, GROUND_Y - 12);
      grad.addColorStop(0, '#ff9d3c');
      grad.addColorStop(1, '#d64541');
      ctx.fillStyle = grad;
      roundRect(ctx, x + 12, GROUND_Y - ob.h + 30, ob.w - 24, ob.h - 44, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255, 220, 130, 0.85)';
      ellipse(ctx, x + ob.w / 2, GROUND_Y - 26, ob.w / 4, 7);
      ctx.fillStyle = COLORS.steel;
      ctx.fillRect(x + 8, GROUND_Y - ob.h + 24, ob.w - 16, 5);
    } else if (ob.type === 'hangingknife') {
      // a cleaver dangling from a chain at head height — duck!
      ctx.strokeStyle = COLORS.steelDark;
      ctx.lineWidth = 4;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(x + ob.w / 2, GROUND_Y - ob.top);
      ctx.lineTo(x + ob.w / 2, GROUND_Y - ob.h - 34);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#5d3a1a';
      roundRect(ctx, x + ob.w / 2 - 6, GROUND_Y - ob.h - 36, 12, 18, 4); ctx.fill();
      ctx.fillStyle = COLORS.steel;
      polygon(ctx, [
        [x, GROUND_Y - ob.h - 18],
        [x + ob.w, GROUND_Y - ob.h - 18],
        [x + ob.w, GROUND_Y - ob.h + 14],
        [x + 14, GROUND_Y - ob.h + 14],
        [x, GROUND_Y - ob.h + 4],
      ]);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 6, GROUND_Y - ob.h - 14, ob.w - 16, 5);
    }
  }

  function drawCorn(ctx, x, y, t) {
    const bob = Math.sin(t * 4 + x * 0.05) * 4;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.rotate(Math.sin(t * 2 + x) * 0.12);
    // glow
    ctx.fillStyle = 'rgba(255, 230, 120, 0.30)';
    ellipse(ctx, 0, 0, 24, 24);
    // husk
    ctx.fillStyle = '#5d7d2c';
    polygon(ctx, [[-10, 8], [-16, 20], [-4, 14]]);
    polygon(ctx, [[10, 8], [16, 20], [4, 14]]);
    // cob
    ctx.fillStyle = '#f4c542';
    roundRect(ctx, -9, -16, 18, 28, 8); ctx.fill();
    ctx.strokeStyle = '#d9a41f';
    ctx.lineWidth = 1.6;
    for (let r = -10; r <= 8; r += 6) {
      ctx.beginPath(); ctx.moveTo(-8, r); ctx.lineTo(8, r); ctx.stroke();
    }
    for (let c = -4; c <= 4; c += 4) {
      ctx.beginPath(); ctx.moveTo(c, -14); ctx.lineTo(c, 10); ctx.stroke();
    }
    ctx.restore();
  }

  // --- the turkey (the player) ----------------------------------------------
  // Drawn facing right, feet on feetY. runPhase advances the legs and bob;
  // ducking squashes the body down; tilt leans it in the air.
  function drawTurkey(ctx, x, feetY, opts) {
    const runPhase = opts.runPhase || 0;
    const ducking = !!opts.ducking;
    const airborne = !!opts.airborne;
    const bob = airborne ? 0 : Math.abs(Math.sin(runPhase)) * 4;
    const squash = ducking ? 0.62 : 1;
    ctx.save();
    ctx.translate(x, feetY);
    if (opts.tilt) ctx.rotate(opts.tilt);

    // legs: two orange struts swapping stride, tucked when airborne
    ctx.strokeStyle = '#e07b2a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const hipY = -26 * squash;
    if (airborne) {
      ctx.beginPath();
      ctx.moveTo(-4, hipY); ctx.lineTo(-14, -8); ctx.lineTo(-22, -6);
      ctx.moveTo(8, hipY); ctx.lineTo(2, -6); ctx.lineTo(-4, -2);
      ctx.stroke();
    } else {
      const s = Math.sin(runPhase) * 15;
      ctx.beginPath();
      ctx.moveTo(-4, hipY); ctx.lineTo(-4 + s, -2); ctx.lineTo(-4 + s + 6, 0);
      ctx.moveTo(8, hipY); ctx.lineTo(8 - s, -2); ctx.lineTo(8 - s + 6, 0);
      ctx.stroke();
    }

    ctx.translate(0, -bob);
    // tail fan: five feathers fanned behind, autumn colours
    const fan = [-0.95, -0.5, -0.08, 0.34, 0.72];
    const featherColors = ['#c1443c', '#d2691e', '#e9a13b', '#d2691e', '#c1443c'];
    fan.forEach((a, i) => {
      ctx.save();
      ctx.translate(-26, -46 * squash);
      ctx.rotate(a - 0.5);
      ctx.fillStyle = featherColors[i];
      ellipse(ctx, -20, 0, 24, 9);
      ctx.fillStyle = 'rgba(247, 232, 201, 0.8)';
      ellipse(ctx, -38, 0, 6, 5);
      ctx.restore();
    });
    // body
    ctx.fillStyle = '#8a5a2b';
    ellipse(ctx, 0, -44 * squash, 36, 27 * squash);
    ctx.fillStyle = '#a06a35';
    ellipse(ctx, 4, -50 * squash, 27, 19 * squash);
    // wing, flapping harder when airborne
    const flap = airborne ? Math.sin(runPhase * 2.4) * 0.5 : Math.sin(runPhase) * 0.16;
    ctx.save();
    ctx.translate(-4, -48 * squash);
    ctx.rotate(0.35 + flap);
    ctx.fillStyle = '#6f421d';
    ellipse(ctx, -6, 4, 20, 10);
    ctx.restore();
    // neck and head
    ctx.strokeStyle = '#7a94a6';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(26, -56 * squash);
    ctx.quadraticCurveTo(38, -70 * squash, 42, -78 * squash);
    ctx.stroke();
    ctx.fillStyle = '#8fa9ba';
    ellipse(ctx, 45, -80 * squash, 13, 11);
    // beak
    ctx.fillStyle = '#f4a259';
    polygon(ctx, [[56, -84 * squash], [72, -79 * squash], [56, -74 * squash]]);
    // wattle — the red dangly bit, swinging with the run
    ctx.fillStyle = '#d64541';
    const swing = Math.sin(runPhase * 1.4) * 3;
    ellipse(ctx, 50 + swing * 0.4, -66 * squash, 6, 10 + swing * 0.3);
    // eye, with a determined glint; squeezed shut when ducking
    ctx.fillStyle = '#fff';
    ellipse(ctx, 47, -83 * squash, 5.5, 5.5);
    ctx.fillStyle = '#1d1410';
    if (ducking) {
      ctx.fillRect(42, -84 * squash, 10, 2);
    } else {
      ellipse(ctx, 48.5, -83 * squash, 2.8, 2.8);
    }
    ctx.restore();
  }

  // --- the farmer (the chaser) ------------------------------------------------
  // Bigger than the turkey, red shirt, blue overalls, straw hat, and a carving
  // knife in his front hand. surge=true leans him forward with a "!" of intent
  // (the bang itself is drawn by game.js so it can flash).
  function drawFarmer(ctx, x, feetY, opts) {
    const runPhase = opts.runPhase || 0;
    const bob = Math.abs(Math.sin(runPhase)) * 5;
    ctx.save();
    ctx.translate(x, feetY - bob);
    if (opts.surge) ctx.rotate(0.09);

    // legs in overalls, boots pounding
    ctx.strokeStyle = '#2e4a7a';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    const s = Math.sin(runPhase) * 19;
    ctx.beginPath();
    ctx.moveTo(-6, -62); ctx.lineTo(-6 + s, -6);
    ctx.moveTo(10, -62); ctx.lineTo(10 - s, -6);
    ctx.stroke();
    ctx.fillStyle = '#3a2a1a';
    ellipse(ctx, -6 + s + 5, -3, 11, 5);
    ellipse(ctx, 10 - s + 5, -3, 11, 5);
    // torso: red shirt under overall bib
    ctx.fillStyle = '#c1443c';
    roundRect(ctx, -20, -118, 46, 60, 10); ctx.fill();
    ctx.fillStyle = '#2e4a7a';
    ctx.fillRect(-14, -96, 34, 38);
    ctx.fillStyle = '#e9b949';
    ctx.fillRect(-14, -96, 5, 5);
    ctx.fillRect(15, -96, 5, 5);
    // back arm pumping
    ctx.strokeStyle = '#c1443c';
    ctx.lineWidth = 10;
    const backSwing = Math.sin(runPhase) * 14;
    ctx.beginPath();
    ctx.moveTo(-14, -108); ctx.lineTo(-26, -84 + backSwing * 0.4); ctx.lineTo(-20, -64 + backSwing);
    ctx.stroke();
    // front arm reaching out with the carving knife
    ctx.beginPath();
    ctx.moveTo(20, -108); ctx.lineTo(40, -88); ctx.lineTo(56, -84);
    ctx.stroke();
    ctx.fillStyle = '#f0c8a0';
    ellipse(ctx, 58, -83, 7, 6);
    ctx.save();
    ctx.translate(62, -84);
    ctx.rotate(-0.12);
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(0, -3, 12, 6);
    ctx.fillStyle = COLORS.steel;
    polygon(ctx, [[12, -5], [44, -3], [46, 1], [14, 4]]);
    ctx.restore();
    // head and straw hat
    ctx.fillStyle = '#f0c8a0';
    ellipse(ctx, 2, -132, 15, 16);
    ctx.fillStyle = '#402a18';
    ellipse(ctx, 8, -134, 3, 3.4); // eye, fixed on the turkey
    ctx.fillStyle = '#e9b949';
    ellipse(ctx, 2, -146, 27, 7);
    roundRect(ctx, -11, -162, 26, 17, 5); ctx.fill();
    ctx.fillStyle = '#c1443c';
    ctx.fillRect(-11, -150, 26, 5);
    ctx.restore();
  }

  return {
    W, H, GROUND_Y, COLORS,
    ellipse, roundRect, polygon,
    drawFarLayer, drawMidLayer, drawGround,
    drawObstacle, drawCorn,
    drawTurkey, drawFarmer,
  };
})();

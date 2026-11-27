// Plucky's Great Escape — world.js: the three stages of the escape and the
// spawner that deals out obstacles and corn. The farmyard teaches jumping,
// the barnyard adds the knife block, and the kitchen adds ovens and cleavers
// hanging at head height. Reaching the forest at 1500 m wins the pardon.

const PluckyWorld = (() => {
  const ESCAPE_DISTANCE = 1500; // metres to the forest, and freedom

  const STAGES = [
    {
      name: 'The Farmyard',
      key: 'farmyard',
      until: 500,
      banner: 'STAGE 1 · THE FARMYARD — mind the fences!',
      obstacleKinds: ['fence', 'haybale', 'fence'],
      density: 1.0,
    },
    {
      name: 'The Barnyard',
      key: 'barnyard',
      until: 1000,
      banner: 'STAGE 2 · THE BARNYARD — the knives are out!',
      obstacleKinds: ['fence', 'haybale', 'knifeblock', 'hangingknife', 'fence'],
      density: 1.25,
    },
    {
      name: 'The Kitchen',
      key: 'kitchen',
      until: Infinity,
      banner: 'STAGE 3 · THE KITCHEN — dodge the oven!',
      obstacleKinds: ['oven', 'knifeblock', 'hangingknife', 'fence', 'oven', 'haybale'],
      density: 1.45,
    },
  ];

  function stageAt(distanceM) {
    for (let i = 0; i < STAGES.length; i++) {
      if (distanceM < STAGES[i].until) return { index: i, stage: STAGES[i] };
    }
    return { index: STAGES.length - 1, stage: STAGES[STAGES.length - 1] };
  }

  // Footprints of each obstacle kind (w/h in px, h measured up from the
  // ground; a hanging knife's h is the height of its blade's lower edge).
  const OBSTACLES = {
    fence:        { w: 66, h: 56 },
    haybale:      { w: 64, h: 46 },
    knifeblock:   { w: 58, h: 66 },
    oven:         { w: 94, h: 104 },
    hangingknife: { w: 66, h: 70, top: 168 },
  };

  function makeObstacle(kind, x) {
    const spec = OBSTACLES[kind];
    return {
      kind: 'obstacle',
      type: kind,
      x,
      w: spec.w,
      h: spec.h,
      top: spec.top || 0,
      passed: false,
    };
  }

  function makeCornArc(x, groundY) {
    // a little arc of corn at hop height, or a low line when it follows an
    // obstacle — either way it tempts the turkey onto a tasty line
    const corns = [];
    const arc = Math.random() < 0.55;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const cx = x + i * 44;
      const cy = arc
        ? groundY - 66 - Math.sin((i / (n - 1)) * Math.PI) * 52
        : groundY - 40;
      corns.push({ kind: 'corn', x: cx, y: cy, taken: false });
    }
    return corns;
  }

  // The spawner counts down in pixels of world travel, so faster running
  // deals obstacles at the same *time* rhythm, not the same spacing.
  function makeSpawner(groundY) {
    let countdown = 420;
    return {
      update(distanceTravelled, stageIndex) {
        countdown -= distanceTravelled;
        const spawned = [];
        if (countdown > 0) return spawned;
        const stage = STAGES[stageIndex];
        const roll = Math.random();
        if (roll < 0.22) {
          spawned.push(...makeCornArc(1020, groundY));
          countdown = 300 + Math.random() * 200;
        } else {
          const kind = stage.obstacleKinds[
            Math.floor(Math.random() * stage.obstacleKinds.length)
          ];
          spawned.push(makeObstacle(kind, 1020));
          const base = 560 / stage.density;
          countdown = base + Math.random() * 320 - Math.min(140, stageIndex * 55);
          if (Math.random() < 0.3) {
            // sometimes a snack right after a scare
            spawned.push(...makeCornArc(1020 + OBSTACLES[kind].w + 130, groundY));
            countdown += 260;
          }
        }
        return spawned;
      },
    };
  }

  return { ESCAPE_DISTANCE, STAGES, OBSTACLES, stageAt, makeSpawner };
})();

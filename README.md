[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/ovokai/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard)
[![reward](https://make.fun/badge/turkey-run-game-01/ovokai/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

# Plucky's Great Escape

A turkey escape game for the make.fun bounty [turkey-run-game-01](https://make.fun/bounty/turkey-run-game-01).

Thanksgiving is coming, the oven is already hot, and Farmer Bram has his
carving knife out. You are Plucky, a turkey with other plans. Run **1500 m**
— through the farmyard, the barnyard and the kitchen itself — to the forest
and earn your pardon. Bram runs the whole way behind you: trip over a fence
and he lunges; run your legs empty and he gains. Corn is stamina. The
cleavers hanging in the kitchen are ducked, the oven is jumped, and the
knife block is nobody's friend.

## How to play

- **SPACE / W / ↑** or **click / tap** — jump; press again mid-air for a double jump
- **↓ / S** — duck (under the hanging cleavers), or fast-fall while airborne
- **ENTER** — start, and restart after a run
- **P** pause · **M** mute

Jump the fences, hay bales, knife blocks and the oven; duck the hanging
cleavers; eat corn to keep your stamina up. If Bram's hands touch you, it's
dinner. Reach 1500 m and you're **PARDONED!**

## Running it locally

```
node serve.ts        # serves game/ at http://localhost:8080
```

The game is plain static files under `game/` — no build step, no network,
everything (art and sound included) is drawn and synthesised by its own
code. `node main.ts` is the hand-in program: it copies `game/` and
`screenshots/` to the output directory and writes `dossier.json` with the
vendored make.fun library.

## Layout

- `game/index.html` — the page; `game/style.css` — its shell
- `game/js/game.js` — the run: state machine, physics, the farmer's pursuit, collisions, HUD
- `game/js/world.js` — the three stages and the obstacle/corn spawner
- `game/js/art.js` — every picture, drawn with canvas paths (turkey, farmer, farm and kitchen)
- `game/js/audio.js` — every sound, synthesised with WebAudio, plus the music loop
- `screenshots/` — four real renders of the game (title, farmyard, kitchen, pardon)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

MIT licensed.

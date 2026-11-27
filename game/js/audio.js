// Plucky's Great Escape — sound.js work lives here: every sound is synthesised
// with WebAudio oscillators and noise, so the game needs no audio files.
// A tiny two-voice loop plays a cheerful harvest tune while a run is on.

const PluckyAudio = (() => {
  let ctx = null;
  let master = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensureContext() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    return true;
  }

  function tone(freqFrom, freqTo, seconds, type, volume, delay = 0) {
    if (!ensureContext()) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  function noiseBurst(seconds, volume, delay = 0, low = 400, high = 2400) {
    if (!ensureContext()) return;
    const t0 = ctx.currentTime + delay;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (low + high) / 2;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter).connect(gain).connect(master);
    src.start(t0);
  }

  // --- one-shot effects -------------------------------------------------
  function click()    { tone(660, 520, 0.07, 'triangle', 0.25); }
  function jump()     { tone(280, 640, 0.16, 'square', 0.16); }
  function doubleJump() {
    tone(420, 900, 0.16, 'square', 0.16);
    noiseBurst(0.12, 0.10); // wing flap
  }
  function gobble() {
    // a wobbly little gobble: fast pitch wobble on a sawtooth
    if (!ensureContext()) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const wobble = ctx.createOscillator();
    const wobbleGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 190;
    wobble.frequency.value = 26;
    wobbleGain.gain.value = 70;
    wobble.connect(wobbleGain).connect(osc.frequency);
    gain.gain.setValueAtTime(0.14, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.32);
    osc.connect(gain).connect(master);
    osc.start(t0); wobble.start(t0);
    osc.stop(t0 + 0.34); wobble.stop(t0 + 0.34);
  }
  function corn() {
    tone(880, 880, 0.07, 'sine', 0.22);
    tone(1318, 1318, 0.12, 'sine', 0.20, 0.06);
  }
  function stumble() {
    tone(160, 60, 0.25, 'sawtooth', 0.28);
    noiseBurst(0.18, 0.22, 0, 200, 900);
  }
  function whistle() {
    // the farmer's two-note "come back here!" whistle
    tone(1560, 1560, 0.11, 'sine', 0.16);
    tone(1170, 1170, 0.16, 'sine', 0.16, 0.12);
  }
  function caught() {
    tone(392, 392, 0.18, 'triangle', 0.25);
    tone(370, 370, 0.18, 'triangle', 0.25, 0.18);
    tone(349, 349, 0.18, 'triangle', 0.25, 0.36);
    tone(311, 220, 0.5, 'triangle', 0.28, 0.54);
    noiseBurst(0.3, 0.12, 0.5, 300, 1200);
  }
  function escaped() {
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.24, i * 0.11));
    gobble();
  }

  // --- music: a small harvest reel, bass + melody -----------------------
  const MELODY = [392, 440, 523, 587, 523, 440, 392, 330,
                  349, 392, 440, 392, 330, 294, 330, 0];
  const BASS   = [196, 0, 262, 0, 220, 0, 262, 0,
                  175, 0, 196, 0, 147, 0, 196, 0];

  function startMusic() {
    if (!ensureContext() || musicTimer) return;
    musicStep = 0;
    musicTimer = setInterval(() => {
      if (muted) return;
      const i = musicStep % 16;
      if (MELODY[i]) tone(MELODY[i], MELODY[i], 0.17, 'triangle', 0.075);
      if (BASS[i]) tone(BASS[i], BASS[i], 0.19, 'sine', 0.11);
      musicStep++;
    }, 168);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.5;
    return muted;
  }

  return {
    click, jump, doubleJump, gobble, corn, stumble, whistle,
    caught, escaped, startMusic, stopMusic, toggleMute,
    isMuted: () => muted,
  };
})();

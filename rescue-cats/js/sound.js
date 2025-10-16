(function(){
  const KEY = 'rescueCatsSound::v1';
  let ctx = null;
  let muted = false;
  try { const saved = JSON.parse(localStorage.getItem(KEY) || '{}'); muted = !!saved.muted; } catch {}

  function ensureCtx(){
    if(!ctx){ const AC = window.AudioContext || window.webkitAudioContext; if(AC) ctx = new AC(); }
    return ctx;
  }

  function tone({ freq=440, duration=0.15, type='sine', gain=0.03 }){
    if(muted) return;
    const ac = ensureCtx(); if(!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t0);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  function success(){
    tone({ freq: 880, duration: 0.12, type: 'triangle', gain: 0.04 });
    setTimeout(() => tone({ freq: 1320, duration: 0.12, type: 'triangle', gain: 0.04 }), 60);
  }
  function error(){ tone({ freq: 220, duration: 0.18, type: 'sawtooth', gain: 0.04 }); }
  function click(){ tone({ freq: 660, duration: 0.08, type: 'square', gain: 0.03 }); }

  function setMuted(v){ muted = !!v; try{ localStorage.setItem(KEY, JSON.stringify({ muted })); }catch{} return muted; }
  function isMuted(){ return muted; }

  window.Sound = { ensureCtx, success, error, click, setMuted, isMuted };
})();
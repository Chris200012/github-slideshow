(function(){
  const STORAGE_KEY = 'rescueCatsSRS::v1';

  function now(){ return Date.now(); }

  // A lightweight SRS similar to SM-2 but simplified
  // Card state: { word, ease, intervalDays, dueAtMs, streak, lapses, stats }
  function createCard(entry){
    return {
      word: entry.word,
      data: entry,
      ease: 2.5, // ease factor
      intervalDays: 0,
      dueAtMs: 0,
      streak: 0,
      lapses: 0,
      stats: { seen: 0, correct: 0 }
    };
  }

  function loadState(dataset){
    let state;
    try{ state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }catch{ state = {}; }
    if(!state.cards){ state.cards = {}; }
    // rehydrate missing cards
    for(const entry of dataset){
      if(!state.cards[entry.word]){
        state.cards[entry.word] = createCard(entry);
      }else{
        state.cards[entry.word].data = entry; // update metadata
      }
    }
    state.lastSyncedAt = now();
    return state;
  }

  function saveState(state){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function schedule(card, grade){
    // grade: 0=again, 1=hard, 2=good, 3=easy
    const today = now();
    card.stats.seen += 1;
    if(grade === 0){
      card.lapses += 1;
      card.streak = 0;
      card.ease = Math.max(1.3, card.ease - 0.2);
      card.intervalDays = 0;
      card.dueAtMs = today + 8 * 60 * 60 * 1000; // later today retry
    } else {
      card.stats.correct += 1;
      const easeDelta = grade === 1 ? -0.15 : grade === 3 ? +0.15 : 0;
      card.ease = Math.max(1.3, card.ease + easeDelta);
      card.streak += 1;
      if(card.intervalDays === 0){
        // learning steps
        const step = grade === 1 ? 1/24 : grade === 3 ? 3 : 1; // 1h, 3d, 1d
        card.intervalDays = step;
      } else {
        card.intervalDays = Math.round(card.intervalDays * card.ease * (grade === 1 ? 0.8 : grade === 3 ? 1.3 : 1));
        card.intervalDays = Math.max(1, card.intervalDays);
      }
      card.dueAtMs = today + card.intervalDays * 24 * 60 * 60 * 1000;
    }
  }

  function selectDue(state, limit){
    const t = now();
    const due = Object.values(state.cards).filter(c => c.dueAtMs <= t).sort((a,b)=> (a.dueAtMs||0)-(b.dueAtMs||0));
    return due.slice(0, limit);
  }

  function selectNew(state, limit){
    const unseen = Object.values(state.cards).filter(c => c.stats.seen === 0);
    return unseen.slice(0, limit);
  }

  function getProgress(state){
    const cards = Object.values(state.cards);
    const total = cards.length;
    const learned = cards.filter(c => c.intervalDays >= 7).length;
    const dueCount = cards.filter(c => c.dueAtMs <= now()).length;
    return { total, learned, dueCount };
  }

  window.SRS = { loadState, saveState, schedule, selectDue, selectNew, getProgress };
})();

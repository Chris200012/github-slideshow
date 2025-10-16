(function(){
  const state = { srs: null, theme: 'theme-forest', mode: 'home' };

  function byId(id){ return document.getElementById(id); }

  function setTheme(theme){ state.theme = theme; render(); }

  function nav(){
    byId('btn-home').onclick = () => showHome();
    byId('btn-refresh').onclick = () => showSession('refresh');
    byId('btn-revise').onclick = () => showSession('revise');
    byId('btn-themes').onclick = () => showThemes();
    const sb = byId('btn-sound');
    if(sb){
      const sync = () => {
        try{
          const muted = Sound && Sound.isMuted ? Sound.isMuted() : false;
          sb.textContent = muted ? '🔇' : '🔊';
          sb.setAttribute('aria-pressed', muted ? 'true' : 'false');
        }catch{}
      };
      sb.onclick = () => { try{ Sound.ensureCtx && Sound.ensureCtx(); Sound.setMuted && Sound.setMuted(!(Sound.isMuted && Sound.isMuted())); Sound.click && Sound.click(); }catch{} sync(); };
      sync();
    }
  }

  function ensureSRS(){
    if(!state.srs){ state.srs = SRS.loadState(IELTS_DATA); }
  }

  function save(){ SRS.saveState(state.srs); }

  function shell(container){
    const host = UI.makeEl('div', { className: `container ${state.theme}`});
    host.appendChild(UI.bg(state.theme));
    host.appendChild(container);
    return host;
  }

  function showHome(){
    state.mode = 'home'; ensureSRS();
    const p = SRS.getProgress(state.srs);

    const content = UI.makeEl('div', { className: 'grid' }, [
      UI.makeEl('div', { className: 'card' }, [
        UI.headerBar({ title: 'Welcome' }),
        UI.makeEl('p', { textContent: 'Rescue the cats by mastering IELTS words. Choose a mode below.' }),
        UI.makeEl('div', { className: 'footer-row' }, [
          UI.makeEl('button', { className: 'btn primary', textContent: 'Start Refresh', onclick: () => showSession('refresh') }),
          UI.makeEl('button', { className: 'btn', textContent: 'Start Revise', onclick: () => showSession('revise') })
        ])
      ]),
      UI.makeEl('div', { className: 'card' }, [
        UI.headerBar({ title: 'Progress'}),
        UI.makeEl('p', { innerHTML: `Total: <b>${p.total}</b> • Learned: <b>${p.learned}</b> • Due: <b>${p.dueCount}</b>` }),
        UI.progressBar(p.learned / Math.max(1, p.total))
      ]),
      UI.makeEl('div', { className: 'card' }, [
        UI.headerBar({ title: 'Theme'}),
        UI.makeEl('p', { textContent: 'Pick a backdrop for your rescue.' }),
        UI.makeEl('div', { className: 'footer-row' }, [
          UI.makeEl('button', { className: 'btn ghost', textContent: 'Forest', onclick: () => setTheme('theme-forest') }),
          UI.makeEl('button', { className: 'btn ghost', textContent: 'Bay', onclick: () => setTheme('theme-bay') }),
          UI.makeEl('button', { className: 'btn ghost', textContent: 'City', onclick: () => setTheme('theme-city') })
        ])
      ])
    ]);

    UI.clear();
    document.getElementById('screen').appendChild(shell(content));
  }

  function showThemes(){
    const content = UI.makeEl('div', { className: 'grid' }, [
      UI.makeEl('div', { className: 'card' }, [
        UI.headerBar({ title: 'Choose a Theme'}),
        UI.makeEl('div', { className: 'footer-row' }, [
          UI.makeEl('button', { className: 'btn', textContent: 'Forest', onclick: () => setTheme('theme-forest') }),
          UI.makeEl('button', { className: 'btn', textContent: 'Bay', onclick: () => setTheme('theme-bay') }),
          UI.makeEl('button', { className: 'btn', textContent: 'City', onclick: () => setTheme('theme-city') })
        ])
      ])
    ]);
    UI.clear();
    document.getElementById('screen').appendChild(shell(content));
  }

  function pickChoices(correct){
    const defs = new Set([correct.data.meanings[0]]);
    const pool = IELTS_DATA.map(e=>e.meanings[0]).filter(m=>!defs.has(m));
    while(defs.size < 4 && pool.length){
      const i = Math.floor(Math.random() * pool.length);
      defs.add(pool.splice(i,1)[0]);
    }
    const arr = Array.from(defs);
    for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    return arr;
  }

  function showSession(kind){
    state.mode = kind; ensureSRS();
    const queue = kind === 'refresh' ? SRS.selectNew(state.srs, 10) : SRS.selectDue(state.srs, 15);
    let index = 0; let rescuedCount = 0;

    function renderStep(){
      const card = queue[index];
      if(!card){
        UI.clear();
        const done = UI.makeEl('div', { className: 'grid' }, [
          UI.makeEl('div', { className: 'card' }, [
            UI.headerBar({ title: 'All Cats Rescued!'}),
            UI.makeEl('p', { textContent: `You rescued ${rescuedCount} cats.`}),
            UI.makeEl('div', { className: 'footer-row' }, [
              UI.makeEl('button', { className: 'btn primary', textContent: 'Back Home', onclick: () => showHome() })
            ])
          ])
        ]);
        document.getElementById('screen').appendChild(shell(done));
        save();
        return;
      }

      const cat = UI.Cat({ animated: true });
      const statText = UI.makeEl('div', { className: 'label', textContent: `${kind==='refresh'?'New Word':'Due Card'} ${index+1}/${queue.length}` });

      // Two panes: match-the-meaning and type-to-rescue
      const choices = pickChoices(card);
      const choicesPane = UI.makeEl('div', { className: 'card' }, [
        UI.headerBar({ title: `Match the meaning for "${card.word}"` }),
        UI.makeEl('div', { className: 'choices' }, choices.map(def => UI.makeEl('button', { className: 'choice', textContent: def, onclick: () => onPick(def) }))),
        UI.makeEl('div', { className: 'feedback', id: 'feedback-choices', role: 'status', 'aria-live': 'polite' })
      ]);

      const typePane = UI.makeEl('div', { className: 'card' }, [
        UI.headerBar({ title: 'Type to Rescue'}),
        UI.makeEl('p', { className: 'prompt', textContent: card.data.meanings[0] }),
        UI.makeEl('input', { id: 'type-input', className: 'word-input', placeholder: 'Type the word…', 'aria-label': 'Type the word that matches the definition', autocomplete: 'off', autocapitalize: 'none', spellcheck: false, onkeydown: (e)=>{ if(e.key==='Enter') onType(); } }),
        UI.makeEl('div', { className: 'feedback', id: 'feedback-type', role: 'alert', 'aria-live': 'assertive' })
      ]);

      const nextBtn = UI.makeEl('button', { className: 'btn primary', textContent: 'Next', disabled: true, onclick: () => { Sound && Sound.click && Sound.click(); index++; renderStep(); } });

      function onPick(def){
        const correct = (def === card.data.meanings[0]);
        document.getElementById('feedback-choices').textContent = correct ? 'Correct!' : `Not quite.`;
        Array.from(choicesPane.querySelectorAll('.choice')).forEach(ch => {
          ch.disabled = true;
          if(ch.textContent === card.data.meanings[0]) ch.classList.add('correct');
          if(ch.textContent === def && !correct) ch.classList.add('wrong');
        });
        if(correct){ Sound && Sound.success && Sound.success(); } else { Sound && Sound.error && Sound.error(); }
      }

      function onType(){
        const input = document.getElementById('type-input');
        const val = (input.value||'').trim().toLowerCase();
        const isCorrect = val === card.word.toLowerCase();
        document.getElementById('feedback-type').textContent = isCorrect ? 'Cat rescued! 🐾' : 'Try again!';
        if(isCorrect){
          cat.classList.remove('bounce');
          cat.classList.add('rescued');
          rescuedCount++;
          SRS.schedule(card, 2); // grade=good for correct typing
          nextBtn.disabled = false;
          Sound && Sound.success && Sound.success();
        } else {
          SRS.schedule(card, 0); // again
          Sound && Sound.error && Sound.error();
        }
        save();
      }

      const content = UI.makeEl('div', { className: 'grid' }, [
        UI.makeEl('div', { className: 'card' }, [ UI.headerBar({ title: 'Rescue the Cat', right: statText }), cat ]),
        choicesPane,
        typePane,
        UI.makeEl('div', { className: 'card' }, [ UI.headerBar({ title: 'Progress'}), UI.progressBar((index)/Math.max(1, queue.length)) ]),
        UI.makeEl('div', { className: 'footer-row' }, [ nextBtn, UI.makeEl('button', { className: 'btn', textContent: 'Quit', onclick: () => showHome() }) ])
      ]);

      UI.clear();
      document.getElementById('screen').appendChild(shell(content));
      // Move focus to typing input for convenience
      setTimeout(() => { const ti = byId('type-input'); if(ti) ti.focus(); }, 0);
    }

    renderStep();
  }

  function render(){
    if(state.mode === 'home') showHome();
    else if(state.mode === 'refresh') showSession('refresh');
    else if(state.mode === 'revise') showSession('revise');
  }

  window.addEventListener('DOMContentLoaded', () => {
    nav();
    showHome();
  });
})();

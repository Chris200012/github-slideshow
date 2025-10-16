(function(){
  const screen = () => document.getElementById('screen');

  function clear(){ screen().innerHTML = ''; }

  function makeEl(tag, props={}, children=[]){
    const el = document.createElement(tag);
    for(const [k,v] of Object.entries(props)){
      if(k.startsWith('on') && typeof v==='function'){
        el.addEventListener(k.slice(2).toLowerCase(), v);
        continue;
      }
      if(k.includes('-') || k === 'role' || k === 'tabindex'){
        el.setAttribute(k, v);
        continue;
      }
      if(k === 'style' && typeof v === 'object'){
        Object.assign(el.style, v);
        continue;
      }
      if(k === 'dataset' && typeof v === 'object'){
        Object.assign(el.dataset, v);
        continue;
      }
      el[k] = v;
    }
    for(const ch of children){ el.appendChild(typeof ch==='string'?document.createTextNode(ch):ch); }
    return el;
  }

  function bg(theme){
    const host = makeEl('div', { className: `bg ${theme}` });
    host.appendChild(makeEl('div', { className: 'layer sun'}));
    host.appendChild(makeEl('div', { className: 'layer clouds'}));
    host.appendChild(makeEl('div', { className: 'layer hills'}));
    return host;
  }

  function Cat({ animated=false, rescued=false }){
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 200 200');
    svg.setAttribute('class', `cat ${animated?'bounce':''} ${rescued?'rescued':''}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `
      <defs>
        <radialGradient id="earGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffccbc"/>
          <stop offset="100%" stop-color="#ffab91"/>
        </radialGradient>
      </defs>
      <circle cx="100" cy="105" r="60" fill="#ffe0b2" stroke="#4e342e" stroke-width="4"/>
      <path d="M55 60 L75 15 L95 60" fill="#ffe0b2" stroke="#4e342e" stroke-width="4"/>
      <path d="M105 60 L125 15 L145 60" fill="#ffe0b2" stroke="#4e342e" stroke-width="4"/>
      <path d="M60 60 L75 35 L90 60" fill="url(#earGrad)"/>
      <path d="M110 60 L125 35 L140 60" fill="url(#earGrad)"/>
      <circle cx="80" cy="100" r="8" fill="#4e342e"/>
      <circle cx="120" cy="100" r="8" fill="#4e342e"/>
      <path d="M90 125 Q100 135 110 125" stroke="#4e342e" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="100" cy="115" r="5" fill="#ffab91"/>
      <path d="M50 110 Q70 115 50 120" stroke="#4e342e" stroke-width="3" fill="none"/>
      <path d="M150 110 Q130 115 150 120" stroke="#4e342e" stroke-width="3" fill="none"/>
    `;
    return svg;
  }

  function headerBar({ title, right=null }){
    return makeEl('div', { className: 'header-row' }, [
      makeEl('h2', { textContent: title }),
      right
    ].filter(Boolean));
  }

  function progressBar(progress){
    const outer = makeEl('div', { className: 'progress' });
    const inner = makeEl('span');
    inner.style.width = `${Math.min(100, Math.round(progress*100))}%`;
    outer.appendChild(inner);
    return outer;
  }

  window.UI = { clear, makeEl, bg, Cat, headerBar, progressBar };
})();

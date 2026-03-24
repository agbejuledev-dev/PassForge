// State//
  const state = {
    length: 16,
    upper: true,
    lower: true,
    numbers: true,
    symbols: true,
    currentPw: '',
    history: []
  };

  const CHARSETS = {
    upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower:   'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  //  Generate//
  function generatePassword() {
    const exclude = document.getElementById('excludeInput').value;
    let pool = '';
    const guaranteedChars = [];

    ['upper','lower','numbers','symbols'].forEach(k => {
      if (state[k]) {
        let chars = CHARSETS[k].split('').filter(c => !exclude.includes(c)).join('');
        if (chars.length > 0) {
          pool += chars;
          // Guarantee at least one from each active type
          guaranteedChars.push(secureRand(chars));
        }
      }
    });

    if (pool.length === 0) {
      showToast('Enable at least one character type!');
      return;
    }

    const len = state.length;
    const pwArr = [...guaranteedChars];

    for (let i = pwArr.length; i < len; i++) {
      pwArr.push(secureRand(pool));
    }

    // Shuffle using Fisher-Yates with crypto random
    for (let i = pwArr.length - 1; i > 0; i--) {
      const j = Math.floor(secureFloat() * (i + 1));
      [pwArr[i], pwArr[j]] = [pwArr[j], pwArr[i]];
    }

    const pw = pwArr.join('');
    state.currentPw = pw;

    renderPassword(pw);
    updateStrength(pw, pool.length);
    addToHistory(pw);
  }

  function secureRand(str) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return str[arr[0] % str.length];
  }

  function secureFloat() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / (0xFFFFFFFF + 1);
  }

  // Render password with colored chars//
  function renderPassword(pw) {
    const el = document.getElementById('passwordDisplay');
    el.classList.remove('animating');
    void el.offsetWidth; // reflow
    el.classList.add('animating');

    const html = pw.split('').map(c => {
      if (CHARSETS.upper.includes(c))   return `<span class="char-upper">${c}</span>`;
      if (CHARSETS.lower.includes(c))   return `<span class="char-lower">${c}</span>`;
      if (CHARSETS.numbers.includes(c)) return `<span class="char-num">${c}</span>`;
      return `<span class="char-sym">${c}</span>`;
    }).join('');

    el.innerHTML = html;
  }

  // Strength & Entropy//
  function updateStrength(pw, poolSize) {
    const entropy = Math.log2(Math.pow(poolSize, pw.length));
    document.getElementById('entropyVal').textContent = entropy.toFixed(1);

    let score, label, color, width;
    if (entropy < 40)      { score=1; label='Weak';    color='var(--danger)'; width='20%'; }
    else if (entropy < 60) { score=2; label='Fair';    color='var(--warn)';   width='45%'; }
    else if (entropy < 80) { score=3; label='Good';    color='#a8e063';       width='65%'; }
    else if (entropy < 100){ score=4; label='Strong';  color='var(--good)';   width='82%'; }
    else                   { score=5; label='Fort!';   color='#00ffe7';       width='100%'; }

    const bar = document.getElementById('strengthBar');
    const lbl = document.getElementById('strengthLabel');
    bar.style.width = width;
    bar.style.background = color;
    lbl.style.color = color;
    lbl.textContent = label;
  }
  // Copy//
  function copyPassword() {
    if (!state.currentPw || state.currentPw === 'Click generate...') return;
    navigator.clipboard.writeText(state.currentPw).then(() => {
      const btn = document.getElementById('copyBtn');
      const txt = document.getElementById('copyText');
      btn.classList.add('copied');
      txt.textContent = 'Copied!';
      document.getElementById('copyIcon').textContent = '✓';
      showToast('Password copied to clipboard!');
      setTimeout(() => {
        btn.classList.remove('copied');
        txt.textContent = 'Copy Password';
        document.getElementById('copyIcon').textContent = '⎘';
      }, 2000);
    });
  }

  // History//
  function addToHistory(pw) {
    state.history.unshift({ pw, len: pw.length });
    if (state.history.length > 10) state.history.pop();
    renderHistory();
  }

  function renderHistory() {
    const list = document.getElementById('historyList');
    if (state.history.length === 0) {
      list.innerHTML = '<div style="font-family:\'Space Mono\',monospace;font-size:11px;color:var(--muted);padding:8px 0;">No history yet.</div>';
      return;
    }
    list.innerHTML = state.history.map((item, i) => `
      <div class="history-item" onclick="copyFromHistory(${i})">
        <div class="history-pw">${item.pw}</div>
        <div class="history-meta">
          <span class="history-len">${item.len}ch</span>
          <span class="history-copy">⎘</span>
        </div>
      </div>
    `).join('');
  }

  function copyFromHistory(i) {
    navigator.clipboard.writeText(state.history[i].pw).then(() => {
      showToast('Copied from history!');
    });
  }

  let historyVisible = true;
  function toggleHistory() {
    const sec = document.getElementById('historySection');
    historyVisible = !historyVisible;
    sec.style.display = historyVisible ? '' : 'none';
  }

  // Controls//
  function onLengthChange(val) {
    state.length = parseInt(val);
    document.getElementById('lengthVal').textContent = val;
    generatePassword();
  }

  function toggleOption(key) {
    const el = document.getElementById('toggle-' + key);
    const activeToggles = ['upper','lower','numbers','symbols'].filter(k => state[k]);
    if (state[key] && activeToggles.length <= 1) {
      showToast('At least one type must be enabled!');
      return;
    }
    state[key] = !state[key];
    el.classList.toggle('active', state[key]);
    generatePassword();
  }

 
  // Toast//
  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }


  // Keyboard shortcuts//
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      generatePassword();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.getSelection()?.toString() === '') {
      copyPassword();
    }
  });

  // Init//
  generatePassword();
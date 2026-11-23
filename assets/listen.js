/* MDBR – "Ascolta / Listen": legge l'articolo con la sintesi vocale del browser */
(function () {
  var box = document.querySelector('.listen');
  if (!box) return;
  var synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { box.hidden = true; return; }

  var btn = box.querySelector('.listen-btn');
  var stopBtn = box.querySelector('.listen-stop');
  var status = box.querySelector('.listen-status');
  var queue = [], idx = 0, playing = false, paused = false;

  function lang() { return (document.documentElement.lang || 'it').slice(0, 2); }
  function t(it, en) { return lang() === 'it' ? it : en; }

  function pickVoice(l) {
    var vs = synth.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(l) === 0; });
    var pref = vs.filter(function (v) { return /premium|enhanced|natural|neural|google/i.test(v.name); });
    return pref[0] || vs.filter(function (v) { return v.localService; })[0] || vs[0] || null;
  }

  function cleanText(el) {
    var c = el.cloneNode(true);
    // il greco (e ogni lingua diversa da quella della pagina, tranne il latino) non viene letto: la parafrasi segue nel testo
    c.querySelectorAll('[lang="grc"],[lang="el"]').forEach(function (n) { n.remove(); });
    return c.textContent.replace(/\s*\(\s*\)\s*/g, ' ').replace(/\s+,/g, ',').replace(/:\s*:/g, ':').replace(/\s{2,}/g, ' ').trim();
  }

  function buildQueue() {
    var l = lang();
    var root = document.querySelector('article .only-' + l) || document.querySelector('article');
    var out = [];
    var h1 = document.querySelector('.note-header h1');
    var sub = document.querySelector('.note-header .note-intro');
    if (h1) out.push(h1.textContent.trim() + (sub ? '. ' + sub.textContent.trim() : '') + '.');
    root.querySelectorAll('p, li').forEach(function (p) {
      if (p.closest('li') && p.tagName === 'P') return;
      var s = cleanText(p);
      if (s.replace(/[\s.,:;]/g, '').length) out.push(s);
    });
    return out;
  }

  function setUI() {
    btn.setAttribute('aria-pressed', playing && !paused ? 'true' : 'false');
    btn.querySelector('.listen-label').textContent =
      !playing ? t('Ascolta', 'Listen') : paused ? t('Riprendi', 'Resume') : t('Pausa', 'Pause');
        stopBtn.hidden = !playing; box.querySelector('.listen-sep').hidden = !playing; box.querySelector('.listen-note').hidden = playing;
    status.textContent = playing ? '· ' + (idx + 1) + ' / ' + queue.length : '';
  }

  function speakNext() {
    if (!playing || paused) return;
    if (idx >= queue.length) { stop(); return; }
    var u = new SpeechSynthesisUtterance(queue[idx]);
    var l = lang();
    u.lang = l === 'it' ? 'it-IT' : 'en-GB';
    var v = pickVoice(l); if (v) u.voice = v;
    u.rate = 1;
    u.onend = function () { if (playing && !paused) { idx++; setUI(); speakNext(); } };
    u.onerror = function (e) { if (e.error !== 'interrupted' && e.error !== 'canceled') { idx++; speakNext(); } };
    synth.speak(u);
    setUI();
  }

  function stop() { playing = false; paused = false; idx = 0; synth.cancel(); setUI(); }

  btn.addEventListener('click', function () {
    if (!playing) { queue = buildQueue(); idx = 0; playing = true; paused = false; synth.cancel(); speakNext(); }
    else if (!paused) { paused = true; synth.cancel(); setUI(); }        // pausa: si riprende dal paragrafo corrente
    else { paused = false; speakNext(); }
  });
  stopBtn.addEventListener('click', stop);

  // cambio lingua dalla barra IT/EN: si ferma la lettura
  new MutationObserver(function () { if (playing) stop(); else setUI(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.addEventListener('pagehide', function () { synth.cancel(); });
  if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = function () {};
  setUI();
})();

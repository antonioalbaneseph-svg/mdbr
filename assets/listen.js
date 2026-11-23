/* MDBR – "Ascolta / Listen": legge l'articolo con la sintesi vocale del browser */
(function () {
  var box = document.querySelector('.listen');
  if (!box) return;
  var synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { box.hidden = true; return; }

  var btn = box.querySelector('.listen-btn');
  var stopBtn = box.querySelector('.listen-stop');
  var status = box.querySelector('.listen-status');
  var token = 0; var queue = [], idx = 0, playing = false, paused = false;
  var rateBtn = box.querySelector('.listen-rate');
  var RATES = [1, 1.1, 1.2, 1.3, 1.4, 1.5], rate = 1;
  try { var r = parseFloat(localStorage.getItem('mdbr-listen-rate')); if (RATES.indexOf(r) > -1) rate = r; } catch (_) {}
  function fmt(r) { var s = String(r) + '×'; return lang() === 'it' ? s.replace('.', ',') : s; }

  function lang() { return (document.documentElement.lang || 'it').slice(0, 2); }
  function t(it, en) { return lang() === 'it' ? it : en; }

  function pickVoice(l) {
    var vs = synth.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(l) === 0; });
    var pref = vs.filter(function (v) { return /premium|enhanced|natural|neural|google/i.test(v.name); });
    return pref[0] || vs.filter(function (v) { return v.localService; })[0] || vs[0] || null;
  }

  var GREEK = '[lang="grc"],[lang="el"]';
  function tidy(s) { return s.replace(/\s+([,.;:])/g, '$1').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim(); }

  // Divide un paragrafo in segmenti di lingua. Il greco si salta solo se segue la parafrasi
  // (", parafrasi" subito dopo, o un paragrafo .paraphrase dopo la citazione); altrimenti lo legge una voce greca.
  function segments(el, pl) {
    var out = [];
    function push(text, l) { if (!text) return; var last = out[out.length - 1]; if (last && last.lang === l) last.text += text; else out.push({ text: text, lang: l }); }
    if (el.matches(GREEK)) {
      var nx = el.nextElementSibling;
      if (!(nx && nx.classList.contains('paraphrase'))) push(el.textContent, 'el');
      return out;
    }
    var skipComma = false;
    (function walk(node) {
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) {
          var tx = n.textContent;
          if (skipComma) {
            tx = tx.replace(/^\s*,\s*/, ' ');
            // preposizione articolata elisa davanti al greco: "all’ἀνάγκη, la necessità" → "alla necessità"
            var last = out[out.length - 1];
            var m = last && last.lang === pl && last.text.match(/(^|\s)(a|da|di|de|i|ne|su)ll['’]\s*$/i);
            var g = tx.match(/^\s*(il|lo|la|l['’]|i|gli|le)\s+/i);
            if (m && g) {
              var P = { a: 'a', da: 'da', di: 'de', de: 'de', i: 'ne', ne: 'ne', su: 'su' }[m[2].toLowerCase()];
              var art = g[1].toLowerCase().replace('’', "'");
              var J = { il: 'l', lo: 'llo', la: 'lla', "l'": "ll'", i: 'i', gli: 'gli', le: 'lle' }[art];
              var prep = P === 'de' ? 'de' : P;
              var word = art === 'il' ? prep + 'l' : art === 'i' ? prep + 'i' : art === 'gli' ? prep + 'gli' : prep + J;
              last.text = last.text.replace(/(^|\s)(a|da|di|de|i|ne|su)ll['’]\s*$/i, '$1');
              tx = ' ' + word + (art === "l'" ? '' : ' ') + tx.slice(g[0].length);
            }
            skipComma = false;
          }
          push(tx, pl); return;
        }
        if (n.nodeType !== 1) return;
        if (n.matches(GREEK)) {
          var after = n.nextSibling;
          var glossed = after && after.nodeType === 3 && /^\s*,/.test(after.textContent);
          if (!glossed) { push(' ' + n.textContent + ' ', 'el'); return; }
          // saltato perché segue la parafrasi: via anche l'articolo davanti e la virgola dopo ("Lo ζῷον…, il vivente" → "il vivente")
          var last = out[out.length - 1];
          if (last && last.lang === pl) last.text = last.text.replace(/(^|\s)(il|lo|la|l’|l'|i|gli|le|the|a|an)\s*$/i, '$1');
          skipComma = true;
          return;
        }
        walk(n);
      });
    })(el);
    return out.map(function (s) { return { text: tidy(s.text), lang: s.lang }; })
              .filter(function (s) { return s.text.replace(/[\s.,:;]/g, '').length; });
  }

  function buildQueue() {
    var l = lang();
    var root = document.querySelector('article .only-' + l) || document.querySelector('article');
    var out = [];
    var h1 = document.querySelector('.note-header h1');
    var sub = document.querySelector('.note-header .note-intro');
    if (h1) out.push({ text: h1.textContent.trim() + (sub ? '. ' + sub.textContent.trim() : '') + '.', lang: l });
    root.querySelectorAll('p, li').forEach(function (p) {
      if (p.closest('li') && p.tagName === 'P') return;
      if (p.closest('.podcast') || p.classList.contains('listen')) return;
      segments(p, l).forEach(function (s) { out.push(s); });
    });
    return out;
  }

  function setUI() {
    btn.setAttribute('aria-pressed', playing && !paused ? 'true' : 'false');
    btn.querySelector('.listen-label').textContent =
      !playing ? t('Ascolta', 'Listen') : paused ? t('Riprendi', 'Resume') : t('Pausa', 'Pause');
        stopBtn.hidden = !playing; box.querySelector('.listen-sep').hidden = !playing; box.querySelector('.listen-note').hidden = playing; if (rateBtn) rateBtn.querySelector('.listen-rate-val').textContent = fmt(rate);
    status.textContent = playing ? '· ' + (idx + 1) + ' / ' + queue.length : '';
  }

  function speakNext() {
    if (!playing || paused) return;
    if (idx >= queue.length) { stop(); return; }
    var seg = queue[idx];
    if (seg.lang === 'el' && !pickVoice('el')) { idx++; speakNext(); return; } // nessuna voce greca sul dispositivo: si salta
    var u = new SpeechSynthesisUtterance(seg.text); var my = ++token;
    u.lang = seg.lang === 'el' ? 'el-GR' : seg.lang === 'it' ? 'it-IT' : 'en-GB';
    var v = pickVoice(seg.lang); if (v) { try { u.voice = v; } catch (_) {} }
    u.rate = rate;
    u.onend = function () { if (my === token && playing && !paused) { idx++; setUI(); speakNext(); } };
    u.onerror = function (e) { if (e.error !== 'interrupted' && e.error !== 'canceled') { idx++; speakNext(); } };
    synth.speak(u);
    setUI();
  }

  function stop() { token++; playing = false; paused = false; idx = 0; synth.cancel(); setUI(); }

  btn.addEventListener('click', function () {
    if (!playing) { queue = buildQueue(); idx = 0; playing = true; paused = false; synth.cancel(); speakNext(); }
    else if (!paused) { paused = true; token++; synth.cancel(); setUI(); }        // pausa: si riprende dal paragrafo corrente
    else { paused = false; speakNext(); }
  });
  stopBtn.addEventListener('click', stop);
  if (rateBtn) rateBtn.addEventListener('click', function () {
    rate = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    try { localStorage.setItem('mdbr-listen-rate', String(rate)); } catch (_) {}
    if (playing && !paused) { token++; synth.cancel(); setTimeout(speakNext, 60); } // riparte il paragrafo corrente alla nuova velocità
    setUI();
  });

  // cambio lingua dalla barra IT/EN: si ferma la lettura
  new MutationObserver(function () { if (playing) stop(); else setUI(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.addEventListener('pagehide', function () { synth.cancel(); });
  if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = function () {};
  setUI();
})();

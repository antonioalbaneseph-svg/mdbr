/* MDBR – lettore del podcast originale (voce dell'autore) */
(function () {
  document.querySelectorAll('.podcast').forEach(function (box) {
    var a = box.querySelector('audio');
    var play = box.querySelector('.podcast-play');
    var bar = box.querySelector('.podcast-bar');
    var cur = box.querySelector('.podcast-cur');
    var dur = box.querySelector('.podcast-dur');
    var rates = box.querySelectorAll('.podcast-rates button');
    var rate = parseFloat(box.dataset.defaultRate || '1.1');

    function it() { return (document.documentElement.lang || 'it').slice(0, 2) === 'it'; }
    function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    function lab(r) { var s = String(r) + '×'; return it() ? s.replace('.', ',') : s; }
    function setRate(r) {
      rate = r; a.playbackRate = r; a.defaultPlaybackRate = r;
      rates.forEach(function (b) { var on = parseFloat(b.dataset.rate) === r; b.setAttribute('aria-pressed', on); b.textContent = lab(parseFloat(b.dataset.rate)); });
    }
    function ui() {
      var p = !a.paused;
      play.setAttribute('aria-pressed', p);
      play.querySelector('.podcast-play-label').textContent = p ? (it() ? 'Pausa' : 'Pause') : (it() ? 'Ascolta' : 'Listen');
      play.querySelector('.ico-play').style.display = p ? 'none' : '';
      play.querySelector('.ico-pause').style.display = p ? '' : 'none';
    }
    play.addEventListener('click', function () { if (a.paused) { a.playbackRate = rate; a.play(); } else a.pause(); });
    a.addEventListener('play', ui); a.addEventListener('pause', ui); a.addEventListener('ended', ui);
    a.addEventListener('loadedmetadata', function () { dur.textContent = fmt(a.duration); bar.max = Math.floor(a.duration); a.playbackRate = rate; });
    a.addEventListener('timeupdate', function () { cur.textContent = fmt(a.currentTime); if (!bar.dragging) bar.value = Math.floor(a.currentTime); });
    bar.addEventListener('input', function () { bar.dragging = true; cur.textContent = fmt(bar.value); });
    bar.addEventListener('change', function () { a.currentTime = bar.value; bar.dragging = false; });
    rates.forEach(function (b) { b.addEventListener('click', function () { setRate(parseFloat(b.dataset.rate)); }); });
    new MutationObserver(function () { setRate(rate); ui(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    setRate(rate); ui();
  });
})();

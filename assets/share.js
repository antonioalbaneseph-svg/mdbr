(() => {
  const alt = l => (document.querySelector('link[rel=alternate][hreflang="' + l + '"]') || {}).href;
  const canon = (document.querySelector('link[rel=canonical]') || {}).href || location.href;
  const lang = () => document.documentElement.lang === 'it' ? 'it' : 'en';
  document.querySelectorAll('.share').forEach(box => {
    const url = () => alt(lang()) || canon;
    const text = () => (box.dataset['share' + (lang() === 'it' ? 'It' : 'En')] || document.title);
    const update = () => {
      const u = encodeURIComponent(url()), t = encodeURIComponent(text() + ' → ' + url());
      const set = (sel, href) => { const a = box.querySelector(sel); if (a) a.href = href; };
      set('.share-wa', 'https://wa.me/?text=' + t);
      set('.share-li', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u);
      set('.share-fb', 'https://www.facebook.com/sharer/sharer.php?u=' + u);
    };
    update();
    new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    const status = box.querySelector('.share-status');
    const say = (en, it) => { if (status) status.textContent = lang() === 'it' ? it : en; };
    const native = box.querySelector('.share-native');
    if (native && navigator.share) {
      native.hidden = false;
      native.addEventListener('click', () => { navigator.share({ title: text(), url: url() }).catch(() => {}); });
    }
    const copy = box.querySelector('.share-copy');
    if (copy) copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url()); say('Link copied.', 'Link copiato.'); }
      catch (_) { say('Copy this link: ' + url(), 'Copia questo link: ' + url()); }
    });
  });
})();

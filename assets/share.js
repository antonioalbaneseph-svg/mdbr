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
    // Instagram e TikTok non hanno un link di condivisione dal web:
    // sul telefono si apre il pannello di condivisione (dove compaiono le app), altrove si copia il link.
    const appShare = (name) => async () => {
      if (navigator.share) { try { await navigator.share({ title: text(), text: text(), url: url() }); return; } catch (_) { return; } }
      try { await navigator.clipboard.writeText(url()); say('Link copied: paste it into ' + name + '.', 'Link copiato: incollalo su ' + name + '.'); }
      catch (_) { say('Copy this link for ' + name + ': ' + url(), 'Copia questo link per ' + name + ': ' + url()); }
    };
    const ig = box.querySelector('.share-ig'); if (ig) ig.addEventListener('click', appShare('Instagram'));
    const tt = box.querySelector('.share-tt'); if (tt) tt.addEventListener('click', appShare('TikTok'));
    const copy = box.querySelector('.share-copy');
    if (copy) copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url()); say('Link copied.', 'Link copiato.'); }
      catch (_) { say('Copy this link: ' + url(), 'Copia questo link: ' + url()); }
    });
  });
})();

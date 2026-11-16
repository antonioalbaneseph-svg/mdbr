(() => {
  document.querySelectorAll('.share').forEach(box => {
    const url = (document.querySelector('link[rel=canonical]') || {}).href || location.href;
    const title = (document.querySelector('meta[property="og:title"]') || {}).content || document.title;
    const u = encodeURIComponent(url), t = encodeURIComponent(title + ' ' + url);
    const set = (sel, href) => { const a = box.querySelector(sel); if (a) a.href = href; };
    set('.share-wa', 'https://wa.me/?text=' + t);
    set('.share-li', 'https://www.linkedin.com/sharing/share-offsite/?url=' + u);
    set('.share-fb', 'https://www.facebook.com/sharer/sharer.php?u=' + u);
    const status = box.querySelector('.share-status');
    const lang = () => document.documentElement.lang === 'it' ? 'it' : 'en';
    const say = (en, it) => { if (status) status.textContent = lang() === 'it' ? it : en; };
    const native = box.querySelector('.share-native');
    if (native && navigator.share) {
      native.hidden = false;
      native.addEventListener('click', () => { navigator.share({ title, url }).catch(() => {}); });
    }
    const copy = box.querySelector('.share-copy');
    if (copy) copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url); say('Link copied.', 'Link copiato.'); }
      catch (_) { say('Copy this link: ' + url, 'Copia questo link: ' + url); }
    });
  });
})();

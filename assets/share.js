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
    // Instagram e TikTok non accettano link dal web: si condivide la card verticale della pagina
    // (pronta per storie e TikTok) e intanto si copia il link, da incollare nello sticker Link.
    const cardUrl = () => box.dataset['story' + (lang() === 'it' ? 'It' : 'En')];
    const files = {};
    const preload = () => { const c = cardUrl(); if (!c || files[c]) return;
      files[c] = fetch(c).then(r => r.blob()).then(b => new File([b], c.split('/').pop().split('?')[0], { type: 'image/jpeg' })).catch(() => null); };
    preload();
    new MutationObserver(preload).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    let ready = {};
    const appShare = (name) => async () => {
      const c = cardUrl();
      try { navigator.clipboard && navigator.clipboard.writeText(url()); } catch (_) {}
      let f = c ? ready[c] : null;
      if (!f && c) { try { f = await (files[c] || (preload(), files[c])); } catch (_) { f = null; } }
      const canFiles = f && navigator.canShare && (() => { try { return navigator.canShare({ files: [f] }); } catch (_) { return false; } })();
      if (canFiles) {
        say('Link copied: add a Link sticker in ' + name + ' and paste it.', 'Link copiato: in ' + name + ' aggiungi lo sticker Link e incollalo.');
        try { await navigator.share({ files: [f] }); } catch (e) {
          if (e && e.name === 'NotAllowedError' && navigator.share) { try { await navigator.share({ title: text(), url: url() }); } catch (_) {} }
        }
        return;
      }
      if (navigator.share) { // telefono, ma il browser non sa allegare immagini: si condivide il link
        say('This browser cannot attach the image: open the page in Chrome or Safari to share the story card.',
            'Questo browser non sa allegare l’immagine: apri la pagina in Chrome o Safari per condividere la card.');
        try { await navigator.share({ title: text(), url: url() }); } catch (_) {}
        return;
      }
      if (c) { const a = document.createElement('a'); a.href = c; a.download = c.split('/').pop().split('?')[0]; document.body.appendChild(a); a.click(); a.remove(); }
      say('Story card downloaded and link copied: post the image on ' + name + ' and paste the link.',
          'Card scaricata e link copiato: pubblica l’immagine su ' + name + ' e incolla il link.');
    };
    // i file vanno pronti prima del tocco: Safari vuole la condivisione subito dopo il gesto
    const keep = () => { const c = cardUrl(); if (c && files[c]) files[c].then(f => { if (f) ready[c] = f; }); };
    keep(); new MutationObserver(keep).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    const ig = box.querySelector('.share-ig'); if (ig) ig.addEventListener('click', appShare('Instagram'));
    const tt = box.querySelector('.share-tt'); if (tt) tt.addEventListener('click', appShare('TikTok'));
    const copy = box.querySelector('.share-copy');
    if (copy) copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url()); say('Link copied.', 'Link copiato.'); }
      catch (_) { say('Copy this link: ' + url(), 'Copia questo link: ' + url()); }
    });
  });
})();

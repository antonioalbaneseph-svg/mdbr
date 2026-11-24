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
    const cardUrl = (key) => (key === 'tt' && box.dataset['storyTt' + (lang() === 'it' ? 'It' : 'En')]) || box.dataset['story' + (lang() === 'it' ? 'It' : 'En')];
    const files = {};
    const preload1 = (c) => { if (!c || files[c]) return;
      files[c] = fetch(c).then(r => r.blob()).then(b => new File([b], c.split('/').pop().split('?')[0], { type: 'image/jpeg' })).catch(() => null); };
    const preload = () => { preload1(cardUrl('ig')); preload1(cardUrl('tt')); };
    preload();
    new MutationObserver(preload).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    let ready = {};
    const caption = (key) => box.dataset['cap' + key.charAt(0).toUpperCase() + key.slice(1) + (lang() === 'it' ? 'It' : 'En')] || url();
    const appShare = (name, key) => async () => {
      const c = cardUrl(key);
      try { navigator.clipboard && navigator.clipboard.writeText(caption(key)); } catch (_) {}
      let f = c ? ready[c] : null;
      if (!f && c) { try { f = await (files[c] || (preload1(c), files[c])); } catch (_) { f = null; } }
      const canFiles = f && navigator.canShare && (() => { try { return navigator.canShare({ files: [f] }); } catch (_) { return false; } })();
      if (canFiles) {
        say('Caption, hashtags and link copied: paste them into ' + name + '. For a Link sticker keep only the address.', 'Testo, hashtag e link copiati: incollali su ' + name + '. Nello sticker Link tieni solo l’indirizzo.');
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
      say('Story card downloaded; caption, hashtags and link copied: post the image on ' + name + ' and paste the text.',
          'Card scaricata; testo, hashtag e link copiati: pubblica l’immagine su ' + name + ' e incolla il testo.');
    };
    // i file vanno pronti prima del tocco: Safari vuole la condivisione subito dopo il gesto
    const keep = () => { [cardUrl('ig'), cardUrl('tt')].forEach(c => { if (c && files[c]) files[c].then(f => { if (f) ready[c] = f; }); }); };
    keep(); new MutationObserver(keep).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    const fbCap = box.querySelector('.share-fb');
    if (fbCap) fbCap.addEventListener('click', () => {
      const k = 'capFb' + (lang() === 'it' ? 'It' : 'En'); const t = box.dataset[k];
      if (!t) return;
      try { navigator.clipboard && navigator.clipboard.writeText(t); } catch (_) {}
      say('Text copied: paste it above the preview in Facebook.', 'Testo copiato: incollalo sopra l’anteprima su Facebook.');
    });
    const ig = box.querySelector('.share-ig'); if (ig) ig.addEventListener('click', appShare('Instagram', 'ig'));
    const tt = box.querySelector('.share-tt'); if (tt) tt.addEventListener('click', appShare('TikTok', 'tt'));
    const copy = box.querySelector('.share-copy');
    if (copy) copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url()); say('Link copied.', 'Link copiato.'); }
      catch (_) { say('Copy this link: ' + url(), 'Copia questo link: ' + url()); }
    });
  });
})();

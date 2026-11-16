/* MDBR – newsletter subscription (Kit). Progressive enhancement: without JS the form posts directly to Kit. */
(() => {
  const forms = document.querySelectorAll('form.subscribe-form');
  if (!forms.length) return;
  const msg = {
    en: { sending: 'Sending…', ok: 'Almost done: check your inbox and confirm your subscription.', err: 'Something went wrong. Please try again, or write to info@mdbr-inst.org.', invalid: 'Please enter a valid email address.', ph: 'Your email address' },
    it: { sending: 'Invio in corso…', ok: 'Quasi fatto: controlla la tua casella e conferma l’iscrizione.', err: 'Qualcosa non ha funzionato. Riprova, oppure scrivi a info@mdbr-inst.org.', invalid: 'Inserisci un indirizzo email valido.', ph: 'Il tuo indirizzo email' }
  };
  const lang = () => (document.documentElement.lang === 'it' ? 'it' : 'en');
  const setPlaceholders = () => forms.forEach(f => { const i = f.querySelector('input[type=email]'); if (i) i.placeholder = msg[lang()].ph; });
  setPlaceholders();
  new MutationObserver(setPlaceholders).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  forms.forEach(form => {
    const status = form.parentElement.querySelector('.subscribe-status');
    const button = form.querySelector('button');
    const say = (text, isError) => { if (status) { status.textContent = text; status.classList.toggle('is-error', !!isError); } };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = form.querySelector('input[type=email]');
      if (!email.value || !email.checkValidity()) { say(msg[lang()].invalid, true); email.focus(); return; }
      if (form.querySelector('.hp input').value) return; // bot trap
      button.disabled = true; say(msg[lang()].sending);
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || (data.status && data.status !== 'success')) throw new Error('kit');
        form.reset(); say(msg[lang()].ok);
      } catch (_) { say(msg[lang()].err, true); }
      finally { button.disabled = false; }
    });
  });
})();

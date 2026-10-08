/* Discovery Coffee — mini cup empties with scroll, cup builds layer by layer, coffee passport */
(() => {
  'use strict';
  const M = window.Motion || { $: (s, r = document) => r.querySelector(s), $$: (s, r = document) => Array.from(r.querySelectorAll(s)), motion: false, reduce: true, onScroll: [], toast() {} };
  const { $, $$ } = M;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const onScroll = (fn) => { if (M.onScroll && M.motion) M.onScroll.push(fn); else addEventListener('scroll', () => fn(scrollY), { passive: true }); fn(scrollY); };

  /* Mini cup in the corner: the further you scroll, the less coffee is left */
  const mini = $('.mini-cup'), level = $('#mc-level'), mtext = $('#mc-text');
  if (mini && level) {
    let last = -1;
    onScroll((y) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? clamp(y / max) : 0;
      mini.classList.toggle('is-on', y > innerHeight * 0.6);
      const pct = Math.round((1 - p) * 100);
      if (pct === last) return;
      last = pct;
      level.style.transform = 'translateY(' + (p * 26).toFixed(2) + 'px)';
      mtext.textContent = pct > 0 ? 'кофе ' + pct + '%' : 'пора за новой чашкой';
    });
  }

  /* Cup story: espresso → milk → foam → latte art */
  const cup = $('#cup');
  if (cup && M.motion) {
    const steps = $$('.cup-steps li');
    let idx = -1;
    onScroll(() => {
      const r = cup.getBoundingClientRect();
      const span = cup.offsetHeight - innerHeight;
      const p = span > 0 ? clamp(-r.top / span) : 0;
      cup.style.setProperty('--f1', clamp(p / 0.22).toFixed(3));
      cup.style.setProperty('--f2', clamp((p - 0.25) / 0.22).toFixed(3));
      cup.style.setProperty('--f3', clamp((p - 0.5) / 0.18).toFixed(3));
      cup.style.setProperty('--f4', clamp((p - 0.72) / 0.14).toFixed(3));
      const i = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.72 ? 2 : 3;
      if (i !== idx) { idx = i; steps.forEach((s, k) => s.classList.toggle('is-on', k === i)); }
    });
  }

  /* Coffee passport */
  const stamps = $$('.stamp');
  const nEl = $('#ps-n'), bar = $('#ps-bar');
  const KEY = 'discovery-passport';
  let got = [];
  try { got = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { got = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(got)); } catch (e) { /* storage off */ } };
  const paint = () => {
    stamps.forEach((s) => { const on = got.indexOf(s.dataset.k) >= 0; s.classList.toggle('is-got', on); $('.stamp-face', s).setAttribute('aria-pressed', String(on)); });
    if (nEl) nEl.textContent = got.length;
    if (bar) bar.parentElement.style.setProperty('--pp', (got.length / stamps.length).toFixed(3));
  };
  stamps.forEach((s) => {
    $('.stamp-face', s).addEventListener('click', () => {
      const k = s.dataset.k, i = got.indexOf(k);
      if (i >= 0) got.splice(i, 1); else got.push(k);
      save(); paint();
      if (i < 0 && s.animate && M.motion) s.animate([{ transform: 'scale(1)' }, { transform: 'scale(.94)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
      if (i < 0) M.toast(got.length === stamps.length ? 'Все 13 кофеен! Настоящий исследователь ☕' : 'Отмечено: ' + $('b', s).textContent + ' · ' + got.length + ' из ' + stamps.length);
    });
  });
  paint();

  /* Nearest coffee shop */
  const near = $('#near-btn');
  if (near) {
    const rad = (d) => d * Math.PI / 180;
    const km = (a, b, c, d) => 12742 * Math.asin(Math.sqrt(Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2));
    near.addEventListener('click', () => {
      if (!navigator.geolocation) { M.toast('Браузер не умеет определять местоположение'); return; }
      near.classList.add('is-busy');
      navigator.geolocation.getCurrentPosition((pos) => {
        near.classList.remove('is-busy');
        const { latitude: la, longitude: lo } = pos.coords;
        const list = stamps.map((el) => ({ el, d: km(la, lo, +el.dataset.lat, +el.dataset.lon) }));
        list.forEach(({ el, d }) => { el.classList.remove('is-near'); $('.stamp-dist', el).textContent = '· ' + (d < 1 ? Math.round(d * 1000) + ' м' : d.toFixed(1).replace('.', ',') + ' км'); });
        const best = list.slice().sort((a, b) => a.d - b.d)[0];
        best.el.classList.add('is-near');
        const name = $('b', best.el).textContent;
        M.toast(best.d > 40 ? 'Вы далеко от Астаны — ближайшая кофейня: ' + name : 'Ближе всего — ' + name + ', ' + $('.stamp-dist', best.el).textContent.replace('· ', ''));
        if (M.scrollTo) M.scrollTo(best.el, -140);
      }, () => {
        near.classList.remove('is-busy');
        M.toast('Не получилось определить местоположение');
      }, { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 });
    });
  }
})();

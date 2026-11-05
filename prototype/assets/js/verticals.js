/* Aqlios vertical level (Figma 5704:43699 › Dashboard Selection). Vertical Admins and Super Admins land on the vertical picker,
   open Private Business (tiles or list), then pick a business to enter its usual dashboard. Public Primary Care and
   EveryClinic aren't part of this prototype yet. */
(function () {
  const { esc, acts } = App;
  const SPRITE = { adhd: [85, 68, 207, 64], euk: [456, 68, 259, 64], autism: [878, 50, 209, 99], leafease: [1267, 81, 225, 38], weightfall: [50, 266, 292, 101], aero: [447, 287, 276, 58],
    minor: [889, 288, 186, 56], thera: [1247, 288, 264, 57], cardiac: [50, 510, 272, 43], neuro: [461, 493, 237, 78], orthology: [893, 498, 161, 69] };
  App.BIZ = [['adhd', 'ADHD Certify'], ['euk', 'eUK Doctor'], ['autism', 'Autism Detect'], ['leafease', 'LeafEase'], ['weightfall', 'Weightfall'], ['aero', 'aeroclinical'],
    ['minor', 'Minor Operations'], ['thera', 'Therachange'], ['cardiac', 'Cardiac Care'], ['neuro', 'Neuro Clinician'], ['orthology', 'Orthology']]
    .map(([id, name]) => ({ id, name, logo: id, ws: name.toLowerCase().replace(/[^a-z0-9]/g, '') }));
  // Business Management details (vertical-business.js); two archived ones that aren't in the hub
  const MGR = { adhd: ['Michael Smith', 42, '2024-11-30', 'support@adhdcertify.com'], euk: ['Isabella White', 15, '2024-08-22'], autism: ['Liam Anderson', 15, '2024-08-22'], leafease: ['Olivia Taylor', 15, '2024-08-22'], weightfall: ['Noah Jackson', 15, '2024-08-22'],
    aero: ['Emily Johnson', 15, '2024-08-22'], minor: ['Ava Thomas', 15, '2024-08-22'], thera: ['James Wilson', 15, '2024-08-22'], cardiac: ['Sophia Brown', 29, '2025-01-10'], neuro: ['Daniel Clarke', 18, '2025-02-14'], orthology: ['Grace Hall', 9, '2025-03-03'] };
  App.BIZ.forEach(b => { const [mgr, users, added, email] = MGR[b.id]; Object.assign(b, { mgr, users, added, email: email || `contact@${b.ws}.com`, complete: b.id !== 'euk', at: added + 'T09:30' }); });
  App.BIZ.push({ id: 'fdc', name: 'Family Dental Care', ws: 'familydentalcare', mgr: 'Michael Smith', users: 42, added: '2024-11-30', email: 'support@familydentalcare.com', archived: { why: 'The business is no longer operational.', at: '2026-09-12' }, complete: true },
    { id: 'bso', name: 'Bright Smiles Ortho', ws: 'brightsmilesortho', mgr: 'Ava Thomas', users: 15, added: '2024-08-22', email: 'contact@brightsmilesortho.com', archived: { why: 'We’ve merged with another business.', at: '2026-10-02' }, complete: true });
  // Demo businesses for the logo edge cases: none uploaded, tiny low-res file, extreme banner, dark square badge, broken file
  const demoImg = (w, h, draw) => { try { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c.toDataURL('image/png'); } catch (e) { return null; } };
  const tiny = demoImg(46, 18, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#C0392B'; x.font = 'bold 13px Arial'; x.fillText('PCC', 2, 14); x.fillStyle = '#2D6CB4'; x.fillRect(32, 4, 10, 10); });
  const banner = demoImg(960, 48, (x, w, h) => { x.fillStyle = '#5B2C83'; x.font = '600 34px Arial'; x.fillText('HARBOURSIDE  DERMATOLOGY  &  AESTHETICS  CLINIC', 6, 36); });
  const badge = demoImg(220, 220, (x, w, h) => { x.fillStyle = '#16324F'; x.fillRect(0, 0, w, h); x.strokeStyle = '#F2C14E'; x.lineWidth = 8; x.beginPath(); x.arc(110, 92, 52, 0, 7); x.stroke(); x.fillStyle = '#fff'; x.font = 'bold 30px Arial'; x.textAlign = 'center'; x.fillText('NORTH', 110, 176); x.font = '16px Arial'; x.fillText('SPORTS MEDICINE', 110, 200); });
  [['riverside', 'Riverside Physio', null, 'Hannah Okafor'], ['pcc', 'Penrose Care Clinic', tiny, 'Daniel Ross'], ['harbour', 'Harbourside Dermatology', banner, 'Amira Khan'], ['north', 'North Sports Medicine', badge, 'Leo Grant'], ['bright', 'Brightwell Health', 'data:image/png;base64,broken', 'Priya Shah']]
    .forEach(([id, name, img, mgr]) => App.BIZ.splice(App.BIZ.findIndex(b => b.archived), 0, { id, name, img, ws: id, mgr, users: 6, added: '2026-09-01', email: `hello@${id}.co.uk`, complete: true, at: '2026-09-01T09:30' }));
  const byId = id => App.BIZ.find(b => b.id === id);
  App.bizId = byId(App.store.get('aqlios-biz')) ? App.store.get('aqlios-biz') : null;
  App.biz = () => byId(App.bizId) || byId('leafease');
  const setBiz = id => { App.bizId = id; App.store.set('aqlios-biz', id); };
  const signIn = App.signIn; App.signIn = role => { setBiz(null); signIn(role); };

  // sprite crop, scaled to fit (never upscaled); uploaded logo or initials for businesses without one
  const logo = (key, mw, mh, cls = '') => { const b = byId(key);
    if (b.img) return `<img class="aq-logo-img ${cls}" src="${b.img}" alt="${esc(b.name)} logo" data-mw="${mw}" data-mh="${mh}" data-name="${esc(b.name)}" style="max-width:${mw}px;max-height:${mh}px" onload="App.fitLogo(this)" onerror="App.logoFail(this)">`;
    if (!SPRITE[b.logo]) return mono(b.name, Math.min(mh, 64), cls);
    const [x, y, w, h] = SPRITE[b.logo], k = Math.min(mw / w, mh / h, 1);
    return `<span class="aq-logo ${cls}" role="img" aria-label="${esc(b.name)} logo" style="width:${Math.round(w * k)}px;height:${Math.round(h * k)}px;background-position:${-x * k}px ${-y * k}px;background-size:${1568 * k}px ${632 * k}px"></span>`; };
  /* Monogram for businesses without a usable logo: initials on a tint picked from the name, so tiles stay distinct. */
  const TINTS = [['#E8F2F2', '#1F5D5E'], ['#E8F0FB', '#2457A0'], ['#F7EEE3', '#8A4F0E'], ['#F3EAF5', '#6E3784'], ['#EAF4EC', '#2B643A'], ['#EEF0F3', '#3E4D63']];
  const mono = (name, s, cls = '') => { const [bg, fg] = TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length]; return `<span class="aq-mono ${cls}" aria-hidden="true" style="--s:${s}px;background:${bg};color:${fg}">${esc(App.initials(name))}</span>`; };
  App.bizMono = mono;
  /* Fit an uploaded logo by its real pixels: never upscale (blurry), box extremes by shape, plate solid backgrounds, flag low resolution. */
  App.fitLogo = img => { const w = img.naturalWidth, h = img.naturalHeight, mw = +img.dataset.mw, mh = +img.dataset.mh, r = w / h, t = img.closest('.aq-tile, .aq-rl');
    if (!w || !h) return App.logoFail(img);
    const shape = r > 6 ? 'banner' : r > 1.6 ? 'wide' : r < .75 ? 'tall' : 'square';
    // square / tall marks read larger than wordmarks at the same height, so give them a smaller box
    const boxW = shape === 'square' ? Math.min(mw, mh * 1.15) : shape === 'tall' ? mh * .8 : mw, boxH = shape === 'banner' ? Math.min(mh, 40) : shape === 'square' ? mh * 1.1 : mh;
    const small = w < 120 && h < 120, k = Math.min(boxW / w, boxH / h, small ? 1.5 : 1); img.style.width = Math.round(w * k) + 'px'; img.style.height = Math.round(h * k) + 'px'; img.style.maxWidth = img.style.maxHeight = 'none'; img.dataset.shape = shape;
    const low = small || (k >= 1 && (w < mw * .45 && h < mh * .45));
    if (h * k < 16 && t && t.classList.contains('aq-tile')) { const name = img.dataset.name; App.logoFail(img); t.insertAdjacentHTML('beforeend', '<span class="lo-flag" title="The uploaded logo is too wide to read at tile size. Upload a stacked or square version in Business Management.">Logo too wide to show</span>'); return; }
    if (t) { t.classList.toggle('lo-low', low); t.dataset.shape = shape;
      try { const c = document.createElement('canvas'); c.width = c.height = 4; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1); const [R, G, B, A] = x.getImageData(0, 0, 1, 1).data;
        if (A > 200 && R + G + B < 690) { t.style.setProperty('--plate', `rgb(${R},${G},${B})`); t.classList.add('lo-plate'); } } catch (e) {}
      if (low && !t.querySelector('.lo-flag') && t.classList.contains('aq-tile')) t.insertAdjacentHTML('beforeend', '<span class="lo-flag" title="Low-resolution logo. Upload a sharper one in Business Management.">Low-res logo</span>'); } };
  App.logoFail = img => { const s = Math.min(+img.dataset.mh || 56, 64); img.outerHTML = mono(img.dataset.name || '?', s); };
  App.bizLogo = () => { const b = App.biz(); return b.id === 'leafease' || !App.isVertical() ?  `<div class="logo" aria-label="LeafEase"><b>Leaf</b><span>Ease</span><i class="ri-leaf-line"></i></div>` : `<div class="logo biz">${logo(b.id, 200, 44)}</div>`; };

  /* Refined variant (floating panels on a soft canvas). Toggle lives bottom-right on vertical pages; choice is remembered. */
  const UIV = () => App.store.get('aqlios-ui') !== 'classic';
  const FLAT = () => App.store.get('aqlios-flat') !== '0';
  const uiToggle = () => `<div class="ui-switch" role="group" aria-label="Interface style"><span>Interface</span>${[['classic', 'Classic'], ['refined', 'Refined']].map(([k, t]) => `<button data-act="ui-style" data-v="${k}" aria-pressed="${(k === 'refined') === UIV()}">${t}</button>`).join('')}${UIV() && /^#\/private\/?(\?.*)?$/.test(location.hash) ? `<i class="ui-sep"></i><span>Layout</span>${[['0', 'Panel'], ['1', 'Open']].map(([k, t]) => `<button data-act="ui-flat" data-v="${k}" aria-pressed="${(k === '1') === FLAT()}">${t}</button>`).join('')}` : ''}</div>`;
  acts['ui-flat'] = el => { App.store.set('aqlios-flat', el.dataset.v); App.render(); };
  acts['ui-style'] = el => { App.store.set('aqlios-ui', el.dataset.v); App.render(); App.snack(el.dataset.v === 'refined' ? 'Showing the refined interface.' : 'Showing the classic interface.', 'info'); };
  const recent = () => (App.store.get('aqlios-recent') || '').split(',').filter(id => byId(id) && !byId(id).archived);
  const aqMark = sub => `<span class="aq-brand"><span class="aq-word">aql<b>i</b>os</span>${sub ? `<span class="aq-sub">${sub}</span>` : ''}</span>`;
  const head = left => { const me = App.me(); return `<header class="aq-top">${left}<div class="aq-top-r"><button class="aq-ic" data-act="soon" data-what="Notifications" aria-label="Notifications, 1 unread"><i class="ri-notification-3-line"></i><span class="dot"></span></button>
    <button class="aq-user" data-act="user-menu" data-menu-anchor aria-haspopup="menu"><span class="av">${me.ini}</span><span class="cell2"><b>${esc(me.name)}</b><small>${esc(me.label)}</small></span><i class="ri-arrow-down-s-line"></i></button></div></header>`; };
  const foot = '<footer class="aq-foot">Copyright © 2026 Aqlios. All rights reserved.</footer>';

  /* ---------- 1. vertical picker ---------- */
  const VERTS = [['public', 'Public<br>Primary Care', 'ri-hospital-line'], ['private', 'Private<br>Business', 'ri-briefcase-4-line'], ['everyclinic', 'EveryClinic<br>Business', 'ri-stethoscope-line']];
  const VDESC = { public: 'NHS practices and primary care networks', private: () => `${live().length} independent clinics and services`, everyclinic: 'Partner clinics on the EveryClinic network' };
  const pickV2 = () => { const me = App.me();
    return `<div class="aq v2 v2-pick"><section class="v2-stage">${v2Top('')}
      <div class="v2-welcome"><h1>Welcome back, ${esc(me.first || me.name.split(' ')[0])}</h1><p>Choose where you want to work today.</p>
        <div class="v2-verts">${VERTS.map(([k, t, i]) => { const on = k === 'private', d = VDESC[k]; return `<button class="v2-vert ${on ? '' : 'soon'}" data-act="aq-vert" data-v="${k}"><span class="v2-vic ${k}"><i class="${i}"></i></span><b>${t.replace('<br>', ' ')}</b><span>${typeof d === 'function' ? d() : d}</span>${on ? '' : '<em>Coming soon</em>'}</button>`; }).join('')}</div>
        <div class="v2-jump"><label class="v2-jbox"><i class="ri-search-line"></i><input id="v2-jq" data-in="v2-jq" placeholder="Jump straight to a business…" autocomplete="off" aria-label="Jump to a business" aria-controls="v2-jr"><kbd>/</kbd></label>
          <ul class="v2-jr" id="v2-jr" role="listbox" hidden></ul>
          <div class="v2-jfoot"><span>Search ${live().length} private businesses by name</span>${recent().length ? `<span class="v2-jrec">Recent: ${recent().slice(0, 3).map(id => `<a href="#/private/go/${id}">${esc(byId(id).name)}</a>`).join('')}</span>` : ''}</div></div></div></section>${uiToggle()}</div>`; };
  const jumpList = q => live().filter(b => b.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  App.ins['v2-jq'] = el => { const r = App.$('#v2-jr'), q = el.value.trim(); if (!q) { r.hidden = true; return; } const L = jumpList(q);
    r.innerHTML = L.length ? L.map((b, i) => `<li role="option" ${i === 0 ? 'aria-selected="true"' : ''}><a href="#/private/go/${b.id}"><span class="aq-mono" style="--s:28px">${esc(App.initials(b.name))}</span><b>${esc(b.name)}</b><small>${esc(b.mgr)}</small><i class="ri-corner-down-left-line"></i></a></li>`).join('') : `<li class="v2-jnone">No business called “${esc(q)}”. Try part of the name.</li>`; r.hidden = false; };
  document.addEventListener('keydown', e => { const i = App.$('#v2-jq'); if (!i) return;
    if (e.key === '/' && document.activeElement !== i && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); i.focus(); return; }
    if (document.activeElement !== i) return; const opts = [...App.$$('#v2-jr [role=option]')], k = opts.findIndex(o => o.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!opts.length) return; opts.forEach(o => o.removeAttribute('aria-selected')); opts[(k + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length].setAttribute('aria-selected', 'true'); }
    if (e.key === 'Enter' && opts[k]) { e.preventDefault(); App.go(opts[k].querySelector('a').getAttribute('href')); }
    if (e.key === 'Escape') { i.value = ''; App.$('#v2-jr').hidden = true; } });
  App.route('/verticals', () => UIV() ? pickV2() : `<div class="aq">${head(`<a class="aq-home" href="#/verticals" aria-label="Aqlios home">${aqMark()}</a>`)}
    <main class="aq-pick"><h1>Welcome back <b>${esc(App.me().name)}</b> <span aria-hidden="true">👋🏻</span></h1><p>Select your business to continue!</p>
      <div class="aq-verts">${VERTS.map(([k, t, i]) => `<button class="aq-vert" data-act="aq-vert" data-v="${k}"><span class="aq-vic"><i class="${i}"></i></span><b>${t}</b>${k === 'private' ? `<small>${live().length} businesses</small>` : '<small>Not in this prototype</small>'}<i class="ri-arrow-right-up-line aq-go" aria-hidden="true"></i></button>`).join('')}</div></main>${foot}${uiToggle()}</div>`,
    { key: 'portal', portal: true, icon: 'ri-apps-line', title: 'Select a vertical' });
  acts['aq-vert'] = el => el.dataset.v === 'private' ? App.go('#/private') : App.snack(`${el.textContent.trim().replace(/\s*(Not in this prototype|\d+ businesses)$/, '').replace(/\s+/g, ' ')} isn’t part of this prototype yet.`, 'info');

  /* ---------- 2. Private Business vertical ---------- */
  const SIDE = [['Main Menu', [['Private Business', 'ri-dashboard-line', ''], ['Business Management', 'ri-building-4-line', 'business-management'], ['Roles & Permissions', 'ri-shield-user-line', 'roles'], ['ROTA Management', 'ri-calendar-schedule-line', 'rota'], ['Leave Management', 'ri-login-box-line', 'leave'], ['Overtime Reports', 'ri-file-chart-line', 'overtime']]],
    ['Account', [['Notifications', 'ri-notification-3-line', 'notifications'], ['Templates Library', 'ri-layout-2-line', 'templates'], ['Settings', 'ri-settings-3-line', 'settings']]], ['Support', [['System Feed', 'ri-customer-service-2-line', 'feed']]]];
  const V = App.ui.aq || (App.ui.aq = { view: 'grid', page: 1, per: 10, q: '' });
  // Production navigation (Overview / Hub / Support). Leave and Overtime reports are prototype extras built from the Figma flows.
  const SIDE2 = [['Overview', [['Dashboard', 'ri-dashboard-line', '']]],
    ['Hub', [['Business Management', 'ri-user-add-line', 'business-management'], ['Template Library', 'ri-file-list-2-line', 'templates'], ['Role and Permissions', 'ri-lock-2-line', 'roles'], ['ROTA Management', 'ri-calendar-schedule-line', 'rota'], ['Leave Management', 'ri-login-box-line', 'leave'], ['Overtime Reports', 'ri-file-chart-line', 'overtime']], true],
    ['Support', [['System Feed', 'ri-customer-service-2-line', 'feed']], true]];
  const grpOpen = g => App.store.get('aqlios-grp-' + g) !== '0';
  acts['v2-grp'] = el => { const g = el.dataset.g; App.store.set('aqlios-grp-' + g, grpOpen(g) ? '0' : '1'); App.render(); App.$(`[data-act="v2-grp"][data-g="${g}"]`)?.focus(); };
  /* Refined shell: the original top bar (Back to Verticals · aqlios | Private Business · bell + user) as a floating pill, over the collapsible sidebar and main panel. */
  const v2Top = sub => { const me = App.me(); return `<header class="v2-top">${sub ? '<a class="v2-backpill" href="#/verticals"><i class="ri-arrow-left-s-line"></i><span>Back to Verticals</span></a>' : `<a class="v2-center" href="#/verticals" aria-label="Aqlios home">${aqMark()}</a>`}
    ${sub ? `<div class="v2-gs"><label class="v2-gbox"><i class="ri-search-line"></i><input id="v2-gq" data-in="v2-gq" placeholder="Search businesses, people and pages" autocomplete="off" aria-label="Search everything" aria-controls="v2-gr"><kbd>⌘K</kbd></label><div class="v2-gr" id="v2-gr" role="listbox" hidden></div></div>` : '<span></span>'}
    <div class="v2-top-r"><button class="v2-ic" data-act="soon" data-what="Notifications" aria-label="Notifications, 1 unread"><i class="ri-notification-3-line"></i><span class="dot"></span></button><button class="v2-chip" data-act="v2-user" data-menu-anchor aria-haspopup="menu"><img class="v2-av v2-avimg" src="images/avatar-doctor.png" alt="" width="44" height="44"><span class="cell2"><b>${esc(me.name)}</b><small>${esc(me.label)}</small></span><i class="ri-arrow-down-s-line"></i></button></div></header>`; };
  /* Global search: businesses, pages and people across the Private vertical. */
  const PAGES = () => [...SIDE2.flatMap(g => g[1]), ['Notifications', 'ri-notification-3-line', 'notifications'], ['Settings', 'ri-settings-3-line', 'settings']].map(([t, i, k]) => ({ t, i, h: '#/private' + (k ? '/' + k : '') }));
  const gsearch = q => { q = q.toLowerCase(); const m = x => x.toLowerCase().includes(q), users = App.S.vUsers || [], roles = App.RP ? App.RP.ROLES : [];
    return [['Businesses', live().filter(b => m(b.name) || m(b.mgr || '')).slice(0, 4).map(b => ({ t: b.name, sub: b.mgr ? 'Manager: ' + b.mgr : '', h: '#/private/go/' + b.id, ic: `<span class="aq-mono" style="--s:26px">${esc(App.initials(b.name))}</span>` }))],
      ['People', users.filter(u => m(u.name) || m(u.email)).slice(0, 3).map(u => { const rid = Object.values(u.biz)[0][0]; return { t: u.name, sub: u.email, h: `#/private/roles/${rid}/users/${u.id}`, ic: `<span class="v2-av sm">${esc(App.initials(u.name))}</span>` }; })],
      ['Roles', roles.filter(r => m(r.name)).slice(0, 3).map(r => ({ t: r.name, sub: 'Role', h: '#/private/roles/' + r.id, ic: '<i class="ri-shield-user-line"></i>' }))],
      ['Pages', PAGES().filter(p => m(p.t)).slice(0, 4).map(p => ({ t: p.t, sub: 'Go to page', h: p.h, ic: `<i class="${p.i}"></i>` }))]].filter(g => g[1].length); };
  App.ins['v2-gq'] = el => { const r = App.$('#v2-gr'), q = el.value.trim(); if (!q) { r.hidden = true; return; } const G = gsearch(q); let n = 0;
    r.innerHTML = G.length ? G.map(([g, items]) => `<div class="v2-gg"><span>${g}</span>${items.map(x => `<a role="option" href="${x.h}" ${n++ === 0 ? 'aria-selected="true"' : ''}>${x.ic}<b>${esc(x.t)}</b><small>${esc(x.sub)}</small></a>`).join('')}</div>`).join('') : `<p class="v2-jnone">Nothing matches “${esc(q)}”. Try a business, person, role or page name.</p>`; r.hidden = false; };
  document.addEventListener('keydown', e => { const i = App.$('#v2-gq'); if (!i) return;
    if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName))) { e.preventDefault(); i.focus(); i.select(); return; }
    if (document.activeElement !== i) return; const opts = [...App.$$('#v2-gr [role=option]')], k = opts.findIndex(o => o.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!opts.length) return; opts.forEach(o => o.removeAttribute('aria-selected')); const nx = opts[(k + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length]; nx.setAttribute('aria-selected', 'true'); nx.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter' && opts[k]) { e.preventDefault(); App.go(opts[k].getAttribute('href')); }
    if (e.key === 'Escape') { i.value = ''; App.$('#v2-gr').hidden = true; i.blur(); } });
  document.addEventListener('mousedown', e => { const r = App.$('#v2-gr'); if (r && !e.target.closest('.v2-gs')) r.hidden = true; });
  const frameV2 = (cur, body, crumbs) => { if (crumbs && crumbs.length > 1) { const last = esc(crumbs[crumbs.length - 1][0]); body = body.replace(`<div class="grow"><h1>`, '<div class="grow aq-ttl"><h1>').replace(new RegExp(`(<div class="grow aq-ttl"><h1>[^<]*</h1>)<span>${last.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</span>`), '$1'); } const mini = App.store.get('aqlios-side') === 'mini', tip = t => mini ? `data-tip="${esc(t)}" aria-label="${esc(t)}"` : '', si = ([t, i, k]) => `<a class="v2-si ${k === cur ? 'on' : ''}" href="#/private${k ? '/' + k : ''}" ${k === cur ? 'aria-current="page"' : ''} ${tip(t)}><i class="${i}"></i><span>${t}</span></a>`, rc = recent();
    return `<div class="aq v2 v2-shell ${mini ? 'mini' : ''}">${v2Top(true)}<aside class="v2-side" aria-label="Private Business menu"><div class="v2-brand">${mini ? '' : `<a class="v2-mark v2-sidelogo" href="#/private" aria-label="Aqlios Private Business">${aqMark('Private<br>Business')}</a>`}<span class="grow"></span><button class="v2-ic sm v2-collapse" data-act="v2-side" aria-label="${mini ? 'Expand sidebar' : 'Collapse sidebar'}" aria-expanded="${!mini}" ${tip(mini ? 'Expand sidebar' : '')}><i class="${mini ? 'ri-sidebar-unfold-line' : 'ri-sidebar-fold-line'}"></i></button></div>
      <nav class="v2-nav">${SIDE2.map(([g, its, col]) => { const open = !col || mini || grpOpen(g) || its.some(x => x[2] === cur); return `<div class="v2-grp">${col ? `<button class="v2-gh v2-ghb" data-act="v2-grp" data-g="${g}" aria-expanded="${open}"><span>${g}</span><i class="${open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i></button>` : `<span class="v2-gh">${g}</span>`}${open ? its.map(si).join('') : ''}</div>`; }).join('')}
        ${rc.length ? `<div class="v2-grp"><span class="v2-gh">Recent businesses</span>${rc.slice(0, 3).map(id => `<a class="v2-si v2-rec" href="#/private/go/${id}" ${tip(byId(id).name)}><span class="aq-mono" style="--s:22px">${esc(App.initials(byId(id).name))}</span><span>${esc(byId(id).name)}</span><i class="ri-arrow-right-up-line"></i></a>`).join('')}</div>` : ''}</nav>
      <div class="v2-foot">${si(['Notifications', 'ri-notification-3-line', 'notifications'])}${si(['Settings', 'ri-settings-3-line', 'settings'])}<button class="v2-si v2-out" data-act="v2-out" ${tip('Sign out')}><i class="ri-logout-box-r-line"></i><span>Sign out</span></button></div></aside>
      <main class="v2-main ${cur === "" && FLAT() ? "v2-flat" : ""}">${crumbs && crumbs.length > 1 ? `<nav class="aq-crumbs" aria-label="Breadcrumb">${crumbs.map(([t, h], i) => i < crumbs.length - 1 ? `<a href="${h}">${esc(t)}</a><i class="ri-arrow-right-s-line"></i>` : `<span aria-current="page">${esc(t)}</span>`).join('')}</nav>` : ''}${body}</main>${uiToggle()}</div>`; };
  /* Account menu: who you are, where you're working, a few quick links, then sign out on its own. */
  acts['v2-user'] = el => { const me = App.me();
    const m = App.menu(el, `<div class="acct"><div class="acct-me"><img src="images/avatar-doctor.png" alt="" width="48" height="48"><div class="grow"><b>${esc(me.name)}</b><small>${esc(me.email)}</small><span class="acct-role">${esc(me.label)}</span></div></div>
      <div class="acct-sec"><span class="acct-h">Working in</span>${VERTS.map(([k, t, i]) => { const cur = k === 'private'; return `<button role="menuitemradio" aria-checked="${cur}" data-pick="vert:${k}" class="acct-v ${cur ? 'on' : ''}"><span class="acct-vi ${k}"><i class="${i}"></i></span><span class="grow"><b>${t.replace('<br>', ' ')}</b><small>${cur ? `${live().length} businesses` : 'Coming soon'}</small></span>${cur ? '<i class="ri-check-line acct-ck"></i>' : ''}</button>`; }).join('')}
        <button data-pick="all" class="acct-link"><i class="ri-apps-2-line"></i>All verticals</button></div>
      <div class="acct-sec">${[['settings', 'ri-settings-3-line', 'Settings'], ['notifications', 'ri-notification-3-line', 'Notifications'], ['feed', 'ri-question-line', 'Help & system feed']].map(([k, i, t]) => `<button data-pick="go:${k}" class="acct-item"><i class="${i}"></i><span class="grow">${t}</span><i class="ri-arrow-right-s-line acct-chev"></i></button>`).join('')}</div>
      <div class="acct-foot"><button data-pick="role" class="acct-demo"><i class="ri-flask-line"></i>Demo role</button><button data-pick="out" class="acct-out"><i class="ri-logout-box-r-line"></i>Sign out</button></div></div>`,
      v => { if (v === 'out') return App.signOut(); if (v === 'role') return App.go('#/login'); if (v === 'all') return App.go('#/verticals'); if (v.startsWith('go:')) return App.go('#/private/' + v.slice(3));
        const k = v.slice(5); if (k === 'private') return App.go('#/private'); App.snack(`${VERTS.find(x => x[0] === k)[1].replace('<br>', ' ')} isn’t part of this prototype yet.`, 'info'); }, { width: 300 });
    m.classList.add('acct-menu'); };
  acts['v2-out'] = () => App.signOut();
  acts['v2-side'] = () => { App.store.set('aqlios-side', App.store.get('aqlios-side') === 'mini' ? 'full' : 'mini'); App.render(); App.$('.v2-collapse')?.focus(); };
  // collapsed-rail tooltips
  document.addEventListener('mouseover', e => { const t = e.target.closest?.('.aq.v2.mini [data-tip]'); let tip = App.$('.v2-tip'); if (!t) { if (tip) tip.hidden = true; return; } if (!tip) { tip = document.createElement('div'); tip.className = 'v2-tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); } const r = t.getBoundingClientRect(); tip.textContent = t.dataset.tip; tip.hidden = false; tip.style.top = (r.top + r.height / 2) + 'px'; tip.style.left = (r.right + 12) + 'px'; });
  window.addEventListener('hashchange', () => { const t = App.$('.v2-tip'); if (t) t.hidden = true; });
  const frame = (cur, body, crumbs) => UIV() ? frameV2(cur, body, crumbs) : `<div class="aq">${head(`<a class="btn outlined sm aq-back" href="#/verticals"><i class="ri-arrow-left-s-line"></i>Back to Verticals</a><a class="aq-mid" href="#/private" aria-label="Aqlios Private Business">${aqMark('Private<br>Business')}</a>`)}
    <div class="aq-body"><nav class="aq-side" aria-label="Private Business menu">${SIDE.map(([g, its]) => `<div class="aq-sh">${g}</div>${its.map(([t, i, k]) => `<a class="aq-si ${k === cur ? 'on' : ''}" href="#/private${k ? '/' + k : ''}" ${k === cur ? 'aria-current="page"' : ''}><i class="${i}"></i>${t}</a>`).join('')}`).join('')}</nav>
      <div class="aq-col">${crumbs ? `<nav class="aq-crumbs" aria-label="Breadcrumb">${crumbs.map(([t, h], i) => i < crumbs.length - 1 ? `<a href="${h}">${esc(t)}</a><span>/</span>` : `<span aria-current="page">${esc(t)}</span>`).join('')}</nav>` : ''}<section class="aq-main">${body}</section></div></div>${foot}${uiToggle()}</div>`;
  const live = () => App.BIZ.filter(b => !b.archived);
  /* Details tiles: the few things a vertical admin checks before opening a business. Patients and locations are demo figures. */
  const TD = () => App.store.get('aqlios-tiles') === 'detail';
  const seed = n => [...n].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  const kfmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);
  const detTile = b => { const h = seed(b.name), staff = b.users || 0, pats = staff ? Math.round(staff * (18 + h % 40)) : 0, locs = 1 + h % 4, slaEnd = b.sla && b.sla.end, soon = slaEnd && slaEnd < '2027-02-01';
    const st = !b.complete ? ['warn', 'ri-error-warning-line', 'Profile incomplete'] : soon ? ['warn', 'ri-time-line', 'SLA renews ' + new Date(slaEnd).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })] : ['ok', 'ri-checkbox-circle-line', 'Active'];
    return `<a class="aq-tile det" href="#/private/go/${b.id}" title="Open ${esc(b.name)}"><span class="det-stage">${logo(b.id, 170, 48)}</span>
      <span class="det-body"><span class="det-h"><b>${esc(b.name)}</b><span class="det-st ${st[0]}"><i class="${st[1]}"></i>${st[2]}</span></span>
        <span class="det-kpis">${[['Staff', staff], ['Patients', pats], ['Locations', locs]].map(([l, v]) => `<span><b>${v ? kfmt(v) : '—'}</b><small>${l}</small></span>`).join('')}</span></span>
      <i class="ri-arrow-right-up-line aq-go" aria-hidden="true"></i></a>`; };
  const list = () => live().filter(b => !V.q || b.name.toLowerCase().includes(V.q.toLowerCase()));
  App.route('/private', () => { const L = list(), pages = Math.max(1, Math.ceil(L.length / V.per)); V.page = Math.min(V.page, pages); const rows = L.slice((V.page - 1) * V.per, V.page * V.per);
    const body = V.view === 'grid'
      ? (UIV() && TD() ? `<div class="aq-tiles det">${L.map(detTile).join('')}</div>` : `<div class="aq-tiles">${L.map(b => `<a class="aq-tile" href="#/private/go/${b.id}" title="Open ${esc(b.name)}">${logo(b.id, 190, 60)}<span class="aq-tname">${esc(b.name)}</span><i class="ri-arrow-right-up-line aq-go" aria-hidden="true"></i></a>`).join('')}</div>`)
      : `<div class="aq-rows">${rows.map(b => `<div class="aq-row" data-go="#/private/go/${b.id}"><span class="aq-rl">${logo(b.id, 150, 40)}</span><span class="aq-rn">${esc(b.name)}</span><a class="btn outlined sm pt-dark" href="#/private/go/${b.id}">Go to Dashboard<i class="ri-arrow-right-s-line"></i></a></div>`).join('')}</div>
        <div class="aq-pager"><label>Rows per page: <select data-ch="aq-per">${[5, 10, 25].map(n => `<option ${n === V.per ? 'selected' : ''}>${n}</option>`).join('')}</select></label><span>${L.length ? (V.page - 1) * V.per + 1 : 0}–${Math.min(V.page * V.per, L.length)} of ${L.length}</span>
          <button class="icon-btn s20" data-act="aq-pg" data-d="-1" ${V.page === 1 ? 'disabled' : ''} aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></button><button class="icon-btn s20" data-act="aq-pg" data-d="1" ${V.page === pages ? 'disabled' : ''} aria-label="Next page"><i class="ri-arrow-right-s-line"></i></button></div>`;
    return frame('', `<div class="aq-mh"><span class="aq-hic"><i class="ri-dashboard-line"></i></span><div class="grow"><h1>Private Business</h1><span>Every business in the Private vertical. Open one to work inside it.</span></div>
      <button class="btn primary" data-act="soon" data-what="Onboard New Business"><i class="ri-add-circle-line"></i>Onboard New Business</button></div>
      <div class="aq-toolbar"><label class="aq-search"><i class="ri-search-line"></i><input type="search" placeholder="Filter businesses" value="${esc(V.q)}" data-in="aq-q" aria-label="Filter this list of businesses"></label><span class="grow"></span>
      ${UIV() && V.view === 'grid' ? `<div class="aq-seg aq-tseg" role="group" aria-label="Tile style">${[['simple', 'Simple'], ['detail', 'Details']].map(([k, t]) => `<button class="${(k === 'detail') === TD() ? 'on' : ''}" data-act="aq-td" data-v="${k}" aria-pressed="${(k === 'detail') === TD()}">${t}</button>`).join('')}</div>` : ''}
      <div class="aq-seg" role="group" aria-label="Layout"><button class="${V.view === 'list' ? 'on' : ''}" data-act="aq-view" data-v="list" aria-label="List view" aria-pressed="${V.view === 'list'}"><i class="ri-list-check"></i></button><button class="${V.view === 'grid' ? 'on' : ''}" data-act="aq-view" data-v="grid" aria-label="Tile view" aria-pressed="${V.view === 'grid'}"><i class="ri-layout-grid-line"></i></button></div></div>
      ${L.length ? body : `<div class="aq-empty"><i class="ri-search-line"></i><b>No businesses match “${esc(V.q)}”</b><button class="btn text sm brand" data-act="aq-clr">Clear search</button></div>`}`); },
    { key: 'portal', portal: true, icon: 'ri-briefcase-4-line', title: 'Private Business' });
  acts['aq-td'] = el => { App.store.set('aqlios-tiles', el.dataset.v); App.render(); };
  acts['aq-view'] = el => { V.view = el.dataset.v; App.render(); };
  acts['aq-pg'] = el => { V.page += +el.dataset.d; App.render(); };
  acts['aq-clr'] = () => { V.q = ''; App.render(); };
  App.chs['aq-per'] = el => { V.per = +el.value; V.page = 1; App.render(); };
  App.ins['aq-q'] = el => { V.q = el.value; V.page = 1; const pos = el.selectionStart; App.render(); const i = App.$('[data-in="aq-q"]'); i.focus(); i.setSelectionRange(pos, pos); };
  App.VH = { frame, logo, byId, setBiz, live };
  SIDE.flatMap(g => g[1]).filter(x => x[2] && !['business-management', 'templates', 'roles', 'overtime', 'settings'].includes(x[2])).forEach(([t, i, k]) => App.route('/private/' + k, () => frame(k, `<div class="aq-mh"><span class="aq-hic"><i class="${i}"></i></span><div class="grow"><h1>${t}</h1><span>Private Business vertical</span></div></div>
    <div class="aq-empty"><i class="${i}"></i><b>${t} isn’t built in this prototype yet</b><span>It’s designed in Figma under Vertical Admin Flows.</span><a class="btn outlined sm pt-dark" href="#/private">Back to Business List</a></div>`), { key: 'portal', portal: true, icon: i, title: t }));

  /* ---------- 3. enter a business ---------- */
  App.route('/private/go/:id', id => { const b = byId(id); if (b && !b.archived) { App.store.set('aqlios-recent', [id, ...recent().filter(x => x !== id)].slice(0, 5).join(',')); setBiz(id); App.nav.key = null; App.drawNav(); App.after(() => App.snack(`You’re now in ${b.name}.`)); } location.replace(b && !b.archived ? '#/dashboard' : '#/private'); return ''; },
    { key: 'portal', portal: true, icon: 'ri-loader-line', title: 'Opening business' });
  App.bizMenu = el => { const cur = App.biz();
    App.menu(el, `<div class="label">Private Business</div>${live().map(b => `<button data-pick="${b.id}" ${b.id === cur.id ? 'class="on"' : ''}><span>${esc(b.name)}</span>${b.id === cur.id ? '<i class="ri-check-line" style="margin-left:auto"></i>' : ''}</button>`).join('')}<hr>
      <button data-pick="list"><i class="ri-arrow-left-line"></i>All businesses</button><button data-pick="verticals"><i class="ri-apps-line"></i>Switch vertical</button><button data-pick="out"><i class="ri-logout-box-r-line"></i>Sign out</button>`,
      v => v === 'list' ? (setBiz(null), App.go('#/private')) : v === 'verticals' ? (setBiz(null), App.go('#/verticals')) : v === 'out' ? App.signOut() : v !== cur.id && App.go('#/private/go/' + v), { width: 260 }); };
})();

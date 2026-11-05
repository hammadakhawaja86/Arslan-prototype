/* Segments: list, empty state, builder with live count, detail, delete confirmation. */
(function () {
  const { S, esc, acts, ins, chs } = App;
  const SERVICES = ['Weight loss', 'Peptides', 'TRT', 'IV drip', 'e-Vault scan', 'Aesthetics'];
  const LOCS = ['All locations', 'East Midlands', 'West Midlands', 'London'];
  const SITES = ['All sites', 'Leicester', 'Nottingham', 'Derby'];
  const GENDERS = ['Any', 'Female', 'Male'];
  const SINCE = ['Any time', 'More than 1 month ago', 'More than 3 months ago', 'More than 6 months ago', 'More than 12 months ago'];
  const SAMPLE = ['Sarah Whitmore', 'Aisha Rahman', 'Tom Baker', 'Priya Anand', 'Megan Cole', 'Daniel Reeves', 'Hannah Wells', 'Owen Price', 'Rajesh Patel', 'Grace Turner'];
  const ls = App.ui.segList = { q: '', type: 'All' };

  /* ---------- live count model ---------- */
  const SVC = { 'Weight loss': .35, Peptides: .12, TRT: .16, 'IV drip': .24, 'e-Vault scan': .08, Aesthetics: .2 };
  const factor = f => {
    const site = { 'All sites': 1, Leicester: .5, Nottingham: .38, Derby: .22 }[f.site] ?? 1;
    const loc = f.location === 'All locations' ? 1 : .7;
    const g = { Any: 1, Female: .56, Male: .44 }[f.gender] ?? 1;
    const age = Math.sqrt(Math.max(1, f.ageMax - f.ageMin) / 82);
    const since = { 'Any time': 1, 'More than 1 month ago': .75, 'More than 3 months ago': .55, 'More than 6 months ago': .35, 'More than 12 months ago': .18 }[f.since] ?? 1;
    const svc = f.services.length ? Math.min(1, f.services.reduce((a, s) => a + SVC[s], 0)) : 1;
    return site * loc * g * Math.min(1, age) * since * svc;
  };
  const count = d => {
    const c = d.audience === 'Leads' ? 0 : Math.round(6110 * factor(d.cust));
    const l = d.audience === 'Customers' ? 0 : Math.round(2310 * factor(d.lead) * .55);
    return { c, l, total: Math.max(0, c + l - d.excluded.length) };
  };
  const applied = d => { const blocks = d.audience === 'All' ? [d.lead, d.cust] : [d.audience === 'Leads' ? d.lead : d.cust];
    let n = 0; blocks.forEach(b => { if (b.location !== 'All locations') n++; if (b.site !== 'All sites') n++; if (b.gender !== 'Any') n++; if (b.ageMin > 0 || b.ageMax < 100) n++; if (b.since !== 'Any time') n++; n += b.services.length ? 1 : 0; }); return n; };
  const typeOf = d => d.audience === 'All' ? 'Mixed' : d.audience;

  /* ---------- list ---------- */
  App.route('/segments', () => listPage(), { key: 'segments', icon: 'ri-group-line', title: 'Segments' });
  function listPage() {
    const segs = S.segments;
    const head = App.head([['CRM', '#/inbox'], ['Segments']], 'Segments', 'Build and reuse audiences from your patient base — filters stay live as your records change.',
      `<button class="btn outlined lg" data-act="seg-import"><i class="ri-upload-2-line"></i>Import list</button><button class="btn primary lg" data-go="#/segments/new"><i class="ri-add-circle-line"></i>New segment</button>`);
    const used = segs.filter(s => S.campaigns.some(c => c.segmentId === s.id)).length;
    const stats = `<div class="stats">
      <div class="stat"><span class="overline">Total contacts</span><span class="num tnum">${segs.length ? '8,420' : '0'}</span><span class="foot">Across all sites</span></div>
      <div class="stat"><span class="overline">Customers</span><span class="num tnum">${segs.length ? '6,110' : '0'}</span><span class="foot">&nbsp;</span></div>
      <div class="stat"><span class="overline">Leads</span><span class="num tnum">${segs.length ? '2,310' : '0'}</span><span class="foot">&nbsp;</span></div>
      <div class="stat"><span class="overline">Active segments</span><span class="num tnum">${segs.length}</span><span class="foot good">${segs.length ? `${used} used in campaigns` : 'Create your first one'}</span></div></div>`;
    if (!segs.length) return head + stats + `<div class="card" style="flex:1 1 0;display:grid;place-items:center"><div class="empty"><span class="ic"><i class="ri-group-line"></i></span><h2 class="h6">No segments yet</h2><p class="body2">A segment is a saved filter over your patient base. Build one once and reuse it across campaigns and automations, it stays up to date on its own.</p><div class="row g12"><button class="btn outlined" data-act="seg-import"><i class="ri-upload-2-line"></i>Import list</button><button class="btn primary" data-go="#/segments/new"><i class="ri-add-circle-line"></i>New segment</button></div></div></div>`;
    return head + stats + `<section class="card card-pad stack g16"><div class="row g12"><h2 class="h6">Saved segments</h2>${App.chip(segs.length + ' segments')}</div>
      <div class="filters">${App.field('Search', `<span class="adorn"><i class="ri-search-2-line"></i></span><input data-in="seg-q" value="${esc(ls.q)}" placeholder="Search by name…">`, { cls: 'search' })}
        ${App.select('Type', 'seg-type', ['All', 'Customers', 'Leads', 'Mixed'], ls.type)}
        ${App.field('Date created', `<input placeholder="DD/MM/YYYY – DD/MM/YYYY"><span class="adorn"><i class="ri-calendar-line"></i></span>`)}
        <button class="clear-btn" data-act="seg-clear"><i class="ri-close-line"></i>Clear filters</button></div>
      <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Segment name</th><th>Contacts</th><th>Type</th><th>Last used</th><th style="text-align:right">Action</th></tr></thead><tbody id="seg-rows">${rows()}</tbody></table></div>${App.pager(segs.length, segs.length)}</div></section>`;
  }
  function rows() {
    const list = S.segments.filter(s => (ls.type === 'All' || s.type === ls.type) && (!ls.q || s.name.toLowerCase().includes(ls.q.toLowerCase())));
    if (!list.length) return `<tr class="empty-row"><td colspan="5">No segments match your search or filters.</td></tr>`;
    return list.map(s => `<tr class="click" data-go="#/segments/${s.id}"><td><a href="#/segments/${s.id}" style="color:inherit;text-decoration:none">${esc(s.name)}</a></td><td class="tnum">${App.fmt(s.contacts)}</td><td>${App.chip(s.type, App.typeTone(s.type), 'sm filled')}</td><td>${esc(s.lastUsed)}</td>
      <td style="text-align:right"><span class="row-actions"><button class="btn outlined sm" data-act="seg-use" data-id="${s.id}">Use in campaign</button><button class="icon-btn s20" data-act="seg-edit" data-id="${s.id}" aria-label="Edit ${esc(s.name)}"><i class="ri-pencil-line"></i></button><button class="icon-btn s20 danger" data-act="seg-del" data-id="${s.id}" aria-label="Delete ${esc(s.name)}"><i class="ri-delete-bin-line"></i></button></span></td></tr>`).join('');
  }
  ins['seg-q'] = el => { ls.q = el.value; App.$('#seg-rows').innerHTML = rows(); };
  chs['seg-type'] = el => { ls.type = el.value; App.$('#seg-rows').innerHTML = rows(); };
  acts['seg-clear'] = () => { ls.q = ''; ls.type = 'All'; App.render(); };
  acts['seg-import'] = () => App.snack('CSV import is outside this prototype.', 'info');
  acts['seg-use'] = el => { App.ui.newCampaignSeg = el.dataset.id; App.go('#/campaigns/new'); };
  acts['seg-edit'] = el => App.go(`#/segments/${el.dataset.id}/edit`);

  /* ---------- builder ---------- */
  let d = null;
  const blank = () => ({ location: 'All locations', site: 'Leicester', gender: 'Any', ageMin: 18, ageMax: 65, window: '01/12/2025 - 01/12/2026', since: 'More than 3 months ago', services: ['Weight loss'] });
  App.route('/segments/new', () => { d = { id: null, name: '', audience: 'All', lead: blank(), cust: blank(), excluded: [], tried: false }; return builder(); }, { key: 'segments', icon: 'ri-group-line', title: 'Segments' });
  App.route('/segments/:id/edit', id => { const s = S.segments.find(x => x.id === id); if (!s) return notFound(); d = { id, name: s.name, audience: s.filters.audience, lead: JSON.parse(JSON.stringify(s.filters)), cust: JSON.parse(JSON.stringify(s.filters)), excluded: [], tried: false }; return builder(); }, { key: 'segments', icon: 'ri-group-line', title: 'Segments' });
  const notFound = () => `<div class="card"><div class="empty"><span class="ic grey"><i class="ri-error-warning-line"></i></span><h2 class="h6">Segment not found</h2><p>It may have been deleted.</p><button class="btn outlined" data-go="#/segments">Back to segments</button></div></div>`;

  const block = (key, title) => { const b = d[key]; const pct = v => v + '%';
    return `<section class="fblock" aria-label="${title} filters"><h3 class="sub2">${title}</h3><div class="fgrid">
      ${App.select('Location', 'b-loc', LOCS, b.location, { attrs: `data-k="${key}"` })}${App.select('Clinical site', 'b-site', SITES, b.site, { attrs: `data-k="${key}"` })}${App.select('Gender', 'b-gender', GENDERS, b.gender, { attrs: `data-k="${key}"` })}
      <div class="stack g4">${App.field('Age range', `<span class="age"><input data-in="b-age" data-k="${key}" data-w="min" type="number" min="0" max="100" value="${b.ageMin}" aria-label="Minimum age"> to <input data-in="b-age" data-k="${key}" data-w="max" type="number" min="0" max="100" value="${b.ageMax}" aria-label="Maximum age"> <span class="caption">years</span></span><button class="btn text brand sm" style="margin-left:auto" data-act="b-anyage" data-k="${key}">Any age</button>`)}
        <div class="range" data-range="${key}"><span class="rail"></span><span class="fill" style="left:${pct(b.ageMin)};right:${pct(100 - b.ageMax)}"></span><input type="range" min="0" max="100" value="${b.ageMin}" data-in="b-slide" data-k="${key}" data-w="min" aria-label="Minimum age"><input type="range" min="0" max="100" value="${b.ageMax}" data-in="b-slide" data-k="${key}" data-w="max" aria-label="Maximum age"></div><div class="row between caption"><span>0</span><span>100+</span></div></div>
      <div class="stack g4">${App.field('Activity window', `<input data-in="b-window" data-k="${key}" value="${esc(b.window)}"><span class="adorn"><i class="ri-calendar-line"></i></span>`)}<span class="caption" style="margin:0 14px">183 days · contacts with any activity in this window.</span></div>
      <div class="stack g4">${App.select('Time since last visit', 'b-since', SINCE, b.since, { attrs: `data-k="${key}"` })}<span class="caption" style="margin:0 14px">Measured from their most recent completed appointment.</span></div></div>
      <div class="stack g8"><span class="body2 muted">Service</span><div class="row g8 wrap" role="group" aria-label="Service">${SERVICES.map(s => `<button class="chip-btn ${b.services.includes(s) ? 'on' : ''}" aria-pressed="${b.services.includes(s)}" data-act="b-svc" data-k="${key}" data-v="${s}">${s}${b.services.includes(s) ? ' <i class="ri-close-line"></i>' : ''}</button>`).join('')}</div></div></section>`; };

  function builder() {
    const editing = !!d.id;
    return `${App.head([['CRM', '#/inbox'], ['Segments', '#/segments'], [editing ? d.name : 'New segment']], editing ? 'Edit segment' : 'Segment builder', 'Filter your patient base to build a targeted, reusable audience. The count updates as you change filters.',
      `<button class="btn outlined lg" data-go="${editing ? '#/segments/' + d.id : '#/segments'}">Cancel</button><button class="btn primary lg" data-act="seg-save"><i class="ri-save-3-line"></i>${editing ? 'Save changes' : 'Save segment'}</button>`, App.chip(editing ? 'Editing' : 'Draft', 't-grey', 'filled'))}
    <div class="builder"><section class="card" aria-label="Filters"><div class="card-head"><div class="row g8"><h2 class="sub2" style="font-size:16px">Filters</h2><span id="applied">${App.chip(applied(d) + ' applied', 't-blue', 'solid sm')}</span></div><button class="btn text brand sm" data-act="seg-clearall">Clear all</button></div>
      <div class="card-pad stack g16" id="builder-body">${builderBody()}</div></section>
      <aside class="stack g16" aria-label="Live count" id="live">${liveHTML()}</aside></div>
    <section class="card card-pad stack g16"><div class="row g12"><h2 class="h6">Audience preview</h2><span id="sample">${App.chip('sample of ' + App.fmt(count(d).total))}</span></div>
      <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Contact</th><th>Site</th><th>Service</th><th>Type</th><th>Last activity</th><th></th></tr></thead><tbody id="preview-rows">${previewRows()}</tbody></table></div>${App.pager(Math.min(10, count(d).total), count(d).total)}</div></section>`;
  }
  const builderBody = () => `
    <div class="stack g4">${App.field('Segment name', `<input data-in="seg-name" value="${esc(d.name)}" placeholder="e.g. Weight-loss – lapsed 3 months" autofocus>`, { req: true, cls: d.tried && !d.name.trim() ? 'err' : '' })}${d.tried && !d.name.trim() ? '<p class="helper err">Give the segment a name</p>' : ''}</div>
    <div class="stack g8"><span class="body2 muted">Audience</span><div class="seg grey" role="tablist" aria-label="Audience">${['All', 'Customers', 'Leads'].map(a => `<button role="tab" aria-selected="${d.audience === a}" class="${d.audience === a ? 'on' : ''}" data-act="seg-aud" data-v="${a}">${a}</button>`).join('')}</div></div>
    ${d.audience !== 'Customers' ? block('lead', 'Leads') : ''}${d.audience !== 'Leads' ? block('cust', 'Customers') : ''}`;
  function liveHTML() { const c = count(d); const email = Math.round(c.total * .93), sms = Math.round(c.total * .78);
    return `<div class="live" role="status" aria-live="polite"><div class="row g8" style="align-items:baseline"><span class="big tnum">${App.fmt(c.total)}</span><span class="body2 muted">contacts match</span><button class="icon-btn s20" style="margin-left:auto" data-act="seg-refresh" aria-label="Refresh count"><i class="ri-refresh-line"></i></button></div>
      <span class="caption">Updates live as you adjust filters · last refreshed just now</span><div class="row g8 wrap">${d.audience !== 'Leads' ? App.chip(App.fmt(c.c) + ' customers', 't-green', 'solid sm') : ''}${d.audience !== 'Customers' ? App.chip(App.fmt(c.l) + ' leads', 't-orange', 'solid sm') : ''}</div></div>
      <div class="card card-pad stack g16"><span class="overline" style="color:var(--text);font-weight:500">Reachable by</span>
      ${[['Email', email, 'opted in'], ['SMS', sms, 'opted in']].map(([k, v]) => `<div class="stack g8"><div class="row between body2"><span>${k}</span><span class="caption">${App.fmt(v)} of ${App.fmt(c.total)} opted in</span></div><div class="bar"><span style="width:${c.total ? v / c.total * 100 : 0}%"></span></div></div>`).join('')}
      <div class="stack g8"><div class="row between body2"><span>WhatsApp</span><span class="caption">channel not enabled</span></div><div class="bar"></div></div></div>`; }
  function previewRows() { const c = count(d); if (!c.total) return `<tr class="empty-row"><td colspan="6">No contacts match these filters. Try a wider age range or fewer services.</td></tr>`;
    const svc = (d.audience === 'Leads' ? d.lead : d.cust).services[0] || 'Any service';
    return SAMPLE.filter(n => !d.excluded.includes(n)).slice(0, Math.min(5, c.total)).map((n, i) => { const type = d.audience === 'All' ? (i % 4 === 3 ? 'Leads' : 'Customers') : d.audience;
      return `<tr><td><span class="person"><span class="av sm">${App.initials(n)}</span>${esc(n)}</span></td><td>${esc((type === 'Leads' ? d.lead : d.cust).site.replace('All sites', 'Leicester'))}</td><td>${esc(svc)}</td><td>${App.chip(type, App.typeTone(type), 'sm filled')}</td><td>${3 + i} months ago</td><td style="text-align:right"><button class="icon-btn s20 danger" data-act="seg-exclude" data-n="${esc(n)}" aria-label="Exclude ${esc(n)} from this segment"><i class="ri-delete-bin-line"></i></button></td></tr>`; }).join(''); }
  function refresh(full) {
    if (full) App.$('#builder-body').innerHTML = builderBody();
    App.$('#live').innerHTML = liveHTML(); App.$('#applied').innerHTML = App.chip(applied(d) + ' applied', 't-blue', 'solid sm');
    App.$('#preview-rows').innerHTML = previewRows(); App.$('#sample').innerHTML = App.chip('sample of ' + App.fmt(count(d).total));
  }
  ins['seg-name'] = el => { d.name = el.value; if (d.tried && el.value.trim()) { el.closest('.field').classList.remove('err'); el.closest('.stack').querySelector('.helper')?.remove(); } };
  acts['seg-aud'] = el => { d.audience = el.dataset.v; refresh(true); };
  const setB = (el, k, v) => { d[el.dataset.k][k] = v; refresh(false); };
  chs['b-loc'] = el => setB(el, 'location', el.value); chs['b-site'] = el => setB(el, 'site', el.value); chs['b-gender'] = el => setB(el, 'gender', el.value); chs['b-since'] = el => setB(el, 'since', el.value);
  ins['b-window'] = el => { d[el.dataset.k].window = el.value; };
  const setAge = (el, v) => { const b = d[el.dataset.k]; v = Math.max(0, Math.min(100, +v || 0)); if (el.dataset.w === 'min') b.ageMin = Math.min(v, b.ageMax); else b.ageMax = Math.max(v, b.ageMin);
    const r = App.$(`[data-range=${el.dataset.k}]`); r.querySelector('.fill').style.left = b.ageMin + '%'; r.querySelector('.fill').style.right = (100 - b.ageMax) + '%';
    r.querySelector('[data-w=min]').value = b.ageMin; r.querySelector('[data-w=max]').value = b.ageMax;
    App.$$(`[data-in=b-age][data-k=${el.dataset.k}]`).forEach(i => { if (i !== el) i.value = i.dataset.w === 'min' ? b.ageMin : b.ageMax; }); if (el.type === 'range') App.$(`[data-in=b-age][data-k=${el.dataset.k}][data-w=${el.dataset.w}]`).value = el.dataset.w === 'min' ? b.ageMin : b.ageMax;
    refresh(false); };
  ins['b-age'] = el => setAge(el, el.value); ins['b-slide'] = el => setAge(el, el.value);
  acts['b-anyage'] = el => { const b = d[el.dataset.k]; b.ageMin = 0; b.ageMax = 100; refresh(true); };
  acts['b-svc'] = el => { const b = d[el.dataset.k]; const v = el.dataset.v; b.services = b.services.includes(v) ? b.services.filter(x => x !== v) : [...b.services, v]; refresh(true); };
  acts['seg-clearall'] = () => { const n = () => ({ location: 'All locations', site: 'All sites', gender: 'Any', ageMin: 0, ageMax: 100, window: '01/12/2025 - 01/12/2026', since: 'Any time', services: [] }); d.lead = n(); d.cust = n(); d.excluded = []; refresh(true); App.snack('All filters cleared.', 'info'); };
  acts['seg-refresh'] = () => { refresh(false); App.snack('Count refreshed.', 'info'); };
  acts['seg-exclude'] = el => { d.excluded.push(el.dataset.n); refresh(false); App.snack(`${el.dataset.n} excluded from this segment.`, 'info'); };
  acts['seg-save'] = () => {
    if (!d.name.trim()) { d.tried = true; refresh(true); App.$('[data-in=seg-name]').focus(); App.snack('Please fix the highlighted fields before saving.', 'error'); return; }
    const c = count(d); const f = d.audience === 'Leads' ? d.lead : d.cust;
    const payload = { name: d.name.trim(), type: typeOf(d), contacts: c.total, customers: c.c, leads: c.l, filters: Object.assign({}, f, { audience: d.audience }) };
    if (d.id) { Object.assign(S.segments.find(s => s.id === d.id), payload); App.go('#/segments/' + d.id); App.snack('Segment updated.'); }
    else { const id = 's' + Date.now(); S.segments.unshift(Object.assign({ id, lastUsed: 'Never', created: 'today', by: 'Muhammad Arslan', used: [] }, payload)); App.go('#/segments/' + id); App.snack('Segment saved.'); }
  };

  /* ---------- detail ---------- */
  App.route('/segments/:id', id => detail(id), { key: 'segments', icon: 'ri-group-line', title: 'Segments' });
  function detail(id) {
    const s = S.segments.find(x => x.id === id); if (!s) return notFound();
    const camps = S.campaigns.filter(c => c.segmentId === s.id);
    const used = [...camps.map(c => ({ name: c.name, kind: 'Campaign', when: (c.status === 'Draft' ? 'draft' : c.status.toLowerCase() + ' ' + (c.when || '')).trim(), status: c.status })), ...(s.used || []).filter(u => u.kind === 'Automation')];
    const f = s.filters; const pctC = s.contacts ? Math.round(s.customers / s.contacts * 100) : 0;
    return `${App.head([['CRM', '#/inbox'], ['Segments', '#/segments'], [s.name]], s.name, `${App.fmt(s.contacts)} contacts · refreshed 4 minutes ago · created by ${esc(s.by)} on ${esc(s.created)}`,
      `<button class="btn outlined lg" data-act="seg-export"><i class="ri-download-2-line"></i>Export</button><button class="btn outlined lg" data-go="#/segments/${s.id}/edit"><i class="ri-pencil-line"></i>Edit filters</button><button class="btn primary lg" data-act="seg-use" data-id="${s.id}"><i class="ri-send-plane-line"></i>Use in campaign</button>`)}
    <div class="stats"><div class="stat"><span class="overline">Contacts</span><span class="num tnum">${App.fmt(s.contacts)}</span><span class="foot good">+18 since last week</span></div>
      <div class="stat"><span class="overline">Customers</span><span class="num tnum">${App.fmt(s.customers)}</span><span class="foot">${pctC}% of segment</span></div>
      <div class="stat"><span class="overline">Leads</span><span class="num tnum">${App.fmt(s.leads)}</span><span class="foot">${100 - pctC}% of segment</span></div>
      <div class="stat"><span class="overline">Reachable by email</span><span class="num tnum">${App.fmt(Math.round(s.contacts * .93))}</span><span class="foot good">93% opted in</span></div></div>
    <div class="profile"><section class="card card-pad stack g16"><div class="row g12"><h2 class="h6">Audience preview</h2>${App.chip('sample of ' + App.fmt(s.contacts))}</div>
      <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Contact</th><th>Site</th><th>Service</th><th>Type</th><th>Last activity</th></tr></thead><tbody>
      ${SAMPLE.slice(0, Math.min(8, s.contacts)).map((n, i) => { const t = s.type === 'Mixed' ? (i % 3 === 2 ? 'Leads' : 'Customers') : s.type; return `<tr><td><span class="person"><span class="av sm">${App.initials(n)}</span>${esc(n)}</span></td><td>${esc(f.site.replace('All sites', 'Leicester'))}</td><td>${esc(f.services[0] || 'Any service')}</td><td>${App.chip(t, App.typeTone(t), 'sm filled')}</td><td>${2 + i} months ago</td></tr>`; }).join('')}
      </tbody></table></div>${App.pager(Math.min(8, s.contacts), s.contacts)}</div></section>
      <aside class="stack g16"><section class="card"><div class="card-head"><h2 class="sub2">Filter summary</h2><a href="#/segments/${s.id}/edit" class="caption" style="color:var(--primary)">Edit</a></div><div class="card-pad summary" style="padding-top:12px">
        ${[['Audience', f.audience], ['Service', f.services.join(', ') || 'Any'], ['Clinical site', f.site], ['Gender', f.gender], ['Age', f.ageMin + '–' + f.ageMax], ['Time since last visit', f.since], ['Activity window', f.window]].map(([k, v]) => `<div><span>${k}</span><b style="font-weight:400">${esc(v)}</b></div>`).join('')}</div></section>
      <section class="card"><div class="card-head"><h2 class="sub2">Where it’s used</h2><span class="count">${used.length}</span></div><div class="card-pad stack g8" style="padding-top:12px">
        ${used.length ? used.map(u => `<div class="used"><i class="${u.kind === 'Automation' ? 'ri-flow-chart' : 'ri-send-plane-line'}"></i><div class="grow"><b style="font-weight:500;font-size:13px">${esc(u.name)}</b><div class="caption">${u.kind} · ${esc(u.when)}</div></div>${App.chip(u.status, u.status === 'Scheduled' ? 't-blue' : 't-green', 'solid sm')}</div>`).join('') : '<p class="caption" style="margin:0">Not used yet. Use it in a campaign to start reaching these contacts.</p>'}</div></section>
      <section class="card card-pad stack g8"><h2 class="sub2">Danger zone</h2><p class="caption" style="margin:0">Deleting stops any campaign or automation that targets this segment.</p><div><button class="btn danger-o sm" data-act="seg-del" data-id="${s.id}"><i class="ri-delete-bin-line"></i>Delete segment</button></div></section></aside></div>`;
  }
  acts['seg-export'] = () => App.snack('Export started. You’ll get an email when the CSV is ready.', 'info');

  /* ---------- delete ---------- */
  acts['seg-del'] = el => {
    const s = S.segments.find(x => x.id === el.dataset.id);
    const sched = S.campaigns.filter(c => c.segmentId === s.id && c.status === 'Scheduled');
    const autos = (s.used || []).filter(u => u.kind === 'Automation');
    App.dialog(`${App.dlgHead('Delete this segment?', 'This can’t be undone')}<div class="dlg-body">
      ${sched.length || autos.length ? `<div class="al" role="alert"><i class="ri-error-warning-line"></i><div class="txt">“${esc(s.name)}” is used by ${sched.length} scheduled campaign${sched.length === 1 ? '' : 's'} and ${autos.length} automation${autos.length === 1 ? '' : 's'}. Deleting it will stop those from sending.</div></div>` : ''}
      <div class="kv"><div><span>Contacts in segment</span><b>${App.fmt(s.contacts)}</b></div><div><span>Scheduled campaigns</span><b>${sched.map(c => esc(c.name)).join(', ') || 'None'}</b></div><div><span>Automations</span><b>${autos.map(a => esc(a.name)).join(', ') || 'None'}</b></div></div>
      <div class="stack g8"><span class="body2 muted">Type the segment name to confirm.</span>${App.field('', `<input data-in="seg-confirm" placeholder="${esc(s.name)}" aria-label="Type ${esc(s.name)} to confirm" autofocus>`)}</div></div>
      <div class="dlg-foot"><button class="btn outlined lg" data-act="close-modal">Keep segment</button><button class="btn danger lg" data-act="seg-del-go" data-id="${s.id}" disabled><i class="ri-delete-bin-line"></i>Delete segment</button></div>`);
    ins['seg-confirm'] = i => { App.$('[data-act=seg-del-go]').disabled = i.value.trim() !== s.name; };
  };
  acts['seg-del-go'] = el => { const i = S.segments.findIndex(x => x.id === el.dataset.id); const [s] = S.segments.splice(i, 1);
    S.campaigns.filter(c => c.segmentId === s.id && c.status === 'Scheduled').forEach(c => { c.status = 'Draft'; c.when = null; });
    App.closeModal(); App.go('#/segments'); App.snack(`Segment “${s.name}” deleted.`); };
})();

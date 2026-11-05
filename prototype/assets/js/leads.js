/* Leads: table, pipeline board (drag & drop), lead profile with journeys, recovery actions, notes, status menu. */
(function () {
  const { S, esc, acts, ins, chs } = App;
  const meta = { key: 'leads', icon: 'ri-user-search-line', title: 'Leads' };
  const lf = App.ui.leads = { q: '', type: 'All', journey: 'All', status: 'All', last: 'Any time', show: 'all' };
  const lead = id => S.leads.find(l => l.id === id);
  const shownStatuses = () => S.statuses.filter(s => s.shown);
  const statusChip = id => { const s = App.status(id); return App.chip(s.name, s.tone, 'sm filled'); };
  const ago = () => 'Just now';
  const log = (l, icon, text) => { (l.log = l.log || []).unshift({ icon, text, at: App.nowStamp(), by: 'Muhammad Arslan' }); l.lastRel = ago(); l.last = App.nowStamp(); };

  const toggle = active => `<div class="seg" role="tablist" aria-label="View">${[['Table', '#/leads', 'ri-table-line'], ['Pipeline', '#/leads/pipeline', 'ri-layout-column-line']].map(([t, h, i]) => `<button role="tab" aria-selected="${active === t}" class="${active === t ? 'on' : ''}" data-go="${h}"><i class="${i}"></i>${t}</button>`).join('')}</div>`;
  const header = active => App.head([['CRM', '#/inbox'], ['Leads']], 'Leads', 'People who started a booking or registration and didn’t finish. Follow up and win them back.',
    `${toggle(active)}<button class="btn outlined lg" data-act="leads-export"><i class="ri-download-2-line"></i>Export</button><button class="btn primary lg" data-act="lead-add" data-status="new"><i class="ri-add-circle-line"></i>Add lead</button>`);
  const stats = () => { const miss = S.leads.filter(l => !l.email).length;
    return `<div class="stats"><div class="stat feature icon"><span class="ic"><i class="ri-flashlight-line"></i></span><div class="stack"><span class="overline">Today</span><span class="num tnum">6</span><span class="foot">new leads</span></div></div>
      <div class="stat icon"><span class="ic"><i class="ri-calendar-line"></i></span><div class="stack"><span class="overline">This week</span><span class="num tnum">38</span><span class="foot">captured</span></div></div>
      <div class="stat icon"><span class="ic red"><i class="ri-error-warning-line"></i></span><div class="stack"><span class="overline">Missing details</span><span class="num tnum">${miss}</span><span class="foot bad">leads</span></div></div>
      <div class="stat icon"><span class="ic"><i class="ri-refresh-line"></i></span><div class="stack"><span class="overline">Recovered (30 days)</span><span class="num tnum">34</span><span class="foot good">£12,480</span></div></div></div>`; };
  const filtered = () => S.leads.filter(l => (lf.type === 'All' || l.type === lf.type) && (lf.journey === 'All' || l.journey === lf.journey) && (lf.status === 'All' || l.status === lf.status)
    && (lf.show === 'all' || (lf.show === 'clin' && l.type === 'Clinician') || (lf.show === 'lead' && l.type !== 'Clinician') || (lf.show === 'miss' && !l.email) || (lf.show === 'mine' && l.owner === 'Muhammad Arslan'))
    && (!lf.q || (l.name + ' ' + (l.email || '') + ' ' + (l.phone || '')).toLowerCase().includes(lf.q.toLowerCase())));

  /* ---------- table ---------- */
  App.route('/leads', () => header('Table') + stats() + `<section class="card card-pad stack g16">
    <div class="filters">${App.field('Search', `<span class="adorn"><i class="ri-search-2-line"></i></span><input data-in="lead-q" value="${esc(lf.q)}" placeholder="Name, email or phone…">`, { cls: 'search' })}
      ${App.select('Lead type', 'lead-type', ['All', 'Clinician', 'Patient', 'Enquiry'], lf.type)}
      ${App.select('Journey', 'lead-journey', ['All', ...new Set(S.leads.map(l => l.journey))], lf.journey)}
      ${App.select('Status', 'lead-status', [{ v: 'All', t: 'All' }, ...S.statuses.map(s => ({ v: s.id, t: s.name }))], lf.status)}
      ${App.select('Last activity', 'lead-last', ['Any time', 'Today', 'Last 7 days', 'Last 30 days'], lf.last)}
      <button class="clear-btn" data-act="lead-clear"><i class="ri-close-line"></i>Clear filters</button></div>
    <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Lead</th><th>Type</th><th>Journey</th><th>Dropped at</th><th>Source</th><th>Last activity</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody id="lead-rows">${rows()}</tbody></table></div>${App.pager(Math.min(10, S.leads.length), 2310)}</div></section>`, meta);
  function rows() { const list = filtered();
    if (!list.length) return `<tr class="empty-row"><td colspan="8">No leads match your search or filters. <button class="btn text brand sm" data-act="lead-clear">Clear filters</button></td></tr>`;
    return list.map(l => `<tr class="click" data-go="#/leads/${l.id}"><td><span class="person"><span class="av sm ${l.initials === '?' ? 'grey' : ''}">${esc(l.initials)}</span><span class="cell2"><a href="#/leads/${l.id}" style="color:inherit;text-decoration:none">${esc(l.name)}</a><small ${l.email ? '' : 'style="color:var(--error)"'}>${esc(l.email || l.missing || 'No email captured')}</small></span></span></td>
      <td>${App.chip(l.type, App.typeTone(l.type), 'sm filled')}</td><td>${esc(l.journey)}</td><td>${esc(l.dropped)}</td><td><span class="row g8"><i class="${l.sourceIcon}" style="color:var(--text-sub)"></i>${esc(l.source)}</span></td>
      <td class="cell2"><span>${esc(l.lastRel)}</span><small>${esc(l.last)}</small></td><td>${statusChip(l.status)}</td>
      <td style="text-align:right"><span class="row-actions"><button class="icon-btn s20" data-go="#/leads/${l.id}" aria-label="View ${esc(l.name)}"><i class="ri-eye-line"></i></button><button class="icon-btn s20" data-act="lead-edit" data-id="${l.id}" aria-label="Edit ${esc(l.name)}"><i class="ri-pencil-line"></i></button><button class="icon-btn s20" data-act="lead-more" data-id="${l.id}" data-menu-anchor aria-haspopup="menu" aria-label="More for ${esc(l.name)}"><i class="ri-more-2-fill"></i></button></span></td></tr>`).join(''); }
  const redraw = () => { const t = App.$('#lead-rows'); if (t) t.innerHTML = rows(); else App.render(); };
  ins['lead-q'] = el => { lf.q = el.value; redraw(); };
  chs['lead-type'] = el => { lf.type = el.value; redraw(); }; chs['lead-journey'] = el => { lf.journey = el.value; redraw(); };
  chs['lead-status'] = el => { lf.status = el.value; redraw(); }; chs['lead-last'] = el => { lf.last = el.value; redraw(); };
  acts['lead-clear'] = () => { Object.assign(lf, { q: '', type: 'All', journey: 'All', status: 'All', last: 'Any time', show: 'all' }); App.render(); };
  acts['leads-export'] = () => App.snack(`Exporting ${filtered().length} leads as CSV.`, 'info');

  /* ---------- pipeline ---------- */
  App.route('/leads/pipeline', () => { const n = f => ({ all: 2310, clin: 428, lead: 1882, miss: 9, mine: 54 })[f];
    return header('Pipeline') + `<div class="row g8 wrap"><span class="caption">Show</span>${[['all', 'All leads'], ['clin', 'Clinicians'], ['lead', 'Leads'], ['miss', 'Missing details'], ['mine', 'My leads']].map(([k, t]) => `<button class="chip-btn ${lf.show === k ? 'on' : ''}" data-act="lead-show" data-v="${k}" aria-pressed="${lf.show === k}">${t} <span class="tnum">${App.fmt(n(k))}</span></button>`).join('')}<span class="grow"></span><a class="caption" href="#/settings/crm/statuses">Columns come from Settings → Lead statuses</a></div>
    <div class="board" id="board">${shownStatuses().map(column).join('')}</div>`; }, meta);
  function column(s) { const list = filtered().filter(l => l.status === s.id);
    return `<section class="col-k" data-col="${s.id}" aria-label="${esc(s.name)}"><div class="hd"><span class="dot ${s.tone}"></span>${esc(s.name)}<span class="count">${list.length}</span></div>
      ${list.map(l => `<article class="lcard" draggable="true" data-card="${l.id}" data-go="#/leads/${l.id}" tabindex="0" aria-label="${esc(l.name)}, ${esc(s.name)}"><div class="row between"><b style="font-weight:500;font-size:14px">${esc(l.name)}</b><button class="icon-btn s20" data-act="lead-more" data-id="${l.id}" data-menu-anchor aria-haspopup="menu" aria-label="More for ${esc(l.name)}"><i class="ri-more-2-fill"></i></button></div>
        <span class="caption" style="margin-top:-6px">${esc(l.short)}</span>
        <div class="line ${l.email ? '' : 'miss'}"><i class="ri-mail-line"></i>${esc(l.email || 'No email captured')}</div><div class="line ${l.phone ? '' : 'miss'}"><i class="ri-phone-line"></i>${esc(l.phone || 'No phone captured')}</div>
        <div class="foot">${App.chip(l.source, 't-grey', 'sm')}<span>${esc(l.lastRel)}</span></div></article>`).join('')}
      <button class="add-lead" data-act="lead-add" data-status="${s.id}"><i class="ri-add-line"></i>Add lead</button></section>`; }
  acts['lead-show'] = el => { lf.show = el.dataset.v; App.render(); };
  let dragId = null;
  document.addEventListener('dragstart', e => { const c = e.target.closest?.('[data-card]'); if (!c) return; dragId = c.dataset.card; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); });
  document.addEventListener('dragend', e => { e.target.closest?.('[data-card]')?.classList.remove('dragging'); App.$$('.col-k.over').forEach(c => c.classList.remove('over')); });
  document.addEventListener('dragover', e => { const col = e.target.closest?.('[data-col]'); if (!col || !dragId) return; e.preventDefault(); App.$$('.col-k.over').forEach(c => c !== col && c.classList.remove('over')); col.classList.add('over'); });
  document.addEventListener('drop', e => { const col = e.target.closest?.('[data-col]'); if (!col || !dragId) return; e.preventDefault(); moveTo(dragId, col.dataset.col); dragId = null; });
  function moveTo(id, sid, quiet) { const l = lead(id); const prev = l.status; if (prev === sid) return; l.status = sid; log(l, 'ri-flag-line', `Status changed from ${App.status(prev).name} to ${App.status(sid).name}`); App.render();
    if (!quiet) App.snack(`${l.name} moved to ${App.status(sid).name}.`, 'success', { label: 'Undo', fn: () => { l.status = prev; l.log.shift(); App.render(); } }); }

  /* ---------- card / row menu ---------- */
  acts['lead-more'] = (el, e) => { e.stopPropagation(); const l = lead(el.dataset.id);
    App.menu(el, `<button data-pick="view"><i class="ri-eye-line"></i>View lead</button><button data-pick="action"><i class="ri-checkbox-circle-line"></i>Log a recovery action</button><button data-pick="move"><i class="ri-arrow-right-line"></i>Move to stage</button><button data-pick="owner"><i class="ri-user-add-line"></i>Assign owner</button>
      <button data-pick="conv"><i class="ri-chat-3-line"></i>Open conversation</button><hr><button data-pick="archive"><i class="ri-archive-line"></i>Archive lead</button><button class="danger" data-pick="delete"><i class="ri-delete-bin-line"></i>Delete lead</button>`, v => {
      if (v === 'view') App.go('#/leads/' + l.id);
      if (v === 'action') { App.go('#/leads/' + l.id); App.snack('Tick the action you took in Recovery Actions.', 'info'); }
      if (v === 'move') statusMenu(el, l);
      if (v === 'owner') ownerMenu(el, l);
      if (v === 'conv') { if (l.conversationId) App.go('#/inbox/' + l.conversationId); else App.snack(`No conversation with ${l.name} yet.`, 'info'); }
      if (v === 'archive') { const i = S.leads.indexOf(l); S.leads.splice(i, 1); App.render(); App.snack(`${l.name} archived.`, 'success', { label: 'Undo', fn: () => { S.leads.splice(i, 0, l); App.render(); } }); }
      if (v === 'delete') App.dialog(`${App.dlgHead('Delete lead?', '', 'ri-delete-bin-line')}<div class="dlg-body"><p class="body2 muted" style="margin:0">${esc(l.name)} and their journeys, notes and recovery history will be removed. This can’t be undone.</p></div><div class="dlg-foot"><button class="btn outlined" data-act="close-modal">Cancel</button><button class="btn danger" data-act="lead-del-go" data-id="${l.id}">Delete lead</button></div>`, { width: 440 });
    }, { width: 240 }); };
  acts['lead-del-go'] = el => { const i = S.leads.findIndex(l => l.id === el.dataset.id); const [l] = S.leads.splice(i, 1); App.closeModal(); if (location.hash.startsWith('#/leads/l')) App.go('#/leads'); else App.render(); App.snack(`${l.name} deleted.`); };
  function statusMenu(anchor, l) {
    App.menu(anchor, `<div class="label">Set status</div>${shownStatuses().map(s => `<button data-pick="${s.id}" class="${l.status === s.id ? 'sel' : ''}"><span class="dot ${s.tone}"></span><span class="two"><span>${esc(s.name)}</span><small>${esc(s.picker)}</small></span>${l.status === s.id ? '<i class="ri-check-line check"></i>' : ''}</button>`).join('')}<hr><div class="foot">Changing status here doesn’t message the lead — it only updates the record.</div>`, v => moveTo(l.id, v), { width: 320 }); }
  function ownerMenu(anchor, l) {
    App.menu(anchor, `<div class="label">Assign owner</div>${S.team.map(t => `<button data-pick="${esc(t.name)}" class="${l.owner === t.name ? 'sel' : ''}"><span class="av sm">${App.initials(t.name)}</span><span class="two"><span>${esc(t.name)}</span><small>${esc(t.role)}</small></span></button>`).join('')}<hr><button data-pick=""><i class="ri-user-unfollow-line"></i>Unassigned</button>`, v => { l.owner = v || null; log(l, 'ri-user-add-line', v ? `Owner set to ${v}` : 'Owner removed'); App.render(); App.snack(v ? `${l.name} assigned to ${v}.` : `${l.name} is now unassigned.`); }, { width: 280 }); }

  /* ---------- add / edit lead ---------- */
  acts['lead-add'] = el => leadDrawer(null, el.dataset.status || 'new');
  acts['lead-edit'] = el => leadDrawer(lead(el.dataset.id));
  let ld = null;
  function leadDrawer(l, status) {
    ld = l ? { id: l.id, name: l.name, email: l.email || '', phone: l.phone || '', type: l.type, journey: l.journey, status: l.status, owner: l.owner || '', tried: false } : { id: null, name: '', email: '', phone: '', type: 'Patient', journey: 'No journey yet', status, owner: 'Muhammad Arslan', tried: false };
    drawLead(); }
  function drawLead() { const bad = ld.tried && !ld.name.trim() && !ld.email.trim() && !ld.phone.trim();
    App.drawer(`${App.dlgHead(ld.id ? 'Edit lead' : 'Add lead', ld.id ? '' : 'For people who got in touch outside a tracked journey — calls, walk-ins, DMs.')}<div class="dlg-body">
      ${bad ? `<div class="al"><i class="ri-error-warning-line"></i><div class="txt">Add at least a name, email or phone so you can follow up.</div></div>` : ''}
      ${App.field('Name', `<input data-in="ld" data-k="name" value="${esc(ld.name)}" placeholder="e.g. Jane Doe">`, { cls: bad ? 'err' : '' })}
      ${App.field('Email', `<input type="email" data-in="ld" data-k="email" value="${esc(ld.email)}" placeholder="name@example.com">`, { cls: bad ? 'err' : '' })}
      ${App.field('Phone', `<input type="tel" data-in="ld" data-k="phone" value="${esc(ld.phone)}" placeholder="+44 …">`, { cls: bad ? 'err' : '' })}
      ${App.select('Lead type', 'ld-type', ['Patient', 'Clinician', 'Enquiry'], ld.type)}
      ${App.select('Status', 'ld-status', shownStatuses().map(s => ({ v: s.id, t: s.name })), ld.status)}
      ${App.select('Owner', 'ld-owner', [{ v: '', t: 'Unassigned' }, ...S.team.map(t => ({ v: t.name, t: t.name }))], ld.owner)}</div>
      <div class="dlg-foot"><button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="ld-save">${ld.id ? 'Save changes' : 'Add lead'}</button></div>`); }
  ins.ld = el => { ld[el.dataset.k] = el.value; };
  chs['ld-type'] = el => { ld.type = el.value; }; chs['ld-status'] = el => { ld.status = el.value; }; chs['ld-owner'] = el => { ld.owner = el.value; };
  acts['ld-save'] = () => { if (!ld.name.trim() && !ld.email.trim() && !ld.phone.trim()) { ld.tried = true; drawLead(); return; }
    const name = ld.name.trim() || ld.email.trim() || ld.phone.trim();
    const patch = { name, initials: ld.name.trim() ? App.initials(ld.name) : '?', email: ld.email.trim() || null, phone: ld.phone.trim() || null, missing: ld.email.trim() ? null : 'No email captured', type: ld.type, status: ld.status, owner: ld.owner || null };
    let l = lead(ld.id);
    if (l) { Object.assign(l, patch); log(l, 'ri-pencil-line', 'Lead details edited'); }
    else { l = Object.assign({ id: 'l' + Date.now(), journey: 'No journey yet', dropped: 'Not started', source: 'Added manually', sourceIcon: 'ri-user-add-line', lastRel: 'Just now', last: App.nowStamp(), short: 'Added manually', sub: `Added ${App.nowStamp()} by Muhammad Arslan · no journey yet`, journeys: [], done: {} }, patch); S.leads.unshift(l); log(l, 'ri-user-add-line', 'Lead added manually'); }
    App.closeModal(); App.render(); App.snack(ld.id ? 'Lead updated.' : `${name} added to ${App.status(ld.status).name}.`); };

  /* ---------- profile ---------- */
  const nd = App.ui.noteDraft = {};
  App.route('/leads/:id', id => { const l = lead(id);
    if (!l) return `<div class="card"><div class="empty"><span class="ic grey"><i class="ri-user-search-line"></i></span><h2 class="h6">Lead not found</h2><p>It may have been archived or deleted.</p><button class="btn outlined" data-go="#/leads">Back to leads</button></div></div>`;
    const s = App.status(l.status); const cur = l.journeys.find(j => j.current);
    return `${App.head([['CRM', '#/inbox'], ['Leads', '#/leads'], [l.name]], l.name, esc(l.sub),
      `<button class="status-btn" data-act="lead-status-menu" data-id="${l.id}" data-menu-anchor aria-haspopup="menu"><span class="dot ${s.tone}"></span>${esc(s.name)}<i class="ri-arrow-down-s-line"></i></button><button class="btn outlined lg" data-act="lead-log" data-id="${l.id}"><i class="ri-history-line"></i>Activity Log</button><button class="icon-btn md" data-act="lead-more" data-id="${l.id}" data-menu-anchor aria-haspopup="menu" aria-label="More actions"><i class="ri-more-2-fill"></i></button>`,
      `${App.chip(l.type, App.typeTone(l.type), 'filled')}${cur ? App.chip(cur.badge || 'Abandoned', 't-red', 'filled') : ''}`)}
    ${!l.email ? `<div class="al warning"><i class="ri-error-warning-line"></i><div class="txt">${esc(l.missing || 'No email captured')}. Email campaigns can’t reach this lead. <a href="#" data-act="lead-edit" data-id="${l.id}" style="color:inherit">Add contact details</a></div></div>` : ''}
    <div class="profile"><div class="stack g16">${journeysCard(l)}${notesCard(l)}</div>${actionsCard(l)}</div>`; }, meta);

  function journeysCard(l) {
    const body = !l.journeys.length ? `<div class="empty" style="padding:32px 16px"><span class="ic grey"><i class="ri-route-line"></i></span><p>No booking or registration journey yet. Send them a link to start one.</p><button class="btn outlined sm" data-act="lead-resume" data-id="${l.id}"><i class="ri-links-line"></i>Send booking link</button></div>`
      : l.journeys.map((j, i) => j.collapsed ? `<button class="journey" style="flex-direction:row;justify-content:space-between;align-items:center;background:none;cursor:pointer;font:inherit;text-align:left" data-act="soon" data-what="Older journey history"><span><b style="font-weight:500">${esc(j.title)}</b><br><span class="caption">${esc(j.collapsed)}</span></span><i class="ri-arrow-down-s-line"></i></button>`
      : `<div class="journey ${j.current ? 'current' : ''}"><div class="row between wrap g8"><div><b style="font-weight:500">${esc(j.title)}</b><br><span class="caption">${esc(j.note || '')}</span></div>${App.chip(j.badge || `Dropped at ${j.steps[j.dropAt]}`, 't-red', 'sm filled')}</div>
        <div class="steps" style="--n:${j.steps.length}">${j.steps.map((st, k) => `<div class="${k < j.dropAt ? 'done' : k === j.dropAt ? 'drop' : ''}">${esc(st)}${k === j.dropAt ? '<small>Dropped here</small>' : ''}</div>`).join('')}</div>
        <div class="jfacts">${[['Started', j.started], ['Last activity', j.lastAct], ['Completion', j.completion], ['Abandoned after', j.after], ['Payment', j.payment], ['Value', j.value], ['Source', j.src]].filter(x => x[1]).map(([k, v]) => `<div><small>${k}</small>${esc(v)}</div>`).join('')}</div></div>`).join('');
    return `<section class="card"><div class="card-head"><h2 class="sub2" style="font-size:16px">Journeys</h2>${App.chip(l.journeys.length + (l.journeys.length === 1 ? ' journey' : ' journeys'))}</div><div class="card-pad stack g16">${body}
      <p class="caption" style="margin:0"><i class="ri-information-line"></i> A journey counts as abandoned after 24 hours with no activity. Each new attempt shows as its own journey.</p></div></section>`; }

  function actionsCard(l) { const list = S.actions.filter(a => a.shown); const done = list.filter(a => l.done[a.id]); const lastDone = done.map(a => l.done[a.id])[0];
    return `<section class="card" style="position:sticky;top:111px"><div class="card-head"><div><h2 class="sub2" style="font-size:16px">Recovery Actions</h2><span class="caption">${done.length} of ${list.length} done${lastDone ? ' · last ' + esc(lastDone.split(' · ')[1]) : ''}</span></div></div>
      <div class="card-pad stack g8">${list.map(a => { const d = l.done[a.id]; return `<div class="raction ${d ? 'done' : ''}"><label class="cbx" style="margin:0"><input type="checkbox" ${d ? 'checked' : ''} data-ch="ra" data-id="${l.id}" data-a="${a.id}" aria-label="${esc(a.name)}"></label><span class="ic"><i class="${a.icon}"></i></span>
        <span class="grow"><b>${esc(a.name)}${a.required ? '' : ' <span class="caption">(optional)</span>'}</b><small>${d ? esc(d) : esc(a.helper)}</small></span>${d ? '' : `<button class="btn text brand sm" data-act="ra-done" data-id="${l.id}" data-a="${a.id}">Mark done</button>`}</div>`; }).join('')}
      <p class="caption" style="margin:8px 0 0">These actions are set up in CRM → CRM Configuration. <a href="#/settings/crm/actions">Edit</a></p></div></section>`; }
  const setDone = (l, a, on) => { const act = S.actions.find(x => x.id === a);
    if (on) { l.done[a] = 'Muhammad A. · ' + App.nowStamp(); log(l, act.icon, `${act.name} — marked done`); } else { delete l.done[a]; log(l, 'ri-arrow-go-back-line', `${act.name} — unticked`); }
    const shown = S.actions.filter(x => x.shown); App.render();
    if (on && l.status === 'new') { l.status = 'attempted'; log(l, 'ri-flag-line', 'Status changed from New to Attempted contact'); App.render(); App.snack(`${act.name} logged. Status moved to Attempted contact.`); }
    else App.snack(on ? `${act.name} logged · ${Object.keys(l.done).filter(k => shown.some(s => s.id === k)).length} of ${shown.length} done.` : `${act.name} unticked.`, on ? 'success' : 'info'); };
  chs.ra = el => setDone(lead(el.dataset.id), el.dataset.a, el.checked);
  acts['ra-done'] = el => setDone(lead(el.dataset.id), el.dataset.a, true);
  acts['lead-resume'] = el => setDone(lead(el.dataset.id), 'resume', true);

  function notesCard(l) { const list = S.notes[l.id] || []; const draft = nd[l.id] || '';
    return `<section class="card"><div class="card-head"><h2 class="sub2" style="font-size:16px">Notes</h2></div><div class="card-pad stack g16">
      ${App.field('Add a note', `<textarea rows="3" data-in="note" data-id="${l.id}" placeholder="What happened, what they said, what’s next…">${esc(draft)}</textarea>`, { cls: 'multi' })}
      <div class="row g8" style="justify-content:flex-end"><button class="btn outlined" data-act="note-cancel" data-id="${l.id}">Cancel</button><button class="btn primary" data-act="note-save" data-id="${l.id}" id="note-save" ${draft.trim() ? '' : 'disabled'}>Save Note</button></div>
      <h3 class="sub2" style="margin:0">Recent Notes</h3>${list.length ? list.map(n => `<div class="note-card"><span>${esc(n.text)}</span><small>${esc(n.by)} · ${esc(n.at)}</small></div>`).join('') : '<p class="caption" style="margin:0">No notes yet.</p>'}</div></section>`; }
  ins.note = el => { nd[el.dataset.id] = el.value; App.$('#note-save').disabled = !el.value.trim(); };
  acts['note-cancel'] = el => { nd[el.dataset.id] = ''; App.render(); };
  acts['note-save'] = el => { const id = el.dataset.id, l = lead(id); const t = (nd[id] || '').trim(); if (!t) return;
    (S.notes[id] = S.notes[id] || []).unshift({ by: 'Muhammad Arslan (Business Manager)', text: t, at: App.nowStamp() }); nd[id] = ''; log(l, 'ri-sticky-note-line', 'Note added'); App.render(); App.snack('Note saved.'); };

  acts['lead-status-menu'] = el => statusMenu(el, lead(el.dataset.id));
  acts['lead-log'] = el => { const l = lead(el.dataset.id);
    const seed = Object.entries(l.done).map(([a, w]) => { const act = S.actions.find(x => x.id === a); return { icon: act ? act.icon : 'ri-check-line', text: `${act ? act.name : a} — marked done`, at: w.split(' · ')[1], by: w.split(' · ')[0] }; });
    const items = [...(l.log || []), ...seed, ...(l.journeys.filter(j => j.started).map(j => ({ icon: 'ri-route-line', text: `${j.title} started`, at: j.started, by: 'System' })))];
    App.drawer(`${App.dlgHead('Activity Log', esc(l.name))}<div class="dlg-body">${items.length ? items.map(i => `<div class="log-item"><span class="ic"><i class="${i.icon}"></i></span><div class="stack"><span class="body2">${esc(i.text)}</span><span class="caption">${esc(i.by)} · ${esc(i.at)}</span></div></div>`).join('') : '<p class="caption">Nothing logged yet.</p>'}</div><div class="dlg-foot"><button class="btn outlined lg" data-act="close-modal">Close</button></div>`); };
})();

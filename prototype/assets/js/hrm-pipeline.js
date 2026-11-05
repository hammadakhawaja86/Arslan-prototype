/* HRM › Recruitment › Pipeline (P1–P8, S3): board per recruitment, drag between stages, actions, stage order, filters. */
(function () {
  const { S, esc, acts, ins, chs } = App; const H = App.H;
  const pf = App.ui.pipe = { q: '', source: 'Any', rating: 0, gender: 'Any', status: ['progress', 'hired'], stageType: 'Any', from: '', to: '' };
  const live = () => S.recruitments.filter(r => r.status !== 'Draft');
  const cur = () => { const l = live(); let r = l.find(x => x.id === App.ui.hrmRec); if (!r) { r = l[0]; App.ui.hrmRec = r && r.id; } return r; };
  const activeFilters = () => (pf.source !== 'Any') + (pf.rating > 0) + (pf.gender !== 'Any') + (pf.stageType !== 'Any') + (pf.status.join() !== 'progress,hired') + !!(pf.from || pf.to);
  const visible = r => S.candidates.filter(c => c.rid === r.id && pf.status.includes(c.status === 'pool' ? 'pool' : c.status) && c.active !== false
    && (pf.source === 'Any' || c.source === pf.source) && c.rating >= pf.rating && (pf.gender === 'Any' || c.gender === pf.gender)
    && (pf.stageType === 'Any' || H.stage(c.stage).type === pf.stageType) && (!pf.q || (H.name(c) + ' ' + (c.email || '')).toLowerCase().includes(pf.q.toLowerCase())));

  H.route('/hrm/pipeline', () => {
    const r = cur(); const primary = `<button class="btn primary lg" data-act="pipe-add" ${r ? '' : 'disabled'}><i class="ri-add-circle-line"></i>Add candidate</button>`;
    const sub = 'Drag candidates between stages. Each recruitment keeps its own stages and stage managers.';
    if (!r) return H.frame({ tab: 'pipeline', primary, title: 'Pipeline', sub, actions: `<button class="btn outlined lg" disabled><i class="ri-settings-3-line"></i>Actions</button><button class="btn outlined lg" disabled><i class="ri-filter-3-line"></i>Filter</button>`,
      body: `<div class="hbody"><div class="empty-box"><div class="empty"><span class="ic"><i class="ri-briefcase-4-line"></i></span><h2 class="sub2" style="font-size:18px;font-weight:400">No recruitments yet</h2><p>Create a recruitment to start building its pipeline. You can draft the job description with AI, add stage managers and publish it to your career page.</p><div class="row g12 wrap" style="justify-content:center"><button class="btn outlined lg" data-go="#/hrm/config/stages"><i class="ri-settings-3-line"></i>Configure stages</button><button class="btn primary lg" data-act="rec-new"><i class="ri-add-circle-line"></i>Create recruitment</button></div>
        <div class="steps3">${[['Create a recruitment', 'Role, vacancies, managers and dates'], ['Publish to career page', 'Candidates apply without an account'], ['Move candidates through stages', 'Interview, test, offer and hire']].map(([t, d], i) => `<div><span class="num-dot">${i + 1}</span><span class="cell2"><span>${t}</span><small>${d}</small></span></div>`).join('')}</div></div></div></div>` });
    const n = activeFilters(); const list = visible(r);
    const cols = [H.stage('unassigned'), ...S.stages];
    return H.frame({ tab: 'pipeline', primary, title: 'Pipeline', sub,
      actions: `<button class="btn outlined lg" data-act="pipe-actions" data-menu-anchor aria-haspopup="menu"><i class="ri-settings-3-line"></i>Actions</button><button class="btn outlined lg" data-act="pipe-filter"><i class="ri-filter-3-line"></i>Filter${n ? ` <span class="count on">${n}</span>` : ''}</button>`,
      body: `<div class="hbody stack g16"><div class="row between wrap g12"><div class="row g8 wrap"><span class="caption">Recruitment</span>${live().map(x => `<button class="chip-btn ${x.id === r.id ? 'on' : ''}" data-act="pipe-rec" data-id="${x.id}" aria-pressed="${x.id === r.id}">${esc(x.title)} <span class="count">${S.candidates.filter(c => c.rid === x.id && c.status === 'progress').length}</span></button>`).join('')}</div>
        <div style="width:min(280px,100%)">${App.field('Search', `<span class="adorn"><i class="ri-search-line"></i></span><input data-in="pipe-q" value="${esc(pf.q)}" placeholder="Search candidates">`, { cls: 'sm' })}</div></div>
        ${r.status === 'Closed' ? `<div class="al warning"><i class="ri-lock-line"></i><div class="txt">This recruitment is closed — it no longer takes applications. <a href="#" data-act="pipe-reopen" style="color:inherit">Reopen it</a></div></div>` : ''}
        <div class="board hboard" id="hboard">${cols.map(s => column(s, list.filter(c => c.stage === s.id))).join('')}</div></div>` });
  });
  function column(s, list) {
    const tone = H.TONE[s.type] || 't-grey';
    return `<section class="col-k" data-hcol="${s.id}" aria-label="${esc(s.name)}, ${list.length} candidates"><div class="hd"><span class="dot ${tone}"></span>${esc(s.name)}<span class="count">${list.length}</span><button class="icon-btn s20" data-act="col-menu" data-id="${s.id}" data-menu-anchor aria-haspopup="menu" aria-label="${esc(s.name)} options"><i class="ri-more-2-fill"></i></button></div>
      ${list.map(card).join('')}${s.end ? '' : `<button class="add-lead" data-act="pipe-add" data-stage="${s.id}"><i class="ri-add-line"></i>Add candidate</button>`}</section>`;
  }
  const card = c => `<article class="lcard hc ${App.ui.hrmFlash === c.id ? 'flash' : ''}" draggable="true" data-hcard="${c.id}" data-go="#/hrm/candidates/${c.id}" tabindex="0" aria-label="${esc(H.name(c))}">
    <div class="row g8">${H.cav(c, '')}<div class="grow cell2"><b style="font-weight:500;font-size:14px">${esc(H.name(c))}</b>${H.starsHTML(c.rating, 'xs')}</div><button class="icon-btn s20" data-act="hc-menu" data-id="${c.id}" data-menu-anchor aria-haspopup="menu" aria-label="Actions for ${esc(H.name(c))}"><i class="ri-more-2-fill"></i></button></div>
    <div class="line"><i class="ri-mail-line"></i>${esc(c.email || '—')}</div><div class="line"><i class="ri-phone-line"></i>${esc(c.phone || '—')}</div>
    <div class="foot"><span class="chip sm filled t-grey">${esc(c.source)}</span><span><i class="ri-time-line"></i> ${esc(c.when)}</span></div></article>`;

  acts['pipe-rec'] = el => { App.ui.hrmRec = el.dataset.id; App.render(); };
  ins['pipe-q'] = el => { pf.q = el.value; const r = cur(); const list = visible(r); App.$('#hboard').innerHTML = [H.stage('unassigned'), ...S.stages].map(s => column(s, list.filter(c => c.stage === s.id))).join(''); };
  acts['pipe-add'] = el => { App.ui.hrmNew = { rid: cur().id, stage: el.dataset.stage || 'applied' }; App.go('#/hrm/candidates/new'); };
  acts['pipe-reopen'] = (el, e) => { e.preventDefault(); const r = cur(); r.status = 'Open'; r.published = true; App.render(); App.snack(`“${r.title}” reopened and back on your career page.`); };

  /* drag & drop (separate attributes from the CRM leads board) */
  let drag = null;
  document.addEventListener('dragstart', e => { const c = e.target.closest?.('[data-hcard]'); if (!c) return; drag = c.dataset.hcard; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', drag); });
  document.addEventListener('dragend', e => { e.target.closest?.('[data-hcard]')?.classList.remove('dragging'); App.$$('[data-hcol].over').forEach(c => c.classList.remove('over')); drag = null; });
  document.addEventListener('dragover', e => { const col = e.target.closest?.('[data-hcol]'); if (!col || !drag) return; e.preventDefault(); App.$$('[data-hcol].over').forEach(c => c !== col && c.classList.remove('over')); col.classList.add('over'); });
  document.addEventListener('drop', e => { const col = e.target.closest?.('[data-hcol]'); if (!col || !drag) return; e.preventDefault(); H.moveTo(drag, col.dataset.hcol); drag = null; });
  H.moveTo = (cid, sid, o = {}) => { const c = H.cand(cid); const prev = c.stage; if (prev === sid) return;
    const prevStatus = c.status; c.stage = sid; c.when = 'Just now'; if (H.stage(sid).end) { c.status = 'hired'; c.hiredOn = '08 Oct 2026'; const r = H.rec(c.rid); r.hired++; }
    (c.log = c.log || []).unshift({ icon: 'ri-arrow-right-up-line', text: `Moved from ${H.stage(prev).name} to ${H.stage(sid).name}${o.note ? ' — “' + o.note + '”' : ''}`, at: '08 Oct, ' + new Date().toTimeString().slice(0, 5), by: 'Muhammad Arslan' });
    App.ui.hrmFlash = cid; App.render(); setTimeout(() => { App.ui.hrmFlash = null; }, 50);
    const mgr = H.stage(sid).managers.map(m => H.staff(m).name);
    App.snack(`${H.name(c)} ${c.status === 'hired' ? 'hired' : 'moved to ' + H.stage(sid).name}\n${mgr.length ? `Stage managers ${mgr.join(' and ')} ${mgr.length > 1 ? 'were' : 'was'} notified${o.email ? ' · email sent to ' + c.first : ''}` : 'No stage manager to notify'}`, 'success', { label: 'Undo', fn: () => { c.stage = prev; if (c.status === 'hired' && prevStatus !== 'hired') { c.status = prevStatus; H.rec(c.rid).hired--; } c.log.shift(); App.render(); } }); };

  /* card + column menus */
  acts['hc-menu'] = (el, e) => { e.stopPropagation(); const c = H.cand(el.dataset.id);
    App.menu(el, `<button data-pick="view"><i class="ri-eye-line"></i>View details</button><button data-pick="sched"><i class="ri-calendar-event-line"></i>Schedule interview</button><button data-pick="move"><i class="ri-arrow-right-up-line"></i>Move to stage</button><button data-pick="pool"><i class="ri-heart-3-line"></i>Add to talent pool</button><button data-pick="cv"><i class="ri-file-text-line"></i>View resume</button><hr><button data-pick="archive"><i class="ri-archive-line"></i>Archive</button><button class="danger" data-pick="del"><i class="ri-delete-bin-line"></i>Delete candidate</button>`, v => {
      if (v === 'view') App.go('#/hrm/candidates/' + c.id); if (v === 'sched') H.schedule(c.id); if (v === 'move') H.moveModal(c.id); if (v === 'pool') H.poolModal(c.id);
      if (v === 'cv') H.viewCV(c.id); if (v === 'archive') H.archive(c.id); if (v === 'del') H.deleteCand(c.id); }, { width: 230 }); };
  acts['col-menu'] = el => { const s = H.stage(el.dataset.id);
    App.menu(el, `${s.end ? '' : `<button data-pick="add"><i class="ri-user-add-line"></i>Add candidate here</button>`}<button data-pick="order"><i class="ri-draggable"></i>Manage stage order</button><button data-pick="cfg"><i class="ri-settings-3-line"></i>Configure stages</button>`, v => {
      if (v === 'add') { App.ui.hrmNew = { rid: cur().id, stage: s.id }; App.go('#/hrm/candidates/new'); } if (v === 'order') stageOrder(); if (v === 'cfg') App.go('#/hrm/config/stages'); }, { width: 240 }); };

  /* actions menu (P2) */
  acts['pipe-actions'] = el => { const r = cur();
    App.menu(el, `<button data-pick="stage" class="sel"><i class="ri-add-line"></i><span class="two"><span>Add stage</span><small>Insert a new stage in this pipeline</small></span></button><button data-pick="edit"><i class="ri-pencil-line"></i>Edit recruitment</button><button data-pick="order"><i class="ri-draggable"></i>Manage stage order</button><button data-pick="share"><i class="ri-share-line"></i>Share job link</button><hr>
      <button data-pick="close"><i class="ri-archive-line"></i><span class="two"><span>${r.status === 'Closed' ? 'Reopen recruitment' : 'Close recruitment'}</span><small>${r.status === 'Closed' ? 'Starts taking applications again' : 'Stops new applications'}</small></span></button><button class="danger" data-pick="del"><i class="ri-delete-bin-line"></i>Delete recruitment</button>`, v => {
      if (v === 'stage') H.addStage(); if (v === 'edit') H.openRecruitment(r.id); if (v === 'order') stageOrder();
      if (v === 'share') { try { navigator.clipboard.writeText(`https://careers.leafease.com/${S.career.slug}/${r.id}`)?.catch?.(() => {}); } catch (e) {} App.snack('Job link copied to clipboard.', 'info'); }
      if (v === 'close') { const was = r.status; r.status = was === 'Closed' ? 'Open' : 'Closed'; r.published = r.status !== 'Closed'; App.render(); App.snack(r.status === 'Closed' ? `“${r.title}” closed — no new applications.` : `“${r.title}” reopened.`, 'success', r.status === 'Closed' ? { label: 'Undo', fn: () => { r.status = was; r.published = true; App.render(); } } : undefined); }
      if (v === 'del') H.deleteRec(r.id); }, { width: 280 }); };

  /* manage stage order (P7) */
  let order = null;
  function stageOrder() { order = S.stages.filter(s => !s.end).map(s => s.id); drawOrder(); }
  function drawOrder() {
    const orig = S.stages.filter(s => !s.end).map(s => s.id); const moved = order.find((id, i) => id !== orig[i]);
    const affected = moved ? H.active().filter(c => c.stage === moved || c.stage === order[order.indexOf(moved) + 1]).length : 0;
    const roles = { Initial: 't-blue', Interview: 't-teal', Test: 't-orange', Hired: 't-green' };
    App.dialog(`<div class="dlg-head"><div class="stack g4"><h2 id="dlg-title" class="h6" style="font-size:20px">Manage stage order</h2><p class="body2 muted" style="margin:0">Drag or use the arrows to reorder. Candidates keep their current stage.</p></div><button class="icon-btn s20 round" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button></div>
      <div class="dlg-body"><div class="sorow fixed"><i class="ri-draggable"></i><span class="grow">Unassigned</span><span class="chip sm">Fixed</span></div>
      <ol class="stack g8" style="list-style:none;margin:0;padding:0" id="sorder">${order.map((id, i) => { const s = H.stage(id); return `<li class="sorow ${moved === id ? 'hl' : ''}" draggable="true" data-so="${i}"><i class="ri-draggable"></i><span class="num-dot ${moved === id ? '' : 'grey'}">${i + 1}</span><span class="grow">${esc(s.name)}</span><span class="chip sm filled ${roles[s.type]}">${s.type}</span><span class="caption"><i class="ri-team-line"></i> ${s.managers.length} manager${s.managers.length === 1 ? '' : 's'}</span><span class="row"><button class="icon-btn s20" data-act="so-mv" data-i="${i}" data-d="-1" ${i ? '' : 'disabled'} aria-label="Move ${esc(s.name)} up"><i class="ri-arrow-up-s-line"></i></button><button class="icon-btn s20" data-act="so-mv" data-i="${i}" data-d="1" ${i < order.length - 1 ? '' : 'disabled'} aria-label="Move ${esc(s.name)} down"><i class="ri-arrow-down-s-line"></i></button></span></li>`; }).join('')}</ol>
      ${moved ? `<div class="al warning"><i class="ri-alert-line"></i><div class="txt">Moving “${esc(H.stage(moved).name)}” before “${esc(H.stage(order[order.indexOf(moved) + 1]).name)}” changes the order for ${affected} active candidate${affected === 1 ? '' : 's'}.</div></div>` : ''}</div>
      <div class="dlg-foot"><button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="so-save" ${moved ? '' : 'disabled'}>Save order</button></div>`, { width: 520 }); }
  acts['so-mv'] = el => { const i = +el.dataset.i, j = i + +el.dataset.d; [order[i], order[j]] = [order[j], order[i]]; drawOrder(); };
  let soDrag = null;
  document.addEventListener('dragstart', e => { const r = e.target.closest?.('[data-so]'); if (r) { soDrag = +r.dataset.so; e.dataTransfer.setData('text/plain', 'so'); } });
  document.addEventListener('dragover', e => { if (soDrag != null && e.target.closest?.('[data-so]')) e.preventDefault(); });
  document.addEventListener('drop', e => { const r = e.target.closest?.('[data-so]'); if (soDrag == null || !r) return; e.preventDefault(); const [x] = order.splice(soDrag, 1); order.splice(+r.dataset.so, 0, x); soDrag = null; drawOrder(); });
  acts['so-save'] = () => { const ends = S.stages.filter(s => s.end); S.stages.splice(0, S.stages.length, ...order.map(H.stage), ...ends); App.closeModal(); App.render(); App.snack('Stage order saved for every recruitment.'); };

  /* filter drawer (P8) */
  let fd = null;
  acts['pipe-filter'] = () => { fd = JSON.parse(JSON.stringify(pf)); drawFilter(); };
  function drawFilter() { const n = (fd.source !== 'Any') + (fd.rating > 0) + (fd.gender !== 'Any') + (fd.stageType !== 'Any') + (fd.status.join() !== 'progress,hired') + !!(fd.from || fd.to);
    App.drawer(`<div class="dlg-head"><div class="row g8"><h2 id="dlg-title" class="h6" style="font-size:20px">Filter candidates</h2>${n ? App.chip(n + ' active', 't-green', 'sm filled') : ''}</div><button class="icon-btn" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button></div>
      <div class="dlg-body"><span class="overline strong">Recruitment</span>${App.select('Recruitment', 'pf-rec', live().map(r => ({ v: r.id, t: r.title })), cur().id)}
        <div class="g2">${App.select('Stage type', 'pf-stype', ['Any', 'Initial', 'Interview', 'Test', 'Hired'], fd.stageType)}${App.select('Managers', 'pf-mgr', ['Anyone', ...S.staff.map(s => s.name)], 'Anyone')}</div>
        <span class="overline strong">Candidate</span><div class="g2">${App.select('Source', 'pf-src', ['Any', 'Career page', 'LinkedIn', 'Referral', 'Indeed', 'Agency'], fd.source)}${App.select('Rating', 'pf-rate', [{ v: '0', t: 'Any' }, ...[3, 4, 5].map(x => ({ v: String(x), t: `${x}★ and above` }))], String(fd.rating))}</div>
        <div class="g2">${App.select('Gender', 'pf-gender', ['Any', 'Female', 'Male'], fd.gender)}${App.select('Country', 'pf-country', ['United Kingdom', 'Any'], 'United Kingdom')}</div>
        <span class="overline strong">Dates</span><div class="g2">${App.field('Applied from', `<input type="date" data-in="pf-date" data-k="from" value="${fd.from}">`)}${App.field('Applied to', `<input type="date" data-in="pf-date" data-k="to" value="${fd.to}">`)}</div>
        <span class="overline strong">Status</span><div class="row g8 wrap">${[['progress', 'In progress'], ['hired', 'Hired'], ['pool', 'Talent pool'], ['cancelled', 'Cancelled'], ['archived', 'Archived']].map(([k, t]) => `<button class="chip-btn soft ${fd.status.includes(k) ? 'on' : ''}" data-act="pf-status" data-v="${k}" aria-pressed="${fd.status.includes(k)}">${fd.status.includes(k) ? '<i class="ri-check-line"></i>' : ''}${t}</button>`).join('')}</div></div>
      <div class="dlg-foot"><button class="btn text" style="color:var(--error);margin-right:auto" data-act="pf-clear">Clear all</button><button class="btn outlined lg" data-act="close-modal">Close</button><button class="btn primary lg" data-act="pf-apply">Apply filters</button></div>`); }
  chs['pf-rec'] = el => { App.ui.hrmRec = el.value; }; chs['pf-stype'] = el => { fd.stageType = el.value; drawFilter(); }; chs['pf-src'] = el => { fd.source = el.value; drawFilter(); };
  chs['pf-rate'] = el => { fd.rating = +el.value; drawFilter(); }; chs['pf-gender'] = el => { fd.gender = el.value; drawFilter(); };
  ins['pf-date'] = el => { fd[el.dataset.k] = el.value; };
  acts['pf-status'] = el => { const v = el.dataset.v; fd.status = fd.status.includes(v) ? fd.status.filter(x => x !== v) : [...fd.status, v]; if (!fd.status.length) fd.status = ['progress']; drawFilter(); };
  acts['pf-clear'] = () => { Object.assign(fd, { source: 'Any', rating: 0, gender: 'Any', status: ['progress', 'hired'], stageType: 'Any', from: '', to: '' }); drawFilter(); };
  acts['pf-apply'] = () => { Object.assign(pf, fd, { q: pf.q }); App.closeModal(); App.render(); const n = activeFilters(); App.snack(n ? `${n} filter${n > 1 ? 's' : ''} applied.` : 'Filters cleared.', 'info'); };
})();

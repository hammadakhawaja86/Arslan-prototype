/* Settings → CRM Configuration: lead statuses, recovery actions, campaign pipeline. Edits are staged until Save Changes. */
(function () {
  const { S, esc, acts, ins, chs } = App;
  const meta = { key: 'crm-config', icon: 'ri-equalizer-line', title: 'CRM Configuration' };
  const TONES = [['t-grey', 'Grey'], ['t-orange', 'Orange'], ['t-blue', 'Blue'], ['t-green', 'Green'], ['t-red', 'Red'], ['t-purple', 'Purple'], ['t-teal', 'Teal']];
  const TABS = { statuses: ['Lead statuses', 'statuses'], actions: ['Recovery actions', 'actions'], pipeline: ['Campaign pipeline', 'stages'] };
  const clone = () => ({ statuses: S.statuses.map(x => ({ ...x })), actions: S.actions.map(x => ({ ...x })), stages: S.stages.map(x => ({ ...x })), moves: [] });
  let W = clone(), dirty = false, tab = 'statuses';
  const markDirty = () => { dirty = true; const b = App.$('#dirty'); if (b) b.hidden = false; const s = App.$('#save-btn'); if (s) s.disabled = false; };
  const leadsWith = id => S.leads.filter(l => l.status === id).length;

  const SUB = ['Business Profile', 'Notifications & Reminders', 'Templates', 'My Service & Packages', 'Roles & Permissions', 'Portal Settings', 'Measurements', 'Email Configuration', 'Activity Logs', 'Payments Settings'];
  App.route('/settings/crm/:tab', t => { tab = TABS[t] ? t : 'statuses';
    return `${App.head([['CRM', '#/leads'], ['CRM Configuration']], 'CRM Configuration', 'Choose the statuses, recovery actions and pipeline stages your team uses. Changes apply to everyone.',
      `<span class="dirty-bar" id="dirty" ${dirty ? '' : 'hidden'}><i class="ri-error-warning-line"></i>Unsaved changes</span><button class="btn outlined lg" data-act="set-cancel">Cancel</button><button class="btn primary lg" id="save-btn" data-act="set-save" ${dirty ? '' : 'disabled'}><i class="ri-save-3-line"></i>Save Changes</button>`)}
    <div>
      <section class="card card-pad stack g16"><div class="seg" role="tablist" aria-label="CRM configuration">${Object.entries(TABS).map(([k, [t]]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-go="#/settings/crm/${k}">${t}</button>`).join('')}</div>
      ${({ statuses, actions, pipeline })[tab]()}</section></div>`; }, meta);

  const rowActs = (kind, x, del = true) => `<span class="row-actions"><button class="icon-btn s20" data-act="set-edit" data-kind="${kind}" data-id="${x.id}" aria-label="Edit ${esc(x.name)}"><i class="ri-pencil-line"></i></button>${del && !x.locked ? `<button class="icon-btn s20 danger" data-act="set-del" data-kind="${kind}" data-id="${x.id}" aria-label="Delete ${esc(x.name)}"><i class="ri-delete-bin-line"></i></button>` : `<span class="icon-btn s20" style="visibility:hidden"></span>`}</span>`;
  const table = (cols, body, addLabel, kind, foot) => `<div class="row between wrap g8"><p class="body2 muted" style="margin:0">${foot}</p><button class="btn outlined" data-act="set-add" data-kind="${kind}"><i class="ri-add-line"></i>${addLabel}</button></div>
    <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th style="width:32px"></th>${cols.map(c => `<th>${c}</th>`).join('')}<th style="text-align:right">Action</th></tr></thead><tbody data-sort="${kind}">${body}</tbody></table></div></div>
    <p class="caption" style="margin:0"><i class="ri-draggable"></i> Drag rows to change the order they appear in pickers and on the board.</p>`;
  const handle = (kind, i) => `<td><span class="drag-handle" draggable="true" data-drag="${kind}" data-i="${i}" aria-label="Drag to reorder"><i class="ri-draggable"></i></span></td>`;

  function statuses() { return table(['Status', 'What it means', 'Applies to', 'In status picker'], W.statuses.map((s, i) => `<tr data-row="${i}">${handle('statuses', i)}<td>${App.chip(s.name, s.tone, 'sm filled')}</td><td class="muted">${esc(s.meaning)}</td><td>${esc(s.applies === 'All' ? 'Leads & clinicians' : s.applies)}</td>
    <td>${s.locked ? '<span class="caption">Always on</span>' : App.sw(s.shown, `data-ch="set-sw" data-kind="statuses" data-k="shown" data-id="${s.id}"`, `Show ${s.name} in the status picker`)}</td><td style="text-align:right">${rowActs('statuses', s)}</td></tr>`).join(''), 'Add status', 'statuses', 'Statuses you can set on a lead. Shown statuses become columns on the pipeline board.'); }
  function actions() { return table(['Action', 'Helper text', 'Required', 'Shown on lead'], W.actions.map((a, i) => `<tr data-row="${i}">${handle('actions', i)}<td><span class="row g8"><i class="${a.icon}" style="color:var(--primary);font-size:18px"></i>${esc(a.name)}${a.custom ? ' ' + App.chip('Custom', 't-grey', 'sm') : ''}</span></td><td class="muted">${esc(a.helper)}</td>
    <td>${App.sw(a.required, `data-ch="set-sw" data-kind="actions" data-k="required" data-id="${a.id}"`, `${a.name} required`)}</td><td>${App.sw(a.shown, `data-ch="set-sw" data-kind="actions" data-k="shown" data-id="${a.id}"`, `Show ${a.name} on lead`)}</td><td style="text-align:right">${rowActs('actions', a)}</td></tr>`).join(''), 'Add action', 'actions', 'The checklist your team ticks off on each lead’s profile.'); }
  function pipeline() { return table(['Stage', 'What it means', 'Counts as', 'On the board'], W.stages.map((s, i) => `<tr data-row="${i}">${handle('stages', i)}<td>${App.chip(s.name, s.tone, 'sm filled')}</td><td class="muted">${esc(s.meaning)}</td><td>${esc(s.counts)}</td>
    <td>${s.locked ? '<span class="caption">Always on</span>' : App.sw(s.shown, `data-ch="set-sw" data-kind="stages" data-k="shown" data-id="${s.id}"`, `Show ${s.name} on the board`)}</td><td style="text-align:right">${rowActs('stages', s)}</td></tr>`).join(''), 'Add stage', 'pipeline', 'The stages a campaign moves through from draft to result.'); }
  const list = kind => W[kind === 'pipeline' ? 'stages' : kind];
  chs['set-sw'] = el => { const x = list(el.dataset.kind).find(y => y.id === el.dataset.id); x[el.dataset.k] = el.checked; markDirty(); };

  /* drag-to-reorder rows */
  let dr = null;
  document.addEventListener('dragstart', e => { const h = e.target.closest?.('[data-drag]'); if (!h) return; dr = { kind: h.dataset.drag, i: +h.dataset.i }; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'row'); h.closest('tr').style.opacity = .4; });
  document.addEventListener('dragover', e => { if (!dr) return; const tr = e.target.closest?.('tbody[data-sort] tr'); if (tr) { e.preventDefault(); App.$$('tbody[data-sort] tr').forEach(r => r.style.boxShadow = ''); tr.style.boxShadow = 'inset 0 2px 0 var(--primary)'; } });
  document.addEventListener('drop', e => { if (!dr) return; const tr = e.target.closest?.('tbody[data-sort] tr'); if (!tr) return; e.preventDefault(); const arr = list(dr.kind === 'stages' ? 'pipeline' : dr.kind); const to = +tr.dataset.row; const [x] = arr.splice(dr.i, 1); arr.splice(to, 0, x); dr = null; App.render(); markDirty(); });
  document.addEventListener('dragend', () => { if (dr) { dr = null; App.render(); } });

  /* save / cancel */
  acts['set-save'] = () => { S.statuses.splice(0, S.statuses.length, ...W.statuses); S.actions.splice(0, S.actions.length, ...W.actions); S.stages.splice(0, S.stages.length, ...W.stages);
    W.moves.forEach(([from, to]) => S.leads.forEach(l => { if (l.status === from) l.status = to; }));
    const moved = W.moves.length; W = clone(); dirty = false; App.render(); App.snack(`CRM configuration saved.${moved ? ' Leads were moved to their new status.' : ''} Leads and the pipeline board now use it.`); };
  acts['set-cancel'] = () => { if (!dirty) { App.snack('No changes to discard.', 'info'); return; } W = clone(); dirty = false; App.render(); App.snack('Changes discarded.', 'info'); };
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* add / edit drawers */
  let ed = null;
  acts['set-add'] = el => { const k = el.dataset.kind;
    ed = { kind: k, isNew: true, x: k === 'actions' ? { id: 'a' + Date.now(), name: '', helper: '', icon: 'ri-checkbox-circle-line', required: false, shown: true, custom: true, applies: 'All leads and clinicians' }
      : k === 'statuses' ? { id: 'st' + Date.now(), name: '', meaning: '', picker: '', tone: 't-blue', applies: 'All', shown: true } : { id: 'sg' + Date.now(), name: '', meaning: '', counts: 'Active', tone: 't-blue', shown: true, pos: W.stages.length + 1 }, tried: false }; drawEd(); };
  acts['set-edit'] = el => { const k = el.dataset.kind; const arr = list(k); const i = arr.findIndex(y => y.id === el.dataset.id); ed = { kind: k, isNew: false, x: { ...arr[i], pos: i + 1 }, tried: false }; drawEd(); };
  function drawEd() { const { kind, isNew, x } = ed; const noun = { statuses: 'status', actions: 'recovery action', pipeline: 'pipeline stage' }[kind]; const bad = ed.tried && !x.name.trim();
    const colour = kind !== 'actions' ? `<div class="stack g8"><span class="sub2">Colour</span><div class="swatches" role="radiogroup" aria-label="Colour">${TONES.map(([t, n]) => `<button class="${t} ${x.tone === t ? 'on' : ''}" role="radio" aria-checked="${x.tone === t}" aria-label="${n}" data-act="ed-tone" data-v="${t}"></button>`).join('')}</div><div>${App.chip(x.name || 'Preview', x.tone, 'filled')}</div></div>` : '';
    const body = kind === 'statuses' ? `${colour}${App.field('What it means', `<textarea rows="2" data-in="ed" data-k="meaning" placeholder="Shown under the name in the status picker">${esc(x.meaning)}</textarea>`, { cls: 'multi' })}${App.select('Applies to', 'ed-applies', [{ v: 'All', t: 'Leads & clinicians' }, { v: 'Leads', t: 'Leads only' }, { v: 'Clinicians', t: 'Clinicians only' }], x.applies)}
        ${x.locked ? '' : `<div class="toggle-card"><div><b>Show in the status picker</b><span class="caption">Hidden statuses stay on existing leads but can’t be picked</span></div>${App.sw(x.shown, 'data-ch="ed-sw" data-k="shown"', 'Show in the status picker')}</div>`}`
      : kind === 'actions' ? `${App.field('Helper text', `<input data-in="ed" data-k="helper" value="${esc(x.helper)}" placeholder="e.g. Printed letter sent by post">`)}${App.select('Applies to', 'ed-applies', ['All leads and clinicians', 'Leads only', 'Clinicians only'], x.applies || 'All leads and clinicians')}
        <div class="toggle-card"><div><b>Required</b><span class="caption">Counts towards “X of Y done” on the lead</span></div>${App.sw(x.required, 'data-ch="ed-sw" data-k="required"', 'Required')}</div><div class="toggle-card"><div><b>Show on lead</b><span class="caption">Appears in Recovery Actions on every lead profile</span></div>${App.sw(x.shown, 'data-ch="ed-sw" data-k="shown"', 'Show on lead')}</div>`
      : `${colour}${App.field('What it means', `<textarea rows="2" data-in="ed" data-k="meaning">${esc(x.meaning)}</textarea>`, { cls: 'multi' })}${App.select('Counts as', 'ed-counts', ['Not started', 'Active', 'Won', 'Closed'], x.counts)}
        ${App.select('Position on the board', 'ed-pos', Array.from({ length: W.stages.length + (isNew ? 1 : 0) }, (_, i) => ({ v: String(i + 1), t: `${i + 1}${['st', 'nd', 'rd'][i] || 'th'} of ${W.stages.length + (isNew ? 1 : 0)}` })), String(x.pos))}
        ${x.locked ? '' : `<div class="toggle-card"><div><b>Show on the board</b><span class="caption">Hidden stages still count in reports</span></div>${App.sw(x.shown, 'data-ch="ed-sw" data-k="shown"', 'Show on the board')}</div>`}`;
    App.drawer(`${App.dlgHead((isNew ? 'Add ' : 'Edit ') + noun)}<div class="dlg-body">
      <div class="stack g4">${App.field('Name', `<input data-in="ed" data-k="name" value="${esc(x.name)}" placeholder="${kind === 'actions' ? 'e.g. Posted a letter' : 'e.g. Deposit pending'}" ${x.locked ? 'disabled' : ''}>`, { req: true, cls: bad ? 'err' : x.locked ? 'dis' : '' })}${bad ? '<p class="helper err">Give it a name</p>' : x.locked ? '<p class="helper">This one is built in, so its name can’t change.</p>' : ''}</div>${body}</div>
      <div class="dlg-foot">${!isNew && !x.locked ? `<button class="btn text danger-link" style="color:var(--error)" data-act="set-del" data-kind="${kind}" data-id="${x.id}"><i class="ri-delete-bin-line"></i>Delete</button>` : ''}<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="ed-save">${isNew ? 'Add ' + (kind === 'actions' ? 'action' : kind === 'statuses' ? 'status' : 'stage') : 'Save changes'}</button></div>`);
    if (bad) App.$('.drawer input[data-k=name]')?.focus(); }
  ins.ed = el => { ed.x[el.dataset.k] = el.value; if (el.dataset.k === 'name' && ed.kind !== 'actions') { const c = App.$('.drawer .swatches + div .chip'); if (c) c.textContent = el.value || 'Preview'; } };
  chs['ed-sw'] = el => { ed.x[el.dataset.k] = el.checked; };
  chs['ed-applies'] = el => { ed.x.applies = el.value; }; chs['ed-counts'] = el => { ed.x.counts = el.value; }; chs['ed-pos'] = el => { ed.x.pos = +el.value; };
  acts['ed-tone'] = el => { ed.x.tone = el.dataset.v; drawEd(); };
  acts['ed-save'] = () => { const { kind, isNew, x } = ed; if (!x.name.trim()) { ed.tried = true; drawEd(); return; }
    x.name = x.name.trim(); if (kind === 'statuses') x.picker = x.meaning;
    const arr = list(kind); const { pos, ...item } = x;
    if (isNew) arr.push(item); else arr.splice(arr.findIndex(y => y.id === x.id), 1, item);
    if (kind === 'pipeline' && pos) { const i = arr.findIndex(y => y.id === x.id); const [m] = arr.splice(i, 1); arr.splice(pos - 1, 0, m); }
    App.closeModal(); App.render(); markDirty(); App.snack(`${isNew ? 'Added' : 'Updated'} “${x.name}”. Save Changes to apply it.`, 'info'); };

  /* delete */
  acts['set-del'] = el => { const k = el.dataset.kind; const x = list(k).find(y => y.id === el.dataset.id);
    if (k !== 'statuses') { App.dialog(`${App.dlgHead(`Delete “${esc(x.name)}”?`, '', 'ri-delete-bin-line')}<div class="dlg-body"><p class="body2 muted" style="margin:0">${k === 'actions' ? 'It will disappear from every lead’s Recovery Actions. Past ticks stay in the activity log.' : 'Campaigns in this stage will move to the previous stage.'}</p></div><div class="dlg-foot"><button class="btn outlined" data-act="close-modal">Cancel</button><button class="btn danger" data-act="del-go" data-kind="${k}" data-id="${x.id}">Delete</button></div>`, { width: 440 }); return; }
    const n = leadsWith(x.id); const others = W.statuses.filter(s => s.id !== x.id && s.shown);
    App.dialog(`${App.dlgHead(`Delete “${esc(x.name)}”?`, n ? `${n} lead${n === 1 ? ' has' : 's have'} this status` : 'No leads have this status', 'ri-delete-bin-line')}<div class="dlg-body">
      ${n ? App.select(`Move those ${n} lead${n === 1 ? '' : 's'} to`, 'del-move', others.map(s => ({ v: s.id, t: s.name })), 'new') : ''}
      <div class="al"><i class="ri-error-warning-line"></i><div class="txt">This can’t be undone once you save. The status is removed from the picker, the board and filters.</div></div></div>
      <div class="dlg-foot"><button class="btn outlined" data-act="close-modal">Cancel</button><button class="btn danger" data-act="del-go" data-kind="statuses" data-id="${x.id}">Delete status</button></div>`, { width: 460 }); };
  acts['del-go'] = el => { const k = el.dataset.kind; const arr = list(k); const i = arr.findIndex(y => y.id === el.dataset.id); const [x] = arr.splice(i, 1);
    if (k === 'statuses' && leadsWith(x.id)) W.moves.push([x.id, App.$('[data-ch=del-move]')?.value || 'new']);
    App.closeModal(); App.render(); markDirty(); App.snack(`“${x.name}” removed. Save Changes to apply it.`, 'info'); };
})();

/* Private Business vertical › Business Management (Figma 6377:36589): business list + archived tab, archive / unarchive,
   onboard a new business (logo, details, location, points of contact, opening hours) → success → complete the profile
   (SLA, workforce allocation, appointment types, slot durations). A profile is complete once it has SLA dates and at least
   one service with an enabled default appointment type; incomplete ones are flagged in the list. */
(function () {
  const { esc, acts, ins, chs } = App, VH = App.VH;
  const BASE = '#/private/business-management';
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SERVICES = ['GP Consultation', 'Weight Management', 'Blood Tests', 'Health Letters', 'Physiotherapy', 'Mental Health Review'];
  const TYPES = [['walkin', 'Walk-in'], ['f2f', 'Face-to-Face'], ['call', 'Call']];
  const TODAY = '2026-10-29';
  const BM = App.ui.bm || (App.ui.bm = { tab: 'list', q: '', mgr: 'All', sort: 'added', dir: -1, page: 1, per: 10 });
  let D = null, E = null, errs = {};   // D: new-business draft, E: copy of the business being edited

  const blank = () => ({ name: '', mgr: '', cqc: '', phone: '', email: '', web: '', desc: '', img: null, file: null,
    loc: { a1: '', a2: '', town: '', pc: '', country: 'United Kingdom' }, poc: [{ name: '', phone: '', email: '', role: '', desc: '' }],
    hours: DAYS.map((d, i) => ({ open: i > 0, from: '08:00', to: '20:00' })), sla: { start: '', end: '' },
    wf: [{ role: '', freq: '', hours: '' }], appts: [{ svc: '', types: { walkin: false, f2f: false, call: false }, def: '' }], slots: [{ role: '', svc: '', type: '', mins: '' }] });
  // fill in the profile for the seeded businesses
  const full = b => { if (b.loc) return b; const x = blank(), n = (b.name.length * 7919) % 900000 + 100000; delete x.mgr; delete x.email; delete x.img;
    Object.assign(b, x, { name: b.name, cqc: '1-' + n + '0', phone: '+44 20 7946 ' + String(n).slice(-4), web: `https://${b.ws}.co.uk`, desc: `${b.name} is a private clinic on the Aqlios platform.`,
      loc: { a1: (n % 90 + 1) + ' Harley Street', a2: '', town: 'London', pc: 'W1G ' + (n % 9 + 1) + 'PF', country: 'United Kingdom' }, poc: [{ name: b.mgr, phone: '+44 7700 900' + String(n).slice(-3), email: b.email, role: 'Business Manager', desc: '' }] });
    if (b.complete !== false) Object.assign(b, { sla: { start: '2025-01-01', end: '2027-12-31' }, wf: [{ role: 'Clinical', freq: 'Weekly', hours: '120' }],
      appts: [{ svc: 'GP Consultation', types: { walkin: false, f2f: true, call: true }, def: 'f2f' }], slots: [{ role: 'Clinician', svc: 'GP Consultation', type: 'Face-to-Face', mins: '15' }] });
    return b; };
  const done = b => !!(b.sla && b.sla.start && b.sla.end && b.appts.some(a => a.svc && a.def && a.types[a.def]));
  App.BIZ.forEach(b => { full(b); b.complete = done(b); });
  const dmy = d => d ? d.split('-').reverse().join('/') : '—';
  const get = (o, k) => k.split('.').reduce((a, p) => a == null ? a : a[p], o);
  const set = (o, k, v) => { const ps = k.split('.'), last = ps.pop(); ps.reduce((a, p) => a[p], o)[last] = v; };
  const cur = () => App.ui.bmMode === 'new' ? D : E;

  /* ---------- list ---------- */
  const rows = () => { const L = App.BIZ.filter(b => !!b.archived === (BM.tab === 'archived') && (!BM.q || (b.name + b.email).toLowerCase().includes(BM.q.toLowerCase())) && (BM.mgr === 'All' || b.mgr === BM.mgr));
    return L.sort((a, b) => (BM.sort === 'users' ? a.users - b.users : a.added.localeCompare(b.added)) * BM.dir); };
  const th = (k, t) => `<th class="sortable" data-act="bm-sort" data-k="${k}" aria-sort="${BM.sort === k ? (BM.dir > 0 ? 'ascending' : 'descending') : 'none'}">${t} <i class="${BM.sort === k ? (BM.dir > 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line') : 'ri-arrow-up-down-line'}"></i></th>`;
  App.route('/private/business-management', () => { const L = rows(), pages = Math.max(1, Math.ceil(L.length / BM.per)); BM.page = Math.min(BM.page, pages);
    const pg = L.slice((BM.page - 1) * BM.per, BM.page * BM.per), arch = BM.tab === 'archived', mgrs = [...new Set(App.BIZ.map(b => b.mgr))].sort();
    const n = App.BIZ.filter(b => !b.archived && !b.complete).length;
    return VH.frame('business-management', `<div class="aq-mh"><span class="aq-hic"><i class="ri-building-4-line"></i></span><div class="grow"><h1>Business Management</h1><span>Onboard, update and archive the businesses in this vertical.</span></div><a class="btn primary" href="${BASE}/new"><i class="ri-add-circle-line"></i>Onboard New Business</a></div>
      <div class="aq-tabs" role="tablist">${[['list', 'Business List', 'ri-building-4-line'], ['archived', 'Archived Business', 'ri-archive-line']].map(([k, t, i]) => `<button role="tab" aria-selected="${BM.tab === k}" class="${BM.tab === k ? 'on' : ''}" data-act="bm-tab" data-v="${k}"><i class="${i}"></i>${t}<span class="aq-cnt">${App.BIZ.filter(b => !!b.archived === (k === 'archived')).length}</span></button>`).join('')}</div>
      <div class="bm-card"><h2>${arch ? 'Archived Business' : 'Business List'}</h2>${!arch && n ? `<div class="bm-warn"><i class="ri-error-warning-line"></i><span><b>${n} business${n > 1 ? 'es have' : ' has'} an incomplete profile.</b> ROTA and booking stay limited until SLA dates and appointment types are set up.</span></div>` : ''}
        <div class="bm-filters">${App.field('Business Name', `<i class="ri-search-line"></i><input type="search" placeholder="Business Name" value="${esc(BM.q)}" data-in="bm-q" aria-label="Search by business name">`)}
          ${App.field('Business Manager', `<select data-ch="bm-mgr" aria-label="Business manager"><option ${BM.mgr === 'All' ? 'selected' : ''}>All</option>${mgrs.map(m => `<option ${m === BM.mgr ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>`, { cls: 'select' })}
          <button class="btn text" data-act="bm-clr" ${BM.q || BM.mgr !== 'All' ? '' : 'disabled'}><i class="ri-close-line"></i>Clear filters</button></div>
        <div class="table-card"><div class="table-scroll"><table class="dt bm-dt"><thead><tr><th>Business Name</th><th>Business Manager</th>${th('users', 'No. of Users')}${th('added', 'Date Added')}${arch ? '<th>Archived</th>' : ''}<th>Actions</th></tr></thead><tbody>
        ${pg.map(b => { const warn = !arch && !b.complete; return `<tr class="click ${warn ? 'bm-inc' : ''}" data-go="${BASE}/${b.id}"><td><div class="bm-nm">${warn ? '<i class="ri-error-warning-line" title="Profile incomplete" aria-label="Profile incomplete"></i>' : ''}<span><b>${esc(b.name)}</b><small>${esc(b.email)}</small></span></div></td><td>${esc(b.mgr)}</td><td>${b.users}</td><td>${dmy(b.added)}</td>${arch ? `<td><span class="cell2"><span>${dmy(b.archived.at)}</span><small class="caption">${esc(b.archived.why)}</small></span></td>` : ''}
          <td><div class="row g4"><a class="icon-btn s20" href="${BASE}/${b.id}" aria-label="View ${esc(b.name)}" title="View"><i class="ri-eye-line"></i></a>${arch ? `<button class="icon-btn s20 bm-unarch" data-act="bm-unarch" data-id="${b.id}" aria-label="Unarchive ${esc(b.name)}" title="Unarchive"><i class="ri-inbox-unarchive-line"></i></button>` : `<button class="icon-btn s20 bm-arch" data-act="bm-arch" data-id="${b.id}" aria-label="Archive ${esc(b.name)}" title="Archive"><i class="ri-archive-line"></i></button>`}</div></td></tr>`; }).join('')
          || `<tr class="empty-row"><td colspan="${arch ? 6 : 5}">${BM.q || BM.mgr !== 'All' ? 'No businesses match these filters.' : arch ? 'No archived businesses.' : 'No businesses yet. Onboard your first one.'}</td></tr>`}</tbody></table></div>
        <div class="aq-pager"><label>Rows per page: <select data-ch="bm-per">${[5, 10, 25].map(x => `<option ${x === BM.per ? 'selected' : ''}>${x}</option>`).join('')}</select></label><span>${L.length ? (BM.page - 1) * BM.per + 1 : 0}–${Math.min(BM.page * BM.per, L.length)} of ${L.length}</span>
          <button class="icon-btn s20" data-act="bm-pg" data-d="-1" ${BM.page === 1 ? 'disabled' : ''} aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></button><button class="icon-btn s20" data-act="bm-pg" data-d="1" ${BM.page === pages ? 'disabled' : ''} aria-label="Next page"><i class="ri-arrow-right-s-line"></i></button></div></div></div>`,
      [['Business Management', BASE], [arch ? 'Archived Business' : 'Business List']]); }, { key: 'portal', portal: true, icon: 'ri-building-4-line', title: 'Business Management' });
  acts['bm-tab'] = el => { BM.tab = el.dataset.v; BM.page = 1; App.render(); };
  acts['bm-sort'] = el => { const k = el.dataset.k; BM.dir = BM.sort === k ? -BM.dir : -1; BM.sort = k; App.render(); };
  acts['bm-pg'] = el => { BM.page += +el.dataset.d; App.render(); };
  acts['bm-clr'] = () => { BM.q = ''; BM.mgr = 'All'; BM.page = 1; App.render(); };
  chs['bm-mgr'] = el => { BM.mgr = el.value; BM.page = 1; App.render(); };
  chs['bm-per'] = el => { BM.per = +el.value; BM.page = 1; App.render(); };
  ins['bm-q'] = el => { BM.q = el.value; BM.page = 1; const p = el.selectionStart; App.render(); const i = App.$('[data-in="bm-q"]'); i.focus(); i.setSelectionRange(p, p); };

  /* ---------- archive / unarchive ---------- */
  const WHY = ['The business is no longer operational.', 'The data is no longer needed actively.', 'We’ve merged with another business.', 'I’m testing or cleaning up accounts.', 'Other'];
  let AR = null;
  const archDlg = () => { const b = VH.byId(AR.id);
    App.dialog(App.PT.modal('ri-archive-line', 'Archive Business', '', `<div class="bm-arch-txt"><p>Are you sure you want to archive <b>${esc(b.name)}</b>?</p><p>Archiving this business will immediately deactivate it and remove access to all operational modules. This will result in:</p>
      <ul><li>Staff <b>losing access</b> to this practice</li><li>Patients no longer being associated with the practice</li><li>Rota allocations and future appointments being <b>revoked</b></li></ul>
      <p>Historical data will be safely retained for audit and reporting purposes.</p><p>This action can be reversed later by unarchiving the business, however previous staff, patient, rota and appointment associations will need to be reassigned manually.</p></div>
      <fieldset class="bm-why"><legend>Will you help us learn why?</legend>${WHY.map(w => `<label class="bm-radio"><input type="radio" name="bm-why" value="${esc(w)}" data-ch="bm-why" ${AR.why === w ? 'checked' : ''}><span>${esc(w)}</span></label>`).join('')}</fieldset>
      ${AR.why === 'Other' ? `<div>${App.field('Reason', `<textarea rows="3" id="bm-why-txt" placeholder="Tell us why" data-in="bm-why-t">${esc(AR.txt)}</textarea>`, { req: true, cls: 'multi' + (AR.err === 'txt' ? ' err' : '') })}${AR.err === 'txt' ? '<p class="helper err">Tell us why you’re archiving this business</p>' : ''}</div>` : ''}${AR.err === 'why' ? '<p class="helper err" style="margin:0">Choose a reason to continue</p>' : ''}`,
      '<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn lg bm-orange" data-act="bm-arch-go">Archive business</button>', 'orange'), { width: 540 }); };
  acts['bm-arch'] = el => { AR = { id: el.dataset.id, why: '', txt: '', err: '' }; archDlg(); };
  chs['bm-why'] = el => { AR.why = el.value; AR.err = ''; archDlg(); if (AR.why === 'Other') App.$('#bm-why-txt')?.focus(); };
  ins['bm-why-t'] = el => { AR.txt = el.value; };
  acts['bm-arch-go'] = () => { if (!AR.why) { AR.err = 'why'; return archDlg(); } if (AR.why === 'Other' && !AR.txt.trim()) { AR.err = 'txt'; archDlg(); return App.$('#bm-why-txt').focus(); }
    const b = VH.byId(AR.id); b.archived = { why: AR.why === 'Other' ? AR.txt.trim() : AR.why, at: TODAY }; if (App.bizId === b.id) VH.setBiz(null);
    App.closeModal(); App.render(); App.snack(`${b.name} archived. You can restore it from Archived Business.`); };
  acts['bm-unarch'] = el => { const b = VH.byId(el.dataset.id);
    App.dialog(App.PT.modal('ri-inbox-unarchive-line', `Unarchive ${esc(b.name)}?`, '', `<p class="body2" style="margin:0">The business becomes active again and shows in Private Business. Staff, patients, rota allocations and appointments from before it was archived aren’t restored — reassign them from the business dashboard.</p>`,
      `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="bm-unarch-go" data-id="${b.id}">Unarchive business</button>`, 'green'), { width: 480 }); };
  acts['bm-unarch-go'] = el => { const b = VH.byId(el.dataset.id); delete b.archived; App.closeModal(); App.render(); App.snack(`${b.name} is active again.`); };

  /* ---------- form pieces ---------- */
  const F = (o, label, k, opt = {}) => { const v = get(o, k) ?? '', err = errs[k];
    const inner = opt.area ? `<textarea rows="3" data-in="bm-f" data-k="${k}" placeholder="${esc(opt.ph || '')}">${esc(v)}</textarea>`
      : opt.sel ? `<select data-ch="bm-f" data-k="${k}" ${opt.r ? 'data-r="1"' : ''}><option value="" ${v ? '' : 'selected'} disabled>${esc(opt.ph || 'Select')}</option>${opt.sel.map(x => `<option ${String(x) === String(v) ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`
      : `<input type="${opt.type || 'text'}" data-in="bm-f" data-k="${k}" value="${esc(v)}" placeholder="${esc(opt.ph || '')}" ${opt.attrs || ''}>`;
    return `<div class="bm-fld ${opt.span ? 'span' : ''}">${App.field(label, inner, { req: opt.req, cls: (opt.area ? 'multi ' : '') + (opt.sel ? 'select ' : '') + (err ? 'err' : '') })}${err ? `<p class="helper err">${err}</p>` : opt.help ? `<p class="helper">${opt.help}</p>` : ''}</div>`; };
  const sec = (o, k, icon, title, body, extra = '', tag = '') => { const open = o.ui.open[k], bad = !open && Object.keys(errs).some(e => SECOF(e) === k);
    return `<section class="bm-sec ${open ? 'open' : ''} ${bad ? 'bad' : ''}"><div class="bm-sh"><button type="button" class="bm-tog" data-act="bm-tog" data-k="${k}" aria-expanded="${!!open}"><i class="${icon}"></i><h3>${title}${tag}</h3>${bad ? '<span class="bm-badge">Needs attention</span>' : ''}</button>${extra}<button type="button" class="icon-btn s20" data-act="bm-tog" data-k="${k}" aria-label="${open ? 'Collapse' : 'Expand'} ${title}"><i class="${open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i></button></div>${open ? `<div class="bm-sb">${body}</div>` : ''}</section>`; };
  const SECOF = k => /^(name|mgr|cqc|phone|email|web)$/.test(k) ? 'details' : k.startsWith('loc.') ? 'loc' : k.startsWith('poc.') ? 'poc' : k.startsWith('hours.') ? 'hours' : k.startsWith('sla.') ? 'sla' : k.startsWith('wf.') ? 'wf' : k.startsWith('appts.') ? 'ap' : k.startsWith('slots.') ? 'sl' : '';
  const subcard = (icon, title, body, del, open = true, tog = '') => `<div class="bm-sub"><div class="bm-subh">${tog ? `<button type="button" class="bm-tog" data-act="${tog}" aria-expanded="${open}"><i class="${icon}"></i><span>${title}</span></button>` : `<span class="bm-tog"><i class="${icon}"></i><span>${title}</span></span>`}<span class="grow"></span>${del || ''}${tog ? `<button type="button" class="icon-btn s20" data-act="${tog}" aria-label="${open ? 'Collapse' : 'Expand'} ${title}"><i class="${open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i></button>` : ''}</div>${open ? `<div class="bm-subb">${body}</div>` : ''}</div>`;
  const delBtn = (l, i, what) => `<button type="button" class="icon-btn s20 bm-del" data-act="bm-del" data-l="${l}" data-i="${i}" aria-label="Remove ${what}"><i class="ri-delete-bin-6-line"></i></button>`;
  const addLink = (l, t) => `<button type="button" class="btn text sm brand bm-add" data-act="bm-add" data-l="${l}"><i class="ri-add-circle-line"></i>${t}</button>`;

  const basics = o => sec(o, 'details', 'ri-building-line', 'Business Details', `<div class="bm-grid">${F(o, 'Business Name', 'name', { req: true, ph: 'Enter business name (must be unique)' })}${F(o, 'Business Manager Name', 'mgr', { req: true, ph: 'Enter business manager name' })}
      ${F(o, 'CQC No', 'cqc', { req: true, span: true, ph: 'e.g. 1-1234567890' })}${F(o, 'Phone Number', 'phone', { type: 'tel', ph: '+44' })}${F(o, 'Email Address', 'email', { type: 'email', ph: 'contact@business.com' })}
      ${F(o, 'Website', 'web', { span: true, ph: 'https://' })}${F(o, 'Business Description', 'desc', { span: true, area: true, ph: 'Brief description of your business and services…' })}</div>`)
    + sec(o, 'loc', 'ri-map-pin-line', App.ui.bmMode === 'new' ? 'Location' : 'Location', `<div class="bm-grid">${F(o, 'Address Line 1', 'loc.a1', { req: true, span: true })}${F(o, 'Address Line 2', 'loc.a2', { span: true })}${F(o, 'Town', 'loc.town', { req: true })}${F(o, 'Postcode', 'loc.pc', { req: true })}${F(o, 'Country', 'loc.country', { req: true, span: true, sel: ['United Kingdom', 'Ireland'] })}</div>`)
    + sec(o, 'poc', 'ri-user-line', 'Point of contact', o.poc.map((p, i) => subcard('ri-user-line', p.name ? esc(p.name) : 'Person ' + (i + 1), `<div class="bm-grid">${F(o, 'Name', `poc.${i}.name`, { req: true })}${F(o, 'Contact No', `poc.${i}.phone`, { req: true, type: 'tel' })}${F(o, 'Email', `poc.${i}.email`, { req: true, type: 'email' })}${F(o, 'Role', `poc.${i}.role`, { req: true, ph: 'e.g. Operations Manager' })}${F(o, 'Description', `poc.${i}.desc`, { span: true, area: true, ph: 'Brief description of their responsibilities…' })}</div>`,
        o.poc.length > 1 ? delBtn('poc', i, 'person ' + (i + 1)) : '', o.ui.poc[i] !== false, `bm-poc" data-i="${i}`)).join(''), `<button type="button" class="btn outlined sm pt-dark bm-pocadd" data-act="bm-add" data-l="poc"><i class="ri-add-circle-line"></i>Add Another POC</button>`)
    + sec(o, 'hours', 'ri-time-line', 'Operating Hours', `<div class="bm-hours">${o.hours.map((h, i) => `<div class="bm-day"><b>${DAYS[i]}</b><label class="bm-open">${App.sw(h.open, `data-ch="bm-f" data-k="hours.${i}.open" data-r="1"`, DAYS[i] + ' open')}<span>${h.open ? 'Open' : 'Closed'}</span></label>
      ${h.open ? `<div class="bm-times ${errs['hours.' + i] ? 'err' : ''}">${App.field('', `<input type="time" data-in="bm-f" data-k="hours.${i}.from" value="${h.from}" aria-label="${DAYS[i]} opening time">`, { cls: 'sm' })}<span>to</span>${App.field('', `<input type="time" data-in="bm-f" data-k="hours.${i}.to" value="${h.to}" aria-label="${DAYS[i]} closing time">`, { cls: 'sm' })}${errs['hours.' + i] ? `<p class="helper err">${errs['hours.' + i]}</p>` : ''}</div>` : ''}</div>`).join('')}</div>`);
  const logoZone = o => o.file ? `<div class="bm-logo-z"><div class="bm-file">${o.img ? `<img src="${o.img}" alt="">` : `<span class="bm-ext">${esc(o.file.ext)}</span>`}<div class="grow"><b>${esc(o.file.name)}</b><small>${o.file.kb} KB${o.file.w ? ` · ${o.file.w}×${o.file.h}px` : ''} · <i class="ri-checkbox-circle-fill"></i> Completed</small>${o.file.warn ? `<small class="bm-logo-warn"><i class="ri-error-warning-line"></i>${esc(o.file.warn)} You can still save it.</small>` : ''}</div><button type="button" class="icon-btn s20" data-act="bm-logo-x" aria-label="Remove logo"><i class="ri-delete-bin-6-line"></i></button></div></div>`
    : `<label class="bm-logo-z drop"><i class="ri-image-add-line"></i><b>Upload business logo</b><small>PNG, JPG or SVG · up to 2 MB · shown on the Private Business tiles</small><span class="btn outlined sm pt-dark">Browse File</span><input type="file" hidden accept="image/png,image/jpeg,image/svg+xml" data-ch="bm-logo"></label>`;

  const extra = o => `<div class="bm-div"><span>Additional Configuration</span></div>`
    + sec(o, 'sla', 'ri-file-shield-2-line', 'SLA Configuration', `<div class="bm-grid">${F(o, 'SLA Start Date', 'sla.start', { req: true, type: 'date', help: 'Can’t be more than 20 years in the past' })}${F(o, 'SLA End Date', 'sla.end', { req: true, type: 'date', help: 'Must be after the start date and in the future' })}</div>`)
    + sec(o, 'wf', 'ri-team-line', 'Workforce Allocation Configuration', o.wf.map((w, i) => subcard('ri-user-line', 'Workforce Allocation ' + (i + 1), `<div class="bm-grid c3">${F(o, 'Role', `wf.${i}.role`, { req: true, sel: ['Clinical', 'Nursing', 'Admin', 'Reception'] })}${F(o, 'Frequency', `wf.${i}.freq`, { req: true, sel: ['Weekly', 'Monthly'] })}${F(o, 'Hours', `wf.${i}.hours`, { req: true, type: 'number', ph: 'e.g. 8.00', attrs: 'min="0" step="0.5"' })}</div>`, delBtn('wf', i, 'allocation ' + (i + 1)))).join('') + addLink('wf', 'Add hours for another role'), '', ' <small class="bm-opt">(Optional)</small>')
    + sec(o, 'ap', 'ri-calendar-check-line', 'Appointment Type Configuration', `<div class="bm-note"><i class="ri-alert-line"></i>Only enabled appointment types will be available for booking. You must configure at least one appointment type as default.</div>`
      + o.appts.map((a, i) => subcard('ri-time-line', a.svc ? esc(a.svc) : 'Service ' + (i + 1), `${F(o, 'Services', `appts.${i}.svc`, { req: true, sel: SERVICES, r: true, ph: 'Choose a service' })}<div class="bm-types ${errs['appts.' + i + '.types'] ? 'err' : ''}">${TYPES.map(([k, t]) => `<div class="bm-type ${a.types[k] ? 'on' : ''}"><label class="cbx"><input type="checkbox" data-ch="bm-f" data-k="appts.${i}.types.${k}" data-r="1" ${a.types[k] ? 'checked' : ''}>${t}</label><span class="grow"></span>${a.def === k ? '<span class="bm-def">Default</span>' : `<button type="button" class="btn outlined sm pt-dark" data-act="bm-def" data-i="${i}" data-v="${k}">Set as Default</button>`}</div>`).join('')}</div>${errs['appts.' + i + '.types'] ? `<p class="helper err">${errs['appts.' + i + '.types']}</p>` : ''}`, o.appts.length > 1 ? delBtn('appts', i, 'service ' + (i + 1)) : '')).join('') + addLink('appts', 'Add another appointment category'), '', ' <small class="bm-man">(Mandatory)</small>')
    + sec(o, 'sl', 'ri-timer-line', 'Slot Duration Configuration', `<p class="caption" style="margin:0 0 4px">Configure slot durations per Practice + Role + Appointment Type combination.</p>` + o.slots.map((x, i) => subcard('ri-time-line', 'Slot Duration ' + (i + 1), `<div class="bm-grid c4">${F(o, 'Role', `slots.${i}.role`, { req: true, sel: ['Clinician', 'Nurse', 'Pharmacist', 'Admin'] })}${F(o, 'Service', `slots.${i}.svc`, { req: true, sel: SERVICES })}${F(o, 'Appointment Type', `slots.${i}.type`, { sel: TYPES.map(t => t[1]) })}${F(o, 'Duration (minutes)', `slots.${i}.mins`, { sel: [10, 15, 20, 30, 45, 60] })}</div>`, delBtn('slots', i, 'slot duration ' + (i + 1)))).join('') + addLink('slots', 'Add another slot duration configuration'), '', ' <small class="bm-opt">(Optional)</small>');

  /* ---------- onboard ---------- */
  const startNew = () => { D = blank(); D.ui = { open: { details: true, loc: true, poc: true, hours: true }, poc: [] }; errs = {}; };
  App.route('/private/business-management/new', () => { App.ui.bmMode = 'new'; if (!D) startNew();
    return VH.frame('business-management', `<form class="bm-form" onsubmit="return false" novalidate><a class="bm-goback" href="${BASE}"><i class="ri-arrow-left-s-line"></i>Go Back</a>
      <div class="bm-head"><span class="aq-hic sm"><i class="ri-building-line"></i></span><div class="grow"><h1>Business information</h1><p>Enter your practice information manually to onboard your business.</p></div><div class="stack g4" style="align-items:flex-end"><button class="btn primary" data-act="bm-create">Save Changes</button><button type="button" class="btn text sm brand" data-act="bm-sample"><i class="ri-magic-line"></i>Fill sample details</button></div></div>
      ${logoZone(D)}${basics(D)}</form>`, [['Business Management', BASE], ['Add New Business']]); }, { key: 'portal', portal: true, icon: 'ri-building-4-line', title: 'Add New Business' });
  App.route('/private/business-management/done/:id', id => { const b = VH.byId(id); if (!b) { location.replace('#' + BASE.slice(1)); return ''; }
    return VH.frame('business-management', `<div class="bm-done"><span class="bm-tick"><i class="ri-check-line"></i><i class="ri-sparkling-2-fill"></i></span><h1>Business Onboarded Successfully!</h1><p>${esc(b.name)} has been added to the platform and is now ready to use.</p>
      <div class="bm-done-box"><p>To enable ROTA management and scheduling, we need a few more business details. Completing the business profile allows us to:</p><ul><li>Configure rotas accurately</li><li>Assign staff and roles correctly</li><li>Ensure smooth scheduling and day-to-day operations</li></ul><p>You can complete this now or return later, but ROTA features will remain limited until the profile is completed.</p></div>
      <div class="row g12 wrap" style="justify-content:center"><a class="btn primary" href="${BASE}/${b.id}?setup">Complete Business Profile</a><a class="btn outlined pt-dark" href="${BASE}">Back to Business List</a></div></div>`, [['Business Management', BASE], ['Add New Business']]); },
    { key: 'portal', portal: true, icon: 'ri-building-4-line', title: 'Business onboarded' });

  /* ---------- business profile ---------- */
  App.route('/private/business-management/:id', id => { const b = VH.byId(id); if (!b) { location.replace('#' + BASE.slice(1)); return ''; } App.ui.bmMode = 'edit';
    if (!E || E.id !== id) { E = JSON.parse(JSON.stringify(full(b))); const all = !!b.archived; E.ui = { open: { details: all, loc: all, poc: all, hours: all, sla: true, wf: true, ap: true, sl: true }, poc: E.poc.map(() => true) }; errs = {}; }
    const ro = !!b.archived, ok = done(E), at = new Date(b.at || b.added + 'T09:00');
    return VH.frame('business-management', `<form class="bm-form" onsubmit="return false" novalidate><div class="row between"><a class="bm-goback" href="${BASE}"><i class="ri-arrow-left-s-line"></i>Go Back</a>${ro ? '<span class="bm-chip grey"><i class="ri-archive-line"></i>Archived</span>' : ok ? '<span class="bm-chip green"><i class="ri-checkbox-circle-line"></i>Profile Complete</span>' : '<span class="bm-chip orange"><i class="ri-error-warning-line"></i>Profile Incomplete</span>'}</div>
      <div class="bm-head"><span class="bm-hlogo">${VH.logo(b.id, 120, 48)}</span><div class="grow"><h1>Business Information</h1><p>${ro ? 'This business is archived. Unarchive it to make changes.' : 'Update business information and configure additional settings.'}</p><small class="caption"><i class="ri-calendar-line"></i> Onboarded on ${at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${at.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}</small></div>
        ${ro ? `<button class="btn primary" data-act="bm-unarch" data-id="${b.id}"><i class="ri-inbox-unarchive-line"></i>Unarchive</button>` : '<button class="btn primary" data-act="bm-save">Save Changes</button>'}</div>
      ${!ro && !ok ? '<div class="bm-warn"><i class="ri-error-warning-line"></i><span><b>Finish the profile to unlock ROTA and booking.</b> Add SLA dates and at least one service with a default appointment type below.</span></div>' : ''}
      <fieldset class="bm-fs" ${ro ? 'disabled' : ''}>${basics(E)}${extra(E)}</fieldset></form>`, [['Business Management', BASE], [b.name]]); },
    { key: 'portal', portal: true, icon: 'ri-building-4-line', title: 'Business Information' });

  /* ---------- form events ---------- */
  const clearErr = (el, k) => { if (!errs[k]) return; delete errs[k]; const f = el.closest('.bm-fld'); f?.querySelector('.field')?.classList.remove('err'); f?.querySelector('.helper.err')?.remove(); };
  const keepScroll = () => { const y = scrollY; App.render(); scrollTo(0, y); };
  ins['bm-f'] = el => { const o = cur(), k = el.dataset.k; set(o, k, el.value); clearErr(el, k); if (/^hours\.\d+\./.test(k)) delete errs[k.replace(/\.(from|to)$/, '')]; };
  chs['bm-f'] = el => { const o = cur(), k = el.dataset.k, v = el.type === 'checkbox' ? el.checked : el.value; set(o, k, v); clearErr(el, k);
    const m = k.match(/^appts\.(\d+)\.types\.(\w+)$/); if (m) { const a = o.appts[m[1]]; if (!v && a.def === m[2]) a.def = ''; if (v && !a.def) a.def = m[2]; delete errs[`appts.${m[1]}.types`]; }
    if (el.dataset.r) keepScroll(); };
  acts['bm-tog'] = el => { const o = cur(); o.ui.open[el.dataset.k] = !o.ui.open[el.dataset.k]; keepScroll(); };
  acts['bm-poc'] = el => { const o = cur(), i = +el.dataset.i; o.ui.poc[i] = o.ui.poc[i] === false; keepScroll(); };
  acts['bm-def'] = el => { const a = cur().appts[el.dataset.i]; a.types[el.dataset.v] = true; a.def = el.dataset.v; delete errs[`appts.${el.dataset.i}.types`]; keepScroll(); };
  const NEW = { poc: () => ({ name: '', phone: '', email: '', role: '', desc: '' }), wf: () => ({ role: '', freq: '', hours: '' }), appts: () => ({ svc: '', types: { walkin: false, f2f: false, call: false }, def: '' }), slots: () => ({ role: '', svc: '', type: '', mins: '' }) };
  acts['bm-add'] = el => { const o = cur(), l = el.dataset.l; o[l].push(NEW[l]()); if (l === 'poc') { o.ui.open.poc = true; o.ui.poc = o.poc.map((p, i) => i === o.poc.length - 1); } keepScroll(); };
  acts['bm-del'] = el => { const o = cur(), l = el.dataset.l, i = +el.dataset.i; o[l].splice(i, 1); if (l === 'poc') o.ui.poc.splice(i, 1); errs = Object.fromEntries(Object.entries(errs).filter(([k]) => !k.startsWith(l + '.'))); keepScroll(); };
  chs['bm-logo'] = el => { const f = el.files[0]; if (!f) return; if (f.size > 2 * 1024 * 1024) return App.snack('That file is over 2 MB. Choose a smaller logo.', 'error');
    const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onerror = () => App.snack('That file isn’t a readable image. Try a PNG, JPG or SVG.', 'error');
      im.onload = () => { const o = cur(), w = im.naturalWidth, h = im.naturalHeight, r = w / h; o.img = rd.result; o.file = { name: f.name, kb: Math.max(1, Math.round(f.size / 1024)), ext: (f.name.split('.').pop() || 'IMG').toUpperCase(), w, h };
        o.file.warn = !/svg/i.test(f.type) && w < 300 && h < 300 ? `This logo is only ${w}×${h}px, so it may look blurry. A logo at least 400px wide works best.` : r > 6 ? `This logo is very wide (${w}×${h}px). It will be shown small to fit the tile; a version with the name on two lines reads better.` : r < .6 ? `This logo is very tall (${w}×${h}px). A square or wide version reads better on tiles.` : '';
        keepScroll(); }; im.src = rd.result; }; rd.readAsDataURL(f); };
  acts['bm-logo-x'] = () => { const o = cur(); o.img = null; o.file = null; keepScroll(); };
  acts['bm-sample'] = () => { Object.assign(D, { name: 'Riverside Physio', mgr: 'Hannah Okafor', cqc: '1-2045531870', phone: '+44 161 496 0321', email: 'hello@riversidephysio.co.uk', web: 'https://riversidephysio.co.uk', desc: 'Sports and musculoskeletal physiotherapy clinic.',
      loc: { a1: '14 Quay Street', a2: 'Unit 3', town: 'Manchester', pc: 'M3 3HN', country: 'United Kingdom' }, poc: [{ name: 'Hannah Okafor', phone: '+44 7700 900412', email: 'hannah@riversidephysio.co.uk', role: 'Operations Manager', desc: '' }] }); errs = {}; keepScroll(); App.snack('Sample details filled in. Upload a logo if you like, then save.', 'info'); };

  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
  const checkBasics = (o, selfId) => { const e = {}, need = (k, m) => { if (!String(get(o, k) ?? '').trim()) e[k] = m; };
    need('name', 'Enter the business name'); if (o.name.trim() && App.BIZ.some(b => b.id !== selfId && b.name.toLowerCase() === o.name.trim().toLowerCase())) e.name = 'A business with this name already exists';
    need('mgr', 'Enter the business manager’s name'); need('cqc', 'Enter the CQC number'); if (o.email && !EMAIL.test(o.email)) e.email = 'Enter a valid email address'; if (o.web && !/^https?:\/\/\S+\.\S+/.test(o.web)) e.web = 'Enter a full web address starting with https://';
    need('loc.a1', 'Enter the first line of the address'); need('loc.town', 'Enter the town'); need('loc.pc', 'Enter the postcode'); need('loc.country', 'Choose the country');
    o.poc.forEach((p, i) => { need(`poc.${i}.name`, 'Enter their name'); need(`poc.${i}.phone`, 'Enter a contact number'); need(`poc.${i}.email`, 'Enter their email'); if (p.email && !EMAIL.test(p.email)) e[`poc.${i}.email`] = 'Enter a valid email address'; need(`poc.${i}.role`, 'Enter their role'); });
    o.hours.forEach((h, i) => { if (h.open && h.from >= h.to) e['hours.' + i] = 'Closing time must be after opening time'; });
    return e; };
  const checkExtra = o => { const e = {}, { start, end } = o.sla;
    if (start || end) { if (!start) e['sla.start'] = 'Enter the SLA start date'; if (!end) e['sla.end'] = 'Enter the SLA end date'; }
    if (start && start < '2006-10-29') e['sla.start'] = 'Can’t be more than 20 years in the past'; if (end && start && end <= start) e['sla.end'] = 'Must be after the start date'; else if (end && end <= TODAY) e['sla.end'] = 'Must be a future date';
    o.wf.forEach((w, i) => { if (w.role || w.freq || w.hours) ['role', 'freq', 'hours'].forEach(k => { if (!w[k]) e[`wf.${i}.${k}`] = 'Required'; }); });
    o.appts.forEach((a, i) => { const any = TYPES.some(([k]) => a.types[k]); if (any && !a.svc) e[`appts.${i}.svc`] = 'Choose the service'; if (a.svc && !any) e[`appts.${i}.types`] = 'Enable at least one appointment type'; else if (a.svc && !a.def) e[`appts.${i}.types`] = 'Set one enabled type as the default'; });
    o.slots.forEach((x, i) => { if (x.role || x.svc || x.type || x.mins) { if (!x.role) e[`slots.${i}.role`] = 'Required'; if (!x.svc) e[`slots.${i}.svc`] = 'Required'; } });
    return e; };
  const fail = o => { const n = Object.keys(errs).length; Object.keys(errs).forEach(k => { const s = SECOF(k); if (s) o.ui.open[s] = true; const m = k.match(/^poc\.(\d+)/); if (m) o.ui.poc[m[1]] = true; });
    App.render(); App.snack(`Check ${n} field${n > 1 ? 's' : ''} highlighted in red.`, 'error'); App.$('.bm-form .field.err, .bm-form .bm-types.err, .bm-form .bm-times.err')?.scrollIntoView({ block: 'center' }); App.$('.bm-form .field.err input, .bm-form .field.err select, .bm-form .field.err textarea')?.focus({ preventScroll: true }); };
  const strip = o => { const x = JSON.parse(JSON.stringify(o)); delete x.ui; return x; };
  acts['bm-create'] = () => { errs = checkBasics(D); if (Object.keys(errs).length) return fail(D);
    const x = strip(D), id = 'b' + Date.now().toString(36), name = x.name.trim();
    const b = Object.assign(x, { id, name, ws: name.toLowerCase().replace(/[^a-z0-9]/g, ''), users: 1 + x.poc.length, added: TODAY, at: new Date().toISOString(), email: x.email || x.poc[0].email, wf: [], slots: [] });
    b.complete = done(b); App.BIZ.push(b); D = null; App.go(`${BASE}/done/${id}`); App.snack('Business created successfully'); };
  acts['bm-save'] = () => { const b = VH.byId(E.id); errs = Object.assign(checkBasics(E, b.id), checkExtra(E)); if (Object.keys(errs).length) return fail(E);
    const x = strip(E); x.name = x.name.trim(); x.wf = x.wf.filter(w => w.role); x.slots = x.slots.filter(s => s.role); Object.assign(b, x, { ws: x.name.toLowerCase().replace(/[^a-z0-9]/g, '') }); b.complete = done(b);
    E = null; App.render(); App.snack(b.complete ? `${b.name} saved. The profile is complete, so ROTA and booking are unlocked.` : `${b.name} saved. The profile is still incomplete — add SLA dates and a default appointment type.`, b.complete ? 'success' : 'info'); };
  // leaving the form drops unsaved edits; a fresh visit starts clean
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/private/business-management/new')) D = null; if (E && !location.hash.startsWith(`${BASE}/${E.id}`)) E = null; });
})();

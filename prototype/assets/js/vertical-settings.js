/* Private Business vertical › Settings: sub-navigation + four configuration pages that apply to every business in the vertical.
   Edits go into a draft; Cancel / Save Changes enable only once something changed. */
(function () {
  const { esc, acts, ins, chs, S } = App, VH = App.VH;
  const BASE = '#/private/settings';
  const TABS = [['practice', 'Global Practice Configuration', 'Practice'], ['appointment', 'Global Appointment Configuration', 'Appointments'], ['competency', 'Competency', 'Competency'], ['pathway', 'Pathway Configuration', 'Pathways']];
  const TYPES = [['f2f', 'Face-to-Face'], ['call', 'Call'], ['video', 'Video'], ['walkin', 'Walk-in']];
  const ROLES = ['Clinician', 'Nurse', 'Pharmacist', 'Receptionist', 'Business Manager'];
  const VS = S.vset = S.vset || {
    types: { f2f: false, call: true, video: true, walkin: false }, def: 'call',
    slots: [{ role: 'Clinician', type: 'Face-to-Face', mins: '30' }, { role: 'Nurse', type: 'Call', mins: '15' }],
    booking: { window: '60', notice: '24', cancel: '24', online: true, waitlist: false, double: false },
    appt: { remEmail: true, remEmailH: '48', remSms: true, remSmsH: '24', noShow: '15', followUp: '14', autoConfirm: true, notes: true },
    comps: [{ id: 'c1', name: 'Basic Life Support (BLS)', roles: ['Clinician', 'Nurse'], months: '12' }, { id: 'c2', name: 'Safeguarding Adults Level 2', roles: ['Clinician', 'Nurse', 'Receptionist'], months: '36' }, { id: 'c3', name: 'Information Governance', roles: ['Clinician', 'Nurse', 'Pharmacist', 'Receptionist', 'Business Manager'], months: '12' }, { id: 'c4', name: 'Prescribing competency', roles: ['Clinician', 'Pharmacist'], months: '24' }],
    paths: [{ id: 'p1', name: 'Weight management (GLP-1)', steps: ['Eligibility check', 'Initial consultation', 'Prescription', 'Monthly review'], on: true }, { id: 'p2', name: 'ADHD assessment', steps: ['Screening form', 'Assessment', 'Diagnosis report', 'Titration'], on: true }, { id: 'p3', name: 'Fit to fly', steps: ['Request', 'Consultation', 'Health letter'], on: false }] };
  let D = null, OPEN = { types: true, slots: true, booking: true, rem: true, att: true }, err = {};
  const draft = () => D || (D = JSON.parse(JSON.stringify(VS)));
  const dirty = () => D && JSON.stringify(D) !== JSON.stringify(VS);
  const keep = () => { const y = scrollY; App.render(); scrollTo(0, y); };
  const sec = (k, icon, title, tag, body, extra = '') => `<section class="bm-sec vs-sec ${OPEN[k] ? 'open' : ''}"><div class="bm-sh"><button type="button" class="bm-tog" data-act="vs-tog" data-k="${k}" aria-expanded="${!!OPEN[k]}"><i class="${icon}"></i><h3>${title}${tag ? ` <small class="${tag === 'Mandatory' ? 'bm-man' : 'bm-opt'}">(${tag})</small>` : ''}</h3></button>${extra}<button type="button" class="icon-btn s20" data-act="vs-tog" data-k="${k}" aria-label="${OPEN[k] ? 'Collapse' : 'Expand'} ${title}"><i class="${OPEN[k] ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i></button></div>${OPEN[k] ? `<div class="bm-sb">${body}</div>` : ''}</section>`;
  const num = (label, k, unit, help) => `<div class="bm-fld">${App.field(label, `<input type="number" min="0" data-in="vs-f" data-k="${k}" value="${esc(k.split('.').reduce((a, p) => a[p], draft()))}"><span class="adorn">${unit}</span>`, { cls: err[k] ? 'err' : '' })}${err[k] ? `<p class="helper err">${err[k]}</p>` : help ? `<p class="helper">${help}</p>` : ''}</div>`;
  const tog = (label, k, help) => `<label class="vs-tg"><span class="grow"><b>${label}</b>${help ? `<small>${help}</small>` : ''}</span>${App.sw(k.split('.').reduce((a, p) => a[p], draft()), `data-ch="vs-sw" data-k="${k}"`, label)}</label>`;
  const sel = (label, k, opts, req) => `<div class="bm-fld">${App.field(label, `<select data-ch="vs-sel" data-k="${k}">${opts.map(o => `<option ${String(o) === String(k.split('.').reduce((a, p) => a[p], draft())) ? 'selected' : ''}>${o}</option>`).join('')}</select>`, { req, cls: 'select' })}</div>`;

  /* Settings rows: label + description on the left, control on the right, hairline between rows (reference layout). */
  const row = (label, desc, ctrl, cls = '') => `<div class="vs2-row ${cls}"><div class="vs2-l"><b>${label}</b>${desc ? `<span>${desc}</span>` : ''}</div><div class="vs2-c">${ctrl}</div></div>`;
  const val = k => k.split('.').reduce((a, p) => a[p], draft());
  const nIn = (k, unit, w = 40) => `<label class="vs2-num ${err[k] ? 'err' : ''}"><input type="number" min="0" data-in="vs-f" data-k="${k}" value="${esc(val(k))}" style="width:${w}px" aria-label="${unit}"><span>${unit}</span></label>`;
  const sw = (k, label) => App.sw(val(k), `data-ch="vs-sw" data-k="${k}"`, label);
  const sel2 = (k, opts, label) => `<select class="vs2-sel" data-ch="vs-sel" data-k="${k}" aria-label="${label}">${opts.map(o => `<option ${String(o) === String(val(k)) ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  const group = (title, desc, rows, extra = '') => `<section class="vs2-g"><div class="vs2-gh"><div><h3>${title}</h3>${desc ? `<p>${desc}</p>` : ''}</div>${extra}</div>${rows}</section>`;
  let EDIT = {};
  const pages = {
    practice: d => { const on = TYPES.filter(([k]) => d.types[k]);
      return group('Appointment types', 'Only enabled types can be booked. One enabled type must be the default.', TYPES.map(([k, t]) => row(t, { f2f: 'In-person consultation at the practice', call: 'Telephone consultation', video: 'Video consultation from the patient portal', walkin: 'No booking needed, seen on arrival' }[k],
          `${d.types[k] ? (d.def === k ? '<span class="vs2-def">Default</span>' : `<button type="button" class="vs2-link" data-act="vs-def" data-v="${k}">Set as default</button>`) : '<span class="vs2-off">Off</span>'}${App.sw(d.types[k], `data-ch="vs-type" value="${k}"`, t + ' enabled')}`)).join('') + (err.types ? `<p class="helper err vs2-err">${err.types}</p>` : ''))
      + group('Slot durations', 'Override how long an appointment lasts for a role and appointment type. Everything else uses 15 minutes.', d.slots.map((x, i) => row(`${sel2(`slots.${i}.role`, ROLES, 'Role')}<i class="ri-arrow-right-s-line vs2-sep"></i>${sel2(`slots.${i}.type`, on.length ? on.map(t => t[1]) : ['—'], 'Appointment type')}`, '', `${nIn(`slots.${i}.mins`, 'min')}<button type="button" class="icon-btn s20 vs2-x" data-act="vs-slotx" data-i="${i}" aria-label="Remove this slot duration"><i class="ri-delete-bin-6-line"></i></button>`, 'vs2-slot')).join(''),
          '<button type="button" class="btn outlined sm vs2-btn" data-act="vs-slot"><i class="ri-add-line"></i>Add slot</button>')
      + group('Booking rules', '', row('Booking window', 'How far ahead patients can book', nIn('booking.window', 'days')) + row('Minimum notice', 'The latest a patient can book before a slot starts', nIn('booking.notice', 'hours')) + row('Free cancellation', 'Patients can cancel without a fee up to this point', nIn('booking.cancel', 'hours'))
          + row('Online booking', 'Patients can book from the portal and website', sw('booking.online', 'Online booking')) + row('Waitlist when fully booked', 'Offer the next free slot automatically', sw('booking.waitlist', 'Waitlist')) + row('Double booking', 'Staff can place two patients in one slot', sw('booking.double', 'Double booking'))); },
    appointment: d => group('Reminders', 'Sent automatically before every appointment.', row('Email reminder', d.appt.remEmail ? 'Sent to the patient’s email address' : 'Off', `${d.appt.remEmail ? nIn('appt.remEmailH', 'hrs before') : ''}${sw('appt.remEmail', 'Email reminder')}`) + row('SMS reminder', d.appt.remSms ? 'Uses the SMS template from the Template Library' : 'Off', `${d.appt.remSms ? nIn('appt.remSmsH', 'hrs before') : ''}${sw('appt.remSms', 'SMS reminder')}`))
      + group('Attendance & follow-up', '', row('Mark as no-show after', 'If the patient hasn’t checked in by then', nIn('appt.noShow', 'min')) + row('Follow-up window', 'Suggested follow-up after a consultation', nIn('appt.followUp', 'days')) + row('Auto-confirm bookings', 'Otherwise staff confirm each booking', sw('appt.autoConfirm', 'Auto-confirm')) + row('Require consultation notes', 'An appointment can’t be completed without notes', sw('appt.notes', 'Require notes'))),
    competency: d => group('Required training', 'Staff Management flags anyone whose competency has expired.', d.comps.map((c, i) => row(`<input class="vs2-name ${err['comps.' + i] ? 'err' : ''}" data-in="vs-f" data-k="comps.${i}.name" value="${esc(c.name)}" placeholder="Competency name" aria-label="Competency name">`,
        `<span class="vs-roles">${ROLES.map(r => `<button type="button" class="vs-role ${c.roles.includes(r) ? 'on' : ''}" data-act="vs-crole" data-i="${i}" data-v="${r}" aria-pressed="${c.roles.includes(r)}">${r}</button>`).join('')}</span>`,
        `<span class="vs2-lab">Renew every</span>${nIn(`comps.${i}.months`, 'months')}<button type="button" class="icon-btn s20 vs2-x" data-act="vs-compx" data-i="${i}" aria-label="Delete ${esc(c.name)}"><i class="ri-delete-bin-6-line"></i></button>`)).join('') || '<p class="vs2-empty">No competencies yet.</p>',
      '<button type="button" class="btn outlined sm vs2-btn" data-act="vs-comp"><i class="ri-add-line"></i>Add competency</button>'),
    pathway: d => group('Care pathways', 'Each step becomes a stage on the patient’s request.', d.paths.map((p, i) => row(`<input class="vs2-name ${err['paths.' + i] ? 'err' : ''}" data-in="vs-f" data-k="paths.${i}.name" value="${esc(p.name)}" placeholder="Pathway name" aria-label="Pathway name">`,
        EDIT[p.id] ? `<ol class="vs2-steps">${p.steps.map((st, j) => `<li><span class="vs-n">${j + 1}</span><input data-in="vs-f" data-k="paths.${i}.steps.${j}" value="${esc(st)}" aria-label="Step ${j + 1}" placeholder="Step name"><button type="button" class="icon-btn s20" data-act="vs-stepx" data-i="${i}" data-j="${j}" aria-label="Remove step ${j + 1}" ${p.steps.length < 2 ? 'disabled' : ''}><i class="ri-close-line"></i></button></li>`).join('')}</ol><button type="button" class="vs2-link" data-act="vs-step" data-i="${i}"><i class="ri-add-line"></i>Add step</button>`
          : `<span class="vs2-trail">${p.steps.map(esc).join('<i class="ri-arrow-right-s-line"></i>')}</span>`,
        `<button type="button" class="btn outlined sm vs2-btn" data-act="vs-pedit" data-id="${p.id}">${EDIT[p.id] ? 'Done' : 'Edit steps'}</button>${sw(`paths.${i}.on`, 'Pathway active')}<button type="button" class="icon-btn s20 vs2-x" data-act="vs-pathx" data-i="${i}" aria-label="Delete pathway"><i class="ri-delete-bin-6-line"></i></button>`, p.on ? '' : 'off')).join('') || '<p class="vs2-empty">No pathways yet.</p>',
      '<button type="button" class="btn outlined sm vs2-btn" data-act="vs-path"><i class="ri-add-line"></i>Add pathway</button>')
  };
  const route = tab => { const t = TABS.find(x => x[0] === tab) || TABS[0], d = draft(), ch = dirty();
    return VH.frame('settings', `<div class="aq-mh"><span class="aq-hic"><i class="ri-settings-3-line"></i></span><div class="grow"><h1>Settings</h1><span>Applies to every business in the Private vertical.</span></div></div>
      <div class="vs2"><nav class="vs2-nav" aria-label="Settings sections">${TABS.map(([k, l, sh]) => `<a href="${BASE}/${k}" class="${k === t[0] ? 'on' : ''}" ${k === t[0] ? 'aria-current="page"' : ''} title="${l}">${sh}</a>`).join('')}</nav>
        <section class="vs2-body"><header class="vs2-head"><h2>${t[1]}</h2><span class="grow"></span>${ch ? '<span class="vs2-dirty">Unsaved changes</span>' : ''}<button class="btn outlined sm vs2-btn" data-act="vs-cancel" ${ch ? '' : 'disabled'}>Cancel</button><button class="btn primary sm vs2-btn" data-act="vs-save" ${ch ? '' : 'disabled'}>Save changes</button></header>
          ${pages[t[0]](d)}</section></div>`,
      [['Settings', BASE], [t[1]]]); };
  const meta = { key: 'portal', portal: true, icon: 'ri-settings-3-line', title: 'Settings' };
  App.route('/private/settings', () => route('practice'), meta);
  App.route('/private/settings/:tab', tab => route(tab), meta);
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith(BASE) && D) { D = null; err = {}; } });

  const setK = (k, v) => { const ps = k.split('.'), last = ps.pop(); ps.reduce((a, p) => a[p], draft())[last] = v; };
  const refreshBar = () => { const ch = dirty(); App.$$('[data-act=vs-save],[data-act=vs-cancel]').forEach(b => b.disabled = !ch); const h = App.$('.vs2-head'); if (h && !!App.$('.vs2-dirty') !== !!ch) { if (ch) h.querySelector('.grow').insertAdjacentHTML('afterend', '<span class="vs2-dirty">Unsaved changes</span>'); else App.$('.vs2-dirty')?.remove(); } };
  acts['vs-tog'] = el => { OPEN[el.dataset.k] = !OPEN[el.dataset.k]; keep(); };
  ins['vs-f'] = el => { setK(el.dataset.k, el.value); delete err[el.dataset.k]; delete err[el.dataset.k.split('.').slice(0, 2).join('.')]; el.closest('.field')?.classList.remove('err'); refreshBar(); };
  chs['vs-sel'] = el => { setK(el.dataset.k, el.value); keep(); };
  chs['vs-sw'] = el => { setK(el.dataset.k, el.checked); keep(); };
  chs['vs-type'] = el => { const d = draft(); d.types[el.value] = el.checked; if (!el.checked && d.def === el.value) d.def = (TYPES.find(([k]) => d.types[k]) || [''])[0]; if (el.checked && !d.def) d.def = el.value; delete err.types; keep(); };
  acts['vs-def'] = el => { const d = draft(); d.types[el.dataset.v] = true; d.def = el.dataset.v; delete err.types; keep(); };
  acts['vs-slot'] = () => { draft().slots.push({ role: 'Clinician', type: (TYPES.find(([k]) => draft().types[k]) || ['', 'Face-to-Face'])[1], mins: '15' }); OPEN.slots = true; keep(); };
  acts['vs-slotx'] = el => { draft().slots.splice(+el.dataset.i, 1); keep(); };
  acts['vs-comp'] = () => { draft().comps.push({ id: 'c' + Date.now(), name: '', roles: ['Clinician'], months: '12' }); keep(); App.$$('[data-k^="comps."][data-k$=".name"]').pop()?.focus(); };
  acts['vs-compx'] = el => { draft().comps.splice(+el.dataset.i, 1); keep(); };
  acts['vs-crole'] = el => { const c = draft().comps[+el.dataset.i], r = el.dataset.v; c.roles = c.roles.includes(r) ? c.roles.filter(x => x !== r) : [...c.roles, r]; keep(); };
  acts['vs-path'] = () => { const id = 'p' + Date.now(); draft().paths.push({ id, name: '', steps: ['First step'], on: true }); EDIT[id] = true; keep(); App.$$('[data-k^="paths."][data-k$=".name"]').pop()?.focus(); };
  acts['vs-pathx'] = el => { draft().paths.splice(+el.dataset.i, 1); keep(); };
  acts['vs-step'] = el => { draft().paths[+el.dataset.i].steps.push(''); keep(); };
  acts['vs-stepx'] = el => { draft().paths[+el.dataset.i].steps.splice(+el.dataset.j, 1); keep(); };
  acts['vs-pedit'] = el => { EDIT[el.dataset.id] = !EDIT[el.dataset.id]; keep(); };
  acts['vs-cancel'] = () => { D = null; err = {}; keep(); App.snack('Changes discarded.', 'info'); };
  acts['vs-save'] = () => { const d = draft(); err = {};
    if (!TYPES.some(([k]) => d.types[k])) err.types = 'Enable at least one appointment type'; else if (!d.def || !d.types[d.def]) err.types = 'Set one enabled type as the default';
    d.slots.forEach((x, i) => { if (!(+x.mins > 0)) err[`slots.${i}.mins`] = 'Enter minutes'; });
    [['booking.window', 'Enter days'], ['booking.notice', 'Enter hours'], ['booking.cancel', 'Enter hours']].forEach(([k, m]) => { if (k.split('.').reduce((a, p) => a[p], d) === '') err[k] = m; });
    d.comps.forEach((c, i) => { if (!c.name.trim() || !c.roles.length) err['comps.' + i] = 1; });
    d.paths.forEach((p, i) => { if (!p.name.trim() || p.steps.some(s => !s.trim())) err['paths.' + i] = 1; });
    if (Object.keys(err).length) { keep(); return App.snack('Fix the highlighted fields before saving. Check every settings section.', 'error'); }
    Object.keys(VS).forEach(k => VS[k] = d[k]); D = null; keep(); App.snack('Settings saved. They apply to every business in the Private vertical.'); };
})();

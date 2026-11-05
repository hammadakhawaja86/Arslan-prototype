/* EHR › Patients (Figma 1809:93795): list with invite status, sent invitations, archived, create patient (+ under-18 guardian), invite, patient overview. */
(function () {
  const { esc, acts, ins, chs } = App;
  const meta = { key: 'patients', icon: 'ri-user-line', title: 'Patients' };
  const TODAY = new Date(2026, 9, 20);
  const P = App.S.patients = [
    { id: 'p1', first: 'Emily', last: 'Carter', email: 'emilycarter@smilesunited.com', phone: '+44 20 7123 4569', dob: '1990-01-01', sex: 'Female', gender: 'Female', pronouns: 'She/Her', lastAppt: 'Fri, 15/03/2025', next: '', invite: 'active', joined: '03 Mar 2025', since: '2025-03-03', weight: '64 kg', height: '168 cm', eth: 'White British', addr: '123 High Street, Flat 4B', city: 'London', postcode: 'SW1A 1AA', contact: 'Phone' },
    { id: 'p2', first: 'Isabella', last: 'Nguyen', email: 'isabella.nguyen@smilesunited.com', phone: '+44 20 7567 8901', dob: '1995-07-14', sex: 'Female', gender: 'Female', pronouns: 'She/Her', lastAppt: 'Sun, 25/08/2024', next: '', invite: 'invited', sent: '18 Sep', note: 'expires in 5 days', since: '2024-08-20', weight: '58 kg', height: '162 cm', eth: 'Asian British', addr: '8 Elm Row', city: 'London', postcode: 'N1 7QP', contact: 'Email' },
    { id: 'p3', first: 'Sophia', last: 'Patel', email: 'sophia.patel@smilesunited.com', phone: '+44 20 7345 6789', dob: '1992-09-10', sex: 'Female', gender: 'Female', pronouns: 'She/Her', lastAppt: 'Thu, 30/11/2023', next: 'Mon, 30/11/2026', invite: 'active', joined: '12 Nov 2023', since: '2023-11-12', weight: '61 kg', height: '165 cm', eth: 'Indian', addr: '41 Bermondsey Street', city: 'London', postcode: 'SE1 3XF', contact: 'Phone' },
    { id: 'p4', first: 'Noah', last: 'Williams', email: 'noah.williams@smilesunited.com', phone: '+44 20 7456 7890', dob: '1988-03-12', sex: 'Male', gender: 'Male', pronouns: 'He/Him', lastAppt: 'Fri, 20/02/2026', next: '', invite: 'expired', sent: '02 Sep', note: 'no response', since: '2026-02-18', weight: '82 kg', height: '181 cm', eth: 'White British', addr: '2 Mill Lane', city: 'Leeds', postcode: 'LS1 4AB', contact: 'Email' },
    { id: 'p5', first: 'Harry', last: 'Styles', email: 'harrystyles@smilesunited.com', phone: '+44 20 7123 4569', dob: '1988-03-12', sex: 'Male', gender: 'Male', pronouns: 'He/Him', lastAppt: 'Fri, 20/02/2026', next: '', invite: 'invited', sent: '20 Sep', note: 'reminder sent', since: '2026-02-18', weight: '75 kg', height: '180 cm', eth: 'White British', addr: '19 Queen Street', city: 'Manchester', postcode: 'M2 5HX', contact: 'Phone' },
    { id: 'p6', first: 'Liam', last: 'Thompson', email: 'liam.thompson@smilesunited.com', phone: '+44 20 7234 5678', dob: '1985-05-22', sex: 'Male', gender: 'Male', pronouns: 'He/Him', lastAppt: 'Wed, 12/06/2024', next: '', invite: 'none', createdBy: 'Sana Bashir', created: '25 Apr 2026', since: '2024-06-10', weight: '88 kg', height: '177 cm', eth: 'White British', addr: '7 Kings Road', city: 'Bristol', postcode: 'BS1 4DJ', contact: 'Phone' },
    { id: 'p7', first: 'Abdur Rehman', last: 'Shamsi', email: 'abdur.shamsi@example.com', phone: '+44 7700 900123', dob: '2011-12-07', sex: 'Male', gender: 'Male', pronouns: 'He/Him', lastAppt: 'Mon, 14/09/2026', next: 'Sat, 25/10/2026', invite: 'active', joined: '25 Apr 2026', since: '2026-04-25', weight: '41 kg', height: '150 cm', eth: 'Pakistani', addr: '123 High Street, Flat 4B', city: 'London', postcode: 'SW1A 1AA', contact: 'Phone',
      guardian: { name: 'Ayesha Shamsi', rel: 'Mother', email: 'ayesha.shamsi@example.com', phone: '+44 7700 900456', same: true, consent: 'Consent to treat · signed 25 Apr 2026', comms: 'Yes — appointment reminders and results' } }
  ];
  const ARCH = App.S.patientsArchived = [
    ['Olivia', 'Hughes', 'olivia.hughes@smilesunited.com', '+44 20 7123 9081', '1990-01-01', '15/03/2025', '20/04/2026'], ['Ethan', 'Brooks', 'ethan.brooks@smilesunited.com', '+44 20 7567 2240', '1995-07-14', '25/08/2024', '10/09/2025'],
    ['Grace', 'Okafor', 'grace.okafor@smilesunited.com', '+44 20 7345 1172', '1992-09-10', '30/11/2023', '15/12/2024'], ['Mason', 'Clarke', 'mason.clarke@smilesunited.com', '+44 20 7456 3318', '1988-12-03', '20/02/2026', '05/04/2026']
  ].map(([first, last, email, phone, dob, invited, archived], i) => ({ id: 'a' + (i + 1), first, last, email, phone, dob, invited, archived, invite: 'archived' }));
  const pf = App.ui.patients = { q: '', date: '' };
  const name = p => p.first + ' ' + p.last;
  const pat = id => P.find(p => p.id === id) || ARCH.find(p => p.id === id);
  const age = dob => { if (!dob) return null; const d = new Date(dob); if (isNaN(d)) return null; let a = TODAY.getFullYear() - d.getFullYear(); const m = TODAY.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && TODAY.getDate() < d.getDate())) a--; return a; };
  const dmy = iso => iso ? iso.split('-').reverse().join('/') : '—';
  const longDob = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  /* invite status → chip + caption; one source of truth for list, header and actions */
  const INV = { active: ['Active', 't-green', 'ri-checkbox-circle-line'], invited: ['Invited', 't-orange', 'ri-time-line'], expired: ['Invite expired', 't-red', 'ri-error-warning-line'], none: ['Not invited', 't-grey', 'ri-send-plane-line'], archived: ['Inactive', 't-red', 'ri-error-warning-line'] };
  const invChip = p => { const [t, tone, i] = INV[p.invite]; return `<span class="chip sm filled ${tone}"><i class="${i}"></i>${t}</span>`; };
  const invNote = p => ({ active: `Joined ${p.joined}`, invited: `Sent ${p.sent} · ${p.note}`, expired: `Sent ${p.sent} · ${p.note}`, none: 'Created by staff · no account', archived: '' })[p.invite];
  /* the invite action as a status chip: same affordance as "Profile update to review", tone follows the status beside it */
  const INVACT = { invited: ['Resend invite', 'orange', 'ri-refresh-line'], expired: ['Resend invite', 'red', 'ri-refresh-line'], none: ['Send invite', 'blue', 'ri-send-plane-line'] };
  const invAct = p => { const a = INVACT[p.invite]; if (!a) return ''; const [t, tone, i] = a;
    return `<button class="pa-chip pa-act ${tone}" data-act="pt-invite" data-id="${p.id}" title="${t} for ${esc(name(p))}" aria-label="${t} for ${esc(name(p))}"><i class="${i}"></i>${t}</button>`; };
  const counts = () => ({ total: P.length, active: P.filter(p => p.invite === 'active').length, pending: P.filter(p => p.invite === 'invited').length });

  /* ---------- shared frame: breadcrumb + pill tabs + Create Patient ---------- */
  const TABS = [['list', 'Patients List', 'ri-group-line', '#/patients'], ['invites', 'Sent invitations', 'ri-history-line', '#/patients/invitations'], ['archived', 'Archived Patients', 'ri-archive-line', '#/patients/archived']];
  const frame = (tab, body) => { const t = TABS.find(x => x[0] === tab);
    return `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/patients">Patients</a><span>/</span><span class="cur">${t[1]}</span></nav>
    <div class="tabrow"><nav class="mtabs" aria-label="Patient lists">${TABS.map(([k, l, i, h]) => `<a href="${h}" class="${k === tab ? 'on' : ''}" ${k === tab ? 'aria-current="page"' : ''}><i class="${i}"></i>${l}</a>`).join('')}</nav>
      <button class="btn primary lg" data-go="#/patients/new"><i class="ri-add-circle-line"></i>Create Patient</button></div>
    <section class="card card-pad stack g16 pt-card"><h1 class="h6 hh1">${t[1]}</h1>${body}</section>`; };
  const filters = ph => `<div class="filters pt-filters">${App.field('Search', `<span class="adorn"><i class="ri-search-2-line"></i></span><input data-in="pt-q" value="${esc(pf.q)}" placeholder="${ph}">`, { cls: 'search' })}
    ${App.field('Date', `<input type="date" data-in="pt-date" value="${esc(pf.date)}" aria-label="Date">`)}<button class="clear-btn" data-act="pt-clear"><i class="ri-close-line"></i>Clear filters</button></div>`;
  const match = p => !pf.q || (name(p) + ' ' + p.email + ' ' + (p.phone || '')).toLowerCase().includes(pf.q.toLowerCase());
  const person = p => `<span class="cell2 pt-person"><a href="#/patients/${p.id}">${esc(name(p))}</a><small>${esc(p.email)}</small><small>${esc(p.phone || '')}</small></span>`;
  const empty = (cols, what) => `<tr class="empty-row"><td colspan="${cols}">No ${what} match your search. <button class="btn text brand sm" data-act="pt-clear">Clear filters</button></td></tr>`;

  /* ---------- Patients List ---------- */
  App.route('/patients', () => { const c = counts();
    return frame('list', `<div class="stats dstats3">${[['ri-group-line', 'Total Patients', c.total, ''], ['ri-user-follow-line', 'Active Patients', c.active, 'good'], ['ri-mail-line', 'Pending Invitations', c.pending, 'warn']].map(([i, t, n, k]) => `<div class="stat dstat pt-stat"><span class="dic"><i class="${i}"></i></span><span class="grow">${t}</span><span class="pt-num ${k} tnum">${n}</span></div>`).join('')}</div>
      ${filters('Search by name or email, phone')}
      <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Patient Detail</th><th>DOB</th><th>Last Appt <i class="ri-arrow-down-line"></i></th><th>Next Appt <i class="ri-arrow-down-line"></i></th><th>Status</th><th>Actions</th></tr></thead><tbody id="pt-rows">${listRows()}</tbody></table></div>${App.pager(Math.min(10, P.length), P.length)}</div>`); }, meta);
  function listRows() { const l = P.filter(match); if (!l.length) return empty(6, 'patients');
    return l.map(p => `<tr><td>${person(p)}</td><td class="tnum">${dmy(p.dob)}</td><td>${esc(p.lastAppt || '---')}</td><td>${esc(p.next || '---')}</td><td><span class="cell2">${invChip(p)}<small>${esc(invNote(p))}</small>${invAct(p)}${p.pending ? `<a class="pa-chip blue" href="#/patients/${p.id}" style="text-decoration:none;align-self:flex-start"><i class="ri-user-settings-line" style="margin-right:4px"></i>Profile update to review</a>` : ''}</span></td>
      <td><span class="row-actions">${p.invite === 'active' ? '' : `<button class="icon-btn s20 ${p.invite === 'none' ? '' : 'warn'}" data-act="pt-invite" data-id="${p.id}" aria-label="${p.invite === 'none' ? 'Send' : 'Resend'} invitation to ${esc(name(p))}" title="${p.invite === 'none' ? 'Send invitation' : 'Resend invitation'}"><i class="ri-send-plane-line"></i></button>`}
        <button class="icon-btn s20" data-go="#/patients/${p.id}" aria-label="View ${esc(name(p))}" title="View"><i class="ri-eye-line"></i></button><button class="icon-btn s20 warn" data-act="pt-archive" data-id="${p.id}" aria-label="Archive ${esc(name(p))}" title="Archive"><i class="ri-archive-line"></i></button></span></td></tr>`).join(''); }

  /* ---------- Sent invitations ---------- */
  App.route('/patients/invitations', () => frame('invites', `${filters('Search by email…')}
    <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Patient</th><th>DOB</th><th>Status</th><th>Invited Date <i class="ri-arrow-down-line"></i></th><th>Actions</th></tr></thead><tbody id="pt-rows">${inviteRows()}</tbody></table></div>${App.pager(invites().length, invites().length)}</div>`), meta);
  const invites = () => P.filter(p => p.invite === 'invited' || p.invite === 'expired');
  function inviteRows() { const l = invites().filter(match); if (!l.length) return empty(5, 'invitations');
    return l.map(p => `<tr><td>${person(p)}</td><td class="tnum">${dmy(p.dob)}</td><td><span class="cell2">${p.invite === 'invited' ? `<span class="chip sm filled t-orange"><i class="ri-time-line"></i>Pending</span>` : `<span class="chip sm filled t-red"><i class="ri-error-warning-line"></i>Expired</span>`}<small>${esc(p.note)}</small></span></td><td>${esc(p.sent)} 2026</td>
      <td><button class="btn outlined sm" data-act="pt-invite" data-id="${p.id}"><i class="ri-refresh-line"></i>Resend</button></td></tr>`).join(''); }

  /* ---------- Archived ---------- */
  App.route('/patients/archived', () => frame('archived', `${filters('Search by name or email, phone')}
    <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Patient Detail</th><th>DOB</th><th>Invited Date <i class="ri-arrow-down-line"></i></th><th>Archive Date <i class="ri-arrow-down-line"></i></th><th>Status</th><th>Actions</th></tr></thead><tbody id="pt-rows">${archRows()}</tbody></table></div>${App.pager(ARCH.length, ARCH.length)}</div>`), meta);
  function archRows() { const l = ARCH.filter(match); if (!l.length) return ARCH.length ? empty(6, 'archived patients') : `<tr class="empty-row"><td colspan="6">No archived patients.</td></tr>`;
    return l.map(p => `<tr><td>${person(p)}</td><td class="tnum">${dmy(p.dob)}</td><td class="tnum">${p.invited}</td><td class="tnum">${p.archived}</td><td>${invChip(p)}</td>
      <td><span class="row-actions"><button class="btn outlined sm" data-act="pt-restore" data-id="${p.id}"><i class="ri-inbox-unarchive-line"></i>Restore</button></span></td></tr>`).join(''); }

  const redraw = () => { const t = App.$('#pt-rows'); if (!t) return App.render(); const h = location.hash; t.innerHTML = h.endsWith('invitations') ? inviteRows() : h.endsWith('archived') ? archRows() : listRows(); };
  ins['pt-q'] = el => { pf.q = el.value; redraw(); };
  ins['pt-date'] = el => { pf.date = el.value; };
  acts['pt-clear'] = () => { pf.q = ''; pf.date = ''; App.render(); };

  /* ---------- archive / restore ---------- */
  acts['pt-archive'] = el => { const p = pat(el.dataset.id);
    App.dialog(`${App.dlgHead('Archive patient?', '', 'ri-archive-line')}<div class="dlg-body"><p class="body2 muted" style="margin:0">${esc(name(p))} will move to Archived Patients and won’t be able to sign in. Their record is kept and you can restore it at any time.</p></div><div class="dlg-foot"><button class="btn outlined" data-act="close-modal">Cancel</button><button class="btn primary" data-act="pt-archive-go" data-id="${p.id}">Archive</button></div>`, { width: 460 }); };
  acts['pt-archive-go'] = el => { const i = P.findIndex(p => p.id === el.dataset.id); const [p] = P.splice(i, 1); const a = { ...p, invited: dmy(p.since), archived: '20/10/2026', prev: p.invite, invite: 'archived' }; ARCH.unshift(a); App.closeModal();
    if (location.hash.startsWith('#/patients/p')) App.go('#/patients'); else App.render();
    App.snack(`${name(p)} archived.`, 'success', { label: 'Undo', fn: () => { ARCH.splice(ARCH.indexOf(a), 1); P.splice(i, 0, p); App.render(); } }); };
  acts['pt-restore'] = el => { const i = ARCH.findIndex(p => p.id === el.dataset.id); const [a] = ARCH.splice(i, 1); P.unshift({ ...a, invite: a.prev || 'none', next: a.next || '', since: a.since || '2025-01-01', createdBy: 'Muhammad Arslan', created: '20 Oct 2026', weight: a.weight || '—', height: a.height || '—', eth: a.eth || '—', addr: a.addr || '—', city: a.city || '—', postcode: a.postcode || '—', contact: a.contact || 'Email', gender: a.gender || '—', pronouns: a.pronouns || '—', sex: a.sex || '—' }); App.render(); App.snack(`${name(a)} restored to Patients List.`); };

  /* ---------- invite (send / resend) ---------- */
  const sentDialog = (email, minor) => App.dialog(`<div class="pt-sent"><span class="pt-sent-ic"><i class="ri-check-line"></i></span><h2 id="dlg-title">Invitation sent!</h2>
    <p>An invitation has been sent to <b>${esc(email)}</b> to join <b>LeafEase</b> as a <b>${minor ? 'parent or guardian' : 'Patient'}</b>.</p><p>They’ll receive an email with instructions to set up their account.</p>
    <button class="btn primary lg block" data-act="pt-done" autofocus>Done</button></div>`, { width: 520 });
  acts['pt-invite'] = el => { const p = pat(el.dataset.id); const resend = p.invite !== 'none'; p.invite = 'invited'; p.sent = '20 Oct'; p.note = resend ? 'resent today' : 'expires in 7 days';
    if (App.$('#pt-rows')) redraw(); else App.render(); sentDialog(p.guardian ? p.guardian.email : p.email, !!p.guardian); };
  acts['pt-done'] = () => { App.closeModal(); const go = App.ui.ptAfter; App.ui.ptAfter = null; if (go) App.go(go); };

  /* ---------- Create Patient (+ invitation, + under-18 guardian) ---------- */
  let f = null;
  const blank = () => ({ first: '', last: '', dob: '', sex: '', gender: '', email: '', phone: '', home: '', addr1: '', addr2: '', country: 'England', city: '', postcode: '', invite: true, g: { first: '', last: '', rel: '', email: '', phone: '', home: '', same: true, addr: '' }, tried: false });
  App.route('/patients/new', () => { const pre = App.ui.ptPrefill; if (pre) { f = Object.assign(blank(), pre); App.ui.ptPrefill = null; } if (!f) f = blank(); return createPage(); }, meta);
  const req = ['first', 'last', 'dob', 'sex', 'email', 'phone', 'addr1', 'city', 'postcode'];
  const greq = ['first', 'last', 'rel', 'email', 'phone'];
  const emailOk = v => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v);
  const missing = () => { const a = age(f.dob), minor = a != null && a < 18; return [...req.filter(k => k === 'email' ? !minor && !emailOk(f.email) : k === 'phone' ? !minor && !f.phone.trim() : !String(f[k]).trim()), ...(minor ? greq.filter(k => k === 'email' ? !emailOk(f.g.email) : !f.g[k].trim()).map(k => 'g.' + k) : [])]; };
  const tf = (label, k, o = {}) => { const g = k.startsWith('g.'), key = g ? k.slice(2) : k, v = g ? f.g[key] : f[key]; const bad = f.tried && missing().includes(k);
    return `<div class="stack g4">${App.field(label, `${o.tel ? '<span class="pt-cc" aria-hidden="true">🇬🇧 <i class="ri-arrow-down-s-fill"></i> +44</span>' : ''}<input ${o.type ? `type="${o.type}"` : ''} data-in="pf" data-k="${k}" value="${esc(v)}" placeholder="${o.ph || ''}" ${o.type === 'date' ? `max="${TODAY.toISOString().slice(0, 10)}"` : ''}>`, { req: o.req, cls: (bad ? 'err ' : '') + (o.cls || '') })}${bad ? `<p class="helper err">${o.msg || 'Required'}</p>` : ''}</div>`; };
  const sel = (label, k, opts, o = {}) => { const bad = f.tried && missing().includes(k); return `<div class="stack g4">${App.select(label, 'pf-sel', [{ v: '', t: 'Select…' }, ...opts], f[k], { attrs: `data-k="${k}"`, cls: bad ? 'err' : '' }).replace('<label>' + label, `<label>${label}${o.req ? ' <b>*</b>' : ''}`)}${bad ? '<p class="helper err">Required</p>' : ''}</div>`; };
  function createPage() {
    const a = age(f.dob), minor = a != null && a < 18; const to = minor ? f.g.email : f.email; const fullAddr = [f.addr1, f.addr2, f.city, f.postcode].filter(Boolean).join(', ');
    return `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/patients">Patients</a><span>/</span><a href="#/patients">Patients List</a><span>/</span><span class="cur">Create Patient</span></nav>
    <div class="page-head"><div class="titles"><h1 class="h5">Create Patient</h1></div><div class="actions"><button class="btn outlined lg" data-act="pf-cancel">Cancel</button><button class="btn primary lg" data-act="pf-save">${f.invite ? 'Create &amp; Send Invitation' : 'Create Patient'}</button></div></div>
    <section class="card card-pad stack g12"><div class="pt-invite ${f.invite ? 'on' : ''}"><label class="cbx top"><input type="checkbox" data-ch="pf-inv" ${f.invite ? 'checked' : ''}><span class="stack g4"><b>Send patient invitation</b><span class="caption">The ${minor ? 'parent or guardian' : 'patient'} receives an email to set up their account, confirm their details and complete onboarding.</span></span></label>
        ${f.invite ? `<div class="field dis pt-to"><label>Invitation will be sent to</label><input value="${esc(to || '')}" placeholder="${minor ? 'Add the guardian’s email below' : 'Add the patient’s email below'}" readonly tabindex="-1"></div>` : ''}</div>
      <p class="caption row g8"><i class="ri-information-line"></i>${minor ? 'This patient is under 18, so the portal account is held by their parent or guardian.' : 'The invitation is sent once the patient record is created. You can resend it later from the patient profile.'}</p></section>
    <section class="card card-pad stack g16"><h2 class="pt-h"><i class="ri-user-line"></i>Patient Information${minor ? `<span class="chip sm filled t-orange">Age ${a} · Under 18</span>` : ''}</h2>
      <div class="g2">${tf('First Name', 'first', { req: true, ph: 'John' })}${tf('Last Name', 'last', { req: true, ph: 'Doe' })}${tf('Date of Birth', 'dob', { req: true, type: 'date' })}${sel('Sex at Birth', 'sex', ['Male', 'Female', 'Intersex'], { req: true })}${sel('Gender', 'gender', ['Male', 'Female', 'Non-binary', 'Prefer not to say'])}</div></section>
    <section class="card card-pad stack g16"><h2 class="pt-h"><i class="ri-phone-line"></i>Contact Information${minor ? '<span class="chip sm filled t-orange">Guardian’s details</span>' : ''}</h2>
      ${minor ? `<div class="pt-warn"><i class="ri-error-warning-line"></i><div><b>${esc(f.first || 'This patient')} is under 18 — contact details belong to their parent or guardian</b><span>Appointment reminders, documents and portal access are all sent to the guardian. Change the date of birth above to collect the patient’s own details instead.</span></div></div>
      <div class="pt-guard stack g16"><h3 class="pt-h3"><i class="ri-parent-line"></i>Parent / Guardian <span class="chip sm filled t-orange">Required for under-18s</span></h3>
        <div class="g2">${tf('Guardian First Name', 'g.first', { req: true })}${tf('Guardian Last Name', 'g.last', { req: true })}${tf('Relationship to Patient', 'g.rel', { req: true, ph: 'e.g. Parent' })}${tf('Guardian Email', 'g.email', { req: true, type: 'email', ph: 'name@example.com', msg: 'Enter a valid email address' })}${tf('Guardian Phone number', 'g.phone', { req: true, tel: true, ph: 'Enter phone number' })}${tf('Guardian Home number', 'g.home', { tel: true, ph: 'Enter phone number' })}</div>
        <label class="cbx"><input type="checkbox" data-ch="pf-same" ${f.g.same ? 'checked' : ''}>Same as patient address</label>
        ${f.g.same ? `<div class="field dis"><label>Guardian Address</label><input value="${esc(fullAddr || 'Filled in from the patient’s address below')}" readonly tabindex="-1"></div><p class="caption row g8" style="margin:-8px 0 0"><i class="ri-information-line"></i>Address is copied from the patient. Untick to enter a different address.</p>` : tf('Guardian Address', 'g.addr', { ph: 'Street, city, postcode' })}</div>`
      : `<div class="g2">${tf('Email', 'email', { req: true, type: 'email', ph: 'john.doe@example.com', msg: 'Enter a valid email address, e.g. name@example.com' })}${tf('Phone number', 'phone', { req: true, tel: true, ph: 'Enter phone number' })}${tf('Home number', 'home', { tel: true, ph: 'Enter phone number' })}</div>`}</section>
    <section class="card card-pad stack g16"><h2 class="pt-h"><i class="ri-map-pin-line"></i>Address Information</h2>
      <div class="g2">${tf('Address 1', 'addr1', { req: true, ph: '123 High Street, Flat 4B' })}${tf('Address 2', 'addr2', { ph: 'Optional' })}${sel('Country', 'country', ['England', 'Scotland', 'Wales', 'Northern Ireland'], { req: true })}${tf('City', 'city', { req: true, ph: 'London' })}</div>${tf('Postcode', 'postcode', { req: true, ph: 'SW1A 1AA' })}</section>`;
  }
  ins.pf = el => { const k = el.dataset.k; if (k.startsWith('g.')) f.g[k.slice(2)] = el.value; else f[k] = el.value;
    if (k === 'dob' || k === 'email' || k === 'g.email' || (f.g.same && ['addr1', 'addr2', 'city', 'postcode'].includes(k))) softRender(el); };
  /* re-render without losing the caret in the field being typed into */
  const softRender = el => { const k = el.dataset.k, pos = el.selectionStart, y = scrollY; App.render(); scrollTo(0, y); const n = App.$(`[data-in=pf][data-k="${k}"]`); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } };
  chs['pf-sel'] = el => { f[el.dataset.k] = el.value; };
  chs['pf-inv'] = el => { f.invite = el.checked; App.render(); };
  chs['pf-same'] = el => { f.g.same = el.checked; App.render(); };
  acts['pf-cancel'] = () => { f = null; App.go('#/patients'); };
  acts['pf-save'] = () => { f.tried = true; const miss = missing();
    if (miss.length) { App.render(); App.$('.field.err input, .field.err select')?.focus(); App.snack(`Fill in ${miss.length} required field${miss.length > 1 ? 's' : ''} to create the patient.`, 'error'); return; }
    const a = age(f.dob), minor = a < 18, id = 'p' + (P.length + 10);
    const p = { id, first: f.first.trim(), last: f.last.trim(), email: minor ? f.g.email : f.email, phone: '+44 ' + (minor ? f.g.phone : f.phone), fresh: true, dob: f.dob, sex: f.sex, gender: f.gender || '—', pronouns: '—', lastAppt: '', next: '', since: '2026-10-20', joined: '', invite: f.invite ? 'invited' : 'none', sent: '20 Oct', note: 'expires in 7 days', createdBy: App.me().name, created: '20 Oct 2026',
      weight: '—', height: '—', eth: '—', addr: [f.addr1, f.addr2].filter(Boolean).join(', '), city: f.city, postcode: f.postcode, contact: 'Email',
      guardian: minor ? { name: f.g.first + ' ' + f.g.last, rel: f.g.rel, email: f.g.email, phone: '+44 ' + f.g.phone, same: f.g.same, consent: 'Not recorded yet', comms: 'Yes — appointment reminders and results' } : null };
    P.unshift(p); const inv = f.invite; f = null; scrollTo(0, 0);
    if (inv) { App.ui.ptAfter = '#/patients/' + id; App.go('#/patients/' + id); sentDialog(p.email, minor); } else { App.go('#/patients/' + id); App.snack(`${name(p)} created. You can send an invitation from their profile.`); } };

  /* ---------- Patient details ---------- */
  const PTABS = ['Overview', 'Requests', 'Appointment', 'Medical History', 'Diet & Lifestyles', 'Measurements & Vitals', 'Documents', 'Forms', 'Billing', 'Medical Alerts'];
  /* other record tabs register here (patients-record.js) */
  const PT = App.PT = { tabs: {}, pat, name, age, dmy, longDob, today: TODAY };
  const APPTS = [{ mon: 'Oct', day: 25, title: 'Follow-up Consultation', dr: 'Dr Simon', spec: 'Cardiologist', time: '10:30 AM', dur: 15, online: true }, { mon: 'Nov', day: 8, title: 'Medication Review', dr: 'Dr Sana Malik', spec: 'GP', time: '2:00 PM', dur: 20, online: true }];
  const REQS = [['15/03/2025, 11:00 am', 'Eligibility Check', 'Under Clinical Review', 't-orange', 'ri-time-line'], ['15/03/2025, 11:00 am', 'Eligibility Check', 'Appointment Pending', 't-green', 'ri-checkbox-circle-line'], ['15/03/2025, 11:00 am', 'Request Review', 'Closed', 't-red', 'ri-error-warning-line']];
  const detail = (id, tab = 'overview') => { const p = pat(id); if (p && tab === 'book' && PT.book) return PT.book(p); if (!p) return `<section class="soon"><h1 class="soon-h1">Patient not found</h1><a class="btn outlined" href="#/patients">Back to Patients</a></section>`;
    const a = age(p.dob), minor = a < 18, live = p.invite === 'active', archived = p.invite === 'archived'; const cur = PTABS.find(t => App.slug(t) === tab) || 'Overview';
    const status = live ? `<span class="chip sm filled t-green"><i class="ri-check-line"></i>Active on platform</span>` : archived ? `<span class="chip sm filled t-red"><i class="ri-archive-line"></i>Archived</span>` : p.invite === 'none' ? `<span class="chip sm filled t-grey"><i class="ri-send-plane-line"></i>Not invited to the platform</span>` : `<span class="chip sm filled ${INV[p.invite][1]}"><i class="${INV[p.invite][2]}"></i>${p.invite === 'expired' ? 'Invite expired' : 'Invitation pending'}</span>`;
    const head = `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/patients">Patients</a><span>/</span><a href="#/patients">Patients List</a><span>/</span><a href="#/patients/${p.id}">Patients Details</a><span>/</span><span class="cur">${cur}</span></nav>
      <div class="tabrow"><nav class="mtabs" aria-label="Patient record">${PTABS.map(t => { const n = t === 'Medical Alerts' && PT.alertCount ? PT.alertCount(p) : 0; return `<a href="#/patients/${p.id}${t === 'Overview' ? '' : '/' + App.slug(t)}" class="${t === cur ? 'on' : ''}" ${t === cur ? 'aria-current="page"' : ''}>${t}${n ? `<span class="pt-tab-n" aria-label="${n} active">${n}</span>` : ''}</a>`; }).join('')}</nav>
        ${cur === 'Overview' || cur === 'Medical History' ? '' : cur === 'Medical Alerts' ? `<button class="btn lg pt-red" data-act="al-add" data-id="${p.id}"><i class="ri-add-circle-line"></i>Add medical alert</button>` : `<button class="btn primary lg" data-go="#/patients/${p.id}/book">Schedule Appointment</button>`}</div>
      ${PT.banner && cur === 'Overview' ? PT.banner(p) : ''}${PT.pendingCard && cur === 'Overview' ? PT.pendingCard(p) : ''}`;
    if (cur !== 'Overview' && PT.tabs[App.slug(cur)]) return App.after(() => App.$('.tabrow .mtabs a.on')?.scrollIntoView({ inline: 'nearest', block: 'nearest' })) || head + PT.tabs[App.slug(cur)](p);
    if (cur !== 'Overview') return head + `<section class="card card-pad"><div class="empty-box pt-empty"><span class="soon-icon"><i class="ri-hammer-line"></i></span><b>${cur} is coming soon</b><span class="caption">${esc(name(p))}’s ${cur.toLowerCase()} will appear here.</span><a class="btn outlined sm" href="#/patients/${p.id}">Back to Overview</a></div></section>`;
    const kv = rows => `<dl class="pt-kv">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || '—')}</dd></div>`).join('')}</dl>`;
    const invite = !live && !archived;
    return head + `<div class="dgrid3"><div class="stack g16">
      <div class="stats dstats3">${[['ri-file-list-3-line', 'Total Requests', p.fresh ? 0 : 4], ['ri-calendar-line', 'Total Appointments', p.fresh ? 0 : 4], ['ri-time-line', 'Upcoming Appointments', live ? 2 : 0]].map(([i, t, n], k) => `<div class="stat dstat pt-stat sm"><span class="dic"><i class="${i}"></i></span><span class="grow">${t}</span><span class="pt-num ${k === 2 ? 'warn' : ''} tnum">${n}</span></div>`).join('')}</div>
      <section class="card pt-id"><span class="av lg">${App.initials(name(p))}${live ? '<i class="pt-online" aria-hidden="true"></i>' : ''}</span><div class="stack g4"><div class="row g8 wrap"><h1 class="h6 hh1">${esc(name(p))}</h1>${status}${minor && p.guardian ? '<span class="chip sm filled t-purple"><i class="ri-parent-line"></i>Minor · guardian on record</span>' : ''}</div>
        <div class="row g16 wrap caption"><span><i class="ri-building-line"></i> Member since: ${p.since}</span><span><i class="ri-cake-2-line"></i> Date of Birth: ${longDob(p.dob)} (${a} years old)</span>${p.invite === 'none' ? `<span>Created by ${esc(p.createdBy)} · ${esc(p.created)} · No account yet</span>` : ''}</div></div></section>
      ${invite ? `<section class="pt-banner"><span class="pt-banner-ic"><i class="ri-send-plane-line"></i></span><div class="grow"><b>${p.invite === 'none' ? 'This patient has no platform account yet' : p.invite === 'expired' ? 'Their invitation expired' : 'Invitation sent — waiting for them to join'}</b><span>${p.invite === 'none' ? `${esc(p.first)} was created by staff and has never been invited. Sending an invitation lets them sign in.` : p.invite === 'expired' ? `Sent ${p.sent} with no response. Send a new link so ${esc(p.first)} can sign in.` : `Sent ${p.sent} to ${esc(p.guardian ? p.guardian.email : p.email)} · ${p.note}.`}</span></div><button class="btn lg pt-orange" data-act="pt-invite" data-id="${p.id}"><i class="ri-send-plane-line"></i>${p.invite === 'none' ? 'Send invitation' : 'Resend invitation'}</button></section>` : ''}
      <section class="card card-pad stack g16"><div class="g2 pt-cols"><div class="pt-panel"><h2 class="pt-h"><i class="ri-user-line"></i>Patient Demographics</h2>${kv([['First Name', p.first], ['Last Name', p.last], ['Date of Birth', dmy(p.dob)], ['Weight', p.weight], ['Height', p.height], ['Ethnicity', p.eth], ['Gender', p.gender], ['Pronouns', p.pronouns]])}</div>
        <div class="pt-panel"><h2 class="pt-h"><i class="ri-phone-line"></i>Contact Information</h2>${kv([['Email', p.email], ['Mobile Phone', p.phone], ['Address', p.addr], ['City', p.city], ['Country', 'United Kingdom'], ['Postcode', p.postcode], ['Preferred Contact Method', p.contact]])}</div></div>
        ${p.guardian ? `<div class="pt-panel"><h2 class="pt-h"><i class="ri-parent-line"></i>Guardian Information</h2>${kv([['Guardian Name', p.guardian.name], ['Relationship to Patient', p.guardian.rel], ['Email', p.guardian.email], ['Phone Number', p.guardian.phone], ['Address', p.guardian.same ? `Same as patient — ${p.addr}, ${p.city}` : '—'], ['Consent held', p.guardian.consent], ['Receives patient communications', p.guardian.comms]])}<p class="caption row g8" style="margin:12px 0 0"><i class="ri-information-line"></i>The guardian is the contact for consent and correspondence until the patient turns 18.</p></div>` : ''}</section>
      <section class="card"><div class="card-head"><h2 class="pt-h"><i class="ri-file-list-3-line"></i>Latest Requests (${p.fresh ? 0 : 3})</h2></div><div class="table-scroll"><table class="dt"><thead><tr><th>Request Date &amp; Time</th><th>Request</th><th>Status</th><th>Actions</th></tr></thead><tbody>${p.fresh ? '<tr class="empty-row"><td colspan="4">No requests yet. Requests the patient makes, or you create for them, appear here.</td></tr>' : REQS.map(([d, r, s, t, i]) => `<tr><td>${d}</td><td>${r}</td><td><span class="chip sm filled ${t}"><i class="${i}"></i>${s}</span></td><td><button class="icon-btn s20" data-go="#/patients/${p.id}/requests" aria-label="View ${r}"><i class="ri-eye-line"></i></button></td></tr>`).join('')}</tbody></table></div>${p.fresh ? '' : App.pager(3, 3)}</section>${PT.notes ? PT.notes(p) : ''}</div>
      <aside class="stack g16"><section class="card card-pad stack g12"><h2 class="dh2" style="font-size:16px">Quick Actions</h2>${invite ? `<button class="btn lg block pt-orange" data-act="pt-invite" data-id="${p.id}"><i class="ri-send-plane-line"></i>${p.invite === 'none' ? 'Send Invitation' : 'Resend Invitation'}</button>` : ''}
          <button class="btn primary lg block" data-go="#/patients/${p.id}/book">Schedule Appointment</button><button class="btn outlined lg block" data-act="soon" data-what="Requests"><i class="ri-file-add-line"></i>Create Request</button>
          ${archived ? '' : `<button class="btn text sm" data-act="pt-archive" data-id="${p.id}" style="align-self:center;color:var(--text-2)"><i class="ri-archive-line"></i>Archive patient</button>`}</section>
        ${live ? `<section class="card pt-up"><div class="pt-up-h"><span class="pt-up-ic"><i class="ri-time-line"></i></span><h2>Upcoming Appointments</h2><a class="icon-btn s20 pt-up-x" href="#/patients/${p.id}/appointment" aria-label="Open all appointments" title="Open all appointments"><i class="ri-expand-diagonal-line"></i></a></div>
          ${APPTS.map(x => `<article class="pt-appt"><div class="pt-appt-top"><span class="pt-date"><small>${x.mon}</small><b>${x.day}</b></span><div class="pt-appt-t"><b>${x.title}</b><span>${x.dr}<i aria-hidden="true">•</i>${x.spec}</span><small>${x.time} (${x.dur} minutes)</small></div></div>
            <span class="pt-mode"><i class="${x.online ? 'ri-vidicon-line' : 'ri-map-pin-line'}"></i>${x.online ? 'Online Consultation' : 'Face to face'}</span>
            <div class="pt-appt-act">${x.online ? `<button class="btn primary sm" data-act="soon" data-what="Video consultations">Join Consultation</button>` : ''}<button class="btn outlined sm pt-dark" data-go="#/patients/${p.id}/book">Reschedule</button><button class="pt-cancel" data-act="soon" data-what="Cancelling appointments">Cancel</button></div></article>`).join('')}
          <a class="pt-more" href="#/patients/${p.id}/appointment">See more</a></section>`
        : `<section class="card pt-up"><div class="pt-up-h"><span class="pt-up-ic"><i class="ri-time-line"></i></span><h2>Upcoming Appointments</h2></div><div class="pt-appt pt-appt-empty"><span class="caption">No upcoming appointments.</span><button class="btn outlined sm pt-dark" data-act="soon" data-what="Scheduling">Schedule one</button></div></section>`}</aside></div>`; };
  App.route('/patients/:id', id => detail(id), meta);
  App.route('/patients/:id/:tab', (id, tab) => detail(id, tab), meta);
})();

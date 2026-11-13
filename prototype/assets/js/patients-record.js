/* EHR › Patient record tabs (Figma 1811:142052 "Open Patient"): Requests, Appointments + booking, Medical History, Documents, Billing. */
(function () {
  const { esc, acts, ins, chs } = App; const PT = App.PT;
  const uid = () => 'x' + Math.random().toString(36).slice(2, 8);
  const chip = (t, tone, i) => `<span class="chip sm filled ${tone}">${i ? `<i class="${i}"></i>` : ''}${esc(t)}</span>`;
  const title = (t, sub) => `<div class="pt-title"><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div>`;
  const seg = (act, items, on) => `<div class="pt-seg" role="tablist">${items.map(([k, t, i]) => `<button role="tab" aria-selected="${k === on}" class="${k === on ? 'on' : ''}" data-act="${act}" data-v="${k}">${i ? `<i class="${i}"></i>` : ''}${t}</button>`).join('')}</div>`;
  const table = (heads, rows, cols, empty) => `<div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr class="empty-row"><td colspan="${cols}">${empty}</td></tr>`}</tbody></table></div>${rows.length ? App.pager(rows.length, rows.length) : ''}</div>`;
  const kv = rows => `<dl class="pt-kv">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  /* modal pieces shared with patients-care.js */
  const modal = PT.modal = (icon, t, sub, body, foot, tone = '', cls = '') => `<div class="pt-dlg ${cls}"><button class="icon-btn s20 pt-dlg-x" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button>${icon ? `<span class="pt-dlg-ic ${tone}"><i class="${icon}"></i></span>` : ''}<h2 id="dlg-title">${t}</h2>${sub ? `<p class="pt-dlg-sub">${sub}</p>` : ''}<form class="stack g16" id="pt-form" onsubmit="return false">${body}</form><div class="pt-dlg-foot">${foot}</div></div>`;
  /* Form fields carry their label above the box rather than notched into its
     border: a dense form reads faster when the question is a line of its own,
     and a required mark sits beside the question instead of on the frame.
     App.field stays as it is, so toolbars and search boxes are unaffected. */
  const ftId = n => 'ft-' + String(n).replace(/[^a-z0-9_-]/gi, '');
  const lab = (t, n, o) => t ? `<label for="${ftId(n)}">${t}${o.req ? ' <b>*</b>' : ''}</label>` : '';
  const F = PT.F = (label, name, val = '', o = {}) => { const max = o.max || 300;
    return `<div class="ft">${lab(label, name, o)}${App.field('', o.area
      ? `<textarea id="${ftId(name)}" name="${name}" rows="${o.rows || 4}" maxlength="${max}" data-in="pt-count" placeholder="${o.ph || ''}">${esc(val)}</textarea>`
      : `<input id="${ftId(name)}" name="${name}" type="${o.type || 'text'}" value="${esc(val)}" placeholder="${o.ph || ''}" ${o.step ? `step="${o.step}"` : ''} ${o.attrs || ''}>`,
      { cls: (o.area ? 'multi ' : '') + (o.cls || '') })}${o.area ? `<span class="caption pt-count">Character limit: ${max}${val ? ` \u00b7 ${String(val).length} used` : ''}</span>` : ''}</div>`; };
  const S = PT.S = (label, name, opts, val = '', o = {}) => `<div class="ft">${lab(label, name, o)}${App.field('', `<select id="${ftId(name)}" name="${name}" ${o.attrs || ''}>${o.ph ? `<option value="">${o.ph}</option>` : ''}${opts.map(x => `<option ${x === val ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`, { cls: 'select ' + (o.cls || '') })}</div>`;
  const FT = PT.FT = F, ST = PT.ST = S;
  const formData = PT.formData = () => Object.fromEntries(new FormData(App.$('#pt-form')));

  const needs = PT.needs = (d, keys) => { const miss = keys.filter(k => !String(d[k] || '').trim()); App.$$('#pt-form .field').forEach(f => { const n = f.querySelector('[name]')?.name; f.classList.toggle('err', miss.includes(n)); }); if (miss.length) App.$(`#pt-form [name="${miss[0]}"]`)?.focus(); return !miss.length; };
  ins['pt-count'] = el => { const c = el.closest('.stack')?.querySelector('.pt-count'); if (c) c.textContent = `Character limit: ${el.maxLength} · ${el.value.length} used`; };
  const confirmDel = PT.confirmDel = (t, sub, icon, name, meta, act, id, what) => App.dialog(modal('ri-error-warning-line', t, sub, `<div class="pt-del-item"><i class="${icon}"></i><div><b>${esc(name)}</b><span>${meta}</span></div></div><div class="pt-warn"><i class="ri-alert-line"></i><span>This action cannot be undone. The ${what} will be permanently removed from this patient’s record.</span></div>`, `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn danger lg" data-act="${act}" data-id="${id}">Delete</button>`, 'red'), { width: 520 });
  const pid = () => location.hash.startsWith('#/me/') ? 'p0' : (location.hash.match(/#\/patients\/([^/]+)/) || [])[1];
  const cur = () => PT.pat(pid());

  /* ---------- per-patient record (seeded; new patients start empty) ---------- */
  const seed = p => { const fresh = !!p.fresh;
    return {
      reqs: fresh ? [] : [['15/09/2026, 11:00 am', 'Eligibility Check', 'Under Clinical Review', 'Wordpress Form'], ['02/09/2026, 09:20 am', 'Eligibility Check', 'Appointment Pending', 'Wordpress Form'], ['18/08/2026, 04:05 pm', 'Request Review', 'Closed', 'Platform'], ['30/07/2026, 10:30 am', 'Prescription Renewal', 'Pending', 'Wordpress Form'], ['12/07/2026, 02:15 pm', 'Request Review', 'Under Clinical Review', 'Wordpress Form'], ['01/07/2026, 08:45 am', 'Blood Test Review', 'More Info Required', 'Wordpress Form']].map(([at, type, status, src]) => ({ id: uid(), at, type, status, src })),
      appts: fresh ? [] : [
        { id: uid(), mon: 'Oct', day: 25, dow: 'Sun', time: '10:30 AM', dur: 15, title: 'Follow-up Consultation', dr: 'Dr Simon Achebe', spec: 'Cardiologist', mode: 'online', kind: 'Follow-up', status: 'confirmed', note: ['info', 'Follow-up for palpitations. Please have your Holter monitor results ready.'] },
        { id: uid(), mon: 'Oct', day: 27, dow: 'Tue', time: '10:30 AM', dur: 15, title: 'In person Consultation', dr: 'Dr Simon Achebe', spec: 'Clinician', mode: 'walkin', kind: 'Follow-up', loc: 'Westminster Practice, Room 3, 123 High Street, London, SW1A 1AA', status: 'confirmed' },
        { id: uid(), mon: 'Oct', day: 29, dow: 'Thu', time: '10:30 AM', dur: 15, title: 'Follow-up Consultation', dr: 'Dr Sana Malik', spec: 'Clinician', mode: 'online', kind: 'Follow-up', status: 'payment', note: ['warn', 'This appointment is reserved for 24 hours. Payment must be completed to confirm it.'] },
        { id: uid(), mon: 'Oct', day: 30, dow: 'Fri', time: '11:00 AM', dur: 30, title: 'Weight Management Program', dr: 'Dr Simon Achebe', spec: 'General Practice', mode: 'online', kind: 'Initial Assessment', status: 'payment' },
        { id: uid(), mon: 'Oct', day: 12, dow: 'Mon', time: '09:30 AM', dur: 15, title: 'Annual Check-up', dr: 'Dr Simon Achebe', spec: 'General Practice', mode: 'walkin', kind: 'Initial Assessment', loc: 'Westminster Practice, Room 3, 123 High Street, London, SW1A 1AA', status: 'completed', note: ['info', 'Bloods taken. Results shared in Documents.'] },
        { id: uid(), mon: 'Oct', day: 5, dow: 'Mon', time: '10:30 AM', dur: 15, title: 'Follow-up Consultation', dr: 'Dr Simon Achebe', spec: 'Cardiologist', mode: 'online', kind: 'Follow-up', status: 'cancelled', note: ['err', 'Cancelled by the clinic · patient asked to move to a later date.'] }],
      cond: fresh ? [] : [['Type 2 Diabetes', 'Chronic metabolic condition affecting glucose levels', 'Active', 'Weightfall', 'GP'], ['Hypertension', 'High blood pressure requiring monitoring', 'Active', 'Weightfall', 'Clinician'], ['Asthma', 'Respiratory condition with occasional flare-ups', 'Resolved', 'Minor Ops', 'GP'], ['Anxiety', 'Generalised anxiety symptoms', 'Active', 'LeafEase', 'Self']].map(([name, desc, status, source, by]) => ({ id: uid(), name, desc, status, source, by })),
      meds: fresh ? [] : [['Metformin', 500, 'mg', 'Twice daily', 'Active', '2015-12-12', '', 'Weightfall', 'GP', 'Repeat'], ['Ramipril', 5, 'mg', 'Once daily', 'Active', '2021-03-02', '', 'LeafEase', 'Clinician', 'Repeat'], ['Salbutamol inhaler', 100, 'mcg', 'As needed', 'Active', '2018-06-15', '', 'Weightfall', 'GP', 'Repeat'], ['Sertraline', 50, 'mg', 'Once daily', 'Active', '2024-01-10', '', 'LeafEase', 'Self', 'Repeat'], ['Amoxicillin', 500, 'mg', 'Three times daily', 'Completed', '2025-02-01', '2025-02-08', 'Weightfall', 'GP', 'Acute']].map(([name, dose, unit, freq, status, start, end, source, by, course]) => ({ id: uid(), name, dose, unit, freq, status, start, end, source, by, course })),
      alg: fresh ? [] : [['Penicillin', 'High', 'Skin rash and swelling', 'Weightfall', 'GP'], ['Latex', 'Medium', 'Irritation', 'Clinician', 'Self'], ['Peanuts', 'High', 'Anaphylaxis — carries an adrenaline pen', 'Clinician', 'GP'], ['Ibuprofen', 'Low', 'Stomach upset', 'Clinician', 'Clinician']].map(([name, severity, reaction, source, by]) => ({ id: uid(), name, severity, reaction, source, by })),
      docs: fresh ? [] : [['Form-NQH-2026', 'Questionnaires', 'Weightfall - initial assessment'], ['Surgical Notes.pdf', 'Documents', ''], ['CBC with Differential.pdf', 'Blood Reports', ''], ['Blood test.jpg', 'Blood Reports', ''], ['Informed Consent.pdf', 'Consent Forms', 'Annual Check-up'], ['PHQ-9', 'Questionnaires', 'Weight management programme'], ['Six-month review.pdf', 'Review Forms', '']].map(([name, cat, req], i) => ({ id: uid(), name, cat, req, at: `${String(15 - i).padStart(2, '0')}/09/2026, 11:00 am`, by: 'Me (Muhammad Arslan)' })),
      bills: fresh ? [] : [['Initial Weight Management Assessment', 'Payment Complete', 'Service', 65], ['GLP-1 Monthly Package', 'Awaiting Payment', 'Package', 199], ['Follow-up Consultation', 'Awaiting Payment', 'Service', 45], ['Blood Test Panel', 'Payment Complete', 'Service', 85], ['Follow-up Consultation', 'Cancelled', 'Service', 45], ['GLP-1 Monthly Package', 'Payment Failed', 'Package', 199]].map(([name, status, kind, price], i) => ({ id: uid(), name, status, kind, price, date: `${String(20 - i * 3).padStart(2, '0')}/09/2026` })),
      refunds: fresh ? [] : [['Follow-up Consultation', 'Refunded', 'Service', 'Patient Cancellation', 45], ['GLP-1 Monthly Package', 'Awaiting', 'Package', 'Clinic Cancellation', 199], ['Initial Weight Management Assessment', 'Awaiting', 'Service', 'Patient Cancellation', 65], ['Blood Test Panel', 'Rejected', 'Service', 'Patient Cancellation', 85]].map(([name, status, kind, type, amount], i) => ({ id: uid(), name, status, kind, type, amount, date: `${16 - i}/09/2026 06:12 PM` })),
      f: { req: 'All', ap: 'all', apType: 'All', apQ: '', mhTab: 'meds', medF: 'Active', docCat: 'All', docQ: '', bill: 'records', bQ: '', bStatus: 'All Status', bKind: 'All Types' }
    }; };
  const rec = PT.rec = p => { const s = App.S.ptRec = App.S.ptRec || {}; return s[p.id] = s[p.id] || seed(p); };

  /* ---------- Requests ---------- */
  const RQ = { 'Under Clinical Review': ['t-orange', 'ri-time-line'], 'Appointment Pending': ['t-green', 'ri-checkbox-circle-line'], Closed: ['t-red', 'ri-error-warning-line'], Pending: ['t-orange', 'ri-time-line'], 'More Info Required': ['t-blue', 'ri-information-line'] };
  PT.tabs.requests = p => { const r = rec(p); const list = r.reqs.filter(x => r.f.req === 'All' || x.status === r.f.req);
    return title('All Requests') + `<section class="card card-pad stack g16"><div class="filters">${App.select('Status', 'pr-status', ['All', ...Object.keys(RQ)], r.f.req)}${App.field('Date', '<input type="date" aria-label="Date">')}<span class="grow"></span><button class="btn primary lg" data-act="soon" data-what="Creating requests"><i class="ri-add-circle-line"></i>New Request</button></div>
      ${table(['Request Date &amp; Time', 'Request Type', 'Status', 'Source <i class="ri-arrow-down-line"></i>', 'Actions'], list.map(x => `<tr><td>${x.at}</td><td>${esc(x.type)}</td><td>${chip(x.status, ...RQ[x.status])}</td><td>${esc(x.src)}</td><td><button class="icon-btn s20" data-act="soon" data-what="Request details" aria-label="View ${esc(x.type)}"><i class="ri-eye-line"></i></button></td></tr>`), 5, r.reqs.length ? 'No requests with this status.' : 'No requests yet. Requests this patient makes, or you create for them, appear here.')}</section>`; };
  chs['pr-status'] = el => { rec(cur()).f.req = el.value; App.render(); };

  /* ---------- Appointments ---------- */
  const AP = { confirmed: [['Confirmed', 't-green'], ['Upcoming', 't-orange']], payment: [['Action Required', 't-blue'], ['Awaiting Payment', 't-orange']], cancelled: [['Cancelled', 't-red']], completed: [['Completed', 't-blue']] };
  const bucket = a => a.status === 'payment' ? 'pending' : a.status === 'confirmed' ? 'upcoming' : 'past';
  PT.tabs.appointment = p => { const r = rec(p), f = r.f; const n = k => r.appts.filter(a => k === 'all' || bucket(a) === k).length;
    const list = r.appts.filter(a => (f.ap === 'all' || bucket(a) === f.ap) && (f.apType === 'All' || (f.apType === 'Online' ? a.mode === 'online' : a.mode === 'walkin')) && (!f.apQ || (a.title + a.dr + a.kind).toLowerCase().includes(f.apQ.toLowerCase())));
    return title('Appointments') + `<div class="pt-bar">${seg('ap-f', [['all', `All (${n('all')})`, 'ri-calendar-line'], ['upcoming', `Upcoming (${n('upcoming')})`, 'ri-calendar-line'], ['pending', `Pending Action (${n('pending')})`, 'ri-calendar-line'], ['past', `Past (${n('past')})`, 'ri-calendar-line']], f.ap)}<span class="grow"></span>
      ${App.select('Type', 'ap-type', ['All', 'Online', 'In person'], f.apType)}${App.field('Search', `<span class="adorn"><i class="ri-search-line"></i></span><input data-in="ap-q" value="${esc(f.apQ)}" placeholder="Search here…">`, { cls: 'search' })}</div>
      <div class="stack g12" id="ap-list">${list.length ? list.map(a => apCard(p, a)).join('') : `<section class="card card-pad pt-empty"><span class="soon-icon"><i class="ri-calendar-line"></i></span><b>No appointments here</b><span class="caption">${r.appts.length ? 'Try another filter.' : 'Book this patient’s first appointment.'}</span><button class="btn primary" data-go="#/patients/${p.id}/book">Schedule Appointment</button></section>`}</div>`; };
  function apCard(p, a) { const live = a.status === 'confirmed', tone = a.status === 'cancelled' ? 'red' : a.status === 'payment' ? 'orange' : a.status === 'completed' ? 'grey' : '';
    const note = a.note ? `<div class="pt-note ${a.note[0]}"><i class="${a.note[0] === 'warn' ? 'ri-alert-line' : a.note[0] === 'err' ? 'ri-error-warning-line' : 'ri-information-line'}"></i>${esc(a.note[1])}</div>` : '';
    return `<article class="card pt-ac"><div class="pt-ac-when"><span class="pt-date lg ${tone}"><small>${a.mon}</small><b>${a.day}</b><small>${a.dow}</small></span><b>${a.time}</b><small>${a.dur} minutes</small></div>
      <div class="pt-ac-main"><div class="pt-ac-top"><b>${esc(a.title)}</b><span class="row g8 wrap">${AP[a.status].map(([t, c]) => `<span class="chip sm ${c}">${t}</span>`).join('')}</span></div>
        <span class="pt-ac-dr">${esc(a.dr)}<i>•</i>${esc(a.spec)}</span>
        <span class="pt-ac-meta">${a.mode === 'online' ? '<span><i class="ri-vidicon-line"></i>Online Appointment</span>' : '<span><i class="ri-walk-line"></i>Walk-in</span>'}<span><i class="ri-calendar-check-line"></i>${a.kind}</span>${a.loc ? `<span><i class="ri-map-pin-line"></i>${esc(a.loc)}</span>` : ''}</span>${note}
        <div class="pt-appt-act">${live && a.mode === 'online' ? `<button class="btn primary sm" data-act="soon" data-what="Video consultations"><i class="ri-vidicon-line"></i>Join Appointment</button>` : `<button class="btn primary sm" data-act="ap-view" data-id="${a.id}"><i class="ri-eye-line"></i>View Details</button>`}
          ${a.status === 'payment' ? `<button class="btn outlined sm pt-dark" data-act="ap-pay" data-id="${a.id}"><i class="ri-bank-card-line"></i>Send payment link</button>` : ''}
          ${live || a.status === 'payment' ? `<button class="btn outlined sm pt-dark" data-go="#/patients/${p.id}/book"><i class="ri-calendar-line"></i>Reschedule</button><button class="pt-cancel" data-act="ap-cancel" data-id="${a.id}">Cancel Appointment</button>` : a.status === 'cancelled' ? `<button class="btn outlined sm pt-dark" data-go="#/patients/${p.id}/book"><i class="ri-calendar-line"></i>Book again</button>` : ''}</div></div></article>`; }
  acts['ap-f'] = el => { rec(cur()).f.ap = el.dataset.v; App.render(); };
  chs['ap-type'] = el => { rec(cur()).f.apType = el.value; App.render(); };
  ins['ap-q'] = el => { const p = cur(); rec(p).f.apQ = el.value; const box = App.$('#ap-list'); const y = scrollY; App.render(); scrollTo(0, y); const n = App.$('[data-in=ap-q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  const appt = id => rec(cur()).appts.find(a => a.id === id);
  acts['ap-view'] = el => { const a = appt(el.dataset.id);
    App.dialog(modal('ri-calendar-check-line', esc(a.title), `${a.dow} ${a.day} ${a.mon} 2026 · ${a.time} · ${a.dur} minutes`, kv([['Clinician', esc(a.dr) + ' · ' + esc(a.spec)], ['Type', a.mode === 'online' ? 'Online (video)' : 'Walk-in'], ['Appointment', a.kind], ['Location', esc(a.loc || 'Video link sent by email')], ['Status', AP[a.status].map(([t, c]) => `<span class="chip sm ${c}">${t}</span>`).join(' ')]]), `<button class="btn outlined lg" data-act="close-modal">Close</button>`), { width: 520 }); };
  acts['ap-pay'] = el => App.snack(`Payment link sent to ${cur().email}.`, 'success');
  acts['ap-cancel'] = el => { const a = appt(el.dataset.id);
    App.dialog(modal('ri-calendar-close-line', 'Cancel this appointment?', `${esc(a.title)} · ${a.dow} ${a.day} ${a.mon}, ${a.time}`, S('Reason', 'reason', ['Patient asked to cancel', 'Clinician unavailable', 'Booked in error', 'Other'], '', { req: true, ph: 'Choose a reason' }) + `<label class="cbx"><input type="checkbox" name="notify" checked>Email the patient about the cancellation</label>`, `<button class="btn outlined lg" data-act="close-modal">Keep appointment</button><button class="btn danger lg" data-act="ap-cancel-go" data-id="${a.id}">Cancel appointment</button>`, 'red'), { width: 480 }); };
  acts['ap-cancel-go'] = el => { const d = formData(); if (!needs(d, ['reason'])) return; const a = appt(el.dataset.id); a.status = 'cancelled'; a.note = ['err', `Cancelled · ${d.reason.toLowerCase()}.`]; App.closeModal(); App.render(); App.snack(`Appointment cancelled.${d.notify ? ' The patient has been emailed.' : ''}`); };

  /* ---------- Book appointment ---------- */
  const SERVICES = ['Weight management initial assessment', 'Follow-up consultation', 'GLP-1 medication review', 'Blood test review'];
  const STAFF = [['Muhammad Arslan', 'Clinician', 8], ['Dr Emily Carter', 'Clinician', 8], ['Dr Sarah Thompson', 'Clinician', 7], ['Dr Michael Anderson', 'Clinician', 6], ['Dr Jessica Lee', 'Clinician', 8], ['Mr John Smith', 'Nurse', 12], ['Dr Sarah Lee', 'Nurse', 10], ['Ms Angela White', 'Nurse', 6]];
  const DAYS = [['Monday', 26], ['Tuesday', 27], ['Wednesday', 28], ['Thursday', 29], ['Friday', 30]];
  const TIMES = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const slotsFor = (di, si) => TIMES.filter((t, k) => (k + di * 2 + si) % 3 !== 2).slice(0, 8).map((t, k) => ({ t, off: (k * 7 + di + si) % 5 === 3 }));
  let bk = null;
  PT.book = p => { if (!bk || bk.pid !== p.id) bk = { pid: p.id, service: '', staff: '', view: 'weekly', day: 0, slot: null, mode: 'book' };
    const si = STAFF.findIndex(s => s[0] === bk.staff), staff = STAFF[si]; const ready = bk.service && staff;
    const days = bk.view === 'weekly' ? DAYS.map((d, i) => [d, i]) : [[DAYS[bk.day], bk.day]];
    const grid = ready ? `<div class="pt-slots-h"><div><span>Available Time Slots For <b>${esc(staff[0])}</b> for ${esc(bk.service)}</span> ${chip(staff[1], 't-green')}<small>${days.reduce((n, [, i]) => n + slotsFor(i, si).filter(s => !s.off).length, 0)} slots available</small></div></div>
        ${bk.view === 'daily' ? `<div class="row g8 wrap">${DAYS.map(([d, n], i) => `<button class="chip-btn ${i === bk.day ? 'on' : ''}" data-act="bk-day" data-v="${i}">${d.slice(0, 3)} ${n}</button>`).join('')}</div>` : ''}
        <div class="pt-slots ${bk.view}">${days.map(([[d, n], i]) => { const sl = slotsFor(i, si); return `<div class="pt-day"><div class="pt-day-h"><b>${d}</b><small>${n} Oct 2026</small><small class="ok">${sl.filter(s => !s.off).length} available</small></div>
          ${sl.map(s => { const on = bk.slot && bk.slot.d === i && bk.slot.t === s.t; return `<button class="pt-slot ${on ? 'on' : ''}" ${s.off ? 'disabled aria-label="' + s.t + ' unavailable"' : ''} data-act="bk-slot" data-d="${i}" data-t="${s.t}" aria-pressed="${on}"><i class="ri-time-line"></i>${s.t}</button>`; }).join('')}</div>`; }).join('')}</div>`
      : `<div class="pt-empty pt-book-empty"><span class="soon-icon"><i class="ri-search-eye-line"></i></span><b>${bk.service ? 'Now choose a staff member' : 'Select a service to view specialists'}</b><span class="caption">Available times appear here once you pick a service and who the patient will see.</span></div>`;
    const sum = bk.slot ? `<div class="stack g8">${[['ri-stethoscope-line', 'Service', bk.service], ['ri-user-line', 'Staff', staff[0]], ['ri-calendar-line', 'Date', `${DAYS[bk.slot.d][0]}, ${DAYS[bk.slot.d][1]} Oct 2026`], ['ri-time-line', 'Time', `${bk.slot.t} <small>(30 min appointment)</small>`], ['ri-user-heart-line', 'Patient', esc(PT.name(p))]].map(([i, k, v]) => `<div class="pt-sum"><i class="${i}"></i><div><small>${k}</small><b>${v}</b></div></div>`).join('')}</div>
        <button class="btn primary lg block" data-act="bk-confirm">Confirm Appointment</button><span class="caption" style="text-align:center">${esc(p.first)} receives a confirmation email after booking.</span>`
      : `<div class="pt-empty" style="padding:16px 0"><span class="soon-icon"><i class="ri-calendar-line"></i></span><b>Select a Time Slot</b><span class="caption">Choose an available time from the calendar to see the appointment details.</span></div>`;
    return `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/patients">Patients</a><span>/</span><a href="#/patients">Patients List</a><span>/</span><a href="#/patients/${p.id}">Patients Details</a><span>/</span><a href="#/patients/${p.id}/appointment">Appointments</a><span>/</span><span class="cur">Book Appointment</span></nav>
      <div class="pt-bar"><button class="btn outlined sm pt-dark" data-go="#/patients/${p.id}/appointment"><i class="ri-arrow-left-s-line"></i>Go Back</button><h1 class="pt-h1">Book Appointment for ${esc(PT.name(p))}</h1><span class="grow"></span>${seg('bk-mode', [['book', 'Book Appointment'], ['open', 'Open Appointment Slots']], 'book')}</div>
      <div class="dgrid3"><div class="stack g16"><section class="card card-pad stack g12"><b>Select the service you want to book</b><div class="g2">${App.select('Service', 'bk-svc', [{ v: '', t: 'Select service…' }, ...SERVICES], bk.service)}
          <div class="field select pt-staff-f"><label>Staff <b>*</b></label><button type="button" class="pt-staff-btn" data-act="bk-staff" data-menu-anchor aria-haspopup="listbox" ${bk.service ? '' : 'disabled'}>${staff ? esc(staff[0]) : bk.service ? 'Select staff…' : 'Choose a service first'}</button></div></div></section>
        <section class="card card-pad stack g16"><div class="pt-bar"><div class="field" style="flex:0 1 260px"><label>Date</label><input value="26/10/2026 – 30/10/2026" readonly aria-label="Week"><span class="adorn"><i class="ri-calendar-line"></i></span></div><span class="grow"></span>${seg('bk-view', [['daily', 'Daily'], ['weekly', 'Weekly']], bk.view)}</div>
          <div class="pt-slot-box">${grid}</div></section></div>
      <aside class="card card-pad stack g16 pt-sticky"><h2 class="dh2" style="font-size:18px">Appointment Summary</h2>${sum}</aside></div>`; };
  chs['bk-svc'] = el => { bk.service = el.value; bk.slot = null; App.render(); };
  acts['bk-view'] = el => { bk.view = el.dataset.v; App.render(); };
  acts['bk-day'] = el => { bk.day = +el.dataset.v; App.render(); };
  acts['bk-mode'] = el => { if (el.dataset.v === 'open') App.snack('Opening slots for patients to self-book is outside this prototype.', 'info'); };
  acts['bk-slot'] = el => { bk.slot = { d: +el.dataset.d, t: el.dataset.t }; const y = scrollY; App.render(); scrollTo(0, y); };
  acts['bk-staff'] = el => { let tab = 'All';
    const list = q => ['Clinician', 'Nurse'].filter(g => tab === 'All' || tab === g).map(g => { const rows = STAFF.filter(s => s[1] === g && s[0].toLowerCase().includes(q.toLowerCase())); return rows.length ? `<div class="pt-grp">${g === 'Clinician' ? 'Clinicians' : 'Nurses'} (${rows.length})</div>${rows.map(s => `<button data-pick="${esc(s[0])}" class="pt-staff-row ${s[0] === bk.staff ? 'on' : ''}" role="option"><span><b>${esc(s[0])}</b> <small>${s[1]}</small></span><small>${s[2]} slots</small></button>`).join('')}` : ''; }).join('') || '<div class="caption" style="padding:12px">No staff match.</div>';
    const m = App.menu(el, `<div class="pt-staff-menu"><div class="field sm"><input placeholder="Search staff by name…" aria-label="Search staff"><span class="adorn"><i class="ri-search-line"></i></span></div><div class="row g8">${['All (8)', 'Clinician (5)', 'Nurse (3)'].map((t, i) => `<button type="button" class="chip-btn ${i ? '' : 'on'}" data-f="${t.split(' ')[0]}">${t}</button>`).join('')}</div><div class="pt-staff-list">${list('')}</div></div>`, v => { bk.staff = v; bk.slot = null; App.render(); }, { width: Math.max(320, el.offsetWidth + 28), onSearch: (q, m) => { m.querySelector('.pt-staff-list').innerHTML = list(q); } });
    m.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; tab = b.dataset.f; m.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); m.querySelector('.pt-staff-list').innerHTML = list(m.querySelector('input').value); }); };
  acts['bk-confirm'] = () => { const p = cur(); const s = STAFF.find(x => x[0] === bk.staff); const [d, n] = DAYS[bk.slot.d]; const h = +bk.slot.t.slice(0, 2);
    rec(p).appts.unshift({ id: uid(), mon: 'Oct', day: n, dow: d.slice(0, 3), time: `${((h + 11) % 12) + 1}:${bk.slot.t.slice(3)} ${h < 12 ? 'AM' : 'PM'}`, dur: 30, title: bk.service[0].toUpperCase() + bk.service.slice(1), dr: s[0], spec: s[1], mode: 'online', kind: /follow/i.test(bk.service) ? 'Follow-up' : 'Initial Assessment', status: 'confirmed', note: ['info', 'Booked just now. Confirmation email sent.'] });
    const msg = `Appointment booked\n${d} ${n} Oct at ${bk.slot.t} with ${s[0]}. A confirmation email is on its way to ${p.email}.`; bk = null; rec(p).f.ap = 'all'; App.go(`#/patients/${p.id}/appointment`); App.snack(msg); };

  /* ---------- Medical History ---------- */
  /* Three things live here and they are deliberately separate:
     the medication LIST is a record of what the patient takes, and adding to it
     issues nothing; a PRESCRIPTION is written, signed and dispatched from
     Create prescription; and a medicine the patient was put on somewhere else
     is recorded onto the list so it can be prescribed from here later. */
  const editable = x => x.by !== 'GP';
  /* Writing a prescription is a permission and a clinical role, not something
     every screen that lists medicines offers. Everything that starts or signs
     one asks here, and the signing step asks again. */
  const mayRx = () => App.can('Prescriptions', 'Create');
  const mayRxList = () => App.can('Prescriptions', 'View List');
  const rxDeny = () => App.snack('Your role cannot create prescriptions.', 'error');
  /* what a row shows once a prescription has gone out for it */
  const issTags = m => { const D = CPD[m.dispatch], t = [];
    if (D) t.push(chip(D[0], 't-blue', D[1]));
    if (m.script) t.push(chip(m.script, 't-grey', 'ri-file-list-3-line'));
    if (m.fee === 'Paid prescription') t.push(chip(`${m.pay || 'Fee'} · £${Number(m.feeAmt || 0).toFixed(2)}`, m.payStatus === 'Paid' ? 't-green' : 't-orange', m.payStatus === 'Paid' ? 'ri-checkbox-circle-line' : 'ri-time-line'));
    else if (m.fee) t.push(chip('Free prescription', 't-grey', 'ri-price-tag-3-line'));
    return t.join(''); };
  /* the pill writes a prescription for this one medicine: the same dialog as the
     header button, opened with just this row ticked */
  const rxBtn = x => !mayRx() ? '' : `<button class="icon-btn s20 mh-rx-btn" data-act="cp-one" data-id="${x.id}" aria-label="Create a prescription for ${esc(x.name)}" title="Create prescription"><i class="ri-capsule-line"></i></button>`;
  /* Every row can be opened and read. Only the ones this practice owns can be
     changed — a GP import keeps a lock in place of edit and delete. */
  const rowAct = (kind, x) => `<span class="row-actions">${kind === 'meds' ? rxBtn(x) : ''}<button class="icon-btn s20" data-act="mh-view" data-k="${kind}" data-id="${x.id}" aria-label="View ${esc(x.name)}" title="View"><i class="ri-eye-line"></i></button>${editable(x)
    ? `<button class="icon-btn s20" data-act="mh-edit" data-k="${kind}" data-id="${x.id}" aria-label="Edit ${esc(x.name)}" title="Edit"><i class="ri-edit-box-line"></i></button><button class="icon-btn s20 danger" data-act="mh-del" data-k="${kind}" data-id="${x.id}" aria-label="Delete ${esc(x.name)}" title="Delete"><i class="ri-delete-bin-6-line"></i></button>`
    : `<span class="icon-btn s20 mh-lock" role="img" aria-label="Imported from the GP record — read only" title="Imported from the GP record — read only"><i class="ri-lock-line"></i></span>`}</span>`;
  const stChip = s => s === 'Active' ? chip('Active', 't-green', 'ri-checkbox-circle-line') : chip(s, 't-grey', 'ri-history-line');
  const sevChip = s => chip(s, s === 'High' ? 't-red' : s === 'Medium' ? 't-orange' : 't-grey');
  /* Whether a medicine is a one-off course or something the patient stays on is
     a property of the course, not of the row's status, and the record never
     carried it. It is read through here and nowhere else, so a row written
     before the field existed — or imported read-only from a GP — still lands in
     one of the two course tabs rather than in neither. */
  const courseOf = m => m.course || (m.end ? 'Acute' : 'Repeat');
  const coChip = m => courseOf(m) === 'Repeat' ? chip('Repeat', 't-blue', 'ri-loop-right-line') : chip('Acute', 't-grey', 'ri-timer-line');
  const algChip = a => chip(`${a.name} · ${a.severity}`, a.severity === 'High' ? 't-red' : a.severity === 'Medium' ? 't-orange' : 't-grey');
  const box = (icon, t, actions, body) => `<section class="card pt-box"><div class="pt-box-h"><h2 class="pt-h"><i class="${icon}"></i>${t}</h2><span class="grow"></span>${actions}</div><div class="pt-box-b">${body}</div></section>`;

  /* One section at a time instead of three tables stacked down the page. The
     chosen one is kept per patient, so moving between patients does not carry
     a tab with it, and an unknown value falls back rather than blanking. */
  const MHT = [['cond', 'Medical Conditions', 'ri-heart-pulse-line'], ['meds', 'Medications', 'ri-capsule-line'], ['alg', 'Allergies', 'ri-virus-line'], ['rx', 'Prescriptions', 'ri-file-list-3-line']];
  const MEDF = ['Active', 'Acute', 'Repeat'];
  const mhTabs = () => MHT.filter(([k]) => k !== 'rx' || mayRxList());
  const mhTab = r => mhTabs().some(([k]) => k === r.f.mhTab) ? r.f.mhTab : 'meds';
  const medF = r => MEDF.includes(r.f.medF) ? r.f.medF : 'Active';
  /* Active is a status; acute and repeat describe the course. They are two ways
     of reading the same list rather than three slices of one, so a medicine the
     patient is on now stands in Active and in its own course tab — which is why
     every row shows both, a Status chip and a course chip. */
  const medIn = (m, k) => k === 'Active' ? m.status === 'Active' : courseOf(m) === k;
  /* the whole list, current medicines first: Create prescription reads this one,
     so a tab can never hide a medicine from the prescriber */
  const medList = r => [...r.meds].sort((a, b) => (a.status === 'Active' ? 0 : 1) - (b.status === 'Active' ? 0 : 1));
  const medShown = r => medList(r).filter(m => medIn(m, medF(r)));

  const condBox = r => box('ri-heart-pulse-line', `Medical Conditions (${r.cond.filter(c => c.status === 'Active').length} Active)`,
    `<button class="btn primary" data-act="mh-add" data-k="cond"><i class="ri-add-circle-line"></i>Add Medical Condition</button>`,
    `<div class="mh-cond">${table(['Condition', 'Description', 'Status', 'Source', 'Added By', 'Action'], r.cond.map(c => `<tr><td><b class="fw5">${esc(c.name)}</b></td><td>${esc(c.desc)}</td><td>${stChip(c.status)}</td><td>${esc(c.source)}</td><td>${esc(c.by)}</td><td>${rowAct('cond', c)}</td></tr>`), 6, 'No medical conditions recorded.')}</div>`);

  const algBox = r => box('ri-virus-line', `Allergies (${r.alg.length})`,
    `<button class="btn primary" data-act="mh-add" data-k="alg"><i class="ri-add-circle-line"></i>Add New Allergy</button>`,
    `<div class="mh-alg">${table(['Allergy', 'Severity', 'Reaction', 'Source', 'Added By', 'Action'], r.alg.map(a => `<tr><td><b class="fw5">${esc(a.name)}</b></td><td>${sevChip(a.severity)}</td><td>${esc(a.reaction)}</td><td>${esc(a.source)}</td><td>${esc(a.by)}</td><td>${rowAct('alg', a)}</td></tr>`), 6, 'No known allergies recorded.')}</div>`);

  /* Allergies used to sit on the same screen as the medicines. They are a tab
     away now, and this is the tab a prescription is written from, so what the
     patient reacts to stays in front of whoever is writing it. */
  const algStrip = r => `<div class="mh-algbar ${r.alg.length ? 't-red' : 'ok'}"><i class="${r.alg.length ? 'ri-alert-line' : 'ri-shield-check-line'}"></i><b>${r.alg.length ? 'Allergies' : 'No known allergies recorded'}</b>${r.alg.length ? `<span class="row g4 wrap">${r.alg.map(algChip).join('')}</span><span class="grow"></span><button class="btn text sm" data-act="mh-tab" data-v="alg">See all<i class="ri-arrow-right-s-line"></i></button>` : ''}</div>`;

  const medsBox = r => { const shown = medShown(r), f = medF(r), may = mayRx(), sel = new Set(may ? cpSelIds(r) : []);
    const onShown = shown.filter(m => sel.has(m.id)).length;
    const allOn = shown.length > 0 && onShown === shown.length, someOn = onShown > 0, away = sel.size - onShown;
    /* counted off the whole list, never off the tab being looked at */
    const cnt = k => r.meds.filter(m => medIn(m, k)).length;
    const empty = !r.meds.length ? 'No medications recorded.'
      : f === 'Active' ? 'Nothing on this record is being taken right now.'
      : f === 'Acute' ? 'No one-off courses on this record.' : 'No repeat medications on this record.';
    return box('ri-capsule-line', `Medications (${cnt('Active')} Active)`,
      `${may ? `<button class="btn outlined" data-act="cp-open"><i class="ri-quill-pen-line"></i>Create prescription${sel.size ? ` (${sel.size})` : ''}</button>` : ''}<button class="btn primary" data-act="mh-add" data-k="meds"><i class="ri-add-circle-line"></i>Add Medication</button>`,
      `${algStrip(r)}
      <div class="mh-medf">${seg('med-f', MEDF.map(k => [k, `${k} (${cnt(k)})`]), f)}${may && away > 0 ? `<span class="caption mh-away"><i class="ri-information-line"></i>${away} more selected on another tab</span>` : ''}</div>
      <div class="mh-meds">${table([`${may ? `<label class="cbx cp-box ${allOn ? '' : someOn ? 'half' : ''}"><input type="checkbox" data-ch="cp-all" ${allOn ? 'checked' : ''} aria-label="Select every medication on this tab"></label>` : ''}Medication`, 'Frequency', 'Status', 'Start Date', 'End Date', 'Source', 'Added By', 'Action'], shown.map(m => `<tr><td><span class="row g10 cp-cell">${may ? `<label class="cbx cp-box"><input type="checkbox" data-ch="cp-pick" data-id="${m.id}" ${sel.has(m.id) ? 'checked' : ''} aria-label="Select ${esc(m.name)}"></label>` : ''}<span class="cell2"><b class="fw5">${esc(m.name)}</b><small class="mh-dose">${esc(m.dose)} ${esc(m.unit)}</small>${m.ext ? `<small>Prescribed by ${esc(m.prescriber)} · ${esc(m.org)}</small>` : ''}${m.prescribed ? `<small>Prescription issued ${esc(m.issued)} by ${esc(m.prescriber)}</small>` : ''}<span class="row g4 wrap mh-rxtags">${coChip(m)}${m.ext ? `${/^Patient/.test(m.verify || '') ? chip('Unverified', 't-orange', 'ri-error-warning-line') : chip('Verified', 't-green', 'ri-verified-badge-line')}${m.cd ? chip('Controlled drug', 't-red', 'ri-shield-keyhole-line') : ''}` : ''}${m.prescribed ? issTags(m) : ''}</span></span></span></td><td>${esc(m.freq)}</td><td>${stChip(m.status)}</td><td>${PT.dmy(m.start)}</td><td>${m.end ? PT.dmy(m.end) : '—'}</td><td>${esc(m.source)}</td><td>${esc(m.by)}</td><td>${rowAct('meds', m)}</td></tr>`), 8, empty)}</div>`); };


  /* ---------- Prescriptions ----------
     Every prescription written for this patient, current and past — the record
     Create prescription writes and the dispensing queue reads. Until now a
     prescription only showed as chips on the medicine it was for; here each one
     is a row of its own, with all of its medicines on it. */
  const rxScripts = r => { App.IV?.sync?.(); return r.scripts || []; };
  const rxDate = x => { const d = new Date(x.issuedAt || x.at); return isNaN(d) ? null : d; };
  const rxDays = it => parseInt(it.dur, 10) || 0;
  /* Current while the course written on it is still running; with no length on
     it, for as long as the medicine is still active on the record. One with no
     medicine left to match it to stays current: nothing says it has ended. */
  const rxCurrent = (r, x) => { const d = rxDate(x), items = x.items || [];
    const open = items.filter(it => !rxDays(it));
    if (!open.length) return !!d && Date.now() < d.getTime() + Math.max(...items.map(rxDays), 0) * 864e5;
    return open.some(it => { const m = r.meds.find(m => m.id === it.id) || r.meds.find(m => m.name.toLowerCase() === String(it.name).toLowerCase());
      return !m || m.status === 'Active'; }); };
  const rxList = r => rxScripts(r).map(x => ({ x, now: rxStat(x) !== 'Cancelled' && rxCurrent(r, x), d: rxDate(x) }))
    .sort((a, b) => (b.now - a.now) || ((b.d || 0) - (a.d || 0)));
  const rxDmy = d => d ? d.toLocaleDateString('en-GB') : '—';
  const rxQty = it => [`${it.qty} ${it.qtyUnit || ''}`.trim(), rxDays(it) ? `${rxDays(it)} days` : ''].filter(Boolean).join(' · ');
  const rxState = now => now ? chip('Current', 't-green', 'ri-checkbox-circle-line') : chip('Completed', 't-grey', 'ri-history-line');

  /* ---------- A prescription's life ----------
     Issued, then maybe cancelled. Where it has got to with whoever dispenses it,
     and what has been paid for it, are read from the places that own them — the
     dispensing queue for stock, the pharmacy's answer for a pharmacy, the invoice
     in Billing for money — so this screen never holds a second, stale copy. */
  const rxStat = x => x.status || 'Issued';
  const rxFind = (p, no) => (rec(p).scripts || []).find(x => x.no === no);
  const rxHref = (p, x) => `#/patients/${p.id}/prescriptions/${x.no}`;
  const rxDT = d => d ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const rxLog = x => x.log || (x.log = [['Prescription issued and signed', (rxDate(x) || new Date()).toISOString(), x.by || '']]);
  const rxNote = (x, text, by) => rxLog(x).push([text, new Date().toISOString(), by === undefined ? App.me().name : by]);
  const rxIV = (p, x) => x.dispatch === 'stock' && App.IV && App.IV.D ? (App.IV.D.rx || []).find(r => r.src === p.id + '|' + x.no) : null;
  /* [label, tone, icon, has the dispenser taken it on?] */
  const IVST = { 'To dispense': ['Awaiting dispensing', 't-orange', 'ri-time-line', false], 'In progress': ['In progress', 't-blue', 'ri-loader-4-line', true], Completed: ['Dispensed', 't-green', 'ri-checkbox-circle-line', true], Cancelled: ['Cancelled', 't-grey', 'ri-forbid-line', false] };
  const rxFul = (p, x) => { if (!x.dispatch || x.dispatch === 'give') return null;
    if (rxStat(x) === 'Cancelled') return { t: 'Cancelled', tone: 't-grey', i: 'ri-forbid-line', accepted: false, who: x.dispatch === 'stock' ? 'Practice dispensary' : (x.pharmacy || 'Linked pharmacy') };
    if (x.dispatch === 'stock') { const row = rxIV(p, x), st = IVST[row ? row.status : 'To dispense'] || IVST['To dispense'];
      return { t: st[0], tone: st[1], i: st[2], accepted: st[3], who: 'Practice dispensary', row }; }
    const f = x.ful || { status: 'Sent' }, sent = f.status === 'Sent';
    return { t: f.status, tone: sent ? 't-blue' : 't-green', i: sent ? 'ri-send-plane-line' : 'ri-checkbox-circle-line', accepted: !sent, who: x.pharmacy || 'Linked pharmacy' }; };

  /* the prescription's charge, as an invoice in Billing */
  const rxInv = (p, x) => (App.S.inv2 || []).find(v => v.rx === x.no && v.pid === p.id);
  const rxEnsureInv = (p, x) => { const S = App.S; if (!S.inv2 || x.fee !== 'Paid prescription' || !(+x.feeAmt > 0)) return rxInv(p, x);
    let v = rxInv(p, x);
    if (!v) { const at = rxDate(x) || new Date(), paid = x.payStatus === 'Paid'; let n = 6000 + S.inv2.length; while (S.inv2.some(i => i.id === 'HC-' + n)) n++;
      v = { id: 'HC-' + n, pid: p.id, svc: `Prescription ${x.no}`, kind: 'Service', amt: +x.feeAmt, status: paid ? 'Payment Complete' : 'Awaiting Payment', issued: at, appt: at, ref: x.no, rx: x.no,
        clin: x.by || '', method: x.pay || 'Card', pays: paid ? [{ amt: +x.feeAmt, method: x.pay || 'Card', at }] : [],
        log: [[paid ? `Payment recorded via ${String(x.pay || 'card').toLowerCase()}` : 'Charge raised — awaiting payment', at, x.by || '']] };
      S.inv2.unshift(v); rxNote(x, `Charge ${v.id} raised in Billing${paid ? ' and paid' : ' — awaiting payment'}`, ''); }
    /* the invoice is where money moves, so the prescription follows it */
    if (v.status === 'Payment Complete') x.payStatus = 'Paid'; else if (v.status === 'Awaiting Payment') x.payStatus = 'Awaiting Payment';
    return v; };
  const rxSync = p => { App.IV?.sync?.(); (rec(p).scripts || []).forEach(x => rxEnsureInv(p, x)); };
  const PAYV = { 'Payment Complete': ['Paid', 't-green', 'ri-checkbox-circle-line'], 'Awaiting Payment': ['Awaiting payment', 't-orange', 'ri-time-line'], 'Payment Failed': ['Payment failed', 't-red', 'ri-close-circle-line'],
    'Part Paid': ['Part paid', 't-blue', 'ri-pie-chart-2-line'], 'Refund applicable': ['Refund applicable', 't-purple', 'ri-refund-2-line'] };
  const rxPayOf = (p, x) => { if (x.fee !== 'Paid prescription') return { t: 'Free', tone: 't-grey', i: 'ri-price-tag-3-line', sub: '', inv: null };
    const v = rxInv(p, x), st = v ? v.status : x.payStatus === 'Paid' ? 'Payment Complete' : 'Awaiting Payment', money = `£${Number(x.feeAmt || 0).toFixed(2)} · ${x.pay || ''}`;
    const m = st === 'Cancelled' ? (v && v.pays.length ? ['Refund initiated', 't-purple', 'ri-refund-2-line'] : ['Charge cancelled', 't-grey', 'ri-forbid-line']) : (PAYV[st] || [st, 't-grey', '']);
    return { t: m[0], tone: m[1], i: m[2], sub: money, inv: v }; };
  const rxStatChip = x => rxStat(x) === 'Cancelled' ? chip('Cancelled', 't-red', 'ri-close-circle-line')
    : x.recall && x.recall.status === 'Pending' ? chip('Recall pending', 't-orange', 'ri-arrow-go-back-line') : chip('Issued', 't-blue', 'ri-file-list-3-line');
  /* with nobody having taken it on, it is simply cancelled; once they have, they
     are asked to give it back and it waits on their answer */
  const rxCancelKind = (p, x) => { const f = rxFul(p, x); return f && f.accepted ? 'recall' : 'now'; };
  const rxCanCancel = (p, x) => App.can('Prescriptions', 'Cancel') && rxStat(x) === 'Issued' && !x.recall;

  /* a paid charge becomes refundable — nothing is returned by itself — and an
     unpaid one is simply cancelled */
  const rxFinishCancel = (p, x, why, by) => {
    x.status = 'Cancelled'; x.cancel = { reason: why, by, at: new Date().toISOString() };
    const row = rxIV(p, x); if (row && row.status !== 'Completed') { row.status = 'Cancelled'; App.IV.save && App.IV.save(); }
    const v = rxInv(p, x); let k = '';
    if (v && v.status !== 'Cancelled') {
      if (v.pays.reduce((n, q) => n + q.amt, 0) > 0) { v.status = 'Refund applicable'; k = 'refund'; v.log.push([`Prescription ${x.no} cancelled — refund applicable`, new Date(), by]); }
      else { v.status = 'Cancelled'; v.cancelled = new Date(); v.why = `Prescription ${x.no} cancelled · ${why}`; k = 'charge'; v.log.push([`Prescription ${x.no} cancelled — charge cancelled`, new Date(), by]); } }
    rxNote(x, `Prescription cancelled — ${why}`, by);
    if (k) rxNote(x, k === 'refund' ? `Charge ${v.id} marked Refund applicable in Billing` : `Charge ${v.id} cancelled in Billing`, '');
    return k; };

  /* ---------- the Prescriptions tab ---------- */
  const rxBox = (p, r) => { const L = rxList(r);
    return box('ri-file-list-3-line', `Prescriptions (${L.filter(e => e.now).length} Current)`,
      mayRx() ? `<button class="btn outlined" data-act="cp-open"><i class="ri-quill-pen-line"></i>Create prescription</button>` : '',
      `<div class="mh-rx">${table(['Prescription', 'Medicines', 'Prescriber', 'How it reaches them', 'Status', 'Fulfilment', 'Payment', 'Action'], L.map(({ x, now, d }) => { const D = CPD[x.dispatch], f = rxFul(p, x), py = rxPayOf(p, x), cancelled = rxStat(x) === 'Cancelled';
        return `<tr class="click" data-go="${rxHref(p, x)}">
          <td><span class="cell2"><b class="fw5">${esc(x.no)}</b><small>Issued ${rxDmy(d)}</small></span></td>
          <td><span class="mh-rx-items">${(x.items || []).map(it => `<span class="cell2"><b class="fw5">${esc(it.name)} ${esc(it.dose)} ${esc(it.unit)}</b><small>${esc(rxQty(it))}</small></span>`).join('')}</span></td>
          <td><span class="cell2"><b class="fw5">${esc(x.by || '—')}</b><small>${esc(x.reg || '')}</small></span></td>
          <td>${D ? chip(D[0], 't-blue', D[1]) : '—'}</td>
          <td><span class="mh-rx-st">${rxStatChip(x)}${cancelled ? '' : rxState(now)}</span></td>
          <td>${f ? `<span class="mh-rx-st">${chip(f.t, f.tone, f.i)}<small class="caption">${esc(f.who)}</small></span>` : '<span class="caption">None needed</span>'}</td>
          <td><span class="mh-rx-st">${chip(py.t, py.tone, py.i)}${py.sub ? `<small class="caption">${esc(py.sub)}</small>` : ''}</span></td>
          <td><span class="row-actions"><a class="icon-btn s20" href="${rxHref(p, x)}" aria-label="Open prescription ${esc(x.no)}" title="Open"><i class="ri-eye-line"></i></a></span></td></tr>`; }), 8, 'No prescriptions have been written for this patient yet.')}</div>`); };

  /* ---------- the prescription's own page ---------- */
  const rxMeta = { key: 'patients', icon: 'ri-user-line', title: 'Patients' };
  const rxGone = '<section class="soon"><h1 class="soon-h1">Prescription not found</h1><a class="btn outlined" href="#/patients">Back to Patients</a></section>';
  /* the pharmacy portal is not built, so what the dispenser would do is done from
     here, plainly marked as a stand-in */
  const rxDemo = (p, x, f) => { const rec2 = x.recall && x.recall.status === 'Pending';
    const b = (v, t, i) => `<button class="btn outlined sm" data-act="rx-demo" data-v="${v}" data-id="${esc(x.no)}"><i class="${i}"></i>${t}</button>`;
    const btns = rec2 ? b('recall-ok', 'Confirm the recall', 'ri-check-line') + b('recall-no', 'Reply: already dispensed', 'ri-close-line')
      : x.dispatch === 'pharmacy' && f && !f.accepted && rxStat(x) === 'Issued' ? b('accept', 'Pharmacy accepts the order', 'ri-check-double-line') : '';
    return btns ? `<div class="rx-demo"><small><i class="ri-flask-line"></i>Prototype stand-in — the ${x.dispatch === 'stock' ? 'dispensary' : 'pharmacy'} replies here until its portal exists</small><div class="row g8 wrap">${btns}</div></div>` : ''; };

  App.route('/patients/:id/prescriptions/:no', (id, no) => { const p = PT.pat(id);
    if (!p) return '<section class="soon"><h1 class="soon-h1">Patient not found</h1><a class="btn outlined" href="#/patients">Back to Patients</a></section>';
    if (!mayRxList()) return App.deniedPage(rxMeta);
    rxSync(p); const r = rec(p), e = rxList(r).find(e => e.x.no === no); if (!e) return rxGone;
    const { x, now, d } = e, f = rxFul(p, x), py = rxPayOf(p, x), D = CPD[x.dispatch], cancelled = rxStat(x) === 'Cancelled', rc = x.recall;
    const banner = cancelled ? `<div class="pt-warn rx-ban red"><i class="ri-close-circle-line"></i><span><b>Cancelled</b>${esc(x.cancel ? x.cancel.reason : '')}<small>${esc(x.cancel ? x.cancel.by : '')} · ${rxDT(x.cancel && new Date(x.cancel.at))}</small></span></div>`
      : rc && rc.status === 'Pending' ? `<div class="pt-warn rx-ban"><i class="ri-arrow-go-back-line"></i><span><b>Recall pending</b>Requested from ${esc(f ? f.who : 'the dispenser')} — ${esc(rc.reason)}<small>${esc(rc.by)} · ${rxDT(new Date(rc.at))}. It stays Issued until they reply.</small></span></div>`
      : rc && rc.status === 'Declined' ? `<div class="pt-warn rx-ban"><i class="ri-information-line"></i><span><b>Recall declined</b>${esc(f ? f.who : 'The dispenser')} replied that it has already been dispensed, so this prescription stays Issued.</span></div>` : '';
    const items = `<section class="card card-pad stack g12"><h2 class="pt-h"><i class="ri-capsule-line"></i>Medicines</h2><div class="mh-rx-view">${(x.items || []).map(it => `<div class="mh-rx-it"><b class="fw5">${esc(it.name)} ${esc(it.dose)} ${esc(it.unit)}</b><small>${esc(rxQty(it))}</small>${it.dirs ? `<p>${esc(it.dirs)}</p>` : ''}</div>`).join('')}</div></section>`;
    const signed = `<section class="card card-pad stack g12"><h2 class="pt-h"><i class="ri-quill-pen-line"></i>Signed by</h2>${kv([['Prescriber', esc(x.by || '—')], ['Registration', esc(x.reg || '—')], ['Organisation', esc(x.org || '—')], ['Issued', rxDT(d)]])}
      <div class="rx-sigbox"><i class="ri-quill-pen-line"></i><span><b>${x.sig === 'Drawn' ? 'Drawn signature on file' : esc(x.sig || 'Signature on file')}</b><small>Locked at issue — a signed prescription can’t be edited${cancelled ? '' : '. To change it, cancel it and write a new one'}.</small></span></div></section>`;
    const fulBox = `<section class="card card-pad stack g12"><h2 class="pt-h"><i class="ri-truck-line"></i>How it reaches the patient</h2>
      <div class="row g8 wrap">${D ? chip(D[0], 't-blue', D[1]) : ''}</div>
      ${f ? kv([['Fulfilment', chip(f.t, f.tone, f.i)], [x.dispatch === 'stock' ? 'Dispensed by' : 'Pharmacy', esc(f.who)]]) : '<p class="caption" style="margin:0">Given to the patient — nothing is sent anywhere, so there is no fulfilment to follow.</p>'}
      ${x.delivery ? `<b class="sub2">Delivery address</b>${kv([['Name', esc(x.delivery.name)], ['Phone', esc(x.delivery.phone)], ['Address', esc(addrLine(x.delivery))]])}<small class="caption">Confirmed ${rxDT(new Date(x.delivery.confirmedAt))} for this order. Later changes to the patient’s profile don’t change it.</small>` : ''}
      ${rxCanRedirect(p, x) ? `<div class="rx-redir"><small>Not sent anywhere yet — it can still be sent on:</small><div class="row g8 wrap">${CPD_ON.pharmacy() ? `<button class="btn outlined sm" data-act="rx-redir" data-v="pharmacy" data-id="${esc(x.no)}"><i class="ri-store-2-line"></i>Send to pharmacy</button>` : ''}${CPD_ON.stock() ? `<button class="btn outlined sm" data-act="rx-redir" data-v="stock" data-id="${esc(x.no)}"><i class="ri-archive-2-line"></i>Dispense from our stock</button>` : ''}</div></div>` : ''}
      ${f && f.row ? '<a class="btn text sm brand" href="#/inventory/dispensing" style="align-self:flex-start">Open in the dispensing queue<i class="ri-arrow-right-s-line"></i></a>' : ''}${rxDemo(p, x, f)}</section>`;
    const payBox = `<section class="card card-pad stack g12"><h2 class="pt-h"><i class="ri-bank-card-line"></i>Payment</h2>
      ${x.fee === 'Paid prescription' ? kv([['Fee', `£${Number(x.feeAmt || 0).toFixed(2)}`], ['Method', esc(x.pay || '—')], ['Status', chip(py.t, py.tone, py.i)]]) : '<p class="caption" style="margin:0">Free prescription — no charge was made.</p>'}
      ${py.inv ? `<div class="row g8 wrap"><a class="btn outlined sm" href="#/billing/invoice/${py.inv.id}">Invoice ${py.inv.id}</a>${py.inv.status === 'Refund applicable' ? `<button class="btn primary sm" data-act="bl-new-refund" data-id="${py.inv.id}"><i class="ri-refund-2-line"></i>Start refund</button>` : ''}</div>` : ''}</section>`;
    const tl = `<section class="card card-pad stack g12"><h2 class="pt-h"><i class="ri-time-line"></i>Timeline</h2><ol class="bl-tl">${rxLog(x).slice().reverse().map(([t, at, by]) => `<li><b>${esc(t)}</b><small>${rxDT(new Date(at))}${by ? ` · ${esc(by)}` : ''}</small></li>`).join('')}</ol></section>`;
    return `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/patients">Patients</a><span>/</span><a href="#/patients">Patients List</a><span>/</span><a href="#/patients/${p.id}">Patients Details</a><span>/</span><a href="#/patients/${p.id}/medical-history">Medical History</a><span>/</span><span class="cur">${esc(x.no)}</span></nav>
      <div class="pt-bar"><button class="btn outlined sm pt-dark" data-act="rx-back"><i class="ri-arrow-left-s-line"></i>Go Back</button><h1 class="pt-h1">Prescription ${esc(x.no)}</h1>${rxStatChip(x)}${cancelled ? '' : rxState(now)}<span class="grow"></span>
        ${rxCanCancel(p, x) ? `<button class="btn outlined" data-act="rx-cancel" data-id="${esc(x.no)}"><i class="ri-close-circle-line"></i>Cancel prescription</button>` : ''}</div>
      <p class="caption" style="margin:-4px 0 0">${esc(PT.name(p))} · issued ${rxDT(d)}</p>
      ${banner}<div class="dgrid3"><div class="stack g16">${items}${signed}</div><aside class="stack g16">${fulBox}${payBox}${tl}</aside></div>`; }, rxMeta);

  /* Giving it to the patient creates no fulfilment, so until something is
     sent it can still be sent: from here, after issue. */
  const rxCanRedirect = (p, x) => mayRx() && rxStat(x) === 'Issued' && !x.recall && (!x.dispatch || x.dispatch === 'give') && (CPD_ON.pharmacy() || CPD_ON.stock());
  const rxSendOn = (p, x, kind, ph, addr) => { const me = App.me().name, at = new Date().toISOString(); x.dispatch = kind;
    if (kind === 'pharmacy') { x.pharmacy = ph; x.ful = { status: 'Sent' }; x.delivery = { ...addr, confirmedAt: at, confirmedBy: me }; rxNote(x, `Sent to ${ph}`); rxNote(x, 'Delivery address confirmed for this order'); }
    else { delete x.ful; rxNote(x, 'Added to the dispensing queue'); }
    (x.items || []).forEach(it => { const m = rec(p).meds.find(q => q.id === it.id); if (m) m.dispatch = kind; }); };
  acts['rx-redir'] = el => { const p = cur(), x = rxFind(p, el.dataset.id); if (!x || !rxCanRedirect(p, x)) return;
    if (el.dataset.v === 'stock') return App.dialog(modal('ri-archive-2-line', 'Dispense from our stock', `${esc(x.no)} goes into the practice dispensing queue.`,
      '<p class="caption" style="margin:0">Staff will prepare the charge, dispense it and hand it over, deliver or post it. The prescription itself is not changed.</p>',
      `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="rx-redir-go" data-v="stock" data-id="${esc(x.no)}">Add to the queue</button>`, 'green'), { width: 480 });
    const a = addrOf(p);
    App.dialog(modal('ri-store-2-line', 'Send to pharmacy', `${esc(x.no)} · confirm where it is going.`,
      `${S('Pharmacy', 'pharm', pharmsOn().map(q => q.name), '', { req: true, ph: 'Choose a pharmacy' })}${kv([['Patient', esc(a.name)]])}${F('Phone number', 'ad_phone', a.phone, { req: true })}${F('Address', 'ad_line', a.line, { req: true })}<div class="g2">${F('City', 'ad_city', a.city, { req: true })}${F('Postcode', 'ad_pc', a.postcode, { req: true })}</div><p class="caption" style="margin:0">Changes apply to this order only — the patient’s profile isn’t edited.</p>`,
      `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="rx-redir-go" data-v="pharmacy" data-id="${esc(x.no)}">Confirm address and send</button>`, 'green', 'md-dlg'), { width: 520 }); };
  acts['rx-redir-go'] = el => { const p = cur(), x = rxFind(p, el.dataset.id); if (!x || !rxCanRedirect(p, x)) return;
    if (el.dataset.v === 'stock') { rxSendOn(p, x, 'stock'); App.closeModal(); App.render(); return App.snack(`${x.no} added to the dispensing queue.`); }
    const d = formData(); if (!needs(d, ['pharm', 'ad_phone', 'ad_line', 'ad_city', 'ad_pc'])) return;
    rxSendOn(p, x, 'pharmacy', d.pharm, { name: PT.name(p), phone: d.ad_phone.trim(), line: d.ad_line.trim(), city: d.ad_city.trim(), postcode: d.ad_pc.trim().toUpperCase() });
    App.closeModal(); App.render(); App.snack(`${x.no} sent to ${d.pharm}.`); };

  acts['rx-back'] = () => { const p = cur(); rec(p).f.mhTab = 'rx'; App.go(`#/patients/${p.id}/medical-history`); };

  /* ---------- cancelling ---------- */
  acts['rx-cancel'] = el => { if (!App.can('Prescriptions', 'Cancel')) return App.snack('Your role cannot cancel prescriptions.', 'error');
    const p = cur(), x = rxFind(p, el.dataset.id); if (!x || !rxCanCancel(p, x)) return;
    const kind = rxCancelKind(p, x), f = rxFul(p, x), v = rxInv(p, x), paid = v && v.pays.length > 0, fee = `£${Number(x.feeAmt || 0).toFixed(2)}`;
    const money = x.fee !== 'Paid prescription' ? '' : paid ? ` ${fee} has been paid, so the charge will show <b>Refund applicable</b> in Billing. Nothing is refunded automatically.` : ` The ${fee} charge in Billing will be cancelled.`;
    const msg = kind === 'recall'
      ? `<b>${esc(f.who)} has already taken this on.</b> A recall request is sent instead of cancelling straight away. The prescription stays Issued, marked Recall pending, until they confirm or reply that it has already been dispensed.${money}`
      : `<b>This cancels it straight away</b> — nothing has been dispensed or accepted yet, and a cancelled prescription can’t be reopened. The medicines on the patient’s list are not changed.${money}`;
    App.dialog(modal('ri-close-circle-line', kind === 'recall' ? 'Request a recall' : 'Cancel prescription', `${esc(x.no)} · ${(x.items || []).map(i => esc(i.name)).join(', ')}`,
      `<div class="pt-warn"><i class="ri-error-warning-line"></i><span>${msg}</span></div>${F('Reason', 'reason', '', { req: true, area: true, max: 300, ph: 'Why is this prescription being cancelled? It is kept in the record.' })}`,
      `<button class="btn outlined lg" data-act="close-modal">Keep it</button><button class="btn danger lg" data-act="rx-cancel-go" data-id="${esc(x.no)}">${kind === 'recall' ? 'Request recall' : 'Cancel prescription'}</button>`, 'red'), { width: 520 }); };
  acts['rx-cancel-go'] = el => { const d = formData(); if (!needs(d, ['reason'])) return;
    const p = cur(), x = rxFind(p, el.dataset.id); if (!x || !rxCanCancel(p, x)) return;
    const why = d.reason.trim(), me = App.me().name, f = rxFul(p, x);
    if (rxCancelKind(p, x) === 'recall') { x.recall = { status: 'Pending', reason: why, by: me, at: new Date().toISOString() };
      rxNote(x, `Recall requested from ${f.who} — ${why}`); App.closeModal(); App.render(); return App.snack(`Recall requested.\n${x.no} stays Issued until ${f.who} replies.`); }
    const k = rxFinishCancel(p, x, why, me); App.closeModal(); App.render();
    App.snack(`${x.no} cancelled.${k === 'refund' ? '\nThe charge now shows Refund applicable in Billing.' : k === 'charge' ? '\nThe charge in Billing was cancelled.' : ''}`); };
  acts['rx-demo'] = el => { const p = cur(), x = rxFind(p, el.dataset.id); if (!x) return; const f = rxFul(p, x), who = f ? f.who : 'The dispenser', v = el.dataset.v;
    if (v === 'accept') { x.ful = Object.assign(x.ful || {}, { status: 'Accepted' }); rxNote(x, `${who} accepted the order`, who); }
    if (v === 'recall-no' && x.recall) { x.recall.status = 'Declined'; rxNote(x, `${who} replied that it has already been dispensed — the recall can’t be completed`, who); }
    if (v === 'recall-ok' && x.recall) { x.recall.status = 'Confirmed'; rxNote(x, `${who} confirmed the recall`, who); rxFinishCancel(p, x, x.recall.reason, x.recall.by); }
    App.render(); };

  PT.tabs['medical-history'] = p => { rxSync(p); const r = rec(p), tab = mhTab(r);
    const n = { cond: r.cond.filter(c => c.status === 'Active').length, meds: r.meds.filter(m => m.status === 'Active').length, alg: r.alg.length, rx: rxScripts(r).length };
    return title('Medical History') + `<div class="stack g16">
      <div class="card pt-segcard mh-bar">${seg('mh-tab', mhTabs().map(([k, t, i]) => [k, `${t} (${n[k]})`, i]), tab)}</div>
      ${tab === 'cond' ? condBox(r) : tab === 'alg' ? algBox(r) : tab === 'rx' ? rxBox(p, r) : medsBox(r)}</div>`; };
  /* the page is rebuilt on every change, and a shorter one clamps the scroll —
     so where the reader was is put back by hand */
  const mhGo = (k, v) => { const r = rec(cur()), y = scrollY; r.f[k] = v; App.render(); scrollTo(0, y); };
  /* A row saved onto a tab you are not looking at reads as nothing happening, so
     the view moves to where the row actually is. */
  const medReveal = (r, ms) => { r.f.mhTab = 'meds';
    const n = k => ms.filter(m => medIn(m, k)).length;
    r.f.medF = MEDF.reduce((best, k) => n(k) > n(best) ? k : best, medF(r)); };
  acts['mh-tab'] = el => mhGo('mhTab', el.dataset.v);
  acts['med-f'] = el => mhGo('medF', el.dataset.v);

  const SRC = ['Weightfall', 'LeafEase', 'Clinician', 'Minor Ops'], BY = ['Clinician', 'Self', 'GP'];
  const MH = {
    cond: ['ri-heart-add-line', 'Medical Condition', 'Record a condition on this patient’s history.', x => FT('Condition name', 'name', x.name, { req: true, ph: 'Type condition name' }) + FT('Description', 'desc', x.desc, { req: true, area: true, ph: 'Type description here' }) + ST('Status', 'status', ['Active', 'Resolved'], x.status || 'Active', { req: true }) + `<div class="g2">${ST('Source', 'source', SRC, x.source || 'LeafEase', { req: true })}${ST('Added by', 'by', BY, x.by || 'Clinician', { req: true })}</div>`, ['name', 'desc'], 'Condition'],
    alg: ['ri-virus-line', 'Allergy', 'Record an allergy on this patient’s history.', x => FT('Allergy name', 'name', x.name, { req: true, ph: 'e.g. Penicillin' }) + ST('Severity', 'severity', ['Low', 'Medium', 'High'], x.severity || 'Low', { req: true }) + FT('Reaction', 'reaction', x.reaction, { req: true, area: true, ph: 'What happens when they’re exposed' }) + `<div class="g2">${ST('Source', 'source', SRC, x.source || 'LeafEase', { req: true })}${ST('Added by', 'by', BY, x.by || 'Clinician', { req: true })}</div>`, ['name', 'reaction'], 'Allergy']
  };
  const mhOpen = (k, x) => { const [icon, t, sub, body] = MH[k];
    App.dialog(modal(icon, `${x.id ? 'Edit' : 'Add'} ${t}`, x.id ? `Update ${esc(x.name)}` : sub, body(x), `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="mh-save" data-k="${k}" data-id="${x.id || ''}">${x.id ? 'Save changes' : 'Add ' + MH[k][5]}</button>`, 'green', 'md-dlg'), { width: 540 }); };
  acts['mh-save'] = el => { const k = el.dataset.k, d = formData(); if (!needs(d, MH[k][4])) return; const r = rec(cur()), list = r[k];
    r.f.mhTab = k === 'cond' ? 'cond' : 'alg';
    const x = list.find(i => i.id === el.dataset.id); if (x) Object.assign(x, d); else list.unshift({ id: uid(), ...d });
    App.closeModal(); App.render(); App.snack(`${d.name} ${x ? 'updated' : 'added to the medical history'}.`); };
  acts['mh-del'] = el => { const k = el.dataset.k, x = rec(cur())[k].find(i => i.id === el.dataset.id);
    confirmDel('Delete medical history', 'Are you sure you want to delete the following entry?', 'ri-file-text-line', x.name, esc(x.desc || x.reaction || `${x.dose} ${x.unit} · ${x.freq}`), 'mh-del-go', k + ':' + x.id, 'entry'); };
  acts['mh-del-go'] = el => { const [k, id] = el.dataset.id.split(':'); const list = rec(cur())[k]; const i = list.findIndex(x => x.id === id); const [x] = list.splice(i, 1); App.closeModal(); App.render(); App.snack(`${x.name} deleted.`, 'success', { label: 'Undo', fn: () => { list.splice(i, 0, x); App.render(); } }); };

  /* ---------- Add medications to the list ----------
     Adding records what the patient takes; it never issues anything. Several
     medicines go on at once, which is how a discharge letter or a repeat slip
     actually arrives, and one "where it came from" covers the whole batch:
     either this practice put them on the list, or another provider prescribed
     them and we are writing them down with their provenance. */
  const MEDU = ['mg', 'mcg', 'ml', 'units'];
  const RX_INFO = ['Patient reported', 'GP record or summary', 'Hospital discharge letter', 'Repeat prescription slip', 'Pharmacy record', 'Other'];
  const RX_VERIFY = ['Patient reported — not yet verified', 'Verified against a document'];
  const MDREQ = { name: 'n', dose: 'd', freq: 'f', start: 's' };
  let md = null, mdKey = 0;
  const mdBlank = () => ({ k: ++mdKey, name: '', dose: '', unit: 'mg', freq: '', start: '', end: '', status: 'Active', course: 'Repeat', cd: false });

  const mdRead = () => { const f = App.$('#pt-form'); if (!md || !f) return;
    const d = Object.fromEntries(new FormData(f));
    md.rows.forEach(v => Object.assign(v, { name: d['n' + v.k] ?? v.name, dose: d['d' + v.k] ?? v.dose, unit: d['u' + v.k] || v.unit,
      freq: d['f' + v.k] ?? v.freq, start: d['s' + v.k] ?? v.start, end: d['e' + v.k] ?? v.end, status: d['st' + v.k] || v.status, course: d['co' + v.k] || v.course, cd: !!d['cd' + v.k] }));
    if (d.source) md.source = d.source; if (d.by) md.by = d.by;
    ['prescriber', 'org', 'infoSrc', 'verify'].forEach(x => { if (d[x] !== undefined) md.prov[x] = d[x]; });
    md.attest = !!d.attest; };

  const mdRow = (v, i, n) => `<div class="md-row" id="md-${v.k}">
    ${n > 1 ? `<div class="md-row-h"><b>Medication ${i + 1}</b><button type="button" class="icon-btn s20 danger" data-act="med-drop" data-k="${v.k}" aria-label="Remove medication ${i + 1}" title="Remove"><i class="ri-close-line"></i></button></div>` : ''}
    ${FT('Medication name', 'n' + v.k, v.name, { req: true, ph: 'e.g. Metformin' })}
    <div class="md-dose">${FT('Dosage', 'd' + v.k, v.dose, { req: true, type: 'number' })}${ST('Unit', 'u' + v.k, MEDU, v.unit, { req: true })}</div>
    ${FT('Frequency', 'f' + v.k, v.freq, { req: true, ph: 'e.g. Once daily' })}
    <div class="g2">${FT('Start date', 's' + v.k, v.start, { req: true, type: 'date' })}${FT('End date', 'e' + v.k, v.end, { type: 'date' })}</div>
    <div class="g2">${ST('Status', 'st' + v.k, ['Active', 'Completed', 'Stopped'], v.status, { req: true })}${ST('Course', 'co' + v.k, ['Repeat', 'Acute'], v.course, { req: true })}</div>
    <label class="cbx md-cd"><input type="checkbox" name="cd${v.k}" ${v.cd ? 'checked' : ''}>Controlled drug</label>
  </div>`;

  const mdModal = () => { const r = rec(cur()), n = md.rows.length, edit = !!md.editId, other = md.src === 'other';
    App.dialog(modal('ri-capsule-line', edit ? 'Edit medication' : n > 1 ? `Add ${n} medications` : 'Add medication',
      edit ? `Update ${esc(md.rows[0].name || 'this medicine')} on this patient’s list.` : 'Record what the patient is taking. This adds it to their list; it does not create a prescription.',
      `${r.alg.length ? `<div class="pt-warn rx-alg"><i class="ri-alert-line"></i><span><b>Check recorded allergies</b>${r.alg.map(a => `${esc(a.name)} · ${esc(a.severity)}`).join(', ')}</span></div>` : ''}
      <div class="stack g12" id="md-rows">${md.rows.map((v, i) => mdRow(v, i, n)).join('')}</div>
      ${edit ? '' : `<button type="button" class="btn outlined block md-more" data-act="med-add-row"><i class="ri-add-line"></i>Add another medication</button>`}
      <b class="md-h">Where ${n > 1 ? 'they came' : 'it came'} from</b>
      <div class="pt-seg md-seg" role="tablist" aria-label="Where it came from">${[['here', 'This practice'], ['other', 'Prescribed elsewhere']].map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === md.src}" class="${k === md.src ? 'on' : ''}" data-act="med-src" data-v="${k}">${t}</button>`).join('')}</div>
      ${other
        ? `<div class="pt-note"><i class="ri-information-line"></i><span>Recorded, not issued. ${n > 1 ? 'These medications go' : 'This medication goes'} on the list with ${n > 1 ? 'their' : 'its'} original prescriber, ready to be prescribed from here later.</span></div>
          <div class="g2">${FT('Prescriber', 'prescriber', md.prov.prescriber, { req: true, ph: 'e.g. Dr A Rahman' })}${FT('Organisation', 'org', md.prov.org, { req: true, ph: 'e.g. Northside Medical Practice' })}</div>
          ${ST('Where this information came from', 'infoSrc', RX_INFO, md.prov.infoSrc, { req: true, ph: 'Choose a source' })}
          ${ST('Verification', 'verify', RX_VERIFY, md.prov.verify || RX_VERIFY[0], { req: true })}
          <label class="dropzone pt-drop ${md.file ? 'has' : ''}" id="md-drop"><input type="file" accept=".jpg,.jpeg,.png,.pdf" hidden data-ch="med-file"><i class="ri-upload-cloud-2-line"></i><b>${md.file ? esc(md.file) : 'Attach evidence (optional)'}</b><span class="caption">Repeat slip, GP letter or discharge summary — JPEG, PNG or PDF</span><span class="btn outlined sm pt-dark">Browse File</span></label>
          <label class="cbx cp-attest" id="md-attest"><input type="checkbox" name="attest" ${md.attest ? 'checked' : ''}><span>I confirm ${n > 1 ? 'these medications were' : 'this medication was'} prescribed by another provider and I have recorded ${n > 1 ? 'them' : 'it'} from the source above.</span></label>`
        : `<div class="g2">${ST('Source', 'source', SRC, md.source, { req: true })}${ST('Added by', 'by', BY, md.by, { req: true })}</div>`}`,
      `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="med-save">${edit ? 'Save changes' : n > 1 ? `Add ${n} medications` : 'Add medication'}</button>`, 'green', 'md-dlg'), { width: 600 }); };

  const mdOpen = x => { md = { rows: [x ? { ...mdBlank(), ...x, dose: x.dose ?? '', course: x ? courseOf(x) : 'Repeat' } : mdBlank()], editId: x ? x.id : '',
      src: x && x.ext ? 'other' : 'here', source: (x && x.source) || 'LeafEase', by: (x && x.by) || 'Clinician',
      prov: { prescriber: (x && x.prescriber) || '', org: (x && x.org) || '', infoSrc: (x && x.infoSrc) || '', verify: (x && x.verify) || '' },
      file: (x && x.evidence) || '', attest: !!x };
    mdModal(); };
  /* ---------- Read a row ----------
     The table shows what fits; this shows the rest — provenance for a medicine
     recorded from elsewhere, and the prescription for one that has gone out. */
  const VIEW = {
    cond: ['ri-heart-add-line', 'Medical condition', x => [['Condition', x.name], ['Description', x.desc], ['Status', x.status], ['Source', x.source], ['Added by', x.by]]],
    alg: ['ri-virus-line', 'Allergy', x => [['Allergy', x.name], ['Severity', x.severity], ['Reaction', x.reaction], ['Source', x.source], ['Added by', x.by]]],
    meds: ['ri-capsule-line', 'Medication', x => [['Medicine', x.name], ['Dosage', `${x.dose} ${x.unit}`], ['Frequency', x.freq], ['Status', x.status], ['Course', courseOf(x)],
      ['Start date', PT.dmy(x.start)], ['End date', x.end ? PT.dmy(x.end) : 'Ongoing'], ['Source', x.source], ['Added by', x.by],
      ...(x.cd ? [['Controlled drug', 'Yes']] : [])]]
  };
  acts['mh-view'] = el => { const k = el.dataset.k, x = rec(cur())[k].find(i => i.id === el.dataset.id); if (!x) return;
    const [icon, t, rows] = VIEW[k];
    const extra = k !== 'meds' ? '' : `${x.ext ? `<b class="sub2">Prescribed elsewhere</b>${kv([['Prescriber', esc(x.prescriber)], ['Organisation', esc(x.org)], ['Information source', esc(x.infoSrc || '—')], ['Verification', esc(x.verify || '—')], ['Evidence', x.evidence ? esc(x.evidence) : 'None attached']])}` : ''}
      ${x.prescribed ? `<b class="sub2">Prescription</b>${kv([['Number', esc(x.script || '—')], ['Issued', esc(x.issued)], ['Prescriber', esc(x.prescriber)], ['Dispatch', esc((CPD[x.dispatch] || ['—'])[0])], ['Fee', x.fee === 'Paid prescription' ? `£${Number(x.feeAmt || 0).toFixed(2)} · ${esc(x.pay || '')} · ${esc(x.payStatus || '')}` : esc(x.fee || 'Free prescription')]])}` : ''}`;
    App.dialog(modal(icon, esc(x.name), `${t} on this patient’s record`,
      `${kv(rows(x).map(([a, b]) => [a, esc(b)]))}${extra}`,
      `<button class="btn outlined lg" data-act="close-modal">Close</button>${editable(x) ? `<button class="btn primary lg" data-act="mh-edit" data-k="${k}" data-id="${x.id}"><i class="ri-edit-box-line"></i>Edit</button>` : ''}`, 'green', 'md-dlg'), { width: 540 }); };
  acts['mh-add'] = el => el.dataset.k === 'meds' ? mdOpen(null) : mhOpen(el.dataset.k, {});
  acts['mh-edit'] = el => { const x = rec(cur())[el.dataset.k].find(i => i.id === el.dataset.id);
    el.dataset.k === 'meds' ? mdOpen(x) : mhOpen(el.dataset.k, x); };
  acts['med-add-row'] = () => { mdRead(); md.rows.push(mdBlank()); mdModal();
    App.$(`#md-${md.rows[md.rows.length - 1].k} input`)?.focus(); };
  acts['med-drop'] = el => { mdRead(); md.rows = md.rows.filter(v => v.k !== +el.dataset.k); mdModal(); };
  acts['med-src'] = el => { mdRead(); md.src = el.dataset.v; mdModal(); };
  chs['med-file'] = el => { const f = el.files[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) return App.snack('That file is over 10 MB. Choose a smaller file.', 'error');
    mdRead(); md.file = f.name; mdModal(); };

  acts['med-save'] = () => { mdRead(); const r = rec(cur()), other = md.src === 'other', n = md.rows.length;
    const need = [];
    md.rows.forEach(v => Object.entries(MDREQ).forEach(([f, pre]) => { if (!String(v[f] ?? '').trim()) need.push(pre + v.k); }));
    md.rows.forEach(v => { if (v.end && v.start && v.end < v.start) need.push('e' + v.k); });
    if (other) ['prescriber', 'org', 'infoSrc'].forEach(f => { if (!String(md.prov[f] || '').trim()) need.push(f); });
    App.$$('#pt-form .field').forEach(f => { const k = f.querySelector('[name]')?.name; f.classList.toggle('err', need.includes(k)); });
    if (need.length) { App.$(`#pt-form [name="${need[0]}"]`)?.focus();
      return App.snack(/^e\d/.test(need[0]) && md.rows.some(v => v.end && v.start && v.end < v.start) ? 'An end date must be after its start date.' : 'Fill in the fields marked in red.', 'error'); }
    if (other) { const at = App.$('#md-attest'); at.classList.toggle('err', !md.attest);
      if (!md.attest) return App.snack('Confirm the declaration before recording.', 'error'); }
    const base = other
      ? { source: 'External', by: 'Clinician', ext: true, prescriber: md.prov.prescriber, org: md.prov.org, infoSrc: md.prov.infoSrc, verify: md.prov.verify || RX_VERIFY[0], evidence: md.file || '' }
      : { source: md.source, by: md.by, ext: false, prescriber: '', org: '', infoSrc: '', verify: '', evidence: '' };
    if (md.editId) { const x = r.meds.find(i => i.id === md.editId), v = md.rows[0];
      Object.assign(x, base, { name: v.name, dose: +v.dose, unit: v.unit, freq: v.freq, start: v.start, end: v.end, status: v.status, course: v.course, cd: v.cd });
      medReveal(r, [x]); md = null; App.closeModal(); App.render(); return App.snack(`${x.name} updated.`); }
    md.rows.forEach(v => r.meds.unshift({ id: uid(), ...base, name: v.name, dose: +v.dose, unit: v.unit, freq: v.freq, start: v.start, end: v.end, status: v.status, course: v.course, cd: v.cd }));
    const names = md.rows.map(v => v.name);
    medReveal(r, r.meds.slice(0, md.rows.length));
    md = null; App.closeModal(); App.render();
    App.snack(n === 1 ? `${names[0]} added to the medication list.${other ? '\nRecorded from another provider — nothing has been prescribed.' : ''}`
      : `${n} medications added to the list\n${names.join(' · ')}${other ? ' — recorded from another provider.' : ''}`); };

  /* ---------- Create prescription ----------
     The signed, issued kind: pick medicines off the patient's own list, say how
     each is to be taken, choose how it reaches them, then sign for it. Modelled
     on the developed app's Create prescription dialog. */
  const CPD = {
    give: ['Give to patient', 'ri-user-shared-2-line', 'Signed prescription for collection from any pharmacy.'],
    pharmacy: ['Send to pharmacy', 'ri-store-2-line', 'A linked pharmacy dispenses it and delivers to the patient.'],
    stock: ['Dispense from practice stock', 'ri-archive-2-line', 'Staff dispense from inventory for handover, delivery or post.']
  };
  const CPUNIT = App.UNITS;

  /* The pharmacies this business can send to. The Pharmacies page (invite, revoke)
     will own this list; until it exists it is seeded, so the picker has real
     choices and an invited or revoked pharmacy is shown to be left out of it. */
  const PHARM = App.S.pharmacies = App.S.pharmacies || [
    { id: 'ph1', name: 'Boots Pharmacy — Leicester', ods: 'FA123', gphc: '1032456', phone: '0116 254 0001', addr: '12 Gallowtree Gate, Leicester LE1 5AD', status: 'Active' },
    { id: 'ph2', name: 'Highfields Community Pharmacy', ods: 'FQ872', gphc: '1045123', phone: '0116 266 5522', addr: '88 Melbourne Road, Leicester LE2 0DS', status: 'Active' },
    { id: 'ph3', name: 'Oadby Late Night Pharmacy', ods: 'FJ440', gphc: '1051987', phone: '0116 271 8800', addr: '4 The Parade, Oadby LE2 5BF', status: 'Invited' },
    { id: 'ph4', name: 'Westcotes Pharmacy', ods: 'FM019', gphc: '1022744', phone: '0116 255 1234', addr: '210 Narborough Road, Leicester LE3 0PE', status: 'Revoked' }];
  const pharmsOn = () => (App.S.pharmacies || PHARM).filter(x => x.status === 'Active');
  /* An option nobody can use is not shown: no active pharmacy means no way to
     send one, and with Inventory switched off there is no stock to dispense. */
  const CPD_ON = { give: () => true, pharmacy: () => pharmsOn().length > 0, stock: () => !!App.IV && !App.S.inventoryOff };
  const cpAvail = () => Object.keys(CPD).filter(k => CPD_ON[k]());
  const addrOf = p => ({ name: PT.name(p), phone: p.phone || '', line: p.addr || '', city: p.city || '', postcode: p.postcode || '' });
  const addrLine = a => [a.line, a.city, a.postcode].filter(Boolean).join(', ');
  let cp = null;
  const PAYM = () => PT.payMethods('rx');

  /* the warning the developed app shows: this medicine has gone out before */
  /* The current prescription a medicine is already on, if there is one. A past
     course is history rather than a clash, so only a running one is returned.
     Issuing again is allowed — it is a second, independent prescription — but
     the person writing it is told before they sign. */
  const cpOnRx = (r, m) => { const same = i => i.id === m.id || String(i.name).toLowerCase() === m.name.toLowerCase();
    const e = rxList(r).find(e => e.now && (e.x.items || []).some(same)); if (!e) return null;
    const it = e.x.items.find(same), days = rxDays(it), end = e.d && days ? new Date(e.d.getTime() + days * 864e5) : null;
    return { no: e.x.no, issued: rxDmy(e.d), end: end ? rxDmy(end) : null }; };
  const cpDupText = (m, d) => `${m.name} is already on ${d.no}, issued ${d.issued}${d.end ? ` and running until ${d.end}` : ' and still current'}. Issuing again creates a second, independent prescription.`;
  const cpSelIds = r => (r.f.rxSel || []).filter(id => r.meds.some(m => m.id === id));

  /* read the form back before any re-render, so nothing typed is lost */
  const cpRead = () => { const f = App.$('#pt-form'); if (!cp || !f) return;
    const d = Object.fromEntries(new FormData(f));
    /* only the medicine that is open has fields on screen; the others keep what
       was typed into them rather than being read back as empty */
    Object.keys(cp.sel).forEach(id => { if (d['q_' + id] === undefined && d['dir_' + id] === undefined) return;
      cp.sel[id] = { qty: d['q_' + id] ?? '', unit: d['u_' + id] || CPUNIT[0], dur: d['dur_' + id] ?? '', dirs: d['dir_' + id] ?? '' }; });
    if (d.dispatch) cp.dispatch = d.dispatch;
    if (d.pharm !== undefined) cp.pharm = d.pharm;
    cp.feeAmt = d.feeAmt ?? cp.feeAmt; cp.reg = d.reg ?? cp.reg;
    if (App.$('#cp-attest')) cp.attest = !!d.attest;
    ['receipt', 'receivedBy', 'transferDate', 'txnRef'].forEach(k => { if (d[k] !== undefined) cp.pay[k] = d[k]; }); };

  const cpStep = (n, t, hint) => `<span class="cp-step"><span class="cp-num">${n}</span><span class="cp-step-t"><b>${t}</b><small>${hint}</small></span></span>`;
  /* What a medicine reads as once its dosage is folded away again. */
  const cpSum = v => [String(v.qty).trim() ? `${v.qty} ${v.unit || ''}`.trim() : '', String(v.dur).trim() ? `${v.dur} days` : '', v.dirs].filter(Boolean).join(' · ');
  const cpDone = v => !!(String(v.qty).trim() && String(v.dirs).trim());
  /* One medicine at a time. Picking and prescribing used to sit in two places
     with an empty band in between; they are one job, so they are one control —
     and only the medicine being worked on is open, so a prescription for three
     never grows past the window. The rest read back as the line they came to. */
  const cpMed = (r, m) => { const on = !!cp.sel[m.id], v = cp.sel[m.id] || {}, open = on && cp.open === m.id;
    const line = !on || open ? `${esc(m.dose)} ${esc(m.unit)} · ${esc(m.freq)}` : cpDone(v) ? esc(cpSum(v)) : 'Dosage needed';
    const dup = cpOnRx(r, m);
    return `<div class="cp-med ${on ? 'on' : ''} ${open ? 'open' : ''} ${dup ? 'dup' : ''}">
      <div class="cp-med-top">
        <label class="cp-tick"><input type="checkbox" data-ch="cp-tick" data-id="${m.id}" ${on ? 'checked' : ''} aria-label="Prescribe ${esc(m.name)}"></label>
        <button type="button" class="cp-med-b" data-act="cp-row" data-id="${m.id}" aria-expanded="${open}">
          <b>${esc(m.name)} ${esc(m.dose)} ${esc(m.unit)}</b>
          <small class="${on && !open && !cpDone(v) ? 'need' : ''}">${line}</small>
        </button>
        ${dup ? `<span class="cp-dup" title="${esc(cpDupText(m, dup))}">${chip(`On ${dup.no}`, 't-orange', 'ri-alert-line')}</span>` : ''}
        <i class="cp-caret ${open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i>
      </div>
      ${open ? `<div class="cp-med-d">
        ${dup ? `<p class="cp-dup-note" role="alert"><i class="ri-alert-line"></i>${esc(cpDupText(m, dup))}</p>` : ''}
        ${F('Quantity', 'q_' + m.id, v.qty, { req: true, type: 'number', ...cpLive })}
        ${S('Unit', 'u_' + m.id, CPUNIT, v.unit || CPUNIT[0], { req: true })}
        ${F('Days', 'dur_' + m.id, v.dur, { type: 'number' })}
        ${F('Directions', 'dir_' + m.id, v.dirs, { req: true, ph: 'e.g. One tablet twice daily with food', ...cpLive })}
      </div>` : ''}
    </div>`; };
  /* The right column works the same way as the left: taking the payment and
     signing for it are the last two things that happen, and only one of them is
     open at a time, so the dialog never has to grow a scrollbar. */
  /* The prescription fee is for giving it to the patient. A pharmacy quotes its
     own price when it accepts, and the dispensary prepares the charge when it
     dispenses, so neither is priced here. */
  const cpPaid = () => cp.dispatch === 'give' && +cp.feeAmt > 0;
  /* How far the prescription has got, for the rail across the top. A step is
     only behind you once the one before it is: every medicine priced and
     written up, then the way it reaches them settled and moved past, then
     signed. Nothing counts itself finished early. */
  const cpOk1 = ids => ids.length > 0 && ids.every(id => cpDone(cp.sel[id]));
  /* Every part is on screen at once, so a step is behind you when you have
     worked on it — on the step itself, or on one after it. Settling how the
     medicine reaches them is a choice with an answer already in it, so it is
     the touch that counts, not a field going from empty to full. */
  const cpOk2 = ids => cpOk1(ids) && (cp.seen2 || cp.seen3) && (!cpPaid() || PAYM()[cp.method].need.every(k => String(cp.pay[k] || '').trim()))
    && (cp.dispatch !== 'pharmacy' || (!!cp.pharm && !!cp.addr));
  const cpSigned = () => cp.sigMode === 'draw' ? cp.strokes.length > 0 : !!cp.sigFile;
  const cpOk3 = ids => cpOk2(ids) && !!String(cp.reg).trim() && cp.attest && cpSigned();
  const cpAt = ids => cpOk3(ids) ? 4 : cpOk2(ids) ? 3 : cpOk1(ids) ? 2 : 1;
  const cpLive = { attrs: 'data-in="cp-rx-live"' };
  const cpRail = at => `<ol class="cp-rail" aria-label="Progress">${
    [[1, 'Medicines'], [2, 'How it reaches them'], [3, 'Sign and issue']].map(([k, t]) =>
      `<li class="${k < at ? 'done' : k === at ? 'on' : ''}" ${k === at ? 'aria-current="step"' : ''}>
        <span class="cp-rail-n">${k < at ? '<i class="ri-check-line"></i>' : k}</span><span class="cp-rail-t">${t}</span>
      </li>`).join('')}</ol>`;

  /* beside the title rather than in the body: it is always there, for every
     patient, and costs the dialog no height */
  const cpAlg = r => `<div class="cp-alg ${r.alg.length ? 'has' : ''}" role="group" aria-label="Recorded allergies">${r.alg.length
    ? `<i class="ri-alert-line"></i><b>Allergies</b>${r.alg.map(algChip).join('')}`
    : '<i class="ri-shield-check-line"></i><span>No known allergies recorded</span>'}</div>`;

  const cpModal = () => { const p = cur(), r = rec(p), me = App.me().name, org = App.biz ? App.biz().name : 'LeafEase';
    const meds = medList(r), ids = Object.keys(cp.sel), n = ids.length, paid = cpPaid();
    if (!cpAvail().includes(cp.dispatch)) cp.dispatch = 'give';
    cp.drawnPaid = paid; /* what is on screen, so the fee knows when it has to redraw */
    const dups = ids.filter(id => { const m = r.meds.find(x => x.id === id); return m && cpOnRx(r, m); }).length;
    const sum = [`${n || 'No'} medicine${n === 1 ? '' : 's'} selected`, cp.dispatch === 'pharmacy' && cp.pharm ? `Send to ${cp.pharm}` : CPD[cp.dispatch][0], ...(cp.dispatch === 'give' ? [paid ? `£${(+cp.feeAmt).toFixed(2)} · ${PAYM()[cp.method].t}` : 'No charge'] : []), ...(dups ? [`${dups} already on a current prescription`] : [])].join(' · ');
    App.dialog(`<div class="cp-dlg">
      <div class="dlg-head cp-head">
        <span class="pt-dlg-ic green cp-ic"><i class="ri-quill-pen-line"></i></span>
        <span class="cp-head-t"><h2 id="dlg-title">Create prescription</h2><small>${esc(PT.name(p))} · ${esc(me)}, ${esc(org)}</small></span>
        ${cpAlg(r)}
        <button class="icon-btn s20 cp-x" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button>
      </div>
      ${cpRail(cpAt(ids))}
      <form class="dlg-body" id="pt-form" onsubmit="return false">
        <div class="cp-grid">
          <section class="cp-card">
            <div class="cp-card-h">
              ${cpStep(1, 'Medicines', 'Pick one or more medicines, set the dosage and directions.')}
              <button type="button" class="btn outlined sm cp-addmed" data-act="cp-add-med"><i class="ri-add-line"></i>Add medicine</button>
            </div>
            <div class="cp-list" ${cp.listH ? `style="height:${cp.listH}px"` : ''}>${meds.length ? meds.map(m => cpMed(r, m)).join('') : '<p class="caption">No medications on this list to prescribe. Add one to get started.</p>'}${
              /* a short list would leave the card half empty beside the step next
                 to it, and a patient on one medicine is exactly when reaching for
                 another is likely: the room goes to the way of adding one */
              meds.length < 3 ? '<button type="button" class="cp-addtile" data-act="cp-add-med"><i class="ri-add-line"></i>Add another medicine</button>' : ''}</div>
          </section>
          <section class="cp-card cp-reach">
            <div class="cp-card-h">${cpStep(2, 'How it reaches them', 'Choose how the patient gets it.')}</div>
            <div class="cp-opts">${cpAvail().map(k => [k, ...CPD[k]]).map(([k, t, i, d]) => `<label class="cp-opt ${k === cp.dispatch ? 'on' : ''}"><input type="radio" name="dispatch" value="${k}" data-ch="cp-dispatch" ${k === cp.dispatch ? 'checked' : ''}><span class="cp-opt-ic"><i class="${i}"></i></span><span class="cp-opt-t"><b>${t}</b><small>${d}</small></span></label>`).join('')}</div>
            ${cp.dispatch === 'give' ? `<div class="cp-fee">
              <span class="cp-fee-t"><b>Prescription fee</b><small>Leave at 0 for no charge.</small></span>
              ${App.field('', `<span class="adorn">£</span><input id="ft-feeAmt" name="feeAmt" type="number" step="0.01" value="${esc(cp.feeAmt)}" placeholder="0.00" data-in="cp-amt" data-ch="cp-feeamt" aria-label="Prescription fee in pounds">`, { cls: 'cp-fee-f' })}
            </div>` : ''}
            ${cp.dispatch === 'pharmacy' ? `<div class="cp-ph">
              ${S('Pharmacy', 'pharm', pharmsOn().map(x => x.name), cp.pharm, { req: true, ph: 'Choose a pharmacy', attrs: 'data-ch="cp-pharm"' })}
              <div class="cp-addr ${cp.addr ? 'ok' : ''}" id="cp-addr">
                <i class="${cp.addr ? 'ri-checkbox-circle-line' : 'ri-map-pin-line'}"></i>
                <span class="cp-addr-t"><b>${cp.addr ? 'Delivery address confirmed' : 'Delivery address'}</b><small>${esc(addrLine(cp.addr || addrOf(p)))}${cp.addr ? '' : ' — check it before sending'}</small></span>
                <button type="button" class="btn outlined sm" data-act="cp-addr" ${cp.pharm ? '' : 'disabled'}>${cp.addr ? 'Edit' : 'Confirm address'}</button>
              </div>
            </div>` : ''}
            ${paid ? `<div class="cp-paybox">${PT.payTabs(PAYM(), cp.method, 'cp-pay-m')}${PAYM()[cp.method].body({ ...cp.pay, price: +cp.feeAmt || 0 })}</div>` : ''}
          </section>
          <section class="cp-card cp-sign">
            <div class="cp-card-h">${cpStep(3, 'Sign and issue', `Signed by ${esc(me)}.`)}</div>
            <div class="cp-sign-b">
              <div class="cp-sign-id">
                ${F('Registration number (e.g. GMC)', 'reg', cp.reg, { req: true, attrs: 'data-in="cp-step3"' })}
                <label class="cbx cp-attest" id="cp-attest"><input type="checkbox" name="attest" data-ch="cp-step3" ${cp.attest ? 'checked' : ''}><span>I am registered and authorised to prescribe, I have assessed this patient, and this signature is mine.</span></label>
              </div>
              <div class="cp-sign-pad">
                <div class="cp-sigmode"><label>Signature</label><div class="pt-seg cp-sigseg" role="tablist" aria-label="Signature">${[['draw', 'Draw', 'ri-quill-pen-line'], ['upload', 'Upload image', 'ri-upload-2-line']].map(([k, t, i]) => `<button type="button" role="tab" aria-selected="${k === cp.sigMode}" class="${k === cp.sigMode ? 'on' : ''}" data-act="cp-sigmode" data-v="${k}"><i class="${i}"></i>${t}</button>`).join('')}</div></div>
                <div id="cp-sigwrap">${cp.sigMode === 'draw'
                  ? `<div class="cp-sig ${cp.strokes.length ? 'has' : ''}"><canvas id="cp-sig"></canvas><span class="caption cp-sig-hint" id="cp-sig-hint" ${cp.strokes.length ? 'hidden' : ''}>Sign here with the mouse or a finger</span><button type="button" class="btn text sm cp-sig-clear" data-act="cp-sigclear"><i class="ri-delete-bin-line"></i>Clear</button></div>`
                  : `<label class="dropzone pt-drop ${cp.sigFile ? 'has' : ''}" id="cp-drop"><input type="file" accept=".jpg,.jpeg,.png" hidden data-ch="cp-sigfile"><i class="ri-upload-cloud-2-line"></i><b>${cp.sigFile ? esc(cp.sigFile) : 'Upload a signature image'}</b><span class="caption">JPEG or PNG</span><span class="btn outlined sm pt-dark">Browse File</span></label>`}</div>
              </div>
            </div>
          </section>
        </div>
      </form>
      <div class="dlg-foot cp-foot">
        <span class="cp-sum"><i class="ri-information-line"></i>${esc(sum)}</span>
        <button class="btn outlined lg" data-act="close-modal">Cancel</button>
        <button class="btn primary lg" data-act="cp-go"><i class="ri-quill-pen-line"></i>Sign and issue</button>
      </div>
    </div>`, { width: 1200, locked: true });
    cpWire(); };

  /* the canvas is redrawn from the strokes we keep, so a re-render never wipes it */
  const cpWire = () => {
    /* Every field in the dialog feeds the rail, the payment details included,
       so the form is watched as a whole rather than field by field. The form is
       built fresh on each render, so this listener goes with it. */
    const f = App.$('#pt-form');
    if (f) ['input', 'change'].forEach(k => f.addEventListener(k, () => { cpRead(); cpRailSync(); }));
    /* Measured while nothing is open — that is the height the dialog is built
       around. With a medicine open the stored height holds and the list scrolls,
       so the dialog keeps the shape it had before you touched it. */
    const L = App.$('.cp-list');
    if (L && !cp.open) { L.style.height = 'auto';
      cp.listH = Math.min(L.scrollHeight, Math.round(innerHeight * 0.44), 430);
      L.style.height = cp.listH + 'px'; }
    const c = App.$('#cp-sig'); if (!c) return;
    const box = c.parentElement, ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
    const w = box.clientWidth, h = box.clientHeight;
    c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
    ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#17202A';
    const redraw = () => { ctx.clearRect(0, 0, w, h); cp.strokes.forEach(st => { ctx.beginPath(); st.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); if (st.length === 1) ctx.lineTo(st[0].x + .1, st[0].y); ctx.stroke(); }); };
    redraw();
    const at = e => { const b = c.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    let st = null;
    c.addEventListener('pointerdown', e => { e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch (_) { /* a pointer the browser no longer tracks */ } st = [at(e)]; cp.strokes.push(st); box.classList.add('has'); App.$('#cp-sig-hint').hidden = true; redraw(); });
    c.addEventListener('pointermove', e => { if (!st) return; st.push(at(e)); redraw(); });
    ['pointerup', 'pointercancel'].forEach(k => c.addEventListener(k, () => { if (st) { cp.seen3 = true; cpRailSync(); } st = null; })); };

  acts['cp-open'] = () => { if (!mayRx()) return rxDeny(); const r = rec(cur()), picked = cpSelIds(r);
    cp = { sel: {}, open: null, listH: 0, seen2: false, seen3: false, pharm: '', addr: null, dispatch: 'give', feeAmt: '', method: 'link', pay: {}, reg: '', attest: false, sigMode: 'draw', strokes: [], sigFile: '' };
    picked.forEach(id => { cp.sel[id] = { qty: '', unit: CPUNIT[0], dur: '', dirs: '' }; });
    cp.open = picked[0] || null;
    cpModal(); };
  const cpAdd = id => cp.sel[id] = cp.sel[id] || { qty: '', unit: CPUNIT[0], dur: '', dirs: '' };
  /* nothing chosen means nothing to pay for or sign; the first medicine opens
     whichever of the two comes next */
  /* nothing chosen means nothing to pay for or sign, and the prescription is
     back at step one; a fee opens the payment it belongs to, but signing is
     never opened for the clinician — stepping into it is what closes step 2 */
  const cpSettle = () => { if (!Object.keys(cp.sel).length) cp.seen2 = cp.seen3 = false; };
  chs['cp-tick'] = el => { cpRead(); const id = el.dataset.id;
    if (el.checked) { cpAdd(id); cp.open = id; } else { delete cp.sel[id]; if (cp.open === id) cp.open = Object.keys(cp.sel)[0] || null; }
    cpSettle(); cpModal(); };
  /* the row itself: take the medicine on if it is off, otherwise fold its dosage away or back */
  acts['cp-row'] = el => { cpRead(); const id = el.dataset.id;
    if (!cp.sel[id]) { cpAdd(id); cp.open = id; } else cp.open = cp.open === id ? null : id;
    cpSettle(); cpModal(); };

  chs['cp-dispatch'] = el => { cpRead(); cp.dispatch = el.value; cp.seen2 = true; cpModal(); };
  chs['cp-pharm'] = () => { cpRead(); cp.seen2 = true; cpModal(); };
  /* The address is the patient's own, shown for this order only: it is checked
     and, if wrong, corrected here without the profile being touched, and what is
     confirmed is kept on the prescription as it was when it was sent. */
  acts['cp-addr'] = () => { cpRead(); const p = cur(), a = cp.addr || addrOf(p), ph = pharmsOn().find(x => x.name === cp.pharm);
    if (!ph) return App.snack('Choose a pharmacy first.', 'error');
    App.dialog(modal('ri-map-pin-line', 'Delivery address', `${esc(ph.name)} delivers to this address. Changes apply to this order only — the patient’s profile isn’t edited.`,
      `${kv([['Patient', esc(a.name)]])}${F('Phone number', 'ad_phone', a.phone, { req: true })}${F('Address', 'ad_line', a.line, { req: true })}<div class="g2">${F('City', 'ad_city', a.city, { req: true })}${F('Postcode', 'ad_pc', a.postcode, { req: true })}</div>`,
      `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="cp-addr-go">Confirm address</button>`, 'green', 'md-dlg'), { width: 520 });
    cpPend = App.$('.scrim'); };
  acts['cp-addr-go'] = () => { const d = formData(); if (!needs(d, ['ad_phone', 'ad_line', 'ad_city', 'ad_pc'])) return;
    cp.addr = { name: PT.name(cur()), phone: d.ad_phone.trim(), line: d.ad_line.trim(), city: d.ad_city.trim(), postcode: d.ad_pc.trim().toUpperCase() };
    cpPend = null; cp.seen2 = true; cpModal(); };
  /* crossing zero brings the payment step in or takes it away, so the fee
     settles on change rather than on every keystroke; it compares against what
     was drawn, not against cp, which the form's own listener has already read */
  chs['cp-feeamt'] = () => { cpRead(); cp.seen2 = true;
    if (cp.drawnPaid === cpPaid()) { cpRailSync(); return; }
    cpModal(); };
  acts['cp-pay-m'] = el => { cpRead(); cp.method = el.dataset.v; cp.seen2 = true; cpModal(); };
  /* the locked Amount Received follows the fee as it is typed, so the two never disagree */
  ins['cp-amt'] = el => { const a = App.$('#pt-form .rx-paybox input[readonly]'); if (a) a.value = '£' + (+el.value || 0).toFixed(2); };
  /* the rail reads where the prescription has got to, so it has to follow the
     typing rather than wait for the next re-render; swapping the one list keeps
     the field being typed in untouched */
  /* The rail and the step it unlocks both read where the prescription has got
     to, so they have to follow the typing rather than wait for the next
     re-render. Swapping these two in place leaves the field being typed in
     exactly as it was. */
  const cpRailSync = () => { if (!cp) return; const el = App.$('.cp-rail');
    if (el) el.outerHTML = cpRail(cpAt(Object.keys(cp.sel))); };
  ins['cp-rx-live'] = () => { cpRead(); cpRailSync(); };
  /* typing a registration number, ticking the declaration or signing all mean
     the prescription has moved on to its last step */
  ins['cp-step3'] = () => { cpRead(); cp.seen3 = true; cpRailSync(); };
  chs['cp-step3'] = ins['cp-step3'];
  /* the pill on a row: the same dialog, opened with just that medicine ticked */
  /* Add medicine, from inside the prescription. The app shows one dialog at a
     time, so the prescription is held in memory while the medicine is recorded,
     and comes back with the new one ticked and open — including when the
     medicine dialog is cancelled, which would otherwise throw the work away. */
  /* What is held is the medicine dialog's own backdrop, not a yes/no: if that
     exact dialog is no longer the one on screen — closed, replaced, navigated
     away from — nothing is pending, whatever happened to it. */
  let cpPend = null;
  const cpPending = () => !!(cp && cpPend && cpPend.isConnected && cpPend === App.$('.scrim'));
  acts['cp-add-med'] = () => { cpRead(); mdOpen(null); cpPend = App.$('.scrim'); };
  const medSave = acts['med-save'];
  acts['med-save'] = (el, e) => { if (!cpPending()) { cpPend = null; return medSave(el, e); }
    const before = rec(cur()).meds.map(m => m.id);
    medSave(el, e);
    if (App.$('.scrim')) return; /* it did not save: the form is still up, with its fields marked */
    cpPend = null;
    const fresh = rec(cur()).meds.filter(m => !before.includes(m.id));
    fresh.forEach(m => cpAdd(m.id));
    if (fresh.length) cp.open = fresh[0].id;
    cpSettle(); cpModal();
    if (fresh.length) App.$('#pt-form .cp-med.open [name^="q_"]')?.focus(); };
  const cpCloseAct = acts['close-modal'];
  acts['close-modal'] = (el, e) => { const resume = cpPending(); cpPend = null;
    if (resume) { cpModal(); return; } return cpCloseAct(el, e); };

  acts['cp-one'] = el => { if (!mayRx()) return rxDeny(); rec(cur()).f.rxSel = [el.dataset.id]; App.render(); acts['cp-open'](); };
  acts['cp-sigmode'] = el => { cpRead(); cp.sigMode = el.dataset.v; cp.seen3 = true; cpModal(); };
  acts['cp-sigclear'] = () => { cpRead(); cp.strokes = []; cpModal(); };
  chs['cp-sigfile'] = el => { const f = el.files[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) return App.snack('That file is over 5 MB. Choose a smaller image.', 'error');
    cpRead(); cp.sigFile = f.name; cp.seen3 = true; cpModal(); };

  acts['cp-go'] = () => { if (!mayRx()) return rxDeny(); cpRead(); const r = rec(cur()), ids = Object.keys(cp.sel);
    if (!ids.length) return App.snack('Pick at least one medicine to prescribe.', 'error');
    /* Only one part of the prescription is on screen at a time, so the check
       reads what was typed rather than what happens to be showing, and opens
       the first part that is short of something: the medicines, then the
       payment, then the signature. */
    /* red on its own is not an error message, so the field says so too */
    const mark = need => { App.$$('#pt-form .field').forEach(f => { const el = f.querySelector('[name]'), bad = need.includes(el && el.name);
        f.classList.toggle('err', bad); if (el) bad ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid'); });
      App.$(`#pt-form [name="${need[0]}"]`)?.focus();
      App.snack('Fill in the fields marked in red before signing.', 'error'); };

    const short = ids.find(id => !cpDone(cp.sel[id]));
    if (short) { cp.open = short; cpModal();
      const v = cp.sel[short], need = [];
      if (!String(v.qty).trim()) need.push('q_' + short);
      if (!String(v.dirs).trim()) need.push('dir_' + short);
      return mark(need); }

    if (cpPaid()) { const miss = PAYM()[cp.method].need.filter(k => !String(cp.pay[k] || '').trim());
      if (miss.length) return mark(miss); }

    if (cp.dispatch === 'pharmacy') {
      if (!cp.pharm) return mark(['pharm']);
      if (!cp.addr) { App.$('#cp-addr')?.classList.add('err'); return App.snack('Confirm the delivery address before signing.', 'error'); } }

    if (!String(cp.reg).trim()) return mark(['reg']);
    App.$$('#pt-form .field').forEach(f => { f.classList.remove('err'); f.querySelector('[name]')?.removeAttribute('aria-invalid'); });
    const at = App.$('#cp-attest'); at.classList.toggle('err', !cp.attest);
    if (!cp.attest) return App.snack('Confirm the declaration before signing.', 'error');
    const signed = cp.sigMode === 'draw' ? cp.strokes.length > 0 : !!cp.sigFile;
    App.$('#cp-sigwrap').firstElementChild.classList.toggle('err', !signed);
    if (!signed) return App.snack(cp.sigMode === 'draw' ? 'Draw your signature before issuing.' : 'Upload a signature image before issuing.', 'error');

    const me = App.me().name, org = App.biz ? App.biz().name : 'LeafEase';
    const paid = cpPaid(), P = PAYM()[cp.method];
    const issued = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const no = 'RX-' + String(1000 + ((r.scripts || []).length + 1)).slice(-4);
    const items = ids.map(id => { const m = r.meds.find(x => x.id === id), v = cp.sel[id];
      return { id, name: m.name, dose: m.dose, unit: m.unit, qty: +v.qty, qtyUnit: v.unit, dur: v.dur, dirs: v.dirs }; });
    const nowIso = new Date().toISOString();
    (r.scripts = r.scripts || []).unshift({ no, at: issued, issuedAt: nowIso, status: 'Issued', ...(cp.dispatch === 'pharmacy' ? { ful: { status: 'Sent' }, pharmacy: cp.pharm, delivery: { ...cp.addr, confirmedAt: nowIso, confirmedBy: me } } : {}),
      log: [['Prescription issued and signed', nowIso, me], [cp.dispatch === 'give' ? 'Given to the patient — no fulfilment' : cp.dispatch === 'pharmacy' ? `Sent to ${cp.pharm}` : 'Added to the dispensing queue', nowIso, me],
        ...(cp.dispatch === 'pharmacy' ? [['Delivery address confirmed for this order', nowIso, me]] : [])], by: me, org, reg: cp.reg, dispatch: cp.dispatch,
      fee: paid ? 'Paid prescription' : 'Free prescription', feeAmt: paid ? +cp.feeAmt : 0, pay: paid ? P.t : '', payStatus: paid ? P.status : '', ...(paid ? cp.pay : {}),
      sig: cp.sigMode === 'draw' ? 'Drawn' : cp.sigFile, items });
    items.forEach(it => { const m = r.meds.find(x => x.id === it.id);
      Object.assign(m, { prescribed: true, prescriber: me, org, issued, dispatch: cp.dispatch, script: no,
        fee: paid ? 'Paid prescription' : 'Free prescription', feeAmt: paid ? +cp.feeAmt : 0, pay: paid ? P.t : '', payStatus: paid ? P.status : '' }); });
    const disp = cp.dispatch === 'pharmacy' ? `Sent to ${cp.pharm}` : CPD[cp.dispatch][0];
    const paidLine = paid ? ` · £${(+cp.feeAmt).toFixed(2)} ${P.status === 'Paid' ? 'received by ' + P.t.toLowerCase() : 'awaiting payment'}` : '';
    r.f.rxSel = []; cp = null; App.closeModal();
    const pt = cur(); rxEnsureInv(pt, r.scripts[0]);
    /* the prescription's own page, with its dispatch status, is where it lands */
    if (mayRxList()) App.go(`#/patients/${pt.id}/prescriptions/${no}`); else App.render();
    App.snack(`Prescription ${no} issued\n${items.length} ${items.length === 1 ? 'medicine' : 'medicines'} signed by ${me} · ${disp}${paidLine}.`); };

  /* ticking rows in the table is what fills the Create prescription button */
  chs['cp-pick'] = el => { const r = rec(cur()), set = new Set(r.f.rxSel || []);
    el.checked ? set.add(el.dataset.id) : set.delete(el.dataset.id);
    r.f.rxSel = [...set]; App.render(); };
  /* the tick at the head of the table covers the rows under it, not the rows on
     the other two tabs — those keep whatever was already chosen for them */
  chs['cp-all'] = el => { const r = rec(cur()), set = new Set(cpSelIds(r));
    medShown(r).forEach(m => el.checked ? set.add(m.id) : set.delete(m.id));
    r.f.rxSel = [...set]; App.render(); };

  /* ---------- Documents ---------- */
  const CATS = ['Blood Reports', 'Documents', 'Review Forms', 'Questionnaires', 'Consent Forms'];
  PT.tabs.documents = p => { const r = rec(p), f = r.f; const n = c => r.docs.filter(d => c === 'All' || d.cat === c).length;
    const list = r.docs.filter(d => (f.docCat === 'All' || d.cat === f.docCat) && (!f.docQ || d.name.toLowerCase().includes(f.docQ.toLowerCase())));
    return title('Documents') + `<div class="pt-bar">${seg('doc-cat', [['All', `All (${n('All')})`], ...CATS.map(c => [c, `${c} (${n(c)})`])], f.docCat)}</div>
      <section class="card card-pad stack g16"><div class="filters">${App.field('Search', `<span class="adorn"><i class="ri-search-line"></i></span><input data-in="doc-q" value="${esc(f.docQ)}" placeholder="Search documents">`, { cls: 'search' })}${App.select('Categories', 'doc-cat', ['All', ...CATS], f.docCat)}${App.field('Date', '<input type="date" aria-label="Uploaded date">')}<button class="clear-btn" data-act="doc-clear"><i class="ri-close-line"></i>Clear filters</button><span class="grow"></span><button class="btn primary lg" data-act="doc-up"><i class="ri-upload-cloud-2-line"></i>Upload Document</button></div>
      ${table(['Document Name', 'Category', 'Uploaded Date &amp; Time', 'Uploaded By', 'Related Request', 'Actions'], list.map(d => `<tr><td><span class="row g8"><i class="${/\.jpe?g|\.png/.test(d.name) ? 'ri-image-line' : 'ri-file-text-line'} muted"></i>${esc(d.name)}</span></td><td>${chip(d.cat, 't-blue')}</td><td>${d.at}</td><td>${esc(d.by)}</td><td>${d.req ? `<a class="pt-link" href="#/patients/${p.id}/requests">${esc(d.req)}<i class="ri-external-link-line"></i></a>` : '—'}</td>
        <td><span class="row-actions"><button class="icon-btn s20" data-act="doc-view" data-id="${d.id}" aria-label="View ${esc(d.name)}" title="View"><i class="ri-eye-line"></i></button><button class="icon-btn s20" data-act="doc-dl" data-id="${d.id}" aria-label="Download ${esc(d.name)}" title="Download"><i class="ri-download-2-line"></i></button><button class="icon-btn s20 danger" data-act="doc-del" data-id="${d.id}" aria-label="Delete ${esc(d.name)}" title="Delete"><i class="ri-delete-bin-6-line"></i></button></span></td></tr>`), 6, r.docs.length ? 'No documents match your filters.' : 'No documents yet. Upload results, letters or forms for this patient.')}</section>`; };
  const doc = id => rec(cur()).docs.find(d => d.id === id);
  acts['doc-cat'] = el => { rec(cur()).f.docCat = el.dataset.v; App.render(); };
  chs['doc-cat'] = el => { rec(cur()).f.docCat = el.value; App.render(); };
  ins['doc-q'] = el => { rec(cur()).f.docQ = el.value; const y = scrollY; App.render(); scrollTo(0, y); const n = App.$('[data-in=doc-q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  acts['doc-clear'] = () => { Object.assign(rec(cur()).f, { docCat: 'All', docQ: '' }); App.render(); };
  let upFile = null;
  acts['doc-up'] = () => { upFile = null; App.dialog(modal('ri-file-upload-line', 'Upload Document', '', `<label class="dropzone pt-drop" id="pt-drop"><input type="file" name="file" accept=".jpg,.jpeg,.png,.pdf" data-ch="doc-file" hidden><i class="ri-upload-cloud-2-line"></i><b>Click to upload or drag and drop</b><span class="caption">JPEG, PNG or PDF, up to 10 MB</span><span class="btn outlined sm pt-dark">Browse File</span></label>
      ${S('Document Category', 'cat', CATS, '', { req: true, ph: 'Choose a category' })}${F('Document Name (Optional)', 'name', '', { ph: 'Uses the file name if left empty' })}`, `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="doc-up-go">Upload</button>`, 'green'), { width: 520 }); };
  chs['doc-file'] = el => { const f = el.files[0]; if (!f) return; if (f.size > 10 * 1024 * 1024) { App.snack('That file is over 10 MB. Choose a smaller file.', 'error'); return; } upFile = f.name; const z = App.$('#pt-drop'); z.classList.add('has'); z.querySelector('b').textContent = f.name; z.querySelector('.caption').textContent = `${(f.size / 1024).toFixed(0)} KB · ready to upload`; };
  acts['doc-up-go'] = () => { const d = formData(); const z = App.$('#pt-drop');
    if (!upFile) { z.classList.add('err'); z.querySelector('.caption').textContent = 'Choose a file to upload'; } if (!needs(d, ['cat']) || !upFile) return;
    const name = d.name.trim() || upFile; rec(cur()).docs.unshift({ id: uid(), name, cat: d.cat, req: '', at: '20/10/2026, ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), by: App.role === 'patient' ? 'Me (Ahmed Raza)' : 'Me (Muhammad Arslan)' }); App.closeModal(); App.render(); App.snack(`Document uploaded successfully\n“${name}” has been added to ${PT.name(cur())}’s documents.`); };
  acts['doc-view'] = el => { const d = doc(el.dataset.id); App.dialog(modal('', esc(d.name), `${d.cat} · uploaded ${d.at} by ${esc(d.by)}`, `<div class="pt-preview"><i class="${/\.jpe?g|\.png/.test(d.name) ? 'ri-image-line' : 'ri-file-text-line'}"></i><span class="caption">Preview of ${esc(d.name)}</span></div>`, `<button class="btn outlined lg" data-act="close-modal">Close</button><button class="btn primary lg" data-act="doc-dl" data-id="${d.id}"><i class="ri-download-2-line"></i>Download</button>`), { width: 640 }); };
  acts['doc-dl'] = el => App.snack(`Downloading “${doc(el.dataset.id).name}”.`, 'info');
  acts['doc-del'] = el => { const d = doc(el.dataset.id); confirmDel('Delete Document', 'Are you sure you want to delete the following document?', 'ri-file-text-line', d.name, `Category: ${d.cat} <span class="sep">|</span> Uploaded on: ${d.at}`, 'doc-del-go', d.id, 'document'); };
  acts['doc-del-go'] = el => { const list = rec(cur()).docs; const i = list.findIndex(d => d.id === el.dataset.id); const [d] = list.splice(i, 1); App.closeModal(); App.render(); App.snack(`Document deleted successfully\n“${d.name}” has been removed from this patient’s documents.`); };

  /* ---------- Billing ---------- */
  const BS = { 'Payment Complete': ['t-green', 'ri-checkbox-circle-line'], 'Awaiting Payment': ['t-orange', 'ri-time-line'], Cancelled: ['t-red', 'ri-close-line'], 'Payment Failed': ['t-red', 'ri-close-line'], Refunded: ['t-green', 'ri-checkbox-circle-line'], Awaiting: ['t-orange', 'ri-time-line'], Rejected: ['t-red', 'ri-close-line'] };
  const DESC = { 'Initial Weight Management Assessment': 'Initial weight management assessment including clinical review, medical history evaluation, eligibility screening and personalised treatment recommendations.', 'GLP-1 Monthly Package': 'One month of GLP-1 medication, delivery and a monthly clinician check-in.', 'Follow-up Consultation': '15-minute follow-up consultation with a clinician.', 'Blood Test Panel': 'Full blood count, HbA1c, lipids and liver function with a results review.' };
  const money = n => '£' + Number(n).toFixed(2);
  PT.tabs.billing = p => { const r = rec(p), f = r.f, refunds = f.bill === 'refunds'; const src = refunds ? r.refunds : r.bills;
    const list = src.filter(x => (f.bStatus === 'All Status' || x.status === f.bStatus) && (f.bKind === 'All Types' || x.kind === f.bKind) && (!f.bQ || (x.name + x.kind).toLowerCase().includes(f.bQ.toLowerCase())));
    const statuses = refunds ? ['Refunded', 'Awaiting', 'Rejected'] : ['Payment Complete', 'Awaiting Payment', 'Cancelled', 'Payment Failed'];
    return title('Billing') + `<div class="pt-bar">${seg('bill-tab', [['records', 'Billing Records'], ['refunds', 'Refunds']], f.bill)}</div>
      <section class="card card-pad stack g16"><h2 class="dh2" style="font-size:18px">${refunds ? 'Manage Refunds' : 'All Billing Records'}</h2>
        <div class="filters">${App.field('Search', `<span class="adorn"><i class="ri-search-line"></i></span><input data-in="bill-q" value="${esc(f.bQ)}" placeholder="Search by name or type">`, { cls: 'search' })}${App.select('Status', 'bill-st', ['All Status', ...statuses], f.bStatus)}${App.select('Source', 'bill-kind', ['All Types', 'Service', 'Package'], f.bKind)}${App.field('Date Range', '<input value="01/07/2026 – 20/10/2026" readonly aria-label="Date range"><span class="adorn"><i class="ri-calendar-line"></i></span>')}<button class="clear-btn" data-act="bill-clear"><i class="ri-close-line"></i>Clear filters</button></div>
        ${refunds ? table(['Request Name', 'Refund Status', 'Service / Package', 'Refund Type', 'Refund Amount', 'Actions'], list.map(x => `<tr><td>${esc(x.name)}</td><td>${chip(x.status, ...BS[x.status])}</td><td>${x.kind}</td><td>${x.type}</td><td class="tnum">${money(x.amount)}</td><td><span class="row-actions"><button class="icon-btn s20" data-act="bill-dl" aria-label="Download refund receipt" title="Download"><i class="ri-download-2-line"></i></button><button class="icon-btn s20" data-act="ref-view" data-id="${x.id}" aria-label="${x.status === 'Awaiting' ? 'Review' : 'View'} refund" title="${x.status === 'Awaiting' ? 'Review refund' : 'View'}"><i class="${x.status === 'Awaiting' ? 'ri-edit-line' : 'ri-eye-line'}"></i></button></span></td></tr>`), 6, 'No refunds match.')
          : table(['Request Name', 'Payment Status', 'Service / Package', 'Pricing Type', 'Price', 'Actions'], list.map(x => `<tr><td>${esc(x.name)}</td><td>${chip(x.status, ...BS[x.status])}</td><td>${x.kind}</td><td>${chip('Fixed', 't-blue')}</td><td class="tnum">${money(x.price)}</td><td><span class="row-actions"><button class="icon-btn s20" data-act="bill-dl" aria-label="Download invoice" title="Download"><i class="ri-download-2-line"></i></button><button class="icon-btn s20" data-act="inv-view" data-id="${x.id}" aria-label="View invoice" title="View"><i class="ri-eye-line"></i></button></span></td></tr>`), 6, src.length ? 'No billing records match.' : 'No billing records yet.')}</section>`; };
  acts['bill-tab'] = el => { Object.assign(rec(cur()).f, { bill: el.dataset.v, bStatus: 'All Status' }); App.render(); };
  chs['bill-st'] = el => { rec(cur()).f.bStatus = el.value; App.render(); }; chs['bill-kind'] = el => { rec(cur()).f.bKind = el.value; App.render(); };
  ins['bill-q'] = el => { rec(cur()).f.bQ = el.value; const y = scrollY; App.render(); scrollTo(0, y); const n = App.$('[data-in=bill-q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  acts['bill-clear'] = () => { Object.assign(rec(cur()).f, { bQ: '', bStatus: 'All Status', bKind: 'All Types' }); App.render(); };
  acts['bill-dl'] = () => App.snack('Receipt downloaded as PDF.', 'info');
  acts['inv-view'] = el => { const x = rec(cur()).bills.find(b => b.id === el.dataset.id);
    App.dialog(modal('ri-file-list-3-line', 'Invoice Details', esc(x.name), `<div class="pt-inv-logo"><b>Leaf</b><span>Ease</span><i class="ri-leaf-line"></i></div><h3 class="pt-h3x"><i class="ri-file-text-line"></i>Details</h3>${kv([['Description', esc(DESC[x.name] || x.name)], ['Invoice date', x.date], ['Status', chip(x.status, ...BS[x.status])], ['Price', money(x.price)]])}<div class="pt-total"><span>Total</span><b>${money(x.price)}</b></div>`, `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="bill-dl">Download Receipt</button>`), { width: 460 }); };
  acts['ref-view'] = el => { const p = cur(), x = rec(p).refunds.find(b => b.id === el.dataset.id); const open = x.status === 'Awaiting';
    App.dialog(modal('ri-refund-2-line', 'Refund Details', esc(x.name), `<h3 class="pt-h3x"><i class="ri-file-text-line"></i>Refund Information</h3>${kv([['Patient Name', esc(PT.name(p))], ['Refund Type', x.type], ['Service / Package', x.kind], ['Payment Date', x.date], ['Payment Method', 'Card'], ['Amount', money(x.amount)], ['Status', chip(x.status, ...BS[x.status])], ['Assignee', 'Clinician']])}
      <h3 class="pt-h3x"><i class="ri-user-line"></i>Patient Details</h3>${kv([['Date of birth', `${PT.dmy(p.dob)} (Age: ${PT.age(p.dob)})`], ['Ethnicity', esc(p.eth)], ['Email', esc(p.email)], ['Phone Number', esc(p.phone)], ['Address', esc(p.addr + ', ' + p.city)], ['Post Code', esc(p.postcode)]])}`,
      open ? `<button class="btn outlined lg" data-act="ref-set" data-id="${x.id}" data-v="Rejected"><i class="ri-close-line"></i>Reject Refund</button><button class="btn primary lg" data-act="ref-set" data-id="${x.id}" data-v="Refunded">Approve Refund</button>` : `<button class="btn outlined lg" data-act="close-modal">Close</button>`), { width: 480 }); };
  acts['ref-set'] = el => { const x = rec(cur()).refunds.find(b => b.id === el.dataset.id); x.status = el.dataset.v; App.closeModal(); App.render(); App.snack(el.dataset.v === 'Refunded' ? `Refund of ${money(x.amount)} approved. It reaches the card in 5–10 working days.` : 'Refund rejected. The patient has been told why by email.'); };
})();

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
      meds: fresh ? [] : [['Metformin', 500, 'mg', 'Twice daily', 'Active', '2015-12-12', '', 'Weightfall', 'GP'], ['Ramipril', 5, 'mg', 'Once daily', 'Active', '2021-03-02', '', 'LeafEase', 'Clinician'], ['Salbutamol inhaler', 100, 'mcg', 'As needed', 'Active', '2018-06-15', '', 'Weightfall', 'GP'], ['Sertraline', 50, 'mg', 'Once daily', 'Active', '2024-01-10', '', 'LeafEase', 'Self'], ['Amoxicillin', 500, 'mg', 'Three times daily', 'Completed', '2025-02-01', '2025-02-08', 'Weightfall', 'GP']].map(([name, dose, unit, freq, status, start, end, source, by]) => ({ id: uid(), name, dose, unit, freq, status, start, end, source, by })),
      alg: fresh ? [] : [['Penicillin', 'High', 'Skin rash and swelling', 'Weightfall', 'GP'], ['Latex', 'Medium', 'Irritation', 'Clinician', 'Self'], ['Peanuts', 'High', 'Anaphylaxis — carries an adrenaline pen', 'Clinician', 'GP'], ['Ibuprofen', 'Low', 'Stomach upset', 'Clinician', 'Clinician']].map(([name, severity, reaction, source, by]) => ({ id: uid(), name, severity, reaction, source, by })),
      docs: fresh ? [] : [['Form-NQH-2026', 'Questionnaires', 'Weightfall - initial assessment'], ['Surgical Notes.pdf', 'Documents', ''], ['CBC with Differential.pdf', 'Blood Reports', ''], ['Blood test.jpg', 'Blood Reports', ''], ['Informed Consent.pdf', 'Consent Forms', 'Annual Check-up'], ['PHQ-9', 'Questionnaires', 'Weight management programme'], ['Six-month review.pdf', 'Review Forms', '']].map(([name, cat, req], i) => ({ id: uid(), name, cat, req, at: `${String(15 - i).padStart(2, '0')}/09/2026, 11:00 am`, by: 'Me (Muhammad Arslan)' })),
      bills: fresh ? [] : [['Initial Weight Management Assessment', 'Payment Complete', 'Service', 65], ['GLP-1 Monthly Package', 'Awaiting Payment', 'Package', 199], ['Follow-up Consultation', 'Awaiting Payment', 'Service', 45], ['Blood Test Panel', 'Payment Complete', 'Service', 85], ['Follow-up Consultation', 'Cancelled', 'Service', 45], ['GLP-1 Monthly Package', 'Payment Failed', 'Package', 199]].map(([name, status, kind, price], i) => ({ id: uid(), name, status, kind, price, date: `${String(20 - i * 3).padStart(2, '0')}/09/2026` })),
      refunds: fresh ? [] : [['Follow-up Consultation', 'Refunded', 'Service', 'Patient Cancellation', 45], ['GLP-1 Monthly Package', 'Awaiting', 'Package', 'Clinic Cancellation', 199], ['Initial Weight Management Assessment', 'Awaiting', 'Service', 'Patient Cancellation', 65], ['Blood Test Panel', 'Rejected', 'Service', 'Patient Cancellation', 85]].map(([name, status, kind, type, amount], i) => ({ id: uid(), name, status, kind, type, amount, date: `${16 - i}/09/2026 06:12 PM` })),
      f: { req: 'All', ap: 'all', apType: 'All', apQ: '', mhOpen: { c: true, m: true, a: true }, docCat: 'All', docQ: '', bill: 'records', bQ: '', bStatus: 'All Status', bKind: 'All Types' }
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
  /* what a row shows once a prescription has gone out for it */
  const issTags = m => { const D = CPD[m.dispatch], t = [];
    if (D) t.push(chip(D[0], 't-blue', D[1]));
    if (m.script) t.push(chip(m.script, 't-grey', 'ri-file-list-3-line'));
    if (m.fee === 'Paid prescription') t.push(chip(`${m.pay || 'Fee'} · £${Number(m.feeAmt || 0).toFixed(2)}`, m.payStatus === 'Paid' ? 't-green' : 't-orange', m.payStatus === 'Paid' ? 'ri-checkbox-circle-line' : 'ri-time-line'));
    else if (m.fee) t.push(chip('Free prescription', 't-grey', 'ri-price-tag-3-line'));
    return t.length ? `<span class="row g4 wrap mh-rxtags">${t.join('')}</span>` : ''; };
  /* the pill writes a prescription for this one medicine: the same dialog as the
     header button, opened with just this row ticked */
  const rxBtn = x => `<button class="icon-btn s20 mh-rx-btn" data-act="cp-one" data-id="${x.id}" aria-label="Create a prescription for ${esc(x.name)}" title="Create prescription"><i class="ri-capsule-line"></i></button>`;
  /* Every row can be opened and read. Only the ones this practice owns can be
     changed — a GP import keeps a lock in place of edit and delete. */
  const rowAct = (kind, x) => `<span class="row-actions">${kind === 'meds' ? rxBtn(x) : ''}<button class="icon-btn s20" data-act="mh-view" data-k="${kind}" data-id="${x.id}" aria-label="View ${esc(x.name)}" title="View"><i class="ri-eye-line"></i></button>${editable(x)
    ? `<button class="icon-btn s20" data-act="mh-edit" data-k="${kind}" data-id="${x.id}" aria-label="Edit ${esc(x.name)}" title="Edit"><i class="ri-edit-box-line"></i></button><button class="icon-btn s20 danger" data-act="mh-del" data-k="${kind}" data-id="${x.id}" aria-label="Delete ${esc(x.name)}" title="Delete"><i class="ri-delete-bin-6-line"></i></button>`
    : `<span class="icon-btn s20 mh-lock" role="img" aria-label="Imported from the GP record — read only" title="Imported from the GP record — read only"><i class="ri-lock-line"></i></span>`}</span>`;
  const stChip = s => s === 'Active' ? chip('Active', 't-green', 'ri-checkbox-circle-line') : chip(s, 't-grey', 'ri-history-line');
  const sevChip = s => chip(s, s === 'High' ? 't-red' : s === 'Medium' ? 't-orange' : 't-grey');
  const box = (k, icon, t, actions, body, r) => `<section class="card pt-box"><div class="pt-box-h"><h2 class="pt-h"><i class="${icon}"></i>${t}</h2><span class="grow"></span>${actions}<button class="icon-btn s20" data-act="mh-tog" data-k="${k}" aria-expanded="${r.f.mhOpen[k]}" aria-label="${r.f.mhOpen[k] ? 'Collapse' : 'Expand'} ${t}"><i class="${r.f.mhOpen[k] ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i></button></div>${r.f.mhOpen[k] ? `<div class="pt-box-b">${body}</div>` : ''}</section>`;
  /* one list, current medicines first. The Status column already says which is
     which, so a filter that hides half the record only gets in the way. */
  const medList = r => [...r.meds].sort((a, b) => (a.status === 'Active' ? 0 : 1) - (b.status === 'Active' ? 0 : 1));

  PT.tabs['medical-history'] = p => { const r = rec(p); const meds = medList(r);
    const sel = new Set(cpSelIds(r)), allOn = meds.length > 0 && sel.size === meds.length, someOn = sel.size > 0;
    const nAct = r.meds.filter(m => m.status === 'Active').length;
    return title('Medical History') + `<div class="stack g16">
      ${box('c', 'ri-heart-pulse-line', `Medical Conditions (${r.cond.filter(c => c.status === 'Active').length} Active)`, `<button class="btn primary" data-act="mh-add" data-k="cond"><i class="ri-add-circle-line"></i>Add Medical Condition</button>`, `<div class="mh-cond">${table(['Condition', 'Description', 'Status', 'Source', 'Added By', 'Action'], r.cond.map(c => `<tr><td><b class="fw5">${esc(c.name)}</b></td><td>${esc(c.desc)}</td><td>${stChip(c.status)}</td><td>${esc(c.source)}</td><td>${esc(c.by)}</td><td>${rowAct('cond', c)}</td></tr>`), 6, 'No medical conditions recorded.')}</div>`, r)}
      ${box('m', 'ri-capsule-line', `Medications (${nAct} Active)`, `<button class="btn outlined" data-act="cp-open"><i class="ri-quill-pen-line"></i>Create prescription${someOn ? ` (${sel.size})` : ''}</button><button class="btn primary" data-act="mh-add" data-k="meds"><i class="ri-add-circle-line"></i>Add Medication</button>`, `<div class="mh-meds">${table([`<label class="cbx cp-box ${allOn ? '' : someOn ? 'half' : ''}"><input type="checkbox" data-ch="cp-all" ${allOn ? 'checked' : ''} aria-label="Select all medications"></label>Medication`, 'Frequency', 'Status', 'Start Date', 'End Date', 'Source', 'Added By', 'Action'], meds.map(m => `<tr><td><span class="row g10 cp-cell"><label class="cbx cp-box"><input type="checkbox" data-ch="cp-pick" data-id="${m.id}" ${sel.has(m.id) ? 'checked' : ''} aria-label="Select ${esc(m.name)}"></label><span class="cell2"><b class="fw5">${esc(m.name)}</b><small class="mh-dose">${esc(m.dose)} ${esc(m.unit)}</small>${m.ext ? `<small>Prescribed by ${esc(m.prescriber)} · ${esc(m.org)}</small><span class="row g4 wrap mh-rxtags">${/^Patient/.test(m.verify || '') ? chip('Unverified', 't-orange', 'ri-error-warning-line') : chip('Verified', 't-green', 'ri-verified-badge-line')}${m.cd ? chip('Controlled drug', 't-red', 'ri-shield-keyhole-line') : ''}</span>` : ''}${m.prescribed ? `<small>Prescription issued ${esc(m.issued)} by ${esc(m.prescriber)}</small>${issTags(m)}` : ''}</span></span></td><td>${esc(m.freq)}</td><td>${stChip(m.status)}</td><td>${PT.dmy(m.start)}</td><td>${m.end ? PT.dmy(m.end) : '—'}</td><td>${esc(m.source)}</td><td>${esc(m.by)}</td><td>${rowAct('meds', m)}</td></tr>`), 8, 'No medications recorded.')}</div>`, r)}
      ${box('a', 'ri-virus-line', 'Allergies', `<button class="btn primary" data-act="mh-add" data-k="alg"><i class="ri-add-circle-line"></i>Add New Allergy</button>`, `<div class="mh-alg">${table(['Allergy', 'Severity', 'Reaction', 'Source', 'Added By', 'Action'], r.alg.map(a => `<tr><td><b class="fw5">${esc(a.name)}</b></td><td>${sevChip(a.severity)}</td><td>${esc(a.reaction)}</td><td>${esc(a.source)}</td><td>${esc(a.by)}</td><td>${rowAct('alg', a)}</td></tr>`), 6, 'No known allergies recorded.')}</div>`, r)}</div>`; };
  acts['mh-tog'] = el => { const f = rec(cur()).f.mhOpen; f[el.dataset.k] = !f[el.dataset.k]; App.render(); };

  const SRC = ['Weightfall', 'LeafEase', 'Clinician', 'Minor Ops'], BY = ['Clinician', 'Self', 'GP'];
  const MH = {
    cond: ['ri-heart-add-line', 'Medical Condition', 'Record a condition on this patient’s history.', x => FT('Condition name', 'name', x.name, { req: true, ph: 'Type condition name' }) + FT('Description', 'desc', x.desc, { req: true, area: true, ph: 'Type description here' }) + ST('Status', 'status', ['Active', 'Resolved'], x.status || 'Active', { req: true }) + `<div class="g2">${ST('Source', 'source', SRC, x.source || 'LeafEase', { req: true })}${ST('Added by', 'by', BY, x.by || 'Clinician', { req: true })}</div>`, ['name', 'desc'], 'Condition'],
    alg: ['ri-virus-line', 'Allergy', 'Record an allergy on this patient’s history.', x => FT('Allergy name', 'name', x.name, { req: true, ph: 'e.g. Penicillin' }) + ST('Severity', 'severity', ['Low', 'Medium', 'High'], x.severity || 'Low', { req: true }) + FT('Reaction', 'reaction', x.reaction, { req: true, area: true, ph: 'What happens when they’re exposed' }) + `<div class="g2">${ST('Source', 'source', SRC, x.source || 'LeafEase', { req: true })}${ST('Added by', 'by', BY, x.by || 'Clinician', { req: true })}</div>`, ['name', 'reaction'], 'Allergy']
  };
  const mhOpen = (k, x) => { const [icon, t, sub, body] = MH[k];
    App.dialog(modal(icon, `${x.id ? 'Edit' : 'Add'} ${t}`, x.id ? `Update ${esc(x.name)}` : sub, body(x), `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="mh-save" data-k="${k}" data-id="${x.id || ''}">${x.id ? 'Save changes' : 'Add ' + MH[k][5]}</button>`, 'green', 'md-dlg'), { width: 540 }); };
  acts['mh-save'] = el => { const k = el.dataset.k, d = formData(); if (!needs(d, MH[k][4])) return; const list = rec(cur())[k];
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
  const mdBlank = () => ({ k: ++mdKey, name: '', dose: '', unit: 'mg', freq: '', start: '', end: '', status: 'Active', cd: false });

  const mdRead = () => { const f = App.$('#pt-form'); if (!md || !f) return;
    const d = Object.fromEntries(new FormData(f));
    md.rows.forEach(v => Object.assign(v, { name: d['n' + v.k] ?? v.name, dose: d['d' + v.k] ?? v.dose, unit: d['u' + v.k] || v.unit,
      freq: d['f' + v.k] ?? v.freq, start: d['s' + v.k] ?? v.start, end: d['e' + v.k] ?? v.end, status: d['st' + v.k] || v.status, cd: !!d['cd' + v.k] }));
    if (d.source) md.source = d.source; if (d.by) md.by = d.by;
    ['prescriber', 'org', 'infoSrc', 'verify'].forEach(x => { if (d[x] !== undefined) md.prov[x] = d[x]; });
    md.attest = !!d.attest; };

  const mdRow = (v, i, n) => `<div class="md-row" id="md-${v.k}">
    ${n > 1 ? `<div class="md-row-h"><b>Medication ${i + 1}</b><button type="button" class="icon-btn s20 danger" data-act="med-drop" data-k="${v.k}" aria-label="Remove medication ${i + 1}" title="Remove"><i class="ri-close-line"></i></button></div>` : ''}
    ${FT('Medication name', 'n' + v.k, v.name, { req: true, ph: 'e.g. Metformin' })}
    <div class="md-dose">${FT('Dosage', 'd' + v.k, v.dose, { req: true, type: 'number' })}${ST('Unit', 'u' + v.k, MEDU, v.unit, { req: true })}</div>
    ${FT('Frequency', 'f' + v.k, v.freq, { req: true, ph: 'e.g. Once daily' })}
    <div class="g2">${FT('Start date', 's' + v.k, v.start, { req: true, type: 'date' })}${FT('End date', 'e' + v.k, v.end, { type: 'date' })}</div>
    <div class="g2 md-last">${ST('Status', 'st' + v.k, ['Active', 'Completed', 'Stopped'], v.status, { req: true })}<label class="cbx md-cd"><input type="checkbox" name="cd${v.k}" ${v.cd ? 'checked' : ''}>Controlled drug</label></div>
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

  const mdOpen = x => { md = { rows: [x ? { ...mdBlank(), ...x, dose: x.dose ?? '' } : mdBlank()], editId: x ? x.id : '',
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
    meds: ['ri-capsule-line', 'Medication', x => [['Medicine', x.name], ['Dosage', `${x.dose} ${x.unit}`], ['Frequency', x.freq], ['Status', x.status],
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
      Object.assign(x, base, { name: v.name, dose: +v.dose, unit: v.unit, freq: v.freq, start: v.start, end: v.end, status: v.status, cd: v.cd });
      md = null; App.closeModal(); App.render(); return App.snack(`${x.name} updated.`); }
    md.rows.forEach(v => r.meds.unshift({ id: uid(), ...base, name: v.name, dose: +v.dose, unit: v.unit, freq: v.freq, start: v.start, end: v.end, status: v.status, cd: v.cd }));
    const names = md.rows.map(v => v.name);
    md = null; App.closeModal(); App.render();
    App.snack(n === 1 ? `${names[0]} added to the medication list.${other ? '\nRecorded from another provider — nothing has been prescribed.' : ''}`
      : `${n} medications added to the list\n${names.join(' · ')}${other ? ' — recorded from another provider.' : ''}`); };

  /* ---------- Create prescription ----------
     The signed, issued kind: pick medicines off the patient's own list, say how
     each is to be taken, choose how it reaches them, then sign for it. Modelled
     on the developed app's Create prescription dialog. */
  const CPD = {
    give: ['Give to patient', 'ri-user-shared-2-line', 'Signed prescription for collection from any pharmacy.'],
    pharmacy: ['Home delivery', 'ri-store-2-line', 'A linked pharmacy receives the prescription and delivers it.'],
    stock: ['Dispense from practice stock', 'ri-archive-2-line', 'Staff dispense from inventory for handover, delivery or post.']
  };
  const CPUNIT = ['tablets', 'capsules', 'ml', 'mg', 'sachets', 'puffs', 'patches'];
  let cp = null;
  const PAYM = () => PT.payMethods('rx');

  /* the warning the developed app shows: this medicine has gone out before */
  const cpIssued = (r, m) => !!m.prescribed || (r.scripts || []).some(x => x.items.some(i => i.id === m.id));
  const cpSelIds = r => (r.f.rxSel || []).filter(id => r.meds.some(m => m.id === id));

  /* read the form back before any re-render, so nothing typed is lost */
  const cpRead = () => { const f = App.$('#pt-form'); if (!cp || !f) return;
    const d = Object.fromEntries(new FormData(f));
    Object.keys(cp.sel).forEach(id => cp.sel[id] = { qty: d['q_' + id] ?? '', unit: d['u_' + id] || CPUNIT[0], dur: d['dur_' + id] ?? '', dirs: d['dir_' + id] ?? '' });
    if (d.dispatch) cp.dispatch = d.dispatch;
    cp.feeAmt = d.feeAmt ?? cp.feeAmt; cp.reg = d.reg ?? cp.reg; cp.attest = !!d.attest;
    ['receipt', 'receivedBy', 'transferDate', 'txnRef'].forEach(k => { if (d[k] !== undefined) cp.pay[k] = d[k]; }); };

  const cpStep = (n, t, hint) => `<div class="cp-step"><span class="cp-num">${n}</span><span class="cp-step-t"><b>${t}</b><small>${hint}</small></span></div>`;
  /* the left column: what the prescription is for, at a glance */
  const cpPick = (r, m) => { const on = !!cp.sel[m.id];
    return `<label class="cp-pickcard ${on ? 'on' : ''}"><input type="checkbox" data-ch="cp-tick" data-id="${m.id}" ${on ? 'checked' : ''}><span class="cp-med-h"><b>${esc(m.name)} ${esc(m.dose)} ${esc(m.unit)}</b><small>${esc(m.dose)} ${esc(m.unit)} · ${esc(m.freq)}</small></span></label>`; };
  /* the band under them: one compact line per medicine chosen */
  const cpDose = (r, m) => { const v = cp.sel[m.id];
    return `<div class="cp-dose">
      <span class="cp-dose-n"><b>${esc(m.name)} ${esc(m.dose)} ${esc(m.unit)}</b>${cpIssued(r, m) ? chip('Already prescribed', 't-orange', 'ri-alert-line') : ''}</span>
      ${F('Quantity', 'q_' + m.id, v.qty, { req: true, type: 'number' })}
      ${S('Unit', 'u_' + m.id, CPUNIT, v.unit || CPUNIT[0], { req: true })}
      ${F('Days', 'dur_' + m.id, v.dur, { type: 'number' })}
      ${F('Directions', 'dir_' + m.id, v.dirs, { req: true, ph: 'e.g. Take one tablet twice daily with food' })}
    </div>`; };

  const cpModal = () => { const p = cur(), r = rec(p), me = App.me().name, org = App.biz ? App.biz().name : 'LeafEase';
    const meds = medList(r), ids = Object.keys(cp.sel), n = ids.length, paid = +cp.feeAmt > 0;
    const picked = meds.filter(m => cp.sel[m.id]);
    const sum = [`${n || 'No'} medicine${n === 1 ? '' : 's'}`, CPD[cp.dispatch][0], paid ? `£${(+cp.feeAmt).toFixed(2)} · ${PAYM()[cp.method].t}` : 'No charge'].join(' · ');
    App.dialog(`<div class="cp-dlg">
      <div class="dlg-head cp-head">
        <span class="pt-dlg-ic green cp-ic"><i class="ri-quill-pen-line"></i></span>
        <span class="cp-head-t"><h2 id="dlg-title">Create prescription</h2><small>For ${esc(PT.name(p))} · signed and issued by ${esc(me)} at ${esc(org)}</small></span>
        <button class="icon-btn s20 cp-x" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button>
      </div>
      <form class="dlg-body" id="pt-form" onsubmit="return false">
        <div class="cp-grid">
          <section class="cp-col">
            ${cpStep(1, 'Medications', 'Select what this prescription is for.')}
            <div class="cp-list">${meds.length ? meds.map(m => cpPick(r, m)).join('') : '<p class="caption">No medications on this list to prescribe.</p>'}</div>
          </section>
          <section class="cp-col">
            ${cpStep(2, 'Dispatch', 'Choose how the patient receives their medicine.')}
            <div class="cp-opts">${Object.entries(CPD).map(([k, [t, i, d]]) => `<label class="cp-opt ${k === cp.dispatch ? 'on' : ''}"><input type="radio" name="dispatch" value="${k}" data-ch="cp-dispatch" ${k === cp.dispatch ? 'checked' : ''}><span class="cp-opt-ic"><i class="${i}"></i></span><span class="cp-opt-t"><b>${t}</b><small>${d}</small></span></label>`).join('')}</div>
            ${F('Prescription fee (£)', 'feeAmt', cp.feeAmt, { req: true, type: 'number', step: '0.01', ph: '0.00', attrs: 'data-in="cp-amt" data-ch="cp-feeamt"' })}
            <span class="caption cp-hint">Charge applied for this prescription (e.g. NHS, private or practice fee). Leave at 0 for no charge.</span>
            ${paid ? `<div class="cp-paybox">${PT.payTabs(PAYM(), cp.method, 'cp-pay-m')}${PAYM()[cp.method].body({ ...cp.pay, price: +cp.feeAmt || 0 })}</div>` : ''}
            <div class="cp-count"><i class="ri-capsule-line"></i>Selected medicines: <b>${n}</b></div>
          </section>
        </div>
        <section class="cp-band">
          ${cpStep(3, 'Dosage &amp; directions', 'How each medicine chosen above is to be taken.')}
          ${n ? `<div class="cp-doses">${picked.map(m => cpDose(r, m)).join('')}</div>` : '<p class="caption cp-empty">Tick a medicine on the left and its dosage appears here.</p>'}
        </section>
        <div class="cp-grid">
          <section class="cp-col">
            ${cpStep(4, 'Sign', 'The prescriber named here, and this signature, go on the prescription.')}
            <div class="g2">${`<div class="ft"><label>Prescriber</label>${App.field('', `<input value="${esc(me)}" readonly tabindex="-1">`, { cls: 'dis' })}</div>`}${F('Registration number (e.g. GMC)', 'reg', cp.reg, { req: true })}</div>
            <label class="cbx cp-attest" id="cp-attest"><input type="checkbox" name="attest" ${cp.attest ? 'checked' : ''}><span>I confirm that I am a registered healthcare professional, that I have assessed this patient, and that I am authorised to prescribe the medicines listed above. The details above are correct, and the signature below is mine.</span></label>
          </section>
          <section class="cp-col">
            <div class="cp-sig-h"><b class="cp-siglab">Signature</b><div class="pt-seg cp-sigseg" role="tablist" aria-label="Signature">${[['draw', 'Draw'], ['upload', 'Upload image']].map(([k, t]) => `<button type="button" role="tab" aria-selected="${k === cp.sigMode}" class="${k === cp.sigMode ? 'on' : ''}" data-act="cp-sigmode" data-v="${k}">${t}</button>`).join('')}</div></div>
            <div id="cp-sigwrap">${cp.sigMode === 'draw'
              ? `<div class="cp-sig ${cp.strokes.length ? 'has' : ''}"><canvas id="cp-sig"></canvas><span class="caption cp-sig-hint" id="cp-sig-hint" ${cp.strokes.length ? 'hidden' : ''}>Sign here with the mouse or a finger</span><button type="button" class="btn text sm cp-sig-clear" data-act="cp-sigclear"><i class="ri-eraser-line"></i>Clear</button></div>`
              : `<label class="dropzone pt-drop ${cp.sigFile ? 'has' : ''}" id="cp-drop"><input type="file" accept=".jpg,.jpeg,.png" hidden data-ch="cp-sigfile"><i class="ri-upload-cloud-2-line"></i><b>${cp.sigFile ? esc(cp.sigFile) : 'Upload a signature image'}</b><span class="caption">JPEG or PNG</span><span class="btn outlined sm pt-dark">Browse File</span></label>`}</div>
          </section>
        </div>
      </form>
      <div class="dlg-foot cp-foot">
        <span class="cp-sum"><i class="ri-information-line"></i>${esc(sum)}</span>
        <button class="btn outlined lg" data-act="close-modal">Cancel</button>
        <button class="btn primary lg" data-act="cp-go"><i class="ri-quill-pen-line"></i>Sign and issue</button>
      </div>
    </div>`, { width: 1060, locked: true });
    cpWire(); };

  /* the canvas is redrawn from the strokes we keep, so a re-render never wipes it */
  const cpWire = () => { const c = App.$('#cp-sig'); if (!c) return;
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
    ['pointerup', 'pointercancel'].forEach(k => c.addEventListener(k, () => { st = null; })); };

  acts['cp-open'] = () => { const r = rec(cur()), picked = cpSelIds(r);
    cp = { sel: {}, dispatch: 'give', feeAmt: '', method: 'link', pay: {}, reg: '', attest: false, sigMode: 'draw', strokes: [], sigFile: '' };
    picked.forEach(id => { const m = r.meds.find(x => x.id === id); cp.sel[id] = { qty: '', unit: CPUNIT[0], dur: '', dirs: '' }; });
    cpModal(); };
  chs['cp-tick'] = el => { cpRead(); const id = el.dataset.id;
    if (el.checked) cp.sel[id] = cp.sel[id] || { qty: '', unit: CPUNIT[0], dur: '', dirs: '' }; else delete cp.sel[id];
    cpModal(); };
  chs['cp-dispatch'] = el => { cpRead(); cp.dispatch = el.value; cpModal(); };
  /* crossing zero brings the payment step in or takes it away, so the fee settles on change rather than on every keystroke */
  chs['cp-feeamt'] = el => { const was = +cp.feeAmt > 0; cpRead(); if (was !== (+el.value > 0)) cpModal(); };
  acts['cp-pay-m'] = el => { cpRead(); cp.method = el.dataset.v; cpModal(); };
  /* the locked Amount Received follows the fee as it is typed, so the two never disagree */
  ins['cp-amt'] = el => { const a = App.$('#pt-form .rx-paybox input[readonly]'); if (a) a.value = '£' + (+el.value || 0).toFixed(2); };
  /* the pill on a row: the same dialog, opened with just that medicine ticked */
  acts['cp-one'] = el => { rec(cur()).f.rxSel = [el.dataset.id]; App.render(); acts['cp-open'](); };
  acts['cp-sigmode'] = el => { cpRead(); cp.sigMode = el.dataset.v; cpModal(); };
  acts['cp-sigclear'] = () => { cpRead(); cp.strokes = []; cpModal(); };
  chs['cp-sigfile'] = el => { const f = el.files[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) return App.snack('That file is over 5 MB. Choose a smaller image.', 'error');
    cpRead(); cp.sigFile = f.name; cpModal(); };

  acts['cp-go'] = () => { cpRead(); const r = rec(cur()), ids = Object.keys(cp.sel);
    if (!ids.length) return App.snack('Tick at least one medication to prescribe.', 'error');
    const need = [];
    ids.forEach(id => { const v = cp.sel[id]; if (!String(v.qty).trim()) need.push('q_' + id); if (!String(v.dirs).trim()) need.push('dir_' + id); });
    if (+cp.feeAmt > 0) PAYM()[cp.method].need.forEach(k => { if (!String(cp.pay[k] || '').trim()) need.push(k); });
    if (!String(cp.reg).trim()) need.push('reg');
    App.$$('#pt-form .field').forEach(f => { const n = f.querySelector('[name]')?.name; f.classList.toggle('err', need.includes(n)); });
    if (need.length) { App.$(`#pt-form [name="${need[0]}"]`)?.focus(); return App.snack('Fill in the fields marked in red before signing.', 'error'); }
    const at = App.$('#cp-attest'); at.classList.toggle('err', !cp.attest);
    if (!cp.attest) return App.snack('Confirm the declaration before signing.', 'error');
    const signed = cp.sigMode === 'draw' ? cp.strokes.length > 0 : !!cp.sigFile;
    App.$('#cp-sigwrap').firstElementChild.classList.toggle('err', !signed);
    if (!signed) return App.snack(cp.sigMode === 'draw' ? 'Draw your signature before issuing.' : 'Upload a signature image before issuing.', 'error');

    const me = App.me().name, org = App.biz ? App.biz().name : 'LeafEase';
    const paid = +cp.feeAmt > 0, P = PAYM()[cp.method];
    const issued = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const no = 'RX-' + String(1000 + ((r.scripts || []).length + 1)).slice(-4);
    const items = ids.map(id => { const m = r.meds.find(x => x.id === id), v = cp.sel[id];
      return { id, name: m.name, dose: m.dose, unit: m.unit, qty: +v.qty, qtyUnit: v.unit, dur: v.dur, dirs: v.dirs }; });
    (r.scripts = r.scripts || []).unshift({ no, at: issued, by: me, org, reg: cp.reg, dispatch: cp.dispatch,
      fee: paid ? 'Paid prescription' : 'Free prescription', feeAmt: paid ? +cp.feeAmt : 0, pay: paid ? P.t : '', payStatus: paid ? P.status : '', ...(paid ? cp.pay : {}),
      sig: cp.sigMode === 'draw' ? 'Drawn' : cp.sigFile, items });
    items.forEach(it => { const m = r.meds.find(x => x.id === it.id);
      Object.assign(m, { prescribed: true, prescriber: me, org, issued, dispatch: cp.dispatch, script: no,
        fee: paid ? 'Paid prescription' : 'Free prescription', feeAmt: paid ? +cp.feeAmt : 0, pay: paid ? P.t : '', payStatus: paid ? P.status : '' }); });
    const disp = CPD[cp.dispatch][0];
    const paidLine = paid ? ` · £${(+cp.feeAmt).toFixed(2)} ${P.status === 'Paid' ? 'received by ' + P.t.toLowerCase() : 'awaiting payment'}` : '';
    r.f.rxSel = []; cp = null; App.closeModal(); App.render();
    App.snack(`Prescription ${no} issued\n${items.length} ${items.length === 1 ? 'medicine' : 'medicines'} signed by ${me} · ${disp}${paidLine}.`); };

  /* ticking rows in the table is what fills the Create prescription button */
  chs['cp-pick'] = el => { const r = rec(cur()), set = new Set(r.f.rxSel || []);
    el.checked ? set.add(el.dataset.id) : set.delete(el.dataset.id);
    r.f.rxSel = [...set]; App.render(); };
  chs['cp-all'] = el => { const r = rec(cur());
    r.f.rxSel = el.checked ? r.meds.map(m => m.id) : []; App.render(); };

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

/* EHR › Inventory › Dispensing queue.
   Prescription issued → prepare charge → take payment → clinical check + pick batches (FEFO) + label → accuracy check (second person)
   → hand-over (collection with ID check for CDs, or tracked post) → completed. Partial supplies are recorded as owing. */
(function () {
  const { esc, acts } = App; const IV = App.IV; const u = IV.ui;
  const D = () => IV.D;
  const rxOf = id => D().rx.find(r => r.id === id);
  const SUBS = ['To dispense', 'In progress', 'Completed', 'Cancelled'];
  const ALLERGY = { Penicillin: /amoxicillin|penicillin|flucloxacillin|co-amoxiclav|phenoxymethylpenicillin/i, NSAID: /ibuprofen|naproxen|diclofenac|aspirin/i, Sulfonamide: /co-trimoxazole|sulfamethoxazole/i };
  const clash = r => r.lines.filter(l => r.allergies.some(a => (ALLERGY[a] || new RegExp(a, 'i')).test(l.drug))).map(l => [l.drug, r.allergies.find(a => (ALLERGY[a] || new RegExp(a, 'i')).test(l.drug))]);
  const isCDrx = r => r.lines.some(l => IV.isCD(IV.item(l.item)));
  const validDays = r => isCDrx(r) ? 28 : 182;
  const ageDays = r => Math.max(0, Math.floor((Date.now() - new Date(r.issued)) / IV.DAY));
  const paid = r => r.charge && ['Paid', 'No charge'].includes(r.charge.status);
  const stChip = r => r.status === 'To dispense' ? IV.chip('Awaiting dispensing', 't-orange') : r.status === 'Cancelled' ? IV.chip('Cancelled', 't-grey') : r.status === 'Completed' ? IV.chip(r.stage || 'Completed', 't-green', 'ri-check-line') : IV.chip(r.stage, r.stage === 'Awaiting check' ? 't-blue' : 't-teal');
  const chargeCell = r => !r.charge ? '<span class="muted">Not set</span>' : `${IV.chip(r.charge.status, r.charge.status === 'Awaiting payment' ? 't-orange' : r.charge.status === 'Refund due' ? 't-red' : 't-green')}<small class="cell-sub tnum">${IV.money(r.charge.total)}</small>`;
  const log = (r, t, by) => r.log.push([t, new Date().toISOString(), by || IV.me()]);

  /* ======================= QUEUE ======================= */
  IV.tabs.dispensing = () => { const all = D().rx, cnt = s => all.filter(r => r.status === s).length;
    const l = all.filter(r => r.status === u.dq).sort((a, b) => u.dq === 'Completed' || u.dq === 'Cancelled' ? (a.issued < b.issued ? 1 : -1) : (a.issued < b.issued ? -1 : 1));
    const action = r => { const eye = `<button class="icon-btn s20" data-act="iv-rx" data-id="${r.id}" title="View prescription" aria-label="View prescription for ${esc(r.patient)}"><i class="ri-eye-line"></i></button>`;
      if (r.status === 'To dispense') { if (!r.charge) return `<button class="btn primary iv-pill" data-act="iv-charge" data-id="${r.id}">Prepare charge</button>${eye}`;
        if (!paid(r)) return `<button class="btn primary iv-pill" data-act="iv-pay" data-id="${r.id}">Take payment</button><button class="btn text brand sm" data-act="iv-charge" data-id="${r.id}">Edit charge</button>${eye}`;
        return `<button class="btn primary iv-pill" data-act="iv-dispense" data-id="${r.id}">Dispense</button>${eye}`; }
      if (r.stage === 'Awaiting check') return `<button class="btn primary iv-pill" data-act="iv-check" data-id="${r.id}">Accuracy check</button>${eye}`;
      if (r.status === 'In progress') return `<button class="btn primary iv-pill" data-act="iv-hand" data-id="${r.id}">${r.handover === 'Post' ? 'Post' : 'Hand over'}</button>${eye}`;
      if (r.status === 'Completed' && r.owing.length) return `<button class="btn outlined sm" data-act="iv-dispense" data-id="${r.id}" data-owing="1">Supply balance</button>${eye}`;
      return eye; };
    return IV.frame('dispensing', `<section class="card card-pad stack g16">
      <div class="row between wrap g12"><div class="seg sm grey" role="tablist">${SUBS.map(s => `<button role="tab" aria-selected="${u.dq === s}" class="${u.dq === s ? 'on' : ''}" data-act="iv-dq" data-v="${s}">${s} (${cnt(s)})</button>`).join('')}</div>
        <span class="caption">${D().settings.twoPerson ? '<i class="ri-user-follow-line"></i> Two-person check is on: a different person checks what was dispensed.' : ''}</span></div>
      <div class="table-card"><div class="table-scroll"><table class="dt iv-dt iv-dq"><thead><tr><th>Issued</th><th>Patient</th><th>Medications</th><th>Hand-over</th><th>Status</th><th>Charge</th><th class="r">Action</th></tr></thead><tbody>
      ${l.map(r => { const c = clash(r), old = ageDays(r) > validDays(r) && r.status === 'To dispense';
        return `<tr><td class="tnum">${IV.dd(r.issued)}<small class="cell-sub">${r.id}</small></td><td>${r.pid ? `<a class="brand-u" href="#/patients/${r.pid}">${esc(r.patient)}</a>` : esc(r.patient)}${c.length && r.status === 'To dispense' ? `<small class="cell-sub bad"><i class="ri-alarm-warning-line"></i> ${esc(c[0][1])} allergy</small>` : ''}</td>
          <td>${esc(r.lines[0].drug)}${r.lines.length > 1 ? ` <span class="muted">+${r.lines.length - 1} more</span>` : ''}${isCDrx(r) ? ` ${IV.chip('CD', 't-purple', 'ri-lock-2-line')}` : ''}${r.lines.some(l => IV.cold(IV.item(l.item))) ? ` ${IV.chip('Fridge', 't-blue', 'ri-temp-cold-line')}` : ''}${old ? `<small class="cell-sub bad">Prescription expired (${validDays(r)}-day validity)</small>` : ''}${r.owing.length ? `<small class="cell-sub warn">Owing: ${r.owing.map(o => `${o.qty} × ${esc(r.lines[o.line].drug)}`).join(', ')}</small>` : ''}</td>
          <td>${r.handover === 'Post' ? 'Post' : 'Collect'}</td><td>${stChip(r)}</td><td>${chargeCell(r)}</td><td class="r"><span class="row-actions iv-acts">${action(r)}</span></td></tr>`; }).join('') || IV.empty(7, u.dq === 'To dispense' ? 'Nothing waiting. New prescriptions issued from a patient’s record appear here.' : `No ${u.dq.toLowerCase()} prescriptions.`)}
      </tbody></table></div></div></section>`, { actions: `<button class="btn outlined" data-act="iv-rx-new"><i class="ri-add-line"></i>Add prescription</button>` }); };
  acts['iv-dq'] = el => { u.dq = el.dataset.v; IV.keep(); };

  /* ---------- add a (paper / external private) prescription to the queue ---------- */
  acts['iv-rx-new'] = () => { const pts = (App.S.patients || []).map(p => [p.id, `${p.first} ${p.last}`]), meds = D().items.filter(i => i.active && ['Medicine', 'Vaccine'].includes(i.type));
    IV.dlg('Add prescription to the queue', 'For a paper or external private prescription. Prescriptions written in the patient’s record arrive here automatically.', `
      <div class="iv-g2">${IV.sel('Patient', 'pid', pts, '', { req: true, ph: 'Choose a patient', cls: 'iv-span2' })}${IV.input('Prescriber', 'pres', '', { req: true, ph: 'Full name' })}${IV.input('Registration number', 'reg', '', { req: true, ph: 'GMC / NMC / GPhC number' })}
        ${IV.input('Date written', 'date', IV.iso(new Date()), { type: 'date', req: true })}${IV.sel('Hand-over', 'handover', ['Collect', 'Post'], 'Collect')}
        ${IV.sel('Medicine', 'item', meds.map(i => [i.id, i.name]), '', { req: true, ph: 'Choose', cls: 'iv-span2' })}${IV.input('Quantity', 'qty', '', { type: 'number', req: true, attrs: 'min="1"' })}${IV.input('Days supply', 'days', '', { type: 'number', attrs: 'min="1"' })}
        ${IV.area('Directions (as written)', 'dirs', '', { req: true, rows: 2, cls: 'iv-span2' })}</div>
      ${IV.note('Allergies are read from the patient’s record — Medical History and Medical Alerts — so the clinical check uses the same list the clinician sees. Record a missing allergy on the patient’s record first.', 'info', 'ri-virus-line')}
      ${IV.note('Schedule 2 and 3 controlled drugs on a private prescription must be written on the standard private CD form (FP10PCD) with the prescriber’s identification number. Send the original to the NHSBSA once supplied.', 'info', 'ri-lock-2-line')}
      ${IV.check('ok', 'I’ve checked the prescription is signed, dated and legally valid', false)}`, `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-rx-new-go">Add to queue</button>`, { width: 680 }); };
  acts['iv-rx-new-go'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg); IV.clearErr(dlg); let bad = false;
    ['pid', 'pres', 'reg', 'date', 'item', 'dirs'].forEach(k => { if (!v[k]) { IV.err(dlg, k, 'Required'); bad = true; } }); if (!(+v.qty > 0)) { IV.err(dlg, 'qty', 'Required'); bad = true; } if (!v.ok) { IV.err(dlg, 'ok'); bad = true; }
    const it = IV.item(v.item); if (v.date && it) { const age = (Date.now() - new Date(v.date + 'T12:00:00')) / IV.DAY, lim = IV.isCD(it) ? 28 : 182; if (age > lim) { IV.err(dlg, 'date', `Out of date — ${IV.isCD(it) ? 'CD prescriptions are valid for 28 days' : 'valid for 6 months'}`); bad = true; } if (age < -0.5) { IV.err(dlg, 'date', 'Can’t be in the future'); bad = true; } }
    if (bad) { IV.firstErr(dlg); return; } const p = App.S.patients.find(x => x.id === v.pid);
    const r = { id: 'RX-' + IV.id('rx'), pid: p.id, patient: `${p.first} ${p.last}`, dob: p.dob, addr: [p.addr, p.city, p.postcode].filter(Boolean).join(', '), allergies: IV.allergiesOf(p.id), prescriber: v.pres, reg: v.reg, issued: new Date(v.date + 'T' + new Date().toTimeString().slice(0, 8)).toISOString(), handover: v.handover, status: 'To dispense', stage: '', charge: null, picks: [], owing: [], external: true,
      lines: [{ item: it.id, drug: it.name, qty: +v.qty, dose: '', dirs: v.dirs, days: +v.days || 0 }], log: [[`External prescription added (written ${IV.dd(v.date)} by ${v.pres})`, new Date().toISOString(), IV.me()]] };
    D().rx.push(r); IV.save(); u.dq = 'To dispense'; App.closeModal(); App.render(); App.snack(`Prescription for ${r.patient} added to the queue.`); };

  /* ======================= PRESCRIPTION VIEW ======================= */
  const sig = `<svg viewBox="0 0 160 60" width="160" height="60" aria-label="Prescriber signature" role="img"><path d="M14 40c18-26 30-30 26-8s8 14 22-4 8 22 26 8 18-20 30-10 14 6 26-2" fill="none" stroke="#1d2433" stroke-width="2" stroke-linecap="round"/></svg>`;
  acts['iv-rx'] = el => { const r = rxOf(el.dataset.id), c = r.charge;
    IV.dlg(`Prescription ${r.id} ${IV.chip(r.status === 'Cancelled' ? 'Cancelled' : 'Issued', r.status === 'Cancelled' ? 't-grey' : 't-green', r.status === 'Cancelled' ? '' : 'ri-checkbox-circle-line')}`, `Issued ${IV.dt(r.issued)} by ${esc(r.prescriber)} (${esc(r.reg)})`, `
      ${IV.kv([['Patient', `${r.pid ? `<a class="brand-u" href="#/patients/${r.pid}" data-act="close-modal">${esc(r.patient)}</a>` : esc(r.patient)}`], ['Date of birth', r.dob ? IV.dd(r.dob) : '—'], ['Address', esc(r.addr || '—')], ['Allergies', r.allergies.length ? `<b class="bad">${esc(r.allergies.join(', '))}</b>` : 'None known'], ['Hand-over', r.handover === 'Post' ? 'Post to the patient’s address' : 'Collect from the clinic'], ['Valid until', IV.dd(new Date(new Date(r.issued).getTime() + validDays(r) * IV.DAY).toISOString()) + (isCDrx(r) ? ' · CD (28 days)' : '')]])}
      <div class="iv-box"><div class="row g8"><b>Payment</b>${c ? IV.chip(c.status, c.status === 'Awaiting payment' ? 't-orange' : 't-green') : IV.chip('Not set', 't-grey')}</div>${c ? `<div class="caption">${c.lines.map(x => `${esc(x.t)}: ${IV.money(x.amt)}`).join('<br>')}${c.postage ? `<br>Postage: ${IV.money(c.postage)}` : ''}${c.fee ? `<br>Dispensing fee: ${IV.money(c.fee)}` : ''}<br><b>Total: ${IV.money(c.total)}</b>${c.paidAt ? `<br>Paid by ${esc(c.method)} on ${IV.dt(c.paidAt)}` : ''}</div>` : '<div class="caption">No charge prepared yet.</div>'}</div>
      <div class="iv-box"><div class="row g8"><b>Fulfilment</b>${stChip(r)}</div><div class="caption">${r.picks.length ? r.picks.map(p => { const b = IV.batch(p.batch); return `${esc(r.lines[p.line].drug)} — batch ${esc(b ? b.batch : '?')}${b && b.expiry ? ' · exp ' + IV.dd(b.expiry) : ''} · ${p.qty}`; }).join('<br>') : 'Not dispensed yet.'}${r.dispensedBy ? `<br>Dispensed by ${esc(r.dispensedBy)}` : ''}${r.accuracy ? ` · checked by ${esc(r.accuracy.by)}` : ''}${r.handed ? `<br>${esc(r.handed.how)} ${IV.dt(r.handed.at)}${r.handed.to ? ' · ' + esc(r.handed.to) : ''}${r.handed.tracking ? ' · tracking ' + esc(r.handed.tracking) : ''}${r.handed.id ? ' · ID: ' + esc(r.handed.id) : ''}` : ''}</div></div>
      ${r.lines.map(l => `<div class="iv-med"><b>${esc(l.drug)}</b><span class="caption">${l.dose ? esc(l.dose) + ' · ' : ''}Quantity: ${l.qty} ${esc(IV.item(l.item)?.unit || '')}${l.days ? ` · ${l.days} days` : ''}</span><span class="caption">Directions: ${esc(l.dirs)}</span></div>`).join('')}
      <p class="caption" style="margin:0">I confirm that I am a registered healthcare professional, that I have assessed this patient, and that I am authorised to prescribe the medicines listed above. The details above are correct, and the signature below is mine.</p><div class="iv-sig">${sig}</div>
      <h3 class="bl-h3"><i class="ri-time-line"></i>Activity</h3>${IV.timeline(r.log)}`,
      `${['To dispense', 'In progress'].includes(r.status) ? `<button class="btn text iv-danger-t" data-act="iv-rx-cancel" data-id="${r.id}">Cancel prescription</button>` : ''}<span class="grow"></span><button class="btn text brand" data-act="close-modal">Close</button>`, { width: 600 }); };
  acts['iv-rx-cancel'] = el => { const r = rxOf(el.dataset.id);
    IV.dlg('Cancel prescription?', `${esc(r.patient)} · ${r.id}`, `${r.picks.length ? IV.note('This medicine has been dispensed but not handed over. It goes back to the batches it came from — only do this if it never left the dispensary.', 'warn') : ''}${paid(r) && r.charge.total ? IV.note(`The patient has paid ${IV.money(r.charge.total)}. The charge will be marked “Refund due” for Billing.`, 'info') : ''}${IV.sel('Reason', 'reason', ['Prescriber cancelled', 'Patient no longer needs it', 'Clinical concern — prescriber informed', 'Duplicate prescription', 'Other'], '', { req: true, ph: 'Choose a reason' })}${IV.area('Notes', 'note', '', { rows: 2 })}`,
      `<button class="btn text" data-act="close-modal">Keep prescription</button><button class="btn danger" data-act="iv-rx-cancel-go" data-id="${r.id}">Cancel prescription</button>`, { width: 520 }); };
  acts['iv-rx-cancel-go'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), r = rxOf(el.dataset.id); IV.clearErr(dlg); if (!v.reason) { IV.err(dlg, 'reason', 'Choose a reason'); return; }
    unpick(r, 'Prescription cancelled'); if (paid(r) && r.charge.total) r.charge.status = 'Refund due'; r.status = 'Cancelled'; r.stage = ''; log(r, `Cancelled — ${v.reason}${v.note ? ': ' + v.note : ''}`); IV.save(); App.closeModal(); App.render(); App.snack('Prescription cancelled.', 'info'); };
  const unpick = (r, why) => { r.picks.forEach(p => { const b = IV.batch(p.batch); if (!b) return; IV.move(b.item, b.id, 'Returned to stock', p.qty, { ref: r.id, note: why, party: r.patient }); if (b.status === 'Used up') b.status = 'Available'; }); r.picks = []; delete r.dispensedBy; delete r.accuracy; };

  /* ======================= CHARGE + PAYMENT ======================= */
  acts['iv-charge'] = el => { const r = rxOf(el.dataset.id), c = r.charge, s = D().settings;
    const lines = c ? c.lines : r.lines.map(l => { const it = IV.item(l.item); return { t: `${l.drug} × ${l.qty}`, amt: +((it ? it.sale : 0) * l.qty).toFixed(2) }; });
    const dlg = IV.dlg(c ? 'Edit charge' : 'Prepare charge', `${esc(r.patient)} · ${r.id}`, `
      ${IV.note('Prices come from each item’s sale price. Change them here for this patient only.', 'info')}
      <div class="stack g12">${lines.map((x, k) => `<div class="iv-chline"><span class="grow">${esc(x.t)}</span>${IV.input('', 'l' + k, x.amt.toFixed(2), { type: 'number', pre: '£', attrs: 'step="0.01" min="0" aria-label="Price"', cls: 'sm' })}</div>`).join('')}
        ${r.handover === 'Post' ? `<div class="iv-chline"><span class="grow">Postage (tracked)</span>${IV.input('', 'postage', (c ? c.postage : s.postage).toFixed(2), { type: 'number', pre: '£', attrs: 'step="0.01" min="0" aria-label="Postage"', cls: 'sm' })}</div>` : ''}
        <div class="iv-chline"><span class="grow">Dispensing fee</span>${IV.input('', 'fee', (c ? c.fee : s.fee).toFixed(2), { type: 'number', pre: '£', attrs: 'step="0.01" min="0" aria-label="Dispensing fee"', cls: 'sm' })}</div>
        <div class="bl-total"><span>Total</span><b class="iv-total">£0.00</b></div></div>
      ${IV.check('free', 'No charge — included in the patient’s package or plan', c && c.status === 'No charge')}${IV.check('link', 'Send the patient a payment link by email', !c)}`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-charge-save" data-id="${r.id}">${c ? 'Save charge' : 'Prepare charge'}</button>`, { width: 520 });
    const tot = () => { const v = IV.vals(dlg); let t = lines.reduce((n, x, k) => n + (+v['l' + k] || 0), 0) + (+v.postage || 0) + (+v.fee || 0); App.$('.iv-total', dlg).textContent = v.free ? '£0.00 (no charge)' : IV.money(t); return t; };
    dlg.addEventListener('input', tot); dlg.addEventListener('change', tot); tot(); dlg._lines = lines; };
  acts['iv-charge-save'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), r = rxOf(el.dataset.id), lines = dlg._lines.map((x, k) => ({ t: x.t, amt: +v['l' + k] || 0 }));
    const total = +(lines.reduce((n, x) => n + x.amt, 0) + (+v.postage || 0) + (+v.fee || 0)).toFixed(2);
    r.charge = { lines, postage: +v.postage || 0, fee: +v.fee || 0, total: v.free ? 0 : total, status: v.free ? 'No charge' : 'Awaiting payment' };
    log(r, v.free ? 'Marked as no charge' : `Charge prepared · ${IV.money(total)}${v.link ? ' · payment link emailed' : ''}`); IV.save(); App.closeModal(); App.render(); App.snack(v.free ? 'Marked as no charge. Ready to dispense.' : v.link ? `Charge saved. Payment link sent to ${r.patient}.` : 'Charge saved.'); };
  acts['iv-pay'] = el => { const r = rxOf(el.dataset.id);
    IV.dlg('Take payment', `${esc(r.patient)} · ${r.id}`, `<div class="bl-total"><span>Amount due</span><b>${IV.money(r.charge.total)}</b></div>${IV.sel('Payment method', 'method', ['Card', 'Cash', 'Bank transfer', 'Payment link (already paid online)'], 'Card', { req: true })}${IV.input('Reference (optional)', 'ref', '', { ph: 'Card terminal or transfer reference' })}`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-pay-go" data-id="${r.id}">Record payment</button>`, { width: 460 }); };
  acts['iv-pay-go'] = el => { const v = IV.vals(el.closest('.dialog')), r = rxOf(el.dataset.id); Object.assign(r.charge, { status: 'Paid', method: v.method.replace(/ \(.*/, ''), paidAt: new Date().toISOString(), ref: v.ref });
    log(r, `Payment recorded · ${v.method.replace(/ \(.*/, '').toLowerCase()} · ${IV.money(r.charge.total)}`); IV.save(); App.closeModal(); App.render(); App.snack('Payment recorded successfully'); };

  /* ======================= DISPENSE ======================= */
  acts['iv-dispense'] = el => { const r = rxOf(el.dataset.id), owing = !!el.dataset.owing, c = clash(r), age = ageDays(r), lim = validDays(r);
    if (!owing && age > lim) { IV.dlg('Prescription has expired', `${esc(r.patient)} · ${r.id}`, IV.note(`This prescription was written ${age} days ago. ${isCDrx(r) ? 'Prescriptions for Schedule 2, 3 and 4 controlled drugs are valid for 28 days.' : 'Private prescriptions for prescription-only medicines are valid for 6 months.'} Ask the prescriber for a new one, then cancel this one.`, 'bad'), `<button class="btn primary" data-act="close-modal">Close</button>`, { width: 480 }); return; }
    const need = owing ? r.owing.map(o => ({ line: o.line, qty: o.qty })) : r.lines.map((l, k) => ({ line: k, qty: l.qty }));
    const state = need.map(n => { const l = r.lines[n.line], f = IV.fefo(l.item); let left = n.qty; const rows = [];
      f.forEach(b => { if (left > 0) { const q = Math.min(left, b.qty); rows.push({ item: l.item, b: b.id, q }); left -= q; } }); if (!rows.length) rows.push({ item: l.item, b: '', q: '' }); return { ...n, rows }; });
    const dlg = App.dialog(`${App.dlgHead(`Dispense: ${esc(r.patient)}`, `${r.id} · ${esc(r.prescriber)} (${esc(r.reg)})${owing ? ' · supplying the balance owed' : ''}`)}<div class="dlg-body iv-dlg iv-disp"></div><div class="dlg-foot"><span class="note">Stock is deducted when you confirm.</span><button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-dispense-go" data-id="${r.id}" ${owing ? 'data-owing="1"' : ''}>Mark dispensed</button></div>`, { width: 880 });
    dlg._st = state; dlg._r = r;
    const draw = () => { const body = App.$('.iv-disp', dlg), keepScroll = body.scrollTop;
      body.innerHTML = `
      ${owing ? '' : `<fieldset class="iv-checks"><legend>Clinical check</legend>
        ${c.length ? IV.note(`<b>Allergy alert:</b> ${c.map(([d, a]) => `${esc(d)} — patient is allergic to <b>${esc(a)}</b>`).join('; ')}. Don’t supply unless the prescriber confirms it’s intended.`, 'bad', 'ri-alarm-warning-line') + `<div class="iv-g2">${IV.input('Prescriber contacted — who confirmed?', 'ovr', dlg._ovr || '', { req: true, ph: 'Name, time and what they said' })}</div>` : ''}
        <div class="iv-g2c">${IV.check('k1', `Prescription is valid: signed, dated ${IV.dd(r.issued)} (${age} day${age === 1 ? '' : 's'} old, valid ${lim} days)${isCDrx(r) ? ', CD requirements met' : ''}`, dlg._k1)}${IV.check('k2', `Prescriber registration checked: ${esc(r.reg)}`, dlg._k2)}${IV.check('k3', 'Dose, directions and quantity are appropriate for this patient', dlg._k3)}${IV.check('k4', `Allergies (${r.allergies.length ? esc(r.allergies.join(', ')) : 'none known'}) and interactions with current medicines checked`, dlg._k4)}</div></fieldset>`}
      ${state.map((n, si) => { const l = r.lines[n.line], it = IV.item(l.item), sum = n.rows.reduce((t, x) => t + (+x.q || 0), 0);
        return `<section class="iv-pick"><div class="stack g4"><b class="sub1">${esc(l.drug)}</b><span class="caption">${owing ? 'Owed' : 'Prescribed'}: ${n.qty} ${esc(it.unit)} · ${esc(l.dirs)}</span></div>
          ${n.rows.map((x, ri) => { const its = D().items.filter(i => i.active && i.type !== 'Consumable'), sb = IV.batch(x.b), bs = x.item ? IV.fefo(x.item) : [], over = sb && +x.q > sb.qty, it2 = IV.item(x.item), short = sb && sb.expiry && IV.daysTo(sb.expiry) < (l.days || 0);
            return `<div class="iv-prow"><div class="field select sm"><label>Stock item</label><select data-si="${si}" data-ri="${ri}" data-k="item" aria-label="Stock item"><option value="">Stock item</option>${its.map(i => `<option value="${i.id}" ${i.id === x.item ? 'selected' : ''}>${esc(i.name)} (${IV.onHand(i.id)} ${esc(i.unit)})</option>`).join('')}</select></div>
              <div class="field select sm ${x.item ? '' : 'dis'}"><label>Batch (earliest expiry first)</label><select data-si="${si}" data-ri="${ri}" data-k="b" ${x.item ? '' : 'disabled'} aria-label="Batch"><option value="">Batch (earliest expiry first)</option>${bs.map(b => `<option value="${b.id}" ${b.id === x.b ? 'selected' : ''}>${esc(b.batch)} · ${b.expiry ? 'exp ' + IV.dd(b.expiry) + ' · ' : ''}${b.qty} on hand</option>`).join('')}</select></div>
              <div class="field sm ${over ? 'err' : ''}"><label>Quantity</label><input type="number" min="1" value="${esc(x.q)}" data-si="${si}" data-ri="${ri}" data-k="q" aria-label="Quantity" placeholder="Quantity"></div>
              <button class="icon-btn s20" data-act="iv-prow-rm" data-si="${si}" data-ri="${ri}" aria-label="Remove stock line"><i class="ri-delete-bin-line"></i></button>
              ${over ? `<div class="iv-err iv-span-all">Only ${sb.qty} ${esc(it2.unit)} in this batch.</div>` : ''}${x.item && x.item !== l.item ? `<div class="iv-warn iv-span-all"><i class="ri-error-warning-line"></i> Different item from the one prescribed — only substitute if it’s the same medicine, strength and form.</div>` : ''}${short ? `<div class="iv-warn iv-span-all"><i class="ri-error-warning-line"></i> This batch expires ${IV.dd(sb.expiry)}, before the ${l.days}-day course ends.</div>` : ''}${x.item && !bs.length ? `<div class="iv-err iv-span-all">No usable stock of this item. Order more or supply what you have.</div>` : ''}</div>`; }).join('')}
          <div class="row g16 wrap"><button class="btn text brand sm" data-act="iv-prow-add" data-si="${si}"><i class="ri-add-line"></i>Add stock line</button><span class="caption ${sum < n.qty ? 'warn' : sum > n.qty ? 'bad' : ''}">Supplying ${sum} of ${n.qty} ${esc(it.unit)}</span></div>
          ${sum < n.qty ? IV.check('owe' + si, `Supply ${sum} now and record <b>${n.qty - sum}</b> as owing — tell the patient when the balance will be ready`, dlg['_owe' + si]) : ''}</section>`; }).join('')}
      ${r.handover === 'Post' ? IV.note(`<b>Hand-over: Post.</b> You’ll add the tracking number when the parcel is sent.${r.lines.some(l => IV.cold(IV.item(l.item))) ? ' Fridge item — use a validated cold-chain pack.' : ''}${isCDrx(r) ? ' Controlled drug — use a tracked, signed-for service.' : ''}`, 'info', 'ri-truck-line') : ''}
      <div class="iv-labels"><div class="row between"><b>Dispensing labels</b><span class="caption">Printed when you confirm</span></div>${state.map(n => label(r, r.lines[n.line], n.rows.reduce((t, x) => t + (+x.q || 0), 0))).join('')}</div>
      ${IV.check('pil', 'Patient information leaflet included with each medicine', dlg._pil)}
      ${IV.note(r.charge ? `Charge ${IV.money(r.charge.total)} (${r.charge.status.toLowerCase()}). Stock is deducted when you confirm.` : 'No charge set. Stock is deducted when you confirm.', 'info')}`;
      body.scrollTop = keepScroll; };
    dlg._draw = draw; draw();
    dlg.addEventListener('change', e => { const t = e.target; if (t.name) { if (/^k\d|^pil|^owe/.test(t.name)) dlg['_' + t.name] = t.checked; if (t.name === 'ovr') dlg._ovr = t.value; return; }
      const si = t.dataset.si, ri = t.dataset.ri; if (si == null) return; const x = state[si].rows[ri]; if (t.dataset.k === 'item') { x.item = t.value; const f = IV.fefo(t.value); x.b = f[0] ? f[0].id : ''; } if (t.dataset.k === 'b') x.b = t.value; if (t.dataset.k === 'q') x.q = t.value === '' ? '' : +t.value; draw(); });
    dlg.addEventListener('input', e => { if (e.target.name === 'ovr') dlg._ovr = e.target.value; }); };
  const label = (r, l, qty) => { const s = D().settings, it = IV.item(l.item);
    return `<div class="iv-label" aria-label="Label preview"><div class="row between"><b>${App.fmt(qty)} × ${esc(l.drug)}</b><span>${IV.dd(new Date().toISOString())}</span></div><div>${esc(l.dirs)}</div><div class="row between"><b>${esc(r.patient)}</b><span>${r.id}</span></div><small>${esc(IV.biz())} · ${esc(s.labelAddr)} · ${esc(s.labelPhone)}</small><small class="iv-label-kids">Keep out of the sight and reach of children.${IV.cold(it) ? ' Store in a refrigerator (2–8 °C).' : ''}${it && it.legal === 'CD4-1' ? ' Warning: may cause drowsiness.' : ''}</small></div>`; };
  acts['iv-prow-add'] = el => { const dlg = el.closest('.dialog'), n = dlg._st[el.dataset.si], l = dlg._r.lines[n.line]; n.rows.push({ item: l.item, b: '', q: '' }); dlg._draw(); };
  acts['iv-prow-rm'] = el => { const dlg = el.closest('.dialog'), n = dlg._st[el.dataset.si]; if (n.rows.length > 1) n.rows.splice(+el.dataset.ri, 1); else Object.assign(n.rows[0], { b: '', q: '' }); dlg._draw(); };
  acts['iv-dispense-go'] = el => { const dlg = el.closest('.dialog'), r = dlg._r, owing = !!el.dataset.owing, st = dlg._st; IV.clearErr(dlg); let bad = false; const msgs = [];
    if (!owing) { ['k1', 'k2', 'k3', 'k4'].forEach(k => { if (!dlg['_' + k]) { IV.err(dlg, k); bad = true; } }); if (bad) msgs.push('Complete the clinical check'); if (clash(r).length && !(dlg._ovr || '').trim()) { IV.err(dlg, 'ovr', 'Record who confirmed the prescription'); bad = true; } }
    st.forEach((n, si) => { const sum = n.rows.reduce((t, x) => t + (+x.q || 0), 0);
      n.rows.forEach(x => { const b = IV.batch(x.b); if (+x.q > 0 && !b) { bad = true; msgs.push('Choose a batch for every stock line'); } if (b && +x.q > b.qty) { bad = true; msgs.push(`Batch ${b.batch} doesn’t have enough stock`); } });
      if (sum > n.qty) { bad = true; msgs.push(`You’re supplying more ${r.lines[n.line].drug} than prescribed`); } if (sum < n.qty && !dlg['_owe' + si]) { bad = true; IV.err(dlg, 'owe' + si); msgs.push(`Confirm the owing balance for ${r.lines[n.line].drug}`); } });
    if (st.every(n => !n.rows.some(x => +x.q > 0))) { bad = true; msgs.push('Nothing to supply yet'); }
    if (!dlg._pil) { IV.err(dlg, 'pil'); bad = true; }
    if (bad) { App.snack(msgs[0] || 'Check the highlighted items.', 'error'); IV.firstErr(dlg); return; }
    const cd = isCDrx(r), picks = [], owe = [];
    st.forEach(n => { const l = r.lines[n.line]; let sum = 0; n.rows.forEach(x => { if (!(+x.q > 0)) return; const b = IV.batch(x.b), it = IV.item(b.item); sum += +x.q; picks.push({ line: n.line, batch: b.id, qty: +x.q });
      IV.move(b.item, b.id, 'Dispensed', -x.q, { ref: r.id, party: IV.isCD(it) ? `${r.patient}, ${r.addr}` : r.patient, prescriber: `${r.prescriber} (${r.reg})` }); });
      if (sum < n.qty) owe.push({ line: n.line, qty: n.qty - sum }); });
    r.picks = owing ? r.picks.concat(picks) : picks; r.owing = owe; r.dispensedBy = IV.me(); r.dispensedAt = new Date().toISOString(); r.clinical = owing ? r.clinical : { by: IV.me(), at: r.dispensedAt, override: dlg._ovr || '' }; delete r.accuracy; r.cd = cd;
    if (dlg._ovr) log(r, `Allergy alert overridden — ${dlg._ovr}`);
    log(r, `${owing ? 'Balance dispensed' : 'Dispensed'} from ${picks.map(p => IV.batch(p.batch).batch).join(', ')} · label printed${owe.length ? ` · owing ${owe.map(o => o.qty + ' × ' + r.lines[o.line].drug).join(', ')}` : ''}`);
    r.status = 'In progress'; r.stage = D().settings.twoPerson ? 'Awaiting check' : r.handover === 'Post' ? 'Ready to post' : 'Ready for collection';
    IV.save(); App.closeModal(); u.dq = 'In progress'; App.render(); App.snack(`Dispensed for ${r.patient}.${D().settings.twoPerson ? '\nA second person now does the accuracy check.' : ''}`); };

  /* ======================= ACCURACY CHECK ======================= */
  acts['iv-check'] = el => { const r = rxOf(el.dataset.id), checkers = IV.staff().filter(s => s !== r.dispensedBy);
    IV.dlg('Accuracy check', `${esc(r.patient)} · ${r.id} · dispensed by ${esc(r.dispensedBy)} ${IV.dt(r.dispensedAt)}`, `
      ${IV.note('Check the dispensed items against the prescription, not against the label. The person who checks must not be the person who dispensed.', 'info', 'ri-user-follow-line')}
      <div class="table-card"><table class="dt iv-dt" style="min-width:0"><thead><tr><th>Prescribed</th><th>Dispensed</th><th>Batch · expiry</th><th class="r">Qty</th></tr></thead><tbody>${r.picks.map(p => { const b = IV.batch(p.batch), l = r.lines[p.line]; return `<tr><td>${esc(l.drug)}<small class="cell-sub">${l.qty} prescribed</small></td><td>${esc(IV.item(b.item).name)}</td><td>${esc(b.batch)}<small class="cell-sub">${b.expiry ? 'exp ' + IV.dd(b.expiry) : '—'}</small></td><td class="r tnum">${p.qty}</td></tr>`; }).join('')}</tbody></table></div>
      <fieldset class="iv-checks"><legend>Checks</legend><div class="iv-g2c">${IV.check('c1', 'Right patient — name on label matches the prescription', false)}${IV.check('c2', 'Right medicine, strength and form', false)}${IV.check('c3', 'Right quantity', false)}${IV.check('c4', 'Label directions match the prescription', false)}${IV.check('c5', 'In date, packaging intact, leaflet included', false)}${r.lines.some(l => IV.cold(IV.item(l.item))) ? IV.check('c6', 'Fridge item kept in the fridge until hand-over', false) : ''}</div></fieldset>
      ${IV.sel('Checked by', 'by', checkers, checkers.includes(IV.me()) ? IV.me() : '', { req: true, ph: 'Choose who checked' })}`,
      `<button class="btn text iv-danger-t" data-act="iv-check-fail" data-id="${r.id}">Found an error</button><span class="grow"></span><button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-check-go" data-id="${r.id}">Check passed</button>`, { width: 680 }); };
  acts['iv-check-go'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), r = rxOf(el.dataset.id); IV.clearErr(dlg); let bad = false;
    Object.keys(v).filter(k => /^c\d$/.test(k)).forEach(k => { if (!v[k]) { IV.err(dlg, k); bad = true; } }); if (!v.by) { IV.err(dlg, 'by', 'Required'); bad = true; } if (bad) { IV.firstErr(dlg); return; }
    r.accuracy = { by: v.by, at: new Date().toISOString() }; r.stage = r.handover === 'Post' ? 'Ready to post' : 'Ready for collection'; log(r, 'Accuracy check passed', v.by); IV.save(); App.closeModal(); App.render(); App.snack(`Checked. ${r.handover === 'Post' ? 'Ready to post.' : 'Ready for collection — let the patient know.'}`); };
  acts['iv-check-fail'] = el => { const r = rxOf(el.dataset.id);
    IV.dlg('Record an error', `${esc(r.patient)} · ${r.id}`, `${IV.note('The items go back to stock and the prescription returns to “To dispense”. Recording near misses helps spot patterns — it isn’t about blame.', 'info')}${IV.sel('What was wrong?', 'what', ['Wrong medicine', 'Wrong strength or form', 'Wrong quantity', 'Wrong label / directions', 'Wrong patient', 'Out-of-date or damaged stock', 'Other'], '', { req: true, ph: 'Choose' })}${IV.area('What happened?', 'note', '', { rows: 3, req: true })}`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-check-fail-go" data-id="${r.id}">Record near miss</button>`, { width: 520 }); };
  acts['iv-check-fail-go'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), r = rxOf(el.dataset.id); IV.clearErr(dlg); let bad = false; if (!v.what) { IV.err(dlg, 'what', 'Required'); bad = true; } if (!v.note) { IV.err(dlg, 'note', 'Required'); bad = true; } if (bad) { IV.firstErr(dlg); return; }
    const inc = IV.logIncident('Near miss', `${r.id} ${r.patient}: ${v.what}. ${v.note}`, 'Open'); unpick(r, 'Near miss at accuracy check — ' + inc); r.status = 'To dispense'; r.stage = ''; r.owing = []; log(r, `Accuracy check failed — ${v.what} (${inc}). Returned to dispensing.`);
    IV.save(); App.closeModal(); u.dq = 'To dispense'; App.render(); App.snack(`Near miss ${inc} recorded. Stock returned; dispense again.`, 'info'); };

  /* ======================= HAND-OVER ======================= */
  acts['iv-hand'] = el => { const r = rxOf(el.dataset.id), cd = isCDrx(r), cd23 = r.lines.some(l => ['CD2', 'CD3'].includes(IV.item(l.item).legal)), cold = r.lines.some(l => IV.cold(IV.item(l.item)));
    const post = r.handover === 'Post';
    const dlg = IV.dlg(post ? 'Post to patient' : 'Hand over to patient', `${esc(r.patient)} · ${r.id}`, post ? `
      <div class="iv-g2">${IV.sel('Service', 'carrier', ['Royal Mail Special Delivery Guaranteed', 'Royal Mail Tracked 24', 'Royal Mail Tracked 48', 'Cold-chain courier (next day, temperature controlled)'], cold ? 'Cold-chain courier (next day, temperature controlled)' : cd ? 'Royal Mail Special Delivery Guaranteed' : 'Royal Mail Tracked 24', { req: true })}${IV.input('Tracking number', 'tracking', '', { req: true, ph: 'e.g. AB123456789GB' })}</div>
      <div class="caption">The patient sees the tracking number so they can follow their parcel. Sent to: ${esc(r.addr || 'patient address on file')}</div>
      ${cold ? IV.note('Pack fridge items in a validated cold-chain box with the right number of cool packs. Dispatch Monday–Wednesday so it doesn’t sit in a depot over the weekend.', 'info', 'ri-temp-cold-line') : ''}${cd ? IV.note('Controlled drug: use a signed-for, tracked service and plain outer packaging.', 'warn', 'ri-lock-2-line') : ''}
      <fieldset class="iv-checks"><legend>Before sending</legend>${IV.check('h1', 'Discreet, tamper-evident packaging with the return address', false)}${IV.check('h2', 'Counselling given by phone or written advice enclosed', false)}</fieldset>`
      : `<div class="iv-g2">${IV.sel('Collected by', 'who', ['Patient', 'Patient’s representative'], 'Patient', { req: true })}<div class="iv-rep"></div></div>
      <div class="iv-hid"></div>
      <fieldset class="iv-checks"><legend>At the counter</legend>${IV.check('h1', 'Confirmed the patient’s name and date of birth', false)}${IV.check('h2', 'Counselling given: how to take it, side effects, storage', false)}${cold ? IV.check('h3', 'Told the patient to put it in the fridge as soon as they get home', false) : ''}</fieldset>`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-hand-go" data-id="${r.id}">${post ? 'Mark posted' : 'Mark collected'}</button>`, { width: 620 });
    if (!post) { const upd = () => { const v = IV.vals(dlg); App.$('.iv-rep', dlg).innerHTML = v.who !== 'Patient' ? IV.input('Representative’s name', 'rep', v.rep || '', { req: true }) : '';
      App.$('.iv-hid', dlg).innerHTML = cd ? `${IV.note(cd23 ? '<b>Schedule 2/3 CD.</b> Ask for proof of identity and record whether it was seen. Record who collected it in the CD register.' : 'Controlled drug: check identity before handing over.', 'warn', 'ri-lock-2-line')}<div class="iv-g2">${IV.sel('ID seen', 'idt', ['Driving licence', 'Passport', 'Other photo ID', 'Not seen — known to staff', 'Not seen — no ID'], '', { req: true, ph: 'Choose' })}</div>` : ''; };
      dlg.addEventListener('change', e => { if (e.target.name === 'who') upd(); }); upd(); } };
  acts['iv-hand-go'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), r = rxOf(el.dataset.id), post = r.handover === 'Post'; IV.clearErr(dlg); let bad = false;
    Object.keys(v).filter(k => /^h\d$/.test(k)).forEach(k => { if (!v[k]) { IV.err(dlg, k); bad = true; } });
    if (post && !v.tracking) { IV.err(dlg, 'tracking', 'Required'); bad = true; } if ('rep' in v && !v.rep) { IV.err(dlg, 'rep', 'Required'); bad = true; } if ('idt' in v && !v.idt) { IV.err(dlg, 'idt', 'Record whether ID was seen'); bad = true; }
    if (bad) { IV.firstErr(dlg); return; }
    const to = post ? r.addr : v.who === 'Patient' ? `${r.patient} (patient)` : `${v.rep} (representative)`;
    r.handed = { at: new Date().toISOString(), by: IV.me(), how: post ? 'Posted' : 'Collected', to, carrier: v.carrier, tracking: v.tracking, id: v.idt, counselled: true };
    D().moves.filter(m => m.ref === r.id && m.type === 'Dispensed' && IV.isCD(IV.item(m.item))).forEach(m => { m.collector = post ? `Posted · ${v.carrier} ${v.tracking}` : `${v.who === 'Patient' ? 'Patient' : 'Representative: ' + v.rep} — ID ${v.idt && v.idt.startsWith('Not seen') ? v.idt.toLowerCase() : 'checked (' + (v.idt || '').toLowerCase() + ')'}`; });
    r.status = 'Completed'; r.stage = post ? 'Posted' : 'Collected'; log(r, post ? `Posted · ${v.carrier} · ${v.tracking}` : `Collected by ${to}${v.idt ? ' · ID: ' + v.idt : ''}`);
    IV.save(); App.closeModal(); App.render(); App.snack(post ? `Posted. ${r.patient} can now track the parcel.` : `Handed over to ${to}.`); };
})();

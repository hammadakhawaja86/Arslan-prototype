/* Settings › Bookings & Cancellations (Figma 20818:40306): cancellation policy tiers (full / partial / no refund),
   calendar options and no-show policy. PM ask: the cancellation policy can apply clinic-wide or be set per service. */
(function () {
  const { esc, acts, ins, chs, S } = App, PT = App.PT;
  const svcNames = () => (S.svcList || []).map(s => Array.isArray(s) ? s[0] : s.name).filter((n, i, a) => n && a.indexOf(n) === i);
  const POL = (full = 48, low = 24, pct = 50) => ({ full, low, pct });
  const BK = S.bookings = S.bookings || { scope: 'clinic', policy: POL(), perSvc: { 'Physiotherapy Session': POL(24, 12, 50) },
    cal: { hidePersonal: false, oneClick: true, weekJump: false, firstDay: 'Sunday (default)', view: 'Week (default)', autoScroll: '', step: '15 minutes (default)', naming: 'Session and client initial', member: 'First team member listed (Alex Leigh)' },
    noShow: { action: '', after: '10 Minutes' } };
  let D = null; const OPEN = {};
  const d = () => D || (D = JSON.parse(JSON.stringify(BK)));
  const dirty = () => D && JSON.stringify(D) !== JSON.stringify(BK);
  const keep = () => { const y = scrollY; App.render(); scrollTo(0, y); };
  const tiers = p => [['Full Refund Policy', `Cancel ${p.full} hours before · 100%`], ['Partial Refund Policy', `Cancel between ${p.low} to ${p.full} hours · ${p.pct}%`], ['No Refund Policy', `Cancel less than ${p.low} hours before · 0%`]];
  const acc = (k, icon, title, body, extra = '') => { const closed = OPEN[k] === false; return `<section class="bz-acc"><div class="bz-acc-h"><i class="${icon}"></i><h2>${title}</h2><span class="grow"></span>${extra}<button class="icon-btn s20" data-act="bk-acc" data-k="${k}" aria-expanded="${!closed}" aria-label="${closed ? 'Expand' : 'Collapse'} ${title}"><i class="${closed ? 'ri-arrow-down-s-line' : 'ri-arrow-up-s-line'}"></i></button></div>${closed ? '' : `<div class="bz-acc-b">${body}</div>`}</section>`; };
  const tierRows = (p, svc) => tiers(p).map(([t, sub], i) => `<div class="bk-tier"><span class="bk-n">0${i + 1}</span><div class="grow"><b>${t}</b><small>${sub}</small></div><button class="btn primary sm bk-edit" data-act="bk-tedit" data-i="${i}" data-svc="${esc(svc || '')}"><i class="ri-edit-line"></i>Edit</button></div>`).join('');
  const sel = (label, k, opts, help) => `<div class="stack g4">${App.field(label, `<select data-ch="bk-f" data-k="${k}">${opts.map(o => `<option ${o === k.split('.').reduce((a, x) => a[x], d()) ? 'selected' : ''} ${o === '' ? 'value=""' : ''}>${o || 'Select here'}</option>`).join('')}</select>`, { cls: 'select' })}${help ? `<small class="caption" style="padding-left:14px">${help}</small>` : ''}</div>`;
  const cbx = (k, t) => `<label class="cbx"><input type="checkbox" data-ch="bk-f" data-k="${k}" ${k.split('.').reduce((a, x) => a[x], d()) ? 'checked' : ''}>${t}</label>`;
  const preview = n => ({ 'Session and client initial': 'Initial Consultation (M. Smith)', 'Client full name': 'Michael Smith', 'Session name only': 'Initial Consultation', 'Client initials and session': 'M.S. · Initial Consultation' }[n] || n);

  App.route('/settings/bookings', () => { const x = d(), ch = dirty(), names = svcNames();
    const scope = `<div class="bk-scope"><div class="pt-seg" role="tablist" aria-label="Where the policy applies">${[['clinic', 'Clinic-wide'], ['service', 'Per service']].map(([k, t]) => `<button role="tab" aria-selected="${x.scope === k}" class="${x.scope === k ? 'on' : ''}" data-act="bk-scope" data-v="${k}">${t}</button>`).join('')}</div><span class="caption">${x.scope === 'clinic' ? 'One policy for every service.' : 'Services use the clinic policy unless you give them their own.'}</span></div>`;
    const perSvc = x.scope !== 'service' ? '' : `<div class="bk-svcs"><b class="sub2">Per-service policies</b><div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Service</th><th>Policy</th><th>Full refund</th><th>Partial refund</th><th>No refund</th><th>Actions</th></tr></thead><tbody>
      ${names.map(n => { const own = x.perSvc[n], p = own || x.policy; return `<tr><td><b class="fw5">${esc(n)}</b></td><td>${own ? '<span class="chip sm filled t-teal">Custom</span>' : '<span class="chip sm filled t-grey">Clinic policy</span>'}</td><td>${p.full}h+ · 100%</td><td>${p.low}–${p.full}h · ${p.pct}%</td><td>&lt; ${p.low}h · 0%</td><td><div class="row g4"><button class="btn text sm brand" data-act="bk-svc" data-svc="${esc(n)}">${own ? 'Edit' : 'Customise'}</button>${own ? `<button class="btn text sm" data-act="bk-svcx" data-svc="${esc(n)}" title="Go back to the clinic policy">Reset</button>` : ''}</div></td></tr>`; }).join('') || '<tr class="empty-row"><td colspan="6">Add services in My Service &amp; Packages first.</td></tr>'}</tbody></table></div></div></div>`;
    const body = `<div class="pt-bar"><div class="me-head"><h1>Bookings &amp; Cancellations</h1><p>Configure your booking rules, cancellation policies, and notification preferences for client appointments.</p></div><span class="grow"></span>${ch ? '<span class="dirty-bar"><i class="ri-error-warning-line"></i>Unsaved changes</span>' : ''}<button class="btn outlined lg" data-act="bk-cancel" ${ch ? '' : 'disabled'}>Cancel</button><button class="btn primary lg" data-act="bk-save" ${ch ? '' : 'disabled'}>Save Changes</button></div>
      ${acc('pol', 'ri-calendar-close-line', 'Cancellation Policy', `${scope}<div class="stack g8">${x.scope === 'service' ? '<b class="sub2">Clinic policy</b>' : ''}${tierRows(x.policy)}</div>${perSvc}`)}
      ${acc('cal', 'ri-calendar-2-line', 'Calendar Options', `<div class="stack g4">${cbx('cal.hidePersonal', 'Hide personal event details when team members view my calendar.')}${cbx('cal.oneClick', 'Enable one-click bookings from My Calendar')}${cbx('cal.weekJump', 'Jump to Week View when selecting days in mini calendar')}</div>
        <div class="g2" style="gap:14px">${sel('First day of week', 'cal.firstDay', ['Sunday (default)', 'Monday', 'Saturday'])}${sel('Default calendar view (Web Portal)', 'cal.view', ['Day', 'Week (default)', 'Month', 'Agenda'])}
        ${sel('Auto-scroll to time', 'cal.autoScroll', ['', '7:00 AM', '8:00 AM', '9:00 AM'], 'Leave empty to auto-scroll to current time')}${sel('Calendar time increments', 'cal.step', ['5 minutes', '10 minutes', '15 minutes (default)', '30 minutes', '60 minutes'])}
        <div class="stack g8">${sel('Session naming convention', 'cal.naming', ['Session and client initial', 'Client full name', 'Session name only', 'Client initials and session'])}<div class="bk-prev"><small>Preview</small><b>${esc(preview(x.cal.naming))}</b></div></div>
        ${sel('Default team member', 'cal.member', ['First team member listed (Alex Leigh)', 'Myself', 'Last viewed team member'], 'We’ll display this team member’s calendar when you open the My Calendar page in Agenda, Day, Week, or Month view.')}</div>`)}
      ${acc('ns', 'ri-user-unfollow-line', 'No-Show Policy', `<div class="g2" style="gap:14px">${sel('No-Show By', 'noShow.action', ['', 'Mark as no-show only', 'Charge the full appointment fee', 'Charge a 50% no-show fee', 'Restrict online booking after 3 no-shows'], 'Action taken when a patient fails to attend their appointment')}${sel('No-Show After', 'noShow.after', ['5 Minutes', '10 Minutes', '15 Minutes', '20 Minutes', '30 Minutes'], 'Minutes after appointment start before it is marked as a no-show')}</div>
        <div class="pt-note bk-info"><i class="ri-information-line"></i><span>No-show records are stored per client and visible in the client profile. Multiple no-shows may trigger automatic booking restrictions.</span></div>`)}`;
    return `<nav class="crumbs"><a href="#/settings/business">Settings</a><span>/</span><span class="cur">Bookings &amp; Cancellations</span></nav><div class="settings">${App.settingsNav('Bookings & Cancellations')}<section class="card card-pad stack g16">${body}</section></div>`; },
    { key: 'settings', icon: 'ri-settings-3-line', title: 'Settings' });
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/settings/bookings')) D = null; });

  acts['bk-acc'] = el => { OPEN[el.dataset.k] = OPEN[el.dataset.k] === false; keep(); };
  acts['bk-scope'] = el => { d().scope = el.dataset.v; keep(); };
  chs['bk-f'] = el => { const ps = el.dataset.k.split('.'), last = ps.pop(); ps.reduce((a, x) => a[x], d())[last] = el.type === 'checkbox' ? el.checked : el.value; keep(); };
  acts['bk-cancel'] = () => { D = null; keep(); App.snack('Changes discarded.', 'info'); };
  acts['bk-save'] = () => { if (!d().noShow.action) { App.$('[data-k="noShow.action"]').closest('.field').classList.add('err'); OPEN.ns = true; return App.snack('Choose what happens when a patient doesn’t attend.', 'error'); }
    Object.keys(BK).forEach(k => BK[k] = d()[k]); D = null; keep(); App.snack('Bookings & cancellations settings saved.'); };

  /* tier edit modals (one per tier, as in the Figma); svc = '' edits the clinic policy */
  let T = null;
  const polOf = svc => svc ? (d().perSvc[svc] || (d().perSvc[svc] = { ...d().policy })) : d().policy;
  const nf = (name, v, label) => App.field(label, `<input type="number" min="0" max="${name === 'pct' ? 100 : 720}" name="${name}" value="${v}">${name === 'pct' ? '<span class="adorn">%</span>' : ''}`, { req: true });
  const tierDlg = () => { const p = T.p, sv = T.svc ? ` for ${esc(T.svc)}` : '';
    const body = T.i === 0 ? `<b class="sub2">Cancel more than</b><span class="caption">${p.full} hours before to get the full refund.</span>${nf('full', p.full, 'Select Hours')}<div class="pt-note bk-info"><i class="ri-information-line"></i><span>Applies to cancellations made more than ${p.full} hours before the appointment.</span></div>`
      : T.i === 1 ? `<b class="sub2">Cancel between</b><span class="caption">${p.low} and ${p.full} hours to get a partial refund.</span><div class="bk-range">${nf('low', p.low, 'From (hours)')}<span>to</span>${nf('full', p.full, 'To (hours)')}</div>${nf('pct', p.pct, 'Refund percentage')}<div class="pt-note bk-info"><i class="ri-information-line"></i><span>Applies to cancellations made between ${p.low} and ${p.full} hours before the appointment.</span></div>`
      : `<b class="sub2">Cancel less than</b><span class="caption">${p.low} hours before to get no refund.</span>${nf('low', p.low, 'Time before appointment (hours)')}<div class="pt-note bk-info"><i class="ri-information-line"></i><span>Applies to cancellations made less than ${p.low} hours before the appointment.</span></div>`;
    App.dialog(PT.modal('ri-error-warning-line', tiers(p)[T.i][0] + sv, '', body + (T.err ? `<p class="helper err" style="margin:0">${T.err}</p>` : ''), '<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="bk-tsave">Save</button>'), { width: 480 }); };
  acts['bk-tedit'] = el => { const svc = el.dataset.svc; T = { i: +el.dataset.i, svc, p: { ...(svc ? polOf(svc) : d().policy) } }; tierDlg(); };
  acts['bk-tsave'] = () => { const f = PT.formData(), p = { ...T.p }; Object.keys(f).forEach(k => p[k] = +f[k]);
    T.err = !(p.full > 0) || !(p.low >= 0) ? 'Enter the number of hours.' : p.low >= p.full ? 'The partial refund window must start before the full refund threshold.' : !(p.pct > 0 && p.pct < 100) ? 'The partial refund must be between 1% and 99%.' : '';
    if (T.err) { T.p = p; return tierDlg(); }
    Object.assign(polOf(T.svc), p); App.closeModal(); keep(); App.snack(`${tiers(p)[T.i][0]} updated${T.svc ? ' for ' + T.svc : ''}. Save changes to apply it.`, 'info'); };
  // per-service policy: one dialog with all three tiers
  acts['bk-svc'] = el => { const n = el.dataset.svc, own = !!d().perSvc[n];
    App.dialog(PT.modal('ri-calendar-close-line', `Cancellation policy for ${esc(n)}`, own ? 'This service has its own policy.' : 'Uses the clinic policy until you edit a tier.', `<div class="stack g8">${tierRows(d().perSvc[n] || d().policy, n)}</div>`, '<button class="btn primary lg" data-act="bk-svcdone">Done</button>'), { width: 560 }); };
  acts['bk-svcdone'] = () => { App.closeModal(); keep(); };
  acts['bk-svcx'] = el => { delete d().perSvc[el.dataset.svc]; keep(); App.snack(`${el.dataset.svc} now uses the clinic policy.`, 'info'); };
})();

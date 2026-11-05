/* EHR › Documents & Forms (Aqlios Figma 16579:120532): all documents, submitted forms, form preview. */
(function () {
  const { esc, acts, ins, chs } = App; const PT = App.PT;
  const meta = { key: 'documents', icon: 'ri-file-copy-2-line', title: 'Documents & Forms' };
  const uid = () => 'd' + Math.random().toString(36).slice(2, 8);
  const chip = (t, tone, i) => `<span class="chip sm filled ${tone}">${i ? `<i class="${i}"></i>` : ''}${esc(t)}</span>`;
  const P = id => PT.pat(id);
  const who = d => d.pid ? PT.name(P(d.pid)) : d.guest;

  /* ---------- data ---------- */
  const ST = { Completed: 't-green', Sent: 't-blue', 'Partially Completed': 't-orange', Pending: 't-red', Viewed: 't-purple' };
  const DOCS = App.S.dfDocs = [
    ['PHQ-9', 'Questionnaires', 'p1', '15/09/2026, 9:00 am', '16/09/2026, 2:00 pm', 'patient', 'Completed', 'Staff Sent'],
    ['General Consent Form', 'Consent Forms', 'p3', '10/09/2026, 10:00 am', '', '', 'Sent', 'Staff Sent'],
    ['New Patient Intake Form', 'Documents', null, '', '12/09/2026, 4:30 pm', 'System', 'Completed', 'Website Form', { guest: 'New Patient', email: 'jane.doe@email.com' }],
    ['CBC Blood Report', 'Blood Reports', 'p7', '08/09/2026, 11:00 am', '09/09/2026, 9:15 am', 'patient', 'Partially Completed', 'Email Link'],
    ['Annual Review Form', 'Review Forms', 'p4', '01/09/2026, 8:00 am', '', '', 'Pending', 'Chat Link', { overdue: 7 }],
    ['Lifestyle Questionnaire', 'Questionnaires', 'p1', '20/08/2026, 1:00 pm', '20/08/2026, 1:40 pm', 'patient', 'Viewed', 'Staff Sent'],
    ['Pre-Visit Health Questionnaire', 'Questionnaires', 'p5', '', '14/09/2026, 6:20 pm', 'patient', 'Completed', 'Website Form']
  ].map(([name, cat, pid, sent, upd, by, status, src, x]) => ({ id: uid(), name, cat, pid, sent, upd, by, status, src, ...(x || {}) }));
  const FORMS = App.S.dfForms = [
    ['New Patient Intake Form', 'Registration details, GP and consent', 'p7', 'Patient portal', 'Weightfall - initial assessment', false],
    ['Cardiac Risk Questionnaire', 'Family history, symptoms and risk factors', 'p1', 'Wordpress', '', true],
    ['Informed Consent & HIPAA', 'Consent to treatment and data sharing', 'p3', 'Patient portal', '', false],
    ['Lifestyle Questionnaire', 'Sleep, smoking, alcohol and activity', 'p5', 'Wordpress', '', true],
    ['Medical History Form', 'Conditions, medications and allergies', 'p4', 'Patient portal', 'Annual Check-up', false],
    ['Pre-procedure Checklist', 'Fasting, medication and transport checks', 'p6', 'Patient portal', 'Weight management programme', false],
    ['PHQ-9', 'Depression screening, 9 questions', 'p7', 'Wordpress', 'Weight management programme', true]
  ].map(([name, desc, pid, src, req, json], i) => ({ id: 'f' + (i + 1), name, desc, pid, src, req, json, status: 'Submitted', at: `${16 - i} Sep 2026, 11:00` }));
  const CATS = ['Questionnaires', 'Consent Forms', 'Documents', 'Blood Reports', 'Review Forms'];
  const f = App.ui.df = { q: '', cat: 'All Types', st: 'All Status', src: 'All Sources', fq: '', fsrc: 'All', fcat: 'All', raw: false };

  const head = (tab, title, action = '') => `<div class="pt-bar">${`<div class="pt-seg" role="tablist">${[['docs', `Documents (${DOCS.length})`, '#/documents'], ['forms', `Forms (${FORMS.length})`, '#/documents/forms']].map(([k, t, h]) => `<button role="tab" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}" data-go="${h}">${t}</button>`).join('')}</div>`}</div>
    <div class="pt-bar"><div class="pt-title"><h1>${title}</h1></div><span class="grow"></span>${action}</div>`;
  const plink = (pid, tab = '') => pid ? `<a class="pt-link brand-u" href="#/patients/${pid}${tab}">${esc(PT.name(P(pid)))}</a>` : '';
  const empty = (n, t) => `<tr class="empty-row"><td colspan="${n}">${t} <button class="btn text brand sm" data-act="df-clear">Clear filters</button></td></tr>`;

  /* ---------- Documents ---------- */
  App.route('/documents', () => head('docs', 'Documents', `<button class="btn primary lg" data-act="df-up"><i class="ri-add-circle-line"></i>Upload Document</button>`) + `<section class="card card-pad stack g16">
    <div class="filters">${App.field('Search', `<span class="adorn"><i class="ri-search-line"></i></span><input data-in="df-q" value="${esc(f.q)}" placeholder="Name, document or patient">`, { cls: 'search' })}${App.select('Type', 'df-cat', ['All Types', ...CATS], f.cat)}${App.select('Status', 'df-st', ['All Status', ...Object.keys(ST)], f.st)}${App.select('Source', 'df-src', ['All Sources', 'Staff Sent', 'Website Form', 'Email Link', 'Chat Link'], f.src)}${App.field('Date Range', '<input type="date" aria-label="Sent or updated date">')}<button class="clear-btn" data-act="df-clear"><i class="ri-close-line"></i>Clear filters</button></div>
    <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Document / Form Name</th><th>Category</th><th>Patient Name</th><th>Sent Date &amp; Time</th><th>Last Updated</th><th>Updated By</th><th>Status</th><th>Source</th><th>Actions</th></tr></thead><tbody id="df-rows">${docRows()}</tbody></table></div>${App.pager(DOCS.length, DOCS.length)}</div></section>`, meta);
  function docRows() { const q = f.q.toLowerCase(); const l = DOCS.filter(d => (f.cat === 'All Types' || d.cat === f.cat) && (f.st === 'All Status' || d.status === f.st) && (f.src === 'All Sources' || d.src === f.src) && (!q || (d.name + ' ' + who(d)).toLowerCase().includes(q)));
    if (!l.length) return empty(9, 'No documents match your filters.');
    return l.map(d => { const done = d.status === 'Completed'; return `<tr><td><b class="fw5">${esc(d.name)}</b>${d.pid ? '' : '<small class="cell2"><small>This patient hasn’t joined the EHR yet</small></small>'}</td><td>${chip(d.cat, 't-blue')}</td>
      <td>${d.pid ? plink(d.pid, '/documents') : `<span class="cell2"><span>${esc(d.guest)}</span><small>${esc(d.email)}</small></span>`}</td><td>${d.sent || '—'}</td><td>${d.upd || '—'}${d.overdue ? `<small class="cell2"><small style="color:var(--error)">Overdue, pending ${d.overdue} days</small></small>` : ''}</td>
      <td>${d.by === 'patient' ? esc(who(d)) + ' (Patient)' : esc(d.by || '—')}</td><td>${chip(d.status, ST[d.status])}</td><td>${esc(d.src)}</td>
      <td><span class="row-actions">${done ? `<button class="icon-btn s20" data-act="df-view" data-id="${d.id}" aria-label="View ${esc(d.name)}" title="View"><i class="ri-eye-line"></i></button>` : `<button class="icon-btn s20" data-act="df-remind" data-id="${d.id}" aria-label="Send reminder for ${esc(d.name)}" title="Send reminder"><i class="ri-notification-3-line"></i></button>`}<button class="icon-btn s20" data-act="df-dl" data-id="${d.id}" aria-label="Download ${esc(d.name)}" title="Download"><i class="ri-download-2-line"></i></button><button class="icon-btn s20 danger" data-act="df-del" data-id="${d.id}" aria-label="Delete ${esc(d.name)}" title="Delete"><i class="ri-delete-bin-6-line"></i></button></span>
        ${d.pid ? '' : `<button class="btn outlined sm pt-invite-ehr" data-act="df-invite" data-id="${d.id}">Invite to EHR</button>`}</td></tr>`; }).join(''); }
  const redraw = () => { const t = App.$('#df-rows'); if (!t) return App.render(); t.innerHTML = location.hash.startsWith('#/documents/forms') ? formRows() : docRows(); };
  ins['df-q'] = el => { f.q = el.value; redraw(); };
  chs['df-cat'] = el => { f.cat = el.value; redraw(); }; chs['df-st'] = el => { f.st = el.value; redraw(); }; chs['df-src'] = el => { f.src = el.value; redraw(); };
  acts['df-clear'] = () => { Object.assign(f, { q: '', cat: 'All Types', st: 'All Status', src: 'All Sources', fq: '', fsrc: 'All', fcat: 'All' }); App.render(); };
  const doc = id => DOCS.find(d => d.id === id);
  acts['df-dl'] = el => App.snack(`Downloading “${doc(el.dataset.id).name}”.`, 'info');
  acts['df-remind'] = el => { const d = doc(el.dataset.id); App.snack(`Reminder sent to ${who(d)} to complete “${d.name}”.`); };
  acts['df-view'] = el => { const d = doc(el.dataset.id); const form = FORMS.find(x => x.name === d.name); if (form) return App.go('#/documents/forms/' + form.id);
    App.dialog(PT.modal('', esc(d.name), `${d.cat} · ${esc(who(d))} · updated ${d.upd}`, `<div class="pt-preview"><i class="ri-file-text-line"></i><span class="caption">Preview of ${esc(d.name)}</span></div>`, `<button class="btn outlined lg" data-act="close-modal">Close</button><button class="btn primary lg" data-act="df-dl" data-id="${d.id}"><i class="ri-download-2-line"></i>Download</button>`), { width: 640 }); };
  acts['df-del'] = el => { const d = doc(el.dataset.id); PT.confirmDel('Delete Document', 'Are you sure you want to delete the following document?', 'ri-file-text-line', d.name, `Category: ${d.cat} <span class="sep">|</span> Patient: ${esc(who(d))}`, 'df-del-go', d.id, 'document'); };
  acts['df-del-go'] = el => { const i = DOCS.findIndex(d => d.id === el.dataset.id); const [d] = DOCS.splice(i, 1); App.closeModal(); App.render(); App.snack(`Document deleted successfully\n“${d.name}” has been removed.`, 'success', { label: 'Undo', fn: () => { DOCS.splice(i, 0, d); App.render(); } }); };
  acts['df-invite'] = el => { const d = doc(el.dataset.id); App.ui.ptPrefill = { email: d.email, first: (d.email.split('@')[0].split('.')[0] || '').replace(/^./, c => c.toUpperCase()), last: (d.email.split('@')[0].split('.')[1] || '').replace(/^./, c => c.toUpperCase()) }; App.go('#/patients/new'); App.snack(`We’ve started a patient record from ${d.email}. Check the details, then create and invite.`, 'info'); };
  let upFile = null;
  acts['df-up'] = () => { upFile = null; const pts = App.S.patients;
    App.dialog(PT.modal('ri-file-upload-line', 'Upload Document', '', `<label class="dropzone pt-drop" id="pt-drop"><input type="file" accept=".jpg,.jpeg,.png,.pdf" data-ch="df-file" hidden><i class="ri-upload-cloud-2-line"></i><b>Click to upload or drag and drop</b><span class="caption">JPEG, PNG or PDF, up to 10 MB</span><span class="btn outlined sm pt-dark">Browse File</span></label>
      ${App.field('Patient', `<select name="pid"><option value="">Choose a patient</option>${pts.map(p => `<option value="${p.id}">${esc(PT.name(p))}</option>`).join('')}</select>`, { req: true, cls: 'select' })}${PT.S('Document Category', 'cat', CATS, '', { req: true, ph: 'Choose a category' })}${PT.F('Document Name (Optional)', 'name', '', { ph: 'Uses the file name if left empty' })}`,
      `<button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="df-up-go">Upload</button>`, 'green'), { width: 520 }); };
  chs['df-file'] = el => { const x = el.files[0]; if (!x) return; if (x.size > 10 * 1024 * 1024) { App.snack('That file is over 10 MB. Choose a smaller file.', 'error'); return; } upFile = x.name; const z = App.$('#pt-drop'); z.classList.add('has'); z.classList.remove('err'); z.querySelector('b').textContent = x.name; z.querySelector('.caption').textContent = `${(x.size / 1024).toFixed(0)} KB · ready to upload`; };
  acts['df-up-go'] = () => { const d = PT.formData(); const z = App.$('#pt-drop'); if (!upFile) { z.classList.add('err'); z.querySelector('.caption').textContent = 'Choose a file to upload'; }
    if (!PT.needs(d, ['pid', 'cat']) || !upFile) return; const name = d.name.trim() || upFile; const at = '20/10/2026, ' + new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
    DOCS.unshift({ id: uid(), name, cat: d.cat, pid: d.pid, sent: '', upd: at, by: 'Muhammad Arslan', status: 'Completed', src: 'Staff Upload' });
    const r = PT.rec(P(d.pid)); r.docs.unshift({ id: uid(), name, cat: d.cat, req: '', at, by: 'Me (Muhammad Arslan)' });
    App.closeModal(); App.render(); App.snack(`Document uploaded successfully\n“${name}” has been added to ${PT.name(P(d.pid))}’s documents.`); };

  /* ---------- Forms ---------- */
  App.route('/documents/forms', () => head('forms', 'Forms') + `<section class="card card-pad stack g16">
    <div class="filters">${App.field('Search', `<span class="adorn"><i class="ri-search-line"></i></span><input data-in="df-fq" value="${esc(f.fq)}" placeholder="Search patients or forms">`, { cls: 'search' })}${App.select('Format', 'df-fcat', ['All', 'Standard form', 'JSON submission'], f.fcat)}${App.select('Source', 'df-fsrc', ['All', 'Patient portal', 'Wordpress'], f.fsrc)}${App.select('Status', 'df-fst', ['All', 'Submitted'], 'All')}${App.field('Date', '<input type="date" aria-label="Submitted date">')}<button class="clear-btn" data-act="df-clear"><i class="ri-close-line"></i>Clear filters</button></div>
    <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Form Name</th><th>Patient</th><th>Source</th><th>Status</th><th>Submitted</th><th>Related Request</th><th>Actions</th></tr></thead><tbody id="df-rows">${formRows()}</tbody></table></div>${App.pager(FORMS.length, FORMS.length)}</div></section>`, meta);
  function formRows() { const q = f.fq.toLowerCase(); const l = FORMS.filter(x => (f.fsrc === 'All' || x.src === f.fsrc) && (f.fcat === 'All' || (f.fcat === 'JSON submission') === x.json) && (!q || (x.name + ' ' + PT.name(P(x.pid))).toLowerCase().includes(q)));
    if (!l.length) return empty(7, 'No forms match your filters.');
    return l.map(x => `<tr class="click" data-go="#/documents/forms/${x.id}"><td><span class="cell2"><span class="row g8"><a href="#/documents/forms/${x.id}" class="fw5" style="color:inherit;text-decoration:none">${esc(x.name)}</a>${x.json ? '<span class="df-json">{ } JSON</span>' : ''}</span><small>${esc(x.desc)}</small></span></td><td>${plink(x.pid)}</td><td>${x.src}</td><td>${chip(x.status, x.status === 'Sent' ? 't-blue' : 't-green')}</td><td>${x.at}</td>
      <td>${x.req ? `<a class="pt-link" href="#/patients/${x.pid}/requests">${esc(x.req)}<i class="ri-external-link-line"></i></a>` : '—'}</td><td><span class="row-actions"><button class="icon-btn s20" data-go="#/documents/forms/${x.id}" aria-label="Preview ${esc(x.name)}" title="Preview"><i class="ri-eye-line"></i></button><button class="icon-btn s20" data-act="df-fdl" data-id="${x.id}" aria-label="Download ${esc(x.name)}" title="Download"><i class="ri-download-2-line"></i></button></span></td></tr>`).join(''); }
  ins['df-fq'] = el => { f.fq = el.value; redraw(); }; chs['df-fsrc'] = el => { f.fsrc = el.value; redraw(); }; chs['df-fcat'] = el => { f.fcat = el.value; redraw(); }; chs['df-fst'] = () => redraw();
  acts['df-fdl'] = el => { const x = FORMS.find(y => y.id === el.dataset.id); App.snack(`Downloading “${x.name}” as ${x.json ? 'JSON' : 'PDF'}.`, 'info'); };

  /* ---------- Form preview: readable by default, raw keys on request ---------- */
  const answers = p => { const yn = v => v ? 'Yes' : 'No';
    return [['Patient', [['first_name', p.first], ['last_name', p.last], ['gender', p.gender], ['assigned_sex', p.sex], ['ethnicity', p.eth], ['marketing_optout', yn(false)], ['email', p.email], ['date_of_birth', p.dob], ['send_invitation', yn(p.invite !== 'none')]],
        [['Phone', [['home', '—'], ['mobile', p.phone]]], ['Address', [['street', p.addr], ['city', p.city], ['post_code', p.postcode], ['state', 'England']]], ['GP details', [['consent', yn(true)], ['practice_name', 'Westminster Practice'], ['practice_address', '123 High Street, London, SW1A 1AA'], ['contact_number', '+44 20 7000 0000']]]]],
      ['Vitals', [['entry_date', '2026-09-03'], ['height_cm', p.height], ['weight_kg', p.weight]]],
      ['Lifestyle', [['sleep_information', '7 hours, wakes once'], ['smoking_status', yn(false)], ['alcohol_use', yn(true)], ['mental_health_history', yn(false)], ['compliance_agreement', yn(true)]]],
      ['Reproductive health', [['pregnant_or_breastfeeding', yn(false)]]],
      ['Medical history', [['contraindications', 'None reported'], ['chronic_conditions', 'Type 2 Diabetes, Hypertension'], ['current_medications', 'Metformin 500 mg, Ramipril 5 mg'], ['other_medication_detail', '—']]],
      ['GLP-1 treatment', [['has_used_glp1_or_weightloss_medication', yn(false)], ['selected_medication', 'Semaglutide'], ['dosage_mg', '0.25'], ['treatment_intent', 'Weight management']]]]; };
  const human = k => (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' ').replace(/\bglp1\b/i, 'GLP-1').replace(/\bmg\b/, '(mg)').replace(/\bcm\b/, '(cm)').replace(/\bkg\b/, '(kg)');
  const grid = rows => `<dl class="df-grid">${rows.map(([k, v]) => `<div><dt>${f.raw ? `<code>${k}</code>` : human(k)}</dt><dd class="${v === 'No' || v === '—' ? 'muted' : ''}">${esc(v ?? '—')}</dd></div>`).join('')}</dl>`;
  App.route('/documents/forms/:id', id => { const x = FORMS.find(y => y.id === id); if (!x) return `<section class="soon"><h1 class="soon-h1">Form not found</h1><a class="btn outlined" href="#/documents/forms">Back to Forms</a></section>`; const p = P(x.pid);
    return `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/documents">Documents &amp; Forms</a><span>/</span><a href="#/documents/forms">Forms</a><span>/</span><span class="cur">Form Preview</span></nav>
      <div class="pt-bar"><div class="stack g4"><div class="row g8"><h1 class="pt-h1">Form Preview</h1>${chip('Submitted', 't-green')}</div><span class="caption">${esc(x.name)} <span class="sep">|</span> ${esc(PT.name(p))} <span class="sep">|</span> Submitted on ${x.at} via <b>${x.src}</b></span></div><span class="grow"></span>
        ${App.sw(f.raw, 'data-ch="df-raw"', 'Show field keys')}<span class="caption">Show field keys</span><a class="btn outlined lg" href="#/patients/${p.id}">Open Patient</a><button class="btn primary lg" data-act="df-pdf"><i class="ri-file-pdf-2-line"></i>Export PDF</button></div>
      <section class="card card-pad stack g16">${answers(p).map(([t, rows, subs]) => `<section class="df-sec"><h2>${t}</h2>${grid(rows)}${(subs || []).map(([st, sr]) => `<section class="df-sec sub"><h3>${st}</h3>${grid(sr)}</section>`).join('')}</section>`).join('')}</section>`; }, meta);
  chs['df-raw'] = el => { f.raw = el.checked; const y = scrollY; App.render(); scrollTo(0, y); };
  acts['df-pdf'] = () => App.snack('Exporting the form as PDF.', 'info');
})();

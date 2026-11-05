/* Campaigns: list + tabs, empty state, composer with live preview, schedule, send confirmation, report. */
(function () {
  const { S, esc, acts, ins, chs } = App;
  const ls = App.ui.campList = { tab: 'All', q: '', status: 'All', channel: 'All' };
  const seg = id => S.segments.find(s => s.id === id);
  const reach = s => s ? Math.round(s.contacts * .93) : 0;

  /* ---------- list ---------- */
  App.route('/campaigns', () => list(), { key: 'campaigns', icon: 'ri-send-plane-line', title: 'Campaigns' });
  function list() {
    const head = App.head([['CRM', '#/inbox'], ['Campaigns']], 'Campaigns', 'Send email campaigns to your saved segments and track what they produce.', `<button class="btn primary lg" data-go="#/campaigns/new"><i class="ri-add-circle-line"></i>New campaign</button>`);
    const sent = S.campaigns.filter(c => c.status === 'Sent').length;
    const stats = `<div class="stats"><div class="stat"><span class="overline">Sent this month</span><span class="num tnum">${sent}</span><span class="foot">campaigns</span></div><div class="stat"><span class="overline">Conversions</span><span class="num tnum">${sent ? 96 : 0}</span><span class="foot good">bookings attributed</span></div></div>`;
    if (!S.campaigns.length) return head + stats + `<div class="card" style="flex:1 1 0;display:grid;place-items:center"><div class="empty"><span class="ic"><i class="ri-send-plane-line"></i></span><h2 class="h6">No campaigns yet</h2><p class="body2">Write an email once and send it to a saved segment. Every open, click and booking it produces shows up here.</p><button class="btn primary" data-go="#/campaigns/new"><i class="ri-add-circle-line"></i>New campaign</button></div></div>`;
    const n = s => S.campaigns.filter(c => s === 'All' || c.status === s).length;
    return head + stats + `<section class="card card-pad stack g16">
      <div class="seg" role="tablist" aria-label="Campaign status">${[['All', 'All'], ['Sent', 'Sent'], ['Scheduled', 'Scheduled'], ['Draft', 'Drafts']].map(([k, t]) => `<button role="tab" aria-selected="${ls.tab === k}" class="${ls.tab === k ? 'on' : ''}" data-act="camp-tab" data-v="${k}">${t} <span class="count">${n(k)}</span></button>`).join('')}</div>
      <div class="filters">${App.field('Search', `<span class="adorn"><i class="ri-search-2-line"></i></span><input data-in="camp-q" value="${esc(ls.q)}" placeholder="Search by name…">`, { cls: 'search' })}${App.select('Type', 'camp-type', ['All', 'Customers', 'Leads', 'Mixed'], ls.status)}${App.select('Channel', 'camp-channel', ['All', 'Email', 'WhatsApp', 'SMS'], ls.channel)}${App.field('Date range', `<input placeholder="DD/MM/YYYY – DD/MM/YYYY"><span class="adorn"><i class="ri-calendar-line"></i></span>`)}<button class="clear-btn" data-act="camp-clear"><i class="ri-close-line"></i>Clear filters</button></div>
      <div class="table-card"><div class="table-scroll"><table class="dt"><thead><tr><th>Campaign</th><th>Channel</th><th>Audience</th><th>Type</th><th>Send date</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody id="camp-rows">${rows()}</tbody></table></div>${App.pager(Math.min(10, S.campaigns.length), S.campaigns.length)}</div></section>`;
  }
  function rows() {
    const list = S.campaigns.filter(c => (ls.tab === 'All' || c.status === ls.tab) && (ls.channel === 'All' || c.channel === ls.channel) && (ls.status === 'All' || seg(c.segmentId)?.type === ls.status) && (!ls.q || c.name.toLowerCase().includes(ls.q.toLowerCase())));
    if (!list.length) return `<tr class="empty-row"><td colspan="7">No campaigns match your search or filters.</td></tr>`;
    return list.map(c => { const s = seg(c.segmentId); return `<tr class="click" data-go="#/campaigns/${c.id}"><td><div class="cell2"><a href="#/campaigns/${c.id}" style="color:inherit;text-decoration:none">${esc(c.name)}</a><small>${esc(c.desc)}</small></div></td><td>${App.chip(c.channel, 't-blue', 'sm')}</td><td class="tnum">${s ? App.fmt(s.contacts) : '—'}</td><td>${s ? App.chip(s.type, App.typeTone(s.type), 'sm filled') : '<span class="muted">—</span>'}</td><td>${c.when ? esc(c.when) : '<span class="muted">—</span>'}</td><td>${App.chip(c.status, App.campTone(c.status), 'sm filled')}</td>
      <td style="text-align:right"><span class="row-actions"><button class="icon-btn s20" data-act="camp-edit" data-id="${c.id}" aria-label="${c.status === 'Sent' ? 'View report for' : 'Edit'} ${esc(c.name)}"><i class="${c.status === 'Sent' ? 'ri-bar-chart-2-line' : 'ri-pencil-line'}"></i></button><button class="icon-btn s20 danger" data-act="camp-del" data-id="${c.id}" aria-label="Delete ${esc(c.name)}"><i class="ri-delete-bin-line"></i></button></span></td></tr>`; }).join('');
  }
  const redraw = () => { App.$('#camp-rows').innerHTML = rows(); };
  acts['camp-tab'] = el => { ls.tab = el.dataset.v; App.$$('[data-act=camp-tab]').forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-selected', b === el); }); redraw(); };
  ins['camp-q'] = el => { ls.q = el.value; redraw(); }; chs['camp-type'] = el => { ls.status = el.value; redraw(); }; chs['camp-channel'] = el => { ls.channel = el.value; redraw(); };
  acts['camp-clear'] = () => { Object.assign(ls, { tab: 'All', q: '', status: 'All', channel: 'All' }); App.render(); };
  acts['camp-edit'] = el => App.go('#/campaigns/' + el.dataset.id);
  acts['camp-del'] = el => { const c = S.campaigns.find(x => x.id === el.dataset.id);
    App.dialog(`${App.dlgHead('Delete campaign', '', 'ri-delete-bin-line')}<div class="dlg-body"><p class="body2 muted" style="margin:0">Delete “${esc(c.name)}”? ${c.status === 'Sent' ? 'Its report will be removed too.' : c.status === 'Scheduled' ? 'It will not be sent.' : ''} This can’t be undone.</p></div><div class="dlg-foot"><button class="btn outlined" data-act="close-modal">Cancel</button><button class="btn danger" data-act="camp-del-go" data-id="${c.id}">Delete</button></div>`, { width: 460 }); };
  acts['camp-del-go'] = el => { const i = S.campaigns.findIndex(x => x.id === el.dataset.id); const [c] = S.campaigns.splice(i, 1); App.closeModal(); App.go('#/campaigns'); App.snack(`Campaign “${c.name}” deleted.`); };

  /* ---------- composer ---------- */
  let d = null;
  App.route('/campaigns/new', () => { const sid = App.ui.newCampaignSeg || ''; App.ui.newCampaignSeg = null;
    d = { id: null, name: '', segmentId: sid, channel: 'Email', subject: '', body: 'Hi {{first_name}},\n\n', autoResend: true, tried: false, view: 'Desktop' }; return composer(); }, { key: 'campaigns', icon: 'ri-send-plane-line', title: 'Campaigns' });
  App.route('/campaigns/:id', id => { const c = S.campaigns.find(x => x.id === id); if (!c) return `<div class="card"><div class="empty"><h2 class="h6">Campaign not found</h2><button class="btn outlined" data-go="#/campaigns">Back to campaigns</button></div></div>`;
    if (c.status === 'Sent') return report(c);
    d = { id: c.id, name: c.name, segmentId: c.segmentId, channel: c.channel, subject: c.subject || '', body: c.body || `Hi {{first_name}},\n\nIt’s been a few months since your last weight-loss review. Book this month and we’ll take 15% off your consultation.\n\n[ Book your review ]\n\nSee you soon,\nThe LeafEase team`, autoResend: true, tried: false, view: 'Desktop' };
    return composer(); }, { key: 'campaigns', icon: 'ri-send-plane-line', title: 'Campaigns' });

  const missing = () => { const m = []; if (!d.name.trim()) m.push('name'); if (!d.segmentId) m.push('segment'); if (d.channel === 'Email' && !d.subject.trim()) m.push('subject'); if (d.body.replace(/Hi \{\{first_name\}\},/, '').trim().length < 10) m.push('body'); return m; };
  const err = k => d.tried && missing().includes(k);
  function composer() {
    const existing = S.campaigns.find(c => c.id === d.id);
    return `${App.head([['CRM', '#/inbox'], ['Campaigns', '#/campaigns'], [existing ? d.name : 'New campaign']], existing ? d.name : 'New campaign', 'Compose an email and send it to a saved segment. Everything is previewed on the right.',
      `<button class="btn outlined lg" data-act="camp-save"><i class="ri-save-3-line"></i>Save draft</button><button class="btn outlined lg" data-act="camp-schedule"><i class="ri-calendar-line"></i>${existing?.status === 'Scheduled' ? 'Reschedule' : 'Schedule'}</button><button class="btn primary lg" data-act="camp-send"><i class="ri-send-plane-2-line"></i>Send campaign</button>`,
      App.chip(existing?.status === 'Scheduled' ? 'Scheduled · ' + existing.when : 'Draft', existing?.status === 'Scheduled' ? 't-blue' : 't-grey', 'filled'))}
    <div class="composer-grid"><section class="card" aria-label="Compose"><div class="card-head"><h2 class="sub2" style="font-size:16px">Compose</h2><div class="row g8"><span class="caption">Channel</span><div class="seg sm grey" role="tablist">${['Email', 'WhatsApp', 'SMS'].map(c => `<button role="tab" aria-selected="${d.channel === c}" class="${d.channel === c ? 'on' : ''}" data-act="camp-channel" data-v="${c}">${c}</button>`).join('')}</div></div></div>
      <div class="card-pad stack g16" id="comp-body">${compBody()}</div></section>
      <aside class="card" style="position:sticky;top:111px" aria-label="Preview"><div class="card-head"><h2 class="sub2" style="font-size:16px">${d.channel === 'Email' ? 'Email' : d.channel} preview</h2><div class="seg sm grey">${['Desktop', 'Mobile'].map(v => `<button class="${d.view === v ? 'on' : ''}" data-act="camp-view" data-v="${v}" aria-pressed="${d.view === v}">${v}</button>`).join('')}</div></div><div class="card-pad" id="preview">${previewHTML()}</div></aside></div>`;
  }
  const compBody = () => { const s = seg(d.segmentId); return `
    <div class="row g16 wrap"><div class="stack g4 grow" style="min-width:220px">${App.field('Campaign name', `<input data-in="camp-name" value="${esc(d.name)}" placeholder="e.g. Weight-loss winback">`, { req: true, cls: err('name') ? 'err' : '' })}${err('name') ? '<p class="helper err">Give the campaign a name</p>' : ''}</div>
      <div class="grow" style="min-width:220px">${App.field('From', `<input value="LeafEase Clinic <info@leafease.co.uk>" disabled>`, { cls: 'dis' })}</div></div>
    <div class="stack g4">${App.select('Audience', 'camp-seg', [{ v: '', t: 'Select a segment' }, ...S.segments.map(s => ({ v: s.id, t: `${s.name} · ${App.fmt(s.contacts)} contacts` }))], d.segmentId, { cls: err('segment') ? 'err' : '' })}${err('segment') ? '<p class="helper err">Choose who this goes to</p>' : s ? `<p class="helper">${App.fmt(reach(s))} of ${App.fmt(s.contacts)} can be emailed · <a href="#/segments/${s.id}">View segment</a></p>` : ''}</div>
    ${d.channel !== 'Email' ? `<div class="al info"><i class="ri-information-line"></i><div class="txt">${d.channel} campaigns aren’t enabled for this practice yet. You can draft the message, but only email can be sent.</div></div>` : ''}
    <div class="fblock"><div class="tpl-cta"><div><b style="font-weight:500;font-size:16px">Use ${d.channel === 'Email' ? 'Email' : 'Message'} Template</b><p class="body2 muted" style="margin:0">Browse categorised templates and instantly apply them.</p></div><button class="btn primary" data-act="camp-tpl">Browse Templates</button></div>
      ${d.channel === 'Email' ? `<div class="stack g4">${App.field('Subject line', `<input data-in="camp-subject" value="${esc(d.subject)}" placeholder="e.g. We miss you — 15% off your next review">`, { req: true, cls: err('subject') ? 'err' : '' })}${err('subject') ? '<p class="helper err">Add a subject line</p>' : ''}</div>` : ''}
      <div class="stack g8"><h3 class="sub2" style="font-size:16px">${d.channel === 'Email' ? 'Email body' : 'Message'}</h3>
      <div class="rte ${err('body') ? 'err' : ''}" ${err('body') ? 'style="border-color:var(--error)"' : ''}><div class="bar-tools" role="toolbar" aria-label="Formatting">${[['bold', 'Bold'], ['italic', 'Italic'], ['underline', 'Underline'], ['strikethrough', 'Strikethrough'], ['link', 'Link']].map(([i, l]) => `<button class="icon-btn" data-act="rte" data-w="${i}" aria-label="${l}"><i class="ri-${i}"></i></button>`).join('')}<span style="width:8px"></span>${['align-left', 'align-center', 'list-unordered', 'list-ordered'].map(i => `<button class="icon-btn" data-act="rte" data-w="${i}" aria-label="${i.replace('-', ' ')}"><i class="ri-${i}"></i></button>`).join('')}<span class="grow"></span><button class="btn text brand sm" data-act="camp-ph" data-menu-anchor aria-haspopup="menu"><i class="ri-add-circle-line"></i>Insert Placeholder</button><button class="ai-btn" data-act="camp-ai"><i class="ri-sparkling-line"></i>Ask AI</button></div>
      <textarea id="camp-body" data-in="camp-body" aria-label="${d.channel === 'Email' ? 'Email body' : 'Message'}">${esc(d.body)}</textarea></div>
      <p class="caption" style="margin:0 14px" id="char">${err('body') ? '<span style="color:var(--error)">Write the message before sending</span>' : `Character limit: ${d.body.length} / 1000`}</p></div></div>
    <div class="toggle-card"><div><b>Auto-resend to non-openers</b><span class="caption">Resends once with a new subject line after 3 days</span></div>${App.sw(d.autoResend, 'data-ch="camp-resend"', 'Auto-resend to non-openers')}</div>`; };
  const fill = t => esc(t).replace(/\{\{(\w+)\}\}/g, (m, k) => `<span class="ph">{${k}}</span>`).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[ (.+?) \]/g, '<a href="#" onclick="return false" style="display:inline-block;background:var(--primary);color:#fff;text-decoration:none;padding:6px 16px;border-radius:999px;font-weight:500">$1</a>');
  function previewHTML() {
    const s = seg(d.segmentId);
    if (d.channel !== 'Email') return `<div class="preview-mail ${d.view === 'Mobile' ? 'mobile' : ''}"><div class="msg out" style="max-width:100%"><div class="bubble">${fill(d.body || 'Your message will appear here.')}</div><small>${d.channel} · to ${s ? App.fmt(s.contacts) : 0} contacts</small></div></div>`;
    return `<div class="preview-mail ${d.view === 'Mobile' ? 'mobile' : ''}"><div class="env">From: <b>LeafEase Clinic</b><br>To: <b>sarah.whitmore@example.com</b>${s ? ` <span class="caption">and ${App.fmt(reach(s) - 1)} others</span>` : ''}</div>
      <div class="body2">Subject: <b style="font-weight:500">${esc(d.subject) || '<span class="muted">No subject yet</span>'}</b></div>
      <div class="bodytxt">${fill(d.body) || '<span class="muted">Your email will appear here.</span>'}</div>
      <div class="env">Thank you,<br>LeafEase Clinic<div style="font-size:26px;font-weight:500;letter-spacing:-1px;margin-top:6px"><b style="font-weight:500">Leaf</b><span style="color:#BDB46E">Ease</span> <i class="ri-leaf-line"></i></div><span class="caption">You’re receiving this because you’re a LeafEase patient. <u>Unsubscribe</u></span></div></div>`;
  }
  const refreshPreview = () => { App.$('#preview').innerHTML = previewHTML(); const ch = App.$('#char'); if (ch && !err('body')) ch.textContent = `Character limit: ${d.body.length} / 1000`; };
  ins['camp-name'] = el => { d.name = el.value; }; ins['camp-subject'] = el => { d.subject = el.value; refreshPreview(); };
  ins['camp-body'] = el => { d.body = el.value; refreshPreview(); };
  chs['camp-seg'] = el => { d.segmentId = el.value; App.$('#comp-body').innerHTML = compBody(); refreshPreview(); };
  chs['camp-resend'] = el => { d.autoResend = el.checked; };
  acts['camp-channel'] = el => { d.channel = el.dataset.v; App.render(); };
  acts['camp-view'] = el => { d.view = el.dataset.v; App.$$('[data-act=camp-view]').forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); }); refreshPreview(); };
  const insertAt = txt => { const ta = App.$('#camp-body'); const a = ta.selectionStart, b = ta.selectionEnd; ta.value = ta.value.slice(0, a) + txt + ta.value.slice(b); ta.selectionStart = ta.selectionEnd = a + txt.length; ta.focus(); d.body = ta.value; refreshPreview(); };
  acts.rte = el => { const ta = App.$('#camp-body'); const a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.slice(a, b);
    const w = el.dataset.w; if (w === 'bold') insertAt(`**${sel || 'bold text'}**`); else if (w === 'link') insertAt(`[ ${sel || 'Book your review'} ]`); else if (w === 'list-unordered') insertAt('\n• '); else if (w === 'list-ordered') insertAt('\n1. '); else App.snack('That formatting option is shown for the design only.', 'info'); };
  acts['camp-ph'] = el => App.menu(el, ['first_name', 'last_name', 'clinic_name', 'booking_link', 'last_service'].map(p => `<button data-pick="${p}"><i class="ri-braces-line"></i>{{${p}}}</button>`).join(''), v => insertAt(`{{${v}}}`), { width: 240 });
  acts['camp-ai'] = () => { d.subject = d.subject || 'We miss you — 15% off your next review'; d.body = `Hi {{first_name}},\n\nIt’s been a few months since your last weight-loss review. Book this month and we’ll take 15% off your consultation.\n\n[ Book your review ]\n\nSee you soon,\nThe LeafEase team`; App.$('#comp-body').innerHTML = compBody(); refreshPreview(); App.snack('Draft written by AI. Check it before sending.', 'info'); };
  acts['camp-tpl'] = () => App.openTemplates(t => { d.subject = d.subject || t.title; d.body = `Hi {{first_name}},\n\n${t.body.replace(/\{(\w+)\}/g, '{{$1}}')}\n\nThe LeafEase team`; App.$('#comp-body').innerHTML = compBody(); refreshPreview(); App.snack(`Template “${t.title}” applied.`, 'info'); });
  const persist = (status, when) => {
    const payload = { name: d.name.trim() || 'Untitled campaign', segmentId: d.segmentId, channel: d.channel, subject: d.subject, body: d.body, status, when: when || null, desc: seg(d.segmentId) ? 'Sent to “' + seg(d.segmentId).name + '”' : 'No audience chosen yet' };
    let c = S.campaigns.find(x => x.id === d.id);
    if (c) Object.assign(c, payload); else { c = Object.assign({ id: 'k' + Date.now() }, payload); S.campaigns.unshift(c); d.id = c.id; }
    return c; };
  const guard = () => { if (!missing().length) return true; d.tried = true; App.$('#comp-body').innerHTML = compBody(); App.snack('Please fix the highlighted fields before sending.', 'error'); App.$('#comp-body .err input, #comp-body .err select')?.focus(); return false; };
  acts['camp-save'] = () => { persist('Draft'); App.go('#/campaigns'); App.snack('Draft saved.'); };

  /* schedule */
  const tmr = new Date(Date.now() + 864e5); const sc = { mode: 'later', y: tmr.getFullYear(), m: tmr.getMonth(), day: tmr.getDate(), time: '10:00', tz: 'Europe/London (BST, UTC+1)' };
  acts['camp-schedule'] = () => { if (!guard()) return; drawSchedule(); };
  function drawSchedule() {
    const s = seg(d.segmentId); const first = new Date(sc.y, sc.m, 1); const days = new Date(sc.y, sc.m + 1, 0).getDate(); const lead = (first.getDay() + 6) % 7;
    const today = new Date(); today.setHours(0, 0, 0, 0); const mName = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const cells = Array(lead).fill('<span></span>').concat(Array.from({ length: days }, (_, i) => { const dt = new Date(sc.y, sc.m, i + 1); const past = dt < today; return `<button ${past ? 'disabled' : ''} class="${i + 1 === sc.day ? 'on' : ''}" data-act="cal-day" data-d="${i + 1}" aria-label="${dt.toDateString()}" aria-pressed="${i + 1 === sc.day}">${i + 1}</button>`; })).join('');
    const dateLabel = new Date(sc.y, sc.m, sc.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    App.dialog(`${App.dlgHead('Schedule campaign', `Choose when “${esc(d.name)}” is sent`)}<div class="dlg-body">
      <div class="seg grey" style="align-self:flex-start">${[['now', 'Send now'], ['later', 'Schedule for later']].map(([k, t]) => `<button class="${sc.mode === k ? 'on' : ''}" data-act="sc-mode" data-v="${k}" aria-pressed="${sc.mode === k}">${t}</button>`).join('')}</div>
      ${sc.mode === 'later' ? `<div class="row g16">${App.field('Date', `<input value="${dateLabel}" readonly aria-label="Date"><span class="adorn"><i class="ri-calendar-line"></i></span>`, { cls: 'grow sm' })}${App.field('Time', `<input type="time" data-in="sc-time" value="${sc.time}" aria-label="Time">`, { cls: 'grow sm' })}</div>
      <div class="cal"><div class="row between" style="margin-bottom:8px"><button class="icon-btn s20" data-act="cal-nav" data-v="-1" aria-label="Previous month"><i class="ri-arrow-left-s-line"></i></button><b style="font-weight:500">${mName}</b><button class="icon-btn s20" data-act="cal-nav" data-v="1" aria-label="Next month"><i class="ri-arrow-right-s-line"></i></button></div><div class="cal-grid">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(x => `<span>${x}</span>`).join('')}${cells}</div></div>
      ${App.select('Time zone', 'sc-tz', ['Europe/London (BST, UTC+1)', 'Europe/Dublin (IST, UTC+1)', 'UTC'], sc.tz, { cls: 'sm' })}` : `<div class="al info"><i class="ri-information-line"></i><div class="txt">It will start delivering within a minute of you confirming.</div></div>`}</div>
      <div class="dlg-foot"><span class="note">${App.fmt(reach(s))} recipients · ${esc(s.name)}</span><button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="sc-go"><i class="${sc.mode === 'later' ? 'ri-calendar-check-line' : 'ri-send-plane-2-line'}"></i>${sc.mode === 'later' ? 'Schedule' : 'Continue'}</button></div>`, { width: 480 });
  }
  acts['sc-mode'] = el => { sc.mode = el.dataset.v; drawSchedule(); };
  acts['cal-day'] = el => { sc.day = +el.dataset.d; drawSchedule(); };
  acts['cal-nav'] = el => { sc.m += +el.dataset.v; if (sc.m < 0) { sc.m = 11; sc.y--; } if (sc.m > 11) { sc.m = 0; sc.y++; } sc.day = Math.min(sc.day, new Date(sc.y, sc.m + 1, 0).getDate()); drawSchedule(); };
  ins['sc-time'] = el => { sc.time = el.value; }; chs['sc-tz'] = el => { sc.tz = el.value; };
  acts['sc-go'] = () => { if (sc.mode === 'now') { drawSend(); return; }
    const when = `${sc.day}/${sc.m + 1}/${sc.y} · ${sc.time}`; persist('Scheduled', when); App.closeModal(); App.go('#/campaigns'); App.snack(`“${d.name}” scheduled for ${when}.`); };

  /* send */
  acts['camp-send'] = () => { if (!guard()) return; drawSend(); };
  function drawSend() { const s = seg(d.segmentId); const r = reach(s); const skip = s.contacts - r;
    App.dialog(`${App.dlgHead('Send this campaign now?', 'It will start delivering within a minute')}<div class="dlg-body">
      <div class="kv"><div><span>Campaign</span><b>${esc(d.name)}</b></div><div><span>Audience</span><b>${esc(s.name)}</b></div><div><span>Recipients</span><b>${App.fmt(r)} of ${App.fmt(s.contacts)} (${skip} not opted in)</b></div><div><span>From</span><b>info@leafease.co.uk</b></div><div><span>Subject</span><b>${esc(d.subject)}</b></div></div>
      <div class="checks"><div><i class="ri-check-line"></i>Subject line and preview text set</div><div><i class="ri-check-line"></i>Test email sent to you 4 minutes ago</div><div><i class="ri-check-line"></i>Unsubscribe link included</div>${skip ? `<div class="warn"><i class="ri-error-warning-line"></i>${skip} recipients have no email consent and will be skipped</div>` : ''}</div></div>
      <div class="dlg-foot"><button class="btn outlined lg" data-act="close-modal">Back to edit</button><button class="btn primary lg" data-act="send-go"><i class="ri-send-plane-2-line"></i>Send to ${App.fmt(r)}</button></div>`, { width: 460 }); }
  acts['send-go'] = () => { const c = persist('Sent', 'Just now'); c.sentBy = 'Muhammad Arslan'; c.fresh = true; App.closeModal(); App.go('#/campaigns/' + c.id); App.snack(`“${c.name}” is sending to ${App.fmt(reach(seg(c.segmentId)))} recipients.`); };

  /* ---------- report ---------- */
  function report(c) {
    const s = seg(c.segmentId); const total = s ? s.contacts : 342; const del = Math.round(total * .982), op = Math.round(del * .56), cl = Math.round(op * .32), bk = Math.round(cl * .23), un = Math.max(1, Math.round(total * .009));
    const opens = [140, 72, 30, 18, 12, 8, 6, 4, 4, 3, 3, 2, 2, 2], clicks = [60, 20, 8, 5, 4, 2, 2, 1, 1, 1, 1, 0, 0, 0]; const max = 140;
    const recips = [['Sarah Whitmore', '09:01', '09:14', '09:15', 'Booked · 18 Jul', 't-green', 'solid'], ['James O’Connor', '09:01', '10:02', '—', 'Opened', 't-blue', 'solid'], ['Tom Bennett', '09:01', '08:20 +1d', '08:22 +1d', 'Clicked', 't-blue', 'solid'], ['Hannah Wells', '09:01', '—', '—', 'No open', 't-grey', 'filled'], ['Owen Price', 'Bounced', '—', '—', 'Hard bounce', 't-red', 'solid']];
    return `${App.head([['CRM', '#/inbox'], ['Campaigns', '#/campaigns'], [c.name]], c.name, `Sent ${esc(c.when)} to “${esc(s ? s.name : 'deleted segment')}” · ${App.fmt(total)} recipients · by ${esc(c.sentBy || 'Omar Haddad')}`,
      `<button class="btn outlined lg" data-act="camp-dup" data-id="${c.id}"><i class="ri-file-copy-line"></i>Duplicate</button><button class="btn outlined lg" data-act="seg-export"><i class="ri-download-2-line"></i>Export</button><button class="btn primary lg" data-act="camp-resend-now" data-n="${del - op}"><i class="ri-refresh-line"></i>Resend to non-openers</button>`, App.chip('Sent', 't-green', 'solid'))}
    ${c.fresh ? `<div class="al info" role="status"><i class="ri-information-line"></i><div class="txt">Delivery has started. These figures are a preview of how the report fills in as recipients open and click.</div></div>` : ''}
    <div class="stats">${[['Delivered', del, (del / total * 100).toFixed(1) + '% of ' + App.fmt(total), ''], ['Opened', op, '56% open rate', 'good'], ['Clicked', cl, '18% click rate', 'good'], ['Booked', bk, '4.2% conversion', 'good'], ['Unsubscribed', un, '0.9%', 'warn']].map(([k, v, f, t]) => `<div class="stat"><span class="overline">${k}</span><span class="num tnum">${App.fmt(v)}</span><span class="foot ${t}">${f}</span></div>`).join('')}</div>
    <div class="profile"><section class="card"><div class="card-head"><h2 class="sub2" style="font-size:16px">Opens &amp; clicks since send</h2><div class="legend"><span><i style="background:#4FB5B6"></i>Opens</span><span><i style="background:var(--primary-dark)"></i>Clicks</span></div></div>
      <div class="chart" role="img" aria-label="Opens peaked on day 0 with 140 and clicks with 60, then fell over 13 days">${opens.map((o, i) => `<div class="col"><div class="bars"><span style="height:${o / max * 100}%" title="${o} opens"></span><span class="c" style="height:${clicks[i] / max * 100}%" title="${clicks[i]} clicks"></span></div><small>D${i}</small></div>`).join('')}</div><div style="height:16px"></div></section>
      <section class="card"><div class="card-head"><h2 class="sub2" style="font-size:16px">Links clicked</h2>${App.chip(cl + ' clicks')}</div><div class="card-pad stack g16">${[['Book your review (CTA)', .62], ['leafease.co.uk/weight-loss', .23], ['Unsubscribe', .1], ['leafease.co.uk/contact', .05]].map(([l, p]) => `<div class="linkrow"><div class="row"><span>${l}</span><span class="caption">${Math.round(cl * p)} · ${Math.round(p * 100)}%</span></div><div class="bar"><span style="width:${p * 100}%"></span></div></div>`).join('')}</div></section></div>
    <section class="card"><div class="card-head"><h2 class="sub2" style="font-size:16px">Recipient activity</h2><button class="btn outlined sm" data-act="seg-from-openers" data-id="${c.id}" data-n="${op}"><i class="ri-group-line"></i>Create segment from openers</button></div>
      <div class="table-scroll"><table class="dt"><thead><tr><th>Recipient</th><th>Delivered</th><th>Opened</th><th>Clicked</th><th>Outcome</th><th></th></tr></thead><tbody>${recips.map(r => `<tr><td><span class="person"><span class="av sm">${App.initials(r[0])}</span>${r[0]}</span></td><td ${r[1] === 'Bounced' ? 'style="color:var(--error)"' : ''}>${r[1] === 'Bounced' ? 'Bounced' : 'Today ' + r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${App.chip(r[4], r[5], r[6] + ' sm')}</td><td style="text-align:right"><button class="btn outlined sm" data-act="open-profile" data-n="${r[0]}">Open profile</button></td></tr>`).join('')}</tbody></table></div></section>`;
  }
  acts['camp-dup'] = el => { const c = S.campaigns.find(x => x.id === el.dataset.id); const copy = Object.assign({}, c, { id: 'k' + Date.now(), name: c.name + ' (copy)', status: 'Draft', when: null, fresh: false }); S.campaigns.unshift(copy); App.go('#/campaigns/' + copy.id); App.snack('Campaign duplicated as a draft.'); };
  acts['camp-resend-now'] = el => App.dialog(`${App.dlgHead('Resend to non-openers?', `${el.dataset.n} people didn’t open the first email`)}<div class="dlg-body"><p class="body2 muted" style="margin:0">They’ll get the same email with a new subject line, starting within a minute. People who opened won’t receive it again.</p></div><div class="dlg-foot"><button class="btn outlined" data-act="close-modal">Cancel</button><button class="btn primary" data-act="resend-go" data-n="${el.dataset.n}"><i class="ri-refresh-line"></i>Resend to ${el.dataset.n}</button></div>`, { width: 460 });
  acts['resend-go'] = el => { App.closeModal(); App.snack(`Resending to ${el.dataset.n} non-openers.`); };
  acts['seg-from-openers'] = el => { const c = S.campaigns.find(x => x.id === el.dataset.id); const n = +el.dataset.n; const id = 's' + Date.now();
    S.segments.unshift({ id, name: `Opened “${c.name}”`, type: 'Customers', contacts: n, customers: n, leads: 0, lastUsed: 'Never', created: 'today', by: 'Muhammad Arslan', used: [], filters: Object.assign({}, seg(c.segmentId)?.filters || { audience: 'Customers', location: 'All locations', site: 'All sites', gender: 'Any', ageMin: 0, ageMax: 100, window: '—', since: 'Any time', services: [] }) });
    App.go('#/segments/' + id); App.snack(`Segment created with ${n} openers.`); };
  acts['open-profile'] = el => { const l = S.leads.find(l => l.name === el.dataset.n); App.go(l ? '#/leads/' + l.id : '#/leads'); if (!l) App.snack(`${el.dataset.n} is a patient, not a lead. Patient records are outside this prototype.`, 'info'); };
})();

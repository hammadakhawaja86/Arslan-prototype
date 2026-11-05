/* HRM › Recruitment: shared helpers, module frame, multi-selects, stars, AI panel, recruitment + schedule-interview modals. */
(function () {
  const { S, esc, acts, ins, chs } = App;
  Object.assign(S, window.HRM_SEED());
  const H = App.H = { today: '2026-10-08', ms: {}, stars: {} };
  H.meta = { key: 'hrm', icon: 'ri-briefcase-4-line', title: 'Recruitment' };
  H.route = (p, fn) => App.route(p, fn, H.meta);

  /* ---------- lookups ---------- */
  H.cand = id => S.candidates.find(c => c.id === id);
  H.rec = id => S.recruitments.find(r => r.id === id);
  H.staff = id => S.staff.find(s => s.id === id) || { id, name: id, role: '' };
  H.name = c => `${c.first} ${c.last}`.trim();
  H.ini = c => ((c.first || '?')[0] + (c.last || '')[0] || '').toUpperCase();
  H.stage = id => id === 'unassigned' ? { id, name: 'Unassigned', type: 'Fixed', managers: [] } : (S.stages.find(s => s.id === id) || { id, name: id, managers: [] });
  H.stageIdx = id => S.stages.findIndex(s => s.id === id);
  H.nextStage = id => { const i = H.stageIdx(id); return id === 'unassigned' ? S.stages[0] : S.stages[i + 1]; };
  H.active = () => S.candidates.filter(c => c.status === 'progress' && c.active !== false);
  H.inRec = rid => S.candidates.filter(c => c.rid === rid && c.status === 'progress');
  H.TONE = { Initial: 't-blue', Interview: 't-teal', Test: 't-orange', Hired: 't-green', Cancelled: 't-red', Fixed: 't-grey' };
  H.AVT = ['t-purple', 't-blue', 't-teal', 't-orange', 't-green', 't-red'];
  H.avTone = s => H.AVT[[...s].reduce((a, ch) => a + ch.charCodeAt(0), 0) % H.AVT.length];

  /* ---------- dates (demo today = Thu 08 Oct 2026) ---------- */
  H.d = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  H.iso = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  H.dayName = iso => { if (iso === H.today) return 'Today'; const dt = H.d(iso); return dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).replace(',', ''); };
  H.when = i => `${H.dayName(i.day)} · ${i.time}`;
  H.addMin = (t, m) => { const [h, mm] = t.split(':').map(Number); const x = h * 60 + mm + m; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
  H.weekdays = (fromIso, n) => { const out = []; const dt = H.d(fromIso); while (out.length < n) { dt.setDate(dt.getDate() + 1); if (dt.getDay() % 6) out.push(H.iso(dt)); } return out; };

  /* ---------- bits ---------- */
  H.av = (txt, cls = '') => `<span class="av ${cls} ${H.avTone(txt)}">${esc(txt)}</span>`;
  H.cav = (c, cls = '') => H.av(H.ini(c), cls);
  H.avs = ids => `<span class="avs">${ids.map(id => `<span class="av sm ${H.avTone(id)}" title="${esc(H.staff(id).name)}">${id.toUpperCase()}</span>`).join('')}</span>`;
  H.starsHTML = (n, size = '') => `<span class="stars ${size}" aria-label="${n} of 5 stars">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'ri-star-fill' : 'ri-star-fill off'}"></i>`).join('')}</span>`;
  H.starsEdit = (name, v) => { H.stars[name] = v; return `<span class="stars edit" id="st-${name}" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="${i <= v ? '' : 'off'}" data-act="star" data-name="${name}" data-v="${i}" aria-label="${i} star${i > 1 ? 's' : ''}"><i class="ri-star-fill"></i></button>`).join('')}</span>`; };
  acts.star = el => { const n = el.dataset.name; const v = H.stars[n] === +el.dataset.v ? 0 : +el.dataset.v; App.$('#st-' + n).outerHTML = H.starsEdit(n, v); H.onStar && H.onStar(n, v); };
  H.STATUS = { progress: ['In progress', 't-blue', 'ri-information-line'], hired: ['Hired', 't-green', 'ri-checkbox-circle-line'], cancelled: ['Cancelled', 't-red', 'ri-close-circle-line'], pool: ['Talent Pool', 't-teal', 'ri-heart-3-line'], archived: ['Archived', 't-grey', 'ri-archive-line'] };
  H.statusChip = c => { const [t, tone, ic] = H.STATUS[c.status] || H.STATUS.progress; return `<span class="chip filled sm ${tone}"><i class="${ic}"></i>${t}</span>`; };
  H.stageChip = id => { const s = H.stage(id); return `<span class="chip sm stage-chip"><span class="dot ${H.TONE[s.type] || 't-grey'}"></span>${esc(s.name)}</span>`; };
  H.typeChip = t => `<span class="chip sm filled ${H.TONE[t] || 't-grey'}"><span class="dot ${H.TONE[t]}"></span>${esc(t)}</span>`;
  H.prog = (a, b) => `<span class="prog"><span style="width:${b ? Math.min(100, a / b * 100) : 0}%"></span></span>`;
  H.aiIcon = '<i class="ri-sparkling-2-line"></i>';

  /* ---------- module frame: crumbs + module tabs + white page card ---------- */
  const TABS = [['dashboard', 'Dashboard', 'ri-dashboard-line'], ['pipeline', 'Pipeline', 'ri-node-tree'], ['careers', 'Career page', 'ri-global-line'], ['candidates', 'Candidates', 'ri-team-line'], ['interviews', 'Interviews', 'ri-calendar-event-line'], ['requisitions', 'Requisitions', 'ri-file-list-2-line'], ['recruitments', 'Recruitments', 'ri-briefcase-4-line'], ['talent-pool', 'Talent pool', 'ri-heart-3-line'], ['config', 'Configuration', 'ri-settings-3-line'], ['org-chart', 'Org chart', 'ri-organization-chart'], ['guide', 'Guide', 'ri-question-line'], ['cv', 'CV pool', 'ri-file-list-3-line', true]];
  /* tabs scroll inside their row; fade the clipped edge and keep the active tab visible */
  const tabsFade = el => { el.classList.toggle('fade-l', el.scrollLeft > 2); el.classList.toggle('fade-r', el.scrollLeft + el.clientWidth < el.scrollWidth - 2); };
  const tabsFit = () => { const el = App.$('.mtabs'); if (!el) return; const on = el.querySelector('a.on');
    if (on) el.scrollLeft = Math.max(0, on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2);
    tabsFade(el); el.onscroll = () => tabsFade(el); };
  addEventListener('resize', () => { const el = App.$('.mtabs'); el && tabsFade(el); });
  H.frame = ({ tab, crumb, primary = '', title, sub = '', actions = '', body, bare = false }) => {
    const label = TABS.find(t => t[0] === tab)[1];
    App.after(tabsFit);
    return `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/hrm/dashboard">HRM</a><span>/</span><a href="#/hrm/dashboard">Recruitment</a><span>/</span>${crumb ? `<a href="#/hrm/${tab === 'config' ? 'config/stages' : tab === 'cv' ? 'cv-pool' : tab}">${label}</a><span>/</span><span class="cur">${esc(crumb)}</span>` : `<span class="cur">${label}</span>`}</nav>
    <div class="tabrow"><nav class="mtabs" aria-label="Recruitment sections">${TABS.filter(x => !x[3] || x[0] === tab).map(([k, t, i]) => `<a href="#/hrm/${k === 'config' ? 'config/stages' : k === 'cv' ? 'cv-pool' : k}" class="${tab === k ? 'on' : ''}" ${tab === k ? 'aria-current="page"' : ''}><i class="${i}"></i>${t}</a>`).join('')}</nav>${primary}</div>
    ${bare ? body : `<section class="hcard">${title ? `<div class="hhead"><div class="stack g4"><h1 class="h6 hh1">${esc(title)}</h1>${sub ? `<p class="body2 muted" style="margin:0">${sub}</p>` : ''}</div><div class="row g12 wrap">${actions}</div></div>` : ''}${body}</section>`}`;
  };

  /* ---------- multi-select chips field ---------- */
  H.multi = (label, name, options, sel, o = {}) => {
    H.ms[name] = { options, sel: [...sel], o };
    return `<div id="ms-${name}">${msHTML(name)}</div>`;
  };
  function msHTML(name) {
    const { options, sel, o } = H.ms[name]; const rest = options.filter(x => !sel.includes(x.v)); const shown = o.max ? sel.slice(0, o.max) : sel;
    return `<div class="field multi-sel ${o.err ? 'err' : ''}"><label>${label(name)}${o.req ? ' <b>*</b>' : ''}</label><div class="ms-chips">${shown.map(v => { const x = options.find(y => y.v === v) || { t: v }; return `<span class="chip sm filled t-teal">${o.av ? `<span class="mini-av">${esc(v.toUpperCase())}</span>` : ''}${esc(x.t)}<button type="button" data-act="ms-del" data-ms="${name}" data-v="${esc(v)}" aria-label="Remove ${esc(x.t)}"><i class="ri-close-line"></i></button></span>`; }).join('')}${o.max && sel.length > o.max ? `<span class="chip sm">+${sel.length - o.max} more</span>` : ''}
      ${rest.length ? `<select data-ch="ms-add" data-ms="${name}" aria-label="Add to ${esc(label(name))}"><option value="">${sel.length ? '' : esc(o.ph || 'Select…')}</option>${rest.map(x => `<option value="${esc(x.v)}">${esc(x.t)}</option>`).join('')}</select>` : ''}</div></div>`;
  }
  const label = name => H.ms[name].o.label || name;
  H.msRedraw = name => { const el = App.$('#ms-' + name); if (el) el.innerHTML = msHTML(name); H.ms[name].o.onChange && H.ms[name].o.onChange(H.ms[name].sel); };
  chs['ms-add'] = el => { const m = H.ms[el.dataset.ms]; if (el.value) m.sel.push(el.value); H.msRedraw(el.dataset.ms); };
  acts['ms-del'] = el => { const m = H.ms[el.dataset.ms]; m.sel = m.sel.filter(v => v !== el.dataset.v); H.msRedraw(el.dataset.ms); };
  H.msField = (lab, name, options, sel, o = {}) => H.multi(lab, name, options, sel, Object.assign({ label: lab }, o));

  /* ---------- AI assistant panel ---------- */
  H.aiPanel = ai => `<aside class="ai-panel" aria-label="AI Assistant"><div class="row between"><div class="row g12"><span class="ai-ic"><i class="ri-arrow-left-right-line"></i></span><b class="h6" style="font-size:18px">AI Assistant</b></div><button class="icon-btn s20" data-act="ai-close" aria-label="Close AI Assistant"><i class="ri-close-line"></i></button></div>
    <div class="ai-bubble">${esc(ai.prompt)}</div>
    <div class="row between"><b style="font-weight:600">AI Suggestions (${ai.options.length})</b><button class="btn primary sm" data-act="ai-retry"><i class="ri-refresh-line"></i>Try Again</button></div>
    <div class="stack g12" role="radiogroup" aria-label="AI suggestions">${ai.options.map((t, i) => `<button type="button" role="radio" aria-checked="${ai.sel === i}" class="ai-opt ${ai.sel === i ? 'on' : ''}" data-act="ai-pick" data-i="${i}"><span><b>Option ${i + 1}${i === 0 ? ' · Best match' : ''}</b><br>${esc(t)}</span><span class="radio"></span></button>`).join('')}</div>
    <div class="field multi"><label>Description (Optional)</label><textarea rows="3" data-in="ai-ask" placeholder="What do you need to create?">${esc(ai.ask || '')}</textarea><button class="send-ai" data-act="ai-send" aria-label="Ask AI"><i class="ri-send-plane-2-line"></i></button></div></aside>`;
  H.ai = null; // { prompt, options, sel, ask, variants:[[...]], v, onPick(text), redraw() }
  acts['ai-pick'] = el => { H.ai.sel = +el.dataset.i; H.ai.onPick(H.ai.options[H.ai.sel]); H.ai.redraw(); };
  acts['ai-retry'] = () => { H.ai.v = (H.ai.v + 1) % H.ai.variants.length; H.ai.options = H.ai.variants[H.ai.v]; H.ai.sel = 0; H.ai.onPick(H.ai.options[0]); H.ai.redraw(); App.snack('New suggestions generated.', 'info'); };
  ins['ai-ask'] = el => { H.ai.ask = el.value; };
  acts['ai-send'] = () => { if (!(H.ai.ask || '').trim()) { App.snack('Tell the assistant what you need first.', 'info'); return; } H.ai.prompt = H.ai.ask.trim(); H.ai.ask = ''; acts['ai-retry'](); };
  acts['ai-close'] = () => { H.ai.closed = true; H.ai.redraw(true); };

  /* ---------- create / edit recruitment (P4, P5) ---------- */
  const JD = [[
    'We are seeking a dedicated and compassionate {t} to provide high-quality care — examining, diagnosing and managing ongoing treatment, working closely with nurses and specialists.',
    'Join QA Riverside Private Clinic as a {t} and help us deliver patient-first primary care: consultations, investigations and clinical governance.',
    'We are looking for a {t} who pairs clinical excellence with empathy, seeing a varied caseload and mentoring junior clinical staff.'], [
    'QA Riverside Private Clinic is hiring a {t} to join a friendly, multidisciplinary team in London. You’ll own a varied list and shape how we deliver care.',
    'As our {t} you’ll combine clinical judgement with clear communication, working alongside GPs, nurses and pharmacists every day.',
    'Bring your experience as a {t} to a modern clinic with an integrated EHR, protected admin time and a CPD budget.']];
  let rd = null;
  H.openRecruitment = (rid, o = {}) => {
    const r = rid ? H.rec(rid) : null;
    rd = r ? { id: r.id, title: r.title, vacancies: r.vacancies, desc: r.desc, reqs: r.reqs.join(' · '), start: r.start, end: r.end, survey: r.survey || '', publish: r.published, photo: !!r.photo, resumeOpt: !!r.resumeOptional, tried: false, ai: !!o.ai }
      : { id: null, title: '', vacancies: 1, desc: '', reqs: '', start: '', end: '', survey: 'sv1', publish: true, photo: false, resumeOpt: false, tried: false, ai: !!o.ai };
    H.ms = {}; rd.managers = r ? [...r.managers] : ['nc']; rd.skills = r ? [...r.skills] : [];
    if (rd.ai) startJD(); drawRec(); };
  function startJD() { const t = rd.title || 'Medical Practitioner'; H.ai = { prompt: `Write a job description for a ${t} at a private GP clinic in London — patient-first, multidisciplinary team.`, variants: JD.map(v => v.map(x => x.replace(/\{t\}/g, t))), v: 0, sel: -1, ask: '', onPick: txt => { rd.desc = txt; const ta = App.$('[data-in=rd][data-k=desc]'); if (ta) ta.value = txt; }, redraw: closed => { if (closed) { rd.ai = false; drawRec(); } else App.$('.ai-panel').outerHTML = H.aiPanel(H.ai); } }; H.ai.options = H.ai.variants[0]; }
  function drawRec() {
    const e = k => rd.tried && !String(rd[k] || '').trim(); const mErr = rd.tried && !rd.managers.length;
    const form = `<div class="stack g16 grow">
      <div class="row g16 top"><div class="grow stack g4">${App.field('Job position', `<input data-in="rd" data-k="title" value="${esc(rd.title)}" placeholder="e.g. Medical Practitioner">`, { req: true, cls: e('title') ? 'err' : '' })}${e('title') ? '<p class="helper err">Add the job title</p>' : ''}</div>
        <div style="width:160px">${App.field('Vacancies', `<input type="number" min="1" data-in="rd" data-k="vacancies" value="${rd.vacancies}">`, { req: true })}</div></div>
      <div class="row" style="justify-content:flex-end;margin-bottom:-8px"><button class="ai-btn" data-act="rd-ai"><i class="ri-sparkling-line"></i>Ask <span class="ai-word">AI</span></button></div>
      <div class="stack g4">${App.field('Description', `<textarea rows="3" maxlength="300" data-in="rd" data-k="desc" placeholder="What the role involves">${esc(rd.desc)}</textarea>`, { req: true, cls: 'multi ' + (e('desc') ? 'err' : '') })}<p class="helper ${e('desc') ? 'err' : ''}">${e('desc') ? 'Add a description — or ask AI to draft one' : 'Character limit: 300'}</p></div>
      <div class="stack g4">${App.field('Requirements', `<textarea rows="2" maxlength="300" data-in="rd" data-k="reqs" placeholder="e.g. GMC registration · 3+ years in general practice">${esc(rd.reqs)}</textarea>`, { cls: 'multi' })}<p class="helper">Character limit: 300 · separate with “·”</p></div>
      <div class="g2">${H.msField('Managers', 'rd-managers', S.staff.map(s => ({ v: s.id, t: s.name })), rd.managers, { req: true, err: mErr, onChange: v => { rd.managers = v; } })}${App.field('Company', `<input value="QA Riverside Private Clinic" disabled>`, { cls: 'dis filled-dis' })}</div>
      <div class="g2">${App.field('Start date', `<input type="date" data-in="rd" data-k="start" value="${toInput(rd.start)}">`, { req: true, cls: e('start') ? 'err' : '' })}${App.field('End date', `<input type="date" data-in="rd" data-k="end" value="${toInput(rd.end)}">`)}</div>
      <div class="g2">${H.msField('Skills', 'rd-skills', S.skills.map(s => ({ v: s.name, t: s.name })), rd.skills, { max: 1, onChange: v => { rd.skills = v; } })}${App.select('Application survey', 'rd-survey', [{ v: '', t: 'No survey' }, ...S.surveys.map(s => ({ v: s.id, t: s.name }))], rd.survey)}</div>
      <div class="tcards">${[['publish', 'Publish to career page', 'Candidates can find and apply for this role publicly'], ['photo', 'Ask for a profile photo', 'Shown as optional on the application form'], ['resumeOpt', 'Make resume optional', 'Candidates can apply without uploading a CV']].map(([k, t, d]) => `<div><div class="row between g8"><b>${t}</b>${App.sw(rd[k], `data-ch="rd-sw" data-k="${k}"`, t)}</div><span class="caption">${d}</span></div>`).join('')}</div></div>`;
    App.dialog(`<div class="dlg-head"><div class="stack g4"><h2 id="dlg-title" class="h6" style="font-size:20px">${rd.id ? 'Edit recruitment' : 'Create recruitment'}</h2><p class="body2 muted" style="margin:0">Set up the role, who manages it and how candidates apply.</p></div><button class="icon-btn s20 round" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button></div>
      <div class="dlg-body"><div class="row g24 top">${form}${rd.ai ? H.aiPanel(H.ai) : ''}</div></div>
      <div class="dlg-foot"><span class="note">Fields marked * are required</span><button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="rd-save">${rd.id ? 'Save changes' : 'Create recruitment'}</button></div>`, { width: rd.ai ? 1040 : 680 });
  }
  const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  const toInput = s => { if (!s) return ''; if (/^\d{4}-/.test(s)) return s; const [d, m, y] = s.split(' '); return `${y}-${String(MON[m]).padStart(2, '0')}-${d.padStart(2, '0')}`; };
  H.fromInput = v => v ? H.d(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  ins.rd = el => { rd[el.dataset.k] = el.value; };
  chs['rd-sw'] = el => { rd[el.dataset.k] = el.checked; }; chs['rd-survey'] = el => { rd.survey = el.value; };
  acts['rd-ai'] = () => { rd.ai = !rd.ai; if (rd.ai) startJD(); drawRec(); };
  acts['rd-save'] = () => {
    if (!rd.title.trim() || !rd.desc.trim() || !rd.start || !rd.managers.length) { rd.tried = true; drawRec(); App.snack('Please fill in the highlighted fields.', 'error'); return; }
    const start = H.fromInput(toInput(rd.start)), end = rd.end ? H.fromInput(toInput(rd.end)) : '';
    const patch = { title: rd.title.trim(), vacancies: Math.max(1, +rd.vacancies || 1), desc: rd.desc.trim(), blurb: rd.desc.trim(), reqs: rd.reqs.split('·').map(x => x.trim()).filter(Boolean), managers: rd.managers, skills: rd.skills, survey: rd.survey || null, start, end, deadline: end ? end.slice(0, 6) : '—', published: rd.publish, photo: rd.photo, resumeOptional: rd.resumeOpt };
    let r = H.rec(rd.id);
    if (r) Object.assign(r, patch); else { r = Object.assign({ id: 'r' + Date.now(), dept: 'Clinical', type: 'Full-time', location: 'London', hired: 0, status: 'Open', closesIn: 60, created: '08 Oct 2026', isNew: true }, patch); S.recruitments.unshift(r); }
    App.closeModal(); App.ui.hrmRec = r.id;
    if (!rd.id) { App.go('#/hrm/pipeline'); App.snack(`“${r.title}” created${r.published ? ' and published to your career page' : ''}.`); } else { App.render(); App.snack('Recruitment updated.'); }
  };

  /* ---------- schedule interview (P6) ---------- */
  const TIMES = ['09:00', '10:00', '11:30', '13:00', '14:00', '15:30', '16:30'];
  const freeAt = (sid, day) => { const seed = [...(sid + day)].reduce((a, ch) => a + ch.charCodeAt(0), 0); const out = TIMES.filter((t, i) => (seed + i * 7) % 3 !== 0 || t === '14:00'); return out.includes('10:00') ? out : ['10:00', ...out].sort(); };
  let sd = null;
  H.schedule = (cid, iid) => { const c = H.cand(cid) || H.active()[0]; const it = iid && S.interviews.find(i => i.id === iid);
    const days = H.weekdays(H.today, 5);
    sd = { cid: c.id, rid: c.rid, dur: it ? it.dur : 30, who: it ? [...it.who] : [...new Set([...(H.stage(c.stage).managers || []), 'nc'])].slice(0, 3), days, day: it && days.includes(it.day) ? it.day : days[days.length - 1], time: it ? it.time : '14:00', mode: it ? it.mode : 'Video', iid: iid || null };
    H.ms = {}; drawSched(); };
  function drawSched() {
    const c = H.cand(sd.cid), r = H.rec(sd.rid); const who = sd.who.map(H.staff);
    const common = TIMES.filter(t => who.length && who.every(w => freeAt(w.id, sd.day).includes(t)));
    const clash = who.filter(w => !freeAt(w.id, sd.day).includes(sd.time));
    const link = `meet.leafease.com/riverside/${H.ini(c).toLowerCase()}-${r.title.split(' ').map(w => w[0]).join('').toLowerCase()}-${sd.day.slice(8)}${sd.day.slice(5, 7)}`;
    const cands = H.active().filter(x => x.rid === sd.rid || x.id === sd.cid);
    App.dialog(`<div class="dlg-head"><div class="stack g4"><h2 id="dlg-title" class="h6" style="font-size:20px">${sd.iid ? 'Reschedule interview' : 'Schedule interview'}</h2><p class="body2 muted" style="margin:0">${esc(H.name(c))} • ${esc(r.title)} • ${esc(H.stage(c.stage).name)} stage</p></div><button class="icon-btn s20 round" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button></div>
      <div class="dlg-body">
        <div class="g3">${App.select('Candidate *', 'sd-cand', cands.map(x => ({ v: x.id, t: H.name(x) })), sd.cid)}${App.select('Job opening *', 'sd-rec', S.recruitments.filter(x => x.status !== 'Draft').map(x => ({ v: x.id, t: x.title })), sd.rid)}${App.select('Duration', 'sd-dur', [20, 30, 45, 60].map(m => ({ v: String(m), t: m + ' minutes' })), String(sd.dur))}</div>
        ${H.msField('Interviewers', 'sd-who', S.staff.map(s => ({ v: s.id, t: s.name })), sd.who, { req: true, av: true, ph: 'Add staff…', onChange: v => { sd.who = v; drawSched(); } })}
        <div class="slots"><div class="slots-head"><b>Available slots</b><span class="caption"><i class="ri-refresh-line"></i> From EHR calendars · 2 min ago</span><span class="grow"></span><div class="row g4 wrap">${sd.days.map(d => `<button class="daychip ${d === sd.day ? 'on' : ''}" data-act="sd-day" data-v="${d}" aria-pressed="${d === sd.day}">${H.dayName(d).replace(/ \w+$/, '').replace(/ 0?/, ' ')}</button>`).join('')}</div></div>
          ${who.length ? who.map(w => { const f = freeAt(w.id, sd.day); return `<div class="slot-row"><span class="person"><span class="av ${H.avTone(w.id)}">${w.id.toUpperCase()}</span><span class="cell2"><span>${esc(w.name)}</span><small>${esc(w.role)} · ${f.length} free</small></span></span><div class="row g8 wrap">${f.map(t => `<button class="slot ${t === sd.time ? 'on' : common.includes(t) ? 'common' : ''}" data-act="sd-time" data-v="${t}" aria-pressed="${t === sd.time}">${t === sd.time ? '<i class="ri-check-line"></i>' : ''}${t}</button>`).join('')}</div></div>`; }).join('') : '<p class="caption" style="padding:16px">Add at least one interviewer to see their free slots.</p>'}</div>
        <div class="g2"><div class="stack g8"><b class="sub2">Mode</b><div class="seg grey full">${[['Video', 'ri-video-on-line'], ['In person', 'ri-map-pin-line'], ['Phone', 'ri-phone-line']].map(([m, i]) => `<button class="${sd.mode === m ? 'on-soft' : ''}" data-act="sd-mode" data-v="${m}" aria-pressed="${sd.mode === m}"><i class="${i}"></i>${m}</button>`).join('')}</div></div>
          <div class="stack g8"><b class="sub2">${sd.mode === 'Video' ? 'Meeting link' : sd.mode === 'Phone' ? 'We’ll call' : 'Location'}</b>${App.field('', `<input value="${sd.mode === 'Video' ? link : sd.mode === 'Phone' ? esc(c.phone || '') : 'QA Riverside Private Clinic, 4 Riverside Walk'}" aria-label="Meeting details">`, { cls: 'sm' })}</div></div>
        ${clash.length ? `<div class="al warning"><i class="ri-error-warning-line"></i><div class="txt">${clash.map(w => esc(w.name)).join(' and ')} ${clash.length > 1 ? 'aren’t' : 'isn’t'} free at ${sd.time}. Pick a highlighted time everyone shares.</div></div>`
          : who.length ? `<div class="al success"><i class="ri-check-line"></i><div class="txt">${H.dayName(sd.day)} · ${sd.time} – ${H.addMin(sd.time, sd.dur)} · ${sd.mode} with ${who.map(w => esc(w.name)).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Calendar invites are sent to everyone.</div></div>` : ''}</div>
      <div class="dlg-foot"><button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="sd-save" ${clash.length || !who.length ? 'disabled' : ''}>${sd.iid ? 'Reschedule' : 'Schedule interview'}</button></div>`, { width: 800 });
  }
  chs['sd-cand'] = el => { sd.cid = el.value; sd.rid = H.cand(el.value).rid; drawSched(); };
  chs['sd-rec'] = el => { sd.rid = el.value; const first = H.active().find(x => x.rid === el.value); if (first) sd.cid = first.id; drawSched(); };
  chs['sd-dur'] = el => { sd.dur = +el.value; drawSched(); };
  acts['sd-day'] = el => { sd.day = el.dataset.v; drawSched(); };
  acts['sd-time'] = el => { sd.time = el.dataset.v; drawSched(); };
  acts['sd-mode'] = el => { sd.mode = el.dataset.v; drawSched(); };
  acts['sd-save'] = () => { const c = H.cand(sd.cid);
    if (sd.iid) Object.assign(S.interviews.find(i => i.id === sd.iid), { day: sd.day, time: sd.time, dur: sd.dur, mode: sd.mode, who: sd.who, status: 'Rescheduled' });
    else S.interviews.unshift({ id: 'i' + Date.now(), cid: c.id, day: sd.day, time: sd.time, dur: sd.dur, mode: sd.mode, who: sd.who, status: 'Scheduled', title: S.interviews.some(i => i.cid === c.id) ? 'Follow-up interview' : 'Interview', feedback: [] });
    c.when = `${H.dayName(sd.day)} ${sd.time}`;
    App.closeModal(); App.render(); App.snack(`Interview ${sd.iid ? 'moved' : 'scheduled'} with ${H.name(c)}\n${H.dayName(sd.day)} · ${sd.time} · invites sent to ${sd.who.length + 1} people`); };

  /* ---------- generic confirm-by-typing ---------- */
  H.typeConfirm = (name, go) => `<div class="stack g8"><span class="sub2" style="font-weight:400">Type the ${go === 'rec' ? 'recruitment' : 'candidate’s'} name to confirm</span>${App.field('', `<input data-in="type-confirm" data-want="${esc(name)}" placeholder="${esc(name)}" aria-label="Type ${esc(name)} to confirm">`)}</div>`;
  ins['type-confirm'] = el => { const b = App.$('[data-confirm-btn]'); if (b) b.disabled = el.value.trim() !== el.dataset.want; };

  App.route('/hrm', () => { App.go('#/hrm/dashboard'); return ''; }, H.meta);
})();

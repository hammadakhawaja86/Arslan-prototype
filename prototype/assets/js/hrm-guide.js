/* HRM › Recruitment › Org chart + Guide (Figma 1784:82903). Copy is the Figma's, word for word; layout and interactions are improved. */
(function () {
  const { S, esc, acts, ins, chs } = App; const H = App.H;

  /* ======================= ORG CHART ======================= */
  const R = (id, name, parent, people = []) => ({ id, name, parent, people, open: true });
  S.org = [R('o1', 'Business Manager Test', null, ['ma']), R('o2', 'Practice Manager', 'o1', ['nc']), R('o3', 'Doctor', 'o2', ['ak']), R('o4', 'Clinician', 'o3', ['uk']), R('o5', 'Clinician UAT', 'o3'), R('o6', 'surgeon', 'o3'),
    R('o7', 'Nurse', 'o2', ['sr']), R('o8', 'Front Desk', 'o2'), R('o9', 'Finance Officer', 'o1'), R('o10', 'Human Resource', 'o1'), R('o11', 'New Practice Manager', 'o10'), R('o12', 'Logistics Admin', null),
    R('o13', 'Medical Rep', 'o12'), R('o14', 'Test Business Role', null), R('o15', 'Testing Role Checking All Permissions', 'o14')];
  const role = id => S.org.find(r => r.id === id);
  const kids = id => S.org.filter(r => r.parent === id);
  const descendants = id => kids(id).flatMap(k => [k.id, ...descendants(k.id)]);
  const oc = App.ui.org = { z: null, x: 0, y: 0, q: '' };

  H.route('/hrm/org-chart', () => { const empty = S.org.filter(r => !r.people.length).length;
    App.after(initCanvas);
    return H.frame({ tab: 'org-chart', title: 'Org chart', sub: 'See which roles report to which in your practice, and who holds each role.',
      actions: `<div style="width:min(260px,100%)">${App.field('', `<span class="adorn"><i class="ri-search-line"></i></span><input data-in="org-q" value="${esc(oc.q)}" placeholder="Find a role or person" aria-label="Find a role or person">`, { cls: 'sm' })}</div>`,
      body: `<div class="hbody stack g12"><div class="row between wrap g8"><span class="caption">${S.org.length} roles · ${empty} with no one assigned</span><span class="caption org-hint"><i class="ri-drag-move-2-line"></i> Drag to move around · <kbd>Ctrl</kbd> + scroll to zoom · click a role’s <i class="ri-more-2-fill"></i> to change who it reports to</span></div>
        <div class="org-canvas" id="org-canvas" tabindex="0" aria-label="Org chart canvas. Use arrow keys to move and plus or minus to zoom.">
          <div class="org-tools" role="toolbar" aria-label="Zoom"><button class="icon-btn s20" data-act="org-z" data-d="-0.1" aria-label="Zoom out"><i class="ri-subtract-line"></i></button><span class="tnum" id="org-pct">100%</span><button class="icon-btn s20" data-act="org-z" data-d="0.1" aria-label="Zoom in"><i class="ri-add-line"></i></button><span class="vsep"></span><button class="icon-btn s20" data-act="org-fit" aria-label="Fit to screen" title="Fit to screen"><i class="ri-focus-3-line"></i></button><button class="icon-btn s20" data-act="org-full" aria-label="Full screen" title="Full screen"><i class="ri-fullscreen-line"></i></button></div>
          <div class="org-legend"><span><span class="lg-dot filled"></span>Has people</span><span><span class="lg-dot"></span>No one assigned</span></div>
          <div class="org-stage" id="org-stage">${tree()}</div></div></div>` }); });
  const tree = () => `<ul class="otree roots">${S.org.filter(r => !r.parent).map(branch).join('')}</ul>`;
  function branch(r) { const ks = kids(r.id); const hit = oc.q && (r.name + ' ' + r.people.map(p => H.staff(p).name).join(' ')).toLowerCase().includes(oc.q.toLowerCase());
    return `<li><div class="onode ${r.people.length ? 'has' : ''} ${oc.q ? (hit ? 'hit' : 'dim') : ''} ${App.ui.orgFlash === r.id ? 'flash' : ''}" data-role="${r.id}">
      <div class="row between g8"><b class="oname" title="${esc(r.name)}">${esc(r.name)}</b><button class="icon-btn s20" data-act="org-menu" data-id="${r.id}" data-menu-anchor aria-haspopup="menu" aria-label="Options for ${esc(r.name)}"><i class="ri-more-2-fill"></i></button></div>
      ${r.people.length ? `<div class="row g8">${H.avs(r.people)}<span class="caption" style="color:var(--text)">${r.people.map(p => esc(H.staff(p).name)).join(', ')}</span></div>` : '<span class="caption">No one assigned</span>'}
      ${ks.length ? `<button class="ocount" data-act="org-tog" data-id="${r.id}" aria-expanded="${r.open}">${ks.length} report${ks.length > 1 ? 's' : ''} <i class="${r.open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i></button>` : ''}</div>
      ${ks.length && r.open ? `<ul class="otree">${ks.map(branch).join('')}</ul>` : ''}</li>`; }
  const apply = () => { const st = App.$('#org-stage'); if (!st) return; st.style.transform = `translate(${oc.x}px, ${oc.y}px) scale(${oc.z})`; App.$('#org-pct').textContent = Math.round(oc.z * 100) + '%'; };
  const redrawTree = () => { const st = App.$('#org-stage'); if (st) { st.innerHTML = tree(); apply(); } };
  function fit() { const c = App.$('#org-canvas'), st = App.$('#org-stage'); if (!c || !st) return; st.style.transform = 'none'; const w = st.scrollWidth, h = st.scrollHeight;
    oc.z = Math.max(.5, Math.min(1, (c.clientWidth - 48) / w, (c.clientHeight - 96) / h)); oc.x = Math.max(24 - (w * oc.z - c.clientWidth) / 2, (c.clientWidth - w * oc.z) / 2); oc.y = 64; apply(); }
  function initCanvas() { const c = App.$('#org-canvas'); if (!c) return; if (oc.z == null) fit(); else apply();
    let drag = null;
    c.addEventListener('pointerdown', e => { if (e.target.closest('button, .onode, .org-tools')) return; drag = { x: e.clientX - oc.x, y: e.clientY - oc.y }; c.setPointerCapture(e.pointerId); c.classList.add('grabbing'); });
    c.addEventListener('pointermove', e => { if (!drag) return; oc.x = e.clientX - drag.x; oc.y = e.clientY - drag.y; apply(); });
    c.addEventListener('pointerup', () => { drag = null; c.classList.remove('grabbing'); });
    c.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoomBy(e.deltaY < 0 ? .1 : -.1); }, { passive: false });
    c.addEventListener('keydown', e => { const m = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[e.key]; if (m) { e.preventDefault(); oc.x += m[0]; oc.y += m[1]; apply(); } if (e.key === '+' || e.key === '=') zoomBy(.1); if (e.key === '-') zoomBy(-.1); if (e.key === '0') fit(); }); }
  const zoomBy = d => { const c = App.$('#org-canvas'); const cx = c.clientWidth / 2, cy = c.clientHeight / 2; const z = Math.max(.3, Math.min(1.6, +(oc.z + d).toFixed(2))); oc.x = cx - (cx - oc.x) * z / oc.z; oc.y = cy - (cy - oc.y) * z / oc.z; oc.z = z; apply(); };
  acts['org-z'] = el => zoomBy(+el.dataset.d); acts['org-fit'] = () => fit();
  acts['org-full'] = () => { const c = App.$('#org-canvas'); if (document.fullscreenElement) document.exitFullscreen(); else c.requestFullscreen?.().then(() => setTimeout(fit, 120)); };
  document.addEventListener('fullscreenchange', () => { const b = App.$('[data-act=org-full] i'); if (b) b.className = document.fullscreenElement ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'; if (!document.fullscreenElement) setTimeout(fit, 60); });
  acts['org-tog'] = el => { const r = role(el.dataset.id); r.open = !r.open; redrawTree(); };
  ins['org-q'] = el => { oc.q = el.value.trim(); redrawTree(); const hit = App.$('.onode.hit'); if (hit) centerOn(hit); };
  function centerOn(node) { const c = App.$('#org-canvas'); const cr = c.getBoundingClientRect(), nr = node.getBoundingClientRect(); oc.x += cr.left + cr.width / 2 - (nr.left + nr.width / 2); oc.y += cr.top + cr.height / 2 - (nr.top + nr.height / 2); apply(); }
  acts['org-menu'] = el => { const r = role(el.dataset.id); App.menu(el, `<button data-pick="reports"><i class="ri-pencil-line"></i>Change reports to…</button>`, () => reportsTo(r), { width: 220 }); };

  /* change reports to */
  let rt = null;
  function reportsTo(r) { rt = { id: r.id, val: r.parent || '' }; drawRt(); }
  function drawRt() { const r = role(rt.id); const blocked = [r.id, ...descendants(r.id)]; const opts = S.org.filter(x => !blocked.includes(x.id)).sort((a, b) => a.name.localeCompare(b.name));
    const cur = r.parent ? role(r.parent).name : 'Top level (reports to no role)'; const changed = (rt.val || null) !== (r.parent || null); const target = rt.val ? role(rt.val).name : null;
    App.dialog(`<div class="dlg-head"><div class="stack g4"><h2 id="dlg-title" class="h6" style="font-size:18px">Change reports to</h2><span class="body2 muted">${esc(r.name)}</span></div><button class="icon-btn s20 round" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button></div>
      <div class="dlg-body">${App.select('Reports to', 'rt-val', [{ v: '', t: 'Top level (reports to no role)' }, ...opts.map(o => ({ v: o.id, t: o.name }))], rt.val)}
        <div class="rt-preview"><span class="caption">Now</span><span class="rt-chip">${esc(cur)}</span><i class="ri-arrow-right-line muted"></i><span class="caption">After saving</span><span class="rt-chip ${changed ? 'on' : ''}">${esc(target || 'Top level (reports to no role)')}</span></div>
        ${blocked.length > 1 ? `<p class="caption" style="margin:0"><i class="ri-information-line"></i> ${esc(r.name)}’s own reports aren’t listed, so the chart can’t loop.</p>` : ''}</div>
      <div class="dlg-foot"><button class="btn outlined lg" data-act="close-modal">Cancel</button><button class="btn primary lg" data-act="rt-go" ${changed ? '' : 'disabled'}>Save</button></div>`, { width: 460 }); }
  chs['rt-val'] = el => { rt.val = el.value; drawRt(); };
  acts['rt-go'] = () => { const r = role(rt.id); const prev = r.parent; r.parent = rt.val || null; if (r.parent) role(r.parent).open = true; App.ui.orgFlash = r.id; App.closeModal(); redrawTree(); setTimeout(() => { App.ui.orgFlash = null; }, 50);
    const n = App.$(`[data-role="${r.id}"]`); if (n) centerOn(n);
    App.snack(`${r.name} now reports to ${r.parent ? role(r.parent).name : 'no role (top level)'}.`, 'success', { label: 'Undo', fn: () => { r.parent = prev; redrawTree(); } }); };

  /* ======================= GUIDE ======================= */
  const ROLE = { Manager: ['t-purple', 'ri-user-star-line'], HR: ['t-teal', 'ri-team-line'], Candidate: ['t-orange', 'ri-user-line'], Administrator: ['t-blue', 'ri-shield-user-line'] };
  const badge = r => `<span class="rbadge ${ROLE[r][0]}"><i class="${ROLE[r][1]}"></i>${r}</span>`;
  /* bold UI terms from the Figma become interface-label chips */
  const ui = (text, terms) => { let out = esc(text); [...new Set(terms)].sort((a, b) => b.length - a.length).forEach(t => { const e = esc(t); out = out.split(e).join(`\u0000${e}\u0001`); }); return out.replace(/\u0000/g, '<span class="uiterm">').replace(/\u0001/g, '</span>'); };
  const SETUP = [
    ['Show who reports to whom', 'HR', 'Open the Org chart. Each box is a job role, with the people in it. Click the three dots on a box and choose Change reports to… to say who that role answers to.', ['Org chart', 'Change reports to…'], 'Open the Org chart', '#/hrm/org-chart'],
    ['Add an “Offer” step', 'HR', 'In Configuration → Stages, add a step called Offer before Hired, and switch on Create a draft offer…. When you move someone to Offer, their offer letter is prepared for you. It isn\'t sent until you say so.', ['Configuration → Stages', 'Offer', 'Hired', 'Create a draft offer…'], 'Open Stages', '#/hrm/config/stages'],
    ['Write your offer letter', 'HR', 'In Configuration → Offer templates, write your offer letter once. Use the fill-in words below and Aqlios puts in the real details for each person. Tick Set as default so new jobs use it.', ['Configuration → Offer templates', 'Set as default'], 'Open Offer templates', '#/hrm/config/offer-templates'],
    ['List the documents you need', 'HR', 'In Configuration → Document checklists, list what every new starter must send you, for example photo ID, a DBS certificate or a professional registration. New starters are asked to upload each one.', ['Configuration → Document checklists'], 'Open Document checklists', '#/hrm/config/document-checklists'],
    ['Switch on your jobs page', 'HR', 'Your practice has its own public Career page where people can see your jobs and apply. Switch it on and share the link, for example on your website.', ['Career page'], 'Open Career page', '#/hrm/careers'],
    ['Give people access', 'Administrator', 'Ask your system administrator to let managers request new staff, and to let HR approve requests, manage candidates, change settings and edit the org chart. People see their new access next time they log in.', ['request new staff', 'approve requests', 'manage candidates', 'change settings', 'edit the org chart'], null, null]];
  const STEPS = [
    ['Ask for a new person', 'Manager', 'Go to Requisitions (a request to hire) and click New requisition. Choose the job role, how many people you need, and why. Reports to is already filled in from the org chart. Click Generate with AI if you\'d like help writing the job advert, then Submit. HR is told straight away.', ['Requisitions', 'New requisition', 'Reports to', 'Generate with AI', 'Submit'], 'Open Requisitions', '#/hrm/requisitions'],
    ['Say yes or no to the request', 'HR', 'Open the request. You can see where the new person would fit on the org chart. Click Approve to create the job, or Reject and say why. The manager can change it and send it again.', ['Approve', 'Reject'], 'Open Requisitions', '#/hrm/requisitions'],
    ['Advertise the job', 'HR', 'In Recruitments, the new job starts as a Draft (only you can see it). Tick it, click Set status and choose Open. It now appears on your Career page for people to apply.', ['Recruitments', 'Draft', 'Set status', 'Open'], 'Open Recruitments', '#/hrm/recruitments'],
    ['Look at who applied', 'HR', 'Applications appear in Candidates. Click Filter and choose the job under Recruitment; a Shortlist with AI button then appears and suggests who looks the best fit, with reasons. The Pipeline page shows everyone as cards: drag a card to move a person along. The AI only suggests; you decide.', ['Candidates', 'Filter', 'Recruitment', 'Shortlist with AI', 'Pipeline'], 'Open Candidates', '#/hrm/candidates'],
    ['Interview them', 'Manager', 'In Interviews, book a time. Find a time shows when everyone is free. Each interview comes with suggested questions. Afterwards, add your thoughts and a score.', ['Interviews', 'Find a time'], 'Open Interviews', '#/hrm/interviews'],
    ['Offer them the job', 'HR', 'Open the person and go to the Offer tab. Click Send offer, choose your offer letter, check the pay and start date, read the letter, and press Send offer. They get an email with a link.', ['Offer', 'Send offer'], 'Open Candidates', '#/hrm/candidates'],
    ['They accept and send their documents', 'Candidate', 'The person opens the link, reads the letter, types their full name to accept, and uploads each document you asked for. You don\'t need to do anything. Their Offer tab shows how far they\'ve got.', ['Offer'], null, null],
    ['Check the documents', 'HR', 'In their Offer tab, open each document. Click Verify if it\'s fine, or Reject and say what\'s wrong. They can then send it again.', ['Offer', 'Verify', 'Reject'], 'Open Candidates', '#/hrm/candidates'],
    ['Welcome them to the team', 'HR', 'In Candidates, click the person icon on their row (To Employee). They become a member of staff, appear on the org chart, and their checked documents are saved on their staff record. If any document couldn\'t be saved there, you\'re shown a list to file by hand.', ['Candidates', 'To Employee'], 'Open Candidates', '#/hrm/candidates']];
  const GLANCE = [['Ask', [1], 'ri-hand-heart-line'], ['Approve', [2], 'ri-checkbox-circle-line'], ['Advertise', [3], 'ri-megaphone-line'], ['Meet', [4, 5], 'ri-chat-smile-3-line'], ['Offer', [6], 'ri-file-text-line'], ['Paperwork', [7, 8], 'ri-folder-shield-2-line'], ['Welcome', [9], 'ri-emotion-happy-line']];
  const WORDS = [['{{candidate_first_name}}', 'becomes their first name, e.g. Zoe'], ['{{job_title}}', 'becomes the job, e.g. Practice Nurse'], ['{{compensation}}', 'becomes the pay, e.g. £32,000 a year'], ['{{start_date}}', 'becomes the start date'], ['{{response_deadline}}', 'becomes the date they must reply by'], ['{{practice_name}}', 'becomes your practice name']];
  const TERMS = [['Requisition', 'A request from a manager to hire someone.'], ['Recruitment', 'A job you are advertising.'], ['Candidate', 'Someone who applied for a job.'], ['Pipeline', 'The steps a candidate goes through, from applying to being hired.'], ['Stage', 'One step in the pipeline, such as Interview or Offer.'], ['Offer template', 'Your standard offer letter, reused for every offer.'], ['Document checklist', 'The list of documents a new starter must send you.'], ['Role', 'A type of job at your practice, such as Nurse or Practice Manager.']];
  const FAQ = [['I can’t open a job.', 'The job needs an offer letter and a document checklist. If it came from a request, the request must be approved first. The message on screen tells you what’s missing.'], ['I can’t see a tab or a button.', 'You may not have access to it yet. Ask your system administrator, then log out and back in.'], ['The Emails tab says I have no access.', 'A candidate’s emails are private. Only staff at this practice who look after candidates can see them.'], ['Someone is missing from the org chart.', 'People appear once they have a job role at this practice. Ask your administrator to check their role. It can take a minute to show.']];
  const WHO = [['Manager', 'Asks for new staff, interviews people and says what they thought.'], ['HR', 'Says yes or no to requests, advertises jobs, sends offers, checks documents and welcomes new staff.'], ['Candidate', 'Applies online, accepts the offer and sends their documents.']];
  /* Figma 1805:92379 — every section starts collapsed; one accordion level */
  const gs = App.ui.guide = { who: 'All', sec: new Set(), step: null };
  const ALL = ['who', 'setup', 'steps', 'words', 'terms', 'faq'];

  const section = (id, icon, title, sub, body) => { const open = gs.sec.has(id);
    return `<section class="gx-sec ${open ? 'open' : ''}" id="g-${id}"><button class="gx-sec-h" data-act="g-sec" data-s="${id}" aria-expanded="${open}" aria-controls="gb-${id}">
      <span class="gx-sec-ic"><i class="${icon}"></i></span><span class="gx-sec-t"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</span><i class="ri-arrow-down-s-line gx-chev" aria-hidden="true"></i></button>
      <div class="gx-sec-b" id="gb-${id}" ${open ? '' : 'hidden'}>${body}</div></section>`; };

  H.route('/hrm/guide', () => {
    const whoBody = `<div class="gx-roles">${WHO.map(([r, d]) => `<div class="gx-role ${ROLE[r][0]}"><span class="gx-role-ic"><i class="${ROLE[r][1]}"></i></span><div><b>${r}</b><span>${d}</span></div></div>`).join('')}</div>`;
    const setupBody = `<ol class="gx-tasks">${SETUP.map(([t, r, d, terms, btn, href], i) => `<li class="gx-task"><span class="gx-num">${i + 1}</span>
        <div class="gx-task-main"><div class="gx-task-h"><h3>${esc(t)}</h3>${badge(r)}</div><p>${ui(d, terms)}</p>${btn ? `<a class="gx-pill" href="${href}">${esc(btn)}<i class="ri-arrow-right-s-line"></i></a>` : ''}</div></li>`).join('')}</ol>`;
    const stepsBody = `<div class="gx-timeline">${GLANCE.map(([phase, ids, icon], k) => `<div class="gx-phase"><div class="gx-phase-h"><span class="gx-phase-ic"><i class="${icon}"></i></span><b>${phase}</b><span class="gx-phase-k">${k + 1} of 7</span></div>
        ${ids.map(n => { const [t, r, d, terms, btn, href] = STEPS[n - 1]; return `<article class="gx-step ${ROLE[r][0]} ${gs.step === n ? 'hl' : ''}" id="steps-${n}">
          <div class="gx-step-card"><div class="gx-task-h"><span class="gx-step-n">${n}</span><h3>${esc(t)}</h3>${badge(r)}</div><p>${ui(d, terms)}</p>${btn ? `<a class="gx-link" href="${href}">${esc(btn)}<i class="ri-arrow-right-line"></i></a>` : ''}</div></article>`; }).join('')}</div>`).join('')}</div>`;
    return H.frame({ tab: 'guide', bare: true, body: `<section class="gx">
      <header class="gx-hero"><h1>Guide</h1><p>How hiring works here, step by step, and where each step happens.</p>
        <div class="gx-glance"><h2>How Hiring works at a glance</h2><p>Seven steps, from asking for a new person to welcoming them to the team.</p>
          <ol class="gx-path">${GLANCE.map(([t, ids, i], k) => `<li><button data-act="g-step" data-n="${ids[0]}" aria-label="${k + 1}. ${t} — show this step"><span class="gx-path-ic"><i class="${i}"></i></span><span class="gx-path-t">${k + 1}&nbsp; ${t}</span></button></li>`).join('')}</ol></div>
      </header>
      ${section('who', 'ri-question-line', 'Who does what', 'Each practice handles its own hiring.', whoBody)}
      ${section('setup', 'ri-list-check-3', 'Before your first hire', 'Things to set up once. After that, every hire uses them.', setupBody)}
      ${section('steps', 'ri-route-line', 'Hiring someone, step by step', 'Follow these in order. Each card tells you who does it and where to click.', stepsBody)}
      ${section('words', 'ri-braces-line', 'Fill-in words for your offer letter', 'Type these into your offer letter exactly as shown, curly brackets included. Each person\'s letter shows their own details.',
        `<div class="gx-words">${WORDS.map(([w, d]) => `<div class="gx-word"><code>${esc(w)}</code><span>${esc(d)}</span><button class="gx-copy" data-act="g-copy" data-w="${esc(w)}" aria-label="Copy ${esc(w)}"><i class="ri-file-copy-line"></i><span>Copy</span></button></div>`).join('')}</div>`)}
      ${section('terms', 'ri-book-2-line', 'Words you\'ll see', '', `<dl class="gx-terms">${TERMS.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`)}
      ${section('faq', 'ri-question-answer-line', 'Common questions', '', `<div class="gx-faq">${FAQ.map(([q, a]) => `<div class="gx-qa"><b><i class="ri-question-line"></i>${q}</b><p>${a}</p></div>`).join('')}</div>`)}
    </section>` }); });

  const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const goTo = el => el && scrollTo({ top: el.getBoundingClientRect().top + scrollY - 110, behavior: smooth() });
  const keep = fn => { const y = scrollY; fn(); App.render(); scrollTo(0, y); };
  acts['g-sec'] = el => { const s = el.dataset.s; keep(() => gs.sec.has(s) ? gs.sec.delete(s) : gs.sec.add(s)); App.$(`[data-act=g-sec][data-s="${s}"]`)?.focus(); };
  acts['g-all'] = el => keep(() => { gs.sec = new Set(el.dataset.v === 'open' ? ALL : []); });
  acts['g-who'] = el => keep(() => { gs.who = el.dataset.v; });
  acts['g-step'] = el => { const n = +el.dataset.n; keep(() => { gs.sec.add('steps'); gs.step = n; if (gs.who !== 'All' && STEPS[n - 1][1] !== gs.who) gs.who = 'All'; }); goTo(App.$('#steps-' + n)); setTimeout(() => { gs.step = null; App.$('.gx-step.hl')?.classList.remove('hl'); }, 1800); };
  acts['g-copy'] = el => { try { navigator.clipboard.writeText(el.dataset.w)?.catch?.(() => {}); } catch (e) {} el.classList.add('copied'); el.querySelector('span').textContent = 'Copied'; el.querySelector('i').className = 'ri-check-line'; setTimeout(() => { el.classList.remove('copied'); el.querySelector('span').textContent = 'Copy'; el.querySelector('i').className = 'ri-file-copy-line'; }, 1400); };
  acts['guide-jump'] = (el, e) => { e?.preventDefault?.(); gs.sec.add(el.dataset.s); App.go('#/hrm/guide'); setTimeout(() => goTo(App.$('#g-' + el.dataset.s)), 60); };

  /* requisitions: referenced by the guide, not designed yet */
  H.route('/hrm/requisitions', () => H.frame({ tab: 'requisitions', bare: true, body: `<section class="soon in-frame"><div class="soon-bg" aria-hidden="true"></div><span class="soon-icon"><i class="ri-file-list-2-line"></i></span><span class="soon-chip"><span class="pulse"></span>Coming soon</span><h1 class="soon-h1">Requisitions is on its way</h1><p class="soon-p">A request from a manager to hire someone.</p>
    <div class="soon-feats">${[['ri-file-add-line', 'New requisition', 'Choose the job role, how many people you need, and why'], ['ri-sparkling-2-line', 'Generate with AI', 'Help writing the job advert'], ['ri-checkbox-circle-line', 'Approve or Reject', 'HR says yes or no, and the job is created']].map(([i, t, d]) => `<div class="soon-feat"><span class="fic"><i class="${i}"></i></span><b>${t}</b><span>${d}</span></div>`).join('')}</div>
    <div class="row g12 wrap" style="justify-content:center"><button class="btn outlined lg" data-act="guide-jump" data-s="steps"><i class="ri-question-line"></i>How requisitions work</button></div></section>` }));
})();

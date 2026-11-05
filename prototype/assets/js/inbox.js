/* Inbox: conversation list, channel filter, search, threads, chat + email composers, assign, templates. */
(function () {
  const { S, esc, acts, ins, chs } = App;
  const CHANNELS = ['All', 'WhatsApp', 'Email', 'Instagram', 'Facebook', 'LinkedIn', 'TikTok'];
  const st = App.ui.inbox = { channel: 'All', q: '', drafts: {}, attach: {} };
  const unread = () => S.conversations.filter(c => c.unread).length;
  const filtered = () => S.conversations.filter(c => (st.channel === 'All' || c.channel === st.channel) &&
    (!st.q || (c.name + ' ' + c.messages.map(m => m.text).join(' ') + ' ' + (c.patientId || '')).toLowerCase().includes(st.q.toLowerCase())));
  const member = id => S.team.find(t => t.id === id);

  function listHTML(activeId) {
    const items = filtered();
    if (!items.length) return `<div class="empty" style="padding:48px 16px"><span class="ic grey"><i class="ri-search-line"></i></span><h3 class="sub2" style="font-size:15px">No conversations found</h3><p class="body2">No ${st.channel === 'All' ? '' : esc(st.channel) + ' '}conversations match “${esc(st.q)}”. Try another channel or clear the search.</p><button class="btn outlined sm" data-act="inbox-clear">Clear filters</button></div>`;
    return items.map(c => `<div class="conv ${c.id === activeId ? 'on' : ''}" data-go="#/inbox/${c.id}" tabindex="0" role="link" aria-label="${esc(c.name)}, ${c.channel}${c.unread ? ', unread' : ''}">
        <span class="av lg">${App.initials(c.name)}</span>
        <div class="meta"><div class="name">${esc(c.name)} ${App.chip(c.channel, App.channelTone(c.channel), 'sm')}</div><div class="prev">${esc(c.subject || c.messages[c.messages.length - 1].text.split('\n')[0])}</div></div>
        <div class="when"><span>${c.when}</span>${c.unread ? '<span class="unread" aria-hidden="true"></span>' : ''}</div></div>`).join('');
  }
  function refreshList(activeId) { const box = App.$('#conv-items'); if (box) box.innerHTML = listHTML(activeId); }

  function threadHTML(c) {
    if (!c) return `<div class="empty" style="margin:auto"><span class="ic"><i class="ri-chat-smile-2-line"></i></span><h3 class="sub2" style="font-size:16px">No conversation selected</h3><p class="body2">Pick a conversation on the left to read the full thread and reply, or start a new one.</p></div>`;
    const isMail = c.channel === 'Email';
    const who = member(c.assignee);
    const msgs = isMail ? c.messages.map(m => `<article class="mail ${m.dir}">
        <div class="hd"><span class="av sm">${App.initials(m.from)}</span><div class="grow"><b style="font-weight:500">${esc(m.from)}</b> <span class="caption">&lt;${esc(m.fromEmail)}&gt;</span><small>to ${esc(m.to)}</small></div><span class="caption">${esc(m.at)}</span></div>
        <p>${esc(m.text)}</p>${(m.files || []).map(f => `<span class="file-pill"><i class="ri-file-line"></i>${esc(f.name)} · ${f.size}</span>`).join('')}</article>`).join('')
      : `<span class="daypill">Today</span>` + c.messages.map(m => `<div class="msg ${m.dir}"><div class="bubble">${esc(m.text)}</div><small>${esc(m.at)}</small></div>`).join('');
    const draft = st.drafts[c.id] || '';
    const files = st.attach[c.id] || [];
    const composer = isMail ? `
      <div class="composer">
        <div class="field sm" style="background:var(--grey-50)"><span class="caption" style="width:60px">Subject</span><input data-in="mail-subject" value="${esc(c.subject || '')}" aria-label="Subject"></div>
        <div class="tools"><button class="ai-btn" data-act="ask-ai"><i class="ri-sparkling-line"></i>Ask AI</button><button class="btn brand sm" data-act="open-templates"><i class="ri-file-list-3-line"></i>Browse Templates</button><button class="btn brand sm" data-act="attach"><i class="ri-attachment-2"></i>Attach file</button></div>
        <div class="send"><div class="field multi grow"><label>Email <b>*</b></label><textarea id="draft" data-in="draft" rows="4" placeholder="Write your reply…" style="min-height:120px">${esc(draft)}</textarea></div>
        <button class="send-btn" data-act="send" aria-label="Send email" ${draft.trim() ? '' : 'disabled'}><i class="ri-send-plane-2-line"></i></button></div>
        ${files.length ? `<div class="row g8 wrap">${files.map((f, i) => `<span class="file-pill"><i class="ri-file-line"></i>${esc(f.name)} <span class="caption">${f.size}</span><button class="icon-btn s20" style="padding:0" data-act="unattach" data-i="${i}" aria-label="Remove ${esc(f.name)}"><i class="ri-close-line" style="font-size:16px"></i></button></span>`).join('')}<span class="caption">${files.length} file${files.length > 1 ? 's' : ''} · 1.3 MB of 25 MB</span></div>` : ''}
      </div>` : `
      <div class="composer">
        <div class="tools"><button class="ai-btn" data-act="ask-ai"><i class="ri-sparkling-line"></i>Ask AI</button><button class="btn brand sm" data-act="open-templates"><i class="ri-file-list-3-line"></i>Browse Templates</button></div>
        <div class="send"><div class="field grow" style="min-height:48px"><input id="draft" data-in="draft" placeholder="Type a message..." value="${esc(draft)}" aria-label="Message" data-enter="send"></div>
        <button class="send-btn" data-act="send" aria-label="Send message" ${draft.trim() ? '' : 'disabled'}><i class="ri-send-plane-2-line"></i></button></div>
        <p class="caption" style="margin:0"><i class="ri-information-line"></i> ${esc(c.channel)} allows replies for 24h after the patient’s last message · ${c.windowLeft} left</p>
      </div>`;
    return `<div class="thread-head"><span class="av">${App.initials(c.name)}</span>
        <div class="grow"><div class="row g8"><b style="font-weight:500;font-size:16px">${esc(c.name)}</b>${App.chip(c.channel, App.channelTone(c.channel), 'sm')}</div>
        ${c.patientId ? `<a href="#/leads" class="caption" style="color:var(--primary)">View patient profile · #${c.patientId}</a>` : '<span class="caption">Not linked to a patient yet</span>'}</div>
        <button class="btn outlined sm" data-act="assign" data-menu-anchor aria-haspopup="menu"><i class="ri-share-forward-line"></i>${who ? esc(who.name.split(' ')[0]) : 'Assign to'}</button>
        <button class="icon-btn s20" data-act="conv-more" data-menu-anchor aria-haspopup="menu" aria-label="More actions"><i class="ri-more-2-line"></i></button></div>
      <div class="thread-body" id="thread-body">${msgs}</div>${composer}`;
  }

  App.route('/inbox', () => page(null), { key: 'inbox', icon: 'ri-chat-smile-2-line', title: 'Conversations' });
  App.route('/inbox/:id', id => page(id), { key: 'inbox', icon: 'ri-chat-smile-2-line', title: 'Conversations' });

  function page(id) {
    const c = S.conversations.find(x => x.id === id);
    if (c && c.unread) c.unread = false;
    App.after(() => { const b = App.$('#thread-body'); if (b) b.scrollTop = b.scrollHeight; });
    const u = unread();
    return `${App.head([['CRM', '#/inbox'], ['Inbox']], 'Inbox', 'Every channel in one shared inbox, WhatsApp, email, Instagram, Facebook, LinkedIn and TikTok.', `<button class="btn outlined lg" data-act="soon" data-what="Advanced filters"><i class="ri-filter-3-line"></i>Filters</button>`, u ? `<span class="badge-red">${u} unread</span>` : '')}
    <div class="inbox">
      <section class="conv-list" aria-label="Conversations">
        <div class="top">
          <div class="field sm"><span class="adorn"><i class="ri-search-2-line"></i></span><input data-in="inbox-q" value="${esc(st.q)}" placeholder="Search conversations, patients…" aria-label="Search conversations"></div>
          <div class="row g8 wrap" role="group" aria-label="Channel">${CHANNELS.map(ch => `<button class="chip-btn ${st.channel === ch ? 'on' : ''}" data-act="inbox-ch" data-ch-val="${ch}" aria-pressed="${st.channel === ch}">${ch}</button>`).join('')}</div>
        </div>
        <div class="conv-items" id="conv-items">${listHTML(id)}</div>
      </section>
      <section class="thread" aria-label="Conversation">${threadHTML(c)}</section>
    </div>`;
  }
  const curId = () => (location.hash.match(/#\/inbox\/(\w+)/) || [])[1];
  const cur = () => S.conversations.find(x => x.id === curId());

  ins['inbox-q'] = el => { st.q = el.value; refreshList(curId()); };
  acts['inbox-ch'] = el => { st.channel = el.dataset.chVal; App.$$('[data-act=inbox-ch]').forEach(b => { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); }); refreshList(curId()); };
  acts['inbox-clear'] = () => { st.q = ''; st.channel = 'All'; App.render(); };
  ins.draft = el => { const c = cur(); if (!c) return; st.drafts[c.id] = el.value; const b = App.$('[data-act=send]'); if (b) b.disabled = !el.value.trim(); };
  ins['mail-subject'] = el => { const c = cur(); if (c) c.subject = el.value; };
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter === 'send') { e.preventDefault(); acts.send(); } });
  acts.send = () => {
    const c = cur(); if (!c) return; const text = (st.drafts[c.id] || '').trim(); if (!text) return;
    if (c.channel === 'Email') c.messages.push({ dir: 'out', from: 'Muhammad Arslan', fromEmail: 'reception@phoenixsurgery.nhs.uk', to: c.email, at: 'Just now', text, files: st.attach[c.id] || [] });
    else c.messages.push({ dir: 'out', text, at: 'You · just now' });
    st.drafts[c.id] = ''; st.attach[c.id] = []; c.when = 'now'; App.render(); App.snack(c.channel === 'Email' ? 'Email sent.' : 'Message sent.');
  };
  acts.attach = () => { const c = cur(); const pool = [{ name: 'blood-test-form.pdf', size: '240 KB' }, { name: 'clinic-directions.png', size: '1.1 MB' }]; st.attach[c.id] = st.attach[c.id] || []; if (st.attach[c.id].length < 2) st.attach[c.id].push(pool[st.attach[c.id].length]); App.render(); };
  acts.unattach = el => { const c = cur(); st.attach[c.id].splice(+el.dataset.i, 1); App.render(); };
  acts['ask-ai'] = () => { const c = cur(); const d = App.$('#draft'); if (!c || !d) return;
    const last = [...c.messages].reverse().find(m => m.dir === 'in');
    const sug = c.channel === 'Email' ? `Hi ${c.name.split(' ')[0]},\n\nThanks for your message. I’ve checked with the team and will update you today.\n\nKind regards,\nMuhammad` : `Thanks ${c.name.split(' ')[0]}! ${/price|much|cost/i.test(last?.text || '') ? 'Our weight-loss plan starts at £149 a month, including a clinician review every four weeks.' : 'Happy to help — I’ll check and come back to you shortly.'}`;
    d.value = sug; st.drafts[c.id] = sug; App.$('[data-act=send]').disabled = false; d.focus(); App.snack('Draft suggested by AI. Check it before sending.', 'info'); };
  acts.assign = el => {
    const c = cur();
    const item = t => `<button data-pick="${t.id}" class="${c.assignee === t.id ? 'sel' : ''}"><span class="av sm">${App.initials(t.name)}</span><span class="two"><span>${esc(t.name)}</span><small>${t.role} · ${t.presence}</small></span>${c.assignee === t.id ? '<i class="ri-check-line check"></i>' : ''}</button>`;
    const html = list => `<div class="msearch"><div class="field sm"><span class="adorn"><i class="ri-search-line"></i></span><input placeholder="Search team…" aria-label="Search team"></div></div><div class="label">TEAM</div><div class="items">${list.map(item).join('')}</div><hr><button data-pick="none"><span class="av sm grey">–</span><span class="two"><span>Unassigned</span><small>Anyone can pick it up</small></span>${!c.assignee ? '<i class="ri-check-line check"></i>' : ''}</button>`;
    App.menu(el, html(S.team), v => { c.assignee = v === 'none' ? null : v; App.render(); App.snack(v === 'none' ? 'Conversation unassigned.' : `Assigned to ${member(v).name}.`); },
      { width: 300, onSearch: (q, m) => { m.querySelector('.items').innerHTML = S.team.filter(t => t.name.toLowerCase().includes(q.toLowerCase())).map(item).join('') || '<p class="caption" style="padding:8px 16px">No team members match.</p>'; } });
  };
  acts['conv-more'] = el => App.menu(el, `<button data-pick="unread"><i class="ri-mail-unread-line"></i>Mark as unread</button><button data-pick="lead"><i class="ri-user-search-line"></i>Open lead</button><hr><button data-pick="archive"><i class="ri-archive-line"></i>Archive conversation</button>`, v => {
    const c = cur();
    if (v === 'unread') { c.unread = true; App.go('#/inbox'); App.snack('Marked as unread.'); }
    if (v === 'lead') { const l = S.leads.find(l => l.conversationId === c.id); App.go(l ? '#/leads/' + l.id : '#/leads'); }
    if (v === 'archive') { const i = S.conversations.indexOf(c); S.conversations.splice(i, 1); App.go('#/inbox'); App.snack('Conversation archived.', 'success', { label: 'Undo', fn: () => { S.conversations.splice(i, 0, c); App.render(); } }); }
  });

  /* ---------- message templates (shared with Campaigns) ---------- */
  const ts = { tab: 'staff', cats: ['Appointments', 'Blood Tests'], q: '', type: 'Message', by: 'All', status: 'All', onUse: null };
  App.openTemplates = onUse => { ts.onUse = onUse; drawTemplates(); };
  function tplBody() {
    const pool = S.templates.filter(t => t.kind === ts.tab && (!ts.q || (t.title + t.body).toLowerCase().includes(ts.q.toLowerCase())) && (ts.status === 'All' || t.status === ts.status) && (ts.by === 'All' || t.by === ts.by));
    const cats = ts.cats.length ? ts.cats : S.templateCats;
    const groups = cats.map(cat => [cat, pool.filter(t => t.cat === cat)]).filter(g => g[1].length);
    if (!groups.length) return `<div class="empty"><span class="ic grey"><i class="ri-file-search-line"></i></span><h3 class="sub2" style="font-size:15px">No templates match</h3><p class="body2">Try another category, or clear the filters.</p><button class="btn outlined sm" data-act="tpl-clear">Clear filters</button></div>`;
    return groups.map(([cat, list]) => `<section class="tpl-group"><div class="row between"><h3 class="h6" style="font-size:18px">${esc(cat)} (${list.length})</h3></div><div class="tpl-grid">${list.map(t => `
      <article class="tpl"><div class="row g8">${App.chip('Note', 't-blue', 'sm filled')}<span class="grow"></span>${App.chip(t.status, t.status === 'Active' ? 't-green' : 't-orange', 'sm filled')}<button class="btn primary sm" data-act="tpl-use" data-id="${t.id}" ${t.status !== 'Active' ? 'disabled title="Only active templates can be used"' : ''}>Use Template</button></div>
      <h4>${esc(t.title)}</h4><p>${esc(t.body)}</p><div class="row between caption"><span>Created by ${esc(t.by)}</span><span>${t.date}</span></div></article>`).join('')}</div></section>`).join('');
  }
  function drawTemplates() {
    const n = k => S.templates.filter(t => t.kind === k).length;
    const counts = cat => S.templates.filter(t => t.kind === ts.tab && t.cat === cat).length;
    const by = ['All', ...new Set(S.templates.filter(t => t.kind === ts.tab).map(t => t.by))];
    App.dialog(`<div class="dlg-head"><div class="stack g12"><h2 id="dlg-title" class="h6">Message Templates (${S.templates.length})</h2>
        <div class="seg" role="tablist"><button role="tab" class="${ts.tab === 'standard' ? 'on' : ''}" aria-selected="${ts.tab === 'standard'}" data-act="tpl-tab" data-tab="standard">Standard Templates <span class="count">${n('standard')}</span></button><button role="tab" class="${ts.tab === 'staff' ? 'on' : ''}" aria-selected="${ts.tab === 'staff'}" data-act="tpl-tab" data-tab="staff">Staff Created Templates <span class="count">${n('staff')}</span></button></div></div>
        <button class="icon-btn s20" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button></div>
      <div class="dlg-body" style="flex:1 1 0">
        <div class="filters">${App.field('Search', `<span class="adorn"><i class="ri-search-line"></i></span><input data-in="tpl-q" value="${esc(ts.q)}" placeholder="Search templates by name…">`, { cls: 'search' })}
          ${App.select('Type', 'tpl-type', ['Message', 'Email'], ts.type)}${App.select('Created by', 'tpl-by', by, ts.by)}${App.select('Status', 'tpl-status', ['All', 'Active', 'Draft'], ts.status)}
          <button class="clear-btn" data-act="tpl-clear"><i class="ri-close-line"></i>Clear filters</button></div>
        <div class="tpl-layout"><div class="tpl-cats" role="group" aria-label="Template categories"><p class="caption" style="margin:4px 8px">Template Categories</p>
          ${S.templateCats.map(c => `<label class="cbx"><input type="checkbox" data-ch="tpl-cat" value="${esc(c)}" ${ts.cats.includes(c) ? 'checked' : ''}>${esc(c)}<span class="count">${counts(c)}</span></label>`).join('')}</div>
          <div class="tpl-groups" id="tpl-groups">${tplBody()}</div></div>
      </div>`, { wide: true });
  }
  const redrawGroups = () => { const g = App.$('#tpl-groups'); if (g) g.innerHTML = tplBody(); };
  acts['tpl-tab'] = el => { ts.tab = el.dataset.tab; ts.by = 'All'; drawTemplates(); };
  ins['tpl-q'] = el => { ts.q = el.value; redrawGroups(); };
  chs['tpl-cat'] = () => { ts.cats = App.$$('[data-ch=tpl-cat]:checked').map(i => i.value); redrawGroups(); };
  chs['tpl-by'] = el => { ts.by = el.value; redrawGroups(); }; chs['tpl-status'] = el => { ts.status = el.value; redrawGroups(); }; chs['tpl-type'] = el => { ts.type = el.value; };
  acts['tpl-clear'] = () => { ts.q = ''; ts.cats = []; ts.by = 'All'; ts.status = 'All'; drawTemplates(); };
  acts['tpl-use'] = el => { const t = S.templates.find(x => x.id === el.dataset.id); App.closeModal(); ts.onUse && ts.onUse(t); };
  acts['open-templates'] = () => { const c = cur(); App.openTemplates(t => { st.drafts[c.id] = t.body; App.render(); App.after(() => {}); App.snack(`“${t.title}” added to your reply.`, 'info'); }); };
})();

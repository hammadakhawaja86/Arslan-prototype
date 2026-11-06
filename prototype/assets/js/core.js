/* Core: state, routing, shell, menus, dialogs, drawers, snackbars. */
(function () {
  const S = window.SEED();
  const App = window.App = { S, routes: [], acts: {}, ins: {}, chs: {}, ui: {} };

  /* ---------- helpers ---------- */
  App.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.initials = n => (n || '?').replace(/^Dr\.? /, '').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  App.$ = (sel, root) => (root || document).querySelector(sel);
  App.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  App.go = hash => { if (location.hash === hash) App.render(); else location.hash = hash; };
  App.fmt = n => Number(n).toLocaleString('en-GB');
  App.nowStamp = () => { const d = new Date(); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + d.toTimeString().slice(0, 5); };
  App.status = id => S.statuses.find(s => s.id === id) || S.statuses[0];
  App.channelTone = ch => ({ Instagram: 't-insta', WhatsApp: 't-green', Email: 't-blue', Facebook: 't-blue', LinkedIn: 't-blue', TikTok: 't-grey' }[ch] || 't-grey');
  App.typeTone = t => ({ Customers: 't-green', Leads: 't-orange', Mixed: 't-blue', Clinician: 't-blue', Patient: 't-purple', Enquiry: 't-grey' }[t] || 't-grey');
  App.campTone = s => ({ Sent: 't-green', Scheduled: 't-blue', Draft: 't-grey', Sending: 't-orange' }[s] || 't-grey');
  App.field = (label, inner, opts = {}) =>
    `<div class="field ${opts.cls || ''}">${label ? `<label>${label}${opts.req ? ' <b>*</b>' : ''}</label>` : ''}${inner}</div>`;
  App.select = (label, name, options, value, opts = {}) =>
    App.field(label, `<select ${opts.attrs || ''} data-ch="${name}" aria-label="${App.esc(label || name)}">${options.map(o => { const v = typeof o === 'string' ? o : o.v; const t = typeof o === 'string' ? o : o.t; return `<option value="${App.esc(v)}" ${v === value ? 'selected' : ''}>${App.esc(t)}</option>`; }).join('')}</select>`, { cls: 'select ' + (opts.cls || '') });
  App.sw = (checked, attrs = '', label = '') => `<label class="sw" ${label ? `title="${App.esc(label)}"` : ''}><input type="checkbox" role="switch" ${checked ? 'checked' : ''} ${attrs} aria-label="${App.esc(label)}"><span class="trk"></span><span class="knb"></span></label>`;
  App.chip = (text, tone, cls = '') => `<span class="chip ${tone || ''} ${cls}">${App.esc(text)}</span>`;
  App.pager = (shown, total) => `<div class="pager"><span>Rows per page: <select aria-label="Rows per page"><option>10</option><option>25</option><option>50</option></select></span><span class="tnum">${total ? `1–${shown} of ${total}` : '0 of 0'}</span><span class="row g4"><button class="icon-btn s20" disabled aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></button><button class="icon-btn s20" ${shown >= total ? 'disabled' : ''} aria-label="Next page"><i class="ri-arrow-right-s-line"></i></button></span></div>`;
  App.head = (crumbs, title, sub, actions = '', badge = '') => `
    <nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c[1]}">${App.esc(c[0])}</a><span>/</span>` : `<span class="cur">${App.esc(c[0])}</span>`).join('')}</nav>
    <div class="page-head"><div class="titles"><div class="row"><h1 class="h5">${App.esc(title)}</h1>${badge}</div>${sub ? `<p class="body2 muted" style="margin:0">${sub}</p>` : ''}</div><div class="actions">${actions}</div></div>`;

  /* ---------- snackbars (notistack: top-right, max 3, 6s) ---------- */
  App.snack = (text, kind = 'success', action) => {
    let box = App.$('.snacks'); if (!box) { box = document.createElement('div'); box.className = 'snacks'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const icon = { success: 'ri-check-line', info: 'ri-information-line', error: 'ri-error-warning-line' }[kind];
    const el = document.createElement('div'); el.className = 'snack ' + kind; el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    const [t1, t2] = String(text).split('\n');
    el.innerHTML = `<i class="${icon}"></i><span>${App.esc(t1)}${t2 ? `<small style="display:block;font-weight:400;font-size:13px;opacity:.95">${App.esc(t2)}</small>` : ''}</span>${action ? `<button class="btn text sm" style="color:#fff">${App.esc(action.label)}</button>` : ''}<button class="icon-btn s20" aria-label="Close"><i class="ri-close-line" style="color:#fff"></i></button>`;
    const close = () => el.remove();
    el.querySelector('[aria-label=Close]').onclick = close;
    if (action) el.querySelector('.btn').onclick = () => { action.fn(); close(); };
    box.prepend(el); while (box.children.length > 3) box.lastChild.remove();
    setTimeout(close, 6000);
  };

  /* ---------- menus ---------- */
  App.closeMenu = () => { App.$$('.menu').forEach(m => m.remove()); document.removeEventListener('mousedown', App._menuOutside, true); };
  App._menuOutside = e => { if (!e.target.closest('.menu') && !e.target.closest('[data-menu-anchor]')) App.closeMenu(); };
  App.menu = (anchor, html, onPick, opts = {}) => {
    App.closeMenu();
    const m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'menu'); m.innerHTML = html;
    if (opts.width) m.style.width = opts.width + 'px';
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect(); const mw = m.offsetWidth, mh = m.offsetHeight;
    let left = opts.alignLeft ? r.left : r.right - mw; left = Math.max(8, Math.min(left, innerWidth - mw - 8));
    let top = r.bottom + 4; if (top + mh > innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    m.style.left = left + 'px'; m.style.top = top + 'px';
    anchor.setAttribute('aria-expanded', 'true');
    m.addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) { const v = b.dataset.pick; App.closeMenu(); anchor.setAttribute('aria-expanded', 'false'); onPick && onPick(v, b); } });
    const search = m.querySelector('input'); (search || m.querySelector('button'))?.focus();
    if (search && opts.onSearch) search.addEventListener('input', () => opts.onSearch(search.value, m));
    setTimeout(() => document.addEventListener('mousedown', App._menuOutside, true));
    return m;
  };

  /* ---------- dialogs & drawers ---------- */
  App.closeModal = () => { App.$$('.scrim, .drawer-scrim, .drawer').forEach(n => n.remove()); App._lastFocus?.focus?.(); };
  App.dialog = (html, opts = {}) => {
    App.closeModal(); App._lastFocus = document.activeElement;
    const s = document.createElement('div'); s.className = 'scrim';
    s.innerHTML = `<div class="dialog ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="dlg-title" ${opts.width ? `style="width:min(${opts.width}px,100%)"` : ''}>${html}</div>`;
    s.addEventListener('mousedown', e => { if (e.target === s && !opts.locked) App.closeModal(); });
    document.body.appendChild(s);
    (s.querySelector('[autofocus]') || s.querySelector('input, select, textarea, button'))?.focus();
    return s.firstElementChild;
  };
  App.drawer = html => {
    App.closeModal(); App._lastFocus = document.activeElement;
    const sc = document.createElement('div'); sc.className = 'drawer-scrim'; sc.onclick = App.closeModal;
    const d = document.createElement('aside'); d.className = 'drawer'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'dlg-title'); d.innerHTML = html;
    document.body.append(sc, d); (d.querySelector('[autofocus]') || d.querySelector('input, select, textarea, button'))?.focus();
    return d;
  };
  App.dlgHead = (title, sub, icon) => `<div class="dlg-head"><div class="row g12" style="align-items:flex-start">${icon ? `<span class="icon-circle"><i class="${icon}"></i></span>` : ''}<div class="stack g4"><h2 id="dlg-title" class="h6" style="font-size:18px;line-height:1.5">${title}</h2>${sub ? `<p class="caption" style="margin:0">${sub}</p>` : ''}</div></div><button class="icon-btn s20" data-act="close-modal" aria-label="Close"><i class="ri-close-line"></i></button></div>`;
  App.acts['close-modal'] = () => App.closeModal();

  /* ---------- shell ---------- */
  /* Sidebars per actor (Figma 1780:77930 + dashboards 1780:77960). Staff roles get one-module-at-a-time accordions; patients get flat sections. */
  const EHR = { id: 'ehr', group: 'EHR', items: [['Patients', 'ri-user-line', '#/patients', 'patients'], ['Inboxes', 'ri-clipboard-line', '#/inboxes', 'inboxes'], ['Appointments', 'ri-calendar-line', '#/appointments', 'appointments'], ['Billing', 'ri-money-pound-circle-line', '#/billing', 'billing'], ['Inventory', 'ri-archive-2-line', '#/inventory', 'inventory'], ['Documents & Forms', 'ri-file-copy-2-line', '#/documents', 'documents']] };
  const CRM = { id: 'crm', group: 'CRM', items: [['Inbox', 'ri-inbox-line', '#/inbox', 'inbox'], ['Segments', 'ri-group-line', '#/segments', 'segments'], ['Campaigns', 'ri-send-plane-line', '#/campaigns', 'campaigns'], ['Leads', 'ri-contacts-line', '#/leads', 'leads'], ['Automations', 'ri-node-tree'], ['Tags & Sources', 'ri-price-tag-3-line'], ['CRM Configuration', 'ri-equalizer-line', '#/settings/crm/statuses', 'crm-config']] };
  const HRM = { id: 'hrm', group: 'HRM', items: [['Staff Management', 'ri-team-line', '#/staff', 'staff'], ['ROTA Management', 'ri-calendar-schedule-line', '#/hrm/rota', 'rota'], ['Activity Tracker', 'ri-time-line', '#/hrm/activity', 'activity'], ['Leaves Management', 'ri-login-box-line', '#/hrm/leave', 'leave'], ['Compliance', 'ri-file-shield-2-line'], ['Recruitment', 'ri-user-search-line', '#/hrm/dashboard', 'hrm']] };
  const COMMS = { id: 'comms', group: 'Comms', items: [['Patient Comms', 'ri-user-voice-line'], ['Notification Management', 'ri-notification-3-line']] };
  const FIN = { id: 'finance', group: 'Finance', items: [['Payroll', 'ri-file-list-3-line'], ['Workforce Validation', 'ri-shield-check-line', '#/finance/validation', 'wfv']] };
  const COMP = { id: 'compliance', group: 'Compliance', items: [['CQC Compliance', 'ri-shield-check-line']] };
  const SUP = { id: 'support', group: 'Support', items: [['Survey', 'ri-survey-line'], ['Feedback', 'ri-feedback-line'], ['Colleague Survey', 'ri-clipboard-line']] };
  App.ROLES = {
    bm: { label: 'Business Manager', name: 'Muhammad Arslan', first: 'Muhammad', ini: 'MA', email: 'm.arslan@leafease.co.uk', icon: 'ri-briefcase-4-line', blurb: 'Run the practice — teams, revenue, CRM and hiring',
      nav: [EHR, CRM, HRM, COMMS, FIN, COMP, SUP] },
    clinician: { label: 'Clinician', name: 'Dr Sana Malik', first: 'Sana', ini: 'SM', email: 's.malik@leafease.co.uk', icon: 'ri-stethoscope-line', blurb: 'See your clinics, patients, requests and rota',
      nav: [EHR, { id: 'crm', group: 'CRM', items: CRM.items }, { id: 'hrm', group: 'HRM', items: [['ROTA Management', 'ri-calendar-schedule-line', '#/hrm/rota', 'rota'], ['Activity Tracker', 'ri-time-line', '#/hrm/activity', 'activity'], ['Leaves Management', 'ri-login-box-line', '#/hrm/leave', 'leave']] }, COMP, SUP] },
    admin: { label: 'Super Admin', name: 'Muhammad Arslan', first: 'Muhammad', ini: 'MA', email: 'admin@leafease.co.uk', icon: 'ri-shield-star-line', blurb: 'Manage organisations, users, plans and the platform', vertical: true,
      nav: [{ id: 'platform', group: 'Platform', items: [['Organisations', 'ri-building-2-line'], ['Users & Roles', 'ri-user-settings-line'], ['Subscription Plans', 'ri-vip-crown-2-line'], ['Audit Log', 'ri-file-list-2-line'], ['System Health', 'ri-pulse-line']] }, EHR, CRM, HRM, COMMS, FIN, COMP, SUP] },
    vadmin: { label: 'Vertical Admin', name: 'Muhammad Arslan', first: 'Muhammad', ini: 'MA', email: 'm.arslan@aqlios.com', icon: 'ri-stack-line', blurb: 'Oversee every business in the Private vertical', vertical: true,
      nav: [EHR, CRM, HRM, COMMS, FIN, COMP, SUP] },
    patient: { label: 'Patient', name: 'Ahmed Raza', first: 'Ahmed', ini: 'AR', email: 'ahmed.raza@example.com', icon: 'ri-heart-pulse-line', blurb: 'Book appointments and follow your care', flat: true,
      nav: [{ id: 'main', group: 'Main Menu', items: [['Dashboard', 'ri-dashboard-line', '#/dashboard', 'dashboard'], ['Appointment', 'ri-calendar-line', '#/appointments', 'appointments'], ['My Requests', 'ri-heart-add-line', '#/me/requests', 'me-req'], ['Billing', 'ri-money-pound-circle-line', '#/me/billing', 'me-bill']] },
        { id: 'general', group: 'General', items: [['Medical History', 'ri-file-add-line', '#/me/medical-history', 'me-mh'], ['Documents', 'ri-file-copy-2-line', '#/me/documents', 'me-docs'], ['Forms & Waivers', 'ri-file-list-3-line', '#/me/forms', 'me-forms'], ['Health Letters', 'ri-mail-open-line', '#/me/health-letters', 'me-letters'], ['Diet & Lifestyles', 'ri-leaf-line', '#/me/diet', 'me-diet'], ['Measurements & Vitals', 'ri-heart-pulse-line', '#/me/vitals', 'me-vitals'], ['My Profile', 'ri-user-line', '#/me/profile', 'me-profile']] },
        { id: 'account', group: 'Account', items: [['Notifications', 'ri-notification-3-line'], ['Account Settings', 'ri-settings-3-line']] },
        { id: 'help', group: 'Support', items: [['Support', 'ri-customer-service-2-line']] }] }
  };
  App.slug = l => l.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const store = App.store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} } };
  App.role = App.ROLES[store.get('leafease-role')] ? store.get('leafease-role') : null;
  const R = () => App.ROLES[App.role] || App.ROLES.bm;
  Object.defineProperty(App, 'NAV', { get: () => R().nav });
  App.me = () => R();
  /* Vertical Admins and Super Admins sign in at the Aqlios level and pick a vertical, then a business (verticals.js). */
  App.isVertical = () => !!R().vertical && !!App.role;
  const keyOf = it => it[3] || 'soon:' + App.slug(it[0]);
  const groupOf = key => (App.NAV.find(g => g.items.some(it => keyOf(it) === key)) || {}).id || null;
  /* which page keys this actor may open */
  App.allowed = key => { if (!key || key === 'dashboard') return true; const r = R(); if (r.nav.some(g => g.items.some(it => keyOf(it) === key))) return true;
    return key === 'soon:my-profile' || (key === 'analytics' && ['bm', 'admin', 'vadmin'].includes(App.role)) || (!r.flat && ['settings', 'soon:notifications', 'soon:help-and-support'].includes(key)); };
  App.nav = { open: 'crm', key: null, collapsed: store.get('leafease-nav-collapsed') === '1' };
  const item = ([label, icon, href, key], rail) => { if (!href) { const slug = App.slug(label); href = '#/soon/' + slug; key = 'soon:' + slug; } const on = key === App.nav.key; const attrs = `href="${href}" data-key="${key}"`;
    return `<a class="nav-item ${on ? 'active' : ''}" ${attrs} ${on ? 'aria-current="page"' : ''} ${rail ? `data-tip="${App.esc(label)}" aria-label="${App.esc(label)}"` : ''}><i class="${icon}"></i><span>${App.esc(label)}</span></a>`; };
  App.drawNav = () => {
    const n = App.nav, rail = n.collapsed && innerWidth > 900, sb = App.$('.sidebar'); if (!sb) return; const me = R();
    App.$('#app').classList.toggle('collapsed', rail);
    const user = `<button class="user-card" data-act="user-menu" data-menu-anchor aria-haspopup="menu" ${rail ? `data-tip="${App.esc(me.name)} · ${me.label}"` : ''}><span class="av lg" style="background:var(--primary);color:#fff">${me.ini}</span><div><b>${App.esc(me.name)}</b><span class="caption">${me.label}</span></div><i class="ri-expand-up-down-line uc-chev"></i></button>`;
    sb.innerHTML = `${rail ? `<div class="rail-top"><button class="expand-btn" data-act="collapse" aria-label="Expand sidebar" data-tip="Expand sidebar"><i class="ri-arrow-right-double-line"></i></button></div>`
        : App.bizLogo ? App.bizLogo() : `<div class="logo" aria-label="LeafEase"><b>Leaf</b><span>Ease</span><i class="ri-leaf-line"></i></div><button class="collapse-btn" data-act="collapse" aria-label="Collapse sidebar"><i class="ri-arrow-left-double-line"></i></button>`}
      <nav class="nav ${me.flat ? 'flat' : ''}" aria-label="Main menu">
        ${me.flat ? me.nav.map(g => `<div class="nav-sec"><div class="nav-sec-h">${g.group}</div>${g.items.map(it => item(it, rail)).join('')}</div>`).join('') : `
        ${rail ? `<button class="rail-search" data-act="soon" data-what="Search" aria-label="Search" data-tip="Search  ⌘K"><i class="ri-search-line"></i></button>` : `<div class="nav-search"><i class="ri-search-line"></i><span>Search…</span><kbd>⌘K</kbd></div>`}
        <div class="nav-label">Overview</div>
        ${item(['Dashboard', 'ri-dashboard-line', '#/dashboard', 'dashboard'], rail)}
        ${['bm', 'admin', 'vadmin'].includes(App.role) ? item(['Analytics', 'ri-bar-chart-box-line', '#/analytics', 'analytics'], rail) : ''}
        ${me.nav.map(g => { const open = n.open === g.id; return `<div class="nav-mod ${open ? 'open' : ''}"><button class="nav-group" data-act="toggle-group" data-g="${g.id}" aria-expanded="${open}" aria-controls="nav-${g.id}"><span>${g.group}</span><i class="${open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}"></i></button>
          <div class="nav-items" id="nav-${g.id}" ${open ? '' : 'hidden'}>${g.items.map(it => item(it, rail)).join('')}</div></div>`; }).join('')}`}
      </nav>
      <div class="nav-foot">${me.flat ? '' : `
        ${item(['Notifications', 'ri-notification-3-line'], rail)}
        <a class="nav-item ${n.key === 'settings' ? 'active' : ''}" href="#/settings/business" data-key="settings" ${rail ? 'data-tip="Settings" aria-label="Settings"' : ''}><i class="ri-settings-3-line"></i><span>Settings</span></a>
        ${rail ? '' : item(['Help & Support', 'ri-question-line'], rail)}`}
        ${user}
      </div>`;
  };
  App.acts['user-menu'] = el => { const me = R();
    App.menu(el, `<div class="label">Signed in as ${App.esc(me.label)}</div><div class="mi" style="cursor:default"><span class="two"><span>${App.esc(me.name)}</span><small>${App.esc(me.email)}</small></span></div><hr>
      <button data-pick="switch"><i class="ri-user-shared-line"></i>Switch role</button><button data-pick="out"><i class="ri-logout-box-r-line"></i>Sign out</button>`, v => {
      if (v === 'switch') App.go('#/login'); if (v === 'out') { App.signOut(); } }, { width: 260, alignLeft: true }); };
  App.signIn = role => { App.role = role; store.set('leafease-role', role); App.nav.key = null; App.nav.open = R().nav[0].id; App.drawNav(); };
  App.signOut = () => { App.role = null; store.set('leafease-role', null); App.go('#/login'); App.snack('You’ve been signed out.', 'info'); };
  App.shell = () => {
    document.body.innerHTML = `
    <a class="sr-only" href="#page">Skip to content</a>
    <div class="app" id="app">
      <aside class="sidebar" aria-label="Main navigation"></aside>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn mobile-menu" data-act="mobile-menu" aria-label="Open menu"><i class="ri-menu-line"></i></button>
          <div class="title"><i id="tb-icon"></i><span id="tb-title"></span></div>
          <div class="right">
            <button class="square-btn" data-act="soon" data-what="Global search" aria-label="Search"><i class="ri-search-line"></i></button>
            <button class="square-btn" data-act="tb-bell" aria-label="Notifications, 3 unread"><i class="ri-notification-3-line"></i><span class="dot"></span></button>
            <button class="workspace" data-act="ws-menu" data-menu-anchor aria-haspopup="menu"><span id="ws-name">leafease</span> <i class="ri-arrow-down-s-line"></i></button>
          </div>
        </header>
        <main class="page" id="page" tabindex="-1"></main>
      </div>
    </div>
    <div class="nav-tip" role="tooltip" hidden></div>
    <div class="prototype-tag"><i class="ri-flask-line"></i> Prototype · demo data <button data-act="reset">Reset</button></div>`;
    App.drawNav();
  };
  /* keep the module of the current page open; manual toggles stick until you move to another module */
  App.syncNav = key => { const g = groupOf(key); if (key !== App.nav.key) { if (g && g !== groupOf(App.nav.key)) App.nav.open = g; App.nav.key = key; App.drawNav(); } };
  App.acts.collapse = () => { App.nav.collapsed = !App.nav.collapsed; store.set('leafease-nav-collapsed', App.nav.collapsed ? '1' : '0'); App.$('.nav-tip').hidden = true; App.drawNav(); App.$(App.nav.collapsed ? '.expand-btn' : '.collapse-btn')?.focus(); };
  let wasWide = innerWidth > 900; window.addEventListener('resize', () => { const w = innerWidth > 900; if (w !== wasWide) { wasWide = w; App.drawNav(); } });
  App.acts['tb-bell'] = () => App.go('#/soon/notifications');
  App.deniedPage = meta => `<section class="soon"><div class="soon-bg" aria-hidden="true"></div><span class="soon-icon" style="background:rgba(211,47,47,.08);color:var(--error);box-shadow:0 0 0 10px rgba(211,47,47,.04)"><i class="ri-lock-2-line"></i></span><h1 class="soon-h1">You don’t have access to ${App.esc(meta.title || 'this page')}</h1><p class="soon-p">This area isn’t part of the ${App.esc(R().label)} workspace. Ask your practice admin if you think you need it.</p><div class="row g12 wrap" style="justify-content:center"><button class="btn primary lg" data-go="#/dashboard"><i class="ri-dashboard-line"></i>Go to dashboard</button><button class="btn outlined lg" data-go="#/login"><i class="ri-user-shared-line"></i>Switch role</button></div></section>`;
  App.acts['mobile-menu'] = () => App.$('#app').classList.toggle('menu-open');
  App.acts['toggle-group'] = el => { const g = el.dataset.g; App.nav.open = App.nav.open === g ? null : g; App.drawNav(); App.$(`[data-g="${g}"]`)?.focus(); };
  /* collapsed-rail tooltips (fixed position so the scrolling nav doesn't clip them) */
  document.addEventListener('mouseover', e => { const t = e.target.closest?.('.collapsed .sidebar [data-tip]'); const tip = App.$('.nav-tip'); if (!tip) return; if (!t) { tip.hidden = true; return; } const r = t.getBoundingClientRect(); tip.textContent = t.dataset.tip; tip.hidden = false; tip.style.top = (r.top + r.height / 2) + 'px'; tip.style.left = (r.right + 10) + 'px'; });
  document.addEventListener('focusin', e => { const t = e.target.closest?.('.collapsed .sidebar [data-tip]'); const tip = App.$('.nav-tip'); if (!tip) return; if (!t) { tip.hidden = true; return; } const r = t.getBoundingClientRect(); tip.textContent = t.dataset.tip; tip.hidden = false; tip.style.top = (r.top + r.height / 2) + 'px'; tip.style.left = (r.right + 10) + 'px'; });
  App.acts.soon = (el, e) => { e.preventDefault(); App.snack((el.dataset.what || 'This') + ' is outside this prototype.', 'info'); };
  App.acts.reset = () => { try { localStorage.removeItem('leafease-crm'); } catch (e) {} location.hash = '#/dashboard'; location.reload(); };

  /* ---------- routing ---------- */
  App.route = (pattern, fn, meta) => App.routes.push({ re: new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$'), fn, meta });
  /* Which of the app's scripts never ran. Every file registers at least one
     action, change handler or route, so one that registered nothing did not
     load — nearly always a stale or failed fetch of that one file. */
  App.missingScripts = () => { const js = window.__APP_JS__ || []; const seen = new Set();
    App.routes.forEach(r => seen.add(r.meta && r.meta.key));
    return js.filter(n => !(window.__LOADED__ || {})[n]); };
  App.lost = path => { const miss = App.missingScripts();
    document.title = 'Page did not load · LeafEase';
    const el = App.$('#app') || document.body;
    el.innerHTML = `<section class="soon" style="max-width:620px;margin:0 auto;padding:64px 24px;text-align:center">
      <span class="soon-icon" style="background:rgba(239,108,0,.08);color:var(--warning);box-shadow:0 0 0 10px rgba(239,108,0,.04)"><i class="ri-refresh-line"></i></span>
      <h1 class="soon-h1">This page didn’t load</h1>
      <p class="soon-p">The app couldn’t find <b>${App.esc(path)}</b>. That normally means the browser served an out-of-date copy of one of its files, so the screen was never registered. Reloading fetches a fresh copy and fixes it.</p>
      ${miss.length ? `<p class="caption">Didn’t load: ${miss.map(App.esc).join(', ')}</p>` : ''}
      <div class="row g12 wrap" style="justify-content:center;margin-top:8px">
        <button class="btn primary lg" onclick="location.reload()"><i class="ri-refresh-line"></i>Reload the page</button>
        <button class="btn outlined lg" onclick="location.hash='#/dashboard'"><i class="ri-dashboard-line"></i>Go to dashboard</button>
      </div></section>`; };
  App.render = () => {
    App.closeMenu();
    const path = (location.hash || '#/dashboard').slice(1).split('?')[0];
    /* No match used to fall through to App.routes[0] — the Inbox — so a script
       that failed to load silently showed the wrong page instead of saying so.
       An unmatched path now says what happened and offers the one fix. */
    const r = App.routes.find(r => r.re.test(path));
    if (!r) return App.lost(path);
    const args = (path.match(r.re) || []).slice(1);
    const meta = typeof r.meta === 'function' ? r.meta(...args) : r.meta;
    if (!App.role && !meta.public) { location.replace('#/login'); return; }
    if (App.isVertical() && !meta.public && !meta.portal && !App.bizId) { location.replace('#/private'); return; }
    const denied = !meta.public && (meta.portal ? !App.isVertical() : !App.allowed(meta.key));
    App.$('#app').classList.toggle('portal', !!meta.portal && !denied); if (App.$('#ws-name')) App.$('#ws-name').textContent = App.biz ? App.biz().ws : 'leafease';
    App.$('#tb-icon').className = meta.icon; App.$('#tb-title').textContent = meta.title;
    App.syncNav(meta.key);
    App.$('#app').classList.remove('menu-open'); App.$('#app').classList.toggle('public', !!meta.public);
    const page = App.$('#page'); page.innerHTML = denied ? App.deniedPage(meta) : (r.fn(...args) || ''); page.scrollTop = 0;
    if (App._after) { const f = App._after; App._after = null; f(); }
    if (App._focusPage) { page.focus(); App._focusPage = false; }
  };
  App.after = fn => { const prev = App._after; App._after = prev ? () => { prev(); fn(); } : fn; };

  /* ---------- global events (delegated) ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]');
    if (a && App.acts[a.dataset.act]) { App.acts[a.dataset.act](a, e); return; }
    const g = e.target.closest('[data-go]');
    if (g && !e.target.closest('button:not([data-go]), a:not([data-go]), input, label')) App.go(g.dataset.go);
  });
  document.addEventListener('input', e => { const t = e.target.closest('[data-in]'); if (t && App.ins[t.dataset.in]) App.ins[t.dataset.in](t, e); });
  document.addEventListener('change', e => { const t = e.target.closest('[data-ch]'); if (t && App.chs[t.dataset.ch]) App.chs[t.dataset.ch](t, e); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (App.$('.menu')) App.closeMenu(); else if (App.$('.scrim, .drawer')) { const locked = App.$('.scrim')?.dataset.locked; if (!locked) App.closeModal(); } }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-go][tabindex]')) { e.preventDefault(); App.go(e.target.dataset.go); }
  });
  window.addEventListener('hashchange', () => { App._focusPage = true; App.render(); });
  App.acts['ws-menu'] = (el, e) => App.isVertical() && App.bizMenu ? App.bizMenu(el) : App.acts['user-menu'](el, e);
  App.start = () => { App.shell(); if (!location.hash || location.hash === '#/') location.hash = !App.role ? '#/login' : App.isVertical() ? '#/verticals' : '#/dashboard'; App.render(); };
})();

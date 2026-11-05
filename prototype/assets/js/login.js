/* Sign-in with actor picker. Prototype only: any password works, nothing leaves the browser. */
(function () {
  const { esc, acts, ins, chs } = App;
  const ORDER = ['clinician', 'bm', 'vadmin', 'admin', 'patient'];
  let lg = null;
  App.route('/login', () => {
    if (!lg) lg = { role: App.role || 'bm', email: App.ROLES[App.role || 'bm'].email, pw: 'demo-password', show: false, tried: false, remember: true };
    const r = App.ROLES[lg.role]; const badEmail = lg.tried && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(lg.email); const badPw = lg.tried && !lg.pw;
    return `<div class="login">
      <aside class="login-brand"><div class="logo light" aria-label="LeafEase"><b>Leaf</b><span>Ease</span><i class="ri-leaf-line"></i></div>
        <div class="stack g16"><h1 class="lb-h">One place for your patients, your team and your practice.</h1><p class="lb-p">EHR, CRM and HRM in a single workspace — built for private clinics.</p>
          <ul class="lb-list">${[['ri-calendar-check-line', 'Appointments, records and requests together'], ['ri-team-line', 'Rotas, leave and hiring for the whole team'], ['ri-shield-check-line', 'CQC-ready compliance, out of the box']].map(([i, t]) => `<li><span><i class="${i}"></i></span>${t}</li>`).join('')}</ul></div>
        <p class="lb-foot">© 2026 LeafEase · Powered by Aqlios</p></aside>
      <main class="login-main"><form class="login-card" onsubmit="return false" novalidate aria-labelledby="login-h">
        <div class="stack g4"><h2 id="login-h" class="h5" style="font-weight:500">Welcome back</h2><p class="body2 muted" style="margin:0">Choose how you’re signing in today.</p></div>
        <div class="roles" role="radiogroup" aria-label="Sign in as">${ORDER.map(k => { const x = App.ROLES[k]; return `<button type="button" role="radio" aria-checked="${lg.role === k}" class="role-card ${lg.role === k ? 'on' : ''}" data-act="lg-role" data-v="${k}"><span class="rc-ic"><i class="${x.icon}"></i></span><span class="cell2"><b>${x.label}</b><small>${x.blurb}</small></span><span class="radio"></span></button>`; }).join('')}</div>
        <div class="stack g4">${App.field('Email address', `<input type="email" autocomplete="username" data-in="lg" data-k="email" value="${esc(lg.email)}">`, { cls: badEmail ? 'err' : '' })}${badEmail ? '<p class="helper err">Enter a valid email address</p>' : ''}</div>
        <div class="stack g4">${App.field('Password', `<input type="${lg.show ? 'text' : 'password'}" autocomplete="current-password" data-in="lg" data-k="pw" value="${esc(lg.pw)}"><button type="button" class="icon-btn s20" data-act="lg-show" aria-label="${lg.show ? 'Hide' : 'Show'} password"><i class="${lg.show ? 'ri-eye-off-line' : 'ri-eye-line'}"></i></button>`, { cls: badPw ? 'err' : '' })}${badPw ? '<p class="helper err">Enter your password</p>' : ''}</div>
        <div class="row between"><label class="cbx"><input type="checkbox" data-ch="lg-remember" ${lg.remember ? 'checked' : ''}>Remember me</label><a href="#" class="link" data-act="soon" data-what="Password reset">Forgot password?</a></div>
        <button type="submit" class="btn primary lg full" data-act="lg-go">Sign in as ${r.label}</button>
        <div class="or"><span>or</span></div>
        <button type="button" class="btn outlined lg full" data-act="soon" data-what="Single sign-on"><i class="ri-microsoft-fill"></i>Continue with Microsoft</button>
        <p class="caption proto-hint"><i class="ri-flask-line"></i> Prototype: the demo email is filled in for each role and any password works.</p></form></main></div>`;
  }, { key: '', icon: 'ri-login-box-line', title: 'Sign in', public: true });
  acts['lg-role'] = el => { lg.role = el.dataset.v; lg.email = App.ROLES[lg.role].email; lg.tried = false; App.render(); App.$(`[data-v="${lg.role}"]`)?.focus(); };
  ins.lg = el => { lg[el.dataset.k] = el.value; };
  acts['lg-show'] = () => { lg.show = !lg.show; App.render(); App.$('[data-k=pw]')?.focus(); };
  chs['lg-remember'] = el => { lg.remember = el.checked; };
  acts['lg-go'] = () => { if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(lg.email) || !lg.pw) { lg.tried = true; App.render(); return; }
    const role = lg.role; lg = null; App.signIn(role); App.go(App.isVertical() ? '#/verticals' : '#/dashboard'); App.snack(`Signed in as ${App.ROLES[role].label}.`); };
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest?.('.login-card input')) { e.preventDefault(); acts['lg-go'](); } });
})();

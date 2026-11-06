/* EHR › Inventory — Stock list, item record (batches + movements), add/edit item, receive stock, adjust / quarantine / destroy,
   Orders & deliveries (purchase orders, suppliers, reorder suggestions) and Stock takes. */
(function () {
  const { esc, acts, ins, chs } = App; const IV = App.IV; const u = IV.ui;
  const D = () => IV.D;
  const TYPES = ['Medicine', 'Vaccine', 'Consumable', 'Device'];
  const STORAGE = ['Room temperature', 'Fridge 2–8 °C', 'CD cabinet', 'Freezer'];
  const REASONS_OUT = ['Damaged / broken', 'Expired — for destruction', 'Patient return — for destruction', 'Returned to supplier', 'Stock count correction', 'Used in clinic', 'Transferred to another site'];
  const REASONS_IN = ['Stock count correction', 'Found / previously unrecorded', 'Transferred from another site'];
  const flags = it => { const out = []; if (!it.active) out.push(IV.chip('Archived', 't-grey')); if (IV.isLow(it)) out.push(IV.chip('Low stock', 't-red', '', 'solid')); if (IV.isExpiring(it)) out.push(IV.chip('Expiry', 't-orange', '', 'solid')); if (IV.held(it.id)) out.push(IV.chip(`${IV.held(it.id)} held`, 't-grey', 'ri-forbid-2-line'));
    if (IV.isCD(it)) out.push(`<span class="chip sm">Controlled</span>`); if (IV.cold(it)) out.push(IV.chip('Fridge', 't-blue', 'ri-temp-cold-line')); return out.join(''); };

  /* ======================= STOCK LIST ======================= */
  const FL = ['All', 'Low stock', 'Expiring soon', 'Not for use', 'Controlled', 'Fridge', 'Archived'];
  IV.tabs.stock = () => { const q0 = IV.query(); if (q0) { u.flag = { low: 'Low stock', exp: 'Expiring soon', held: 'Not for use' }[q0] || 'All'; u.page = 0; history.replaceState(null, '', '#/inventory/stock'); }
    const all = D().items, q = u.q.toLowerCase();
    const test = { All: i => i.active, 'Low stock': i => i.active && IV.isLow(i), 'Expiring soon': i => i.active && IV.isExpiring(i), 'Not for use': i => IV.held(i.id) > 0, Controlled: i => i.active && IV.isCD(i), Fridge: i => i.active && IV.cold(i), Archived: i => !i.active };
    const l = all.filter(i => test[u.flag](i) && (u.type === 'All' || i.type === u.type) && (!q || (i.name + i.dmd + i.location).toLowerCase().includes(q)));
    const cnt = k => all.filter(test[k]).length;
    return IV.frame('stock', `<section class="card card-pad stack g16">
      <div class="iv-bar">${App.field('', `<span class="adorn"><i class="ri-search-line"></i></span><input data-in="iv-q" value="${esc(u.q)}" placeholder="Search items, dm+d code or location" aria-label="Search items">`, { cls: 'search sm' })}
        ${App.select('Type', 'iv-type', ['All', ...TYPES].map(t => ({ v: t, t: t === 'All' ? 'All types' : t })), u.type, { cls: 'sm' })}
        <div class="row g8 wrap">${FL.map(k => `<button class="chip-btn ${u.flag === k ? 'on' : ''}" data-act="iv-flag" data-v="${k}">${k}${k === 'All' ? '' : ` (${cnt(k)})`}</button>`).join('')}</div>
        <span class="grow"></span><button class="btn outlined" data-act="iv-adjust"><i class="ri-equalizer-line"></i>Adjust</button><button class="btn primary" data-act="iv-item-edit"><i class="ri-add-circle-line"></i>Add item</button></div>
      <div class="table-card"><div class="table-scroll"><table class="dt iv-dt"><thead><tr><th>Item</th><th>Type</th><th>On hand</th><th>Reorder level</th><th>Cost</th><th>Sale</th><th>Next expiry</th><th></th><th class="r">Action</th></tr></thead><tbody>
      ${l.slice(u.page * 10, u.page * 10 + 10).map(i => `<tr class="iv-click" data-go="#/inventory/item/${i.id}" tabindex="0"><td><b class="fw5">${esc(i.name)}</b><small class="cell-sub">${IV.legalChip(i)} <span>${esc(i.location)}</span></small></td><td>${i.type}</td><td class="tnum">${IV.qtyTxt(i, IV.onHand(i.id))}</td><td class="tnum">${i.reorder || '—'}</td><td class="tnum">${IV.money(i.cost)}</td><td class="tnum">${i.sale ? IV.money(i.sale) : '£0.00'}</td><td class="tnum">${IV.nextExpiry(i.id) ? IV.dd(IV.nextExpiry(i.id)) : '—'}</td><td><span class="row g4 wrap">${flags(i)}</span></td>
        <td class="r"><span class="row-actions"><button class="icon-btn s20" data-act="iv-receive" data-item="${i.id}" title="Receive stock" aria-label="Receive stock for ${esc(i.name)}"><i class="ri-inbox-archive-line"></i></button><button class="icon-btn s20" data-go="#/inventory/item/${i.id}" title="View" aria-label="View ${esc(i.name)}"><i class="ri-eye-line"></i></button></span></td></tr>`).join('') || IV.empty(9, `No items match. <button class="btn text brand sm" data-act="iv-clear">Clear filters</button>`)}
      </tbody></table></div>${IV.pager(l.length, u.page, 'iv-pg')}</div></section>`, { actions: `<button class="btn outlined" data-act="iv-receive"><i class="ri-inbox-archive-line"></i>Receive stock</button>` }); };
  ins['iv-q'] = el => { u.q = el.value; u.page = 0; IV.keep(); const n = App.$('[data-in=iv-q]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  chs['iv-type'] = el => { u.type = el.value; u.page = 0; IV.keep(); };
  acts['iv-flag'] = el => { u.flag = el.dataset.v; u.page = 0; IV.keep(); };
  acts['iv-pg'] = el => { u.page += +el.dataset.v; IV.keep(); };
  acts['iv-clear'] = () => { Object.assign(u, { q: '', type: 'All', flag: 'All', page: 0 }); App.render(); };

  /* ======================= ITEM RECORD ======================= */
  const BS = { Available: 't-green', Quarantined: 't-orange', Expired: 't-red', Recalled: 't-red', Destroyed: 't-grey', Returned: 't-grey', 'Used up': 't-grey' };
  App.route('/inventory/item/:id', id => { IV.sync(); const it = IV.item(id); if (!it) return IV.frame('stock', IV.note('This item doesn’t exist any more. <a href="#/inventory/stock">Back to stock</a>', 'warn'));
    const bs = IV.batchesOf(id).sort((a, b) => (b.qty > 0) - (a.qty > 0) || ((a.expiry || '9') < (b.expiry || '9') ? -1 : 1)), mv = D().moves.filter(m => m.item === id).sort((a, b) => a.at < b.at ? 1 : -1);
    const out90 = -mv.filter(m => m.qty < 0 && ['Dispensed', 'Administered', 'Used in clinic'].includes(m.type) && (Date.now() - new Date(m.at)) / IV.DAY <= 90).reduce((n, m) => n + m.qty, 0);
    const bAct = b => { if (!b.qty) return ''; const c = []; if (b.status === 'Available') c.push(`<button class="btn text sm" data-act="iv-quar" data-b="${b.id}">Quarantine</button>`);
      if (b.status === 'Quarantined') c.push(`<button class="btn text brand sm" data-act="iv-release" data-b="${b.id}">Release</button>`);
      if (b.status !== 'Available') c.push(`<button class="btn text sm iv-danger-t" data-act="iv-destroy" data-b="${b.id}">Destroy / return</button>`); else c.push(`<button class="btn text sm" data-act="iv-adjust" data-item="${it.id}" data-b="${b.id}">Adjust</button>`); return c.join(''); };
    return `<nav class="crumbs" aria-label="Breadcrumb"><a href="#/inventory">Inventory</a><span>/</span><a href="#/inventory/stock">Stock</a><span>/</span><span class="cur">${esc(it.name)}</span></nav>
      <div class="iv-head"><div class="stack g8"><h1 class="iv-h1">${esc(it.name)}</h1><div class="row g8 wrap">${IV.legalChip(it)}${IV.chip(it.type, 't-grey')}${flags(it)}</div></div>
        <div class="row g8 wrap"><button class="btn outlined" data-act="iv-item-edit" data-item="${it.id}"><i class="ri-edit-line"></i>Edit item</button><button class="btn outlined" data-act="iv-adjust" data-item="${it.id}"><i class="ri-equalizer-line"></i>Adjust</button><button class="btn outlined" data-act="iv-po-new" data-item="${it.id}"><i class="ri-shopping-cart-2-line"></i>Order</button><button class="btn primary" data-act="iv-receive" data-item="${it.id}"><i class="ri-inbox-archive-line"></i>Receive stock</button></div></div>
      ${it.notes ? IV.note(esc(it.notes), 'info') : ''}
      <div class="iv-tiles">${[['ri-archive-2-line', 'teal', IV.qtyTxt(it, IV.onHand(id)), 'Available to use'], ['ri-forbid-2-line', 'grey', IV.qtyTxt(it, IV.held(id)), 'Quarantined or expired'], ['ri-money-pound-circle-line', 'green', IV.money(IV.onHand(id) * it.cost), 'Stock value at cost'], ['ri-line-chart-line', 'orange', IV.qtyTxt(it, out90), 'Used in the last 90 days']].map(([i, t, n, s]) => `<div class="iv-tile static"><span class="bl-ic ${t}"><i class="${i}"></i></span><span class="grow"><b class="tnum">${n}</b><small>${s}</small></span></div>`).join('')}</div>
      <div class="iv-two wide-l">
        <div class="stack g16">
          <section class="card"><div class="card-head"><h2 class="h6">Batches</h2><span class="caption">Dispensed earliest expiry first</span></div><div class="table-scroll"><table class="dt iv-dt"><thead><tr><th>Batch</th><th>Expiry</th><th>Quantity</th><th>Status</th><th>Received</th><th class="r">Actions</th></tr></thead><tbody>
            ${bs.map(b => { const dt = IV.daysTo(b.expiry); return `<tr class="${b.qty ? '' : 'iv-dim'}"><td class="fw5">${esc(b.batch)}<small class="cell-sub">${esc(IV.sup(b.supplier).name)} · ${esc(b.inv || '')}</small></td><td class="tnum">${b.expiry ? IV.dd(b.expiry) : '—'}${b.expiry && b.status === 'Available' && dt <= D().settings.expiryDays ? `<small class="cell-sub warn">${dt} days left</small>` : ''}</td><td class="tnum">${IV.qtyTxt(it, b.qty)}</td><td>${IV.chip(b.qty ? b.status : 'Used up', BS[b.qty ? b.status : 'Used up'])}${b.why ? `<small class="cell-sub">${esc(b.why)}</small>` : ''}</td><td class="tnum">${IV.dd(b.received)}</td><td class="r"><span class="row-actions">${bAct(b)}</span></td></tr>`; }).join('') || IV.empty(6, 'No batches yet. Receive a delivery to add one.')}</tbody></table></div></section>
          <section class="card"><div class="card-head"><h2 class="h6">Stock movements</h2><span class="caption">Audit trail — entries can’t be edited or deleted</span></div><div class="table-scroll"><table class="dt iv-dt"><thead><tr><th>Date</th><th>Movement</th><th>Batch</th><th class="r">Qty</th><th>Reference</th><th>By</th></tr></thead><tbody>
            ${mv.slice(0, 12).map(m => `<tr><td class="tnum">${IV.dt(m.at)}</td><td>${esc(m.type)}${m.reason || m.note ? `<small class="cell-sub">${esc(m.reason || m.note)}</small>` : ''}</td><td>${esc(IV.batch(m.batch)?.batch || '—')}</td><td class="r tnum ${m.qty > 0 ? 'iv-pos' : m.qty < 0 ? 'iv-neg' : ''}">${m.qty > 0 ? '+' : ''}${m.qty || '—'}</td><td>${esc(m.ref || '—')}${m.party ? `<small class="cell-sub">${IV.partyLink(m)}</small>` : ''}</td><td>${esc(m.by)}${m.witness ? `<small class="cell-sub">Witness: ${esc(m.witness)}</small>` : ''}</td></tr>`).join('') || IV.empty(6, 'No movements yet.')}</tbody></table></div>${mv.length > 12 ? `<div class="card-pad" style="padding:12px 16px"><a class="btn text brand sm" href="#/inventory/records" data-act="iv-mv-item" data-item="${it.id}">See all ${mv.length} movements</a></div>` : ''}</section>
        </div>
        <section class="card card-pad stack g16"><h2 class="h6">Item details</h2>${IV.kv([['Legal category', (IV.LEGAL[it.legal] || [it.legal])[0]], ['Form / unit', esc(it.unit) + (it.pack > 1 ? ` · pack of ${it.pack}` : '')], ['dm+d code', esc(it.dmd || '—')], ['Storage', esc(it.storage)], ['Location', esc(it.location)], ['Main supplier', esc(IV.sup(it.supplier).name)], ['Cost per unit', IV.money(it.cost)], ['Sale per unit', it.sale ? IV.money(it.sale) + (it.cost ? ` <small class="muted">· ${Math.round((it.sale - it.cost) / it.sale * 100)}% margin</small>` : '') : 'Not sold'], ['VAT', it.vat + '%'], ['Reorder level', it.reorder ? `${it.reorder} · reorder ${it.reorderQty}` : 'Not set'], IV.isCD(it) && ['Register', IV.registerCD(it) ? 'CD register — required' : 'Voluntary record (practice policy)']])}
          ${IV.isCD(it) ? `<a class="btn outlined block" href="#/inventory/cd" data-act="iv-cd-open" data-item="${it.id}"><i class="ri-book-2-line"></i>Open CD register</a>` : ''}
          <button class="btn text sm ${it.active ? 'iv-danger-t' : 'brand'}" data-act="iv-archive" data-item="${it.id}">${it.active ? 'Archive item' : 'Restore item'}</button></section>
      </div>`; }, IV.meta);
  acts['iv-mv-item'] = el => { u.mq = IV.item(el.dataset.item).name; u.rec = 'moves'; };
  acts['iv-cd-open'] = el => { u.cd = el.dataset.item; };
  acts['iv-archive'] = el => { const it = IV.item(el.dataset.item);
    if (it.active && IV.onHand(it.id)) { App.snack(`${it.name} still has stock. Use it up, return it or adjust it to zero before archiving.`, 'error'); return; }
    it.active = !it.active; IV.save(); App.render(); App.snack(it.active ? 'Item restored.' : 'Item archived. Its history is kept.'); };

  /* ---------- add / edit item ---------- */
  acts['iv-item-edit'] = el => { const it = el.dataset.item ? IV.item(el.dataset.item) : { name: '', type: 'Medicine', legal: 'POM', storage: 'Room temperature', location: '', unit: 'tablets', pack: 28, dmd: '', cost: '', sale: '', vat: 0, reorder: '', reorderQty: '', supplier: 's1', notes: '' };
    const dlg = IV.dlg(it.id ? 'Edit item' : 'Add stock item', it.id ? esc(it.name) : 'Add a medicine, vaccine, consumable or device this business keeps in stock.', `
      <div class="iv-g2">${IV.input('Item name', 'name', it.name, { req: true, cls: 'iv-span2', ph: 'e.g. Amoxicillin 500mg capsules' })}
        ${IV.sel('Type', 'type', TYPES, it.type, { req: true })}${IV.sel('Legal category', 'legal', Object.entries(IV.LEGAL).map(([k, [t]]) => [k, t]), it.legal, { req: true })}
        ${IV.input('Unit (plural)', 'unit', it.unit, { req: true, ph: 'tablets, pens, vials' })}${IV.input('Pack size', 'pack', it.pack, { type: 'number', attrs: 'min="1"' })}
        ${IV.input('dm+d code (optional)', 'dmd', it.dmd, { ph: 'Dictionary of medicines and devices' })}${IV.sel('Main supplier', 'supplier', D().sup.map(s => [s.id, s.name]), it.supplier)}
        ${IV.sel('Storage', 'storage', STORAGE, it.storage, { req: true })}${IV.input('Location', 'location', it.location, { req: true, ph: 'e.g. Dispensary · Shelf A2' })}
        ${IV.input('Cost per unit', 'cost', it.cost, { type: 'number', pre: '£', attrs: 'step="0.01" min="0"', req: true })}${IV.input('Sale per unit', 'sale', it.sale, { type: 'number', pre: '£', attrs: 'step="0.01" min="0"' })}
        ${IV.sel('VAT', 'vat', [[0, '0% (zero-rated / exempt)'], [5, '5%'], [20, '20% (standard)']], it.vat)}<span></span>
        ${IV.input('Reorder level', 'reorder', it.reorder, { type: 'number', attrs: 'min="0"', post: 'units' })}${IV.input('Reorder quantity', 'reorderQty', it.reorderQty, { type: 'number', attrs: 'min="0"', post: 'units' })}
        ${IV.area('Notes for staff (optional)', 'notes', it.notes, { rows: 2 })}</div>
      <div class="iv-legal-hint"></div>`, `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-item-save" data-item="${it.id || ''}">${it.id ? 'Save changes' : 'Add item'}</button>`, { width: 720 });
    const hint = () => { const v = IV.vals(dlg); const h = App.$('.iv-legal-hint', dlg);
      h.innerHTML = v.legal === 'CD2' || v.legal === 'CD3' ? IV.note(`<b>Controlled drug.</b> Store in a locked CD cabinet that meets the Safe Custody Regulations. ${v.legal === 'CD2' ? 'Every receipt and supply goes in the CD register.' : 'Register entries are kept by practice policy.'} Stock changes need a witness.`, 'warn', 'ri-lock-2-line')
        : v.legal.startsWith('CD') ? IV.note('Schedule 4/5 controlled drug. Prescriptions are valid for 28 days. A register isn’t legally required; the practice can keep one voluntarily.', 'info', 'ri-lock-2-line')
        : v.storage.startsWith('Fridge') ? IV.note('Cold chain item. Choose a fridge in Location so this stock is quarantined automatically if that fridge goes out of range.', 'info', 'ri-temp-cold-line') : ''; };
    dlg.addEventListener('change', hint); hint(); };
  acts['iv-item-save'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg); IV.clearErr(dlg); let bad = false;
    ['name', 'unit', 'location'].forEach(k => { if (!v[k]) { IV.err(dlg, k, 'Required'); bad = true; } });
    if (v.cost === '' || +v.cost < 0) { IV.err(dlg, 'cost', 'Enter the cost per unit'); bad = true; }
    if (v.name && D().items.some(i => i.name.toLowerCase() === v.name.toLowerCase() && i.id !== el.dataset.item)) { IV.err(dlg, 'name', 'An item with this name already exists'); bad = true; }
    if (v.legal.startsWith('CD') && v.storage !== 'CD cabinet' && ['CD2', 'CD3'].includes(v.legal)) { IV.err(dlg, 'storage', 'Schedule 2 and 3 controlled drugs must be kept in the CD cabinet'); bad = true; }
    if (bad) { IV.firstErr(dlg); return; }
    const data = { name: v.name, type: v.type, legal: v.legal, unit: v.unit, pack: +v.pack || 1, dmd: v.dmd, supplier: v.supplier, storage: v.storage, location: v.location, cost: +v.cost, sale: +v.sale || 0, vat: +v.vat, reorder: +v.reorder || 0, reorderQty: +v.reorderQty || 0, notes: v.notes };
    let it = IV.item(el.dataset.item); if (it) Object.assign(it, data); else { it = Object.assign({ id: 'i' + (D().items.length + 1) + '-' + Date.now().toString(36).slice(-3), active: true }, data); D().items.push(it); }
    IV.save(); App.closeModal(); App.go('#/inventory/item/' + it.id); App.render(); App.snack(el.dataset.item ? 'Item updated.' : `${it.name} added. Receive a delivery to add stock.`); };

  /* ---------- receive stock (also used for each purchase-order line) ---------- */
  acts['iv-receive'] = el => { const pre = el.dataset.item || '', items = D().items.filter(i => i.active);
    const dlg = IV.dlg('Receive stock', 'Check the delivery against the delivery note before you add it to stock.', `
      <div class="iv-g2">${IV.sel('Stock item', 'item', items.map(i => [i.id, i.name]), pre, { req: true, ph: 'Choose an item', cls: 'iv-span2' })}
        ${IV.sel('Supplier', 'supplier', D().sup.map(s => [s.id, s.name]), pre ? IV.item(pre).supplier : 's1', { req: true })}${IV.input('Invoice / delivery note no.', 'inv', '', { req: true, ph: 'e.g. INV-40213' })}
        ${IV.input('Batch / lot number', 'batch', '', { req: true })}${IV.input('Expiry date', 'expiry', '', { type: 'date', req: true })}
        ${IV.input('Quantity received', 'qty', '', { type: 'number', req: true, attrs: 'min="1"', post: '<span class="iv-unit">units</span>' })}${IV.input('Cost per unit', 'cost', pre ? IV.item(pre).cost : '', { type: 'number', pre: '£', attrs: 'step="0.01" min="0"' })}</div>
      <div class="iv-rc-extra"></div>
      <fieldset class="iv-checks"><legend>Delivery checks</legend>${IV.check('ok1', 'Items, strengths and quantities match the delivery note', false)}${IV.check('ok2', 'Packaging intact, no damage or tampering', false)}${IV.check('ok3', 'Expiry date is long enough for how we use this item', false)}</fieldset>`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-receive-save">Add to stock</button>`, { width: 680 });
    const upd = () => { const v = IV.vals(dlg), it = IV.item(v.item), box = App.$('.iv-rc-extra', dlg); App.$('.iv-unit', dlg).textContent = it ? it.unit : 'units';
      const want = (it && IV.cold(it) ? 'c' : '') + (it && IV.isCD(it) ? 'd' : ''); if (box.dataset.k === want) return; box.dataset.k = want;
      box.innerHTML = (it && IV.cold(it) ? `${IV.note('<b>Cold chain.</b> Record the temperature on arrival. Put the stock in the fridge straight away — refuse it if it’s outside 2–8 °C or arrived warm.', 'info', 'ri-temp-cold-line')}<div class="iv-g2" style="margin-top:12px">${IV.input('Temperature on arrival', 'temp', '', { type: 'number', req: true, attrs: 'step="0.1"', post: '°C' })}${IV.sel('Put into', 'fridge', D().fridges.map(f => [f.name, f.name]), it.location)}</div>` : '')
        + (it && IV.isCD(it) ? `${IV.note(`<b>Controlled drug.</b> ${IV.registerCD(it) ? 'This receipt is written to the CD register.' : 'Recorded in the practice’s voluntary CD record.'} A second member of staff must witness it.`, 'warn', 'ri-lock-2-line')}<div class="iv-g2" style="margin-top:12px">${IV.sel('Witness', 'witness', IV.staff().filter(s => s !== IV.me()), '', { req: true, ph: 'Choose a witness' })}</div>` : ''); };
    dlg.addEventListener('change', upd); upd(); };
  acts['iv-receive-save'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), it = IV.item(v.item); IV.clearErr(dlg); let bad = false;
    if (!it) { IV.err(dlg, 'item', 'Choose an item'); bad = true; }
    ['inv', 'batch', 'expiry'].forEach(k => { if (!v[k]) { IV.err(dlg, k, 'Required'); bad = true; } });
    if (!(+v.qty > 0)) { IV.err(dlg, 'qty', 'Enter how many arrived'); bad = true; }
    if (v.expiry && IV.daysTo(v.expiry) < 0) { IV.err(dlg, 'expiry', 'This stock has already expired — refuse the delivery'); bad = true; }
    if (it && IV.cold(it)) { if (v.temp === '') { IV.err(dlg, 'temp', 'Record the arrival temperature'); bad = true; } else if (+v.temp < 2 || +v.temp > 8) { IV.err(dlg, 'temp', 'Outside 2–8 °C — don’t accept. Quarantine and contact the supplier.'); bad = true; } }
    if (it && IV.isCD(it) && !v.witness) { IV.err(dlg, 'witness', 'A witness is required for controlled drugs'); bad = true; }
    ['ok1', 'ok2', 'ok3'].forEach(k => { if (!v[k]) { IV.err(dlg, k); bad = true; } });
    if (bad) { IV.firstErr(dlg); return; }
    if (IV.daysTo(v.expiry) < 90 && !dlg.dataset.short) { dlg.dataset.short = 1; App.$('.iv-rc-extra', dlg).insertAdjacentHTML('afterbegin', IV.note(`<b>Short expiry:</b> this batch expires in ${IV.daysTo(v.expiry)} days. Press “Add to stock” again to accept it anyway.`, 'warn')); return; }
    const b = { id: 'b' + IV.id('b'), item: it.id, batch: v.batch.toUpperCase(), expiry: v.expiry, qty: 0, received: IV.iso(new Date()), supplier: v.supplier, status: 'Available', inv: v.inv };
    D().batches.push(b); const s = IV.sup(v.supplier); if (v.cost !== '') it.cost = +v.cost;
    IV.move(it.id, b.id, 'Received', +v.qty, { ref: v.inv, party: `${s.name}, ${s.licence}`, witness: v.witness || '', note: v.temp ? `Arrival temperature ${v.temp} °C · stored in ${v.fridge}` : '' });
    IV.save(); App.closeModal(); App.render(); App.snack(`${IV.qtyTxt(it, +v.qty)} of ${it.name} added to stock.${IV.isCD(it) ? '\nCD register updated.' : ''}`); };

  /* ---------- adjust ---------- */
  acts['iv-adjust'] = el => { const items = D().items.filter(i => i.active), pre = el.dataset.item || '';
    const dlg = IV.dlg('Adjust stock', 'Record stock that has gone out or come back for a reason other than dispensing.', `
      <div class="iv-g2">${IV.sel('Stock item', 'item', items.map(i => [i.id, i.name]), pre, { req: true, ph: 'Choose an item', cls: 'iv-span2' })}
        <div class="iv-bsel iv-span2"></div>
        ${IV.sel('Direction', 'dir', [['out', 'Remove stock'], ['in', 'Add stock']], 'out', { req: true })}${IV.input('Quantity', 'qty', '', { type: 'number', req: true, attrs: 'min="1"' })}
        <div class="iv-rsn iv-span2"></div>${IV.area('Notes', 'note', '', { rows: 2, ph: 'What happened? This goes in the audit trail.' })}</div><div class="iv-adj-extra"></div>`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-adjust-save">Save adjustment</button>`, { width: 640 });
    const upd = e => { const v = IV.vals(dlg), it = IV.item(v.item);
      if (!e || e.target.name === 'item') App.$('.iv-bsel', dlg).innerHTML = it ? IV.sel('Batch', 'b', IV.batchesOf(it.id).filter(b => b.qty > 0 || b.status === 'Available').map(b => [b.id, `${b.batch} · ${b.expiry ? 'exp ' + IV.dd(b.expiry) + ' · ' : ''}${b.qty} ${it.unit} · ${b.status}`]), el.dataset.b || '', { req: true, ph: 'Choose a batch' }) : '';
      if (!e || ['item', 'dir'].includes(e.target.name)) App.$('.iv-rsn', dlg).innerHTML = IV.sel('Reason', 'reason', v.dir === 'in' ? REASONS_IN : REASONS_OUT, '', { req: true, ph: 'Choose a reason' });
      App.$('.iv-adj-extra', dlg).innerHTML = it && IV.isCD(it) ? `${IV.note(`<b>Controlled drug.</b> A witness must sign every adjustment.${it.legal === 'CD2' && /Expired/.test(v.reason || '') ? ' Destroying expired Schedule 2 stock needs an <b>authorised witness</b> appointed by the CD accountable officer.' : ''} Any discrepancy must be reported to the CD accountable officer.`, 'warn', 'ri-lock-2-line')}<div class="iv-g2" style="margin-top:12px">${IV.sel('Witness', 'witness', IV.staff().filter(s => s !== IV.me()), v.witness || '', { req: true, ph: 'Choose a witness' })}</div>` : ''; };
    dlg.addEventListener('change', upd); upd(); };
  acts['iv-adjust-save'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), it = IV.item(v.item), b = IV.batch(v.b); IV.clearErr(dlg); let bad = false;
    if (!it) { IV.err(dlg, 'item', 'Choose an item'); bad = true; } else if (!b) { IV.err(dlg, 'b', 'Choose a batch'); bad = true; }
    if (!(+v.qty > 0)) { IV.err(dlg, 'qty', 'Enter a quantity'); bad = true; } else if (b && v.dir === 'out' && +v.qty > b.qty) { IV.err(dlg, 'qty', `Only ${b.qty} in this batch`); bad = true; }
    if (!v.reason) { IV.err(dlg, 'reason', 'Choose a reason'); bad = true; }
    if (it && IV.isCD(it) && !v.witness) { IV.err(dlg, 'witness', 'Required for controlled drugs'); bad = true; }
    if (/correction|Found/.test(v.reason) && !v.note) { IV.err(dlg, 'note', 'Explain the correction'); bad = true; }
    if (bad) { IV.firstErr(dlg); return; }
    const q = v.dir === 'in' ? +v.qty : -v.qty, type = /destruction/.test(v.reason) ? 'Destroyed' : /supplier/.test(v.reason) ? 'Returned to supplier' : 'Adjusted';
    IV.move(it.id, b.id, type, q, { reason: v.reason, note: v.note, witness: v.witness || '', ref: 'ADJ-' + Date.now().toString(36).slice(-5).toUpperCase() });
    if (/correction/.test(v.reason) && IV.isCD(it)) logIncident('CD discrepancy', `${it.name} batch ${b.batch}: ${q > 0 ? '+' : ''}${q} correction. ${v.note}`);
    IV.save(); App.closeModal(); App.render(); App.snack('Stock adjusted.' + (IV.isCD(it) ? '\nCD register updated.' : '')); };
  const logIncident = IV.logIncident = (type, summary, status = 'Open') => { const n = IV.id('inc'); D().incidents.unshift({ id: 'INC-' + String(n).padStart(4, '0'), at: new Date().toISOString(), type, summary, status, by: IV.me(), learning: '' }); return 'INC-' + String(n).padStart(4, '0'); };

  /* ---------- quarantine / release / destroy ---------- */
  acts['iv-quar'] = el => { const b = IV.batch(el.dataset.b), it = IV.item(b.item);
    IV.dlg('Quarantine batch', `${esc(it.name)} · ${esc(b.batch)}`, `${IV.note('Quarantined stock stays on the shelf but can’t be picked for dispensing until it’s released. Label it clearly and move it to the quarantine tray.', 'info')}${IV.sel('Reason', 'reason', ['Suspected damage or tampering', 'Temperature excursion', 'Recall / safety alert', 'Query with supplier', 'Other'], '', { req: true, ph: 'Choose a reason' })}${IV.area('Notes', 'note', '', { rows: 2 })}`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-quar-go" data-b="${b.id}">Quarantine</button>`, { width: 520 }); };
  acts['iv-quar-go'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), b = IV.batch(el.dataset.b); IV.clearErr(dlg); if (!v.reason) { IV.err(dlg, 'reason', 'Choose a reason'); return; }
    b.status = 'Quarantined'; b.why = v.reason; IV.move(b.item, b.id, 'Quarantined', 0, { reason: v.reason, note: v.note }); IV.save(); App.closeModal(); App.render(); App.snack(`Batch ${b.batch} quarantined.`); };
  acts['iv-release'] = el => { const b = IV.batch(el.dataset.b), it = IV.item(b.item);
    IV.dlg('Release from quarantine', `${esc(it.name)} · ${esc(b.batch)}`, `${b.why ? IV.note(`Quarantined because: <b>${esc(b.why)}</b>`, 'warn') : ''}${IV.area('Why is it safe to use?', 'note', '', { req: true, rows: 3, ph: 'e.g. Manufacturer confirmed stability data covers the excursion (ref …)' })}${IV.sel('Approved by', 'by2', IV.staff(), D().settings.lead, { req: true })}`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-release-go" data-b="${b.id}">Release to stock</button>`, { width: 520 }); };
  acts['iv-release-go'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), b = IV.batch(el.dataset.b); IV.clearErr(dlg); if (!v.note) { IV.err(dlg, 'note', 'Record why it’s safe to release'); return; }
    if (D().alerts.some(a => a.status === 'Open' && a.batches.includes(b.batch))) { IV.err(dlg, 'note', 'This batch is part of an open recall. Close the alert first.'); return; }
    if (b.expiry && IV.daysTo(b.expiry) < 0) { IV.err(dlg, 'note', 'This batch has expired and can’t be released.'); return; }
    b.status = 'Available'; delete b.why; IV.move(b.item, b.id, 'Released', 0, { note: v.note, witness: v.by2 }); IV.save(); App.closeModal(); App.render(); App.snack(`Batch ${b.batch} released to stock.`); };
  acts['iv-destroy'] = el => { const b = IV.batch(el.dataset.b), it = IV.item(b.item), cd2 = it.legal === 'CD2';
    IV.dlg('Remove batch from stock', `${esc(it.name)} · ${esc(b.batch)} · ${IV.qtyTxt(it, b.qty)}`, `
      ${IV.sel('What happens to it?', 'how', ['Destroyed on site (denaturing kit)', 'Collected by licensed waste contractor', 'Returned to supplier for credit'], '', { req: true, ph: 'Choose' })}
      <div class="iv-g2">${IV.input('Waste / returns reference', 'ref', '', { req: true, ph: 'Consignment note, RA number…' })}${IV.input('Quantity', 'qty', b.qty, { type: 'number', req: true, attrs: `min="1" max="${b.qty}"` })}</div>
      ${IV.isCD(it) ? `${IV.note(cd2 ? '<b>Schedule 2 stock destruction</b> must be witnessed by an <b>authorised witness</b> (not the CD accountable officer) and recorded in the CD register. Use a CD denaturing kit.' : 'Destroy controlled drugs with a denaturing kit and a staff witness.', 'warn', 'ri-lock-2-line')}${cd2 ? IV.input('Authorised witness', 'witness', '', { req: true, ph: 'Name and role, e.g. Police CD liaison officer' }) : IV.sel('Witness', 'witness', IV.staff().filter(s => s !== IV.me()), '', { req: true, ph: 'Choose a witness' })}` : ''}
      ${IV.note('Medicines waste goes in the correct bin (blue-lidded for non-hazardous medicines; purple-lidded for cytotoxic / cytostatic). Keep the waste transfer or consignment note.', 'info', 'ri-recycle-line')}`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn danger" data-act="iv-destroy-go" data-b="${b.id}">Remove from stock</button>`, { width: 600 }); };
  acts['iv-destroy-go'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), b = IV.batch(el.dataset.b), it = IV.item(b.item); IV.clearErr(dlg); let bad = false;
    if (!v.how) { IV.err(dlg, 'how', 'Choose what happens to it'); bad = true; } if (!v.ref) { IV.err(dlg, 'ref', 'Required for the audit trail'); bad = true; }
    if (!(+v.qty > 0 && +v.qty <= b.qty)) { IV.err(dlg, 'qty', `Between 1 and ${b.qty}`); bad = true; } if (IV.isCD(it) && !v.witness) { IV.err(dlg, 'witness', 'A witness is required'); bad = true; }
    if (bad) { IV.firstErr(dlg); return; }
    const ret = /supplier/.test(v.how); IV.move(it.id, b.id, ret ? 'Returned to supplier' : 'Destroyed', -v.qty, { reason: v.how, ref: v.ref, witness: v.witness || '', party: ret ? IV.sup(b.supplier).name : 'Pharmaceutical waste' });
    if (!b.qty) b.status = ret ? 'Returned' : 'Destroyed'; IV.save(); App.closeModal(); App.render(); App.snack(`${IV.qtyTxt(it, +v.qty)} removed from stock.`); };

  /* ======================= ORDERS & DELIVERIES ======================= */
  const PS = { Draft: 't-grey', Sent: 't-blue', 'Part received': 't-orange', Received: 't-green', Cancelled: 't-grey' };
  const poTotal = p => p.lines.reduce((n, l) => n + l.qty * l.cost, 0);
  const suggestions = () => D().items.filter(i => i.active && IV.isLow(i)).map(i => ({ it: i, onOrder: D().pos.filter(p => ['Draft', 'Sent', 'Part received'].includes(p.status)).flatMap(p => p.lines).filter(l => l.item === i.id).reduce((n, l) => n + l.qty - l.rec, 0) }));
  IV.tabs.orders = () => { const sg = suggestions();
    const sub = `<div class="seg sm grey">${[['orders', 'Purchase orders'], ['suggest', `Reorder suggestions${sg.filter(s => !s.onOrder).length ? ` (${sg.filter(s => !s.onOrder).length})` : ''}`], ['suppliers', 'Suppliers']].map(([k, t]) => `<button class="${u.ord === k ? 'on' : ''}" data-act="iv-ord" data-v="${k}">${t}</button>`).join('')}</div>`;
    let body;
    if (u.ord === 'suppliers') body = `<div class="row between wrap g12">${sub}<button class="btn primary" data-act="iv-sup-edit"><i class="ri-add-line"></i>Add supplier</button></div>
      ${IV.note('Only buy medicines from wholesalers that hold a <b>wholesale dealer’s licence (WDA(H))</b>. Check the licence on the MHRA register when you add a supplier and once a year after that.', 'info', 'ri-shield-check-line')}
      <div class="table-card"><div class="table-scroll"><table class="dt iv-dt"><thead><tr><th>Supplier</th><th>Type</th><th>Licence</th><th>Licence checked</th><th>Account</th><th>Lead time</th><th class="r">Action</th></tr></thead><tbody>
      ${D().sup.map(s => { const old = s.verified && (Date.now() - new Date(s.verified)) / IV.DAY > 365; return `<tr><td class="fw5">${esc(s.name)}<small class="cell-sub">${esc(s.email)} · ${esc(s.phone)}</small></td><td>${esc(s.kind)}</td><td>${esc(s.licence)}</td><td>${s.verified ? IV.dd(s.verified) + (old ? ' ' + IV.chip('Recheck due', 't-orange') : '') : '—'}</td><td>${esc(s.account)}</td><td>${s.lead} day${s.lead > 1 ? 's' : ''}</td><td class="r"><button class="icon-btn s20" data-act="iv-sup-edit" data-id="${s.id}" aria-label="Edit ${esc(s.name)}"><i class="ri-edit-line"></i></button></td></tr>`; }).join('')}</tbody></table></div></div>`;
    else if (u.ord === 'suggest') body = `<div class="row between wrap g12">${sub}<button class="btn primary" data-act="iv-po-suggest" ${sg.some(s => !s.onOrder) ? '' : 'disabled'}><i class="ri-shopping-cart-2-line"></i>Create orders for all</button></div>
      <div class="table-card"><div class="table-scroll"><table class="dt iv-dt"><thead><tr><th>Item</th><th>On hand</th><th>Reorder level</th><th>On order</th><th>Suggested</th><th>Supplier</th><th class="r">Action</th></tr></thead><tbody>
      ${sg.map(({ it, onOrder }) => `<tr><td class="fw5">${esc(it.name)}</td><td class="tnum iv-neg">${IV.onHand(it.id)}</td><td class="tnum">${it.reorder}</td><td class="tnum">${onOrder || '—'}</td><td class="tnum">${onOrder ? '—' : it.reorderQty}</td><td>${esc(IV.sup(it.supplier).name)}</td><td class="r">${onOrder ? IV.chip('On order', 't-blue') : `<button class="btn outlined sm" data-act="iv-po-new" data-item="${it.id}">Order</button>`}</td></tr>`).join('') || IV.empty(7, 'Nothing is below its reorder level.')}</tbody></table></div></div>`;
    else body = `<div class="row between wrap g12">${sub}<button class="btn primary" data-act="iv-po-new"><i class="ri-add-line"></i>New purchase order</button></div>
      <div class="table-card"><div class="table-scroll"><table class="dt iv-dt"><thead><tr><th>Order</th><th>Supplier</th><th>Items</th><th>Value</th><th>Expected</th><th>Status</th><th class="r">Action</th></tr></thead><tbody>
      ${D().pos.slice().sort((a, b) => a.created < b.created ? 1 : -1).map(p => `<tr><td class="fw5">${p.id}<small class="cell-sub">${IV.dd(p.created)} · ${esc(p.by)}</small></td><td>${esc(IV.sup(p.supplier).name)}</td><td>${p.lines.map(l => `${l.qty} × ${esc(IV.item(l.item).name)}`).join('<br>')}</td><td class="tnum">${IV.money(poTotal(p))}</td><td class="tnum">${IV.dd(p.expected)}</td><td>${IV.chip(p.status, PS[p.status])}</td>
        <td class="r"><span class="row-actions">${p.status === 'Draft' ? `<button class="btn outlined sm" data-act="iv-po-send" data-id="${p.id}">Send</button>` : ''}${['Sent', 'Part received'].includes(p.status) ? `<button class="btn primary sm" data-act="iv-po-receive" data-id="${p.id}">Receive delivery</button>` : ''}${['Draft', 'Sent'].includes(p.status) ? `<button class="icon-btn s20" data-act="iv-po-cancel" data-id="${p.id}" title="Cancel order" aria-label="Cancel ${p.id}"><i class="ri-close-circle-line"></i></button>` : ''}</span></td></tr>`).join('') || IV.empty(7, 'No purchase orders yet.')}</tbody></table></div></div>`;
    return IV.frame('orders', `<section class="card card-pad stack g16">${body}</section>`); };
  acts['iv-ord'] = el => { u.ord = el.dataset.v; IV.keep(); };
  const newPO = (supplier, lines) => { const p = { id: 'PO-' + String(IV.id('po')).padStart(4, '0'), supplier, status: 'Draft', created: new Date().toISOString(), expected: IV.dayOff(IV.sup(supplier).lead || 1), by: IV.me(), lines }; D().pos.push(p); return p; };
  acts['iv-po-suggest'] = () => { const by = {}; suggestions().filter(s => !s.onOrder).forEach(({ it }) => (by[it.supplier] = by[it.supplier] || []).push({ item: it.id, qty: it.reorderQty || it.reorder * 2, cost: it.cost, rec: 0 }));
    const made = Object.entries(by).map(([s, l]) => newPO(s, l)); IV.save(); u.ord = 'orders'; App.render(); App.snack(`${made.length} draft order${made.length > 1 ? 's' : ''} created. Check and send ${made.length > 1 ? 'them' : 'it'}.`); };
  acts['iv-po-new'] = el => { const pre = el.dataset.item ? IV.item(el.dataset.item) : null, items = D().items.filter(i => i.active);
    const line = (id = '', q = '') => `<div class="iv-poline">${IV.sel('Item', 'it', items.map(i => [i.id, i.name]), id, { ph: 'Choose an item' })}${IV.input('Quantity', 'q', q, { type: 'number', attrs: 'min="1"' })}<button class="icon-btn s20" data-act="iv-po-rm" aria-label="Remove line"><i class="ri-delete-bin-line"></i></button></div>`;
    const dlg = IV.dlg('New purchase order', 'Saved as a draft so someone can check it before it’s sent.', `${IV.sel('Supplier', 'supplier', D().sup.map(s => [s.id, `${s.name} · ${s.licence}`]), pre ? pre.supplier : 's1', { req: true })}<div class="stack g12 iv-polines">${line(pre ? pre.id : '', pre ? pre.reorderQty || '' : '')}</div><button class="btn text brand sm" data-act="iv-po-add" style="align-self:flex-start"><i class="ri-add-line"></i>Add line</button>`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-po-save">Save draft</button>`, { width: 640 });
    dlg._line = line; };
  acts['iv-po-add'] = el => { const dlg = el.closest('.dialog'); App.$('.iv-polines', dlg).insertAdjacentHTML('beforeend', dlg._line()); };
  acts['iv-po-rm'] = el => { const box = el.closest('.iv-polines'); if (box.children.length > 1) el.closest('.iv-poline').remove(); };
  acts['iv-po-save'] = el => { const dlg = el.closest('.dialog'); IV.clearErr(dlg); const lines = App.$$('.iv-poline', dlg).map(r => ({ item: App.$('[name=it]', r).value, qty: +App.$('[name=q]', r).value, r })).filter(l => l.item || l.qty);
    let bad = !lines.length; lines.forEach(l => { if (!l.item) { App.$('[name=it]', l.r).closest('.field').classList.add('err'); bad = true; } if (!(l.qty > 0)) { App.$('[name=q]', l.r).closest('.field').classList.add('err'); bad = true; } });
    if (bad) { App.snack('Add at least one item with a quantity.', 'error'); return; }
    const p = newPO(App.$('[name=supplier]', dlg).value, lines.map(l => ({ item: l.item, qty: l.qty, cost: IV.item(l.item).cost, rec: 0 }))); IV.save(); u.ord = 'orders'; App.closeModal(); App.go('#/inventory/orders'); App.render(); App.snack(`${p.id} saved as a draft.`); };
  acts['iv-po-send'] = el => { const p = D().pos.find(x => x.id === el.dataset.id); p.status = 'Sent'; p.sent = new Date().toISOString(); IV.save(); IV.keep(); App.snack(`${p.id} sent to ${IV.sup(p.supplier).name}.`); };
  acts['iv-po-cancel'] = el => { const p = D().pos.find(x => x.id === el.dataset.id); p.status = 'Cancelled'; IV.save(); IV.keep(); App.snack(`${p.id} cancelled.`, 'info'); };
  acts['iv-po-receive'] = el => { const p = D().pos.find(x => x.id === el.dataset.id), s = IV.sup(p.supplier), needCold = p.lines.some(l => IV.cold(IV.item(l.item))), needCD = p.lines.some(l => IV.isCD(IV.item(l.item)));
    IV.dlg(`Receive ${p.id}`, `${esc(s.name)} · ${esc(s.licence)}`, `${IV.input('Invoice / delivery note no.', 'inv', '', { req: true })}
      ${p.lines.map((l, k) => { const it = IV.item(l.item), left = l.qty - l.rec; return `<div class="iv-rcv" data-k="${k}"><div class="row between"><b>${esc(it.name)}</b><span class="caption">${left} of ${l.qty} still to come</span></div>${left ? `<div class="iv-g3">${IV.input('Batch', 'batch' + k, '')}${IV.input('Expiry', 'exp' + k, '', { type: 'date' })}${IV.input('Received', 'q' + k, left, { type: 'number', attrs: `min="0" max="${left}"` })}</div>` : ''}</div>`; }).join('')}
      ${needCold ? IV.input('Cold chain: temperature on arrival', 'temp', '', { type: 'number', req: true, attrs: 'step="0.1"', post: '°C' }) : ''}${needCD ? IV.sel('CD witness', 'witness', IV.staff().filter(x => x !== IV.me()), '', { req: true, ph: 'Choose a witness' }) : ''}
      <fieldset class="iv-checks"><legend>Delivery checks</legend>${IV.check('ok1', 'Matches the delivery note — any short or wrong items noted', false)}${IV.check('ok2', 'Packaging intact; cold chain items arrived cold and went straight into the fridge', false)}</fieldset>`,
      `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-po-receive-go" data-id="${p.id}">Add to stock</button>`, { width: 720 }); };
  acts['iv-po-receive-go'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg), p = D().pos.find(x => x.id === el.dataset.id); IV.clearErr(dlg); let bad = false, any = false;
    if (!v.inv) { IV.err(dlg, 'inv', 'Required'); bad = true; } if ('temp' in v && (v.temp === '' || +v.temp < 2 || +v.temp > 8)) { IV.err(dlg, 'temp', v.temp === '' ? 'Required' : 'Outside 2–8 °C — refuse the cold chain items'); bad = true; }
    if ('witness' in v && !v.witness) { IV.err(dlg, 'witness', 'Required for controlled drugs'); bad = true; } ['ok1', 'ok2'].forEach(k => { if (!v[k]) { IV.err(dlg, k); bad = true; } });
    p.lines.forEach((l, k) => { const q = +v['q' + k]; if (!(q > 0)) return; any = true; if (!v['batch' + k]) { IV.err(dlg, 'batch' + k, 'Required'); bad = true; } if (!v['exp' + k]) { IV.err(dlg, 'exp' + k, 'Required'); bad = true; } else if (IV.daysTo(v['exp' + k]) < 0) { IV.err(dlg, 'exp' + k, 'Expired'); bad = true; } if (q > l.qty - l.rec) { IV.err(dlg, 'q' + k, 'More than ordered'); bad = true; } });
    if (!any && !bad) { App.snack('Enter at least one received quantity.', 'error'); return; } if (bad) { IV.firstErr(dlg); return; }
    const s = IV.sup(p.supplier);
    p.lines.forEach((l, k) => { const q = +v['q' + k]; if (!(q > 0)) return; const b = { id: 'b' + IV.id('b'), item: l.item, batch: v['batch' + k].toUpperCase(), expiry: v['exp' + k], qty: 0, received: IV.iso(new Date()), supplier: p.supplier, status: 'Available', inv: v.inv, po: p.id }; D().batches.push(b); l.rec += q;
      IV.move(l.item, b.id, 'Received', q, { ref: `${v.inv} · ${p.id}`, party: `${s.name}, ${s.licence}`, witness: IV.isCD(IV.item(l.item)) ? v.witness : '', note: IV.cold(IV.item(l.item)) ? `Arrival temperature ${v.temp} °C` : '' }); });
    p.status = p.lines.every(l => l.rec >= l.qty) ? 'Received' : 'Part received'; p.received = new Date().toISOString(); IV.save(); App.closeModal(); App.render(); App.snack(`${p.id} ${p.status === 'Received' ? 'received in full' : 'part received'}. Stock updated.`); };
  acts['iv-sup-edit'] = el => { const s = D().sup.find(x => x.id === el.dataset.id) || { name: '', kind: 'Medicines wholesaler', licence: '', email: '', phone: '', account: '', lead: 1 };
    IV.dlg(s.id ? 'Edit supplier' : 'Add supplier', '', `<div class="iv-g2">${IV.input('Supplier name', 'name', s.name, { req: true, cls: 'iv-span2' })}${IV.sel('Type', 'kind', ['Medicines wholesaler', 'Specialist / cold chain', 'Manufacturer (direct)', 'Consumables'], s.kind)}${IV.input('WDA(H) licence number', 'licence', s.licence, { ph: 'e.g. WDA(H) 12345' })}${IV.input('Order email', 'email', s.email)}${IV.input('Phone', 'phone', s.phone)}${IV.input('Account number', 'account', s.account)}${IV.input('Lead time', 'lead', s.lead, { type: 'number', post: 'days' })}</div>
      ${IV.check('verified', 'I’ve checked this licence is current on the MHRA register of licensed wholesale distributors', false)}`, `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-sup-save" data-id="${s.id || ''}">Save supplier</button>`, { width: 620 }); };
  acts['iv-sup-save'] = el => { const dlg = el.closest('.dialog'), v = IV.vals(dlg); IV.clearErr(dlg); let bad = false; if (!v.name) { IV.err(dlg, 'name', 'Required'); bad = true; }
    const med = v.kind !== 'Consumables'; if (med && !/WDA|MIA/i.test(v.licence)) { IV.err(dlg, 'licence', 'Medicines suppliers need a WDA(H) or manufacturer’s licence (MIA)'); bad = true; } if (med && !v.verified) { IV.err(dlg, 'verified'); bad = true; }
    if (bad) { IV.firstErr(dlg); return; } let s = D().sup.find(x => x.id === el.dataset.id); const data = { name: v.name, kind: v.kind, licence: v.licence || 'Not required — consumables only', email: v.email, phone: v.phone, account: v.account, lead: +v.lead || 1, contact: '' }; if (v.verified) data.verified = IV.iso(new Date());
    if (s) Object.assign(s, data); else D().sup.push(Object.assign({ id: 's' + (D().sup.length + 1) + Date.now().toString(36).slice(-2) }, data)); IV.save(); App.closeModal(); App.render(); App.snack('Supplier saved.'); };

  /* ======================= STOCK TAKES ======================= */
  const CS = { 'In progress': 't-blue', 'Awaiting approval': 't-orange', Completed: 't-green' };
  IV.tabs.counts = () => { const open = D().counts.find(c => c.status !== 'Completed');
    return IV.frame('counts', `<section class="card card-pad stack g16"><div class="row between wrap g12"><div class="stack g4"><h2 class="h6">Stock takes</h2><span class="caption">Count what’s physically on the shelf. Differences are approved by a second person before stock is corrected.</span></div>${open ? '' : `<button class="btn primary" data-act="iv-count-new"><i class="ri-add-line"></i>Start a stock take</button>`}</div>
      <div class="table-card"><div class="table-scroll"><table class="dt iv-dt"><thead><tr><th>Stock take</th><th>Scope</th><th>Started</th><th>Lines</th><th>Variances</th><th>Status</th><th class="r">Action</th></tr></thead><tbody>
      ${D().counts.slice().sort((a, b) => a.started < b.started ? 1 : -1).map(c => { const vr = c.lines.filter(l => l.counted !== '' && l.counted != null && +l.counted !== l.expected); return `<tr><td class="fw5">${c.id}<small class="cell-sub">${esc(c.name)}</small></td><td>${esc(c.scope)}${c.blind ? '<small class="cell-sub">Blind count</small>' : ''}</td><td class="tnum">${IV.dt(c.started)}<small class="cell-sub">${esc(c.by)}</small></td><td class="tnum">${c.lines.length}</td><td class="tnum ${vr.length ? 'iv-neg' : ''}">${vr.length}</td><td>${IV.chip(c.status, CS[c.status])}${c.approvedBy ? `<small class="cell-sub">Approved by ${esc(c.approvedBy)}</small>` : ''}</td>
        <td class="r">${c.status === 'Completed' ? `<button class="icon-btn s20" data-act="iv-count-open" data-id="${c.id}" aria-label="View ${c.id}"><i class="ri-eye-line"></i></button>` : `<button class="btn primary sm" data-act="iv-count-open" data-id="${c.id}">${c.status === 'In progress' ? 'Continue count' : 'Review & approve'}</button>`}</td></tr>`; }).join('')}</tbody></table></div></div></section>`); };
  acts['iv-count-new'] = () => IV.dlg('Start a stock take', 'Freeze nothing — dispensing can carry on, but count quickly and recount any variance.', `${IV.input('Name', 'name', 'Monthly full count', { req: true })}${IV.sel('Scope', 'scope', ['All stock', 'Controlled drugs only', 'Fridge items only', 'Expiring within 90 days'], 'All stock')}${IV.check('blind', 'Blind count — hide the expected quantity from the counter (recommended)', D().settings.blindCount)}`,
    `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn primary" data-act="iv-count-go">Start count</button>`, { width: 520 });
  acts['iv-count-go'] = el => { const v = IV.vals(el.closest('.dialog')); const t = { 'All stock': () => true, 'Controlled drugs only': IV.isCD, 'Fridge items only': IV.cold, 'Expiring within 90 days': i => IV.isExpiring(i) };
    const bs = D().batches.filter(b => b.qty > 0 && t[v.scope](IV.item(b.item)));
    const c = { id: 'ST-' + String(IV.id('st')).padStart(4, '0'), name: v.name || 'Stock take', scope: v.scope, status: 'In progress', started: new Date().toISOString(), by: IV.me(), blind: v.blind, lines: bs.map(b => ({ batch: b.id, expected: b.qty, counted: '' })) };
    D().counts.push(c); IV.save(); App.closeModal(); App.render(); countDlg(c); };
  acts['iv-count-open'] = el => countDlg(D().counts.find(c => c.id === el.dataset.id));
  const countDlg = c => { const done = c.status === 'Completed', review = c.status === 'Awaiting approval', showExp = !c.blind || review || done;
    const dlg = IV.dlg(`${c.id} · ${esc(c.name)}`, `${esc(c.scope)} · started ${IV.dt(c.started)} by ${esc(c.by)}`, `
      ${review ? IV.note(c.by === IV.me() ? 'You counted this stock take, so someone else must approve it.' : 'Check each variance. Recount anything unexpected before you approve — approving posts the corrections to stock.', c.by === IV.me() ? 'warn' : 'info') : ''}
      <div class="table-card"><div class="table-scroll" style="max-height:52vh"><table class="dt iv-dt"><thead><tr><th>Item · batch</th><th>Location</th>${showExp ? '<th class="r">Expected</th>' : ''}<th class="r">Counted</th>${showExp ? '<th class="r">Variance</th>' : ''}</tr></thead><tbody>
      ${c.lines.map((l, k) => { const b = IV.batch(l.batch), it = IV.item(b.item), vr = l.counted === '' ? '' : +l.counted - l.expected; return `<tr><td class="fw5">${esc(it.name)}<small class="cell-sub">${esc(b.batch)}${IV.isCD(it) ? ' · CD' : ''}</small></td><td>${esc(it.location)}</td>${showExp ? `<td class="r tnum">${l.expected}</td>` : ''}<td class="r">${c.status === 'In progress' ? `<input class="iv-cnt" name="c${k}" type="number" min="0" value="${esc(l.counted)}" aria-label="Counted ${esc(it.name)} ${esc(b.batch)}">` : `<span class="tnum">${l.counted}</span>`}</td>${showExp ? `<td class="r tnum ${vr ? 'iv-neg' : ''}">${vr === '' ? '—' : (vr > 0 ? '+' : '') + vr}</td>` : ''}</tr>`; }).join('')}</tbody></table></div></div>`,
      done ? `<button class="btn primary" data-act="close-modal">Close</button>` : review ? `<button class="btn text" data-act="iv-count-back" data-id="${c.id}">Send back for recount</button><button class="btn primary" data-act="iv-count-approve" data-id="${c.id}" ${c.by === IV.me() ? 'disabled' : ''}>Approve and post corrections</button>`
        : `<span class="note">Counts are saved as you type.</span><button class="btn text" data-act="close-modal">Close</button><button class="btn primary" data-act="iv-count-submit" data-id="${c.id}">Submit for approval</button>`, { width: 820 });
    dlg.addEventListener('input', e => { const m = e.target.name && e.target.name.match(/^c(\d+)$/); if (m) { c.lines[+m[1]].counted = e.target.value === '' ? '' : +e.target.value; IV.save(); } }); };
  acts['iv-count-submit'] = el => { const c = D().counts.find(x => x.id === el.dataset.id); const miss = c.lines.filter(l => l.counted === '').length; if (miss) { App.snack(`${miss} line${miss > 1 ? 's' : ''} not counted yet.`, 'error'); return; }
    c.status = 'Awaiting approval'; c.submitted = new Date().toISOString(); IV.save(); App.closeModal(); App.render(); App.snack('Submitted. A second person now reviews and approves the variances.'); };
  acts['iv-count-back'] = el => { const c = D().counts.find(x => x.id === el.dataset.id); c.status = 'In progress'; IV.save(); App.closeModal(); App.render(); App.snack('Sent back for a recount.', 'info'); };
  acts['iv-count-approve'] = el => { const c = D().counts.find(x => x.id === el.dataset.id); let n = 0;
    c.lines.forEach(l => { const b = IV.batch(l.batch), vr = +l.counted - b.qty; if (vr) { n++; const it = IV.item(b.item); IV.move(b.item, b.id, 'Adjusted', vr, { reason: 'Stock count correction', ref: c.id, note: `Counted ${l.counted}, expected ${b.qty}`, witness: c.by }); if (IV.isCD(it)) IV.logIncident('CD discrepancy', `${it.name} ${b.batch}: stock take ${c.id} found ${vr > 0 ? '+' : ''}${vr}. Investigate and tell the CD accountable officer.`); } });
    c.status = 'Completed'; c.approvedBy = IV.me(); c.approved = new Date().toISOString(); IV.save(); App.closeModal(); App.render(); App.snack(n ? `${n} correction${n > 1 ? 's' : ''} posted to stock.` : 'Stock take approved — no variances.'); };
})();

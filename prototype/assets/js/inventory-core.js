/* EHR › Inventory — core: demo data, saved state, shared helpers, page frame and the Overview tab.
   The rest of the module lives in inventory-stock.js, inventory-dispense.js and inventory-compliance.js.
   State is kept in this browser (localStorage "leafease-inventory-v1"); "Reset demo data" restores the seed. */
(function () {
  const { esc } = App;
  const KEY = 'leafease-inventory-v1';
  const DAY = 864e5;
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const iso = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const dayOff = n => iso(today0().getTime() + n * DAY);
  const atOff = (n, h = 10, m = 0) => { const d = new Date(today0().getTime() + n * DAY); d.setHours(h, m); return d.toISOString(); };

  /* ---------------- seed ---------------- */
  function seed() {
    const sup = [
      { id: 's1', name: 'Alliance Healthcare', licence: 'WDA(H) 18015', verified: dayOff(-120), contact: 'Customer services', email: 'orders@alliance-demo.co.uk', phone: '0345 600 0001', account: 'LE-44120', lead: 1, kind: 'Medicines wholesaler' },
      { id: 's2', name: 'AAH Pharmaceuticals', licence: 'WDA(H) 05710', verified: dayOff(-200), contact: 'Account manager', email: 'orders@aah-demo.co.uk', phone: '0344 561 8899', account: 'AAH-90311', lead: 1, kind: 'Medicines wholesaler' },
      { id: 's3', name: 'Movianto UK (cold chain)', licence: 'WDA(H) 31277', verified: dayOff(-400), contact: 'Cold chain desk', email: 'coldchain@movianto-demo.co.uk', phone: '01234 248 500', account: 'MV-2210', lead: 2, kind: 'Specialist / cold chain' },
      { id: 's4', name: 'Medisave', licence: 'Not required — consumables only', verified: '', contact: 'Sales', email: 'sales@medisave-demo.co.uk', phone: '01305 784 000', account: 'MS-7781', lead: 3, kind: 'Consumables' }
    ];
    const I = (id, name, o) => Object.assign({ id, name, type: 'Medicine', legal: 'POM', storage: 'Room temperature', location: 'Dispensary · Shelf A', unit: 'tablets', pack: 28, dmd: '', cost: 0, sale: 0, vat: 0, reorder: 0, reorderQty: 0, supplier: 's1', active: true, notes: '' }, o);
    const items = [
      I('i1', 'Amoxicillin 500mg capsules', { unit: 'capsules', pack: 21, dmd: '323509004', cost: .08, sale: .35, reorder: 100, reorderQty: 210, location: 'Dispensary · Shelf A2' }),
      I('i2', 'Sertraline 50mg tablets', { pack: 28, dmd: '322827002', cost: .05, sale: .30, reorder: 50, reorderQty: 112, location: 'Dispensary · Shelf B1' }),
      I('i3', 'Omeprazole 20mg capsules', { unit: 'capsules', pack: 28, dmd: '317314008', cost: .06, sale: .28, reorder: 50, reorderQty: 112, location: 'Dispensary · Shelf B3' }),
      I('i4', 'Diazepam 5mg tablets', { legal: 'CD4-1', pack: 28, dmd: '322745002', cost: .04, sale: .40, reorder: 0, storage: 'CD cabinet', location: 'CD cabinet · Shelf 1', notes: 'Schedule 4 Part 1 (CD Benz POM). Kept in the CD cabinet by practice policy; register entries are voluntary.' }),
      I('i5', 'Nitrile gloves (box of 100)', { type: 'Consumable', legal: 'None', unit: 'boxes', pack: 1, cost: 4.5, sale: 0, vat: 20, reorder: 20, reorderQty: 40, supplier: 's4', location: 'Store room · Bay 2' }),
      I('i6', 'Paracetamol 500mg tablets', { legal: 'P', pack: 32, dmd: '322236009', cost: .02, sale: .08, reorder: 64, reorderQty: 320, location: 'Dispensary · Shelf A1' }),
      I('i7', 'Wegovy 2.4mg FlexTouch pen (semaglutide)', { unit: 'pens', pack: 1, dmd: '40852311000001107', cost: 73.25, sale: 199, reorder: 6, reorderQty: 10, storage: 'Fridge 2–8 °C', location: 'Medicines fridge 1', supplier: 's3', notes: 'Unopened pens: fridge. Once in use, may be kept below 30 °C for up to 6 weeks — tell the patient.' }),
      I('i8', 'Mounjaro 5mg KwikPen (tirzepatide)', { unit: 'pens', pack: 1, dmd: '42255211000001100', cost: 122, sale: 229, reorder: 6, reorderQty: 8, storage: 'Fridge 2–8 °C', location: 'Medicines fridge 1', supplier: 's3' }),
      I('i9', 'Sustanon 250mg/1ml injection ampoules', { legal: 'CD4-2', unit: 'ampoules', pack: 1, dmd: '9468611000001109', cost: 2.45, sale: 15, reorder: 10, reorderQty: 20, storage: 'CD cabinet', location: 'CD cabinet · Shelf 2', notes: 'Testosterone esters — Schedule 4 Part 2 (anabolic steroid).' }),
      I('i10', 'Bocouture 50 units powder for injection (botulinum toxin A)', { unit: 'vials', pack: 1, cost: 75, sale: 0, reorder: 4, reorderQty: 6, storage: 'Fridge 2–8 °C', location: 'Medicines fridge 1', supplier: 's3', notes: 'Administered in clinic only — not supplied to patients.' }),
      I('i11', 'Adrenaline 1mg/1ml (1 in 1,000) injection ampoules', { unit: 'ampoules', pack: 10, dmd: '9269111000001106', cost: .95, sale: 0, reorder: 10, reorderQty: 10, location: 'Emergency trolley', notes: 'Emergency drug — check the trolley weekly.' }),
      I('i12', 'Oxycodone 5mg capsules', { legal: 'CD2', unit: 'capsules', pack: 56, dmd: '323976006', cost: .30, sale: 1.20, reorder: 28, reorderQty: 56, storage: 'CD cabinet', location: 'CD cabinet · Shelf 1' }),
      I('i13', 'Influenza vaccine (QIVc) 0.5ml prefilled syringe', { type: 'Vaccine', unit: 'syringes', pack: 10, cost: 9.8, sale: 18, reorder: 10, reorderQty: 20, storage: 'Fridge 2–8 °C', location: 'Vaccine fridge', supplier: 's3' })
    ];
    const B = (id, item, batch, exp, qty, recv, supplier, status = 'Available', o = {}) => Object.assign({ id, item, batch, expiry: exp, qty, received: recv, supplier, status, inv: 'INV-' + (40000 + parseInt(id.slice(1), 10) * 7) }, o);
    const batches = [
      B('b1', 'i1', 'AMX-4471', dayOff(45), 160, dayOff(-150), 's1'), B('b2', 'i1', 'AMX-5120', dayOff(300), 300, dayOff(-20), 's1'),
      B('b3', 'i2', 'SER-9921', dayOff(400), 200, dayOff(-30), 's1'), B('b4', 'i2', 'SER-8810', dayOff(-10), 14, dayOff(-330), 's2', 'Expired'),
      B('b5', 'i3', 'OME-7710', dayOff(30), 20, dayOff(-200), 's2'), B('b6', 'i3', 'OME-6602', dayOff(260), 40, dayOff(-60), 's1', 'Quarantined', { why: 'MHRA recall EL (26)A/41' }),
      B('b7', 'i4', 'DZP-3301', dayOff(500), 100, dayOff(-90), 's2'),
      B('b8', 'i5', 'GLV-2026-10', '', 12, dayOff(-25), 's4'),
      B('b9', 'i6', 'PCM-1180', dayOff(620), 288, dayOff(-40), 's1'),
      B('b10', 'i7', 'WGV-2231', dayOff(120), 6, dayOff(-35), 's3'), B('b11', 'i7', 'WGV-2307', dayOff(210), 8, dayOff(-6), 's3'),
      B('b12', 'i8', 'MJR-5521', dayOff(160), 4, dayOff(-18), 's3'),
      B('b13', 'i9', 'SUS-0921', dayOff(380), 29, dayOff(-50), 's2'),
      B('b14', 'i10', 'BOC-77310', dayOff(240), 9, dayOff(-14), 's3'),
      B('b15', 'i11', 'ADR-6620', dayOff(20), 10, dayOff(-300), 's1'),
      B('b16', 'i12', 'OXY-2207', dayOff(540), 56, dayOff(-40), 's1'),
      B('b17', 'i13', 'FLU-26A118', dayOff(140), 18, dayOff(-45), 's3')
    ];
    const P = id => { const p = (App.S.patients || []).find(x => x.id === id); return p ? { pid: id, patient: `${p.first} ${p.last}`, dob: p.dob, addr: [p.addr, p.city, p.postcode].filter(Boolean).join(', ') } : { pid: '', patient: 'Unknown patient', dob: '', addr: '' }; };
    const pres = { 'Dr Sana Bashir': 'GMC 7123456', 'Dr Sarah Mitchell': 'GMC 7234567' };
    const RX = (id, pid, o) => Object.assign({ id, ...P(pid), allergies: [], prescriber: 'Dr Sana Bashir', reg: pres['Dr Sana Bashir'], issued: atOff(0, 9, 20), handover: 'Collect', status: 'To dispense', stage: '', charge: null, picks: [], log: [], owing: [] }, o);
    const L = (item, drug, qty, dose, dirs, days) => ({ item, drug, qty, dose, dirs, days });
    /* Inventory keeps the dispensing record, not the prescription itself: these
       are supplies already in progress or finished. Prescriptions still waiting
       are written in the patients' records and read from there — see IV.syncRx. */
    const rx = [
      RX('RX-10238', 'p3', { issued: atOff(-1, 15, 0), status: 'In progress', stage: 'Awaiting check', lines: [L('i7', 'Wegovy 2.4mg FlexTouch pen (semaglutide)', 1, '2.4 mg once weekly', 'Inject 2.4 mg under the skin ONCE a week on the same day. Store unopened pens in the fridge.', 28)],
        charge: { lines: [{ t: 'Wegovy 2.4mg FlexTouch pen × 1', amt: 199 }], postage: 0, fee: 0, total: 199, status: 'Paid', method: 'Payment link', paidAt: atOff(-1, 16, 2) },
        picks: [{ line: 0, batch: 'b10', qty: 1 }], dispensedBy: 'Nurse Tom Reid', dispensedAt: atOff(0, 8, 50), clinical: { by: 'Nurse Tom Reid', at: atOff(0, 8, 45) },
        log: [['Prescription issued', atOff(-1, 15, 0), 'Dr Sana Bashir'], ['Payment recorded · payment link · £199.00', atOff(-1, 16, 2), 'Patient'], ['Clinical check done', atOff(0, 8, 45), 'Nurse Tom Reid'], ['Dispensed from WGV-2231 · label printed', atOff(0, 8, 50), 'Nurse Tom Reid']] }),
      RX('RX-10236', 'p5', { issued: atOff(-2, 14, 10), status: 'In progress', stage: 'Ready for collection', lines: [L('i9', 'Sustanon 250mg/1ml injection ampoules', 1, '250 mg every 3 weeks', 'For injection by the clinic nurse. 1 ml into the muscle every 3 weeks.', 21)],
        charge: { lines: [{ t: 'Sustanon 250mg/1ml × 1', amt: 15 }], postage: 0, fee: 0, total: 15, status: 'Paid', method: 'Card', paidAt: atOff(-2, 14, 30) }, cd: true,
        picks: [{ line: 0, batch: 'b13', qty: 1 }], dispensedBy: 'Nurse Tom Reid', dispensedAt: atOff(-1, 9, 10), clinical: { by: 'Nurse Tom Reid', at: atOff(-1, 9, 5) }, accuracy: { by: 'Muhammad Arslan', at: atOff(-1, 9, 40) },
        log: [['Prescription issued', atOff(-2, 14, 10), 'Dr Sana Bashir'], ['Payment recorded · card · £15.00', atOff(-2, 14, 30), 'Muhammad Arslan'], ['Dispensed from SUS-0921 · label printed', atOff(-1, 9, 10), 'Nurse Tom Reid'], ['Accuracy check passed', atOff(-1, 9, 40), 'Muhammad Arslan']] }),
      RX('RX-10199', 'p1', { issued: atOff(-21, 10, 0), status: 'Completed', stage: 'Collected', lines: [L('i3', 'Omeprazole 20mg capsules', 28, '20 mg once daily', 'Take ONE capsule before breakfast.', 28)],
        charge: { lines: [{ t: 'Omeprazole 20mg capsules × 28', amt: 7.84 }], postage: 0, fee: 0, total: 7.84, status: 'Paid', method: 'Cash', paidAt: atOff(-21, 10, 20) },
        picks: [{ line: 0, batch: 'b6', qty: 28 }], dispensedBy: 'Nurse Tom Reid', dispensedAt: atOff(-21, 11, 0), accuracy: { by: 'Muhammad Arslan', at: atOff(-21, 11, 20) }, handed: { at: atOff(-21, 15, 0), by: 'Muhammad Arslan', how: 'Collected', to: 'Emily Carter (patient)', counselled: true },
        log: [['Prescription issued', atOff(-21, 10, 0), 'Dr Sana Bashir'], ['Dispensed from OME-6602', atOff(-21, 11, 0), 'Nurse Tom Reid'], ['Collected by Emily Carter', atOff(-21, 15, 0), 'Muhammad Arslan']] }),
      RX('RX-10221', 'p5', { issued: atOff(-10, 9, 0), status: 'Completed', stage: 'Collected', cd: true, lines: [L('i12', 'Oxycodone 5mg capsules', 28, '5 mg every 6 hours when needed', 'Take ONE capsule every 6 hours when needed for pain. Max 4 in 24 hours. May cause drowsiness.', 7)],
        charge: { lines: [{ t: 'Oxycodone 5mg capsules × 28', amt: 33.6 }], postage: 0, fee: 0, total: 33.6, status: 'Paid', method: 'Card', paidAt: atOff(-10, 9, 30) },
        picks: [{ line: 0, batch: 'b16', qty: 28 }], dispensedBy: 'Nurse Tom Reid', dispensedAt: atOff(-10, 10, 0), accuracy: { by: 'Muhammad Arslan', at: atOff(-10, 10, 15) }, handed: { at: atOff(-10, 12, 5), by: 'Muhammad Arslan', how: 'Collected', to: 'Harry Styles (patient)', id: 'Driving licence', counselled: true },
        log: [['Prescription issued', atOff(-10, 9, 0), 'Dr Sana Bashir'], ['Dispensed from OXY-2207', atOff(-10, 10, 0), 'Nurse Tom Reid'], ['Collected by Harry Styles · ID checked (driving licence)', atOff(-10, 12, 5), 'Muhammad Arslan']] })
    ];
    /* stock movements = the audit trail and, for CDs, the register */
    let mid = 0; const moves = [];
    const M = (at, item, batch, type, qty, o = {}) => moves.push(Object.assign({ id: 'm' + (++mid), at, item, batch, type, qty, by: 'Muhammad Arslan', ref: '', note: '' }, o));
    M(atOff(-21, 11, 0), 'i3', 'b6', 'Dispensed', -28, { ref: 'RX-10199', party: 'Emily Carter', by: 'Nurse Tom Reid' });
    M(atOff(-10, 10, 0), 'i12', 'b16', 'Dispensed', -28, { ref: 'RX-10221', party: 'Harry Styles, ' + (P('p5').addr || ''), prescriber: 'Dr Sana Bashir (GMC 7123456)', collector: 'Patient — ID checked (driving licence)', by: 'Nurse Tom Reid' });
    M(atOff(-5, 16, 0), 'i12', 'b16', 'Dispensed', -16, { ref: 'RX-10230', party: 'Noah Williams, ' + (P('p4').addr || ''), prescriber: 'Dr Sarah Mitchell (GMC 7234567)', collector: 'Patient — ID checked (passport)', by: 'Nurse Tom Reid' });
    M(atOff(-1, 9, 10), 'i9', 'b13', 'Dispensed', -1, { ref: 'RX-10236', party: 'Harry Styles', by: 'Nurse Tom Reid' });
    M(atOff(0, 8, 50), 'i7', 'b10', 'Dispensed', -1, { ref: 'RX-10238', party: 'Sophia Patel', by: 'Nurse Tom Reid' });
    M(atOff(-6, 11, 0), 'i10', 'b14', 'Administered', -1, { ref: 'APT-2051', party: 'In clinic · Isabella Nguyen', by: 'Dr Olivia Brown' });
    M(atOff(-30, 17, 0), 'i5', 'b8', 'Adjusted', -2, { ref: 'Stock take ST-0007', note: 'Count correction — 2 boxes missing', reason: 'Stock count correction' });
    M(atOff(-2, 9, 0), 'i3', 'b6', 'Quarantined', 0, { ref: 'EL (26)A/41', note: 'Batch quarantined for MHRA recall' });
    M(atOff(-10, 0, 1), 'i2', 'b4', 'Expired', 0, { by: 'System', note: 'Batch passed its expiry date — moved to expired, awaiting destruction' });
    /* receipts: received qty = current + everything that has gone out since */
    batches.forEach(b => { const out = moves.filter(m => m.batch === b.id).reduce((n, m) => n + m.qty, 0); const s = sup.find(x => x.id === b.supplier);
      M(b.received + 'T09:30:00.000Z', b.item, b.id, 'Received', b.qty - out, { ref: b.inv, party: s ? s.name + ', ' + s.licence : '', by: b.item === 'i12' ? 'Muhammad Arslan' : 'Nurse Tom Reid', witness: b.item === 'i12' ? 'Nurse Tom Reid' : '' }); });
    moves.sort((a, b) => a.at < b.at ? -1 : 1);

    const pos = [
      { id: 'PO-0312', supplier: 's3', status: 'Sent', created: atOff(-1, 15, 0), expected: dayOff(1), by: 'Muhammad Arslan', lines: [{ item: 'i8', qty: 8, cost: 122, rec: 0 }, { item: 'i13', qty: 10, cost: 9.8, rec: 0 }] },
      { id: 'PO-0311', supplier: 's4', status: 'Draft', created: atOff(0, 9, 0), expected: dayOff(3), by: 'Muhammad Arslan', lines: [{ item: 'i5', qty: 40, cost: 4.5, rec: 0 }] },
      { id: 'PO-0309', supplier: 's1', status: 'Received', created: atOff(-22, 10, 0), expected: dayOff(-20), by: 'Muhammad Arslan', received: atOff(-20, 9, 30), lines: [{ item: 'i1', qty: 300, cost: .08, rec: 300 }] }
    ];
    const fridges = [{ id: 'f1', name: 'Medicines fridge 1', where: 'Treatment room 1', model: 'Lec PE207C pharmacy fridge', serviced: dayOff(-140) }, { id: 'f2', name: 'Vaccine fridge', where: 'Treatment room 2', model: 'Liebherr MKv 3910', serviced: dayOff(-60) }];
    const temps = []; let tid = 0;
    for (let d = -13; d <= 0; d++) ['f1', 'f2'].forEach((f, k) => [[8, 40], [17, 10]].forEach(([h, m], j) => {
      if (d === 0 && (j === 1 || f === 'f2')) return;
      const ex = f === 'f1' && d === -4 && j === 0; const cur = +(4.2 + (Math.abs(d * 7 + j * 3 + k * 5) % 9) / 5).toFixed(1);
      temps.push({ id: 't' + (++tid), fridge: f, at: atOff(d, h, m), cur, min: +(cur - 1.3).toFixed(1), max: ex ? 9.1 : +(cur + 1.6).toFixed(1), by: j ? 'Muhammad Arslan' : 'Nurse Tom Reid', reset: true, note: ex ? 'Door left ajar after delivery. Stock assessed with manufacturer — usable. See incident INC-0042.' : '' });
    }));
    const alerts = [
      { id: 'a1', ref: 'EL (26)A/41', cls: 'Class 2 Medicines Recall', title: 'Omeprazole 20mg gastro-resistant capsules — specific batches', product: 'i3', batches: ['OME-6602'], issued: dayOff(-2), due: dayOff(0), status: 'Open', level: 'Pharmacy and wholesaler level', received: atOff(-2, 8, 55),
        actions: [['Alert received and logged', atOff(-2, 8, 55), 'Muhammad Arslan'], ['Batch OME-6602 found in stock (40) — quarantined', atOff(-2, 9, 0), 'Muhammad Arslan']] },
      { id: 'a2', ref: 'EL (26)A/37', cls: 'Class 4 Caution in Use', title: 'Mounjaro KwikPen — updated instructions for use leaflet', product: 'i8', batches: [], issued: dayOff(-16), due: dayOff(-9), status: 'Actioned', level: 'Patient level', received: atOff(-16, 10, 0),
        actions: [['Alert received and logged', atOff(-16, 10, 0), 'Muhammad Arslan'], ['Updated leaflet added to dispensing checklist', atOff(-15, 12, 0), 'Muhammad Arslan'], ['Closed — actioned', atOff(-15, 12, 5), 'Muhammad Arslan']] },
      { id: 'a3', ref: 'EL (26)A/35', cls: 'Class 2 Medicines Recall', title: 'Amlodipine 5mg tablets — batch AM2201', product: '', batches: ['AM2201'], issued: dayOff(-24), due: dayOff(-22), status: 'Not affected', level: 'Pharmacy and wholesaler level', received: atOff(-24, 9, 0),
        actions: [['Alert received and logged', atOff(-24, 9, 0), 'Muhammad Arslan'], ['Product not stocked — no action needed', atOff(-24, 9, 10), 'Muhammad Arslan']] }
    ];
    const counts = [{ id: 'ST-0007', name: 'Monthly full count', scope: 'All stock', status: 'Completed', started: atOff(-30, 16, 0), by: 'Nurse Tom Reid', approvedBy: 'Muhammad Arslan', approved: atOff(-30, 17, 0), blind: true, lines: [{ batch: 'b8', expected: 14, counted: 12 }] }];
    const cdChecks = [{ id: 'cdc1', item: 'i12', at: atOff(-7, 17, 30), expected: 72, counted: 72, by: 'Muhammad Arslan', witness: 'Nurse Tom Reid', note: '' }, { id: 'cdc2', item: 'i12', at: atOff(-14, 17, 30), expected: 100, counted: 100, by: 'Muhammad Arslan', witness: 'Nurse Tom Reid', note: '' }];
    const incidents = [
      { id: 'INC-0042', at: atOff(-4, 8, 50), type: 'Temperature excursion', summary: 'Medicines fridge 1 max reading 9.1 °C (door left ajar after delivery). Stock quarantined, manufacturer advice: usable. Released.', status: 'Closed', by: 'Nurse Tom Reid', learning: 'Delivery checklist now includes "fridge door closed and alarm armed".' },
      { id: 'INC-0040', at: atOff(-12, 11, 0), type: 'Near miss', summary: 'Sertraline 100mg picked instead of 50mg — caught at accuracy check before hand-over.', status: 'Closed', by: 'Muhammad Arslan', learning: 'Strengths separated on Shelf B1; shelf labels highlighted.' }
    ];
    const sops = [['Ordering and receiving medicines', '2.1', dayOff(-200), dayOff(165)], ['Storage, security and cold chain', '3.0', dayOff(-320), dayOff(45)], ['Dispensing, labelling and accuracy checking', '2.4', dayOff(-90), dayOff(275)], ['Controlled drugs', '1.6', dayOff(-380), dayOff(-15)], ['Expiry, returns and pharmaceutical waste', '1.2', dayOff(-150), dayOff(215)], ['Medicines recalls and safety alerts', '1.1', dayOff(-60), dayOff(305)], ['Medication incidents and Yellow Card reporting', '1.3', dayOff(-40), dayOff(325)]]
      .map(([t, v, done, due], i) => ({ id: 'sop' + i, t, v, done, due, owner: i === 3 ? 'Dr Sana Bashir' : 'Muhammad Arslan' }));
    const settings = { cdao: 'Dr Sana Bashir', lead: 'Muhammad Arslan', twoPerson: true, postage: 7, fee: 0, expiryDays: 90, labelAddr: '12 Harley Street, London W1G 9PF', labelPhone: '020 7946 0000', blindCount: true, cdCheckDays: 7 };
    return { v: 1, sup, items, batches, moves, rx, pos, fridges, temps, alerts, counts, cdChecks, incidents, sops, settings, seq: { m: mid, po: 312, st: 7, inc: 42, b: 17, t: tid, rx: 10243, a: 3 } };
  }

  /* ---------------- state ---------------- */
  const load = () => { try { const raw = App.store.get(KEY); if (raw) { const d = JSON.parse(raw); if (d && d.v === 1) return d; } } catch (e) {} return null; };
  let D = null;
  const IV = App.IV = {
    get D() { if (!D) { D = load() || seed(); IV.autoExpire(); } return D; },
    save() { App.store.set(KEY, JSON.stringify(D)); },
    reset() { App.store.set(KEY, null); D = seed(); IV.autoExpire(); IV.save(); },
    DAY, iso, dayOff, atOff, today0,
    ui: App.ui.iv = { tab: 'overview', q: '', type: 'All', flag: 'All', page: 0, dq: 'To dispense', ord: 'orders', cd: 'i12', rec: 'moves', mq: '', mtype: 'All', fridge: 'f1' }
  };
  IV.id = k => { const s = IV.D.seq; s[k] = (s[k] || 0) + 1; return s[k]; };
  IV.me = () => App.me().name;
  IV.biz = () => { try { return (App.biz && App.biz().name) || 'LeafEase Clinic'; } catch (e) { return 'LeafEase Clinic'; } };
  IV.staff = () => [...new Set([IV.me(), 'Muhammad Arslan', 'Dr Sana Bashir', 'Dr Sarah Mitchell', 'Dr Olivia Brown', 'Nurse Tom Reid'])];

  /* ---------------- formatting ---------------- */
  IV.money = n => '£' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  IV.dd = s => s ? new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  IV.dt = s => s ? `${IV.dd(s)}, ${new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : '—';
  IV.tm = s => new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  IV.daysTo = s => s ? Math.round((new Date(s + 'T12:00:00') - today0()) / DAY) - 0 : Infinity;
  IV.chip = (t, tone, icon, cls = 'filled') => `<span class="chip sm ${cls} ${tone || ''}">${icon ? `<i class="${icon}"></i>` : ''}${esc(t)}</span>`;
  IV.LEGAL = { POM: ['POM', 't-blue'], P: ['P', 't-teal'], GSL: ['GSL', 't-grey'], CD2: ['CD Schedule 2', 't-red'], CD3: ['CD Schedule 3', 't-red'], 'CD4-1': ['CD Sch 4 Pt 1', 't-purple'], 'CD4-2': ['CD Sch 4 Pt 2', 't-purple'], CD5: ['CD Schedule 5', 't-grey'], None: ['Not a medicine', 't-grey'] };
  IV.legalChip = it => { const [t, tone] = IV.LEGAL[it.legal] || [it.legal, 't-grey']; return IV.chip(t, tone, it.legal.startsWith('CD') ? 'ri-lock-2-line' : ''); };
  IV.isCD = it => it && String(it.legal).startsWith('CD');
  IV.registerCD = it => it && ['CD2', 'CD3'].includes(it.legal); /* register legally required (Sch 2); Sch 3 kept by policy */
  IV.cold = it => it && /Fridge/.test(it.storage);

  /* ---------------- stock maths ---------------- */
  IV.item = id => IV.D.items.find(i => i.id === id);
  IV.batch = id => IV.D.batches.find(b => b.id === id);
  IV.sup = id => IV.D.sup.find(s => s.id === id) || { name: '—', licence: '' };
  IV.batchesOf = id => IV.D.batches.filter(b => b.item === id);
  IV.usable = b => b.status === 'Available' && b.qty > 0 && (!b.expiry || IV.daysTo(b.expiry) >= 0);
  IV.fefo = id => IV.batchesOf(id).filter(IV.usable).sort((a, b) => (a.expiry || '9999') < (b.expiry || '9999') ? -1 : 1);
  IV.onHand = id => IV.batchesOf(id).filter(IV.usable).reduce((n, b) => n + b.qty, 0);
  IV.held = id => IV.batchesOf(id).filter(b => !IV.usable(b) && b.qty > 0).reduce((n, b) => n + b.qty, 0);
  IV.nextExpiry = id => (IV.fefo(id).find(b => b.expiry) || {}).expiry || '';
  IV.isLow = it => it.reorder > 0 && IV.onHand(it.id) <= it.reorder;
  IV.isExpiring = it => { const e = IV.nextExpiry(it.id); return !!e && IV.daysTo(e) <= IV.D.settings.expiryDays; };
  IV.unitWord = (it, n) => n === 1 ? it.unit.replace(/s$/, '').replace(/xe$/, 'x') : it.unit;
  IV.qtyTxt = (it, n) => `${App.fmt(n)} ${IV.unitWord(it, n)}`;
  IV.autoExpire = () => { const D2 = D; let ch = false; D2.batches.forEach(b => { if (b.expiry && b.status === 'Available' && IV.daysTo(b.expiry) < 0 && b.qty > 0) { b.status = 'Expired'; ch = true;
      D2.moves.push({ id: 'm' + IV.id('m'), at: new Date().toISOString(), item: b.item, batch: b.id, type: 'Expired', qty: 0, by: 'System', ref: '', note: 'Batch passed its expiry date — moved to expired, awaiting destruction' }); } }); if (ch) IV.save(); };
  /* every stock change goes through here so the audit trail and CD register never drift from the batch quantities */
  IV.move = (itemId, batchId, type, qty, o = {}) => { const b = IV.batch(batchId); if (b) b.qty = Math.max(0, b.qty + qty);
    const m = Object.assign({ id: 'm' + IV.id('m'), at: new Date().toISOString(), item: itemId, batch: batchId, type, qty, by: IV.me(), ref: '', note: '' }, o); IV.D.moves.push(m); return m; };
  IV.cdBalance = itemId => IV.D.moves.filter(m => m.item === itemId && m.qty).reduce((n, m) => n + m.qty, 0);

  /* ---------------- the app's own prescriptions and allergies ----------------
     The dispensing queue is not a list of its own. A prescription written in a
     patient's record (Medical History › Create prescription) with "Dispense from
     practice stock" belongs in the dispensary, so Inventory reads those and keeps
     only the dispensing state — charge, picks, checks, hand-over — against them.
     Patient details and allergies are re-read from the record on every render, so
     an allergy added there reaches the clinical check straight away. */
  const PTx = () => App.PT || {};
  /* the patient's record, with Medical Alerts filled in (patients-care seeds them lazily) */
  const ptRec = p => { const PT = PTx(); if (!p || !PT.rec) return null;
    try { const r = PT.rec(p); if (r && !r.alerts && PT.alertCount) PT.alertCount(p); return r; } catch (e) { return null; } };
  IV.patient = id => (App.S.patients || []).find(p => p.id === id);
  IV.addrOf = p => [p.addr, p.city, p.postcode].filter(Boolean).join(', ');
  /* a prescribed medicine is a name + strength ("Amoxicillin", 500, "mg"); stock
     items carry the form too ("Amoxicillin 500mg capsules"), so match on the stem */
  const norm = x => String(x == null ? '' : x).toLowerCase().replace(/\s+/g, ' ').trim();
  IV.matchItem = (name, dose, unit) => { const items = IV.D.items.filter(i => i.active);
    const n = norm(name), full = norm(`${name} ${dose == null ? '' : dose}${unit || ''}`);
    if (!n) return '';
    return (items.find(i => norm(i.name).startsWith(full)) || items.find(i => norm(i.name) === n)
      || items.find(i => norm(i.name).startsWith(n + ' ')) || {}).id || ''; };
  /* Medical History allergies plus any active Allergy medical alert */
  IV.allergiesOf = pid => { const p = IV.patient(pid); if (!p) return [];
    const r = ptRec(p); if (!r) return [];
    const names = [...(r.alg || []).map(a => a.name),
      ...(r.alerts || []).filter(a => a.active && a.cat === 'Allergy').map(a => String(a.title).replace(/\s*allerg(y|ies)\s*$/i, ''))];
    return [...new Set(names.map(x => String(x || '').trim()).filter(Boolean))]; };

  /* one prescription from the patient's record -> one row in the queue */
  IV.fromScript = (p, s2) => { const at = s2.issuedAt || (s2.at && !isNaN(new Date(s2.at)) ? new Date(s2.at).toISOString() : new Date().toISOString());
    const lines = (s2.items || []).map(it => { const stock = IV.matchItem(it.name, it.dose, it.unit); return { item: stock,
      /* the stock item's own name carries the form ("capsules"), which the label
         and the private prescription register both need */
      drug: (stock && IV.item(stock).name) || [it.name, it.dose === '' || it.dose == null ? '' : `${it.dose}${it.unit || ''}`].filter(Boolean).join(' '),
      qty: +it.qty || 0, dose: [it.dose, it.unit].filter(x => x !== '' && x != null).join(' '),
      dirs: it.dirs || '', days: parseInt(it.dur, 10) || 0 }; });
    const fee = s2.fee === 'Paid prescription' ? +s2.feeAmt || 0 : 0;
    const r = { id: s2.no, src: p.id + '|' + s2.no, pid: p.id, patient: `${p.first} ${p.last}`, dob: p.dob, addr: IV.addrOf(p),
      allergies: IV.allergiesOf(p.id), prescriber: s2.by || '', reg: s2.reg || '', issued: at,
      handover: s2.handover === 'Post' ? 'Post' : 'Collect', status: 'To dispense', stage: '',
      /* the fee taken when the prescription was signed is the charge so far; "Edit
         charge" adds the medicines themselves at their sale price */
      charge: fee ? { lines: [{ t: 'Prescription fee (taken on the patient’s record)', amt: fee }], postage: 0, fee: 0, total: fee,
        status: s2.payStatus === 'Paid' ? 'Paid' : 'Awaiting payment', method: s2.pay || '', paidAt: s2.payStatus === 'Paid' ? at : '' } : null,
      picks: [], owing: [], lines, log: [['Prescription issued', at, s2.by || '']] };
    if (fee) r.log.push([`Prescription fee ${IV.money(fee)} ${s2.payStatus === 'Paid' ? 'taken by ' + String(s2.pay || '').toLowerCase() : 'awaiting payment'} on the patient’s record`, at, s2.by || '']);
    return r; };

  /* run before every Inventory screen: bring in new prescriptions, refresh the rest */
  IV.syncRx = () => { const D2 = IV.D; let ch = false;
    (App.S.patients || []).forEach(p => { const r = ptRec(p); if (!r || !r.scripts) return;
      r.scripts.forEach(s2 => { if (s2.dispatch !== 'stock' || !s2.no) return;
        const src = p.id + '|' + s2.no; if (D2.rx.some(x => x.src === src)) return;
        const row = IV.fromScript(p, s2); if (!row.lines.length) return;
        if (D2.rx.some(x => x.id === row.id)) row.id = row.id + '-' + p.id;
        D2.rx.push(row); ch = true; }); });
    D2.rx.forEach(r => { const p = r.pid && IV.patient(r.pid); if (!p) return;
      const nm = `${p.first} ${p.last}`, addr = IV.addrOf(p), alg = IV.allergiesOf(r.pid);
      if (r.patient !== nm || r.addr !== addr || r.dob !== p.dob || String(r.allergies) !== String(alg)) {
        r.patient = nm; r.addr = addr; r.dob = p.dob; r.allergies = alg; ch = true; } });
    if (ch) IV.save(); };

  /* The prescriptions waiting in the demo queue are written into the patients'
     records in the same shape Create prescription writes one, so the queue has a
     single source — the app's prescriptions — rather than a list of its own. */
  const DEMO_RX = [
    ['p1', { no: 'RX-10241', handover: 'Post', issuedAt: atOff(0, 11, 32), by: 'Dr Sana Bashir', reg: 'GMC 7123456',
      fee: 'Paid prescription', feeAmt: 9.56, pay: 'Payment Link', payStatus: 'Awaiting Payment',
      items: [{ name: 'Paracetamol', dose: 500, unit: 'mg', qty: 32, qtyUnit: 'tablets', dur: '4 days', dirs: 'Take one or two tablets up to four times a day when needed. Leave at least 4 hours between doses. No more than 8 tablets in 24 hours.' }] }],
    ['p4', { no: 'RX-10242', handover: 'Collect', issuedAt: atOff(0, 10, 5), by: 'Dr Sarah Mitchell', reg: 'GMC 7234567',
      items: [{ name: 'Amoxicillin', dose: 500, unit: 'mg', qty: 21, qtyUnit: 'capsules', dur: '7 days', dirs: 'Take ONE capsule THREE times a day for 7 days. Complete the course.' }] }],
    ['p6', { no: 'RX-10243', handover: 'Post', issuedAt: atOff(0, 9, 12), by: 'Dr Sana Bashir', reg: 'GMC 7123456',
      fee: 'Paid prescription', feeAmt: 16.24, pay: 'Card', payStatus: 'Paid',
      items: [{ name: 'Sertraline', dose: 50, unit: 'mg', qty: 28, qtyUnit: 'tablets', dur: '28 days', dirs: 'Take ONE tablet in the morning.' },
        { name: 'Omeprazole', dose: 20, unit: 'mg', qty: 28, qtyUnit: 'capsules', dur: '28 days', dirs: 'Take ONE capsule before breakfast.' }] }]
  ];
  IV.seedRx = () => { DEMO_RX.forEach(([pid, s2]) => { const p = IV.patient(pid); if (!p) return; const r = ptRec(p); if (!r) return;
      r.scripts = r.scripts || []; if (r.scripts.some(x => x.no === s2.no)) return;
      r.scripts.push(Object.assign({ at: new Date(s2.issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        org: IV.biz(), dispatch: 'stock', fee: 'Free prescription', feeAmt: 0, pay: '', payStatus: '', sig: 'Drawn' }, s2)); }); };
  /* the queue is only correct once both have run, so every route goes through here */
  IV.sync = () => { IV.seedRx(); IV.syncRx(); };

  /* a patient's name is always a way into their record; inside a dialog the link
     closes it first, so the record isn't left behind a scrim */
  IV.ptLink = (name, pid, o = {}) => pid ? `<a class="brand-u" href="#/patients/${pid}"${o.close ? ' data-act="close-modal"' : ''}>${esc(name)}</a>` : esc(name || '');
  IV.rxOf = ref => IV.D.rx.find(r => r.id === ref);
  /* a movement's "party" is the patient when the movement came from a prescription */
  IV.partyLink = (m, o) => { const r = m.ref && IV.rxOf(m.ref), raw = m.party || '';
    return !r || !r.pid || !raw.startsWith(r.patient) ? esc(raw) : IV.ptLink(r.patient, r.pid, o) + esc(raw.slice(r.patient.length)); };

  /* ---------------- small UI kit ---------------- */
  IV.keep = () => { const y = App.$('#page')?.scrollTop || 0, wy = scrollY; App.render(); const p = App.$('#page'); if (p) p.scrollTop = y; scrollTo(0, wy); };
  IV.input = (label, name, value = '', o = {}) => App.field(label, `${o.pre ? `<span class="adorn">${o.pre}</span>` : ''}<input name="${name}" ${o.type ? `type="${o.type}"` : ''} value="${esc(value)}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.attrs || ''}>${o.post ? `<span class="caption">${o.post}</span>` : ''}`, { req: o.req, cls: (o.cls || '') + ' iv-f-' + name });
  IV.sel = (label, name, options, value, o = {}) => App.field(label, `<select name="${name}" aria-label="${esc(label)}" ${o.attrs || ''}>${o.ph ? `<option value="">${esc(o.ph)}</option>` : ''}${options.map(x => { const v = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`, { req: o.req, cls: 'select ' + (o.cls || '') + ' iv-f-' + name });
  IV.area = (label, name, value = '', o = {}) => App.field(label, `<textarea name="${name}" rows="${o.rows || 3}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''}>${esc(value)}</textarea>`, { req: o.req, cls: 'multi iv-f-' + name });
  IV.check = (name, label, checked, o = {}) => `<label class="iv-check ${o.cls || ''}"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''} ${o.attrs || ''}><span>${label}</span></label>`;
  IV.vals = root => { const o = {}; App.$$('[name]', root).forEach(el => { o[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); }); return o; };
  IV.clearErr = root => { App.$$('.field.err', root).forEach(f => f.classList.remove('err')); App.$$('.iv-err', root).forEach(e => e.remove()); App.$$('.iv-check.err', root).forEach(e => e.classList.remove('err')); };
  IV.err = (root, name, msg) => { const el = App.$(`[name="${name}"]`, root); if (!el) return; const f = el.closest('.field') || el.closest('.iv-check'); f.classList.add('err'); if (msg) f.insertAdjacentHTML('afterend', `<div class="iv-err">${esc(msg)}</div>`); };
  IV.firstErr = root => App.$('.field.err input, .field.err select, .field.err textarea, .iv-check.err input', root)?.focus();
  IV.note = (html, tone = 'info', icon) => `<div class="iv-note ${tone}"><i class="${icon || { info: 'ri-information-line', warn: 'ri-error-warning-line', bad: 'ri-alarm-warning-line', good: 'ri-checkbox-circle-line' }[tone]}"></i><div>${html}</div></div>`;
  IV.dlg = (title, sub, body, foot, o = {}) => App.dialog(`${App.dlgHead(title, sub)}<div class="dlg-body iv-dlg">${body}</div><div class="dlg-foot">${foot}</div>`, { width: o.width || 640 });
  IV.kv = rows => `<dl class="iv-kv">${rows.filter(Boolean).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  IV.timeline = log => `<ol class="bl-tl">${log.slice().reverse().map(([t, at, by]) => `<li><b>${esc(t)}</b><small>${IV.dt(at)}${by ? ` · ${esc(by)}` : ''}</small></li>`).join('')}</ol>`;
  IV.pager = (n, p, act) => `<div class="pager"><span class="tnum">${n ? `${p * 10 + 1}–${Math.min(n, p * 10 + 10)} of ${n}` : '0 of 0'}</span><span class="row g4"><button class="icon-btn s20" data-act="${act}" data-v="-1" ${p ? '' : 'disabled'} aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></button><button class="icon-btn s20" data-act="${act}" data-v="1" ${p * 10 + 10 < n ? '' : 'disabled'} aria-label="Next page"><i class="ri-arrow-right-s-line"></i></button></span></div>`;
  IV.empty = (cols, text) => `<tr class="empty-row"><td colspan="${cols}">${text}</td></tr>`;
  IV.csv = (name, rows) => { const s = rows.map(r => r.map(c => { const v = String(c == null ? '' : c); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + s], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); App.snack(`${name} downloaded.`); };

  /* ---------------- frame ---------------- */
  const TABS = [['overview', 'Overview'], ['stock', 'Stock'], ['dispensing', 'Dispensing queue'], ['orders', 'Orders'], ['cd', 'Controlled drugs'], ['fridge', 'Fridge log'], ['alerts', 'Recalls'], ['counts', 'Stock takes'], ['records', 'Records'], ['flows', 'Flows']];
  IV.meta = { key: 'inventory', icon: 'ri-archive-2-line', title: 'Inventory' };
  IV.badge = tab => { const D2 = IV.D; const n = { dispensing: D2.rx.filter(r => r.status === 'To dispense' || r.status === 'In progress').length, alerts: D2.alerts.filter(a => a.status === 'Open').length, fridge: IV.fridgeDue().length }[tab]; return n ? `<span class="iv-count">${n}</span>` : ''; };
  IV.frame = (tab, body, o = {}) => `
    <div class="iv-head"><div class="stack g4"><h1 class="iv-h1">${esc(o.title || 'Inventory')}</h1><p class="body2 muted" style="margin:0">${o.sub || 'Stock held by this business, and prescriptions waiting to be dispensed from it.'}</p></div>
      <div class="row g8 wrap">${o.actions || ''}</div></div>
    <div class="iv-tabs-wrap"><div class="pt-seg iv-tabs" role="tablist" aria-label="Inventory sections">${TABS.map(([k, t]) => `<button role="tab" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}" data-go="#/inventory${k === 'overview' ? '' : '/' + k}">${t}${IV.badge(k)}</button>`).join('')}</div></div>
    ${body}`;
  /* The prototype's own "Reset" (bottom right) restores the demo data. It only
     knows about the CRM key, so Inventory hangs its own reset off the same
     button rather than putting a second one on the page. */
  const appReset = App.acts.reset;
  App.acts.reset = (el, e) => { App.store.set(KEY, null); return appReset ? appReset(el, e) : undefined; };
  App.acts['iv-reset'] = () => IV.dlg('Reset demo data?', 'Every inventory change you made in this browser will be replaced with the original demo data.', '', `<button class="btn text" data-act="close-modal">Cancel</button><button class="btn danger" data-act="iv-reset-go">Reset</button>`, { width: 440 });
  App.acts['iv-reset-go'] = () => { IV.reset(); App.closeModal(); App.render(); App.snack('Inventory demo data restored.'); };

  /* ---------------- overview ---------------- */
  IV.fridgeDue = () => { const D2 = IV.D, h = new Date().getHours(); return D2.fridges.filter(f => { const t = D2.temps.filter(x => x.fridge === f.id && x.at.slice(0, 10) === new Date().toISOString().slice(0, 10)); return !t.length || (h >= 14 && t.length < 2); }); };
  IV.cdCheckDue = () => { const D2 = IV.D; return D2.items.filter(i => IV.registerCD(i) && i.active).filter(i => { const last = D2.cdChecks.filter(c => c.item === i.id).sort((a, b) => a.at < b.at ? 1 : -1)[0]; return !last || (Date.now() - new Date(last.at)) / DAY >= D2.settings.cdCheckDays; }); };
  const tile = (icon, tone, n, t, sub, go) => `<button class="iv-tile" data-go="${go}"><span class="bl-ic ${tone}"><i class="${icon}"></i></span><span class="grow"><b class="tnum">${n}</b><span>${t}</span><small>${sub}</small></span><i class="ri-arrow-right-s-line iv-tile-go"></i></button>`;
  App.route('/inventory', () => { IV.sync(); const D2 = IV.D, act = D2.items.filter(i => i.active);
    const low = act.filter(IV.isLow), exp = act.filter(IV.isExpiring), held = D2.batches.filter(b => !IV.usable(b) && b.qty > 0), todo = D2.rx.filter(r => r.status === 'To dispense'), chk = D2.rx.filter(r => r.stage === 'Awaiting check'), ready = D2.rx.filter(r => r.stage === 'Ready for collection'),
      openA = D2.alerts.filter(a => a.status === 'Open'), fdue = IV.fridgeDue(), cdue = IV.cdCheckDue(), sopDue = D2.sops.filter(s => IV.daysTo(s.due) < 30), value = D2.batches.filter(IV.usable).reduce((n, b) => n + b.qty * IV.item(b.item).cost, 0);
    const tasks = [
      ...openA.map(a => ['bad', 'ri-alarm-warning-line', `Action recall ${a.ref}`, `${a.title} · action due ${IV.dd(a.due)}`, '#/inventory/alerts']),
      ...fdue.map(f => ['warn', 'ri-temp-cold-line', `Record today’s ${new Date().getHours() >= 14 ? 'afternoon' : 'morning'} reading — ${f.name}`, 'Current, minimum and maximum, then reset the thermometer', '#/inventory/fridge']),
      ...cdue.map(i => ['warn', 'ri-lock-2-line', `CD balance check due — ${i.name}`, `Register balance ${IV.qtyTxt(i, IV.cdBalance(i.id))} · check every ${D2.settings.cdCheckDays} days`, '#/inventory/cd']),
      ...chk.map(r => ['info', 'ri-user-follow-line', `Accuracy check — ${r.patient}`, `${r.lines.map(l => l.drug).join(', ')} · dispensed by ${r.dispensedBy}`, '#/inventory/dispensing']),
      ...held.filter(b => b.status === 'Expired').map(b => ['info', 'ri-delete-bin-6-line', `Destroy expired stock — ${IV.item(b.item).name}`, `Batch ${b.batch} · ${IV.qtyTxt(IV.item(b.item), b.qty)} in the expired tray`, '#/inventory/item/' + b.item]),
      ...sopDue.map(s => ['info', 'ri-file-text-line', `Review SOP — ${s.t}`, IV.daysTo(s.due) < 0 ? `Overdue since ${IV.dd(s.due)}` : `Due ${IV.dd(s.due)}`, '#/inventory/records?sops'])];
    const recent = D2.moves.slice().sort((a, b) => a.at < b.at ? 1 : -1).slice(0, 6);
    return IV.frame('overview', `
      <div class="iv-tiles">${tile('ri-capsule-line', 'teal', todo.length, 'To dispense', `${chk.length} awaiting check · ${ready.length} ready to hand over`, '#/inventory/dispensing')}${tile('ri-arrow-down-circle-line', 'red', low.length, 'Low stock', 'At or below reorder level', '#/inventory/stock?low')}${tile('ri-hourglass-line', 'orange', exp.length, 'Expiring soon', `Within ${D2.settings.expiryDays} days`, '#/inventory/stock?exp')}${tile('ri-forbid-2-line', 'grey', held.length, 'Not for use', 'Quarantined or expired batches', '#/inventory/stock?held')}</div>
      <div class="iv-two">
        <section class="card card-pad stack g16"><div class="row between"><h2 class="h6">Needs attention</h2><span class="caption">${tasks.length} open</span></div>
          ${tasks.length ? `<ul class="iv-tasks">${tasks.map(([tone, i, t, s, go]) => `<li><button data-go="${go}"><span class="iv-dot ${tone}"><i class="${i}"></i></span><span class="grow"><b>${esc(t)}</b><small>${esc(s)}</small></span><i class="ri-arrow-right-s-line"></i></button></li>`).join('')}</ul>` : IV.note('Nothing needs attention. Stock, fridges and controlled drugs are up to date.', 'good')}</section>
        <div class="stack g16">
          <section class="card card-pad stack g12"><h2 class="h6">Stock at a glance</h2>${IV.kv([['Active items', act.length], ['Stock value (cost)', IV.money(value)], ['Controlled drugs', act.filter(IV.isCD).length + ' items'], ['Cold chain items', act.filter(IV.cold).length + ' items'], ['Open purchase orders', D2.pos.filter(p => ['Sent', 'Part received'].includes(p.status)).length], ['CD accountable officer', esc(D2.settings.cdao)]])}</section>
          <section class="card card-pad stack g12"><div class="row between"><h2 class="h6">Recent stock activity</h2><a class="btn text brand sm" href="#/inventory/records">View all</a></div>
            <ul class="iv-feed">${recent.map(m => { const it = IV.item(m.item), b = IV.batch(m.batch); return `<li><span class="iv-mv ${m.qty > 0 ? 'in' : m.qty < 0 ? 'out' : ''}">${m.qty > 0 ? '+' : ''}${m.qty || '•'}</span><span class="grow"><b>${esc(m.type)} · ${esc(it.name)}</b><small>${b ? 'Batch ' + esc(b.batch) + ' · ' : ''}${IV.dt(m.at)} · ${esc(m.by)}</small></span></li>`; }).join('')}</ul></section>
        </div></div>`, { actions: `<button class="btn outlined" data-act="iv-receive"><i class="ri-inbox-archive-line"></i>Receive stock</button>` }); }, IV.meta);
  IV.query = () => (location.hash.split('?')[1] || '');
  App.route('/inventory/:tab', tab => { IV.sync(); return (IV.tabs[tab] || IV.tabs.stock)(); }, IV.meta);
  IV.tabs = {};
})();

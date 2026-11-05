/* Seed data for the LeafEase CRM prototype. Everything here is fictional demo content. */
window.SEED = function () {
  const team = [
    { id: 'om', name: 'Omar Haddad', role: 'Marketing', presence: 'online' },
    { id: 'ma', name: 'Muhammad Arslan', role: 'Clinician', presence: 'online' },
    { id: 'sb', name: 'Sana Bashir', role: 'Front desk', presence: 'away' }
  ];

  const conversations = [
    { id: 'c1', name: 'Priya Anand', channel: 'Instagram', patientId: 'HC-10231', unread: true, when: '1h', assignee: 'om', windowLeft: '23h 04m',
      messages: [
        { dir: 'in', text: 'Hi, do you offer peptide treatments?', at: '1h ago' },
        { dir: 'out', text: 'Hi Priya! Yes, we run weight-loss and recovery peptide programmes, led by our clinicians.', at: 'Omar · 58m ago' },
        { dir: 'in', text: 'Great, how do I get started?', at: '55m ago' },
        { dir: 'out', text: 'You can book a consultation here, or I can help you pick a time. Which suits you?', at: 'Omar · 50m ago' }
      ] },
    { id: 'c2', name: 'Sarah Whitmore', channel: 'WhatsApp', patientId: 'HC-10198', unread: true, when: '2m', assignee: 'sb', windowLeft: '23h 58m',
      messages: [
        { dir: 'out', text: 'Hi Sarah, your review is confirmed for Thursday at 10:30.', at: 'Sana · 20m ago' },
        { dir: 'in', text: 'Thanks, see you then!', at: '2m ago' }
      ] },
    { id: 'c3', name: 'James O’Connor', channel: 'Email', email: 'james.oconnor@gmail.com', patientId: 'HC-09877', unread: true, when: '18m', assignee: 'om', subject: 'Re: prescription query',
      messages: [
        { dir: 'out', from: 'Omar Haddad', fromEmail: 'reception@phoenixsurgery.nhs.uk', to: 'james.oconnor@gmail.com', at: 'Yesterday 16:40', text: 'Hi James, thanks for getting in touch. I’ve passed your request to Dr Mensah for review — repeat prescriptions are usually approved within two working days.\n\nOmar · Phoenix Surgery reception' },
        { dir: 'in', from: 'James O’Connor', fromEmail: 'james.oconnor@gmail.com', to: 'reception@phoenixsurgery.nhs.uk', at: '18m ago', text: 'Thanks Omar. Has it been approved yet? I’m down to my last two days of tablets and I’m away from Friday.\n\nI’ve attached the old prescription in case it helps.', files: [{ name: 'prescription-aug-2026.pdf', size: '142 KB' }] }
      ] },
    { id: 'c4', name: 'Daniel Reeves', channel: 'Facebook', patientId: 'HC-10302', when: '2h', assignee: null, windowLeft: '21h 50m',
      messages: [{ dir: 'in', text: 'Is the clinic open Saturday?', at: '2h ago' }] },
    { id: 'c5', name: 'Aisha Khan', channel: 'WhatsApp', patientId: 'HC-10110', when: '3h', assignee: 'sb', windowLeft: '20h 12m',
      messages: [
        { dir: 'out', text: 'We have a 2:15pm slot on Tuesday with Dr Hughes. Shall I book it?', at: 'Sana · 3h ago' },
        { dir: 'in', text: 'Booked, thank you', at: '3h ago' }
      ] },
    { id: 'c6', name: 'Tom Bennett', channel: 'Email', email: 'tom.b@email.com', patientId: 'HC-10045', when: '5h', assignee: null, subject: 'Question about my invoice',
      messages: [{ dir: 'in', from: 'Tom Bennett', fromEmail: 'tom.b@email.com', to: 'accounts@leafease.co.uk', at: '5h ago', text: 'Hello, I was charged twice for my IV drip appointment on 14 September. Could you check and refund one of them?\n\nThanks, Tom' }] },
    { id: 'c7', name: 'Megan Cole', channel: 'Instagram', patientId: null, when: '6h', assignee: null, windowLeft: '17h 40m',
      messages: [{ dir: 'in', text: 'How much is the weight-loss plan?', at: '6h ago' }] }
  ];

  const templateCats = ['Appointments', 'Prescription', 'Medicine', 'Payment', 'Consultation / Requests', 'Diet & Lifestyle', 'Documents', 'Blood Tests', 'Measurements & Vitals', 'Medical History'];
  const T = (id, kind, cat, title, body, status, by) => ({ id, kind, cat, title, body, status, by, date: '10/10/2025' });
  const templates = [
    T('t1', 'staff', 'Appointments', 'Initial Dermatology Screening', 'Thank you for coming in. Keep an eye on the rash and avoid any known irritants. We’ll reassess in two weeks.', 'Active', 'Dr Rebecca Hughes'),
    T('t2', 'staff', 'Appointments', 'Diabetes Management Review', 'Your glucose levels have stabilised well. Continue your current medication and maintain your diet.', 'Draft', 'Dr Rebecca Hughes'),
    T('t3', 'staff', 'Appointments', 'Annual Physical Examination', 'All vitals are within normal ranges. Remember to schedule your flu shot before winter.', 'Draft', 'Omar Haddad'),
    T('t4', 'staff', 'Blood Tests', 'Blood test results are in', 'Your blood test results are back and look normal. Your clinician will go through them at your next review.', 'Active', 'Sana Bashir'),
    T('t5', 'staff', 'Blood Tests', 'Fasting before your blood test', 'Please don’t eat for 8 hours before your blood test. Water is fine.', 'Active', 'Sana Bashir'),
    T('t6', 'staff', 'Blood Tests', 'Book your follow-up blood test', 'It’s time for your follow-up blood test. Reply to this message and we’ll find a slot that suits you.', 'Active', 'Omar Haddad'),
    T('t7', 'standard', 'Appointments', 'Appointment reminder', 'Hi {first_name}, a reminder that your appointment is on {date} at {time}. Reply C to confirm.', 'Active', 'LeafEase'),
    T('t8', 'standard', 'Appointments', 'Book a consultation', 'You can book a consultation here: {booking_link}. Or reply and we’ll help you pick a time.', 'Active', 'LeafEase'),
    T('t9', 'standard', 'Prescription', 'Repeat prescription received', 'Thanks, we’ve received your repeat prescription request. Repeat prescriptions are usually approved within two working days.', 'Active', 'LeafEase'),
    T('t10', 'standard', 'Payment', 'Payment link', 'Here is your secure payment link for {service}: {payment_link}', 'Active', 'LeafEase'),
    T('t11', 'standard', 'Consultation / Requests', 'Opening hours', 'We’re open Monday to Friday 8:00–18:30 and Saturday 9:00–13:00.', 'Active', 'LeafEase'),
    T('t12', 'standard', 'Diet & Lifestyle', 'Weight-loss plan pricing', 'Our weight-loss programme starts at £149 a month, including a clinician review every four weeks.', 'Active', 'LeafEase'),
    T('t13', 'standard', 'Documents', 'Please upload your documents', 'Please upload a photo ID and your latest test results here: {upload_link}', 'Active', 'LeafEase'),
    T('t14', 'standard', 'Measurements & Vitals', 'Send us your weekly weight', 'Please reply with this week’s weight so your clinician can review your progress.', 'Active', 'LeafEase'),
    T('t15', 'standard', 'Medical History', 'Update your medical history', 'Before your appointment, please update your medical history here: {form_link}', 'Active', 'LeafEase')
  ];

  const segments = [
    { id: 's1', name: 'Weight-loss – lapsed 3mo', type: 'Customers', contacts: 342, customers: 300, leads: 42, lastUsed: '2 days ago', created: '12 Jun 2026', by: 'Omar Haddad',
      filters: { audience: 'Customers', location: 'All locations', site: 'Leicester', gender: 'Any', ageMin: 18, ageMax: 65, window: '01/12/2025 - 01/12/2026', since: 'More than 3 months ago', services: ['Weight loss'] },
      used: [{ name: 'Weight-loss winback', kind: 'Campaign', when: 'sent 12 Jul', status: 'Sent' }, { name: 'IV summer offer', kind: 'Campaign', when: 'scheduled 20 Jul', status: 'Scheduled' }, { name: 'Weight-loss re-order nudge', kind: 'Automation', when: 'active', status: 'Active' }] },
    { id: 's2', name: 'TRT patients – due review', type: 'Customers', contacts: 128, customers: 128, leads: 0, lastUsed: '1 week ago', created: '02 May 2026', by: 'Muhammad Arslan',
      filters: { audience: 'Customers', location: 'All locations', site: 'Leicester', gender: 'Male', ageMin: 30, ageMax: 65, window: '01/01/2026 - 01/10/2026', since: 'More than 6 months ago', services: ['TRT'] }, used: [] },
    { id: 's3', name: 'IV drip – one visit only', type: 'Customers', contacts: 211, customers: 211, leads: 0, lastUsed: '3 days ago', created: '20 Apr 2026', by: 'Omar Haddad',
      filters: { audience: 'Customers', location: 'All locations', site: 'Nottingham', gender: 'Any', ageMin: 18, ageMax: 100, window: '01/01/2026 - 01/10/2026', since: 'More than 1 month ago', services: ['IV drip'] }, used: [] },
    { id: 's4', name: 'Abandoned bookings – this month', type: 'Leads', contacts: 86, customers: 0, leads: 86, lastUsed: 'Today', created: '01 Sep 2026', by: 'Sana Bashir',
      filters: { audience: 'Leads', location: 'All locations', site: 'Leicester', gender: 'Any', ageMin: 18, ageMax: 100, window: '01/09/2026 - 30/09/2026', since: 'Any time', services: [] }, used: [] },
    { id: 's5', name: 'Aesthetics – Nottingham', type: 'Customers', contacts: 164, customers: 164, leads: 0, lastUsed: '2 days ago', created: '14 Mar 2026', by: 'Omar Haddad',
      filters: { audience: 'Customers', location: 'East Midlands', site: 'Nottingham', gender: 'Any', ageMin: 25, ageMax: 60, window: '01/03/2026 - 01/10/2026', since: 'Any time', services: ['Aesthetics'] }, used: [] },
    { id: 's6', name: 'Peptide enquiries', type: 'Mixed', contacts: 97, customers: 31, leads: 66, lastUsed: 'Yesterday', created: '28 Aug 2026', by: 'Omar Haddad',
      filters: { audience: 'All', location: 'All locations', site: 'Leicester', gender: 'Any', ageMin: 18, ageMax: 100, window: '01/06/2026 - 01/10/2026', since: 'Any time', services: ['Peptides'] }, used: [] }
  ];

  const C = (id, name, desc, seg, status, when, extra) => Object.assign({ id, name, desc, segmentId: seg, channel: 'Email', status, when }, extra || {});
  const campaigns = [
    C('k1', 'Weight-loss winback', 'Customers with a weight-loss service, no visit in 90 days', 's1', 'Sent', '12/7/2026 · 09:00', { subject: 'We miss you — 15% off your next review', sentBy: 'Omar Haddad' }),
    C('k2', 'TRT review reminder', 'TRT patients due a six-monthly review', 's2', 'Sent', '02/7/2026 · 07:00', { subject: 'Time for your TRT review' }),
    C('k3', 'IV summer offer', 'One-visit IV drip customers, summer price', 's3', 'Scheduled', '20/7/2026 · 10:00', { subject: 'Summer IV drip — £20 off' }),
    C('k4', 'Finish your booking', 'Leads who dropped out of a booking this month', 's4', 'Draft', null, { subject: 'You’re nearly booked in' }),
    C('k5', 'Aesthetics autumn update', 'Aesthetics customers in Nottingham', 's5', 'Sent', '2 days ago', { subject: 'New autumn aesthetics treatments' }),
    C('k6', 'Peptide programme launch', 'Everyone who asked about peptides', 's6', 'Scheduled', '01/10/2026 · 07:00', { subject: 'Our peptide programme is here' })
  ];

  const statuses = [
    { id: 'new', name: 'New', meaning: 'Captured when a journey is abandoned — nothing done yet', picker: 'Captured automatically — nothing done yet', tone: 't-grey', applies: 'All', shown: true, locked: true },
    { id: 'attempted', name: 'Attempted contact', meaning: 'You reached out, no reply yet', picker: 'You reached out, no reply yet', tone: 't-orange', applies: 'All', shown: true },
    { id: 'conversation', name: 'In conversation', meaning: 'They replied — talks are live', picker: 'They replied — talks are live', tone: 't-blue', applies: 'All', shown: true },
    { id: 'reengaged', name: 'Re-engaged', meaning: 'Back in a journey or booked in', picker: 'Back in a journey or booked in', tone: 't-green', applies: 'All', shown: true },
    { id: 'notinterested', name: 'Not interested', meaning: 'They declined — stop following up', picker: 'They declined — stop following up', tone: 't-red', applies: 'All', shown: true },
    { id: 'unreachable', name: 'Unreachable', meaning: 'No answer after your attempts', picker: 'No answer after your attempts', tone: 't-purple', applies: 'All', shown: true },
    { id: 'deposit', name: 'Deposit pending', meaning: 'Payment link sent, not paid yet', picker: 'Payment link sent, not paid yet', tone: 't-teal', applies: 'Leads', shown: false }
  ];

  const actions = [
    { id: 'called', name: 'Called', helper: 'Phone call or voicemail', icon: 'ri-phone-line', required: true, shown: true },
    { id: 'emailed', name: 'Emailed', helper: 'Any email you sent', icon: 'ri-mail-line', required: true, shown: true },
    { id: 'texted', name: 'Texted', helper: 'SMS or WhatsApp', icon: 'ri-chat-3-line', required: true, shown: true },
    { id: 'resume', name: 'Sent resume link', helper: 'Link back to their journey', icon: 'ri-links-line', required: true, shown: true },
    { id: 'voucher', name: 'Sent a voucher', helper: 'Discount or offer', icon: 'ri-coupon-3-line', required: false, shown: true },
    { id: 'person', name: 'Met in person', helper: 'Visit or walk-in', icon: 'ri-user-line', required: false, shown: true },
    { id: 'letter', name: 'Posted a letter', helper: 'Printed letter sent by post', icon: 'ri-mail-send-line', required: false, shown: false, custom: true }
  ];

  const stages = [
    { id: 'draft', name: 'Draft', meaning: 'Being written — nothing sent yet', counts: 'Not started', tone: 't-grey', shown: true, locked: true },
    { id: 'scheduled', name: 'Scheduled', meaning: 'Queued to go out at a set time', counts: 'Active', tone: 't-blue', shown: true },
    { id: 'sending', name: 'Sending', meaning: 'Going out to the segment now', counts: 'Active', tone: 't-orange', shown: true },
    { id: 'sent', name: 'Sent', meaning: 'Delivered — waiting to see what happens', counts: 'Active', tone: 't-blue', shown: true },
    { id: 'engaged', name: 'Engaged', meaning: 'Someone opened, clicked or replied', counts: 'Active', tone: 't-green', shown: true },
    { id: 'converted', name: 'Converted', meaning: 'Booked or paid after this campaign', counts: 'Won', tone: 't-green', shown: true },
    { id: 'closed', name: 'Closed', meaning: 'Finished — no further action', counts: 'Closed', tone: 't-purple', shown: false }
  ];

  const J = (title, steps, dropAt, extra) => Object.assign({ title, steps, dropAt }, extra);
  const leads = [
    { id: 'l1', name: 'Dr Bob Mensah', initials: 'BM', email: 'bob.mensah@nhs.net', phone: '+44 7700 900112', type: 'Clinician', journey: 'Clinician registration', dropped: 'Credentials · 50% done', source: 'Website', sourceIcon: 'ri-global-line', last: '01 May 2026 · 14:02', lastRel: '3 days ago', status: 'attempted', owner: 'Sana Bashir', short: 'Clinician reg · 50%',
      sub: 'Contact since 02 Aug 2026 · 2 registration journeys · Cardiology · GMC 7654321 · owner Sana Bashir',
      journeys: [J('Clinician registration #2', ['Website', 'Start', 'Personal', 'Professional', 'Credentials', 'Services', 'Availability', 'Submit'], 4, { current: true, started: '19 Sep 2026, 10:02', lastAct: '19 Sep 2026, 10:31', completion: '50% · 4 of 8 steps', after: '24 h no activity (rule)', src: 'Website · /join-clinicians', note: 'Current · started 3 days ago' }),
                 J('Clinician registration #1', [], 3, { collapsed: '02 Aug 2026 · dropped at Professional · 25%' })],
      done: { called: 'Sana B. · 20 Sep, 14:20', emailed: 'Sana B. · 20 Sep, 10:31', resume: 'Sana B. · 19 Sep, 16:05' } },
    { id: 'l2', name: 'Rajesh Patel', initials: 'RP', email: 'r.patel@email.com', phone: '+44 7700 900219', type: 'Patient', journey: 'TRT consultation', dropped: 'Payment · 75% done', source: 'Website', sourceIcon: 'ri-global-line', last: '02 May 2026 · 09:18', lastRel: '2 days ago', status: 'conversation', owner: 'Omar Haddad', short: 'TRT consult · 75%',
      sub: 'Contact since 21 Sep 2026 · 1 booking journey · TRT consultation · £80 · owner Omar Haddad',
      journeys: [J('TRT consultation booking #1', ['Website', 'Select service', 'Patient details', 'Health info', 'Upload report', 'Review', 'Payment', 'Confirmation'], 6, { current: true, badge: 'Payment abandoned', started: '21 Sep 2026, 16:20', lastAct: '21 Sep 2026, 16:52', completion: '75% · 6 of 8 steps', payment: 'Unpaid · card not entered', value: '£80.00', src: 'Google Ads · trt-uk', note: 'Current · started yesterday' })],
      done: { called: 'Omar H. · 21 Sep, 09:40', voucher: 'Omar H. · 21 Sep, 09:52' } },
    { id: 'l3', name: 'Unknown visitor', initials: '?', email: null, phone: null, missing: 'No name or email captured', type: 'Enquiry', journey: 'Weight-loss plan', dropped: 'Personal details · 20% done', source: 'Website chat', sourceIcon: 'ri-global-line', last: '03 May 2026 · 16:40', lastRel: 'Yesterday', status: 'new', owner: null, short: 'Weight-loss · 20%',
      sub: 'Captured 03 May 2026 · 1 booking journey · Weight-loss plan · no contact details', journeys: [J('Weight-loss plan #1', ['Website', 'Select plan', 'Personal details', 'Health info', 'Review', 'Payment'], 2, { current: true, started: '03 May 2026, 16:31', lastAct: '03 May 2026, 16:40', completion: '20% · 2 of 6 steps', src: 'Website chat' })], done: {} },
    { id: 'l4', name: 'Dr Chen Li', initials: 'CL', email: 'chen.li@gmail.com', phone: '+44 7700 900553', type: 'Clinician', journey: 'Clinician registration', dropped: 'Professional · 35% done', source: 'Referral', sourceIcon: 'ri-share-forward-line', last: '01 May 2026 · 11:05', lastRel: '3 days ago', status: 'attempted', owner: 'Sana Bashir', short: 'Clinician reg · 35%',
      sub: 'Contact since 28 Apr 2026 · 1 registration journey · Dermatology · owner Sana Bashir', journeys: [J('Clinician registration #1', ['Website', 'Start', 'Personal', 'Professional', 'Credentials', 'Services', 'Availability', 'Submit'], 3, { current: true, started: '01 May 2026, 10:40', lastAct: '01 May 2026, 11:05', completion: '35% · 3 of 8 steps', src: 'Referral' })], done: { emailed: 'Sana B. · 02 May, 09:10' } },
    { id: 'l5', name: '+44 7700 900214', initials: '?', email: null, phone: '+44 7700 900214', missing: 'Phone only — no name or email', type: 'Enquiry', journey: 'IV drip booking', dropped: 'Slot selection · 40% done', source: 'Phone call', sourceIcon: 'ri-phone-line', last: '03 May 2026 · 10:22', lastRel: 'Yesterday', status: 'new', owner: null, short: 'IV drip · 40%',
      sub: 'Captured 03 May 2026 · 1 booking journey · IV drip · phone only', journeys: [J('IV drip booking #1', ['Website', 'Select drip', 'Slot selection', 'Details', 'Payment'], 2, { current: true, started: '03 May 2026, 10:12', lastAct: '03 May 2026, 10:22', completion: '40% · 2 of 5 steps', src: 'Phone call' })], done: {} },
    { id: 'l6', name: '@megan.cole', initials: 'MC', email: null, phone: null, missing: 'Instagram handle only — no email', type: 'Enquiry', journey: 'No journey yet', dropped: 'Not started', source: 'Instagram DM', sourceIcon: 'ri-instagram-line', last: '04 May 2026 · 08:05', lastRel: 'Today', status: 'conversation', owner: 'Omar Haddad', short: 'No journey yet', conversationId: 'c7',
      sub: 'Captured 04 May 2026 · Instagram enquiry · no journey started', journeys: [], done: {} },
    { id: 'l7', name: 'Aisha Rahman', initials: 'AR', email: 'aisha@email.com', phone: '+44 7700 900330', type: 'Patient', journey: 'Weight-loss plan', dropped: 'Payment · 80% done', source: 'Website', sourceIcon: 'ri-global-line', last: '28 Apr 2026 · 19:30', lastRel: '6 days ago', status: 'reengaged', owner: 'Omar Haddad', short: 'Weight-loss · 80%',
      sub: 'Contact since 20 Apr 2026 · 1 booking journey · Weight-loss plan · owner Omar Haddad', journeys: [J('Weight-loss plan #1', ['Website', 'Select plan', 'Personal details', 'Health info', 'Review', 'Payment'], 5, { current: true, started: '28 Apr 2026, 19:02', lastAct: '28 Apr 2026, 19:30', completion: '80% · 5 of 6 steps', src: 'Website' })], done: { called: 'Omar H. · 29 Apr, 10:00', texted: 'Omar H. · 29 Apr, 10:05' } },
    { id: 'l8', name: 'Tom Baker', initials: 'TB', email: 'tom.b@email.com', phone: '+44 7700 900401', type: 'Patient', journey: 'IV drip booking', dropped: 'Slot selection · 40% done', source: 'Walk-in', sourceIcon: 'ri-map-pin-line', last: '27 Apr 2026 · 13:12', lastRel: '7 days ago', status: 'unreachable', owner: 'Sana Bashir', short: 'IV drip · 40%',
      sub: 'Contact since 27 Apr 2026 · 1 booking journey · IV drip · owner Sana Bashir', journeys: [J('IV drip booking #1', ['Website', 'Select drip', 'Slot selection', 'Details', 'Payment'], 2, { current: true, started: '27 Apr 2026, 13:00', lastAct: '27 Apr 2026, 13:12', completion: '40% · 2 of 5 steps', src: 'Walk-in' })],
      done: { called: 'Sana B. · 28 Apr, 09:30', emailed: 'Sana B. · 28 Apr, 09:40', texted: 'Sana B. · 29 Apr, 11:00', resume: 'Sana B. · 29 Apr, 11:02' } },
    { id: 'l9', name: 'James O’Connor', initials: 'JO', email: 'james.oconnor@gmail.com', phone: '+44 7700 900550', type: 'Patient', journey: 'Prescription enquiry', dropped: 'Not started', source: 'Email', sourceIcon: 'ri-mail-line', last: '29 Apr 2026 · 16:40', lastRel: '5 days ago', status: 'notinterested', owner: 'Omar Haddad', short: 'Prescription enquiry', conversationId: 'c3',
      sub: 'Contact since 12 Jan 2026 · prescription enquiry · owner Omar Haddad', journeys: [], done: { emailed: 'Omar H. · 29 Apr, 16:40' } },
    { id: 'l10', name: 'Sarah Whitmore', initials: 'SW', email: 's.whitmore@email.com', phone: '+44 7700 900777', type: 'Patient', journey: 'TRT consultation', dropped: 'Review · 60% done', source: 'Website', sourceIcon: 'ri-global-line', last: '22 Apr 2026 · 10:10', lastRel: '12 days ago', status: 'unreachable', owner: 'Sana Bashir', short: 'TRT consult · 60%', conversationId: 'c2',
      sub: 'Contact since 18 Apr 2026 · 1 booking journey · TRT consultation · owner Sana Bashir', journeys: [J('TRT consultation booking #1', ['Website', 'Select service', 'Patient details', 'Health info', 'Upload report', 'Review', 'Payment', 'Confirmation'], 5, { current: true, started: '22 Apr 2026, 09:40', lastAct: '22 Apr 2026, 10:10', completion: '60% · 5 of 8 steps', src: 'Website' })], done: { called: 'Sana B. · 23 Apr, 09:00' } }
  ];

  const notes = { l1: [{ by: 'Dr. Rebecca Hughes (General Practitioner)', text: 'Asked to call back after 5pm — on shift until then.', at: '18 April 2026 at 14:30' }], l2: [{ by: 'Dr. Rebecca Hughes (General Practitioner)', text: 'Card was declined twice. Offered to take payment by phone.', at: '21 Sep 2026 at 10:02' }] };

  return { team, conversations, templateCats, templates, segments, campaigns, statuses, actions, stages, leads, notes };
};

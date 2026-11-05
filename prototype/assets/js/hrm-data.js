/* HRM › Recruitment demo data. Demo "today" is Thu 08 Oct 2026, matching the Figma. */
window.HRM_SEED = function () {
  const staff = [
    { id: 'nc', name: 'Naomi Clarke', role: 'Practice Manager', free: 3 },
    { id: 'ak', name: 'Adeel Khan', role: 'GP Partner', free: 5 },
    { id: 'uk', name: 'Usman Khalid', role: 'Clinical Lead', free: 4 },
    { id: 'sr', name: 'Sara Rahman', role: 'Nurse Manager', free: 2 }
  ];

  const stages = [
    { id: 'applied', name: 'Applied', type: 'Initial', managers: ['nc'], end: false },
    { id: 'screening', name: 'Screening', type: 'Initial', managers: ['ak'], end: false },
    { id: 'interview', name: 'Interview', type: 'Interview', managers: ['ak', 'uk'], end: false },
    { id: 'test', name: 'Technical test', type: 'Test', managers: ['uk', 'nc'], end: false },
    { id: 'offer', name: 'Offer', type: 'Hired', managers: ['nc'], end: false },
    { id: 'hired', name: 'Hired', type: 'Hired', managers: ['nc'], end: true }
  ];

  const MP_DESC = 'We are seeking a dedicated and compassionate Medical Practitioner to provide high-quality care to our patients — examining, diagnosing and managing ongoing treatment as part of a multi-disciplinary team.';
  const recruitments = [
    { id: 'r1', title: 'Medical Practitioner', dept: 'Clinical', type: 'Full-time', location: 'London', vacancies: 10, hired: 2, managers: ['nc', 'ak'], start: '28 Sep 2026', end: '30 Nov 2026', deadline: '30 Nov', closesIn: 55, status: 'Open', published: true, isNew: true,
      skills: ['Communication & Empathy', 'Diagnostic & Clinical Acumen', 'Medical Ethics & Compliance', 'Prescribing & Treatment Management'], survey: 'sv1', desc: MP_DESC,
      reqs: ['MBBS or equivalent medical degree from an accredited institution', 'Valid, full GMC registration and licence to practise', '3+ years as a medical practitioner or GP in a clinical setting', 'Strong clinical, diagnostic and decision-making skills', 'Excellent communication with patients and colleagues', 'Sound understanding of medical ethics, confidentiality and patient safety'],
      blurb: 'Provide high-quality primary care — examining, diagnosing and managing ongoing treatment within a multi-disciplinary team.', created: '05 Oct 2026', photo: false, resumeOptional: false },
    { id: 'r2', title: 'Practice Nurse', dept: 'Nursing', type: 'Full-time', location: 'London', vacancies: 4, hired: 3, managers: ['nc'], start: '01 Sep 2026', end: '15 Oct 2026', deadline: '15 Oct', closesIn: 9, status: 'Closing soon', published: true,
      skills: ['Communication & Empathy', 'Patient History & Record Keeping', 'Team Collaboration'], survey: 'sv2', desc: 'Run nurse-led clinics, immunisations and chronic disease reviews with a supportive clinical team.', reqs: ['NMC registration', '2+ years in general practice nursing', 'Immunisation and cytology training'], blurb: 'Run nurse-led clinics, immunisations and chronic disease reviews with a supportive clinical team.', created: '20 Aug 2026' },
    { id: 'r3', title: 'Healthcare Assistant', dept: 'Clinical', type: 'Part-time', location: 'London', vacancies: 3, hired: 2, managers: ['uk', 'nc'], start: '14 Sep 2026', end: '31 Oct 2026', deadline: '31 Oct', closesIn: 25, status: 'Open', published: true,
      skills: ['Patient History & Record Keeping', 'Team Collaboration'], survey: 'sv2', desc: 'Support clinicians with phlebotomy, observations and patient preparation across morning sessions.', reqs: ['Care Certificate', 'Phlebotomy experience'], blurb: 'Support clinicians with phlebotomy, observations and patient preparation across morning sessions.', created: '10 Sep 2026' },
    { id: 'r4', title: 'Receptionist', dept: 'Front desk', type: 'Full-time', location: 'Croydon', vacancies: 2, hired: 1, managers: ['ak'], start: '21 Sep 2026', end: '20 Oct 2026', deadline: '20 Oct', closesIn: 14, status: 'Open', published: true,
      skills: ['Communication & Empathy', 'Team Collaboration'], survey: 'sv1', desc: 'Be the first friendly face for our patients — bookings, check-ins and front-desk coordination.', reqs: ['Customer service experience', 'Comfortable with booking systems'], blurb: 'Be the first friendly face for our patients — bookings, check-ins and front-desk coordination.', created: '18 Sep 2026' },
    { id: 'r5', title: 'Clinical Pharmacist', dept: 'Pharmacy', type: 'Full-time', location: 'Hybrid', vacancies: 1, hired: 0, managers: ['uk'], start: '01 Oct 2026', end: '05 Dec 2026', deadline: '05 Dec', closesIn: 58, status: 'Open', published: true,
      skills: ['Prescribing & Treatment Management', 'Medical Ethics & Compliance'], survey: 'sv3', desc: 'Lead medication reviews and support prescribing across the practice.', reqs: ['GPhC registration', 'Independent prescriber qualification'], blurb: 'Lead medication reviews and support prescribing across the practice, with hybrid working.', created: '01 Oct 2026' },
    { id: 'r6', title: 'Physiotherapist', dept: 'Clinical', type: 'Part-time', location: 'London', vacancies: 1, hired: 0, managers: ['sr'], start: '01 Nov 2026', end: '31 Dec 2026', deadline: '31 Dec', closesIn: 84, status: 'Draft', published: false,
      skills: ['Emergency & Acute Care'], survey: null, desc: 'Musculoskeletal clinics two days a week.', reqs: ['HCPC registration'], blurb: 'Musculoskeletal clinics two days a week.', created: '06 Oct 2026' }
  ];

  const C = (id, first, last, rid, stage, o) => Object.assign({ id, first, last, rid, stage, status: 'progress', rating: 0, source: 'Career page', when: '3d ago', applied: '05 Oct', location: 'London, UK', pools: [], active: true, gender: '—', dob: '—', address: '—', country: 'United Kingdom', referral: '—' }, o);
  const candidates = [
    C('c1', 'Hiroko', 'May', 'r1', 'interview', { rating: 4, email: 'h.may@mailinator.com', phone: '+44 7700 900529', when: 'Today 14:30', applied: '04 Oct', linkedin: 'linkedin.com/in/hirokomay', gender: 'Female', dob: '14 Mar 1990', address: '12 Elm Row', postcode: 'NW3 1AB', county: 'London', rich: true, cv: 'Hiroko_May_CV_2026.pdf' }),
    C('c2', 'Daniel', 'Shaw', 'r1', 'unassigned', { email: 'daniel.shaw@gmail.com', phone: '+44 7700 900112', source: 'LinkedIn', when: '2d ago', applied: '06 Oct', gender: 'Male', dob: '07 Dec 1999', linkedin: 'linkedin.com/in/danielshaw', referral: 'Lucia Fernandez' }),
    C('c3', 'Laura', 'Mensah', 'r1', 'unassigned', { email: 'l.mensah@outlook.com', phone: '+44 7700 900845', source: 'Referral', when: '3d ago' }),
    C('c4', 'Fredericka', 'Irwin', 'r1', 'applied', { rating: 3, email: 'f.irwin@mailinator.com', phone: '+44 7700 900653', when: '4d ago', applied: '04 Oct' }),
    C('c5', 'Rahul', 'Anand', 'r1', 'applied', { rating: 4, email: 'rahul.anand@nhs.net', phone: '+44 7700 900219', when: '5d ago', applied: '03 Oct' }),
    C('c6', 'Emma', 'Brooks', 'r1', 'applied', { email: 'emma.b@gmail.com', phone: '+44 7700 900401', source: 'Indeed', when: '6d ago', applied: '02 Oct' }),
    C('c7', 'James', 'Okafor', 'r1', 'interview', { rating: 5, email: 'j.okafor@gmail.com', phone: '+44 7700 900377', source: 'Referral', when: 'Tue 13 Oct' }),
    C('c8', 'Aisha', 'Khan', 'r1', 'test', { rating: 4, email: 'aisha.k@gmail.com', phone: '+44 7700 900918', source: 'LinkedIn', when: 'Due Fri' }),
    C('c9', 'Marcus', 'Reid', 'r1', 'offer', { rating: 5, email: 'm.reid@outlook.com', phone: '+44 7700 900550', source: 'Agency', when: 'Sent 2d ago' }),
    C('c10', 'Chloe', 'Adams', 'r1', 'hired', { rating: 5, email: 'chloe.adams@nhs.net', phone: '+44 7700 900611', status: 'hired', hiredOn: '29 Sep 2026', when: '29 Sep' }),
    C('c11', 'Lucas', 'Wright', 'r1', 'screening', { rating: 2, email: 'l.wright@gmail.com', phone: '+44 7700 900702', source: 'Indeed', status: 'cancelled', rejected: { reason: 'Insufficient experience', stage: 'Screening', at: '06 Oct', by: 'Naomi Clarke' } }),
    C('c12', 'Grace', 'Lee', 'r2', 'applied', { rating: 3, email: 'grace.lee@gmail.com', phone: '+44 7700 900120', when: '1d ago' }),
    C('c13', 'Olivia', 'Hart', 'r2', 'screening', { rating: 4, email: 'o.hart@nhs.net', phone: '+44 7700 900133', source: 'LinkedIn' }),
    C('c14', 'Ben', 'Carter', 'r2', 'interview', { rating: 4, email: 'ben.carter@outlook.com', phone: '+44 7700 900144', source: 'Referral' }),
    C('c15', 'Noah', 'Fisher', 'r2', 'hired', { rating: 5, email: 'noah.f@nhs.net', phone: '+44 7700 900155', status: 'hired', hiredOn: '18 Sep 2026' }),
    C('c16', 'Sana', 'Patel', 'r3', 'interview', { rating: 3, email: 'sana.patel@gmail.com', phone: '+44 7700 900166', source: 'Indeed' }),
    C('c17', 'Leo', 'Grant', 'r3', 'applied', { email: 'leo.grant@gmail.com', phone: '+44 7700 900177' }),
    C('c18', 'Tom', 'Walsh', 'r4', 'interview', { rating: 4, email: 'tom.walsh@gmail.com', phone: '+44 7700 900188', source: 'Referral' }),
    C('c19', 'Mia', 'Clarke', 'r4', 'applied', { rating: 3, email: 'mia.c@outlook.com', phone: '+44 7700 900199', source: 'Indeed' }),
    C('c20', 'Priya', 'Nair', 'r5', 'screening', { rating: 4, email: 'priya.nair@nhs.net', phone: '+44 7700 900200', source: 'LinkedIn' }),
    C('c21', 'Ethan', 'Moore', 'r1', 'test', { rating: 4, email: 'ethan.moore@nhs.net', phone: '+44 7700 900211', status: 'pool', pools: ['p1'], poolReason: 'Vacancy filled', poolAdded: '12 Sep 2026', match: true }),
    C('c22', 'Zara', 'Ali', 'r1', 'interview', { rating: 4, email: 'zara.ali@gmail.com', phone: '+44 7700 900222', status: 'pool', pools: ['p1'], poolReason: 'Vacancy filled', poolAdded: '12 Sep 2026', match: true }),
    C('c23', 'Kofi', 'Mensah', 'r1', 'offer', { rating: 3, email: 'kofi.m@outlook.com', phone: '+44 7700 900233', status: 'pool', pools: ['p1'], poolReason: 'Vacancy filled', poolAdded: '14 Sep 2026', match: true }),
    C('c24', 'Ruby', 'Shah', 'r4', 'interview', { rating: 4, email: 'ruby.shah@gmail.com', phone: '+44 7700 900244', status: 'pool', pools: ['p3'], poolReason: 'Vacancy filled', poolAdded: '22 Sep 2026' }),
    C('c25', 'Amir', 'Khan', 'r4', 'screening', { rating: 3, email: 'amir.khan@gmail.com', phone: '+44 7700 900255', status: 'pool', pools: ['p3'], poolReason: 'Salary expectations', poolAdded: '25 Sep 2026' })
  ];

  /* day: ISO date, the demo today is 2026-10-08 */
  const I = (id, cid, day, time, dur, mode, who, status, o) => Object.assign({ id, cid, day, time, dur, mode, who, status, title: 'Interview', feedback: [], kind: '' }, o);
  const interviews = [
    I('i1', 'c1', '2026-10-07', '14:30', 30, 'Video', ['ak', 'uk', 'nc', 'sr'], 'Completed', { title: '1st interview', score: 82, transcript: '42 min transcript', feedback: [
      { by: 'uk', rating: 5, rec: 'Strong yes', text: 'Excellent rapport. Clear examples running joint diabetes clinics with nurses. Would fit the Friday women’s health session well.', at: '07 Oct, 15:41' },
      { by: 'nc', rating: 5, rec: 'Yes', text: 'Confirmed availability from 1 Nov and salary within band. Team references were all positive.', at: '07 Oct, 16:02' },
      { by: 'ak', rating: 3, rec: 'Yes', text: 'Solid diagnostic approach; answers ran long. Few examples of working through disagreement with nurses — want to probe at round 2.', at: '07 Oct, 15:20' }] }),
    I('i2', 'c1', '2026-10-15', '14:00', 45, 'Video', ['sr', 'uk'], 'Confirmed', { title: '2nd interview', note: 'Hiroko confirmed via booking page' }),
    I('i3', 'c18', '2026-10-08', '16:00', 45, 'In person', ['nc'], 'Scheduled'),
    I('i4', 'c5', '2026-10-08', '11:30', 30, 'Video', ['ak', 'uk'], 'Scheduled', { title: 'Screening call' }),
    I('i5', 'c4', '2026-10-09', '10:00', 30, 'In person', ['ak', 'nc'], 'Confirmed'),
    I('i6', 'c7', '2026-10-13', '11:15', 30, 'Video', ['nc'], 'Confirmed'),
    I('i7', 'c16', '2026-10-14', '09:30', 20, 'Phone', ['uk'], 'Rescheduled'),
    I('i8', 'c8', '2026-10-05', '15:00', 60, 'Video', ['ak', 'uk', 'nc'], 'Completed', { title: 'Panel interview', feedback: [
      { by: 'ak', rating: 4, rec: 'Yes', text: 'Solid diagnostic approach and good safety-netting. Could be more concise when explaining plans to patients.', at: '05 Oct, 16:12' },
      { by: 'uk', rating: 4, rec: 'Strong yes', text: 'Excellent rapport and very clear on prescribing rationale. Would fit our Friday sessions well.', at: '05 Oct, 16:40' }] }),
    I('i9', 'c9', '2026-09-30', '10:30', 30, 'In person', ['uk'], 'Completed', { feedback: [{ by: 'uk', rating: 5, rec: 'Strong yes', text: 'Outstanding. Ready for an offer.', at: '30 Sep, 11:20' }] }),
    I('i10', 'c14', '2026-10-12', '13:00', 30, 'Video', ['nc', 'sr'], 'Scheduled'),
    I('i11', 'c13', '2026-10-02', '09:00', 20, 'Phone', ['sr'], 'Completed', { title: 'Phone screen', feedback: [{ by: 'sr', rating: 4, rec: 'Yes', text: 'Warm, clear and well organised.', at: '02 Oct, 09:30' }] })
  ];

  const pools = [
    { id: 'p1', name: 'Medical Practitioner — runners-up', desc: 'Strong final-stage candidates not hired in 2026', open: true, auto: false },
    { id: 'p2', name: 'MBBS graduates', desc: 'Early-career doctors for future foundation roles', open: true, auto: false },
    { id: 'p3', name: 'Front desk & admin', desc: 'Reception and admin applicants worth keeping in touch with', open: false, auto: false }
  ];

  const reasons = [
    { id: 'rr1', name: 'Vacancy filled', pool: true, used: 23 },
    { id: 'rr2', name: 'Insufficient experience', pool: false, used: 41 },
    { id: 'rr3', name: 'Salary expectations', pool: false, used: 9 },
    { id: 'rr4', name: 'Not eligible to work in the UK', pool: false, used: 6 },
    { id: 'rr5', name: 'Withdrew application', pool: false, used: 12 },
    { id: 'rr6', name: 'Another candidate was a closer match', pool: true, used: 18 }
  ];

  const skills = [['Communication & Empathy', 4], ['Critical Thinking & Problem-Solving', 3], ['Diagnostic & Clinical Acumen', 2], ['Emergency & Acute Care', 2], ['Medical Ethics & Compliance', 3], ['Patient History & Record Keeping', 4], ['Prescribing & Treatment Management', 1], ['Team Collaboration', 5]].map(([name, used], i) => ({ id: 'sk' + i, name, used }));

  const surveys = [
    { id: 'sv1', name: 'Teamwork & Operations', open: true, questions: [
      { q: 'How do you manage high patient volume or emergencies while maintaining quality of care?', type: 'Text', required: true },
      { q: 'Describe a time you collaborated with specialists or nursing staff on a complex case.', type: 'Text', required: true },
      { q: 'Are you currently licensed and certified to practise in this region?', type: 'Yes / No', required: true }] },
    { id: 'sv2', name: 'Patient Care & Communication', open: true, questions: [
      { q: 'How do you handle a patient who disagrees with a proposed treatment plan?', type: 'Text', required: true },
      { q: 'Describe delivering difficult news to a patient or family.', type: 'Text', required: false },
      { q: 'What steps ensure effective patient follow-up and adherence?', type: 'Text', required: false }] },
    { id: 'sv3', name: 'Clinical Experience & Competency', open: false, questions: [
      { q: 'Which clinical systems have you used day to day?', type: 'Text', required: true },
      { q: 'Do you hold an independent prescriber qualification?', type: 'Yes / No', required: true },
      { q: 'How many years of post-registration experience do you have?', type: 'Multiple choice', required: true, options: ['Under 2', '2–5', '5+'] },
      { q: 'Tell us about a clinical audit you led.', type: 'Text', required: false }] }
  ];

  const notes = { c1: [{ by: 'nc', kind: 'Note', stage: 'applied', text: 'Strong CV. Checked GMC on the register. Moving to a phone screen.', at: '04 Oct, 17:10' }, { by: 'nc', kind: 'Feedback', stage: 'screening', rating: 4, rec: 'Yes', text: 'Clear, warm communicator and asked good questions about the team. Only flag is the Friday preference.', at: '05 Oct, 11:30' }] };

  return { staff, stages, recruitments, candidates, interviews, pools, reasons, skills, surveys, hNotes: notes, career: { live: true, views: 1284, apps: 65, slug: 'qa-riverside-private-clinic' }, hrmFail: false };
};

/* ============================================================
   app.js — NeonCV
   Main application logic: state, rendering, dynamic sections,
   validation, autosave, templates, theme, multi-CV management.
   Neon.dev
   ============================================================ */

/* ---------------------------------------------------------
   1. CONSTANTS & SCHEMA
   --------------------------------------------------------- */

const PURPOSES = [
  { key: 'job', label: 'Job Application', icon: '⌁', desc: 'For applying to professional jobs.', bestFor: ['Experience', 'Skills', 'Achievements', 'Projects', 'Education'] },
  { key: 'internship', label: 'Internship', icon: '◧', desc: 'For students and early-career applicants.', bestFor: ['Education', 'Projects', 'Skills', 'Activities', 'Certifications'] },
  { key: 'scholarship', label: 'Scholarship', icon: '◐', desc: 'For scholarship and academic funding applications.', bestFor: ['Education', 'Awards', 'Achievements', 'Activities', 'Research'] },
  { key: 'university', label: 'University Application', icon: '▣', desc: 'For undergraduate or graduate program applications.', bestFor: ['Education', 'Research', 'Publications', 'Awards', 'Activities'] },
  { key: 'freelance', label: 'Freelancing / Consulting', icon: '◈', desc: 'For pitching your services to clients.', bestFor: ['Skills', 'Services', 'Selected Projects', 'Testimonials'] },
  { key: 'research', label: 'Research / Academic', icon: '▤', desc: 'For research positions and academic careers.', bestFor: ['Research', 'Publications', 'Conferences', 'Education'] },
  { key: 'general', label: 'General CV', icon: '⎙', desc: 'A balanced, all-purpose professional CV.', bestFor: ['Experience', 'Education', 'Skills', 'Projects'] },
];

const RECOMMENDED_SECTIONS = {
  job: ['personal', 'summary', 'experience', 'skills', 'projects', 'education', 'certifications', 'languages', 'awards'],
  internship: ['personal', 'summary', 'education', 'skills', 'projects', 'experience', 'certifications', 'volunteer', 'languages'],
  scholarship: ['personal', 'summary', 'education', 'awards', 'projects', 'volunteer', 'certifications', 'languages', 'references'],
  university: ['personal', 'summary', 'education', 'research', 'publications', 'projects', 'awards', 'conferences', 'skills', 'references'],
  freelance: ['personal', 'summary', 'skills', 'experience', 'projects', 'certifications', 'references'],
  research: ['personal', 'summary', 'education', 'research', 'publications', 'conferences', 'projects', 'awards', 'skills', 'references'],
  general: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
};

/* ---------- Application context (Step 2) ---------- */

const CONTEXTS = {
  job: [
    { key: 'myanmar-local', label: 'Myanmar Local Company', desc: 'For companies hiring within Myanmar.' },
    { key: 'international', label: 'International Company', desc: 'For international roles.' },
    { key: 'remote', label: 'Remote / Global', desc: 'For remote opportunities.' },
    { key: 'general', label: 'General', desc: 'Flexible professional CV.' },
  ],
  internship: [
    { key: 'myanmar-local', label: 'Myanmar Local Company', desc: 'For internships within Myanmar.' },
    { key: 'international', label: 'International Company', desc: 'For international internships.' },
    { key: 'remote', label: 'Remote / Global', desc: 'For remote internships.' },
    { key: 'general', label: 'General', desc: 'Flexible internship CV.' },
  ],
  scholarship: [
    { key: 'local', label: 'Local Scholarship', desc: 'Scholarships offered within Myanmar.' },
    { key: 'international', label: 'International Scholarship', desc: 'Scholarships abroad.' },
    { key: 'university', label: 'University Scholarship', desc: 'Awarded directly by a university.' },
    { key: 'general', label: 'General', desc: 'Flexible scholarship CV.' },
  ],
  university: [
    { key: 'myanmar-university', label: 'Myanmar University', desc: 'Applying to a university in Myanmar.' },
    { key: 'international-university', label: 'International University', desc: 'Applying abroad.' },
    { key: 'general-academic', label: 'General Academic', desc: 'Flexible academic CV.' },
  ],
  freelance: [
    { key: 'local-client', label: 'Local Client', desc: 'Clients based in Myanmar.' },
    { key: 'international-client', label: 'International Client', desc: 'Clients abroad.' },
    { key: 'remote-platform', label: 'Remote Platform', desc: 'Upwork, Fiverr and similar platforms.' },
    { key: 'general', label: 'General', desc: 'Flexible freelance CV.' },
  ],
  research: [
    { key: 'university-research', label: 'University Research', desc: 'A research role within a university.' },
    { key: 'research-grant', label: 'Research Grant', desc: 'Applying for a research grant or funding.' },
    { key: 'academic-position', label: 'Academic Position', desc: 'A faculty or teaching-research position.' },
    { key: 'general', label: 'General', desc: 'Flexible research CV.' },
  ],
  general: [
    { key: 'general', label: 'General', desc: 'A flexible, all-purpose CV.' },
  ],
};

// Contexts where Myanmar-specific personal fields (NRC, etc.) make sense.
const MYANMAR_CONTEXT_KEYS = ['myanmar-local', 'local', 'myanmar-university', 'local-client'];
function isMyanmarContext(contextKey) { return MYANMAR_CONTEXT_KEYS.includes(contextKey); }

// Every section that can ever appear, in a sensible default order.
const ALL_SECTIONS = ['personal', 'summary', 'experience', 'internship', 'education', 'skills', 'projects', 'certifications', 'awards', 'languages', 'volunteer', 'research', 'publications', 'conferences', 'references'];

const SECTION_LABELS = {
  personal: 'Personal Info',
  summary: 'Summary',
  experience: 'Experience',
  internship: 'Internship',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  awards: 'Awards',
  languages: 'Languages',
  volunteer: 'Volunteer',
  research: 'Research',
  publications: 'Publications',
  conferences: 'Conferences',
  references: 'References',
};

// Schema for every repeatable ("list") section.
const LIST_SCHEMA = {
  experience: {
    fields: [
      { name: 'jobTitle', label: 'Job Title', type: 'text', required: true },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'month' },
      { name: 'endDate', label: 'End Date', type: 'month' },
      { name: 'current', label: 'I currently work here', type: 'checkbox' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    title: (e) => e.jobTitle || 'New position',
    subtitle: (e) => e.company,
    meta: (e) => dateRange(e.startDate, e.endDate, e.current),
  },
  internship: {
    fields: [
      { name: 'jobTitle', label: 'Role', type: 'text', required: true },
      { name: 'company', label: 'Organization', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'month' },
      { name: 'endDate', label: 'End Date', type: 'month' },
      { name: 'current', label: 'Ongoing', type: 'checkbox' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    title: (e) => e.jobTitle || 'New internship',
    subtitle: (e) => e.company,
    meta: (e) => dateRange(e.startDate, e.endDate, e.current),
  },
  education: {
    fields: [
      { name: 'degree', label: 'Degree', type: 'text', required: true },
      { name: 'institution', label: 'Institution', type: 'text', required: true },
      { name: 'major', label: 'Major / Subject', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'month' },
      { name: 'endDate', label: 'End Date', type: 'month' },
      { name: 'resultGrade', label: 'Result / Grade', type: 'text', placeholder: 'e.g. Distinction, 3.8 GPA' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    title: (e) => e.degree || 'New degree',
    subtitle: (e) => [e.institution, e.major].filter(Boolean).join(' — '),
    meta: (e) => dateRange(e.startDate, e.endDate),
    extra: (e) => e.resultGrade ? 'Result: ' + e.resultGrade : '',
  },
  projects: {
    fields: [
      { name: 'name', label: 'Project Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'technologies', label: 'Tools / Skills Used', type: 'text', placeholder: 'e.g. Excel, Photoshop, React, patient care software' },
      { name: 'githubUrl', label: 'Project Link (optional)', type: 'url', placeholder: 'portfolio, repository, article, case study…' },
      { name: 'liveUrl', label: 'Additional Link (optional)', type: 'url' },
    ],
    title: (e) => e.name || 'New project',
    subtitle: (e) => e.technologies,
    meta: () => '',
  },
  certifications: {
    fields: [
      { name: 'name', label: 'Certificate Name', type: 'text', required: true },
      { name: 'organization', label: 'Issuing Organization', type: 'text' },
      { name: 'issueDate', label: 'Issue Date', type: 'month' },
      { name: 'credentialUrl', label: 'Certificate Link (optional)', type: 'url' },
    ],
    title: (e) => e.name || 'New certificate',
    subtitle: (e) => e.organization,
    meta: (e) => formatMonth(e.issueDate),
  },
  awards: {
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'organization', label: 'Organization', type: 'text' },
      { name: 'date', label: 'Date', type: 'month' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    title: (e) => e.title || 'New award',
    subtitle: (e) => e.organization,
    meta: (e) => formatMonth(e.date),
  },
  languages: {
    fields: [
      { name: 'language', label: 'Language', type: 'text', required: true },
      { name: 'proficiency', label: 'Proficiency', type: 'text', placeholder: 'e.g. Native, Fluent, Intermediate' },
    ],
    title: (e) => e.language || 'New language',
    subtitle: (e) => e.proficiency,
    meta: () => '',
  },
  volunteer: {
    fields: [
      { name: 'organization', label: 'Organization', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'date', label: 'Date', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    title: (e) => e.role || 'New role',
    subtitle: (e) => e.organization,
    meta: (e) => e.date || '',
  },
  research: {
    fields: [
      { name: 'title', label: 'Research Title', type: 'text', required: true },
      { name: 'organization', label: 'Organization', type: 'text' },
      { name: 'date', label: 'Date', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    title: (e) => e.title || 'New research entry',
    subtitle: (e) => e.organization,
    meta: (e) => e.date || '',
  },
  publications: {
    fields: [
      { name: 'title', label: 'Publication Title', type: 'text', required: true },
      { name: 'publisher', label: 'Publisher / Journal', type: 'text' },
      { name: 'date', label: 'Date', type: 'text' },
      { name: 'url', label: 'URL', type: 'url' },
    ],
    title: (e) => e.title || 'New publication',
    subtitle: (e) => e.publisher,
    meta: (e) => e.date || '',
  },
  conferences: {
    fields: [
      { name: 'name', label: 'Conference Name', type: 'text', required: true },
      { name: 'role', label: 'Role / Participation', type: 'text' },
      { name: 'date', label: 'Date', type: 'text' },
    ],
    title: (e) => e.name || 'New conference',
    subtitle: (e) => e.role,
    meta: (e) => e.date || '',
  },
  references: {
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'position', label: 'Position', type: 'text' },
      { name: 'organization', label: 'Organization', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
    ],
    title: (e) => e.name || 'New reference',
    subtitle: (e) => [e.position, e.organization].filter(Boolean).join(' · '),
    meta: () => '',
  },
};

const LIST_SECTION_KEYS = Object.keys(LIST_SCHEMA);

/* ---------------------------------------------------------
   1b. SAMPLE CV DATA (per purpose, used by "Use a Sample CV")
   --------------------------------------------------------- */

function sampleEntry(fields) { return Object.assign({ id: uid() }, fields); }

const SAMPLES = {
  job: {
    personal: { fullName: 'Alex Morgan', jobTitle: 'Frontend Developer', email: 'alex.morgan@email.com', phone: '+95 9 123 456 789', location: 'Yangon, Myanmar', website: 'alexmorgan.dev', linkedin: 'linkedin.com/in/alexmorgan', github: 'alexmorgan.dev' },
    summary: 'Frontend developer with 3+ years building responsive, accessible web applications. Comfortable owning features from design handoff to deployment, and enjoy mentoring junior teammates.',
    skills: { technical: ['JavaScript', 'React', 'Tailwind CSS', 'Git'], soft: ['Communication', 'Problem-solving', 'Teamwork'] },
    entries: {
      experience: [sampleEntry({ jobTitle: 'Frontend Developer', company: 'Bright Web Studio', location: 'Yangon', startDate: '2023-02', endDate: '', current: true, description: 'Built and maintained client websites using React and Tailwind CSS.\nCollaborated with designers to implement pixel-accurate, responsive layouts.\nImproved page load speed by 35% through code-splitting and image optimization.' })],
      education: [sampleEntry({ degree: 'B.Sc. Computer Science', institution: 'University of Yangon', location: 'Yangon', startDate: '2018-11', endDate: '2022-12', description: '' })],
      projects: [sampleEntry({ name: 'Student Management System', description: 'A web app for tracking student records, attendance and grades for a small training center.', technologies: 'React, Node.js, MySQL', githubUrl: '', liveUrl: '' })],
      certifications: [sampleEntry({ name: 'Meta Front-End Developer', organization: 'Coursera', issueDate: '2023-06', credentialUrl: '' })],
      languages: [sampleEntry({ language: 'Burmese', proficiency: 'Native' }), sampleEntry({ language: 'English', proficiency: 'Professional working proficiency' })],
    },
  },
  internship: {
    personal: { fullName: 'Alex Morgan', jobTitle: 'Computer Science Student', email: 'alex.morgan@email.com', phone: '+95 9 123 456 789', location: 'Yangon, Myanmar', website: '', linkedin: 'linkedin.com/in/alexmorgan', github: '' },
    summary: 'Motivated Computer Science student with hands-on experience building web applications and working with JavaScript and Java. Looking for an internship to apply classroom knowledge to real projects.',
    skills: { technical: ['JavaScript', 'HTML', 'CSS', 'Java', 'MySQL'], soft: ['Fast learner', 'Teamwork'] },
    entries: {
      education: [sampleEntry({ degree: 'B.Sc. Computer Science', institution: 'Example University', location: 'Yangon', startDate: '2023-11', endDate: '', description: 'Currently in 3rd year, GPA 3.7/4.0.' })],
      projects: [sampleEntry({ name: 'Student Management System', description: 'Built a web-based management system for tracking student records and grades as a class project.', technologies: 'JavaScript, HTML, CSS, MySQL', githubUrl: '', liveUrl: '' })],
      certifications: [sampleEntry({ name: 'Introduction to Web Development', organization: 'freeCodeCamp', issueDate: '2024-03', credentialUrl: '' })],
      volunteer: [sampleEntry({ organization: 'University Coding Club', role: 'Member', date: '2023 – Present', description: 'Help organize weekly coding practice sessions for first-year students.' })],
    },
  },
  scholarship: {
    personal: { fullName: 'Su Su Hlaing', jobTitle: 'High School Graduate', email: 'susuhlaing@email.com', phone: '+95 9 123 456 789', location: 'Mandalay, Myanmar', website: '', linkedin: '', github: '' },
    summary: 'Dedicated student graduating top of class with a strong record in mathematics and community service. Seeking a scholarship to pursue a degree in Economics.',
    skills: { technical: ['Microsoft Excel', 'Data Analysis'], soft: ['Leadership', 'Public speaking'] },
    entries: {
      education: [sampleEntry({ degree: 'High School Diploma', institution: 'BEHS No. 2 Mandalay', location: 'Mandalay', startDate: '2021-06', endDate: '2025-03', description: 'Ranked 2nd in class of 210 students.' })],
      awards: [sampleEntry({ title: 'Best Student in Mathematics', organization: 'BEHS No. 2 Mandalay', date: '2024-12', description: '' })],
      volunteer: [sampleEntry({ organization: 'Local Youth Center', role: 'Volunteer Tutor', date: '2023 – Present', description: 'Tutor younger students in mathematics twice a week.' })],
      projects: [sampleEntry({ name: 'School Recycling Initiative', description: 'Co-led a student-run recycling program that reduced school waste by an estimated 20%.', technologies: '', githubUrl: '', liveUrl: '' })],
    },
  },
  university: {
    personal: { fullName: 'Su Su Hlaing', jobTitle: 'Prospective Economics Student', email: 'susuhlaing@email.com', phone: '+95 9 123 456 789', location: 'Mandalay, Myanmar', website: '', linkedin: '', github: '' },
    summary: 'Motivated student with a strong academic record and a growing interest in development economics, seeking to continue studies at the undergraduate level.',
    skills: { technical: ['Microsoft Excel', 'Statistics'], soft: ['Research', 'Critical thinking'] },
    entries: {
      education: [sampleEntry({ degree: 'High School Diploma', institution: 'BEHS No. 2 Mandalay', location: 'Mandalay', startDate: '2021-06', endDate: '2025-03', description: 'Ranked 2nd in class of 210 students.' })],
      research: [sampleEntry({ title: 'The Impact of Microfinance on Rural Households', organization: 'School research project', date: '2024', description: 'Independent research project analyzing microfinance access in three villages near Mandalay.' })],
      awards: [sampleEntry({ title: 'Best Student in Mathematics', organization: 'BEHS No. 2 Mandalay', date: '2024-12', description: '' })],
    },
  },
  freelance: {
    personal: { fullName: 'Kyaw Zin Latt', jobTitle: 'Freelance Graphic Designer', email: 'kyawzinlatt@email.com', phone: '+95 9 123 456 789', location: 'Yangon, Myanmar', website: 'kyawzinlatt.design', linkedin: '', github: '' },
    summary: 'Freelance graphic designer with 4+ years helping small businesses build clear, memorable visual identities — from logos to full brand guidelines.',
    skills: { technical: ['Adobe Illustrator', 'Photoshop', 'Figma', 'Branding'], soft: ['Client communication', 'Time management'] },
    entries: {
      experience: [sampleEntry({ jobTitle: 'Freelance Graphic Designer', company: 'Self-employed', location: 'Remote', startDate: '2021-01', endDate: '', current: true, description: 'Designed brand identities, packaging and marketing materials for 30+ small business clients across Myanmar and Southeast Asia.' })],
      projects: [sampleEntry({ name: 'Cafe Ywar Ma Brand Identity', description: 'Full brand identity for a local cafe chain, including logo, menu design and packaging.', technologies: 'Illustrator, Photoshop', githubUrl: '', liveUrl: '' })],
      certifications: [sampleEntry({ name: 'Graphic Design Specialization', organization: 'Coursera', issueDate: '2022-05', credentialUrl: '' })],
    },
  },
  research: {
    personal: { fullName: 'Dr. Thida Win', jobTitle: 'Research Assistant', email: 'thidawin@email.com', phone: '+95 9 123 456 789', location: 'Yangon, Myanmar', website: '', linkedin: 'linkedin.com/in/thidawin', github: '' },
    summary: 'Research assistant with a background in environmental science, focused on water quality monitoring and community-based conservation projects.',
    skills: { technical: ['Statistical Analysis', 'R', 'Field Sampling'], soft: ['Scientific writing', 'Collaboration'] },
    entries: {
      education: [sampleEntry({ degree: 'M.Sc. Environmental Science', institution: 'Yangon University', location: 'Yangon', startDate: '2020-11', endDate: '2022-12', description: '' })],
      research: [sampleEntry({ title: 'Water Quality Monitoring of the Yangon River Basin', organization: 'Yangon University', date: '2022 – Present', description: 'Leading a two-year study on seasonal water quality variation and its impact on nearby communities.' })],
      publications: [sampleEntry({ title: 'Seasonal Trends in River Water Quality: A Case Study', publisher: 'Journal of Environmental Studies', date: '2023', url: '' })],
      conferences: [sampleEntry({ name: 'Southeast Asia Environmental Science Conference', role: 'Poster presenter', date: '2023' })],
    },
  },
  general: {
    personal: { fullName: 'Alex Morgan', jobTitle: 'Professional', email: 'alex.morgan@email.com', phone: '+95 9 123 456 789', location: 'Yangon, Myanmar', website: '', linkedin: 'linkedin.com/in/alexmorgan', github: '' },
    summary: 'Reliable, detail-oriented professional with a track record of taking on new responsibilities and delivering consistent results.',
    skills: { technical: ['Microsoft Office', 'Project Coordination'], soft: ['Communication', 'Adaptability'] },
    entries: {
      experience: [sampleEntry({ jobTitle: 'Coordinator', company: 'Example Company', location: 'Yangon', startDate: '2022-01', endDate: '', current: true, description: 'Coordinated daily operations across three departments and maintained key records.' })],
      education: [sampleEntry({ degree: 'B.A. Business Administration', institution: 'University of Yangon', location: 'Yangon', startDate: '2017-11', endDate: '2021-12', description: '' })],
    },
  },
};

const INTERNATIONAL_LOCATIONS = {
  job: 'Singapore',
  internship: 'Singapore',
  scholarship: 'Boston, USA',
  university: 'Boston, USA',
  freelance: 'Remote',
  research: 'Berlin, Germany',
  general: 'Remote',
};

/**
 * Merge sample content for the given purpose into a freshly-created CV.
 * Adapts contact details to the chosen context: Myanmar contexts get a
 * local phone format and a (hidden-by-default) NRC; international/remote
 * contexts get an international location, phone format, and stronger
 * emphasis on LinkedIn/portfolio links. A plain "general" context is left
 * as-authored, since it's meant to be flexible either way.
 */
function applySampleData(cv, purposeKey, contextKey) {
  const sample = SAMPLES[purposeKey] || SAMPLES.general;
  cv.personal = Object.assign({}, cv.personal, sample.personal);
  cv.summary = sample.summary;
  cv.skills = { technical: sample.skills.technical.slice(), soft: sample.skills.soft.slice() };
  LIST_SECTION_KEYS.forEach((key) => {
    cv.entries[key] = (sample.entries[key] || []).map((e) => Object.assign({ id: uid() }, e));
  });

  const myanmar = isMyanmarContext(contextKey);
  const international = !myanmar && contextKey !== 'general';

  if (myanmar) {
    cv.personal.nrc = '12/AhMaYa(N)123456';
    cv.personal.showNrc = false; // stored, not shown, until the user opts in
    cv.personal.phone = cv.personal.phone || '+95 9 123 456 789';
    cv.personal.fatherName = cv.personal.fatherName || 'U Kyaw Than';
    cv.personal.nationality = cv.personal.nationality || 'Myanmar';
    cv.personal.race = cv.personal.race || 'Bamar';
    cv.personal.religion = cv.personal.religion || 'Buddhist';
    cv.personal.maritalStatus = cv.personal.maritalStatus || 'Single';
    if (cv.template === 'myanmar-local') {
      cv.orgHeader.formTitle = cv.orgHeader.formTitle || 'Personal Record Form for Job Application';
    }
  } else if (international) {
    cv.personal.location = INTERNATIONAL_LOCATIONS[purposeKey] || 'Remote';
    cv.personal.phone = '+1 555 123 4567';
    cv.personal.website = cv.personal.website || 'yourportfolio.com';
    cv.personal.linkedin = cv.personal.linkedin || 'linkedin.com/in/yourname';
    cv.personal.nrc = '';
    cv.personal.showNrc = false;
  }
}

/* ---------------------------------------------------------
   2. STATE
   --------------------------------------------------------- */

let state = {
  currentCV: null,
  draft: { purpose: null, context: null },
  activePurposeFilter: null,
  activeSectionKey: 'personal',
  saveTimer: null,
  pendingDeleteId: null,
  confirmAction: null,
  photoStudio: null,
};

function blankCV(purposeKey, contextKey, useSample) {
  const now = Date.now();
  const recommended = RECOMMENDED_SECTIONS[purposeKey] || RECOMMENDED_SECTIONS.general;
  const enabled = {};
  ALL_SECTIONS.forEach((key) => { enabled[key] = recommended.includes(key); });

  const entries = {};
  LIST_SECTION_KEYS.forEach((key) => { entries[key] = []; });

  const cv = {
    id: 'cv_' + now + '_' + Math.random().toString(36).slice(2, 8),
    title: purposeLabel(purposeKey) + ' CV',
    purpose: purposeKey,
    context: contextKey || 'general',
    template: isMyanmarContext(contextKey) ? 'myanmar-local' : 'modern',
    createdAt: now,
    updatedAt: now,
    orgHeader: { organizationName: '', department: '', formTitle: '', logo: '' },
    personal: {
      fullName: '', jobTitle: '', email: '', phone: '', location: '',
      website: '', linkedin: '', github: '',
      photo: '', photoOriginal: '', showPhoto: true, photoShape: 'circle',
      photoSettings: { background: 'white', zoom: 1, positionX: 0, positionY: 0, rotation: 0, brightness: 0, contrast: 0, saturation: 0 },
      nrc: '', showNrc: false,
      dateOfBirth: '', showDateOfBirth: false,
      gender: '', showGender: false,
      fatherName: '', nationality: '', race: '', religion: '',
      maritalStatus: '', bloodGroup: '', height: '', weight: '',
    },
    summary: '',
    skills: { technical: [], soft: [] },
    sectionOrder: recommended.concat(ALL_SECTIONS.filter((s) => !recommended.includes(s))),
    sectionEnabled: enabled,
    entries,
  };

  if (useSample) applySampleData(cv, purposeKey, contextKey);

  return cv;
}

/**
 * Fill required-but-missing fields on a CV loaded from LocalStorage,
 * so older saved CVs stay compatible with newer app versions.
 */
function normalizeCV(cv) {
  if (!cv) return cv;
  cv.context = cv.context || 'general';
  cv.personal = cv.personal || {};
  const p = cv.personal;
  if (p.photo === undefined) p.photo = '';
  if (p.photoOriginal === undefined) p.photoOriginal = '';
  if (p.showPhoto === undefined) p.showPhoto = true;
  if (p.photoShape === undefined) p.photoShape = 'circle';
  if (!p.photoSettings) {
    p.photoSettings = { background: 'white', zoom: 1, positionX: 0, positionY: 0, rotation: 0, brightness: 0, contrast: 0, saturation: 0 };
  }
  if (p.nrc === undefined) p.nrc = '';
  if (p.showNrc === undefined) p.showNrc = false;
  if (p.dateOfBirth === undefined) p.dateOfBirth = '';
  if (p.showDateOfBirth === undefined) p.showDateOfBirth = false;
  if (p.gender === undefined) p.gender = '';
  if (p.showGender === undefined) p.showGender = false;
  if (p.fatherName === undefined) p.fatherName = '';
  if (p.nationality === undefined) p.nationality = '';
  if (p.race === undefined) p.race = '';
  if (p.religion === undefined) p.religion = '';
  if (p.maritalStatus === undefined) p.maritalStatus = '';
  if (p.bloodGroup === undefined) p.bloodGroup = '';
  if (p.height === undefined) p.height = '';
  if (p.weight === undefined) p.weight = '';
  if (!cv.orgHeader) cv.orgHeader = { organizationName: '', department: '', formTitle: '', logo: '' };
  if (cv.template === undefined) cv.template = 'modern';
  LIST_SECTION_KEYS.forEach((key) => { if (!cv.entries[key]) cv.entries[key] = []; });
  return cv;
}

function purposeLabel(key) {
  const p = PURPOSES.find((p) => p.key === key);
  return p ? p.label : 'General';
}

function contextLabel(purposeKey, contextKey) {
  const list = CONTEXTS[purposeKey] || CONTEXTS.general;
  const c = list.find((c) => c.key === contextKey);
  return c ? c.label : 'General';
}

/* ---------------------------------------------------------
   3. HELPERS
   --------------------------------------------------------- */

function uid() { return 'e_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }

function formatMonth(value) {
  if (!value) return '';
  const [y, m] = value.split('-');
  if (!y || !m) return value;
  const d = new Date(Number(y), Number(m) - 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatDate(value) {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length !== 3) return value;
  const [y, m, d] = parts;
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  if (isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dateRange(start, end, current) {
  const s = formatMonth(start);
  const e = current ? 'Present' : formatMonth(end);
  if (!s && !e) return '';
  return [s, e].filter(Boolean).join(' — ');
}

function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidUrl(v) {
  if (!v) return true;
  try { new URL(v.startsWith('http') ? v : 'https://' + v); return true; } catch (e) { return false; }
}
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function nl2br(str) { return escapeHtml(str).replace(/\n/g, '<br>'); }

/**
 * NRC number is stored as one string ("12/AhMaYa(N)123456") but edited
 * as four separate inputs (state code / township / type letter / number).
 */
function parseNrc(value) {
  const m = String(value || '').match(/^(\d{1,2})\/([^\(\/]*)\(([A-Za-z]?)\)(\d{0,6})$/);
  if (!m) return { state: '', township: '', type: '', number: '' };
  return { state: m[1] || '', township: m[2] || '', type: m[3] || '', number: m[4] || '' };
}
function combineNrc(parts) {
  const { state, township, type, number } = parts;
  if (!state && !township && !type && !number) return '';
  return `${state}/${township}(${type})${number}`;
}

/* ---------------------------------------------------------
   4. TOASTS
   --------------------------------------------------------- */

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const colors = { info: 'bg-[#14161F] dark:bg-white', success: 'bg-emerald-600', error: 'bg-red-600' };
  const toast = document.createElement('div');
  toast.className = `toast px-4 py-3 rounded-lg shadow-xl text-sm font-medium text-white ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-[#1E2130]'}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-in'));
  setTimeout(() => {
    toast.classList.remove('toast-in');
    setTimeout(() => toast.remove(), 200);
  }, 2600);
}

/* ---------------------------------------------------------
   5. CONFIRM MODAL
   --------------------------------------------------------- */

function openConfirm(title, body, onConfirm) {
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-body').textContent = body;
  state.confirmAction = onConfirm;
  const modal = document.getElementById('confirm-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
function closeConfirm() {
  const modal = document.getElementById('confirm-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  state.confirmAction = null;
}

/* ---------------------------------------------------------
   6. VIEW ROUTING
   --------------------------------------------------------- */

function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
  document.getElementById('view-' + name).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  if (name === 'purpose') renderPurposeGrid();
  if (name === 'context') renderContextGrid();
  if (name === 'saved') renderSavedList();
  document.getElementById('app-footer').classList.toggle('hidden', name === 'editor');
}

/* ---------------------------------------------------------
   7. LANDING: purpose chips
   --------------------------------------------------------- */

function renderLandingChips() {
  const el = document.getElementById('landing-purpose-chips');
  el.innerHTML = PURPOSES.map((p) => `
    <span class="px-3.5 py-2 rounded-full border border-black/10 dark:border-white/10 text-sm font-medium bg-white dark:bg-[#12141C]">
      ${p.icon} ${p.label}
    </span>
  `).join('');
}

/* ---------------------------------------------------------
   8. CV CREATION FLOW — Purpose → Context → Start method
   --------------------------------------------------------- */

function renderPurposeGrid() {
  const el = document.getElementById('purpose-grid');
  el.innerHTML = PURPOSES.map((p) => `
    <button data-purpose="${p.key}" class="purpose-card text-left p-5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12141C] hover:border-violet hover:shadow-[0_0_0_1px_rgba(124,58,237,0.4)] transition">
      <div class="w-10 h-10 rounded-lg bg-violet/10 flex items-center justify-center text-lg text-violet-bright mb-4">${p.icon}</div>
      <h3 class="font-semibold mb-1.5">${p.label}</h3>
      <p class="text-sm text-[#64748B] leading-relaxed mb-3">${p.desc}</p>
      <p class="text-xs text-[#64748B]"><span class="font-semibold text-violet-bright">Best for:</span> ${p.bestFor.join(', ')}</p>
    </button>
  `).join('');
  el.querySelectorAll('[data-purpose]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.draft = { purpose: btn.dataset.purpose };
      showView('context');
    });
  });
}

function renderContextGrid() {
  const purposeKey = (state.draft && state.draft.purpose) || 'general';
  const list = CONTEXTS[purposeKey] || CONTEXTS.general;
  const el = document.getElementById('context-grid');
  el.innerHTML = list.map((c) => `
    <button data-context="${c.key}" class="text-left p-5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12141C] hover:border-violet hover:shadow-[0_0_0_1px_rgba(124,58,237,0.4)] transition">
      <h3 class="font-semibold mb-1.5">${c.label}</h3>
      <p class="text-sm text-[#64748B] leading-relaxed">${c.desc}</p>
    </button>
  `).join('');
  el.querySelectorAll('[data-context]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.draft.context = btn.dataset.context;
      showView('start');
    });
  });
}

function createNewCV(useSample) {
  const { purpose, context } = state.draft;
  state.currentCV = blankCV(purpose, context, useSample);
  state.activeSectionKey = 'personal';
  saveCV(state.currentCV);
  enterEditor();
  if (useSample) showToast('Sample CV loaded — edit anything you like', 'success');
  trackEvent('cv_created', { purpose, context, method: useSample ? 'sample' : 'scratch' });
}

/* ---------------------------------------------------------
   9. SAVED CVs VIEW
   --------------------------------------------------------- */

function renderSavedList() {
  const cvs = getAllCVs().map(normalizeCV).sort((a, b) => b.updatedAt - a.updatedAt);
  const list = document.getElementById('saved-cv-list');
  const empty = document.getElementById('saved-empty-state');
  empty.classList.toggle('hidden', cvs.length > 0);
  list.classList.toggle('hidden', cvs.length === 0);

  list.innerHTML = cvs.map((cv) => `
    <div class="p-5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12141C] flex flex-col">
      <p class="font-mono text-[11px] uppercase tracking-wide text-violet-bright mb-2">${escapeHtml(purposeLabel(cv.purpose))}</p>
      <h3 class="font-display font-semibold mb-1 truncate">${escapeHtml(cv.title || 'Untitled CV')}</h3>
      <p class="text-xs text-[#64748B] mb-5">Updated ${new Date(cv.updatedAt).toLocaleDateString()}</p>
      <div class="mt-auto flex flex-wrap gap-2">
        <button data-open="${cv.id}" class="px-3 py-1.5 rounded-md bg-violet hover:bg-violet-bright text-white text-xs font-semibold transition">Edit</button>
        <button data-duplicate="${cv.id}" class="px-3 py-1.5 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition">Duplicate</button>
        <button data-delete="${cv.id}" class="px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition">Delete</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-open]').forEach((btn) => btn.addEventListener('click', () => {
    state.currentCV = normalizeCV(loadCV(btn.dataset.open));
    state.activeSectionKey = 'personal';
    enterEditor();
  }));
  list.querySelectorAll('[data-duplicate]').forEach((btn) => btn.addEventListener('click', () => {
    const original = loadCV(btn.dataset.duplicate);
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = 'cv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    copy.title = original.title + ' (Copy)';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    saveCV(copy);
    showToast('CV duplicated', 'success');
    renderSavedList();
  }));
  list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
    const cv = loadCV(btn.dataset.delete);
    openConfirm('Delete this CV?', `"${cv.title}" will be permanently deleted.`, () => {
      deleteCV(btn.dataset.delete);
      showToast('CV deleted', 'success');
      renderSavedList();
    });
  }));
}

/* ---------------------------------------------------------
   10. EDITOR — entry point
   --------------------------------------------------------- */

function enterEditor() {
  document.getElementById('cv-title-input').value = state.currentCV.title;
  document.getElementById('editor-purpose-label').textContent = purposeLabel(state.currentCV.purpose) + ' · ' + contextLabel(state.currentCV.purpose, state.currentCV.context);
  setMobileTab('edit');
  showView('editor');
  renderSectionNav();
  renderSectionForm();
  renderCVPreview();
  renderReadinessPanel();
}

function setMobileTab(tab) {
  document.getElementById('editor-pane-edit').classList.toggle('hidden', tab !== 'edit' && window.innerWidth < 768);
  document.getElementById('editor-pane-preview').classList.toggle('hidden', tab !== 'preview' && window.innerWidth < 768);
  document.querySelectorAll('.mobile-tab-btn').forEach((btn) => {
    const active = btn.dataset.mobileTab === tab;
    btn.classList.toggle('bg-violet/10', active);
    btn.classList.toggle('text-violet-bright', active);
  });
}

/* ---------------------------------------------------------
   11. SECTION NAV (left rail)
   --------------------------------------------------------- */

function renderSectionNav() {
  const cv = state.currentCV;
  const nav = document.getElementById('section-nav');
  const enabledSections = cv.sectionOrder.filter((key) => cv.sectionEnabled[key]);

  nav.innerHTML = enabledSections.map((key) => `
    <button data-section="${key}" class="section-nav-btn w-full flex items-center gap-2 px-2 md:px-3 py-2.5 text-left text-sm rounded-lg mx-1 mb-0.5 transition ${key === state.activeSectionKey ? 'bg-violet/10 text-violet-bright font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#475569] dark:text-[#94A3B8]'}">
      <span class="hidden md:inline truncate">${SECTION_LABELS[key]}</span>
      <span class="md:hidden font-mono text-xs">${SECTION_LABELS[key][0]}</span>
    </button>
  `).join('') + `
    <div class="px-1 mt-2">
      <button id="btn-add-section" class="w-full text-left px-2 md:px-3 py-2.5 text-sm rounded-lg text-violet-bright hover:bg-violet/10 font-semibold">
        <span class="hidden md:inline">+ Add Section</span>
        <span class="md:hidden">+</span>
      </button>
    </div>
  `;

  nav.querySelectorAll('[data-section]').forEach((btn) => btn.addEventListener('click', () => {
    state.activeSectionKey = btn.dataset.section;
    renderSectionNav();
    renderSectionForm();
  }));
  document.getElementById('btn-add-section').addEventListener('click', openAddSectionMenu);
}

function openAddSectionMenu() {
  const cv = state.currentCV;
  const disabled = ALL_SECTIONS.filter((key) => !cv.sectionEnabled[key]);
  if (disabled.length === 0) { showToast('All sections are already added'); return; }
  const area = document.getElementById('section-form-area');
  area.innerHTML = `
    <h2 class="font-display font-semibold text-lg mb-4">Add a section</h2>
    <div class="grid grid-cols-2 gap-2">
      ${disabled.map((key) => `<button data-enable="${key}" class="px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 hover:border-violet text-sm font-medium text-left transition">${SECTION_LABELS[key]}</button>`).join('')}
    </div>
  `;
  area.querySelectorAll('[data-enable]').forEach((btn) => btn.addEventListener('click', () => {
    cv.sectionEnabled[btn.dataset.enable] = true;
    state.activeSectionKey = btn.dataset.enable;
    renderSectionNav();
    renderSectionForm();
    scheduleAutosave();
  }));
}

/* ---------------------------------------------------------
   12. SECTION FORM (right of nav, left of preview)
   --------------------------------------------------------- */

function renderSectionForm() {
  const key = state.activeSectionKey;
  const area = document.getElementById('section-form-area');
  const cv = state.currentCV;

  let removeBtn = '';
  if (key !== 'personal' && key !== 'summary') {
    removeBtn = `<button id="btn-remove-section" class="text-xs font-semibold text-red-600 hover:underline">Remove section</button>`;
  }

  const header = `
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-display font-semibold text-lg">${SECTION_LABELS[key]}</h2>
      ${removeBtn}
    </div>
  `;

  let body = '';
  if (key === 'personal') body = renderPersonalForm();
  else if (key === 'summary') body = renderSummaryForm();
  else if (key === 'skills') body = renderSkillsForm();
  else if (key === 'templatePicker') body = '';
  else body = renderListSectionForm(key);

  area.innerHTML = header + body + renderTemplatePickerIfPersonal(key);

  bindSectionFormEvents(key);

  const rm = document.getElementById('btn-remove-section');
  if (rm) rm.addEventListener('click', () => {
    cv.sectionEnabled[key] = false;
    const remaining = cv.sectionOrder.filter((k) => cv.sectionEnabled[k]);
    state.activeSectionKey = remaining[0] || 'personal';
    renderSectionNav();
    renderSectionForm();
    renderCVPreview();
    scheduleAutosave();
  });
}

function templateMiniSvg(key) {
  if (key === 'classic') {
    return `<svg viewBox="0 0 60 84" class="w-full h-auto">
      <rect width="60" height="84" fill="#fff"/>
      <rect x="18" y="8" width="24" height="3" fill="#111827"/>
      <rect x="21" y="13" width="18" height="2" fill="#6B7280"/>
      <rect x="4" y="19" width="52" height="1" fill="#111827"/>
      <rect x="22" y="25" width="16" height="2" fill="#111827"/>
      <rect x="6" y="30" width="48" height="1.2" fill="#CBD5E1"/>
      <rect x="6" y="33" width="40" height="1.2" fill="#CBD5E1"/>
      <rect x="22" y="41" width="16" height="2" fill="#111827"/>
      <rect x="6" y="46" width="48" height="1.2" fill="#CBD5E1"/>
      <rect x="6" y="49" width="34" height="1.2" fill="#CBD5E1"/>
    </svg>`;
  }
  if (key === 'academic') {
    return `<svg viewBox="0 0 60 84" class="w-full h-auto">
      <rect width="60" height="84" fill="#fff"/>
      <rect x="6" y="8" width="26" height="3" fill="#0B1220"/>
      <rect x="6" y="13" width="18" height="2" fill="#475569"/>
      <circle cx="49" cy="12" r="6" fill="#E2E8F0"/>
      <rect x="6" y="22" width="48" height="1.4" fill="#334155"/>
      <rect x="6" y="27" width="20" height="4" fill="#F1F5F9"/>
      <rect x="6" y="34" width="48" height="1.2" fill="#E2E8F0"/>
      <rect x="6" y="37" width="42" height="1.2" fill="#E2E8F0"/>
      <rect x="6" y="46" width="20" height="4" fill="#F1F5F9"/>
      <rect x="6" y="53" width="48" height="1.2" fill="#E2E8F0"/>
    </svg>`;
  }
  if (key === 'myanmar-local') {
    return `<svg viewBox="0 0 60 84" class="w-full h-auto">
      <rect width="60" height="84" fill="#fff"/>
      <rect x="8" y="6" width="34" height="1.6" fill="#0B1220"/>
      <rect x="12" y="9" width="26" height="1.3" fill="#475569"/>
      <rect x="10" y="12.5" width="30" height="1.6" fill="#0B1220"/>
      <rect x="46" y="5" width="9" height="11" fill="#E2E8F0" stroke="#94A3B8" stroke-width="0.4"/>
      <rect x="6" y="20" width="4" height="2" fill="#334155"/>
      <rect x="13" y="20" width="18" height="1.4" fill="#334155"/>
      <rect x="34" y="20" width="20" height="1.2" fill="#CBD5E1"/>
      <rect x="6" y="25" width="4" height="2" fill="#334155"/>
      <rect x="13" y="25" width="18" height="1.4" fill="#334155"/>
      <rect x="34" y="25" width="20" height="1.2" fill="#CBD5E1"/>
      <rect x="6" y="30" width="4" height="2" fill="#334155"/>
      <rect x="13" y="30" width="18" height="1.4" fill="#334155"/>
      <rect x="34" y="30" width="20" height="1.2" fill="#CBD5E1"/>
      <rect x="6" y="35" width="4" height="2" fill="#334155"/>
      <rect x="13" y="35" width="18" height="1.4" fill="#334155"/>
      <rect x="34" y="35" width="20" height="1.2" fill="#CBD5E1"/>
      <rect x="6" y="40" width="4" height="2" fill="#334155"/>
      <rect x="13" y="40" width="18" height="1.4" fill="#334155"/>
      <rect x="34" y="40" width="20" height="1.2" fill="#CBD5E1"/>
      <rect x="6" y="45" width="4" height="2" fill="#334155"/>
      <rect x="13" y="45" width="24" height="1.4" fill="#334155"/>
    </svg>`;
  }
  // modern (default)
  return `<svg viewBox="0 0 60 84" class="w-full h-auto">
    <rect width="60" height="84" fill="#fff"/>
    <circle cx="12" cy="12" r="6" fill="#DDD6FE"/>
    <rect x="22" y="8" width="26" height="3" fill="#0F172A"/>
    <rect x="22" y="13" width="18" height="2" fill="#A855F7"/>
    <rect x="6" y="23" width="48" height="1.4" fill="#EDE9FE"/>
    <rect x="6" y="29" width="14" height="2" fill="#A855F7"/>
    <rect x="6" y="33" width="48" height="1.2" fill="#E2E8F0"/>
    <rect x="6" y="36" width="40" height="1.2" fill="#E2E8F0"/>
    <rect x="6" y="45" width="14" height="2" fill="#A855F7"/>
    <rect x="6" y="49" width="48" height="1.2" fill="#E2E8F0"/>
    <rect x="6" y="52" width="30" height="1.2" fill="#E2E8F0"/>
  </svg>`;
}

function renderTemplatePickerIfPersonal(key) {
  if (key !== 'personal') return '';
  const templates = [
    { key: 'modern', label: 'Modern' },
    { key: 'classic', label: 'Classic' },
    { key: 'academic', label: 'Academic' },
    { key: 'myanmar-local', label: 'Myanmar Local' },
  ];
  return `
    <div class="mt-8 pt-6 border-t border-black/5 dark:border-white/10">
      <p class="text-sm font-semibold mb-3">Template</p>
      <div class="grid grid-cols-4 gap-2">
        ${templates.map((t) => `
          <button data-template="${t.key}" class="template-btn rounded-lg border overflow-hidden text-center transition ${state.currentCV.template === t.key ? 'border-violet ring-1 ring-violet' : 'border-black/10 dark:border-white/10 hover:border-violet'}">
            <span class="block bg-[#F1F5F9] dark:bg-[#1A1D29] p-1.5">${templateMiniSvg(t.key)}</span>
            <span class="block py-1.5 text-[11px] font-medium leading-tight ${state.currentCV.template === t.key ? 'text-violet-bright' : ''}">${t.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/* ---------- Required / Recommended / Optional badges ---------- */

function fieldLevel(name, contextKey) {
  const myanmar = isMyanmarContext(contextKey);
  const levels = {
    fullName: 'required',
    email: 'required',
    phone: myanmar ? 'required' : 'recommended',
    location: myanmar ? 'required' : 'recommended',
    jobTitle: 'recommended',
    linkedin: 'recommended',
    website: 'optional',
    github: 'optional',
    photo: myanmar ? 'recommended' : 'optional',
    nrc: 'recommended',
    dateOfBirth: 'optional',
    gender: 'optional',
  };
  return levels[name] || 'optional';
}

function levelBadge(level) {
  const map = {
    required: 'text-red-500',
    recommended: 'text-amber-600 dark:text-amber-400',
    optional: 'text-[#94A3B8]',
  };
  const text = { required: 'Required', recommended: 'Recommended', optional: 'Optional' }[level];
  return `<span class="text-[10px] font-semibold uppercase tracking-wide ${map[level]}">${text}</span>`;
}

function renderPersonalForm() {
  const cv = state.currentCV;
  const p = cv.personal;
  const field = (name, label, type = 'text', placeholder = '') => `
    <div>
      <div class="flex items-center justify-between mb-1.5">
        <label class="block text-xs font-semibold text-[#64748B]">${label}</label>
        ${levelBadge(fieldLevel(name, cv.context))}
      </div>
      <input data-personal="${name}" type="${type}" value="${escapeHtml(p[name])}" placeholder="${placeholder}"
        class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition">
      <p data-error-for="${name}" class="text-xs text-red-500 mt-1 hidden"></p>
    </div>
  `;

  const photoBlock = `
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-xs font-semibold text-[#64748B]">Profile Photo</label>
        ${levelBadge(fieldLevel('photo', cv.context))}
      </div>
      <div class="flex items-center gap-4">
        <div id="photo-preview" class="w-20 h-20 shrink-0 bg-black/5 dark:bg-white/5 border border-dashed border-black/15 dark:border-white/15 flex items-center justify-center overflow-hidden text-[#94A3B8] text-xs ${photoShapeClass(p.photoShape)}">
          ${p.photo ? `<img src="${p.photo}" alt="Profile photo" class="w-full h-full object-cover">` : 'No photo'}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap gap-2 mb-2">
            <label class="cursor-pointer px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition">
              ${p.photo ? 'Change Photo' : 'Upload Photo'}
              <input id="photo-input" type="file" accept="image/jpeg,image/png,image/webp" class="hidden">
            </label>
            ${p.photo ? `<button id="btn-edit-photo" class="px-3 py-2 rounded-lg border border-violet/40 text-violet-bright hover:bg-violet/10 text-xs font-semibold transition">✎ Edit Photo</button>` : ''}
            ${p.photo ? `<button id="btn-remove-photo" class="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition">Remove</button>` : ''}
          </div>
          <div class="flex items-center gap-1.5 mb-2">
            ${['circle', 'rounded', 'square'].map((shape) => `
              <button data-photo-shape="${shape}" class="w-7 h-7 flex items-center justify-center border text-[10px] transition ${p.photoShape === shape ? 'border-violet text-violet-bright' : 'border-black/10 dark:border-white/10 text-[#94A3B8]'} ${shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-md' : 'rounded-none'}">${shape[0].toUpperCase()}</button>
            `).join('')}
          </div>
          <label class="flex items-center gap-2 text-xs cursor-pointer select-none text-[#64748B]">
            <input type="checkbox" data-personal-check="showPhoto" ${p.showPhoto ? 'checked' : ''} class="w-3.5 h-3.5 rounded accent-violet">
            Show photo on CV
          </label>
          <p class="text-[11px] text-[#94A3B8] mt-1">JPG, PNG or WEBP, up to 2 MB.</p>
        </div>
      </div>
    </div>
  `;

  const myanmarBlock = (isMyanmarContext(cv.context) || cv.template === 'myanmar-local') ? `
    <div class="pt-4 border-t border-black/5 dark:border-white/10 space-y-4">
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-xs font-semibold text-[#64748B]">NRC Number</label>
          ${levelBadge(fieldLevel('nrc', cv.context))}
        </div>
        <div class="flex items-center gap-1.5">
          <input data-nrc-part="state" type="text" inputmode="numeric" maxlength="2" value="${escapeHtml(parseNrc(p.nrc).state)}" placeholder="12"
            class="w-11 px-1 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm text-center focus:outline-none focus:border-violet transition">
          <span class="text-[#94A3B8] text-sm">/</span>
          <input data-nrc-part="township" type="text" maxlength="8" value="${escapeHtml(parseNrc(p.nrc).township)}" placeholder="ဗဟန"
            class="w-16 px-1 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm text-center focus:outline-none focus:border-violet transition">
          <span class="text-[#94A3B8] text-sm">(</span>
          <input data-nrc-part="type" type="text" maxlength="1" value="${escapeHtml(parseNrc(p.nrc).type)}" placeholder="N"
            class="w-9 px-1 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm text-center uppercase focus:outline-none focus:border-violet transition">
          <span class="text-[#94A3B8] text-sm">)</span>
          <input data-nrc-part="number" type="text" inputmode="numeric" maxlength="6" value="${escapeHtml(parseNrc(p.nrc).number)}" placeholder="123456"
            class="w-24 flex-1 px-2 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm text-center focus:outline-none focus:border-violet transition">
        </div>
        <p data-error-for="nrc" class="text-xs text-red-500 mt-1 hidden"></p>
        <label class="flex items-center gap-2 text-xs cursor-pointer select-none text-[#64748B] mt-1.5">
          <input type="checkbox" data-personal-check="showNrc" ${p.showNrc ? 'checked' : ''} class="w-3.5 h-3.5 rounded accent-violet">
          Show NRC on CV
        </label>
      </div>
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-xs font-semibold text-[#64748B]">Date of Birth</label>
          ${levelBadge(fieldLevel('dateOfBirth', cv.context))}
        </div>
        <input data-personal="dateOfBirth" type="date" value="${escapeHtml(p.dateOfBirth)}"
          class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition">
        <label class="flex items-center gap-2 text-xs cursor-pointer select-none text-[#64748B] mt-1.5">
          <input type="checkbox" data-personal-check="showDateOfBirth" ${p.showDateOfBirth ? 'checked' : ''} class="w-3.5 h-3.5 rounded accent-violet">
          Show date of birth on CV
        </label>
      </div>
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-xs font-semibold text-[#64748B]">Gender</label>
          ${levelBadge(fieldLevel('gender', cv.context))}
        </div>
        <input data-personal="gender" type="text" value="${escapeHtml(p.gender)}" placeholder="e.g. Male, Female"
          class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition">
        <label class="flex items-center gap-2 text-xs cursor-pointer select-none text-[#64748B] mt-1.5">
          <input type="checkbox" data-personal-check="showGender" ${p.showGender ? 'checked' : ''} class="w-3.5 h-3.5 rounded accent-violet">
          Show gender on CV
        </label>
      </div>
      <div class="grid grid-cols-2 gap-3">
        ${field('fatherName', "Father's Name")}
        ${field('nationality', 'Nationality', 'text', 'Myanmar')}
        ${field('race', 'Race', 'text', 'Bamar')}
        ${field('religion', 'Religion', 'text', 'Buddhist')}
        ${field('maritalStatus', 'Marital Status', 'text', 'Single')}
        ${field('bloodGroup', 'Blood Group', 'text', 'O')}
        ${field('height', 'Height', 'text', '5\'6"')}
        ${field('weight', 'Weight', 'text', '60 kg')}
      </div>
      <p class="text-[11px] text-[#94A3B8]">These are only shown on your CV if you fill them in — none are required.</p>
    </div>
  ` : '';

  const orgHeaderBlock = cv.template === 'myanmar-local' ? `
    <div class="pt-4 border-t border-black/5 dark:border-white/10 space-y-4">
      <p class="text-xs font-semibold text-[#64748B]">Organization Header <span class="font-normal text-[#94A3B8]">(shown at the top of the Myanmar Local document)</span></p>
      <div>
        <label class="block text-xs font-semibold text-[#64748B] mb-1.5">Organization / Ministry / Company Name</label>
        <input data-org="organizationName" type="text" value="${escapeHtml(cv.orgHeader.organizationName)}" placeholder="e.g. ABC Company Limited"
          class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition">
      </div>
      <div>
        <label class="block text-xs font-semibold text-[#64748B] mb-1.5">Department / Division</label>
        <input data-org="department" type="text" value="${escapeHtml(cv.orgHeader.department)}" placeholder="e.g. Human Resources Department"
          class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition">
      </div>
      <div>
        <label class="block text-xs font-semibold text-[#64748B] mb-1.5">Form Title</label>
        <input data-org="formTitle" type="text" value="${escapeHtml(cv.orgHeader.formTitle)}" placeholder="e.g. Job Application Form / ကိုယ်ရေးမှတ်တမ်း"
          class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition">
      </div>
      <div>
        <label class="block text-xs font-semibold text-[#64748B] mb-1.5">Logo (optional)</label>
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 shrink-0 bg-black/5 dark:bg-white/5 border border-dashed border-black/15 dark:border-white/15 flex items-center justify-center overflow-hidden text-[10px] text-[#94A3B8]">
            ${cv.orgHeader.logo ? `<img src="${cv.orgHeader.logo}" alt="Logo" class="w-full h-full object-contain">` : 'Logo'}
          </div>
          <div class="flex gap-2">
            <label class="cursor-pointer px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition">
              ${cv.orgHeader.logo ? 'Change' : 'Upload'}
              <input id="org-logo-input" type="file" accept="image/jpeg,image/png,image/webp" class="hidden">
            </label>
            ${cv.orgHeader.logo ? `<button id="btn-remove-org-logo" class="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition">Remove</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <div class="space-y-4">
      ${photoBlock}
      ${field('fullName', 'Full Name')}
      ${field('jobTitle', 'Professional Title')}
      ${field('email', 'Email', 'email')}
      ${field('phone', 'Phone')}
      ${field('location', 'Location')}
      ${field('linkedin', 'LinkedIn', 'text', 'linkedin.com/in/you')}
      ${field('website', 'Website', 'text', 'yourname.com')}
      ${field('github', 'Portfolio', 'text', 'yourportfolio.com')}
      ${myanmarBlock}
      ${orgHeaderBlock}
    </div>
  `;
}

function photoShapeClass(shape) {
  if (shape === 'square') return 'rounded-none';
  if (shape === 'rounded') return 'rounded-lg';
  return 'rounded-full';
}

function renderSummaryForm() {
  const cv = state.currentCV;
  return `
    <label class="block text-xs font-semibold text-[#64748B] mb-1.5">Professional Summary</label>
    <p class="text-xs text-[#64748B] leading-relaxed mb-2">Briefly explain who you are, what you do, and what opportunity you're looking for.<br>Example: "Computer Science student with experience developing web applications..."</p>
    <textarea data-summary rows="8" maxlength="600" placeholder="A short, punchy introduction of who you are and what you bring."
      class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition resize-none">${escapeHtml(cv.summary)}</textarea>
    <p class="text-xs text-[#64748B] mt-1"><span id="summary-count">${cv.summary.length}</span>/600</p>
  `;
}

function renderSkillsForm() {
  const skills = state.currentCV.skills;
  const tagGroup = (type, label) => `
    <div class="mb-6">
      <label class="block text-xs font-semibold text-[#64748B] mb-2">${label}</label>
      <div data-tag-list="${type}" class="flex flex-wrap gap-2 mb-2">
        ${skills[type].map((s, i) => `
          <span class="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-violet/10 text-violet-bright text-sm font-medium">
            ${escapeHtml(s)}
            <button data-remove-tag="${type}:${i}" class="w-4 h-4 rounded-full hover:bg-violet/20 flex items-center justify-center text-xs leading-none">×</button>
          </span>
        `).join('')}
      </div>
      <div class="flex gap-2">
        <input data-tag-input="${type}" type="text" placeholder="Type a skill and press Enter"
          class="flex-1 px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition">
        <button data-tag-add="${type}" class="px-3.5 py-2 rounded-lg bg-violet/10 text-violet-bright text-sm font-semibold hover:bg-violet/20 transition">Add</button>
      </div>
    </div>
  `;
  return tagGroup('technical', 'Core Skills') + tagGroup('soft', 'Soft Skills');
}

// Beginner-friendly helper tips shown above a section's form.
const SECTION_HELP = {
  experience: 'Tip: start bullet points with action words — Developed, Designed, Managed, Implemented, Improved, Created.',
  internship: 'Tip: start bullet points with action words — Developed, Designed, Managed, Implemented, Improved, Created.',
  projects: 'Tip: explain what you built, what problem it solved, and which tools or skills you used.',
};

// Friendlier empty-state copy for sections a beginner might not have content for yet.
const SECTION_SKIP_HELP = {
  experience: "Don't have work experience yet? That's okay — you can skip this and focus on Projects, Education and Skills instead.",
  internship: "Don't have experience yet? That's okay — focus on Projects, Education and Skills instead.",
};

function renderListSectionForm(key) {
  const schema = LIST_SCHEMA[key];
  const items = state.currentCV.entries[key];
  const help = SECTION_HELP[key] ? `<p class="text-xs text-[#64748B] leading-relaxed mb-4">${SECTION_HELP[key]}</p>` : '';

  if (items.length === 0) {
    const skipMsg = SECTION_SKIP_HELP[key];
    return `
      ${help}
      <div class="text-center py-12 border border-dashed border-black/15 dark:border-white/15 rounded-xl">
        <p class="text-sm text-[#64748B] mb-1 px-4">${skipMsg || `No ${SECTION_LABELS[key].toLowerCase()} added yet.`}</p>
        <div class="mt-4 flex items-center justify-center gap-2">
          <button data-add-entry="${key}" class="px-4 py-2 rounded-lg bg-violet hover:bg-violet-bright text-white text-sm font-semibold transition">+ Add ${SECTION_LABELS[key]}</button>
        </div>
      </div>
    `;
  }

  const cards = items.map((entry) => `
    <div class="entry-card mb-3 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden" data-entry-card="${entry.id}">
      <button data-toggle-entry="${entry.id}" class="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition">
        <span class="text-sm font-semibold truncate">${escapeHtml(schema.title(entry)) || 'Untitled'}</span>
        <span class="flex items-center gap-2 shrink-0">
          <span class="entry-chevron text-[#64748B] text-xs transition-transform">▾</span>
        </span>
      </button>
      <div data-entry-body="${entry.id}" class="entry-body hidden px-4 pb-4 space-y-3 border-t border-black/5 dark:border-white/5 pt-4">
        ${schema.fields.map((f) => renderEntryField(key, entry, f)).join('')}
        <button data-remove-entry="${key}:${entry.id}" class="text-xs font-semibold text-red-600 hover:underline">Delete this entry</button>
      </div>
    </div>
  `).join('');

  return help + cards + `<button data-add-entry="${key}" class="mt-1 w-full px-4 py-2.5 rounded-lg border border-dashed border-black/15 dark:border-white/15 hover:border-violet text-sm font-semibold text-violet-bright transition">+ Add another</button>`;
}

function renderEntryField(sectionKey, entry, field) {
  const value = entry[field.name] || '';
  const errId = `err-${entry.id}-${field.name}`;
  if (field.type === 'textarea') {
    return `
      <div>
        <label class="block text-xs font-semibold text-[#64748B] mb-1.5">${field.label}</label>
        <textarea data-entry-field="${sectionKey}:${entry.id}:${field.name}" rows="3" class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition resize-none">${escapeHtml(value)}</textarea>
      </div>
    `;
  }
  if (field.type === 'checkbox') {
    return `
      <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input type="checkbox" data-entry-field="${sectionKey}:${entry.id}:${field.name}" ${value ? 'checked' : ''} class="w-4 h-4 rounded accent-violet">
        ${field.label}
      </label>
    `;
  }
  return `
    <div>
      <label class="block text-xs font-semibold text-[#64748B] mb-1.5">${field.label}</label>
      <input data-entry-field="${sectionKey}:${entry.id}:${field.name}" type="${field.type === 'month' ? 'month' : field.type === 'url' ? 'text' : field.type}" value="${escapeHtml(value)}" placeholder="${field.placeholder || ''}"
        class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition">
      <p id="${errId}" class="text-xs text-red-500 mt-1 hidden"></p>
    </div>
  `;
}

/* ---------------------------------------------------------
   13. FORM EVENT BINDING
   --------------------------------------------------------- */

function bindSectionFormEvents(key) {
  const area = document.getElementById('section-form-area');

  // Personal fields
  area.querySelectorAll('[data-personal]').forEach((input) => {
    input.addEventListener('input', () => {
      state.currentCV.personal[input.dataset.personal] = input.value;
      validatePersonalField(input.dataset.personal, input.value);
      renderCVPreview();
      renderReadinessPanel();
      scheduleAutosave();
    });
  });

  // Personal show/hide + boolean checkboxes (photo, NRC, DOB, gender)
  area.querySelectorAll('[data-personal-check]').forEach((input) => {
    input.addEventListener('change', () => {
      state.currentCV.personal[input.dataset.personalCheck] = input.checked;
      renderCVPreview();
      scheduleAutosave();
    });
  });

  // NRC — four separate inputs combined into one stored string
  const nrcInputs = area.querySelectorAll('[data-nrc-part]');
  if (nrcInputs.length) {
    const syncNrc = () => {
      const parts = {};
      nrcInputs.forEach((i) => { parts[i.dataset.nrcPart] = i.value.trim(); });
      return combineNrc(parts);
    };
    nrcInputs.forEach((input) => {
      input.addEventListener('input', () => {
        state.currentCV.personal.nrc = syncNrc();
        renderCVPreview();
        scheduleAutosave();
      });
      // Validate only once the person has finished typing a part, so the
      // error doesn't flash while they're still filling in the other three.
      input.addEventListener('blur', () => validatePersonalField('nrc', syncNrc()));
    });
  }

  // Organization header (Myanmar Local template) — name/department/form title
  area.querySelectorAll('[data-org]').forEach((input) => {
    input.addEventListener('input', () => {
      state.currentCV.orgHeader[input.dataset.org] = input.value;
      renderCVPreview();
      scheduleAutosave();
    });
  });

  const orgLogoInput = area.querySelector('#org-logo-input');
  if (orgLogoInput) {
    orgLogoInput.addEventListener('change', () => {
      const file = orgLogoInput.files && orgLogoInput.files[0];
      if (!file) return;
      if (!PHOTO_ALLOWED_TYPES.includes(file.type) || file.size > PHOTO_MAX_BYTES) {
        showToast('Please upload a JPG, PNG, or WEBP image under 2 MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        state.currentCV.orgHeader.logo = reader.result;
        renderSectionForm();
        renderCVPreview();
        scheduleAutosave();
      };
      reader.onerror = () => showToast('Could not read that image. Please try another file.', 'error');
      reader.readAsDataURL(file);
    });
  }
  const removeOrgLogoBtn = area.querySelector('#btn-remove-org-logo');
  if (removeOrgLogoBtn) {
    removeOrgLogoBtn.addEventListener('click', () => {
      state.currentCV.orgHeader.logo = '';
      renderSectionForm();
      renderCVPreview();
      scheduleAutosave();
    });
  }

  // Photo shape selector
  area.querySelectorAll('[data-photo-shape]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentCV.personal.photoShape = btn.dataset.photoShape;
      renderSectionForm();
      renderCVPreview();
      scheduleAutosave();
    });
  });

  // Photo upload
  const photoInput = area.querySelector('#photo-input');
  if (photoInput) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) return;
      if (state.currentCV.personal.photo) {
        openConfirm('Replace current photo?', 'Your current photo and any edits will be replaced with the new upload.', () => handlePhotoUpload(file));
        photoInput.value = ''; // allow re-selecting the same file later
      } else {
        handlePhotoUpload(file);
      }
    });
  }
  const editPhotoBtn = area.querySelector('#btn-edit-photo');
  if (editPhotoBtn) editPhotoBtn.addEventListener('click', openPhotoStudio);

  const removePhotoBtn = area.querySelector('#btn-remove-photo');
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
      state.currentCV.personal.photo = '';
      state.currentCV.personal.photoOriginal = '';
      renderSectionForm();
      renderCVPreview();
      renderReadinessPanel();
      scheduleAutosave();
    });
  }

  // Template buttons
  area.querySelectorAll('[data-template]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentCV.template = btn.dataset.template;
      renderSectionForm();
      renderCVPreview();
      scheduleAutosave();
    });
  });

  // Summary
  const summaryEl = area.querySelector('[data-summary]');
  if (summaryEl) {
    summaryEl.addEventListener('input', () => {
      state.currentCV.summary = summaryEl.value;
      document.getElementById('summary-count').textContent = summaryEl.value.length;
      renderCVPreview();
      scheduleAutosave();
    });
  }

  // Skills tags
  ['technical', 'soft'].forEach((type) => {
    const addBtn = area.querySelector(`[data-tag-add="${type}"]`);
    const input = area.querySelector(`[data-tag-input="${type}"]`);
    if (!addBtn) return;
    const addTag = () => {
      const val = input.value.trim();
      if (!val) return;
      state.currentCV.skills[type].push(val);
      input.value = '';
      renderSectionForm();
      renderCVPreview();
      scheduleAutosave();
    };
    addBtn.addEventListener('click', addTag);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });
  });
  area.querySelectorAll('[data-remove-tag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [type, idx] = btn.dataset.removeTag.split(':');
      state.currentCV.skills[type].splice(Number(idx), 1);
      renderSectionForm();
      renderCVPreview();
      scheduleAutosave();
    });
  });

  // Add entry
  area.querySelectorAll('[data-add-entry]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sectionKey = btn.dataset.addEntry;
      const newEntry = { id: uid() };
      LIST_SCHEMA[sectionKey].fields.forEach((f) => { newEntry[f.name] = f.type === 'checkbox' ? false : ''; });
      state.currentCV.entries[sectionKey].push(newEntry);
      renderSectionForm();
      renderCVPreview();
      scheduleAutosave();
      const card = area.querySelector(`[data-entry-body="${newEntry.id}"]`);
      if (card) card.classList.remove('hidden');
    });
  });

  // Toggle entry open/close
  area.querySelectorAll('[data-toggle-entry]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const body = area.querySelector(`[data-entry-body="${btn.dataset.toggleEntry}"]`);
      body.classList.toggle('hidden');
      const chevron = btn.querySelector('.entry-chevron');
      chevron.style.transform = body.classList.contains('hidden') ? '' : 'rotate(180deg)';
    });
  });

  // Entry field input
  area.querySelectorAll('[data-entry-field]').forEach((input) => {
    const handler = () => {
      const [sectionKey, entryId, fieldName] = input.dataset.entryField.split(':');
      const entry = state.currentCV.entries[sectionKey].find((e) => e.id === entryId);
      entry[fieldName] = input.type === 'checkbox' ? input.checked : input.value;
      validateEntryField(sectionKey, entryId, fieldName, entry[fieldName]);
      // update the collapsed title live without a full re-render (keeps focus)
      const titleEl = area.closest('body') && document.querySelector(`[data-entry-card="${entryId}"] .text-sm.font-semibold`);
      if (titleEl) titleEl.textContent = LIST_SCHEMA[sectionKey].title(entry) || 'Untitled';
      renderCVPreview();
      scheduleAutosave();
    };
    input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', handler);
  });

  // Remove entry
  area.querySelectorAll('[data-remove-entry]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [sectionKey, entryId] = btn.dataset.removeEntry.split(':');
      openConfirm('Delete this entry?', 'This entry will be permanently removed from your CV.', () => {
        state.currentCV.entries[sectionKey] = state.currentCV.entries[sectionKey].filter((e) => e.id !== entryId);
        renderSectionForm();
        renderCVPreview();
        scheduleAutosave();
      });
    });
  });
}

/* ---------------------------------------------------------
   14. VALIDATION
   --------------------------------------------------------- */

function validatePersonalField(name, value) {
  const errEl = document.querySelector(`[data-error-for="${name}"]`);
  if (!errEl) return true;
  let msg = '';
  if (name === 'fullName' && !value.trim()) msg = 'Full name is required.';
  if (name === 'email') {
    if (!value.trim()) msg = 'Email is required.';
    else if (!isValidEmail(value)) msg = 'Enter a valid email address.';
  }
  if (['website', 'linkedin', 'github'].includes(name) && value && !isValidUrl(value)) msg = 'Enter a valid URL.';
  if (name === 'nrc' && value && !/^\d{1,2}\/[A-Za-z\u1000-\u109F]+\([A-Za-z]\)\d{6}$/.test(value.replace(/\s/g, ''))) {
    msg = 'Format: 12/AhMaYa(N)123456';
  }
  errEl.textContent = msg;
  errEl.classList.toggle('hidden', !msg);
  return !msg;
}

function validateEntryField(sectionKey, entryId, fieldName, value) {
  const errEl = document.getElementById(`err-${entryId}-${fieldName}`);
  if (!errEl) return true;
  const fieldDef = LIST_SCHEMA[sectionKey].fields.find((f) => f.name === fieldName);
  let msg = '';
  if (fieldDef && fieldDef.required && !String(value).trim()) msg = `${fieldDef.label} is required.`;
  if (fieldDef && fieldDef.type === 'url' && value && !isValidUrl(value)) msg = 'Enter a valid URL.';
  if (fieldDef && fieldDef.type === 'email' && value && !isValidEmail(value)) msg = 'Enter a valid email.';
  errEl.textContent = msg;
  errEl.classList.toggle('hidden', !msg);
  return !msg;
}

function validateBeforeSave() {
  const p = state.currentCV.personal;
  let ok = true;
  if (!p.fullName.trim()) { ok = false; }
  if (!p.email.trim() || !isValidEmail(p.email)) { ok = false; }
  if (!ok) {
    state.activeSectionKey = 'personal';
    renderSectionNav();
    renderSectionForm();
    validatePersonalField('fullName', p.fullName);
    validatePersonalField('email', p.email);
    showToast('Please fill in your name and a valid email before saving.', 'error');
  }
  return ok;
}

/* ---------------------------------------------------------
   15. LIVE PREVIEW RENDERING
   --------------------------------------------------------- */

function renderCVPreview() {
  const cv = state.currentCV;
  const paper = document.getElementById('cv-paper');
  paper.className = 'cv-paper template-' + cv.template;

  const p = cv.personal;
  const isMyanmarLocal = cv.template === 'myanmar-local';

  let html = isMyanmarLocal ? renderMyanmarLocalHeader(cv) : renderStandardHeader(cv);

  const enabledOrdered = cv.sectionOrder.filter((key) => cv.sectionEnabled[key] && key !== 'personal');

  enabledOrdered.forEach((key) => {
    if (key === 'summary') {
      if (cv.summary.trim()) html += `<section class="cv-section"><h2 class="cv-heading">${isMyanmarLocal ? 'Objective / Remarks' : 'Summary'}</h2><p class="cv-text">${nl2br(cv.summary)}</p></section>`;
      return;
    }
    if (key === 'skills') {
      if (cv.skills.technical.length || cv.skills.soft.length) {
        html += `<section class="cv-section"><h2 class="cv-heading">Skills</h2>`;
        if (cv.skills.technical.length) html += `<p class="cv-text"><strong>Core Skills:</strong> ${cv.skills.technical.map(escapeHtml).join(', ')}</p>`;
        if (cv.skills.soft.length) html += `<p class="cv-text"><strong>Soft Skills:</strong> ${cv.skills.soft.map(escapeHtml).join(', ')}</p>`;
        html += `</section>`;
      }
      return;
    }
    if (LIST_SCHEMA[key]) {
      const items = cv.entries[key];
      if (!items || items.length === 0) return;
      const schema = LIST_SCHEMA[key];
      html += `<section class="cv-section"><h2 class="cv-heading">${SECTION_LABELS[key]}</h2>`;
      items.forEach((entry) => {
        const title = escapeHtml(schema.title(entry));
        const subtitle = escapeHtml(schema.subtitle(entry) || '');
        const meta = escapeHtml(schema.meta(entry) || '');
        const extra = schema.extra ? escapeHtml(schema.extra(entry) || '') : '';
        const hasDesc = 'description' in entry;
        html += `
          <div class="cv-entry">
            <div class="cv-entry-row">
              <span class="cv-entry-title">${title}${subtitle ? ` — <span class="cv-entry-subtitle">${subtitle}</span>` : ''}</span>
              ${meta ? `<span class="cv-entry-meta">${meta}</span>` : ''}
            </div>
            ${extra ? `<p class="cv-text">${extra}</p>` : ''}
            ${entry.url ? `<a class="cv-entry-link" href="${escapeHtml(entry.url)}">${escapeHtml(entry.url)}</a>` : ''}
            ${entry.credentialUrl ? `<a class="cv-entry-link" href="${escapeHtml(entry.credentialUrl)}">${escapeHtml(entry.credentialUrl)}</a>` : ''}
            ${entry.githubUrl || entry.liveUrl ? `<p class="cv-entry-link">${[entry.githubUrl, entry.liveUrl].filter(Boolean).map(escapeHtml).join(' &nbsp;·&nbsp; ')}</p>` : ''}
            ${hasDesc && entry.description ? `<p class="cv-text">${nl2br(entry.description)}</p>` : ''}
          </div>
        `;
      });
      html += `</section>`;
    }
  });

  paper.innerHTML = html;
  renderReadinessPanel();
}

function renderStandardHeader(cv) {
  const p = cv.personal;
  const contactBits = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean);
  const extraBits = [];
  if (p.showNrc && p.nrc) extraBits.push('NRC: ' + p.nrc);
  if (p.showDateOfBirth && p.dateOfBirth) extraBits.push('DOB: ' + formatDate(p.dateOfBirth));
  if (p.showGender && p.gender) extraBits.push(p.gender);
  const showPhotoNow = p.showPhoto && p.photo;

  return `
    <header class="cv-header ${showPhotoNow ? 'has-photo' : ''}">
      ${showPhotoNow ? `<div class="cv-photo cv-photo-${p.photoShape || 'circle'}"><img src="${p.photo}" alt=""></div>` : ''}
      <div class="cv-header-text">
        <h1 class="cv-name">${escapeHtml(p.fullName) || 'Your Name'}</h1>
        ${p.jobTitle ? `<p class="cv-title">${escapeHtml(p.jobTitle)}</p>` : ''}
        ${contactBits.length ? `<p class="cv-contact">${contactBits.map(escapeHtml).join(' &nbsp;·&nbsp; ')}</p>` : ''}
        ${extraBits.length ? `<p class="cv-contact">${extraBits.map(escapeHtml).join(' &nbsp;·&nbsp; ')}</p>` : ''}
      </div>
    </header>
  `;
}

/**
 * Myanmar Local template header: dynamic organization/ministry header,
 * a numbered personal-information block (colon-aligned label:value, the
 * structural convention used by Myanmar CVs and application forms), and
 * a photo box positioned top-right — inspired by common local document
 * structure, not copied from any single source.
 */
function renderMyanmarLocalHeader(cv) {
  const p = cv.personal;
  const org = cv.orgHeader;
  const showPhotoNow = p.showPhoto && p.photo;

  const rows = getMyanmarLocalRows(cv)
    .map(([label, value]) => `<li class="mlocal-row"><span class="mlocal-label">${escapeHtml(label)}</span><span class="mlocal-colon">–</span><span class="mlocal-value">${escapeHtml(value)}</span></li>`)
    .join('');

  return `
    <header class="mlocal-header">
      ${org.logo ? `<img class="mlocal-logo" src="${org.logo}" alt="">` : ''}
      ${org.organizationName ? `<p class="mlocal-org">${escapeHtml(org.organizationName)}</p>` : ''}
      ${org.department ? `<p class="mlocal-dept">${escapeHtml(org.department)}</p>` : ''}
      <p class="mlocal-form-title">${org.formTitle ? escapeHtml(org.formTitle) : 'Personal Record Form'}</p>
    </header>
    <div class="mlocal-body">
      ${showPhotoNow ? `<div class="mlocal-photo-box"><img src="${p.photo}" alt=""></div>` : '<div class="mlocal-photo-box mlocal-photo-empty"></div>'}
      <ol class="mlocal-fields">${rows}</ol>
    </div>
    ${p.jobTitle ? `<p class="mlocal-applied-for"><span class="mlocal-label">Applied Position</span><span class="mlocal-colon">–</span><span class="mlocal-value">${escapeHtml(p.jobTitle)}</span></p>` : ''}
  `;
}

/* ---------------------------------------------------------
   15b. PROFILE PHOTO UPLOAD
   --------------------------------------------------------- */

const PHOTO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function handlePhotoUpload(file) {
  if (!PHOTO_ALLOWED_TYPES.includes(file.type)) {
    showToast('Please upload a JPG, PNG, or WEBP image under 2 MB.', 'error');
    return;
  }
  if (file.size > PHOTO_MAX_BYTES) {
    showToast('Please upload a JPG, PNG, or WEBP image under 2 MB.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.currentCV.personal.photo = reader.result;
    state.currentCV.personal.photoOriginal = reader.result;
    state.currentCV.personal.photoSettings = { background: 'white', zoom: 1, positionX: 0, positionY: 0, rotation: 0, brightness: 0, contrast: 0, saturation: 0 };
    state.currentCV.personal.showPhoto = true;
    renderSectionForm();
    renderCVPreview();
    renderReadinessPanel();
    scheduleAutosave();
    trackEvent('photo_upload');
  };
  reader.onerror = () => showToast('Could not read that image. Please try another file.', 'error');
  reader.readAsDataURL(file);
}

/* ---------------------------------------------------------
   15c. CV READINESS
   --------------------------------------------------------- */

function calculateReadiness(cv) {
  const p = cv.personal;
  const hasAny = (key) => (cv.entries[key] || []).length > 0;
  const sectionOn = (key) => cv.sectionEnabled[key];

  const checklist = [
    { label: 'Contact information', level: 'required', met: Boolean(p.fullName && p.email), weight: 3, show: true },
    { label: 'Professional summary', level: 'recommended', met: Boolean(cv.summary && cv.summary.trim()), weight: 2, show: sectionOn('summary') },
    { label: 'Education', level: 'recommended', met: hasAny('education'), weight: 2, show: sectionOn('education') },
    { label: 'Skills', level: 'recommended', met: cv.skills.technical.length > 0 || cv.skills.soft.length > 0, weight: 2, show: sectionOn('skills') },
    { label: 'Work experience', level: 'recommended', met: hasAny('experience') || hasAny('internship'), weight: 2, show: sectionOn('experience') || sectionOn('internship') },
    { label: 'Projects', level: 'optional', met: hasAny('projects'), weight: 1, show: sectionOn('projects') },
    { label: 'Certifications', level: 'optional', met: hasAny('certifications'), weight: 1, show: sectionOn('certifications') },
  ].filter((item) => item.show);

  const totalWeight = checklist.reduce((sum, i) => sum + i.weight, 0) || 1;
  const metWeight = checklist.reduce((sum, i) => sum + (i.met ? i.weight : 0), 0);
  const percent = Math.round((metWeight / totalWeight) * 100);
  return { percent, checklist };
}

function renderReadinessPanel() {
  const panel = document.getElementById('readiness-panel');
  if (!panel || !state.currentCV) return;
  const { percent, checklist } = calculateReadiness(state.currentCV);
  const expanded = panel.dataset.expanded === 'true';

  const barColor = percent >= 80 ? 'bg-emerald-500' : percent >= 45 ? 'bg-amber-500' : 'bg-red-500';

  panel.innerHTML = `
    <div class="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12141C] px-4 py-3">
      <button id="readiness-toggle" class="w-full flex items-center gap-3">
        <span class="text-xs font-semibold text-[#64748B] shrink-0">CV Readiness</span>
        <span class="flex-1 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
          <span class="block h-full ${barColor} transition-all" style="width:${percent}%"></span>
        </span>
        <span class="text-xs font-mono font-semibold shrink-0">${percent}%</span>
        <span class="text-[#64748B] text-xs shrink-0">${expanded ? '▾' : '▸'}</span>
      </button>
      ${expanded ? `
        <ul class="mt-3 space-y-1.5">
          ${checklist.map((item) => `
            <li class="flex items-center gap-2 text-xs">
              <span class="${item.met ? 'text-emerald-500' : item.level === 'required' ? 'text-red-500' : 'text-amber-500'}">${item.met ? '✓' : item.level === 'required' ? '⚠' : '○'}</span>
              <span class="${item.met ? 'text-[#475569] dark:text-[#94A3B8]' : ''}">${item.met ? item.label : 'Add ' + item.label.toLowerCase()}</span>
            </li>
          `).join('')}
        </ul>
      ` : ''}
    </div>
  `;

  document.getElementById('readiness-toggle').addEventListener('click', () => {
    panel.dataset.expanded = expanded ? 'false' : 'true';
    renderReadinessPanel();
  });
}

/* ---------------------------------------------------------
   16. AUTOSAVE
   --------------------------------------------------------- */

function scheduleAutosave() {
  setAutosaveStatus('saving');
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    state.currentCV.updatedAt = Date.now();
    updateCV(state.currentCV);
    setAutosaveStatus('saved');
  }, 600);
}

function setAutosaveStatus(status) {
  const targets = [document.getElementById('autosave-status'), document.getElementById('editor-autosave-status')];
  targets.forEach((el) => {
    if (!el) return;
    if (status === 'saving') el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Saving…`;
    else el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Saved`;
  });
}

/* ---------------------------------------------------------
   17. THEME
   --------------------------------------------------------- */

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.getElementById('icon-sun').classList.toggle('hidden', theme !== 'dark');
  document.getElementById('icon-moon').classList.toggle('hidden', theme === 'dark');
  saveTheme(theme);
}

function initTheme() {
  const saved = loadTheme();
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}

/* ---------------------------------------------------------
   18. GLOBAL EVENT BINDING
   --------------------------------------------------------- */

/* ---------------------------------------------------------
   18b. ANALYTICS (anonymous, best-effort — never blocks the UI)
   --------------------------------------------------------- */

function getVisitorId() {
  try {
    let id = localStorage.getItem('neoncv_visitor_id');
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      localStorage.setItem('neoncv_visitor_id', id);
    }
    return id;
  } catch (err) {
    return 'anonymous';
  }
}

// Fire-and-forget. If /api/analytics isn't deployed (e.g. opening
// index.html directly from disk, or a static-only host), this simply
// fails silently and never affects the rest of the app.
function trackEvent(event, meta) {
  try {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, meta: meta || {}, visitorId: getVisitorId() }),
      keepalive: true,
    }).catch(() => {});
  } catch (err) {
    // no-op — analytics must never break the app
  }
}

/* ---------------------------------------------------------
   18c. DOWNLOAD PDF (real file, generated client-side — no print
   dialog, no screenshot. Uses jsPDF's text/line drawing API so the
   output stays real, selectable text rather than a rasterized image.)
   --------------------------------------------------------- */

function sanitizeFilename(str) {
  return String(str || '')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

const PDF_TEMPLATE_STYLES = {
  modern: { font: 'helvetica', heading: [124, 58, 237], name: [15, 23, 42], align: 'left', headingStyle: 'rule' },
  classic: { font: 'times', heading: [17, 24, 39], name: [17, 24, 39], align: 'center', headingStyle: 'rule' },
  academic: { font: 'helvetica', heading: [11, 18, 32], name: [11, 18, 32], align: 'left', headingStyle: 'fill' },
  'myanmar-local': { font: 'helvetica', heading: [11, 18, 32], name: [11, 18, 32], align: 'left', headingStyle: 'rule' },
};

// Loaded lazily and only for the Myanmar Local template, so English-only
// CVs never pay the cost of fetching this font. Falls back to jsPDF's
// built-in Helvetica (Latin-only) if the fetch fails for any reason —
// Myanmar-script field values just won't render correctly in that case,
// but PDF generation itself never breaks.
const MYANMAR_PDF_FONT_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-myanmar@latest/myanmar-400-normal.ttf';
let myanmarPdfFontPromise = null;
function loadMyanmarPdfFontBase64() {
  if (!myanmarPdfFontPromise) {
    myanmarPdfFontPromise = (async () => {
      const res = await fetch(MYANMAR_PDF_FONT_URL);
      if (!res.ok) throw new Error('Myanmar PDF font fetch failed: ' + res.status);
      const bytes = new Uint8Array(await res.arrayBuffer());
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    })();
  }
  return myanmarPdfFontPromise;
}

/**
 * Rows shown in the Myanmar Local template's numbered personal-information
 * block — shared between the live HTML preview and the PDF generator so
 * they can never drift out of sync. Only fields the person actually filled
 * in (and, for NRC/DOB/Gender, chose to show) are included.
 */
function getMyanmarLocalRows(cv) {
  const p = cv.personal;
  return [
    ['Name', p.fullName],
    ["Father's Name", p.fatherName],
    ['NRC No.', p.showNrc ? p.nrc : ''],
    ['Date of Birth', p.showDateOfBirth && p.dateOfBirth ? formatDate(p.dateOfBirth) : ''],
    ['Gender', p.showGender ? p.gender : ''],
    ['Nationality', p.nationality],
    ['Race', p.race],
    ['Religion', p.religion],
    ['Marital Status', p.maritalStatus],
    ['Blood Group', p.bloodGroup],
    ['Height', p.height],
    ['Weight', p.weight],
    ['Phone', p.phone],
    ['Email', p.email],
    ['Address', p.location],
  ].filter(([, value]) => value);
}

const PDF_PAGE = { w: 210, h: 297, marginX: 18, marginTop: 18, marginBottom: 18 };

/**
 * Normalizes any uploaded photo (JPEG/PNG/WEBP) to a PNG data URL via
 * an offscreen canvas, since jsPDF's addImage doesn't support WEBP.
 */
function normalizePhotoForPdf(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl) { resolve(null); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Masks a (square-ish) image into the CV's chosen photo shape by
 * center-cropping to a square and clipping with destination-in
 * compositing, so the PDF photo visually matches the circle/rounded
 * shape shown in the live preview instead of always being a plain
 * rectangle. 'square' needs no masking.
 */
function maskImageToShape(dataUrl, shape) {
  return new Promise((resolve) => {
    if (!dataUrl || shape === 'square') { resolve(dataUrl); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const size = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - size) / 2;
        const sy = (img.naturalHeight - size) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.beginPath();
        if (shape === 'circle') {
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        } else {
          const r = size * 0.14;
          ctx.moveTo(r, 0);
          ctx.lineTo(size - r, 0);
          ctx.quadraticCurveTo(size, 0, size, r);
          ctx.lineTo(size, size - r);
          ctx.quadraticCurveTo(size, size, size - r, size);
          ctx.lineTo(r, size);
          ctx.quadraticCurveTo(0, size, 0, size - r);
          ctx.lineTo(0, r);
          ctx.quadraticCurveTo(0, 0, r, 0);
        }
        ctx.closePath();
        ctx.fill();
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        resolve(dataUrl); // fall back to the unmasked photo rather than losing it entirely
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function generateCvPdf(cv) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const style = Object.assign({}, PDF_TEMPLATE_STYLES[cv.template] || PDF_TEMPLATE_STYLES.modern);

  if (cv.template === 'myanmar-local') {
    try {
      const base64Font = await loadMyanmarPdfFontBase64();
      doc.addFileToVFS('NotoSansMyanmar-Regular.ttf', base64Font);
      doc.addFont('NotoSansMyanmar-Regular.ttf', 'NotoSansMyanmar', 'normal');
      doc.addFont('NotoSansMyanmar-Regular.ttf', 'NotoSansMyanmar', 'bold'); // reuses the regular weight file — avoids a second fetch just for bold
      style.font = 'NotoSansMyanmar';
    } catch (err) {
      console.warn('NeonCV: Myanmar PDF font failed to load, falling back to the default font', err);
    }
  }
  const { w: pageW, h: pageH, marginX, marginTop, marginBottom } = PDF_PAGE;
  const contentW = pageW - marginX * 2;
  const centered = style.align === 'center';
  const textX = centered ? pageW / 2 : marginX;
  const textAlign = centered ? 'center' : 'left';
  let y = marginTop;

  const ensureSpace = (needed) => {
    if (y + needed > pageH - marginBottom) { doc.addPage(); y = marginTop; }
  };
  const setFont = (weight, size, color) => {
    doc.setFont(style.font, weight);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const paragraph = (text, size, weight, color, lineHeight) => {
    setFont(weight, size, color);
    doc.splitTextToSize(text, contentW).forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, textX, y, { align: textAlign });
      y += lineHeight;
    });
  };
  const heading = (label) => {
    ensureSpace(10);
    if (style.headingStyle === 'fill') {
      doc.setFillColor(241, 245, 249);
      doc.rect(marginX, y - 4.5, contentW, 7, 'F');
      setFont('bold', 10.5, style.heading);
      doc.text(label.toUpperCase(), marginX + 2, y);
    } else {
      setFont('bold', 10.5, style.heading);
      doc.text(label.toUpperCase(), textX, y, { align: textAlign });
      doc.setDrawColor(style.heading[0], style.heading[1], style.heading[2]);
      doc.setLineWidth(0.4);
      doc.line(marginX, y + 2, pageW - marginX, y + 2);
    }
    y += 8;
  };

  const p = cv.personal;

  if (cv.template === 'myanmar-local') {
    const org = cv.orgHeader;
    if (org.organizationName) {
      setFont('bold', 13, style.name);
      doc.text(org.organizationName.toUpperCase(), pageW / 2, y, { align: 'center' });
      y += 6;
    }
    if (org.department) {
      setFont('normal', 10, [51, 65, 85]);
      doc.text(org.department, pageW / 2, y, { align: 'center' });
      y += 5.5;
    }
    const formTitle = org.formTitle || 'Personal Record Form';
    setFont('bold', 12, style.name);
    doc.text(formTitle, pageW / 2, y, { align: 'center' });
    const titleW = doc.getTextWidth(formTitle);
    doc.setDrawColor(11, 18, 32);
    doc.setLineWidth(0.3);
    doc.line(pageW / 2 - titleW / 2, y + 1.2, pageW / 2 + titleW / 2, y + 1.2);
    y += 10;

    // Photo box, top-right — square, matching the local document convention
    // (not clipped to the CV's circle/rounded shape, which is a preview-only
    // choice for the international templates).
    let localPhotoUrl = null;
    if (p.showPhoto && p.photo) {
      try { localPhotoUrl = await normalizePhotoForPdf(p.photo); } catch (err) { localPhotoUrl = null; }
    }
    const boxW = 28, boxH = 34;
    const boxX = pageW - marginX - boxW, boxY = y;
    doc.setDrawColor(11, 18, 32);
    doc.setLineWidth(0.3);
    doc.rect(boxX, boxY, boxW, boxH);
    if (localPhotoUrl) {
      try {
        doc.addImage(localPhotoUrl, 'PNG', boxX, boxY, boxW, boxH);
        doc.setDrawColor(11, 18, 32);
        doc.rect(boxX, boxY, boxW, boxH); // redraw the border on top of the image
      } catch (err) { /* box stays empty */ }
    }

    const rows = getMyanmarLocalRows(cv);
    const numberColW = 8, labelColW = 42;
    rows.forEach((rowData, i) => {
      ensureSpace(6);
      setFont('normal', 9, [100, 116, 139]);
      doc.text(String(i + 1) + '.', marginX, y);
      setFont('normal', 9.5, [51, 65, 85]);
      doc.text(rowData[0], marginX + numberColW, y);
      setFont('bold', 9.5, [15, 23, 42]);
      const valueLines = doc.splitTextToSize(rowData[1], contentW - boxW - 8 - numberColW - labelColW);
      doc.text(valueLines, marginX + numberColW + labelColW, y);
      y += 5.6 * valueLines.length;
    });
    y = Math.max(y, boxY + boxH + 4);

    if (p.jobTitle) {
      ensureSpace(7);
      setFont('bold', 9.5, [15, 23, 42]);
      doc.text('Applied Position: ' + p.jobTitle, marginX, y);
      y += 6;
    }
    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageW - marginX, y);
    y += 8;
  } else {
    // Photo (drawn to the left of the name for left-aligned templates,
    // centered above the name for the centered Classic template).
    let photoDataUrl = null;
    if (p.showPhoto && p.photo) {
      try {
        const normalized = await normalizePhotoForPdf(p.photo);
        photoDataUrl = await maskImageToShape(normalized, p.photoShape || 'circle');
      } catch (err) { photoDataUrl = null; }
    }
    const photoSize = 24;
    let nameStartX = textX;
    if (photoDataUrl && !centered) {
      try {
        doc.addImage(photoDataUrl, 'PNG', marginX, y, photoSize, photoSize);
        nameStartX = marginX + photoSize + 8;
      } catch (err) { /* skip photo, continue with text */ }
    } else if (photoDataUrl && centered) {
      try {
        doc.addImage(photoDataUrl, 'PNG', (pageW - photoSize) / 2, y, photoSize, photoSize);
        y += photoSize + 6;
      } catch (err) { /* skip photo */ }
    }

    const headerTextAlign = (photoDataUrl && !centered) ? 'left' : textAlign;
    const headerX = (photoDataUrl && !centered) ? nameStartX : textX;
    const headerTopY = y;

    setFont('bold', 19, style.name);
    doc.text(p.fullName || 'Your Name', headerX, y, { align: headerTextAlign }); y += 7;
    if (p.jobTitle) { setFont('normal', 11, style.heading); doc.text(p.jobTitle, headerX, y, { align: headerTextAlign }); y += 6; }
    const contactBits = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean).join('   ·   ');
    if (contactBits) {
      setFont('normal', 9, [100, 116, 139]);
      doc.splitTextToSize(contactBits, contentW - (headerX - marginX)).forEach((line) => {
        doc.text(line, headerX, y, { align: headerTextAlign }); y += 5;
      });
    }
    const extraBits = [];
    if (p.showNrc && p.nrc) extraBits.push('NRC: ' + p.nrc);
    if (p.showDateOfBirth && p.dateOfBirth) extraBits.push('DOB: ' + formatDate(p.dateOfBirth));
    if (p.showGender && p.gender) extraBits.push(p.gender);
    if (extraBits.length) {
      setFont('normal', 9, [100, 116, 139]);
      doc.text(extraBits.join('   ·   '), headerX, y, { align: headerTextAlign }); y += 5;
    }

    if (photoDataUrl && !centered) y = Math.max(y, headerTopY + photoSize);

    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageW - marginX, y);
    y += 8;
  }

  const enabledOrdered = cv.sectionOrder.filter((key) => cv.sectionEnabled[key] && key !== 'personal');

  enabledOrdered.forEach((key) => {
    if (key === 'summary') {
      if (!cv.summary.trim()) return;
      heading(cv.template === 'myanmar-local' ? 'Objective / Remarks' : 'Summary');
      paragraph(cv.summary, 10, 'normal', [51, 65, 85], 5);
      y += 4;
      return;
    }
    if (key === 'skills') {
      if (!cv.skills.technical.length && !cv.skills.soft.length) return;
      heading('Skills');
      if (cv.skills.technical.length) paragraph('Core Skills: ' + cv.skills.technical.join(', '), 10, 'normal', [51, 65, 85], 5);
      if (cv.skills.soft.length) paragraph('Soft Skills: ' + cv.skills.soft.join(', '), 10, 'normal', [51, 65, 85], 5);
      y += 4;
      return;
    }
    if (LIST_SCHEMA[key]) {
      const items = cv.entries[key];
      if (!items || !items.length) return;
      const schema = LIST_SCHEMA[key];
      heading(SECTION_LABELS[key]);
      items.forEach((entry) => {
        ensureSpace(10);
        const title = schema.title(entry);
        const subtitle = schema.subtitle(entry) || '';
        const meta = schema.meta(entry) || '';
        const extra = schema.extra ? (schema.extra(entry) || '') : '';
        setFont('bold', 10.5, [15, 23, 42]);
        doc.text(subtitle ? `${title} — ${subtitle}` : title, marginX, y);
        if (meta) { setFont('normal', 9, [100, 116, 139]); doc.text(meta, pageW - marginX, y, { align: 'right' }); }
        y += 5.5;
        if (extra) paragraph(extra, 9, 'normal', [71, 85, 105], 4.6);
        const links = [entry.url, entry.credentialUrl, entry.githubUrl, entry.liveUrl].filter(Boolean).join('   ·   ');
        if (links) paragraph(links, 8.5, 'normal', [124, 58, 237], 4.5);
        if (entry.description) paragraph(entry.description, 9.5, 'normal', [51, 65, 85], 4.8);
        y += 3;
      });
      y += 2;
    }
  });

  return doc;
}

async function downloadCvAsPdf() {
  const btn = document.getElementById('btn-print');
  if (btn.disabled) return; // guard against double-click while a download is already in progress
  const cv = state.currentCV;

  if (!cv.personal.fullName.trim() || !cv.personal.email.trim()) {
    showToast("Please add your name and email before downloading.", 'error');
    state.activeSectionKey = 'personal';
    renderSectionNav();
    renderSectionForm();
    return;
  }

  btn.disabled = true;
  btn.classList.add('opacity-60', 'pointer-events-none');
  showToast('Preparing your CV…');

  try {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('PDF library failed to load');
    const doc = await generateCvPdf(cv);
    const name = sanitizeFilename(cv.personal.fullName);
    const filename = (name ? `${name}_CV` : 'NeonCV') + '.pdf';
    doc.save(filename); // triggers a real, immediate file download — no dialog
    showToast('PDF downloaded', 'success');
    trackEvent('pdf_download', { template: cv.template, purpose: cv.purpose, device: window.innerWidth < 768 ? 'mobile' : 'desktop' });
  } catch (err) {
    console.error('NeonCV: PDF generation failed', err);
    showToast("We couldn't generate your PDF. Please check your CV information and try again.", 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-60', 'pointer-events-none');
  }
}

/* ---------------------------------------------------------
   18d. FEEDBACK FORM
   --------------------------------------------------------- */

function bindFeedbackForm() {
  const form = document.getElementById('feedback-form');
  if (!form) return;
  const statusEl = document.getElementById('feedback-status');
  const submitBtn = document.getElementById('feedback-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('feedback-message').value.trim();
    if (!message) {
      statusEl.textContent = 'Please enter a message before sending.';
      statusEl.className = 'text-sm text-red-500';
      statusEl.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-60', 'pointer-events-none');
    statusEl.classList.add('hidden');

    const payload = {
      name: document.getElementById('feedback-name').value.trim(),
      email: document.getElementById('feedback-email').value.trim(),
      type: document.getElementById('feedback-type').value,
      message,
      website: document.getElementById('feedback-honeypot').value, // honeypot
      visitorId: getVisitorId(),
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        statusEl.textContent = '✓ Thank you! Your feedback has been sent successfully.';
        statusEl.className = 'text-sm text-emerald-600 dark:text-emerald-400';
        statusEl.classList.remove('hidden');
        form.reset();
        trackEvent('feedback_submitted', { type: payload.type });
      } else {
        statusEl.textContent = "We couldn't send your feedback right now. Please try again later.";
        statusEl.className = 'text-sm text-red-500';
        statusEl.classList.remove('hidden');
      }
    } catch (err) {
      statusEl.textContent = "We couldn't send your feedback right now. Please try again later.";
      statusEl.className = 'text-sm text-red-500';
      statusEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-60', 'pointer-events-none');
    }
  });
}

/* ---------------------------------------------------------
   18f. PHOTO STUDIO — AI background removal + local editing
        + free, client-side AI photo analysis (face-api.js)

   Editing pipeline: personal.photoOriginal is the untouched upload.
   Opening the studio always starts from that (plus the last-saved
   photoSettings), so repeated edits never compound quality loss.
   "Apply" flattens the canvas (background + filters + AI cutout if
   used) into a single PNG stored in personal.photo — the same field
   the rest of the app (live preview, jsPDF) already reads, so no
   other rendering code needs to know the studio exists.

   Two separate AI features, both browser-side, no API key, no cost:
   - "Remove Background" uses @imgly/background-removal (WebAssembly,
     loaded lazily from a CDN) — runs entirely on-device.
   - "Analyze Photo" uses face-api.js (also loaded lazily from a CDN)
     to detect the face and suggest positioning/quality improvements.
     It never sends the photo anywhere.
   --------------------------------------------------------- */

const PHOTO_STUDIO_CANVAS_SIZE = 320;
const PHOTO_STUDIO_BACKGROUNDS = [
  { key: 'white', label: 'White', color: '#FFFFFF' },
  { key: 'lightgray', label: 'Light Gray', color: '#E5E7EB' },
  { key: 'softblue', label: 'Soft Blue', color: '#0096FF' },
  { key: 'transparent', label: 'Transparent', color: null },
];
const PHOTO_STUDIO_DEFAULT_SETTINGS = { background: 'white', zoom: 1, positionX: 0, positionY: 0, rotation: 0, brightness: 0, contrast: 0, saturation: 0 };
const PHOTO_STUDIO_HISTORY_LIMIT = 30;

function openPhotoStudio() {
  const p = state.currentCV.personal;
  // Older CVs saved before Photo Studio existed have `photo` but no
  // `photoOriginal` — fall back to `photo` itself as the edit source
  // so "Edit Photo" still works instead of silently doing nothing.
  const source = p.photoOriginal || p.photo;
  if (!source) return;
  if (!p.photoOriginal) p.photoOriginal = p.photo; // capture a stable baseline for legacy CVs so future edits don't compound

  const initialSettings = Object.assign({}, PHOTO_STUDIO_DEFAULT_SETTINGS, p.photoSettings || {});
  state.photoStudio = {
    sourceImage: source,
    bgRemovedImage: null,
    bgRemovedObjectUrl: null,
    aiRunning: false,
    loadedImg: null,
    settings: initialSettings,
    history: { stack: [{ settings: Object.assign({}, initialSettings), bgRemovedImage: null }], index: 0 },
  };
  document.getElementById('photo-studio-ai-status').textContent = '';
  document.getElementById('photo-studio-quality-panel').classList.add('hidden');
  renderPhotoStudioControls();
  updatePhotoStudioHistoryButtons();
  loadPhotoStudioImage(source);
  checkPhotoStudioResolution(source);
  preloadBackgroundRemoval();
  const modal = document.getElementById('photo-studio-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePhotoStudio() {
  const modal = document.getElementById('photo-studio-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  if (state.photoStudio && state.photoStudio.bgRemovedObjectUrl) {
    URL.revokeObjectURL(state.photoStudio.bgRemovedObjectUrl);
  }
  state.photoStudio = null;
}

function checkPhotoStudioResolution(dataUrl) {
  const img = new Image();
  img.onload = () => {
    const warn = document.getElementById('photo-studio-quality-warning');
    if (img.naturalWidth < 400 || img.naturalHeight < 400) {
      warn.textContent = 'Your image may look soft when printed. For better CV quality, upload a larger photo if possible.';
      warn.classList.remove('hidden');
    } else {
      warn.classList.add('hidden');
    }
  };
  img.src = dataUrl;
}

function loadPhotoStudioImage(src) {
  const img = new Image();
  img.onload = () => {
    if (!state.photoStudio) return;
    state.photoStudio.loadedImg = img;
    redrawPhotoStudioCanvas();
  };
  img.src = src;
}

function renderPhotoStudioControls() {
  const s = state.photoStudio.settings;

  const bgEl = document.getElementById('photo-studio-bg-options');
  bgEl.innerHTML = PHOTO_STUDIO_BACKGROUNDS.map((bg) => `
    <button data-bg="${bg.key}" class="px-3 py-2 rounded-lg border text-xs font-medium transition ${s.background === bg.key ? 'border-violet ring-1 ring-violet text-violet-bright' : 'border-black/10 dark:border-white/10'}">${bg.label}</button>
  `).join('');
  bgEl.querySelectorAll('[data-bg]').forEach((btn) => btn.addEventListener('click', () => {
    if (btn.dataset.bg === 'transparent' && !state.photoStudio.bgRemovedImage) {
      showToast("Run \"Remove Background\" first to use a transparent background.");
      return;
    }
    state.photoStudio.settings.background = btn.dataset.bg;
    renderPhotoStudioControls();
    redrawPhotoStudioCanvas();
    pushPhotoStudioHistory();
  }));

  const shapeEl = document.getElementById('photo-studio-shape-options');
  shapeEl.innerHTML = ['circle', 'rounded', 'square'].map((shape) => `
    <button data-pshape="${shape}" aria-label="${shape} shape" class="w-9 h-9 flex items-center justify-center border text-[11px] font-semibold transition ${state.currentCV.personal.photoShape === shape ? 'border-violet text-violet-bright' : 'border-black/10 dark:border-white/10 text-[#94A3B8]'} ${shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-md' : 'rounded-none'}">${shape[0].toUpperCase()}</button>
  `).join('');
  shapeEl.querySelectorAll('[data-pshape]').forEach((btn) => btn.addEventListener('click', () => {
    state.currentCV.personal.photoShape = btn.dataset.pshape;
    renderPhotoStudioControls();
  }));

  document.getElementById('photo-studio-rotation').value = s.rotation;
  document.getElementById('photo-studio-zoom').value = s.zoom;
  document.getElementById('photo-studio-brightness').value = s.brightness;
  document.getElementById('photo-studio-contrast').value = s.contrast;
  document.getElementById('photo-studio-saturation').value = s.saturation;
}

function redrawPhotoStudioCanvas() {
  const st = state.photoStudio;
  if (!st || !st.loadedImg) return;
  const canvas = document.getElementById('photo-studio-canvas');
  const ctx = canvas.getContext('2d');
  const size = PHOTO_STUDIO_CANVAS_SIZE;
  const s = st.settings;
  const bgConf = PHOTO_STUDIO_BACKGROUNDS.find((b) => b.key === s.background) || PHOTO_STUDIO_BACKGROUNDS[0];

  ctx.clearRect(0, 0, size, size);
  if (bgConf.color) {
    ctx.fillStyle = bgConf.color;
    ctx.fillRect(0, 0, size, size);
  } else {
    // Transparent — draw a light checkerboard so it's clear there's no background, not a bug.
    const tile = 10;
    for (let y = 0; y < size; y += tile) {
      for (let x = 0; x < size; x += tile) {
        ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? '#F1F5F9' : '#E2E8F0';
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }

  ctx.save();
  ctx.filter = `brightness(${100 + s.brightness}%) contrast(${100 + s.contrast}%) saturate(${100 + s.saturation}%)`;
  ctx.translate(size / 2 + s.positionX, size / 2 + s.positionY);
  ctx.rotate((s.rotation * Math.PI) / 180);
  const img = st.loadedImg;
  const cover = Math.max(size / img.naturalWidth, size / img.naturalHeight);
  const drawW = img.naturalWidth * cover * s.zoom;
  const drawH = img.naturalHeight * cover * s.zoom;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function rotatePhotoStudio(delta) {
  if (!state.photoStudio) return;
  const s = state.photoStudio.settings;
  let deg = (s.rotation + delta) % 360;
  if (deg > 180) deg -= 360;
  if (deg < -180) deg += 360;
  s.rotation = deg;
  document.getElementById('photo-studio-rotation').value = deg;
  redrawPhotoStudioCanvas();
  pushPhotoStudioHistory();
}

function resetPhotoStudio() {
  if (!state.photoStudio) return;
  state.photoStudio.settings = Object.assign({}, PHOTO_STUDIO_DEFAULT_SETTINGS);
  if (state.photoStudio.bgRemovedObjectUrl) URL.revokeObjectURL(state.photoStudio.bgRemovedObjectUrl);
  state.photoStudio.bgRemovedImage = null;
  state.photoStudio.bgRemovedObjectUrl = null;
  document.getElementById('photo-studio-ai-status').textContent = '';
  document.getElementById('photo-studio-quality-panel').classList.add('hidden');
  loadPhotoStudioImage(state.photoStudio.sourceImage);
  renderPhotoStudioControls();
  state.photoStudio.history = { stack: [{ settings: Object.assign({}, PHOTO_STUDIO_DEFAULT_SETTINGS), bgRemovedImage: null }], index: 0 };
  updatePhotoStudioHistoryButtons();
}

/* ---------- Undo / Redo — lightweight in-memory history, never persisted ---------- */

function pushPhotoStudioHistory() {
  const st = state.photoStudio;
  if (!st) return;
  const snapshot = { settings: Object.assign({}, st.settings), bgRemovedImage: st.bgRemovedImage };
  st.history.stack = st.history.stack.slice(0, st.history.index + 1);
  st.history.stack.push(snapshot);
  if (st.history.stack.length > PHOTO_STUDIO_HISTORY_LIMIT) st.history.stack.shift();
  st.history.index = st.history.stack.length - 1;
  updatePhotoStudioHistoryButtons();
}

function applyPhotoStudioHistorySnapshot(snapshot) {
  const st = state.photoStudio;
  st.settings = Object.assign({}, snapshot.settings);
  st.bgRemovedImage = snapshot.bgRemovedImage;
  loadPhotoStudioImage(st.bgRemovedImage || st.sourceImage);
  renderPhotoStudioControls();
}

function photoStudioUndo() {
  const st = state.photoStudio;
  if (!st || st.history.index <= 0) return;
  st.history.index -= 1;
  applyPhotoStudioHistorySnapshot(st.history.stack[st.history.index]);
  updatePhotoStudioHistoryButtons();
}

function photoStudioRedo() {
  const st = state.photoStudio;
  if (!st || st.history.index >= st.history.stack.length - 1) return;
  st.history.index += 1;
  applyPhotoStudioHistorySnapshot(st.history.stack[st.history.index]);
  updatePhotoStudioHistoryButtons();
}

function updatePhotoStudioHistoryButtons() {
  const st = state.photoStudio;
  const undoBtn = document.getElementById('photo-studio-undo');
  const redoBtn = document.getElementById('photo-studio-redo');
  const canUndo = !!st && st.history.index > 0;
  const canRedo = !!st && st.history.index < st.history.stack.length - 1;
  undoBtn.disabled = !canUndo;
  redoBtn.disabled = !canRedo;
  undoBtn.classList.toggle('opacity-40', !canUndo);
  redoBtn.classList.toggle('opacity-40', !canRedo);
}

/* ---------- Remove Background (AI, browser-side — @imgly/background-removal) ----------
   Runs entirely on-device via WebAssembly; the photo is never uploaded anywhere for
   this step. First run downloads model/WASM data from IMG.LY's CDN (cached by the
   browser afterward), so the very first removal on a fresh browser can take
   noticeably longer than the ~10s target for supported modern devices — later
   removals in the same session, and on repeat visits once the browser cache is
   warm, are faster.

   License note: @imgly/background-removal is distributed under a non-permissive
   license (check its LICENSE.md — historically AGPL/GPL-family, not MIT). It's
   used here as-is for this free/portfolio project; a commercial SaaS built on
   NeonCV should review IMG.LY's licensing terms before relying on it in
   production. See README.md "CV Photo Studio" for the full note. */

const BG_REMOVAL_CDN_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';
const BG_REMOVAL_MAX_DIMENSION = 2048; // downscale the AI working copy; the original upload is never touched
const BG_REMOVAL_SOFT_TIMEOUT_MS = 10000;

let bgRemovalLibraryPromise = null;
let bgRemovalModuleReady = false; // true once the library+model has loaded successfully at least once this session

function loadBackgroundRemovalLibrary() {
  if (!bgRemovalLibraryPromise) {
    bgRemovalLibraryPromise = import(BG_REMOVAL_CDN_URL).then((mod) => mod.default || mod.removeBackground || mod);
  }
  return bgRemovalLibraryPromise;
}

/**
 * Called when the Photo Studio opens so the (fairly large) model download can
 * start before the person even clicks "Remove Background" — the goal is that
 * AI processing can start immediately once they do. Fire-and-forget; any
 * failure here is silent, since clicking the button will retry and surface
 * the real error at that point.
 */
function preloadBackgroundRemoval() {
  if (bgRemovalModuleReady) return;
  loadBackgroundRemovalLibrary().then(() => { bgRemovalModuleReady = true; }).catch(() => {});
}

/**
 * Draws the source image onto a canvas capped at BG_REMOVAL_MAX_DIMENSION on
 * its longest side, so a huge phone-camera photo isn't processed at full
 * resolution. Returns a Blob (image/png).
 */
function prepareAiWorkingCopy(img) {
  return new Promise((resolve) => {
    const scale = Math.min(1, BG_REMOVAL_MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function resetPhotoStudioAiUi() {
  const statusEl = document.getElementById('photo-studio-ai-status');
  const actionsEl = document.getElementById('photo-studio-ai-actions');
  const progressWrap = document.getElementById('photo-studio-ai-progress-wrap');
  statusEl.textContent = '';
  actionsEl.classList.add('hidden');
  actionsEl.innerHTML = '';
  progressWrap.classList.add('hidden');
  document.getElementById('photo-studio-ai-progress-bar').style.width = '0%';
}

async function handlePhotoStudioRemoveBg() {
  const st = state.photoStudio;
  if (!st || st.aiRunning) return; // only one AI job at a time
  st.aiRunning = true;

  const statusEl = document.getElementById('photo-studio-ai-status');
  const actionsEl = document.getElementById('photo-studio-ai-actions');
  const progressWrap = document.getElementById('photo-studio-ai-progress-wrap');
  const progressBar = document.getElementById('photo-studio-ai-progress-bar');
  const btn = document.getElementById('photo-studio-remove-bg');

  resetPhotoStudioAiUi();
  btn.disabled = true;
  btn.classList.add('opacity-60', 'pointer-events-none');

  const setStatus = (text, tone) => {
    statusEl.textContent = text;
    statusEl.className = 'mt-2 text-xs text-center min-h-[1em] ' + (tone === 'error' ? 'text-red-500' : tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#64748B]');
  };

  trackEvent('photo_ai_process');
  const device = window.innerWidth < 768 ? 'mobile' : 'desktop';
  const overallStart = performance.now();

  setStatus(bgRemovalModuleReady
    ? 'Removing background… your photo is being processed on this device.'
    : 'Preparing AI Photo Tools… first-time setup may take a little longer.');
  if (!bgRemovalModuleReady) progressWrap.classList.remove('hidden');

  const softTimeout = setTimeout(() => {
    setStatus('Still processing… this device may need a little more time.');
  }, BG_REMOVAL_SOFT_TIMEOUT_MS);

  try {
    const removeBackground = await loadBackgroundRemovalLibrary();
    const modelReadyAt = performance.now();
    bgRemovalModuleReady = true;
    if (state.photoStudio !== st) return; // studio was closed while the model was loading

    setStatus('Removing background… your photo is being processed on this device.');
    const sourceImg = st.loadedImg;
    const workingCopy = await prepareAiWorkingCopy(sourceImg);

    const resultBlob = await removeBackground(workingCopy, {
      model: 'small',
      progress: (key, current, total) => {
        if (!total) return;
        progressWrap.classList.remove('hidden');
        progressBar.style.width = Math.round((current / total) * 100) + '%';
      },
    });

    clearTimeout(softTimeout);
    if (state.photoStudio !== st) return; // studio was closed mid-run

    if (st.bgRemovedObjectUrl) URL.revokeObjectURL(st.bgRemovedObjectUrl); // release any previous result first
    const objectUrl = URL.createObjectURL(resultBlob);
    st.bgRemovedObjectUrl = objectUrl;
    st.bgRemovedImage = objectUrl;
    loadPhotoStudioImage(objectUrl);

    const totalMs = Math.round(performance.now() - overallStart);
    const processingMs = Math.round(performance.now() - modelReadyAt);
    setStatus('✓ Background removed — your photo is ready to edit.', 'success');
    progressWrap.classList.add('hidden');
    trackEvent('photo_ai_success', { durationMs: totalMs, processingMs, device });
    pushPhotoStudioHistory();
  } catch (err) {
    clearTimeout(softTimeout);
    console.error('NeonCV Photo Studio: background removal failed', err);
    setStatus("Couldn't remove the background automatically. You can still use the photo editor normally.", 'error');
    progressWrap.classList.add('hidden');
    actionsEl.classList.remove('hidden');
    actionsEl.innerHTML = `
      <button id="photo-studio-ai-retry" class="text-xs font-semibold text-violet-bright underline">Try Again</button>
      <button id="photo-studio-ai-continue" class="text-xs font-semibold text-[#64748B] underline">Continue Without AI</button>
    `;
    document.getElementById('photo-studio-ai-retry').addEventListener('click', handlePhotoStudioRemoveBg);
    document.getElementById('photo-studio-ai-continue').addEventListener('click', resetPhotoStudioAiUi);
    trackEvent('photo_ai_failure', { device });
  } finally {
    st.aiRunning = false;
    btn.disabled = false;
    btn.classList.remove('opacity-60', 'pointer-events-none');
  }
}

/* ---------- Analyze Photo (AI, free — runs entirely in the browser) ----------
   Uses face-api.js (tiny_face_detector) loaded lazily from a CDN. No API key,
   no server round-trip, no cost — the photo never leaves the browser for this
   step. Only runs when the person explicitly clicks "Analyze Photo", never
   automatically. Purely a recommendation layer: the person stays in full
   manual control of crop/zoom/position regardless of what this suggests. */

const PHOTO_ANALYSIS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
const PHOTO_ANALYSIS_MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights';
let photoAnalysisLoadPromise = null;

function loadPhotoAnalysisLibrary() {
  if (photoAnalysisLoadPromise) return photoAnalysisLoadPromise;
  photoAnalysisLoadPromise = (async () => {
    if (!window.faceapi) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = PHOTO_ANALYSIS_SCRIPT_URL;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Could not load the photo analysis library.'));
        document.head.appendChild(script);
      });
    }
    await window.faceapi.nets.tinyFaceDetector.loadFromUri(PHOTO_ANALYSIS_MODEL_URL);
  })();
  return photoAnalysisLoadPromise;
}

async function handlePhotoStudioAnalyze() {
  const st = state.photoStudio;
  if (!st) return;
  const panel = document.getElementById('photo-studio-quality-panel');
  const btn = document.getElementById('photo-studio-analyze');

  panel.classList.remove('hidden');
  panel.innerHTML = `<p class="text-xs text-[#64748B]">Analyzing photo…</p>`;
  btn.disabled = true;
  btn.classList.add('opacity-60', 'pointer-events-none');

  try {
    await loadPhotoAnalysisLibrary();
    const canvas = document.getElementById('photo-studio-canvas');
    const detection = await window.faceapi.detectSingleFace(canvas, new window.faceapi.TinyFaceDetectorOptions());
    renderPhotoQualityResults(detection);
  } catch (err) {
    panel.innerHTML = `<p class="text-xs text-[#64748B]">Couldn't analyze this photo right now — you can still crop and position it manually.</p>`;
  } finally {
    btn.disabled = false;
    btn.classList.remove('opacity-60', 'pointer-events-none');
  }
}

function renderPhotoQualityResults(detection) {
  const panel = document.getElementById('photo-studio-quality-panel');
  const size = PHOTO_STUDIO_CANVAS_SIZE;
  const img = state.photoStudio.loadedImg;
  const items = [];

  const lowRes = img && (img.naturalWidth < 400 || img.naturalHeight < 400);
  items.push({ ok: !lowRes, label: lowRes ? 'Image resolution is a bit low' : 'Resolution looks good' });

  if (!detection) {
    items.push({ ok: false, label: 'Face is not clearly detected' });
    panel.innerHTML = renderPhotoQualityList(items) +
      `<p class="text-xs text-amber-600 dark:text-amber-400 mt-2">Try centering your face, using better lighting, or a less busy background.</p>`;
    return;
  }

  const box = detection.box;
  items.push({ ok: true, label: 'Face is clearly visible' });

  const faceRatio = box.width / size;
  const sizeIssue = faceRatio < 0.18 ? 'zoom in a little (subject looks small)' : faceRatio > 0.65 ? 'zoom out a little (subject looks very close)' : null;
  items.push({ ok: !sizeIssue, label: sizeIssue ? 'Subject size could improve' : 'Subject size looks good' });

  const headroom = box.top;
  const centerX = box.x + box.width / 2;
  const recommendations = [];
  if (sizeIssue) recommendations.push(sizeIssue);
  if (headroom < size * 0.05) recommendations.push('move the subject down slightly');
  else if (headroom > size * 0.28) recommendations.push('move the subject up slightly');
  if (centerX < size * 0.35) recommendations.push('move the subject right slightly');
  else if (centerX > size * 0.65) recommendations.push('move the subject left slightly');

  const positioningOk = recommendations.length === (sizeIssue ? 1 : 0);
  items.push({ ok: positioningOk, label: positioningOk ? 'Positioning looks good' : 'Positioning could improve' });

  let html = renderPhotoQualityList(items);
  if (recommendations.length) {
    html += `<p class="text-xs text-amber-600 dark:text-amber-400 mt-2">Suggestion: ${escapeHtml(recommendations.join(', '))}. This is just a recommendation — drag and zoom to adjust however you like.</p>`;
  }
  panel.innerHTML = html;
}

function renderPhotoQualityList(items) {
  return `
    <p class="text-xs font-semibold text-[#64748B] mb-1.5">Photo Quality</p>
    <ul class="space-y-1">
      ${items.map((i) => `
        <li class="flex items-center gap-2 text-xs">
          <span class="${i.ok ? 'text-emerald-500' : 'text-amber-500'}">${i.ok ? '✓' : '⚠'}</span>
          <span class="${i.ok ? 'text-[#475569] dark:text-[#94A3B8]' : ''}">${escapeHtml(i.label)}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

/* ---------- Apply / drag / bindings ---------- */

function applyPhotoStudio() {
  const st = state.photoStudio;
  if (!st) return;
  const canvas = document.getElementById('photo-studio-canvas');
  state.currentCV.personal.photo = canvas.toDataURL('image/png');
  state.currentCV.personal.photoSettings = Object.assign({}, st.settings);
  closePhotoStudio();
  renderSectionForm();
  renderCVPreview();
  renderReadinessPanel();
  scheduleAutosave();
  showToast('Photo applied', 'success');
  trackEvent('photo_applied');
}

function bindPhotoStudioDrag() {
  const canvas = document.getElementById('photo-studio-canvas');
  let dragging = false;
  let startX = 0, startY = 0, startPosX = 0, startPosY = 0;
  const scaleFactor = () => PHOTO_STUDIO_CANVAS_SIZE / canvas.clientWidth; // canvas is CSS-scaled down from its intrinsic size

  const start = (x, y) => {
    if (!state.photoStudio) return;
    dragging = true;
    startX = x; startY = y;
    startPosX = state.photoStudio.settings.positionX;
    startPosY = state.photoStudio.settings.positionY;
  };
  const move = (x, y) => {
    if (!dragging || !state.photoStudio) return;
    const f = scaleFactor();
    state.photoStudio.settings.positionX = startPosX + (x - startX) * f;
    state.photoStudio.settings.positionY = startPosY + (y - startY) * f;
    redrawPhotoStudioCanvas();
  };
  const end = () => {
    if (dragging) pushPhotoStudioHistory();
    dragging = false;
  };

  canvas.addEventListener('mousedown', (e) => start(e.clientX, e.clientY));
  window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
  window.addEventListener('mouseup', end);

  canvas.addEventListener('touchstart', (e) => { const t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: true });
  canvas.addEventListener('touchmove', (e) => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
  canvas.addEventListener('touchend', end);
}

function bindPhotoStudioControls() {
  document.getElementById('photo-studio-close').addEventListener('click', closePhotoStudio);
  document.getElementById('photo-studio-cancel').addEventListener('click', closePhotoStudio);
  document.getElementById('photo-studio-apply').addEventListener('click', applyPhotoStudio);
  document.getElementById('photo-studio-reset').addEventListener('click', resetPhotoStudio);
  document.getElementById('photo-studio-remove-bg').addEventListener('click', handlePhotoStudioRemoveBg);
  document.getElementById('photo-studio-analyze').addEventListener('click', handlePhotoStudioAnalyze);
  document.getElementById('photo-studio-undo').addEventListener('click', photoStudioUndo);
  document.getElementById('photo-studio-redo').addEventListener('click', photoStudioRedo);
  document.getElementById('photo-studio-rotate-left').addEventListener('click', () => rotatePhotoStudio(-90));
  document.getElementById('photo-studio-rotate-right').addEventListener('click', () => rotatePhotoStudio(90));

  ['rotation', 'zoom', 'brightness', 'contrast', 'saturation'].forEach((key) => {
    const input = document.getElementById('photo-studio-' + key);
    // 'input' fires continuously while dragging — live redraw only, no history spam.
    input.addEventListener('input', (e) => {
      if (!state.photoStudio) return;
      state.photoStudio.settings[key] = Number(e.target.value);
      redrawPhotoStudioCanvas();
    });
    // 'change' fires once the person releases the slider — that's the point to snapshot for undo.
    input.addEventListener('change', () => pushPhotoStudioHistory());
  });

  bindPhotoStudioDrag();
}

/* ---------------------------------------------------------
   18e. ADMIN ANALYTICS (opt-in via ?admin=1)
   --------------------------------------------------------- */

function maybeShowAdminView() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') !== '1') return false;
  showView('admin');

  const secretInput = document.getElementById('admin-secret-input');
  const unlockBtn = document.getElementById('admin-unlock-btn');
  const errorEl = document.getElementById('admin-error');
  const lockedEl = document.getElementById('admin-locked');
  const dataEl = document.getElementById('admin-data');

  const unlock = async () => {
    errorEl.classList.add('hidden');
    const secret = secretInput.value.trim();
    if (!secret) return;
    try {
      const res = await fetch('/api/analytics?secret=' + encodeURIComponent(secret));
      const data = await res.json();
      if (!res.ok || !data.ok) {
        errorEl.classList.remove('hidden');
        return;
      }
      renderAdminData(data);
      lockedEl.classList.add('hidden');
      dataEl.classList.remove('hidden');
    } catch (err) {
      errorEl.classList.remove('hidden');
    }
  };

  unlockBtn.addEventListener('click', unlock);
  secretInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') unlock(); });
  return true;
}

function renderAdminData(data) {
  const dataEl = document.getElementById('admin-data');
  const card = (label, counts) => `
    <div class="p-5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12141C]">
      <p class="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">${label}</p>
      <p class="font-display font-semibold text-3xl mb-3">${counts.total.toLocaleString()}</p>
      <div class="flex gap-4 text-xs text-[#64748B]">
        <span>Today: <strong class="text-[#0F172A] dark:text-white">${counts.today.toLocaleString()}</strong></span>
        <span>This month: <strong class="text-[#0F172A] dark:text-white">${counts.thisMonth.toLocaleString()}</strong></span>
      </div>
    </div>
  `;
  const photoAi = data.photoAi || { avgDurationMs: null, sampleCount: 0 };
  const aiCard = `
    <div class="p-5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12141C]">
      <p class="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">On-device AI: Avg. Remove Background Time</p>
      <p class="font-display font-semibold text-3xl mb-3">${photoAi.avgDurationMs !== null ? (photoAi.avgDurationMs / 1000).toFixed(1) + 's' : '—'}</p>
      <div class="flex gap-4 text-xs text-[#64748B]">
        <span>Target: <strong class="text-[#0F172A] dark:text-white">≤10s</strong></span>
        <span>Based on: <strong class="text-[#0F172A] dark:text-white">${photoAi.sampleCount.toLocaleString()} run${photoAi.sampleCount === 1 ? '' : 's'}</strong></span>
      </div>
    </div>
  `;
  dataEl.innerHTML =
    card('Visitors (unique)', data.visitors) +
    card('CVs Created', data.cvCreated) +
    card('PDF Downloads', data.pdfDownloads) +
    card('Feedback Submitted', data.feedback) +
    aiCard;
}

function bindGlobalEvents() {
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => showView(btn.dataset.nav));
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });

  document.getElementById('cv-title-input').addEventListener('input', (e) => {
    state.currentCV.title = e.target.value || 'Untitled CV';
    scheduleAutosave();
  });

  document.getElementById('btn-save-cv').addEventListener('click', () => {
    if (!validateBeforeSave()) return;
    state.currentCV.updatedAt = Date.now();
    updateCV(state.currentCV);
    setAutosaveStatus('saved');
    showToast('CV saved', 'success');
  });

  document.getElementById('btn-print').addEventListener('click', downloadCvAsPdf);

  document.getElementById('btn-start-scratch').addEventListener('click', () => createNewCV(false));
  document.getElementById('btn-start-sample').addEventListener('click', () => createNewCV(true));

  const deleteAllBtn = document.getElementById('btn-delete-all');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      openConfirm('Delete all CV data?', 'Every CV saved in this browser will be permanently deleted. This cannot be undone.', () => {
        getAllCVs().forEach((cv) => deleteCV(cv.id));
        showToast('All CV data deleted', 'success');
        renderSavedList();
      });
    });
  }

  document.querySelectorAll('.mobile-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setMobileTab(btn.dataset.mobileTab));
  });

  document.getElementById('confirm-modal-cancel').addEventListener('click', closeConfirm);
  document.getElementById('confirm-modal-confirm').addEventListener('click', () => {
    if (state.confirmAction) state.confirmAction();
    closeConfirm();
  });

  bindFeedbackForm();
  bindPhotoStudioControls();
}

/* ---------------------------------------------------------
   19. INIT
   --------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindGlobalEvents();
  renderLandingChips();
  const isAdmin = maybeShowAdminView();
  if (!isAdmin) showView('landing');
  trackEvent('page_view', { path: window.location.pathname });
});

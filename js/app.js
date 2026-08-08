/* ============================================================
   app.js — NeonCV
   Main application logic: state, rendering, dynamic sections,
   validation, autosave, templates, theme, multi-CV management.
   Built by Nyan Linnhtet · Neon.dev
   ============================================================ */

/* ---------------------------------------------------------
   1. CONSTANTS & SCHEMA
   --------------------------------------------------------- */

const PURPOSES = [
  { key: 'job', label: 'Job Application', icon: '⌁', desc: 'Create a professional CV focused on experience, skills and achievements.' },
  { key: 'internship', label: 'Internship', icon: '◧', desc: 'Highlight education, projects and potential for employers hiring interns.' },
  { key: 'scholarship', label: 'Scholarship', icon: '◐', desc: 'Emphasize academic achievement, awards and community involvement.' },
  { key: 'university', label: 'University Application', icon: '▣', desc: 'Showcase education, research and extracurricular achievements.' },
  { key: 'freelance', label: 'Freelancing / Consulting', icon: '◈', desc: 'Present your services, skills and selected client-ready projects.' },
  { key: 'research', label: 'Research / Academic', icon: '▤', desc: 'Detail research experience, publications and conference activity.' },
  { key: 'general', label: 'General CV', icon: '⎙', desc: 'A balanced, all-purpose professional CV for any situation.' },
];

const RECOMMENDED_SECTIONS = {
  job: ['personal', 'summary', 'experience', 'skills', 'projects', 'education', 'certifications', 'languages', 'awards'],
  internship: ['personal', 'summary', 'education', 'projects', 'skills', 'certifications', 'awards', 'volunteer', 'languages'],
  scholarship: ['personal', 'summary', 'education', 'awards', 'projects', 'volunteer', 'certifications', 'languages', 'references'],
  university: ['personal', 'summary', 'education', 'research', 'publications', 'projects', 'awards', 'conferences', 'skills', 'references'],
  freelance: ['personal', 'summary', 'skills', 'experience', 'projects', 'certifications', 'references'],
  research: ['personal', 'summary', 'education', 'research', 'publications', 'conferences', 'projects', 'awards', 'skills', 'references'],
  general: ['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
};

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
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start Date', type: 'month' },
      { name: 'endDate', label: 'End Date', type: 'month' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    title: (e) => e.degree || 'New degree',
    subtitle: (e) => e.institution,
    meta: (e) => dateRange(e.startDate, e.endDate),
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
      { name: 'credentialUrl', label: 'Credential URL', type: 'url' },
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
   2. STATE
   --------------------------------------------------------- */

let state = {
  currentCV: null,
  activePurposeFilter: null,
  activeSectionKey: 'personal',
  saveTimer: null,
  pendingDeleteId: null,
  confirmAction: null,
};

function blankCV(purposeKey) {
  const now = Date.now();
  const recommended = RECOMMENDED_SECTIONS[purposeKey] || RECOMMENDED_SECTIONS.general;
  const enabled = {};
  ALL_SECTIONS.forEach((key) => { enabled[key] = recommended.includes(key); });

  const entries = {};
  LIST_SECTION_KEYS.forEach((key) => { entries[key] = []; });

  return {
    id: 'cv_' + now + '_' + Math.random().toString(36).slice(2, 8),
    title: purposeLabel(purposeKey) + ' CV',
    purpose: purposeKey,
    template: 'modern',
    createdAt: now,
    updatedAt: now,
    personal: {
      fullName: '', jobTitle: '', email: '', phone: '', location: '',
      website: '', linkedin: '', github: '', photo: '',
    },
    summary: '',
    skills: { technical: [], soft: [] },
    sectionOrder: recommended.concat(ALL_SECTIONS.filter((s) => !recommended.includes(s))),
    sectionEnabled: enabled,
    entries,
  };
}

function purposeLabel(key) {
  const p = PURPOSES.find((p) => p.key === key);
  return p ? p.label : 'General';
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
  if (name === 'saved') renderSavedList();
  document.getElementById('app-footer').classList.toggle('hidden', name === 'editor');
}

/* ---------------------------------------------------------
   7. LANDING: purpose chips + hero typer
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
   8. PURPOSE SELECTION VIEW
   --------------------------------------------------------- */

function renderPurposeGrid() {
  const el = document.getElementById('purpose-grid');
  el.innerHTML = PURPOSES.map((p) => `
    <button data-purpose="${p.key}" class="purpose-card text-left p-5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12141C] hover:border-violet hover:shadow-[0_0_0_1px_rgba(124,58,237,0.4)] transition">
      <div class="w-10 h-10 rounded-lg bg-violet/10 flex items-center justify-center text-lg text-violet-bright mb-4">${p.icon}</div>
      <h3 class="font-semibold mb-1.5">${p.label}</h3>
      <p class="text-sm text-[#64748B] leading-relaxed">${p.desc}</p>
    </button>
  `).join('');
  el.querySelectorAll('[data-purpose]').forEach((btn) => {
    btn.addEventListener('click', () => createNewCV(btn.dataset.purpose));
  });
}

function createNewCV(purposeKey) {
  state.currentCV = blankCV(purposeKey);
  state.activeSectionKey = 'personal';
  saveCV(state.currentCV);
  enterEditor();
}

/* ---------------------------------------------------------
   9. SAVED CVs VIEW
   --------------------------------------------------------- */

function renderSavedList() {
  const cvs = getAllCVs().sort((a, b) => b.updatedAt - a.updatedAt);
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
    state.currentCV = loadCV(btn.dataset.open);
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
  document.getElementById('editor-purpose-label').textContent = purposeLabel(state.currentCV.purpose);
  setMobileTab('edit');
  showView('editor');
  renderSectionNav();
  renderSectionForm();
  renderCVPreview();
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

function renderTemplatePickerIfPersonal(key) {
  if (key !== 'personal') return '';
  const templates = [
    { key: 'modern', label: 'Modern' },
    { key: 'classic', label: 'Classic' },
    { key: 'academic', label: 'Academic' },
  ];
  return `
    <div class="mt-8 pt-6 border-t border-black/5 dark:border-white/10">
      <p class="text-sm font-semibold mb-3">Template</p>
      <div class="grid grid-cols-3 gap-2">
        ${templates.map((t) => `
          <button data-template="${t.key}" class="template-btn px-3 py-2.5 rounded-lg border text-sm font-medium transition ${state.currentCV.template === t.key ? 'border-violet bg-violet/10 text-violet-bright' : 'border-black/10 dark:border-white/10 hover:border-violet'}">
            ${t.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPersonalForm() {
  const p = state.currentCV.personal;
  const field = (name, label, type = 'text', placeholder = '') => `
    <div>
      <label class="block text-xs font-semibold text-[#64748B] mb-1.5">${label}</label>
      <input data-personal="${name}" type="${type}" value="${escapeHtml(p[name])}" placeholder="${placeholder}"
        class="w-full px-3 py-2.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm focus:outline-none focus:border-violet transition">
      <p data-error-for="${name}" class="text-xs text-red-500 mt-1 hidden"></p>
    </div>
  `;
  return `
    <div class="space-y-4">
      ${field('fullName', 'Full Name *')}
      ${field('jobTitle', 'Professional Title')}
      ${field('email', 'Email *', 'email')}
      ${field('phone', 'Phone')}
      ${field('location', 'Location')}
      ${field('website', 'Website', 'text', 'yourname.com')}
      ${field('linkedin', 'LinkedIn', 'text', 'linkedin.com/in/you')}
      ${field('github', 'Portfolio', 'text', 'yourportfolio.com')}
    </div>
  `;
}

function renderSummaryForm() {
  const cv = state.currentCV;
  return `
    <label class="block text-xs font-semibold text-[#64748B] mb-1.5">Professional Summary</label>
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

function renderListSectionForm(key) {
  const schema = LIST_SCHEMA[key];
  const items = state.currentCV.entries[key];

  if (items.length === 0) {
    return `
      <div class="text-center py-12 border border-dashed border-black/15 dark:border-white/15 rounded-xl">
        <p class="text-sm text-[#64748B] mb-4">No ${SECTION_LABELS[key].toLowerCase()} added yet.</p>
        <button data-add-entry="${key}" class="px-4 py-2 rounded-lg bg-violet hover:bg-violet-bright text-white text-sm font-semibold transition">+ Add ${SECTION_LABELS[key]}</button>
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

  return cards + `<button data-add-entry="${key}" class="mt-1 w-full px-4 py-2.5 rounded-lg border border-dashed border-black/15 dark:border-white/15 hover:border-violet text-sm font-semibold text-violet-bright transition">+ Add another</button>`;
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
      scheduleAutosave();
    });
  });

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
  const contactBits = [p.email, p.phone, p.location, p.website, p.linkedin, p.github].filter(Boolean);

  let html = `
    <header class="cv-header">
      <h1 class="cv-name">${escapeHtml(p.fullName) || 'Your Name'}</h1>
      ${p.jobTitle ? `<p class="cv-title">${escapeHtml(p.jobTitle)}</p>` : ''}
      ${contactBits.length ? `<p class="cv-contact">${contactBits.map(escapeHtml).join(' &nbsp;·&nbsp; ')}</p>` : ''}
    </header>
  `;

  const enabledOrdered = cv.sectionOrder.filter((key) => cv.sectionEnabled[key] && key !== 'personal');

  enabledOrdered.forEach((key) => {
    if (key === 'summary') {
      if (cv.summary.trim()) html += `<section class="cv-section"><h2 class="cv-heading">Summary</h2><p class="cv-text">${nl2br(cv.summary)}</p></section>`;
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
        const hasDesc = 'description' in entry;
        html += `
          <div class="cv-entry">
            <div class="cv-entry-row">
              <span class="cv-entry-title">${title}${subtitle ? ` — <span class="cv-entry-subtitle">${subtitle}</span>` : ''}</span>
              ${meta ? `<span class="cv-entry-meta">${meta}</span>` : ''}
            </div>
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

  document.getElementById('btn-print').addEventListener('click', () => window.print());

  document.querySelectorAll('.mobile-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setMobileTab(btn.dataset.mobileTab));
  });

  document.getElementById('confirm-modal-cancel').addEventListener('click', closeConfirm);
  document.getElementById('confirm-modal-confirm').addEventListener('click', () => {
    if (state.confirmAction) state.confirmAction();
    closeConfirm();
  });
}

/* ---------------------------------------------------------
   19. INIT
   --------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindGlobalEvents();
  renderLandingChips();
  showView('landing');
});

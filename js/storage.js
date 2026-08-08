/* ============================================================
   storage.js
   NeonCV — all LocalStorage read/write logic lives here only.
   No UI logic. No DOM manipulation.
   ============================================================ */

const STORAGE_KEYS = {
  CVS: 'neoncv_cvs',
  THEME: 'neoncv_theme',
};

/**
 * Return every saved CV as an array. Empty array if none exist yet.
 */
function getAllCVs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CVS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('NeonCV storage: failed to read CVs', err);
    return [];
  }
}

/**
 * Persist the full list of CVs (internal helper).
 */
function _writeAllCVs(cvs) {
  try {
    localStorage.setItem(STORAGE_KEYS.CVS, JSON.stringify(cvs));
    return true;
  } catch (err) {
    console.error('NeonCV storage: failed to write CVs', err);
    return false;
  }
}

/**
 * Save a brand-new CV object. Returns the saved CV (with id).
 */
function saveCV(cv) {
  const cvs = getAllCVs();
  cvs.push(cv);
  _writeAllCVs(cvs);
  return cv;
}

/**
 * Load a single CV by id. Returns null if not found.
 */
function loadCV(id) {
  return getAllCVs().find((cv) => cv.id === id) || null;
}

/**
 * Update an existing CV (matched by id). Creates it if missing.
 */
function updateCV(cv) {
  const cvs = getAllCVs();
  const index = cvs.findIndex((item) => item.id === cv.id);
  if (index === -1) {
    cvs.push(cv);
  } else {
    cvs[index] = cv;
  }
  _writeAllCVs(cvs);
  return cv;
}

/**
 * Delete a CV by id.
 */
function deleteCV(id) {
  const cvs = getAllCVs().filter((cv) => cv.id !== id);
  _writeAllCVs(cvs);
}

/**
 * Persist the user's theme choice ('light' | 'dark').
 */
function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.error('NeonCV storage: failed to save theme', err);
  }
}

/**
 * Read the saved theme choice, if any.
 */
function loadTheme() {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME);
  } catch (err) {
    return null;
  }
}

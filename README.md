# NeonCV

A universal, client-side CV builder built by **Nyan Linn Htet** under the **Neon.dev** brand.

Create tailored, professional CVs for job applications, internships, scholarships, university applications, freelancing, and research — entirely in your browser. Nothing is ever uploaded anywhere.

---

## Features

- **Purpose-aware sections** — pick why you're building a CV and NeonCV recommends the right sections; you can still add or remove any section manually.
- **Live preview** — every change in the editor updates the CV instantly, with no page reload.
- **15+ content sections** — personal info, summary, experience, internships, education, skills, projects, certifications, awards, languages, volunteer work, research, publications, conferences, and references, each fully add/edit/delete-able.
- **Three templates** — Modern, Classic, and Academic. Switch anytime without losing data.
- **Multiple CVs from one profile** — create, duplicate, rename, and delete as many CV versions as you need.
- **Autosave** — changes are saved to your browser automatically, with a clear "Saving… / Saved" indicator.
- **Inline validation** — friendly, non-intrusive error messages instead of browser alert boxes.
- **Print-ready export** — a clean, A4-proportioned "Print / Save as PDF" flow using your browser's native print dialog.
- **Dark mode** — light and dark themes, remembered across visits.
- **Fully responsive** — usable on desktop, tablet, and mobile, with a dedicated Edit/Preview toggle on small screens.
- **100% client-side & private** — no accounts, no backend, no database, no tracking. Everything lives in `localStorage` on your device.

## Supported CV Types

- Job Application
- Internship
- Scholarship
- University Application
- Freelancing / Consulting
- Research / Academic
- General CV

## Tech Stack

- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript (no frameworks, no build step)
- Browser `localStorage` for persistence

No React, no Vue, no TypeScript, no backend, no database.

## Screenshots

_Add screenshots of the landing page, purpose selector, editor, and a printed CV here._

## How to Run

NeonCV is a static site — no build step, no dependencies to install.

1. Clone or download this repository.
2. Open `index.html` directly in your browser, **or** serve the folder locally:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
3. Visit the local URL shown in your terminal (if you used a server), or just double-click `index.html`.

## Project Structure

```text
NeonCV/
│
├── index.html          # Full application UI (all views live in one file)
│
├── css/
│   └── style.css        # Custom CSS: CV paper layout, templates, print styles
│
├── js/
│   ├── app.js            # Application logic, rendering, state, validation
│   └── storage.js        # LocalStorage persistence only
│
├── assets/
│   └── images/
│
└── README.md
```

## Author

**Nyan Linn Htet**

**Neon.dev**

© 2026 Neon.dev

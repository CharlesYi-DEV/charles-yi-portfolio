const $ = (selector, root = document) => root.querySelector(selector);
const desktop = $('#desktop');
const windows = $('#windows');
let highestZ = 10;
let activeId = 'welcome';
let wallpaper = 0;
const openers = new Map();
const screenStage = $('#screen-stage');
const screenOS = $('#screen-os');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let motionEnabled = !motionPreference.matches;
let pendingLaunch = null;
let bootTimer = null;
let bootFocus = null;
let inspectedApp = 'welcome';
const storageKey = 'charles-desktop-v1';
let preferences = { wallpaper: 0, motion: true, largeText: false, saved: [] };
let storageAvailable = true;
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (stored && typeof stored === 'object') preferences = {
    wallpaper: [0, 1, 2].includes(stored.wallpaper) ? stored.wallpaper : 0,
    motion: stored.motion !== false,
    largeText: stored.largeText === true,
    saved: Array.isArray(stored.saved) ? stored.saved.filter(id => ['evaluation', 'reroute', 'sound', 'future'].includes(id)) : []
  };
} catch { storageAvailable = false; }
wallpaper = preferences.wallpaper;
motionEnabled = preferences.motion && !motionPreference.matches;
let searchQuery = '';
let searchChannel = 'all';
let sleepFocus = null;
function persistPreferences() {
  try { localStorage.setItem(storageKey, JSON.stringify(preferences)); }
  catch { storageAvailable = false; }
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}


// Original 32 x 32 artwork. Integer pixel geometry and stepped diagonals are
// intentional; do not add antialiased strokes or fractional scaling.
function icon(type, className = '') {
  const drawings = {
    sherlock: `<path fill="#111" d="M7 1h12v2h4v4h2v12h-3v3h-4v2H7v-2H3v-4H1V7h2V3h4zM21 21h4v3h3v3h3v4h-5v-3h-3v-3h-2z"/><path fill="#b8dbe8" d="M7 3h12v2h3v4h1v8h-3v3h-4v2H8v-2H5v-4H3V8h2V5h2z"/><path fill="#fff" d="M7 6h8v2H8v8H6V8h1z"/><path fill="#a77636" d="M23 23h2v3h3v3h-2v-2h-3z"/>`,
    panels: `<path fill="#111" d="M2 4h28v24H2z"/><path fill="#ddd" d="M3 5h26v22H3z"/><path fill="#fff" d="M4 6h24v1H4z"/><path fill="#555" d="M8 9h2v14H8zM15 9h2v14h-2zM22 9h2v14h-2z"/><path fill="#111" d="M6 12h6v5H6zM13 18h6v5h-6zM20 10h6v5h-6z"/><path fill="#9999d5" d="M7 13h4v3H7zM14 19h4v3h-4zM21 11h4v3h-4z"/>`,
    scrapbook: `<path fill="#111" d="M4 2h23v28H4z"/><path fill="#a96d58" d="M5 3h21v26H5z"/><path fill="#efd6b2" d="M8 4h17v24H8z"/><path fill="#555" d="M2 7h5v2H2zM2 15h5v2H2zM2 23h5v2H2z"/><path fill="#fff" d="M11 7h12v9H11z"/><path fill="#669" d="M12 8h10v7H12z"/><path fill="#eee" d="M11 19h10v1H11zM11 22h8v1h-8z"/>`,
    welcome: `<path fill="#000" d="M8 9h17v1h1v1h1v1h1v1h1v1h1v1h1v12H1V16h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1z"/><path fill="#999" d="M8 10h17v1h1v1h1v1h1v1h1v2H3v-1h1v-1h1v-1h1v-1h1v-1h1z"/><path fill="#eee" d="M9 11h15v1h2v2H7v-1h2z"/><path fill="#ddd" d="M2 17h28v9H2z"/><path fill="#fff" d="M2 17h28v1H2z"/><path fill="#777" d="M2 25h28v1H2zM4 20h19v1H4z"/><path fill="#111" d="M24 22h4v2h-4z"/><path fill="#63ff00" d="M25 22h2v1h-2z"/>`,
    research: `<path fill="#111" d="M5 3h7v1h2v1h2v1h2v2h3v1h3v1h3v1h1v18h-4v1h-3v1h-3v-1h-3v-1h-3v-1H9v-1H6v-1H4V4h1z"/><path fill="#9292ed" d="M6 4h6v1h2v1h2v2h2v2h3v1h3v1h2v16h-3v1h-4v1h-1V11h-3V9h-3V7H9V6H6z"/><path fill="#c0c0ff" d="M5 5h1v20h3v1h3v1h3v1h3V12h-3v-2h-3V8H9V7H6z"/><path fill="#5757af" d="M19 12h7v16h-3v1h-4z"/><path fill="#fff" d="M8 12h2v9H8zM12 15h2v8h-2zM16 18h1v6h-1z"/><path fill="#ececff" d="M20 14h4v1h-4zM20 17h4v1h-4zM20 20h4v1h-4z"/>`,
    computer: `<path fill="#000" d="M5 2h20v23H5zM10 25h10v3h6v3H4v-3h6z"/><path fill="#ddd" d="M6 3h18v21H6z"/><path fill="#fff" d="M6 3h18v1H6zM6 4h1v18H6z"/><path fill="#777" d="M8 5h14v13H8z"/><path fill="#060a45" d="M9 6h12v11H9z"/><path fill="#72ff37" d="M10 12h2v-2h2V8h1v6h2v-3h3v1h-2v3h-4v-5h-1v3h-3z"/><path fill="#888" d="M17 21h5v1h-5zM11 25h8v3h-8z"/><path fill="#ccc" d="M5 29h20v1H5z"/><path fill="#e00" d="M8 20h2v1H8z"/><path fill="#000" d="M24 18h5v1h1v9h-1v2h-5v-2h-1v-9h1z"/><path fill="#ffdb00" d="M25 19h3v8h-3z"/><path fill="#fff" d="M25 19h1v7h-1z"/><path fill="#c66e00" d="M25 28h3v1h-3z"/>`,
    resume: `<path fill="#000" d="M6 1h15v1h1v1h1v1h1v1h1v1h1v25H6z"/><path fill="#fff" d="M7 2h13v6h5v22H7z"/><path fill="#bbb" d="M21 3v4h3zM24 8h1v22h-1zM7 29h17v1H7z"/><path fill="#000" d="M10 11h11v1H10zM10 14h11v1H10zM10 17h11v1H10zM10 20h11v1H10zM10 23h8v1h-8z"/><path fill="#4646af" d="M10 5h6v2h-6z"/>`,
    contact: `<path fill="#000" d="M2 7h28v21H2z"/><path fill="#ddd" d="M3 8h26v19H3z"/><path fill="#fff" d="M3 8h26v2h-2v2h-3v2h-3v2h-3v2h-4v-2h-3v-2H8v-2H5v-2H3z"/><path fill="#555" d="M3 10h2v2h3v2h3v2h3v2h4v-2h3v-2h3v-2h3v-2h2v1h-1v2h-3v2h-3v2h-3v2h-6v-2h-3v-2H7v-2H4v-2H3zM3 25h2v-2h3v-2h3v-2h2v1h-1v2H9v2H6v2H3zM20 19h2v2h3v2h3v2h1v1h-3v-2h-3v-2h-3z"/><path fill="#a00" d="M23 4h7v5h-7z"/><path fill="#ff5b00" d="M24 5h5v3h-5z"/>`,
    about: `<path fill="#111" d="M6 2h20v28H6z"/><path fill="#ddd" d="M7 3h18v26H7z"/><path fill="#fff" d="M8 4h16v12H8z"/><path fill="#5555bd" d="M9 5h14v10H9z"/><path fill="#ffe4b4" d="M13 6h6v6h-6z"/><path fill="#000" d="M13 6h6v2h-6z"/><path fill="#e53" d="M11 13h10v2H11z"/><path fill="#000" d="M10 19h12v1H10zM10 22h12v1H10zM10 25h8v1h-8z"/>`
  };
  return `<svg class="pixel-icon ${className}" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges" aria-hidden="true">${type === 'future' ? drawings.research.replaceAll('#9292ed', '#d6b545').replaceAll('#c0c0ff', '#ffe794').replaceAll('#5757af', '#9d7b16').replaceAll('#ececff', '#fff5c2') : drawings[type] || drawings.resume}</svg>`;
}

const contents = {
  welcome: () => `<div class="system-banner">${icon('computer')}<div><h1>Charles Yi</h1><span>Data science · Language · Reliable AI</span></div></div>
    <div class="system-info"><div><b>Study:</b><span>Master of Data Science</span></div><div><b>University:</b><span>Monash University</span></div><div><b>Interests:</b><span>Language, sound & reliable AI</span></div></div>
    <div class="welcome-body"><p class="intro">I’m a data science student and AI evaluator. My work connects natural language processing, information retrieval, and careful model evaluation.</p><div class="button-row"><button class="classic-button primary" data-open="research">My Work</button><button class="classic-button" data-open="about">About Me</button><button class="classic-button" data-open="contact">Contact</button></div></div>
    <div class="launch-banner">${icon('computer')}<div><strong>Currently in development</strong><p>MASCO–ESCO occupation mapping</p></div><button class="classic-button" data-open="future">Open Project</button></div><div class="window-footer"><span>Data science · Reliable AI</span><a href="mailto:charles.yi@msn.com">charles.yi@msn.com</a></div>`,
  note: () => `<div class="note-paper"><span class="note-date">ON MY DESK / OCTOBER 2026</span><h2>Now & next</h2><p>Completing my master’s at Monash, evaluating AI at RWS, and developing a MASCO–ESCO occupation-mapping study.</p><button class="note-link" data-open="future">Open work in progress</button></div>`,
  research: () => `<div class="finder-info"><span>4 items</span><span>Current work & selected projects</span></div><div class="research-list">
    <button class="project-row" data-open="evaluation">${icon('about')}<h2>AI Evaluation</h2><span class="project-meta">RWS · Current</span><span class="project-description">Factual accuracy, relevance, and Mandarin cultural context in AI-generated text.</span></button>
    <button class="project-row" data-open="reroute">${icon('research')}<h2>ReRouteHer</h2><span class="project-meta">Team project · 2026</span><span class="project-description">Occupation and skills data for Malaysian mothers returning to work.</span></button>
    <button class="project-row" data-open="sound">${icon('computer')}<h2>Sound Detection</h2><span class="project-meta">Thesis · 2024</span><span class="project-description">Python audio classification, feature extraction, and a model-training interface.</span></button>
    <button class="project-row" data-open="future">${icon('future')}<h2>MASCO–ESCO</h2><span class="project-meta">In development</span><span class="project-description">Aligning Malaysian and European occupations. Independent evaluation is planned.</span></button></div><div class="window-footer"><span>Click an item to read more.</span></div>`,
  about: () => `<div class="document"><span class="eyebrow">THE HUMAN BEHIND THE DESKTOP</span><h1>Hello, I’m Charles.</h1><p class="lede">I’m a Master of Data Science student at Monash University.</p><p>My interests sit where natural language processing, information retrieval, and model evaluation meet. I like making data traceable and asking what an AI system’s output can actually tell us.</p><p>My path has included co-founding a cosmetics business, working in technical sales, building a sound classification application, and contributing to a career re-entry platform. Those experiences keep my technical questions connected to people.</p><h2>Currently exploring</h2><div class="tag-list"><span>Natural language processing</span><span>Information retrieval</span><span>Reliable AI</span><span>Model evaluation</span></div><div class="document-note">Mandarin & Cantonese · native/bilingual<br>English · professional working proficiency</div><div class="button-row"><button class="classic-button" data-open="resume">View résumé</button><button class="classic-button" data-open="contact">Say hello ↗</button></div></div>`,
  reroute: () => `<div class="document"><span class="eyebrow">RESEARCH NOTES / 01</span><h1>ReRouteHer</h1><p class="lede">Connecting transferable skills with opportunities for Malaysian mothers returning to work.</p><div class="document-note">Monash University · University team project · 2026<br>My role: Data Analyst</div><h2>The question</h2><p>How can a career-support platform connect a person’s experience with occupations and learning resources, while keeping its suggestions traceable?</p><h2>My contribution</h2><ul><li>Prepared data management plans across three iterations, covering source provenance, data quality, privacy, and retention.</li><li>Contributed Python and SQL preparation for MASCO occupations and ESCO skills, with taxonomy mappings, confidence labels, and duplicate checks.</li><li>Contributed to a comparison of TF-IDF with balanced logistic regression and MiniLM centroid retrieval across 19 occupation classes using 562 JobHop examples.</li><li>Curated employer-disclosure evidence for 200+ Bursa-listed companies, retaining citations and review status.</li></ul><h2>What the evidence doesn’t settle</h2><p>Performance and transfer from Belgian/Flemish career histories to Malaysian CVs were limited. Occupation mappings and model suggestions need human review; missing employer evidence is not a negative finding.</p><button class="classic-button primary" data-open="future">Related work: MASCO–ESCO</button></div>`,
  sound: () => `<div class="document"><span class="eyebrow">RESEARCH NOTES / 02</span><h1>Listening for a signal.</h1><p class="lede">A sound detection and analysis application, from microphone input to model evaluation.</p><div class="document-note">Undergraduate thesis · Dongguan University of Technology<br>December 2023–May 2024 · Supervisor: Associate Professor Jun Zhu</div><h2>What I built</h2><p>A Python application using Kivy and KivyMD for microphone recording, audio and video input, sound classification, and model retraining.</p><div class="pipeline"><span>Audio input</span><b>→</b><span>Preprocessing</span><b>→</b><span>Classification</span></div><h2>Methods</h2><p>I integrated two pretrained SVM classifiers from prior research for noise/voice and speech/scream classification, with MFCC features extracted using librosa. I also implemented a six-layer Keras MLP training workflow for scream/non-scream classification.</p><h2>What I learned to question</h2><p>Background noise, false detections, and fixed ten-second inputs all affect the system. Functional testing shows whether the app behaves as intended; it does not establish reliable performance in every environment.</p><div class="tag-list"><span>Python</span><span>librosa</span><span>SVM</span><span>Keras</span><span>Kivy</span></div></div>`,
  evaluation: () => `<div class="document"><span class="eyebrow">EXPERIENCE NOTES / 03</span><h1>Beyond a plausible answer.</h1><p class="lede">An answer can sound right and still miss the point.</p><div class="document-note">RWS · Data Service Specialist · Part-time<br>August 2026–present</div><p>My work includes evaluating AI-generated text for factual accuracy, relevance, and Mandarin cultural appropriateness, alongside data collection, labelling, and annotation for model assessment and localisation.</p><h2>Three questions I bring to evaluation</h2><ol class="questions"><li>Is the answer supported by evidence?</li><li>Does it address what was actually asked?</li><li>Does it make sense in the reader’s cultural context?</li></ol><p>This experience connects to my wider interest in reliable AI systems: understanding the limits of an output, alongside its usefulness.</p></div>`,
  resume: () => `<div class="document"><span class="eyebrow">CURRICULUM VITAE / SELECTED EXPERIENCE</span><h1>Charles Yi</h1><p class="lede">Data science · Language · Reliable AI</p><h2>Education</h2><div class="resume-entry"><strong>Master of Data Science</strong><span>2025–present</span><p>Monash University · Expected December 2026</p></div><div class="resume-entry"><strong>BEng, Computer Science and Technology</strong><span>2019–2024</span><p>Dongguan University of Technology</p></div><h2>Experience</h2><div class="resume-entry"><strong>Data Service Specialist · RWS</strong><span>2026–present</span><p>AI evaluation, annotation, and localisation · Part-time</p></div><div class="resume-entry"><strong>Technical Sales Engineer</strong><span>2024</span><p>Dongguan Songhu Plastic Machinery Co Ltd</p></div><div class="resume-entry"><strong>Co-Founder · CYX Cosmetics Store</strong><span>2021–2026</span><p>Customer acquisition, content, and commercial performance</p></div><h2>Technical superpowers</h2><p><b>Data:</b> Python, SQL, PostgreSQL, pandas, data validation, taxonomy mapping, evidence traceability.</p><p><b>ML:</b> scikit-learn, TF-IDF, logistic regression, sentence embeddings, SVMs, Keras, held-out evaluation.</p><p><b>Audio & systems:</b> librosa, MFCC extraction, Kivy, Docker, cloud deployment.</p><button class="classic-button" data-open="contact">Get in touch ↗</button></div>`,
  contact: () => `<div class="document contact-document">${icon('contact')}<span class="eyebrow">LET’S COMPARE NOTES</span><h1>Say hello.</h1><p class="lede">Have a research question, a project idea, or a different way of looking at a problem?</p><a class="contact-link" href="mailto:charles.yi@msn.com">charles.yi@msn.com ↗</a><div class="button-row"><a class="classic-button" href="https://github.com/CharlesYi-DEV" target="_blank" rel="noopener noreferrer">View my GitHub ↗</a><a class="classic-button" href="https://www.linkedin.com/in/charlesyi-dev/" target="_blank" rel="noopener noreferrer">Find me on LinkedIn ↗</a></div><p class="muted">UTC+8</p></div>`,
  help: () => `<div class="document"><span class="eyebrow">A QUICK ORIENTATION</span><h1>Welcome to my desktop.</h1><ul><li>Click or tap an icon once to open it. Keyboard users can Tab to an icon and press Enter.</li><li>Drag a striped title bar to move a window. The square at the left closes it; the square at the right expands it.</li><li>Use the File menu to reopen windows, or View → Arrange windows to reset their positions.</li><li>On narrow screens, windows stack vertically. Opening an application scrolls to it.</li><li>Right-click the desktop for shortcuts and display settings. Right-click an icon or project for Open and Get Info, or a window for its controls. Shift+F10 opens the same menu from the keyboard; use arrow keys to choose an item and Escape to dismiss it. Selected text and links keep the browser’s normal menu.</li><li>Press Escape to close a menu or the active window.</li></ul><h2>Desktop extras</h2><ul><li>Sherlock searches this portfolio by topic. Use File → Find or Ctrl/Command+Shift+F.</li><li>Keep projects in Scrapbook using the button in a project or its right-click menu. Saved projects and appearance preferences stay in this browser.</li><li>Control Panels changes the wallpaper, reading size, and opening animations.</li><li>The Window menu lists every open window. Double-click a title bar or use its roll-up button to tuck a window away.</li><li>View → Sleep starts a starfield. Click, tap, or press any key to return.</li></ul><h2>About the design</h2><p>A personal tribute to the tactile, curious world of classic Macintosh desktops, inspired by the Platinum interface of <a href="https://en.wikipedia.org/wiki/Mac_OS_9" target="_blank" rel="noopener noreferrer">Mac OS 9</a>. The recessed beige CRT frame also takes inspiration from <a href="https://taoofmac.com/space/reviews/2025/11/24/1900" target="_blank" rel="noopener noreferrer">the Maclock</a>. Original interface artwork; built for the modern web.</p><p>View → Replay startup runs the short boot sequence. View → Opening animations turns the launch effects on or off; your system’s reduced-motion preference is respected. The display uses the available browser space. Expand an individual document with the square at the right of its title bar.</p><p>The My Work folder contains current experience and selected projects. In Progress describes research still under development; planned evaluation is distinguished from completed computational work.</p></div>`,
  future: () => `<div class="document"><span class="eyebrow">IN DEVELOPMENT / RESEARCH PROJECT</span><h1>MASCO–ESCO</h1><p class="lede">Building a reproducible bridge between Malaysian occupations and European occupation and skills classifications.</p><div class="document-note"><b>Status: research in progress</b><br>Computational retrieval completed; independent human evaluation is planned.</div><h2>What I’m developing</h2><p>A pipeline to align individual occupations in MASCO 2020 with ESCO 1.2.1, extending the occupation-mapping questions explored in ReRouteHer. The study compares lexical, dense, hybrid, and reranked retrieval, with attention to occupational scope and Malaysian terminology.</p><h2>Work completed so far</h2><ul><li>Automated retrieval across 6,620 extracted MASCO occupations against 3,039 ESCO occupations.</li><li>Initial Qwen3 reranking for a 330-occupation sample.</li><li>A research proposal for independently evaluating the candidate mappings.</li></ul><h2>What comes next</h2><p>The proposed evaluation covers 150 occupations, plus 10 separate calibration occupations. Two reviewers would assess candidates independently, followed by a separate adjudicator. Reviewer availability and the evaluation protocol still need to be confirmed.</p><p>Planned outputs include a documented evaluation reference set, reproducible comparisons, and analysis of ambiguous, broader, and narrower occupation matches.</p><div class="document-note">This is ongoing research, not a published or fully human-validated national crosswalk. Retrieval completion does not establish mapping accuracy.</div><a class="classic-button" href="https://github.com/CharlesYi-DEV/masco-esco-crosswalk" target="_blank" rel="noopener noreferrer">View project repository</a><p class="muted">Project status based on notes dated 27 October 2026.</p></div>`
};

const config = {
  sherlock: { title: 'Sherlock — Search My Desktop', width: 680, x: .14, y: 35 },
  panels: { title: 'Control Panels — Appearance', width: 520, x: .27, y: 45 },
  scrapbook: { title: 'Scrapbook — Saved Projects', width: 600, x: .20, y: 60 },
  info: { title: 'Get Info', width: 430, x: .28, y: 68 },
  welcome: { title: 'About This Researcher', width: 620, x: .02, y: 18 },
  note: { title: 'Stickies', width: 230, x: .73, y: 255 },
  research: { title: 'My Work', width: 540, x: .50, y: 18 },
  future: { title: 'MASCO–ESCO — In Progress', width: 700, x: .16, y: 64 },
  about: { title: 'About Charles', width: 640, x: .19, y: 95 },
  resume: { title: 'Charles Yi — Résumé', width: 680, x: .2, y: 82 },
  contact: { title: 'Internet mail', width: 540, x: .26, y: 135 },
  help: { title: 'Desktop Help', width: 610, x: .18, y: 90 },
  reroute: { title: 'ReRouteHer — Research notes', width: 700, x: .2, y: 76 },
  sound: { title: 'Sound detection — Research notes', width: 700, x: .18, y: 90 },
  evaluation: { title: 'AI evaluation — Experience notes', width: 650, x: .22, y: 105 }
};


// Context-menu content describes existing portfolio items, not simulated files.
const itemInfo = {
  welcome: { name: 'Charles HD', kind: 'Personal portfolio', status: 'Current', detail: 'Charles Yi’s introduction, education, and research interests.' },
  research: { name: 'My Work', kind: 'Project folder · 4 items', status: 'Current and selected work', detail: 'AI evaluation, ReRouteHer, sound detection, and MASCO–ESCO research.' },
  future: { name: 'MASCO–ESCO', kind: 'Research project', status: 'In development', detail: 'Occupation alignment research. Computational retrieval is complete; independent human evaluation is planned.' },
  resume: { name: 'Charles Yi — Résumé', kind: 'Résumé', status: 'Selected experience', detail: 'Education, work experience, and technical skills.' },
  contact: { name: 'Contact', kind: 'Contact card', status: 'Get in touch', detail: 'Email, GitHub, and LinkedIn links for Charles Yi.' },
  evaluation: { name: 'AI Evaluation', kind: 'Work experience', status: 'RWS · 2026–present', detail: 'AI text evaluation for factual accuracy, relevance, and Mandarin cultural appropriateness.' },
  reroute: { name: 'ReRouteHer', kind: 'University team project', status: '2026', detail: 'Data analysis for a career re-entry platform for Malaysian mothers.' },
  sound: { name: 'Sound Detection', kind: 'Undergraduate thesis', status: '2024', detail: 'A Python application for sound classification, audio input, and model retraining.' }
};
contents.info = () => {
  const item = itemInfo[inspectedApp];
  return `<div class="document item-info"><div class="info-heading">${icon(inspectedApp)}<h1>${item.name}</h1></div><dl><dt>Kind</dt><dd>${item.kind}</dd><dt>Status</dt><dd>${item.status}</dd></dl><p>${item.detail}</p><button class="classic-button primary" data-open="${inspectedApp}">Open Item</button></div>`;
};
function showItemInfo(id, trigger) {
  inspectedApp = id;
  const existing = $('[data-id="info"]', windows);
  if (existing) $('.window-content', existing).innerHTML = contents.info();
  openWindow('info', trigger);
}

Object.assign(itemInfo, {
  sherlock: { name: 'Sherlock', kind: 'Portfolio search', status: 'Local search', detail: 'Search project text, skills, and experience through topic channels.' },
  panels: { name: 'Control Panels', kind: 'Display preferences', status: 'Saved in this browser', detail: 'Choose a desktop colour, reading size, and opening animations.' },
  scrapbook: { name: 'Scrapbook', kind: 'Personal reading list', status: 'Saved in this browser', detail: 'Keep projects to revisit while exploring Charles’s work.' }
});
const projectIds = ['evaluation', 'reroute', 'sound', 'future'];
const channels = [['all', 'Everything'], ['research', 'Research'], ['work', 'Experience'], ['about', 'About Charles']];
const searchable = [
  ['future', 'research'], ['reroute', 'research'], ['sound', 'research'],
  ['evaluation', 'work'], ['resume', 'about'], ['about', 'about'], ['contact', 'about']
].map(([id, channel]) => {
  const source = document.createElement('div');
  source.innerHTML = contents[id]();
  return { id, channel, title: itemInfo[id]?.name || config[id].title,
    description: itemInfo[id]?.detail || 'Charles Yi’s background, interests, and current direction.',
    text: source.textContent };
});
function normalizeSearch(text) {
  return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[–—-]/g, ' ');
}
contents.sherlock = () => `<div class="sherlock-app"><div class="utility-banner">${icon('sherlock')}<div><h1>Sherlock</h1><p>Find a project, skill, or research topic.</p></div></div><form id="sherlock-form" class="search-form"><label for="sherlock-query">Search this portfolio</label><div><input id="sherlock-query" type="search" value="${escapeHTML(searchQuery)}" placeholder="Try Python, MASCO, or evaluation" autocomplete="off" maxlength="120"><button class="classic-button primary" type="submit">Find</button></div></form><fieldset class="search-channels"><legend>Search channel</legend>${channels.map(([id,label]) => `<label><input type="radio" name="search-channel" value="${id}" ${searchChannel === id ? 'checked' : ''}>${label}</label>`).join('')}</fieldset><p id="search-status" class="utility-status" role="status"></p><div id="search-results" class="utility-results"></div><div class="window-footer">Searches only Charles’s portfolio · No external search</div></div>`;
contents.panels = () => `<div class="preferences-app"><div class="utility-banner">${icon('panels')}<div><h1>Appearance</h1><p>Make this desktop comfortable for you.</p></div></div><fieldset class="wallpaper-options"><legend>Desktop colour</legend>${['Classic purple', 'Teal', 'Graphite'].map((name,i) => `<label><span class="wallpaper-swatch swatch-${i}" aria-hidden="true"></span><span><input type="radio" name="wallpaper" value="${i}" ${wallpaper === i ? 'checked' : ''}> ${name}</span></label>`).join('')}</fieldset><div class="preference-options"><label><input type="checkbox" id="preference-reading" ${preferences.largeText ? 'checked' : ''}> Larger reading text</label><p>Increase paragraphs and project descriptions. Keep compact menus.</p><label><input type="checkbox" id="preference-motion" ${motionEnabled ? 'checked' : ''} ${motionPreference.matches ? 'disabled' : ''}> Vintage opening animations</label><p id="motion-explanation">${motionPreference.matches ? 'Your device’s reduced-motion setting is active.' : 'A short thinking pause and stepped window redraw.'}</p></div><div class="preference-preview"><span>Reading preview</span><p>Good questions make better research.</p></div><div class="button-row"><button class="classic-button" data-action="sleep">Preview Sleep</button><button class="classic-button" data-action="reset-preferences">Restore Appearance</button></div><p class="utility-status" id="preferences-status">${storageAvailable ? 'Appearance is remembered in this browser.' : 'Changes apply for this visit; browser storage is unavailable.'}</p></div>`;
contents.scrapbook = () => `<div class="scrapbook-app"><div class="utility-banner">${icon('scrapbook')}<div><h1>Scrapbook</h1><p>A reading list from Charles’s work.</p></div></div><p id="saved-status" class="utility-status" role="status"></p><div id="saved-items"></div><div class="window-footer">${storageAvailable ? 'Saved on this browser only' : 'Available for this visit only'}</div></div>`;

function initializeApplication(id, win) {
  if (projectIds.includes(id)) {
    const bar = document.createElement('div');
    bar.className = 'bookmark-bar';
    bar.innerHTML = `<button class="classic-button" data-save="${id}"></button><button class="text-button" data-open="scrapbook">View Scrapbook</button>`;
    $('.window-content', win).prepend(bar);
    syncSavedControls();
  }
  if (id === 'sherlock') renderSearch();
  if (id === 'scrapbook') renderScrapbook();
  if (id === 'panels') syncPreferencesControls();
}
function renderSearch() {
  const results = $('#search-results');
  if (!results) return;
  const terms = normalizeSearch(searchQuery).trim().split(/\s+/).filter(Boolean);
  const found = searchable.filter(item => (searchChannel === 'all' || item.channel === searchChannel) && terms.every(term => normalizeSearch(item.title + ' ' + item.text).includes(term)));
  $('#search-status').textContent = `${found.length} ${found.length === 1 ? 'item' : 'items'} found${searchQuery.trim() ? ` for “${searchQuery.trim()}”` : ''}`;
  results.innerHTML = found.length ? found.map(item => `<button class="search-result" data-open="${item.id}">${icon(item.id)}<span><strong>${item.title}</strong><small>${item.description}</small></span><span class="result-arrow" aria-hidden="true">›</span></button>`).join('') : '<div class="empty-utility"><h2>No matches here.</h2><p>Try a broader word such as “Python” or choose Everything.</p></div>';
}
function renderScrapbook() {
  const list = $('#saved-items');
  if (!list) return;
  const saved = [...new Set(preferences.saved)].filter(id => projectIds.includes(id));
  $('#saved-status').textContent = `${saved.length} ${saved.length === 1 ? 'project' : 'projects'} kept`;
  list.innerHTML = saved.length ? saved.map(id => `<div class="saved-row"><button class="search-result" data-open="${id}">${icon(id)}<span><strong>${itemInfo[id].name}</strong><small>${itemInfo[id].status}</small></span></button><button class="text-button remove-save" data-save="${id}" aria-label="Remove ${itemInfo[id].name} from Scrapbook">Remove</button></div>`).join('') : '<div class="empty-utility"><h2>A place for your next read.</h2><p>Open a project and choose “Keep in Scrapbook”, or right-click a project in My Work.</p><button class="classic-button" data-open="research">Browse My Work</button></div>';
}
function syncSavedControls() {
  document.querySelectorAll('.bookmark-bar [data-save]').forEach(button => {
    const saved = preferences.saved.includes(button.dataset.save);
    button.textContent = saved ? '✓ Kept in Scrapbook' : 'Keep in Scrapbook';
    button.setAttribute('aria-pressed', String(saved));
  });
}
function toggleSaved(id) {
  if (!projectIds.includes(id)) return;
  const focus = document.activeElement;
  const saved = preferences.saved.includes(id);
  preferences.saved = saved ? preferences.saved.filter(value => value !== id) : [...preferences.saved, id];
  persistPreferences();
  syncSavedControls();
  renderScrapbook();
  if (!focus.isConnected) $('[data-id="scrapbook"] .window-title')?.focus({ preventScroll: true });
  $('#announcement').textContent = `${itemInfo[id].name} ${saved ? 'removed from' : 'kept in'} Scrapbook`;
}
function setWallpaper(value) {
  wallpaper = value;
  preferences.wallpaper = value;
  document.body.dataset.wallpaper = value;
  persistPreferences();
  syncPreferencesControls();
}
function applyPreferences() {
  document.body.dataset.wallpaper = wallpaper;
  document.body.classList.toggle('reading-large', preferences.largeText);
  syncPreferencesControls();
}
function syncPreferencesControls() {
  document.querySelectorAll('input[name="wallpaper"]').forEach(input => input.checked = Number(input.value) === wallpaper);
  const reading = $('#preference-reading');
  if (reading) reading.checked = preferences.largeText;
  const motion = $('#preference-motion');
  if (motion) { motion.checked = motionEnabled; motion.disabled = motionPreference.matches; }
  const explanation = $('#motion-explanation');
  if (explanation) explanation.textContent = motionPreference.matches ? 'Your device’s reduced-motion setting is active.' : 'A short thinking pause and stepped window redraw.';
  const status = $('#preferences-status');
  if (status) status.textContent = storageAvailable ? 'Appearance is remembered in this browser.' : 'Changes apply for this visit; browser storage is unavailable.';
}
function syncWindowMenu() {
  const list = $('#open-window-list');
  if (!list) return;
  list.replaceChildren();
  if (!windows.children.length) { const empty = document.createElement('span'); empty.className = 'menu-empty'; empty.textContent = 'No open windows'; list.append(empty); }
  [...windows.children].forEach(win => {
    const button = document.createElement('button');
    button.dataset.open = win.dataset.id;
    const isActive = win.dataset.id === activeId;
    button.textContent = `${isActive ? '✓ ' : ''}${config[win.dataset.id].title}${win.classList.contains('shaded') ? ' (rolled up)' : ''}`;
    if (isActive) button.setAttribute('aria-current', 'true');
    list.append(button);
  });
}
function syncShadeControl(win) {
  const button = $('.window-shade', win);
  if (!button) return;
  const shaded = win.classList.contains('shaded');
  button.setAttribute('aria-pressed', String(shaded));
  button.setAttribute('aria-label', `${shaded ? 'Unroll' : 'Roll up'} ${config[win.dataset.id].title}`);
  const content = $('.window-content', win);
  if (content) content.inert = shaded;
  syncWindowMenu();
}
function toggleShade(win) {
  win.classList.toggle('shaded');
  syncShadeControl(win);
  focusWindow(win, true);
}
function startSleep(trigger) {
  finishBoot();
  cancelLaunch();
  closeMenus();
  dismissContextMenu();
  sleepFocus = trigger?.closest('.menu')?.querySelector('.menu-toggle') || trigger || document.activeElement;
  const sleep = $('#sleep-screen');
  $('.sleep-mac', sleep).innerHTML = icon('computer');
  const stars = $('.starfield', sleep);
  if (!stars.children.length) stars.innerHTML = Array.from({length: 32}, (_,i) => `<i style="--x:${(i * 37 + 7) % 100}%;--y:${(i * 53 + 13) % 100}%;--delay:${-(i % 8)}s;--travel:${i % 2 ? 40 : -40}px"></i>`).join('');
  screenStage.scrollTop = 0;
  sleep.hidden = false;
  screenOS.inert = true;
  sleep.focus({preventScroll: true});
}
function wakeDesktop() {
  const sleep = $('#sleep-screen');
  if (sleep.hidden) return;
  sleep.hidden = true;
  screenOS.inert = false;
  if (sleepFocus?.isConnected) sleepFocus.focus({preventScroll: true});
  else desktop.focus({preventScroll: true});
  $('#announcement').textContent = 'Desktop awake';
}
$('#sleep-screen').addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); wakeDesktop(); });
$('#sleep-screen').addEventListener('keydown', event => { event.preventDefault(); event.stopPropagation(); wakeDesktop(); });
$('#sleep-screen').addEventListener('click', event => event.stopPropagation());
document.addEventListener('input', event => {
  if (event.target.id === 'sherlock-query') { searchQuery = event.target.value; renderSearch(); }
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'sherlock-form') return;
  event.preventDefault(); renderSearch();
  $('#search-results button')?.focus();
});
document.addEventListener('change', event => {
  const input = event.target;
  if (input.name === 'search-channel') { searchChannel = input.value; renderSearch(); }
  if (input.name === 'wallpaper') setWallpaper(Number(input.value));
  if (input.id === 'preference-reading') { preferences.largeText = input.checked; persistPreferences(); applyPreferences(); }
  if (input.id === 'preference-motion') setMotion(input.checked);
});
document.addEventListener('click', event => {
  const savedButton = event.target.closest('[data-save]');
  if (savedButton) toggleSaved(savedButton.dataset.save);
  if (event.target.closest('[data-action="reset-preferences"]')) {
    preferences.largeText = false;
    setWallpaper(0); setMotion(true); applyPreferences();
    $('#announcement').textContent = 'Appearance restored';
  }
});

const apps = [['welcome', 'Charles HD'], ['research', 'My Work'], ['future', 'In Progress'], ['resume', 'Résumé'], ['contact', 'Contact'], ['sherlock', 'Sherlock']];
$('#desktop-icons').innerHTML = apps.map(([id, label]) => `<button class="desktop-icon" data-open="${id}">${icon(id)}<span>${label}</span></button>`).join('');

function mobile() { return screenStage.clientWidth < 980; }
function homeGeometry(id) {
  const usable = desktop.clientWidth - 132;
  if (desktop.clientWidth >= 980 && (id === 'welcome' || id === 'research')) {
    const leftWidth = Math.floor((usable - 16) * .51);
    return { width: id === 'welcome' ? leftWidth : usable - leftWidth - 16,
      left: id === 'welcome' ? 16 : leftWidth + 32, top: 18 };
  }
  const c = config[id];
  return { width: Math.min(c.width, desktop.clientWidth - 130),
    left: Math.max(12, Math.min(desktop.clientWidth * c.x, desktop.clientWidth - Math.min(c.width, desktop.clientWidth - 130) - 118)),
    top: id === 'research' ? 190 : c.y };
}
function place(win, id) {
  win.classList.remove('maximized', 'shaded');
  syncShadeControl(win);
  const geometry = homeGeometry(id);
  win.style.width = `${geometry.width}px`;
  win.style.left = `${geometry.left}px`;
  win.style.top = `${Math.max(12, Math.min(geometry.top, desktop.clientHeight - win.offsetHeight - 30))}px`;
  win.dataset.moved = 'false';
}

function focusWindow(win, focusControl = false) {
  windows.querySelectorAll('.window').forEach(w => w.classList.toggle('active', w === win));
  win.style.zIndex = ++highestZ;
  activeId = win.dataset.id;
  syncWindowMenu();
  if (focusControl) $('.window-title', win).focus({ preventScroll: true });
}
function openWindow(id, trigger, initial = false) {
  if (!config[id]) return;
  let win = $(`[data-id="${id}"]`, windows);
  if (!win) {
    win = document.createElement('section');
    win.className = `window ${id === 'note' ? 'note-window' : ''}`;
    win.dataset.id = id;
    win.setAttribute('aria-labelledby', `title-${id}`);
    win.innerHTML = `<div class="titlebar"><button class="window-close" aria-label="Close ${config[id].title}" data-close="${id}"></button><h2 class="window-title" id="title-${id}" tabindex="-1">${config[id].title}</h2><button class="window-shade" aria-label="Roll up ${config[id].title}" aria-pressed="false" data-shade="${id}"></button><button class="window-zoom" aria-label="Expand ${config[id].title}" aria-pressed="false" data-zoom="${id}"></button></div><div class="window-content">${contents[id]()}</div><div class="resize-decoration" aria-hidden="true"></div>`;
    windows.append(win);
    place(win, id);
    enableDrag(win);
    initializeApplication(id, win);
  }
  win.classList.remove('shaded');
  syncShadeControl(win);
  if (trigger) openers.set(id, trigger);
  focusWindow(win, !initial);
  if (mobile() && !initial) {
    const offset = win.getBoundingClientRect().top - screenStage.getBoundingClientRect().top;
    screenStage.scrollTo({ top: screenStage.scrollTop + offset - 34, behavior: 'auto' });
  }
  if (id === 'sherlock' && !initial) $('#sherlock-query', win).focus({ preventScroll: true });
  if (!initial) $('#announcement').textContent = `${config[id].title} opened`;
}
function closeWindow(id) {
  const win = $(`[data-id="${id}"]`, windows);
  if (!win) return;
  win.remove();
  syncWindowMenu();
  const remaining = [...windows.children].sort((a,b) => Number(b.style.zIndex) - Number(a.style.zIndex));
  if (remaining[0]) focusWindow(remaining[0]);
  const opener = openers.get(id);
  if (opener?.isConnected && !opener.closest('[hidden]')) opener.focus({ preventScroll: true });
  else $(`[data-open="${apps.some(a=>a[0]===id) ? id : 'welcome'}"]`, $('#desktop-icons')).focus({ preventScroll: true });
  $('#announcement').textContent = `${config[id].title} closed`;
}
function enableDrag(win) {
  const bar = $('.titlebar', win);
  bar.addEventListener('dblclick', event => { if (!event.target.closest('button')) toggleShade(win); });
  bar.addEventListener('pointerdown', e => {
    if (mobile() || e.target.closest('button') || win.classList.contains('maximized') || e.button !== 0) return;
    e.preventDefault();
    focusWindow(win);
    win.dataset.moved = 'true';
    const startX = e.clientX, startY = e.clientY;
    const left = win.offsetLeft, top = win.offsetTop;
    bar.setPointerCapture(e.pointerId);
    const move = event => {
      win.style.left = `${Math.max(0, Math.min(desktop.clientWidth - win.offsetWidth, left + event.clientX - startX))}px`;
      win.style.top = `${Math.max(4, Math.min(desktop.clientHeight - 60, top + event.clientY - startY))}px`;
    };
    const stop = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', stop); bar.removeEventListener('pointercancel', stop); };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
  });
}

function setLaunchStatus(text) {
  $('.strip-label').innerHTML = '<i></i>';
  $('.strip-label').append(document.createTextNode(text));
}
function cancelLaunch() {
  if (pendingLaunch) {
    clearTimeout(pendingLaunch.timer);
    pendingLaunch.trigger?.classList.remove('launching');
  }
  pendingLaunch = null;
  $('.launch-outline')?.remove();
  screenStage.classList.remove('busy');
  screenOS.removeAttribute('aria-busy');
  setLaunchStatus('Charles Yi · Personal Desktop');
}
function launchWindow(id, trigger) {
  if (!config[id]) return;
  cancelLaunch();
  if (!motionEnabled || $(`[data-id="${id}"]`, windows)) {
    openWindow(id, trigger);
    return;
  }
  screenStage.classList.add('busy');
  screenOS.setAttribute('aria-busy', 'true');
  trigger?.classList.add('launching');
  setLaunchStatus(`Opening ${config[id].title}...`);
  $('#announcement').textContent = `Opening ${config[id].title}`;
  if (!mobile()) {
    const outline = document.createElement('div');
    outline.className = 'launch-outline';
    outline.setAttribute('aria-hidden', 'true');
    const geometry = homeGeometry(id);
    const width = geometry.width;
    const height = Math.min(330, desktop.clientHeight - 65);
    const left = geometry.left;
    const top = Math.max(8, Math.min(geometry.top, desktop.clientHeight - height - 40));
    const bounds = desktop.getBoundingClientRect();
    const start = trigger?.getBoundingClientRect() || bounds;
    Object.assign(outline.style, {left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`});
    outline.style.setProperty('--from-x', `${start.left - bounds.left - left}px`);
    outline.style.setProperty('--from-y', `${start.top - bounds.top - top}px`);
    desktop.append(outline);
  }
  const timer = setTimeout(() => {
    cancelLaunch();
    openWindow(id, trigger);
    const win = $(`[data-id="${id}"]`, windows);
    win.classList.add('window-opening');
    win.addEventListener('animationend', () => win.classList.remove('window-opening'), { once: true });
  }, 440);
  pendingLaunch = { id, trigger, timer };
}
function finishBoot() {
  clearTimeout(bootTimer);
  bootTimer = null;
  $('#boot-screen').hidden = true;
  screenOS.inert = !$('#sleep-screen').hidden;
  screenOS.removeAttribute('aria-busy');
  $('#announcement').textContent = 'Desktop ready';
  if (bootFocus?.isConnected) bootFocus.focus({ preventScroll: true });
  bootFocus = null;
}
function runBoot(trigger = null) {
  dismissContextMenu();
  cancelLaunch();
  clearTimeout(bootTimer);
  bootFocus = trigger?.closest('.menu')?.querySelector('.menu-toggle') || trigger;
  if (!motionEnabled) { finishBoot(); return; }
  $('#boot-icon').innerHTML = icon('computer');
  // Re-create the progress indicator to restart its finite stepped animation.
  $('.boot-progress').innerHTML = '<i></i>';
  $('#boot-screen').hidden = false;
  screenStage.scrollTop = 0;
  screenOS.inert = true;
  screenOS.setAttribute('aria-busy', 'true');
  bootTimer = setTimeout(finishBoot, 1000);
}
function setMotion(enabled) {
  preferences.motion = enabled;
  persistPreferences();
  motionEnabled = enabled && !motionPreference.matches;
  document.body.classList.toggle('reduced-motion', !motionEnabled);
  $('#motion-toggle').setAttribute('aria-pressed', String(motionEnabled));
  $('#motion-toggle').textContent = motionEnabled ? 'Opening animations: on' : 'Opening animations: off';
  syncPreferencesControls();
  if (!motionEnabled) {
    const pending = pendingLaunch;
    cancelLaunch();
    if (pending) openWindow(pending.id, pending.trigger);
    finishBoot();
    windows.querySelectorAll('.window-opening').forEach(win => win.classList.remove('window-opening'));
  }
}
motionPreference.addEventListener('change', () => setMotion(preferences.motion));

// A single screen-bounded menu, with native copy/link menus left intact.
const contextMenu = document.createElement('div');
contextMenu.id = 'context-menu';
contextMenu.className = 'context-menu';
contextMenu.hidden = true;
contextMenu.setAttribute('role', 'menu');
document.body.append(contextMenu);
let contextOrigin = null;
let contextActions = [];

function dismissContextMenu(restoreFocus = false) {
  if (contextMenu.hidden) return;
  contextMenu.hidden = true;
  if (restoreFocus && contextOrigin?.isConnected) contextOrigin.focus({ preventScroll: true });
}
function arrangeWindows() {
  windows.querySelectorAll('.window').forEach(win => {
    place(win, win.dataset.id);
    $('.window-zoom', win).setAttribute('aria-pressed', 'false');
  });
  $('#announcement').textContent = 'Windows arranged';
}
function changeWallpaper() {
  setWallpaper((wallpaper + 1) % 3);
  $('#announcement').textContent = `${['Classic purple', 'Teal', 'Graphite'][wallpaper]} desktop`;
}
function toggleWindowSize(win) {
  win.classList.remove('shaded');
  syncShadeControl(win);
  const expanded = win.classList.toggle('maximized');
  $('.window-zoom', win).setAttribute('aria-pressed', String(expanded));
  focusWindow(win, true);
}
function openContextMenu(target, x, y) {
  if (screenOS.inert) return;
  closeMenus();
  dismissContextMenu();
  const item = target.closest('.desktop-icon, .project-row');
  const win = target.closest('.window');
  const origin = item || (win ? $('.window-title', win) : desktop);
  contextOrigin = origin;
  contextActions = [];
  const add = (label, action, checked) => contextActions.push({label, action, checked});
  const separator = () => contextActions.push(null);
  let title = 'Desktop';
  if (item && itemInfo[item.dataset.open]) {
    const id = item.dataset.open;
    title = itemInfo[id].name;
    add('Open', () => launchWindow(id, item));
    add('Get Info', () => showItemInfo(id, item));
    if (projectIds.includes(id)) add(preferences.saved.includes(id) ? 'Remove from Scrapbook' : 'Keep in Scrapbook', () => toggleSaved(id));
  } else if (win) {
    focusWindow(win);
    title = config[win.dataset.id].title;
    add('Bring to Front', () => focusWindow(win, true));
    if (!mobile()) add(win.classList.contains('maximized') ? 'Restore Window' : 'Expand Window', () => toggleWindowSize(win));
    add(win.classList.contains('shaded') ? 'Unroll Window' : 'Roll Up Window', () => toggleShade(win));
    if (projectIds.includes(win.dataset.id)) add(preferences.saved.includes(win.dataset.id) ? 'Remove from Scrapbook' : 'Keep in Scrapbook', () => toggleSaved(win.dataset.id));
    add('Close Window', () => closeWindow(win.dataset.id));
    separator();
    add('Arrange Windows', arrangeWindows);
  } else {
    add('Find with Sherlock', () => launchWindow('sherlock', origin));
    add('My Work', () => launchWindow('research', origin));
    add('Work in Progress', () => launchWindow('future', origin));
    add('Résumé', () => launchWindow('resume', origin));
    add('Contact', () => launchWindow('contact', origin));
    separator();
    add('Arrange Windows', arrangeWindows);
    add('Control Panels', () => launchWindow('panels', origin));
    add('Change Desktop Pattern', changeWallpaper);
    add('Opening Animations', () => {
      setMotion(!motionEnabled);
      $('#announcement').textContent = motionEnabled ? 'Opening animations on' : 'Opening animations off';
    }, motionEnabled);
    separator();
    add('About Charles Yi', () => launchWindow('about', origin));
  }
  contextMenu.replaceChildren();
  contextMenu.setAttribute('aria-label', `${title} actions`);
  const heading = document.createElement('div');
  heading.className = 'context-heading';
  heading.setAttribute('role', 'presentation');
  heading.textContent = title;
  contextMenu.append(heading);
  contextActions.forEach((entry, index) => {
    if (!entry) {
      const line = document.createElement('hr');
      line.setAttribute('role', 'separator');
      contextMenu.append(line);
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.tabIndex = -1;
    button.dataset.contextIndex = index;
    button.setAttribute('role', entry.checked === undefined ? 'menuitem' : 'menuitemcheckbox');
    if (entry.checked !== undefined) button.setAttribute('aria-checked', String(entry.checked));
    const tick = document.createElement('span');
    tick.className = 'context-check';
    tick.setAttribute('aria-hidden', 'true');
    tick.textContent = entry.checked ? '✓' : '';
    button.append(tick, document.createTextNode(entry.label));
    contextMenu.append(button);
  });
  const bounds = screenStage.getBoundingClientRect();
  contextMenu.style.maxWidth = `${bounds.width - 16}px`;
  contextMenu.style.maxHeight = `${bounds.height - 16}px`;
  contextMenu.style.left = `${bounds.left + 8}px`;
  contextMenu.style.top = `${bounds.top + 8}px`;
  contextMenu.hidden = false;
  // Flip inward near screen edges; scroll internally on very short displays.
  const left = x + contextMenu.offsetWidth > bounds.right - 8 ? x - contextMenu.offsetWidth : x;
  const top = y + contextMenu.offsetHeight > bounds.bottom - 8 ? y - contextMenu.offsetHeight : y;
  contextMenu.style.left = `${Math.max(bounds.left + 8, Math.min(left, bounds.right - contextMenu.offsetWidth - 8))}px`;
  contextMenu.style.top = `${Math.max(bounds.top + 8, Math.min(top, bounds.bottom - contextMenu.offsetHeight - 8))}px`;
  $('button', contextMenu).focus({ preventScroll: true });
}
function useNativeContext(target) {
  return target.closest('a, input, textarea, [contenteditable="true"]') || String(window.getSelection()).trim();
}
screenOS.addEventListener('contextmenu', event => {
  if (!event.target.closest('#desktop') || useNativeContext(event.target)) return;
  event.preventDefault();
  const bounds = event.target.getBoundingClientRect();
  openContextMenu(event.target, event.clientX || bounds.left + 12, event.clientY || bounds.top + 12);
});
screenOS.addEventListener('keydown', event => {
  if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
  if (!event.target.closest('#desktop') || useNativeContext(event.target)) return;
  event.preventDefault();
  const bounds = event.target.getBoundingClientRect();
  openContextMenu(event.target, bounds.left + 12, bounds.top + Math.min(bounds.height, 28));
});
contextMenu.addEventListener('contextmenu', event => event.preventDefault());
contextMenu.addEventListener('click', event => {
  const button = event.target.closest('[data-context-index]');
  if (!button) return;
  const action = contextActions[Number(button.dataset.contextIndex)].action;
  dismissContextMenu(true);
  action();
});
contextMenu.addEventListener('keydown', event => {
  const buttons = [...contextMenu.querySelectorAll('button')];
  const current = buttons.indexOf(document.activeElement);
  let next;
  if (event.key === 'ArrowDown') next = (current + 1) % buttons.length;
  if (event.key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = buttons.length - 1;
  if (next !== undefined) {
    event.preventDefault(); event.stopPropagation(); buttons[next].focus();
  }
  if (event.key === 'Escape' || event.key === 'Tab') {
    event.stopPropagation();
    if (event.key === 'Escape') event.preventDefault();
    dismissContextMenu(true);
  }
});
document.addEventListener('scroll', event => {
  if (!contextMenu.contains(event.target)) dismissContextMenu();
}, true);
window.addEventListener('resize', () => dismissContextMenu());
window.addEventListener('blur', () => dismissContextMenu());

function closeMenus() {
  document.querySelectorAll('.dropdown').forEach(m=>m.hidden = true);
  document.querySelectorAll('.menu-toggle').forEach(b=>b.setAttribute('aria-expanded', 'false'));
}
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('#context-menu')) dismissContextMenu();
  const win = e.target.closest('.window');
  if (win) focusWindow(win);
  if (!e.target.closest('.menu')) closeMenus();
});
document.addEventListener('click', e => {
  if (e.target.closest('#context-menu')) return;
  const toggle = e.target.closest('.menu-toggle');
  if (toggle) { const menu = toggle.nextElementSibling; const shouldOpen = menu.hidden; closeMenus(); menu.hidden = !shouldOpen; toggle.setAttribute('aria-expanded', String(shouldOpen)); return; }
  const button = e.target.closest('[data-open], [data-close], [data-zoom], [data-shade], [data-action]');
  if (!button) return;
  closeMenus();
  if (button.dataset.open) launchWindow(button.dataset.open, button);
  if (button.dataset.close) closeWindow(button.dataset.close);
  if (button.dataset.shade) toggleShade(button.closest('.window'));
  if (button.dataset.zoom) toggleWindowSize(button.closest('.window'));
  const action = button.dataset.action;
  if (action === 'sleep') startSleep(button);
  if (action === 'boot') runBoot(button);
  if (action === 'motion') { setMotion(!motionEnabled); button.closest('.menu')?.querySelector('.menu-toggle').focus(); }
  if (action === 'close') { cancelLaunch(); closeWindow(activeId); }
  if (action === 'tidy') arrangeWindows();
  if (action === 'wallpaper') changeWallpaper();
});
document.addEventListener('keydown', e => {
  if (!$('#sleep-screen').hidden) return;
  if (!contextMenu.hidden) return;
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); launchWindow('sherlock', document.activeElement); return; }
  if (e.key === 'Escape') {
    if (bootTimer !== null) { finishBoot(); return; }
    if (pendingLaunch) { cancelLaunch(); $('#announcement').textContent = 'Opening cancelled'; return; }
    const menu = $('.menu-toggle[aria-expanded="true"]');
    if (menu) { closeMenus(); menu.focus(); } else closeWindow(activeId);
  }
});
function updateLayout() {
  dismissContextMenu();
  document.body.classList.toggle('compact', mobile());
  if (!mobile()) windows.querySelectorAll('.window:not(.maximized)').forEach(win => {
    if (win.dataset.moved !== 'true') { const shaded = win.classList.contains('shaded'); place(win, win.dataset.id); if (shaded) { win.classList.add('shaded'); syncShadeControl(win); } return; }
    win.style.width = `${Math.min(config[win.dataset.id].width, desktop.clientWidth - 130)}px`;
    win.style.left = `${Math.max(0, Math.min(win.offsetLeft, desktop.clientWidth - win.offsetWidth))}px`;
    win.style.top = `${Math.max(8, Math.min(win.offsetTop, desktop.clientHeight - win.offsetHeight - 30))}px`;
  });
}
new ResizeObserver(updateLayout).observe(screenStage);
updateLayout();

function tick() { const now = new Date(); $('#clock').textContent = new Intl.DateTimeFormat('en-MY', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).format(now); $('#clock').dateTime = now.toISOString(); }
tick(); setInterval(tick, 30000);
openWindow('research', null, true);
openWindow('welcome', null, true);

applyPreferences();
setMotion(preferences.motion);
runBoot();

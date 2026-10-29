const HIDDEN_KEY = 'charles-floppy-hidden-v1';
const thoughts = [
  {title:'Something worth reading?', text:'Notes from Charles’s projects and things he’s learning.', action:'Read Blog', app:'blog'},
  {title:'Let’s open the work folder.', text:'AI evaluation, ReRouteHer, and sound detection. Each project has a story.', action:'My Work', app:'research'},
  {title:'Research in progress.', text:'The MASCO–ESCO project lives in this folder. Initial model results are ready; human review is ahead.', action:'Open Research', app:'studies'},
  {title:'Who keeps this desktop?', text:'Meet Charles: a data science student interested in language, sound, and reliable AI.', action:'About Charles', app:'about'},
  {title:'Misplaced a thought?', text:'Sherlock can search this desktop by topic. A little easier than opening every folder.', action:'Find with Sherlock', app:'sherlock'},
  {title:'Make yourself at home.', text:'Change the desktop colour, enlarge the reading text, or slow things down in Control Panels.', action:'Appearance', app:'panels'},
  {title:'Worth keeping?', text:'You can save projects to Scrapbook and come back to them in this browser.', action:'Scrapbook', app:'scrapbook'},
  {title:'A good question travels.', text:'Have a research question or a project idea? Charles’s contact details are over here.', action:'Say hello', app:'contact'},
  {title:'A space for future builds.', text:'The Hackathon app is under deployment. Charles will share projects and demos here.', action:'Hackathon', app:'hackathon'},
  {title:'The short version.', text:'Education, experience, and the tools Charles works with. All in one document.', action:'Résumé', app:'resume'}
];

// Original integer-pixel artwork, matching the desktop's existing SVG icons.
const disk = `<svg class="floppy-sprite" viewBox="0 0 36 36" width="72" height="72" shape-rendering="crispEdges" aria-hidden="true">
  <path fill="#111" d="M4 1h24v1h2v2h2v28H3V2h1z"/>
  <path fill="#6879ad" d="M4 2h24v2h3v27H4z"/>
  <path fill="#aab6db" d="M4 2h3v1H5v27H4zM5 2h23v1H5z"/>
  <path fill="#38436c" d="M30 5h1v26H5v-1h25z"/>
  <path fill="#24283c" d="M8 2h17v11H8z"/>
  <g class="floppy-shutter"><path fill="#bbb" d="M8 2h17v10H8z"/><path fill="#eee" d="M8 2h17v1H8zM8 3h1v8H8z"/><path fill="#777" d="M24 3h1v9H9v-1h15z"/><path fill="#292b38" d="M19 4h4v6h-4z"/><path fill="#f5f5f5" d="M10 4h6v1h-6z"/></g>
  <path fill="#222" d="M7 15h21v15H7z"/><path fill="#fff6d9" d="M8 16h19v13H8z"/>
  <path fill="#c6bc9e" d="M8 28h19v1H8zM26 16h1v12h-1z"/><path fill="#d88970" d="M9 17h16v1H9z"/>
  <path class="floppy-eyes" fill="#333" d="M12 20h1v3h-1zM22 20h1v3h-1z"/>
  <path fill="#333" d="M15 25h5v1h-5z"/>
  <path fill="#111" d="M5 3h1v2H5zM28 26h2v3h-2z"/>
</svg>`;

export class FloppyAssistant {
  constructor(root, toggle, openApp, ready = () => true, motion = () => true) {
    this.root = root;
    this.toggle = toggle;
    this.openApp = openApp;
    this.thought = 0;
    this.visitCount = 0;
    this.ready = ready;
    this.motion = motion;
    this.view = root.ownerDocument.defaultView;
    root.innerHTML = `<div class="floppy-invitation" id="floppy-invitation" role="group" aria-label="A thought from Floppy" hidden><p id="floppy-message" aria-live="polite"><strong></strong><span></span></p><div class="floppy-actions"><button class="classic-button primary" data-floppy="open"></button><button class="classic-button" data-floppy="next" aria-label="Another thought">Next</button><button class="classic-button" data-floppy="later">Later</button></div></div><button class="floppy-button" aria-label="Talk to Floppy Assistant" data-floppy="talk">${disk}<span>Floppy</span></button>`;
    this.invitation = root.querySelector('.floppy-invitation');
    this.button = root.querySelector('.floppy-button');
    root.hidden = this.readStorage('localStorage', HIDDEN_KEY) === '1';
    this.syncToggle();
    root.addEventListener('pointerenter', () => { this.hovered = true; this.notice(); });
    root.addEventListener('pointerleave', () => { this.hovered = false; root.classList.remove('noticed'); });
    root.addEventListener('focusin', () => this.notice());
    const dismissOutside = event => { if (!root.contains(event.target)) this.dismiss(); };
    root.ownerDocument.addEventListener('pointerdown', dismissOutside, {passive:true});
    root.ownerDocument.addEventListener('click', dismissOutside);
    root.ownerDocument.addEventListener('scroll', () => {
      this.stopWalking();
      this.queueWalk(12000);
    }, {capture:true,passive:true});
    root.addEventListener('click', event => {
      const action = event.target.closest('[data-floppy]')?.dataset.floppy;
      if (!action) return;
      if (action === 'later') { this.dismiss(true); this.queueWalk(60000); }
      if (action === 'talk') this.speak(!this.invitation.hidden);
      if (action === 'next') this.speak(true);
      if (action === 'open') {
        this.appOpened();
        this.openApp(thoughts[this.thought].app, this.button);
      }
    });
  }

  readStorage(store, key) {
    try { return this.view[store].getItem(key); } catch { return null; }
  }
  writeStorage(store, key, value) {
    try { this.view[store].setItem(key, value); } catch { /* Memory state still works this visit. */ }
  }
  syncToggle() {
    this.toggle.textContent = this.root.hidden ? 'Show Floppy Assistant' : 'Hide Floppy Assistant';
    this.toggle.setAttribute('aria-pressed', String(!this.root.hidden));
  }
  notice() {
    if (!this.motion()) return;
    this.view.clearTimeout(this.noticeTimer);
    this.root.classList.add('noticed');
    this.noticeTimer = this.view.setTimeout(() => this.root.classList.remove('noticed'),1200);
  }
  toggleVisibility() {
    this.stopWalking();
    this.dismiss();
    this.root.hidden = !this.root.hidden;
    this.writeStorage('localStorage', HIDDEN_KEY, this.root.hidden ? '1' : '0');
    this.syncToggle();
    this.start();
  }
  start() {
    if (!this.walkTimer && !this.walkFrame) this.queueWalk(6000);
  }
  speak(next = false) {
    this.stopWalking();
    this.dismiss();
    if (next) this.thought = (this.thought + 1) % thoughts.length;
    const thought = thoughts[this.thought];
    this.invitation.querySelector('strong').textContent = thought.title;
    this.invitation.querySelector('p>span').textContent = thought.text;
    this.invitation.querySelector('[data-floppy="open"]').textContent = thought.action;
    this.invitation.hidden = false;
    this.positionBalloon();
    this.button.setAttribute('aria-describedby', 'floppy-message');
    this.root.classList.add('inviting');
    // A single, finite animation; nothing keeps bouncing while someone reads.
    this.motionTimer = this.view.setTimeout(() => this.root.classList.remove('inviting'), 2400);
    this.dismissTimer = this.view.setTimeout(() => {
      if (!this.invitation.contains(this.root.ownerDocument.activeElement)) this.dismiss();
    }, 10000);
    this.queueWalk(26000);
  }
  dismiss(restoreFocus = false) {
    const wasOpen = !this.invitation.hidden;
    this.view.clearTimeout(this.motionTimer);
    this.view.clearTimeout(this.dismissTimer);
    this.invitation.hidden = true;
    this.button.removeAttribute('aria-describedby');
    this.root.classList.remove('inviting');
    if (restoreFocus && wasOpen) this.button.focus({preventScroll: true});
    return wasOpen;
  }
  appOpened() {
    this.stopWalking();
    this.dismiss();
    this.queueWalk(30000);
  }
  position(tab, desktop) {
    this.desktop = desktop;
    this.frame = desktop.closest('#screen-stage');
    if (!this.frame) return;
    const compact = desktop.ownerDocument.body.classList.contains('compact');
    const bounds = this.bounds(), tabBox = tab?.getBoundingClientRect();
    const size = `${this.frame.clientWidth}:${this.frame.clientHeight}`;
    if (!this.placed || this.compact !== compact || this.frameSize !== size) {
      this.stopWalking();
      this.moveTo(compact ? bounds.right : (tabBox?.left || bounds.left) + 8, bounds.bottom);
      this.placed = true;
      this.compact = compact;
      this.frameSize = size;
      this.start();
    } else this.moveTo(parseFloat(this.root.style.left), parseFloat(this.root.style.top));
    this.positionBalloon();
  }
  bounds() {
    const box = this.frame.getBoundingClientRect();
    const width = this.root.offsetWidth || 72, height = this.root.offsetHeight || 92;
    return {left:box.left+12, top:box.top+46, right:Math.max(box.left+12,box.right-width-12), bottom:Math.max(box.top+46,box.bottom-height-72)};
  }
  moveTo(x,y) {
    const b = this.bounds();
    this.root.style.left = `${Math.round(Math.max(b.left,Math.min(b.right,x)))}px`;
    this.root.style.top = `${Math.round(Math.max(b.top,Math.min(b.bottom,y)))}px`;
  }
  positionBalloon() {
    if (!this.frame || this.invitation.hidden) return;
    const frame = this.frame.getBoundingClientRect(), disk = this.root.getBoundingClientRect();
    const width = this.invitation.offsetWidth || 280;
    const left = Math.max(frame.left+8,Math.min(disk.left,frame.right-width-8)) - disk.left;
    this.invitation.style.left = `${left}px`;
    this.invitation.style.setProperty('--floppy-tail',`${Math.max(18,Math.min(width-30,disk.width/2-left))}px`);
    this.invitation.classList.toggle('below',disk.top-(this.invitation.offsetHeight||200)-14 < frame.top+36);
  }
  isPaused() {
    return !this.ready() || this.hovered || this.root.contains(this.root.ownerDocument.activeElement);
  }
  queueWalk(delay) {
    this.view.clearTimeout(this.walkTimer);
    this.walkTimer = null;
    if (this.root.hidden || !this.motion() || !this.desktop) return;
    this.walkTimer = this.view.setTimeout(() => { this.walkTimer = null; this.wander(); },delay);
  }
  stopWalking() {
    this.view.clearTimeout(this.walkTimer);
    this.view.clearTimeout(this.jumpTimer);
    this.view.cancelAnimationFrame?.(this.walkFrame);
    this.walkTimer = null; this.walkFrame = null;
    this.root.classList.remove('walking','blog-nudge');
  }
  motionChanged() {
    this.stopWalking();
    this.start();
  }
  wander() {
    if (this.root.hidden || !this.motion() || !this.frame) return;
    if (this.isPaused()) { this.queueWalk(3000); return; }
    const frame = this.frame.getBoundingClientRect(), doc = this.root.ownerDocument;
    const targets = [...this.desktop.querySelectorAll('.desktop-icon, .folder-tab')].filter(el => {
      const box = el.getBoundingClientRect();
      if (!box.width || box.top < frame.top+30 || box.bottom > frame.bottom-24) return false;
      const hit = doc.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
      return hit === el || el.contains(hit);
    });
    const b = this.bounds();
    const width = this.root.offsetWidth || 72, height = this.root.offsetHeight || 92;
    // Rest beside a control, never on top of another desktop icon or tab.
    const stops = targets.map(target => {
      const box = target.getBoundingClientRect();
      const options = [{x:box.left-width-10,y:box.top}, {x:box.right+10,y:box.top}, {x:box.left,y:box.bottom+10}, {x:box.left,y:box.top-height-10}];
      const candidates = options.filter(p=>p.x>=b.left && p.x<=b.right && p.y>=b.top && p.y<=b.bottom && !targets.some(other=>{
        const r=other.getBoundingClientRect();
        return p.x<r.right+4 && p.x+width>r.left-4 && p.y<r.bottom+4 && p.y+height>r.top-4;
      }));
      return {target,box,candidates};
    }).filter(stop=>stop.candidates.length);
    const alternatives = stops.filter(({target})=>(target.dataset.open || target.dataset.folderTab)!==this.lastVisited);
    const stop = (alternatives.length ? alternatives : stops)[this.visitCount++ % (alternatives.length || stops.length)];
    if (!stop) { this.queueWalk(12000); return; }
    const {target,box,candidates} = stop;
    const from = {x:parseFloat(this.root.style.left),y:parseFloat(this.root.style.top)};
    const destination = candidates.sort((a,c)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(c.x-from.x,c.y-from.y))[0];
    const to = {x:Math.max(b.left,Math.min(b.right,destination.x)),y:Math.max(b.top,Math.min(b.bottom,destination.y))};
    const duration = Math.max(1200,Math.hypot(to.x-from.x,to.y-from.y)/65*1000);
    this.dismiss(); this.root.classList.add('walking');
    let elapsed = 0, previous;
    const step = now => {
      if (!this.motion() || this.root.hidden) { this.stopWalking(); return; }
      const delta = previous === undefined ? 0 : Math.min(100,now-previous); previous = now;
      if (!this.isPaused()) elapsed += delta;
      const progress = Math.min(1,Math.floor(elapsed/80)*80/duration);
      this.moveTo(from.x+(to.x-from.x)*progress,from.y+(to.y-from.y)*progress);
      if (elapsed < duration) { this.walkFrame = this.view.requestAnimationFrame(step); return; }
      this.moveTo(to.x,to.y); this.walkFrame = null; this.root.classList.remove('walking');
      // Check the icon is still where we walked to (it may have been dragged).
      const current = target.getBoundingClientRect();
      if (Math.hypot(current.left-box.left,current.top-box.top)>24) { this.queueWalk(6000); return; }
      this.lastVisited = target.dataset.open || target.dataset.folderTab;
      const id = this.lastVisited === 'welcome' ? 'about' : this.lastVisited;
      const index = thoughts.findIndex(thought=>thought.app===id);
      if (index >= 0) this.thought = index;
      if (this.lastVisited === 'blog') {
        this.root.classList.add('blog-nudge');
        this.jumpTimer = this.view.setTimeout(() => this.root.classList.remove('blog-nudge'),800);
      }
      // Stroll quietly. Proximity changes the optional click conversation only.
      this.queueWalk(6000);
    };
    this.walkFrame = this.view.requestAnimationFrame(step);
  }
}

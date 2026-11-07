const HIDDEN_KEY = 'charles-floppy-hidden-v1';
const PARK_KEY = 'charles-floppy-park-v1';
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

// Each cel uses the same disk shell. The curves are drawn in the disk's original
// pixel coordinates, so elbows bend and feet plant without stretching the label.
const looseArms = 'M3 19Q0 20 0 23Q0 25 -3 25 M32 19Q35 20 35 23Q35 25 38 25';
const planted = 'M11 31Q12 35 10 37Q9 39 6 38 M24 31Q23 35 25 37Q26 39 29 38';
const handOnHip = 'M3 19Q-4 20 -2 24Q0 26 4 24 ';
const shadingEyes = handOnHip + 'M32 20Q39 19 35 13Q34 10 28 10';
const readyArms = 'M3 19Q-2 20 -3 16Q-4 14 -3 13 M32 19Q36 21 37 17Q38 15 38 13';
const bentKnees = 'M11 31Q4 33 8 35Q10 36 6 36 M24 31Q31 33 27 35Q25 36 30 36';
const poses = {
  stand: {},
  // Contact, passing foot, opposite contact, opposite passing foot.
  stride: {arms: 'M3 19Q-1 20 -4 16 M32 19Q35 26 38 21', legs: 'M11 31Q8 36 3 37Q1 38 0 36 M24 31Q28 32 26 37Q27 39 32 37'},
  pass: {lift: -1, arms: looseArms, legs: 'M11 31Q7 35 10 36Q13 36 14 34 M24 31Q22 36 24 39Q26 40 29 39'},
  step: {arms: 'M3 19Q-1 26 -4 21 M32 19Q35 20 38 16', legs: 'M11 31Q16 32 15 37Q17 39 21 37 M24 31Q20 35 16 37Q14 38 13 36'},
  rise: {lift: -1, arms: looseArms, legs: 'M11 31Q9 36 11 39Q13 40 16 39 M24 31Q20 33 21 35Q24 37 26 34'},
  waveUp: {tilt: -4, arms: handOnHip + 'M32 19Q37 22 36 15Q34 11 36 9', gaze: 1},
  waveOut: {tilt: -3, arms: handOnHip + 'M32 19Q36 22 37 17Q38 14 38 12', gaze: 1},
  lookout: {tilt: 4, arms: shadingEyes, gaze: 2},
  lookAcross: {tilt: -2, arms: shadingEyes, gaze: -2},
  offer: {tilt: 3, arms: handOnHip + 'M32 19Q34 23 36 21Q38 19 38 17', gaze: 1},
  brace: {lift: 2, arms: readyArms, legs: bentKnees, blink: true},
  hop: {lift: -1, arms: readyArms, legs: 'M11 31Q6 33 8 35Q10 36 12 33 M24 31Q29 33 27 35Q25 36 23 33'},
  skate: {tilt: -6, arms: 'M3 19Q-1 18 -4 14 M32 19Q34 25 38 22', legs: 'M11 31Q7 32 5 35Q4 36 2 34 M24 31Q25 37 30 37Q32 37 33 36', gaze: 2},
  carry: {tilt: -4, arms: 'M3 19Q-2 19 0 13Q1 10 3 9 M32 19Q37 17 35 12Q34 10 32 9', legs: 'M11 31Q8 34 9 36Q10 38 13 35 M24 31Q22 34 23 38Q24 40 27 38', gaze: 1},
  swing: {tilt: 3, arms: 'M3 19Q-1 18 0 13Q1 11 3 10 M32 19Q37 18 35 12Q34 9 32 8', legs: 'M11 31Q10 35 12 38Q14 40 16 37 M24 31Q27 34 26 36Q24 38 22 35', gaze: 1},
  perch: {lift: 2, arms: 'M3 19Q-1 25 4 27 M32 19Q36 25 31 27', legs: bentKnees},
  paddle: {tilt: -5, arms: 'M3 20Q-2 18 -4 22 M32 21Q35 24 38 20', legs: bentKnees, gaze: 1},
  glide: {tilt: 4, arms: 'M3 20Q-1 25 -4 22 M32 20Q36 16 38 18', legs: bentKnees, gaze: 1},
  reach: {tilt: 4, arms: handOnHip + 'M32 19Q34 16 38 15', gaze: 2},
  snooze: {tilt: 5, lift: 3, arms: 'M3 19Q-2 25 5 25Q8 25 11 23 M32 19Q37 25 30 25Q26 25 24 23', legs: bentKnees, blink: true},
};

const frameWidth = 52;
const frames = Object.entries(poses);
const frameOffsets = frames.map(([name], index) => `--${name}:translateX(${-index * frameWidth}px)`).join(';');
function drawFrame([, {arms = looseArms, legs = planted, lift = 0, tilt = 0, gaze = 0, blink = false}], index) {
  const eyes = blink ? 'M11 22h4v1h-4zM21 22h4v1h-4z' : 'M12 20h1v3h-1zM22 20h1v3h-1z';
  return `<g transform="translate(${index * frameWidth} ${lift})">
    <path class="floppy-ink floppy-facing" d="${legs}"/>
    <g class="floppy-upper" style="--tilt:${tilt}deg">
      <use href="#floppy-case"/>
      <path class="floppy-ink floppy-facing" d="${arms}"/>
      <g class="floppy-facing"><path fill="#333" transform="translate(${gaze} 0)" d="${eyes}"/></g>
    </g>
  </g>`;
}

const disk = `<svg class="floppy-sprite" viewBox="-5 0 44 42" width="88" height="84" shape-rendering="crispEdges" aria-hidden="true" style="${frameOffsets}">
  <defs><g id="floppy-case">
  <path fill="#111" d="M4 1h24v1h2v2h2v28H3V2h1z"/>
  <path fill="var(--floppy-plastic, #6879ad)" d="M4 2h24v2h3v27H4z"/>
  <path fill="#aab6db" d="M4 2h3v1H5v27H4zM5 2h23v1H5z"/>
  <path fill="#38436c" d="M30 5h1v26H5v-1h25z"/>
  <path fill="#24283c" d="M8 2h17v11H8z"/>
  <g class="floppy-shutter"><path fill="#bbb" d="M8 2h17v10H8z"/><path fill="#eee" d="M8 2h17v1H8zM8 3h1v8H8z"/><path fill="#777" d="M24 3h1v9H9v-1h15z"/><path fill="#292b38" d="M19 4h4v6h-4z"/><path fill="#f5f5f5" d="M10 4h6v1h-6z"/></g>
  <path fill="#222" d="M7 15h21v15H7z"/><path fill="#fff6d9" d="M8 16h19v13H8z"/>
  <path fill="#c6bc9e" d="M8 28h19v1H8zM26 16h1v12h-1z"/><path fill="#d88970" d="M9 17h16v1H9z"/>
  <path fill="#333" d="M15 25h5v1h-5z"/>
  <path fill="#111" d="M5 3h1v2H5zM28 26h2v3h-2z"/>
  </g>
  <clipPath id="floppy-orb-edge"><path d="M12 3h11v2h5v3h4v4h2v5h1v9h-2v5h-3v4h-5v2H11v-2H6v-3H3v-5H1v-5H0v-6h2v-5h3V8h3V5h4z"/></clipPath>
  <g id="floppy-orb-map">
    <path fill="#8398b6" d="M-3 13h9v3h4v4H5v2H0zM28 25h9v3h5v5h-7v-2h-7z"/>
    <path fill="#394862" d="M9 5h17v9H9z"/><path fill="#bfccd0" d="M10 5h15v8H10z"/>
    <path fill="#43516b" d="M19 6h4v6h-4z"/>
    <path fill="#494e62" d="M7 17h21v13H7z"/><path fill="#f1e7bf" d="M8 18h19v11H8z"/>
    <path fill="#c88b71" d="M8 18h19v2H8z"/><path fill="#383944" d="M12 21h1v3h-1zM22 21h1v3h-1zM15 26h5v1h-5z"/>
  </g></defs>
  <g class="floppy-cels">${frames.map(drawFrame).join('')}</g>
  <g class="floppy-globe" clip-path="url(#floppy-orb-edge)">
    <path fill="#7386ab" d="M0 2h36v37H0z"/>
    <g class="globe-spin"><use href="#floppy-orb-map"/><use href="#floppy-orb-map" x="44"/></g>
    <path fill="#263953" opacity=".42" d="M25 2h11v36H7v-4h13v-3h5v-4h4V14h-2V8h-2z"/>
    <path fill="#e3e1ca" opacity=".8" d="M6 11h2v4H6zM4 15h2v5H4z"/>
  </g>
</svg>`;

export class FloppyAssistant {
  constructor(root, toggle, openApp, ready = () => true, motion = () => true, random = Math.random) {
    this.root = root;
    this.toggle = toggle;
    this.openApp = openApp;
    this.thought = 0;
    this.random = random;
    this.mood = 'still';
    this.ready = ready;
    this.motion = motion;
    this.view = root.ownerDocument.defaultView;
    root.innerHTML = `<div class="floppy-invitation" id="floppy-invitation" role="group" aria-label="A thought from Floppy" hidden><p id="floppy-message" aria-live="polite"><strong></strong><span></span></p><div class="floppy-actions"><button class="classic-button primary" data-floppy="open"></button><button class="classic-button" data-floppy="next" aria-label="Another thought">Next</button><button class="classic-button" data-floppy="later">Later</button><button class="classic-button" data-floppy="park">Park here</button></div></div><button class="floppy-button" aria-label="Talk to Floppy Assistant" data-floppy="talk">${disk}<span>Floppy</span></button>`;
    this.invitation = root.querySelector('.floppy-invitation');
    this.button = root.querySelector('.floppy-button');
    this.parkButton = root.querySelector('[data-floppy="park"]');
    this.parked = this.readPark();
    this.syncParking();
    this.sleeve = root.ownerDocument.createElement('div');
    this.sleeve.className = 'floppy-sleeve';
    this.sleeve.hidden = true;
    this.sleeve.setAttribute('aria-hidden', 'true');
    this.sleeve.innerHTML = `<svg viewBox="0 0 32 30" width="32" height="30" shape-rendering="crispEdges" aria-hidden="true"><path fill="#49464a" stroke="#222" d="M2 4h28v23H2z"/><path fill="#fff2c4" stroke="#222" d="M2 6h6l3 5h10l3-5h6v21H2z"/><path fill="none" stroke="#bda77d" d="m3 26 8-9m18 9-8-9"/><path fill="#61718e" d="M11 15h10v2H11z"/></svg><span>Put away</span>`;
    root.after(this.sleeve);
    root.hidden = this.readStorage('localStorage', HIDDEN_KEY) === '1';
    this.syncToggle();
    root.addEventListener('pointerenter', event => {
      this.hovered = true;
      const box = this.button.getBoundingClientRect();
      root.dataset.visitorSide = event.clientX < box.left + box.width / 2 ? 'left' : 'right';
      this.notice();
      this.prepareDodge(event);
    });
    root.addEventListener('pointerleave', () => { this.hovered = false; this.cancelDodge(); root.classList.remove('noticed'); });
    root.addEventListener('focusin', () => { this.cancelDodge(); this.notice(); });
    // Once a press starts, stay put. Touch and keyboard access never dodge.
    root.addEventListener('pointerdown', () => this.stopWalking());
    this.button.addEventListener('pointerdown', event => this.pickUp(event));
    this.button.addEventListener('pointermove', event => this.carry(event));
    this.button.addEventListener('pointerup', event => {
      if (this.drag?.id !== event.pointerId) return;
      this.carry(event);
      this.finishDrag(false);
    });
    for (const type of ['pointercancel', 'lostpointercapture']) {
      this.button.addEventListener(type, event => {
        if (this.drag?.id === event.pointerId) this.finishDrag(true);
      });
    }
    this.view.addEventListener('blur', () => this.finishDrag(true));
    root.ownerDocument.addEventListener('keydown', event => {
      if (this.drag && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.finishDrag(true);
      }
    }, true);
    this.button.addEventListener('keydown', event => this.handleMoveKey(event));
    const dismissOutside = event => { if (!root.contains(event.target)) this.dismiss(); };
    root.ownerDocument.addEventListener('pointerdown', dismissOutside, {passive:true});
    root.ownerDocument.addEventListener('click', dismissOutside);
    root.ownerDocument.addEventListener('scroll', () => {
      if (this.scene?.visible()) {
        if (this.root.dataset.scenePaused === 'true') this.sceneControl('redraw');
        return;
      }
      this.stopWalking();
      this.queueWalk(12000);
    }, {capture:true,passive:true});
    root.addEventListener('click', event => {
      const action = event.target.closest('[data-floppy]')?.dataset.floppy;
      if (!action) return;
      if (action === 'talk' && this.skipDragClick && event.detail > 0) {
        this.skipDragClick = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (action === 'park') {
        if (this.parked) {
          this.setPark(null);
          this.dismiss();
          this.desktop.focus({preventScroll: true});
          this.start();
        } else {
          this.parkHere();
          this.dismiss(true);
        }
      }
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
  readPark() {
    try {
      const point = JSON.parse(this.readStorage('localStorage', PARK_KEY));
      if ([point?.x, point?.y].every(n => Number.isFinite(n) && n >= 0 && n <= 1)) return point;
    } catch { /* Ignore an invalid saved position. */ }
    return null;
  }
  syncParking() {
    this.root.classList.toggle('parked', Boolean(this.parked));
    this.parkButton.textContent = this.parked ? 'Let Floppy roam' : 'Park here';
    this.button.title = this.parked ? 'Parked. Click for options or drag to move.' : 'Click to talk. Drag to park or put away.';
  }
  setPark(point) {
    this.parked = point;
    this.writeStorage('localStorage', PARK_KEY, JSON.stringify(point));
    this.syncParking();
  }
  parkHere() {
    this.stopWalking();
    const b = this.bounds();
    const fraction = (value, min, max) => Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
    this.setPark({
      x: fraction(parseFloat(this.root.style.left), b.left, b.right),
      y: fraction(parseFloat(this.root.style.top), b.top, b.bottom)
    });
  }
  pickUp(event) {
    if (event.button !== 0 || event.isPrimary === false || this.drag || !this.frame || !this.ready()) return;
    this.skipDragClick = false;
    this.drag = {id: event.pointerId, x: event.clientX, y: event.clientY,
      left: parseFloat(this.root.style.left), top: parseFloat(this.root.style.top), lastX: event.clientX, moved: false};
    this.button.setPointerCapture?.(event.pointerId);
  }
  carry(event) {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      this.dismiss();
      this.root.classList.remove('noticed');
      this.root.classList.add('carried');
      // Start the sleeve away from the pickup point to avoid an accidental hide.
      const frame = this.frame.getBoundingClientRect();
      this.sleeve.hidden = false;
      this.sleeve.style.left = `${drag.x < frame.left + frame.width / 2 ? frame.right - this.sleeve.offsetWidth - 16 : frame.left + 16}px`;
      this.sleeve.style.top = `${Math.max(frame.top + 46, frame.bottom - this.sleeve.offsetHeight - 72)}px`;
    }
    event.preventDefault();
    if (Math.abs(event.clientX - drag.lastX) >= 2) {
      this.faceDirection(event.clientX - drag.lastX);
      drag.lastX = event.clientX;
    }
    this.moveTo(drag.left + dx, drag.top + dy);
    const sleeve = this.sleeve.getBoundingClientRect();
    drag.overSleeve = sleeve.width > 0 && event.clientX >= sleeve.left && event.clientX <= sleeve.right &&
      event.clientY >= sleeve.top && event.clientY <= sleeve.bottom;
    this.sleeve.classList.toggle('ready', drag.overSleeve);
  }
  finishDrag(cancelled) {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    if (this.button.hasPointerCapture?.(drag.id)) this.button.releasePointerCapture(drag.id);
    this.sleeve.hidden = true;
    this.sleeve.classList.remove('ready');
    this.root.classList.remove('carried');
    this.skipDragClick = drag.moved || cancelled;
    if (cancelled) this.moveTo(drag.left, drag.top);
    else if (drag.moved && drag.overSleeve) {
      this.toggleVisibility();
      this.desktop.focus({preventScroll: true});
    } else if (drag.moved) this.parkHere();
    this.start();
  }
  handleMoveKey(event) {
    const direction = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
    if (!direction || this.drag || !this.frame || event.metaKey || event.ctrlKey || event.altKey) return;
    event.preventDefault();
    this.dismiss();
    const distance = event.shiftKey ? 1 : 12;
    this.moveTo(parseFloat(this.root.style.left) + direction[0] * distance, parseFloat(this.root.style.top) + direction[1] * distance);
    this.parkHere();
  }
  syncToggle() {
    this.toggle.textContent = this.root.hidden ? 'Show Floppy Assistant' : 'Hide Floppy Assistant';
    this.toggle.setAttribute('aria-pressed', String(!this.root.hidden));
  }
  notice() {
    if (!this.motion() || this.scene || this.drag?.moved) return;
    this.view.clearTimeout(this.noticeTimer);
    this.root.classList.add('noticed');
    this.noticeTimer = this.view.setTimeout(() => this.root.classList.remove('noticed'),1200);
  }
  toggleVisibility() {
    this.finishDrag(true);
    this.stopWalking();
    this.dismiss();
    this.root.hidden = !this.root.hidden;
    if (this.root.hidden) this.hovered = false;
    this.writeStorage('localStorage', HIDDEN_KEY, this.root.hidden ? '1' : '0');
    this.syncToggle();
    this.root.dispatchEvent(new this.view.Event('floppyvisibilitychange'));
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
      this.finishDrag(true);
      this.stopWalking();
      this.moveTo(compact ? bounds.right : (tabBox?.left || bounds.left) + 8, bounds.bottom);
      this.placed = true;
      this.compact = compact;
      this.frameSize = size;
      this.start();
    } else this.moveTo(parseFloat(this.root.style.left), parseFloat(this.root.style.top));
    if (this.parked && !this.drag && !this.scene) {
      this.moveTo(bounds.left + this.parked.x * (bounds.right - bounds.left), bounds.top + this.parked.y * (bounds.bottom - bounds.top));
    }
    this.positionBalloon();
  }
  bounds() {
    const box = this.frame.getBoundingClientRect();
    const width = this.root.offsetWidth || 88, height = this.root.offsetHeight || 104;
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
    if (this.root.hidden || this.parked || this.drag || !this.motion() || !this.desktop) return;
    this.walkTimer = this.view.setTimeout(() => { this.walkTimer = null; this.chooseMotion(); },delay);
  }
  stopWalking() {
    if (this.scene) {
      const stage = this.scene;
      this.scene = null;
      this.sceneControl = null;
      delete this.root.dataset.scenePaused;
      stage.leave();
      this.root.classList.remove('visiting', 'in-water', 'planetary');
      this.button.querySelector('svg').style.removeProperty('--activity-pose');
      this.root.style.removeProperty('--world-scroll');
      this.root.style.removeProperty('--guest-size');
      if (!this.drag && this.frame) this.moveTo(this.returnSpot.x, this.returnSpot.y);
    }
    this.view.clearTimeout(this.walkTimer);
    this.view.clearTimeout(this.jumpTimer);
    this.view.clearTimeout(this.moodTimer);
    this.cancelDodge();
    this.view.cancelAnimationFrame?.(this.walkFrame);
    this.walkTimer = null; this.walkFrame = null;
    this.root.classList.remove('walking','blog-nudge','recoiling');
    this.root.style.removeProperty('--floppy-plastic');
    this.setMood('still');
  }
  motionChanged() {
    this.stopWalking();
    this.start();
  }
  faceDirection(horizontal) {
    if (horizontal) this.root.dataset.facing = horizontal < 0 ? 'left' : 'right';
  }
  setMood(mood) {
    this.mood = mood;
    this.root.dataset.mood = mood;
  }
  chooseMotion() {
    if (this.root.hidden || this.parked || this.drag || !this.motion() || !this.frame) return;
    if (this.isPaused() || !this.invitation.hidden) { this.queueWalk(3000); return; }
    const moods = ['wander','wander','wander','bounce','bounce','shy','peek','nap'].filter(mood=>mood!==this.previousMood);
    const mood = moods[Math.floor(this.random()*moods.length)];
    this.stopWalking();
    this.previousMood = mood;
    this.setMood(mood);
    if (mood === 'wander') this.wander();
    else if (mood === 'bounce') this.bounce();
    else {
      this.dodged = false;
      const duration = mood === 'shy' ? 14000 : mood === 'nap' ? 10000 : 5500;
      this.moodTimer = this.view.setTimeout(()=>this.finishMood(),duration);
    }
  }
  finishMood(delay = 5000 + Math.floor(this.random()*5000)) {
    this.stopWalking();
    this.queueWalk(delay);
  }
  // The playhead belongs to the visit, so pausing or dragging film to a new
  // frame never spawns a second assistant or sends the existing one home.
  visitScene(scene, invited = false, stillAt) {
    const still = Number.isFinite(stillAt);
    if (this.root.hidden || (this.parked && !invited) || this.drag || (!this.motion() && !still) ||
        !this.ready() || (!invited && this.isPaused()) || !this.frame || !this.invitation.hidden || !scene.visible()) return false;
    this.stopWalking();
    const home = {x: parseFloat(this.root.style.left), y: parseFloat(this.root.style.top)};
    this.returnSpot = home;
    this.scene = scene;
    const sprite = this.button.querySelector('svg');
    const homeSize = sprite.clientWidth || this.root.offsetWidth;
    this.root.classList.add('visiting');
    this.setMood('visiting');

    const jump = 620, duration = 6200;
    let time = still ? jump + duration * stillAt : 0, end = jump + duration;
    let paused = still, previous, lastPaint = -Infinity;
    const clamp = n => Math.max(0, Math.min(1, n));
    const ease = t => t*t*(3-2*t);
    const progress = () => clamp((time - jump) / duration);
    const status = () => {
      this.root.dataset.scenePaused = String(paused);
      scene.playback?.(paused ? 'paused' : 'playing');
    };
    const render = () => {
      const enter = clamp(time / jump), exit = clamp((time - end) / jump);
      const inside = enter === 1 && exit === 0;
      const age = Math.max(0, Math.min(end, time) - jump);
      const actor = scene.paint(progress(), inside, age);
      // A small wind-up, an eased arc and a planted landing also work on
      // large displays, where the old fixed-speed hop crossed a long way.
      const flight = enter < 1 ? clamp((enter-.12)/.88) : 1-exit;
      const weight = ease(flight);
      const size = Math.round(homeSize + (actor.size-homeSize)*weight);
      this.root.style.setProperty('--guest-size', size+'px');
      const x = actor.x - this.root.offsetWidth/2;
      const y = actor.y - sprite.clientHeight*(actor.planet ? .5 : actor.water ? .66 : .92);
      const arc = 4*flight*(1-flight)*Math.min(80, 18+Math.hypot(x-home.x,y-home.y)*.11);
      this.faceDirection(inside ? actor.facing : (x-home.x)*(exit ? -1 : 1));
      const pose = inside ? actor.pose : flight < .12 ? 'brace' : 'hop';
      // The cel offsets live on the SVG; var(--pose) must resolve there.
      sprite.style.setProperty('--activity-pose', 'var(--'+pose+')');
      this.root.classList.toggle('in-water', Boolean(inside && actor.water));
      this.root.classList.toggle('planetary', Boolean(inside && actor.planet));
      if (inside && actor.planet) this.root.style.setProperty('--world-scroll', -2*Math.floor(age%2400/2400*22)+'px');
      const frame = this.frame.getBoundingClientRect();
      this.root.style.left = Math.round(Math.max(frame.left+4,Math.min(frame.right-this.root.offsetWidth-4,home.x+(x-home.x)*weight)))+'px';
      this.root.style.top = Math.round(Math.max(frame.top+30,home.y+(y-home.y)*weight-arc))+'px';
    };
    const step = now => {
      this.walkFrame = null;
      if (!scene.visible() || !this.ready() || !this.motion()) { this.finishMood(); return; }
      if (!this.root.contains(this.root.ownerDocument.activeElement))
        time += previous === undefined ? 0 : Math.min(100, now-previous);
      previous = now;
      if (time >= end+jump) { this.finishMood(); return; }
      if (time-lastPaint >= 40) { render(); lastPaint = time; }
      this.walkFrame = this.view.requestAnimationFrame(step);
    };
    this.sceneControl = (action, value) => {
      this.view.cancelAnimationFrame(this.walkFrame);
      this.walkFrame = null;
      if (action === 'seek') { time = jump + duration*clamp(value); end = jump + duration; paused = true; }
      if (action === 'pause') paused = true;
      if (action === 'resume' || action === 'interact') {
        if (action === 'interact') {
          time = Math.min(time,end);
          end = Math.max(end, time + 2300);
        } else if (progress() >= 1) { time = jump; end = jump+duration; }
        paused = !this.motion();
      }
      previous = undefined;
      lastPaint = -Infinity;
      status(); render();
      if (!paused) this.walkFrame = this.view.requestAnimationFrame(step);
    };
    status(); render();
    if (!paused) this.walkFrame = this.view.requestAnimationFrame(step);
    return true;
  }
  bounce() {
    this.setMood('bounce');
    const colors = ['#6879ad','#7d78a4','#6c918b','#9a8467'];
    let x=parseFloat(this.root.style.left), y=parseFloat(this.root.style.top);
    let vx=(this.random()<.5?-1:1)*(75+this.random()*15), vy=(this.random()<.5?-1:1)*(50+this.random()*15);
    this.faceDirection(vx);
    let previous,elapsed=0,painted=0,hits=0;
    let recoilUntil = 0;
    const duration=24000+this.random()*10000;
    const step=now=>{
      if (!this.motion() || this.root.hidden) { this.stopWalking(); return; }
      const dt=previous===undefined?0:Math.min(100,now-previous); previous=now;
      if (!this.isPaused()) elapsed+=dt;
      const tick=Math.floor(elapsed/80)*80;
      if(tick>painted) {
        const seconds=(tick-painted)/1000; painted=tick;
        const b=this.bounds(); let hit=false;
        x+=vx*seconds;y+=vy*seconds;
        if(x<b.left || x>b.right){vx=-vx;x=x<b.left?b.left+(b.left-x):b.right-(x-b.right);hit=true;}
        if(y<b.top || y>b.bottom){vy=-vy;y=y<b.top?b.top+(b.top-y):b.bottom-(y-b.bottom);hit=true;}
        x=Math.max(b.left,Math.min(b.right,x));y=Math.max(b.top,Math.min(b.bottom,y));
        if (hit) {
          this.faceDirection(vx);
          this.root.style.setProperty('--floppy-plastic', colors[++hits % colors.length]);
          recoilUntil = tick + 240;
        }
        this.root.classList.toggle('recoiling', tick < recoilUntil);
        this.moveTo(x,y);
      }
      if(elapsed>=duration){this.finishMood();return;}
      this.walkFrame=this.view.requestAnimationFrame(step);
    };
    this.walkFrame=this.view.requestAnimationFrame(step);
  }
  cancelDodge() {
    this.view.clearTimeout(this.dodgeTimer);
    this.dodgeTimer=null;
  }
  prepareDodge(event) {
    if(this.mood!=='shy' || this.dodged || event.pointerType!=='mouse' || !this.motion() || !this.invitation.hidden || this.root.contains(this.root.ownerDocument.activeElement)) return;
    const pointer={x:event.clientX,y:event.clientY};
    this.cancelDodge();
    this.dodgeTimer=this.view.setTimeout(()=>{
      this.dodgeTimer=null;
      if(this.hovered && this.ready() && this.mood==='shy' && !this.root.contains(this.root.ownerDocument.activeElement)) this.dodge(pointer);
    },220);
  }
  dodge(pointer) {
    const from={x:parseFloat(this.root.style.left),y:parseFloat(this.root.style.top)},b=this.bounds();
    const width=this.root.offsetWidth||88,height=this.root.offsetHeight||104;
    const angle=Math.atan2(from.y+height/2-pointer.y,from.x+width/2-pointer.x);
    const controls=[...this.desktop.querySelectorAll('.desktop-icon,.folder-tab')].map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height);
    const options=[0,.7,-.7,1.4,-1.4,Math.PI].map(turn=>({x:Math.max(b.left,Math.min(b.right,from.x+Math.cos(angle+turn)*120)),y:Math.max(b.top,Math.min(b.bottom,from.y+Math.sin(angle+turn)*100))}));
    const to=options.find(p=>Math.hypot(p.x-from.x,p.y-from.y)>50&&!controls.some(r=>p.x<r.right+4&&p.x+width>r.left-4&&p.y<r.bottom+4&&p.y+height>r.top-4));
    if(!to)return;
    this.faceDirection(to.x - from.x);
    this.stopWalking();this.dodged=true;this.setMood('dodge');this.root.classList.add('walking');
    let elapsed=0,previous;
    const step=now=>{
      if(!this.motion()||this.root.hidden){this.stopWalking();return;}
      const dt=previous===undefined?0:Math.min(100,now-previous);previous=now;
      // This one brief scoot ignores hover, but pauses for background/sleep/focus.
      if(this.ready()&&!this.root.contains(this.root.ownerDocument.activeElement))elapsed+=dt;
      const t=Math.min(1,Math.floor(elapsed/60)*60/480);
      this.moveTo(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t);
      if(elapsed>=480){this.moveTo(to.x,to.y);this.finishMood(18000);return;}
      this.walkFrame=this.view.requestAnimationFrame(step);
    };
    this.walkFrame=this.view.requestAnimationFrame(step);
  }
  wander() {
    if (this.root.hidden || this.parked || this.drag || !this.motion() || !this.frame) return;
    if (this.isPaused()) { this.queueWalk(3000); return; }
    this.setMood('wander');
    const frame = this.frame.getBoundingClientRect(), doc = this.root.ownerDocument;
    const targets = [...this.desktop.querySelectorAll('.desktop-icon, .folder-tab')].filter(el => {
      const box = el.getBoundingClientRect();
      if (!box.width || box.top < frame.top+30 || box.bottom > frame.bottom-24) return false;
      const hit = doc.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
      return hit === el || el.contains(hit);
    });
    const b = this.bounds();
    const width = this.root.offsetWidth || 88, height = this.root.offsetHeight || 104;
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
    const choices = alternatives.length ? alternatives : stops;
    const stop = choices[Math.floor(this.random()*choices.length)];
    if (!stop) { this.queueWalk(12000); return; }
    const {target,box,candidates} = stop;
    const from = {x:parseFloat(this.root.style.left),y:parseFloat(this.root.style.top)};
    const destination = candidates.sort((a,c)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(c.x-from.x,c.y-from.y))[0];
    const to = {x:Math.max(b.left,Math.min(b.right,destination.x)),y:Math.max(b.top,Math.min(b.bottom,destination.y))};
    const duration = Math.max(1200,Math.hypot(to.x-from.x,to.y-from.y)/65*1000);
    this.faceDirection(to.x - from.x);
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
        this.faceDirection(current.left + current.width / 2 - (to.x + width / 2));
        this.root.classList.add('blog-nudge');
        this.jumpTimer = this.view.setTimeout(() => this.root.classList.remove('blog-nudge'),800);
      }
      // Stroll quietly. Proximity changes the optional click conversation only.
      this.queueWalk(6000);
    };
    this.walkFrame = this.view.requestAnimationFrame(step);
  }
}

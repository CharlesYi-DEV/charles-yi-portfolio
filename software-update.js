import { BLOG_HOME, validateFeed } from './blog-reader.js';
const CACHE_KEY = 'charles-blog-v1';
const MAX_SIZE = 2_000_000;
export class SoftwareUpdate {
  constructor(root, openPost) {
    this.root = root;
    this.openPost = openPost;
    this.posts = [];
    root.innerHTML = `<div class="update-banner"><span class="update-icon" aria-hidden="true">↻</span><div><h1>Software Update</h1><p>What’s new on Charles’s desktop</p></div></div><div class="update-controls"><button class="classic-button primary" data-check-updates data-balloon="Check Charles’s blog for the latest published posts.">Check Now</button><span class="update-status" role="status" aria-live="polite">Ready to check.</span></div><div class="update-progress" hidden aria-hidden="true"><i></i></div><h2 class="update-section">Latest writing</h2><div class="update-posts"></div><h2 class="update-section">Project milestones</h2><div class="update-milestones"><button class="update-row" data-open="future"><span class="update-kind">RESEARCH · 28 OCT 2026</span><strong>MASCO–ESCO: ready for human review</strong><span>Initial model runs completed and annotation platform set up. Human review is still ahead.</span><small>Open project →</small></button><button class="update-row" data-open="blog"><span class="update-kind">BLOG · 29 OCT 2026</span><strong>A place for discussion</strong><span>Disqus comments are available on the standalone blog.</span><small>Browse writing →</small></button></div><div class="window-footer">Portfolio news · Nothing to install</div>`;
    this.status = root.querySelector('.update-status');
    this.list = root.querySelector('.update-posts');
    root.addEventListener('click', event => {
      if (event.target.closest('[data-check-updates]')) this.load();
      const button = event.target.closest('[data-update-post]');
      const post = button && this.posts.find(p => p.id === button.dataset.updatePost);
      if (post) this.openPost(post, this.posts);
    });
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw && raw.length < MAX_SIZE) {
        const cached = JSON.parse(raw);
        this.posts = validateFeed(cached.feed); this.cachedAt = cached.at;
      }
    } catch { /* Checking online remains available with no local storage. */ }
    this.render(); this.load();
  }
  render() {
    this.list.replaceChildren();
    if (!this.posts.length) {
      const empty = document.createElement('p'); empty.className = 'update-empty';
      empty.textContent = 'No writing to display yet. Check for updates, or open the Blog app.';
      this.list.append(empty); return;
    }
    [...this.posts].sort((a,b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 5).forEach(post => {
      const button = document.createElement('button'); button.className = 'update-row'; button.dataset.updatePost = post.id;
      const date = document.createElement('span'); date.className = 'update-kind';
      date.textContent = 'BLOG · ' + new Date(post.date).toLocaleDateString('en', {day:'numeric', month:'short', year:'numeric', timeZone:'UTC'}).toUpperCase();
      const title = document.createElement('strong'); title.textContent = post.title;
      const summary = document.createElement('span'); summary.textContent = post.excerpt;
      const action = document.createElement('small'); action.textContent = 'Read in Blog →';
      button.append(date, title, summary, action); this.list.append(button);
    });
  }
  async load() {
    this.controller?.abort();
    const controller = this.controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const button = this.root.querySelector('[data-check-updates]');
    button.disabled = true; this.root.setAttribute('aria-busy','true');
    this.root.querySelector('.update-progress').hidden = false;
    this.status.textContent = 'Checking for new writing…';
    try {
      const response = await fetch(new URL('feed.json',BLOG_HOME), {signal:controller.signal, cache:'no-cache', credentials:'omit'});
      if (!response.ok) throw new Error('Feed unavailable');
      const raw = await response.text(); if (raw.length > MAX_SIZE) throw new Error('Feed too large');
      const feed = JSON.parse(raw), posts = validateFeed(feed);
      if (this.destroyed || this.controller !== controller) return;
      this.posts = posts; this.cachedAt = new Date().toISOString();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({at:this.cachedAt, feed})); } catch { /* Optional cache. */ }
      this.render();
      this.status.textContent = `${posts.length} published ${posts.length === 1 ? 'post' : 'posts'} · Checked just now`;
    } catch {
      if (this.destroyed || this.controller !== controller) return;
      const date = this.cachedAt && !Number.isNaN(Date.parse(this.cachedAt)) ? new Date(this.cachedAt).toLocaleString() : 'a previous visit';
      this.status.textContent = this.posts.length ? `Couldn’t connect. Saved writing from ${date}.` : 'Couldn’t connect. Try Check Now again.';
    } finally {
      clearTimeout(timer);
      if (!this.destroyed && this.controller === controller) {
        button.disabled = false; this.root.removeAttribute('aria-busy');
        this.root.querySelector('.update-progress').hidden = true;
      }
    }
  }
  destroy() { this.destroyed = true; this.controller?.abort(); }
}

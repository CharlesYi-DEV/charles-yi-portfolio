export const BLOG_HOME = 'https://charlesyi-dev.github.io/charles-yi-blog/';
const FEED_URL = new URL('feed.json', BLOG_HOME).href;
const CACHE_KEY = 'charles-blog-v1';
const MAX_FEED_SIZE = 2_000_000;

export function safeURL(value, base = BLOG_HOME, image = false) {
  try {
    const url = new URL(value, base);
    return (url.protocol === 'https:' || (!image && url.protocol === 'mailto:')) ? url.href : null;
  } catch { return null; }
}

export function validateFeed(data) {
  if (data?.version !== 1 || !Array.isArray(data.posts) || data.posts.length > 100) throw new Error('Invalid feed');
  const ids = new Set();
  return data.posts.map(post => {
    if (typeof post.id !== 'string' || !post.id || ids.has(post.id) ||
        typeof post.title !== 'string' || !post.title || post.title.length > 300 ||
        typeof post.html !== 'string' || post.html.length > 200_000 ||
        typeof post.url !== 'string' || !post.url.startsWith(BLOG_HOME) || !safeURL(post.url) ||
        typeof post.date !== 'string' || Number.isNaN(Date.parse(post.date))) throw new Error('Invalid post');
    ids.add(post.id);
    return {id: post.id, title: post.title, html: post.html, url: post.url, date: post.date,
      excerpt: String(post.excerpt || '').slice(0, 600),
      tags: Array.isArray(post.tags) ? post.tags.filter(tag => typeof tag === 'string').slice(0, 12) : [],
      reading_minutes: Math.max(1, Math.min(120, Number(post.reading_minutes) || 1))};
  });
}

// Rebuild a small allowlist of semantic elements. Feed styles, scripts, IDs,
// forms, event handlers, and embedded browsing contexts never enter the desktop.
export function articleFragment(html, base, doc = document) {
  const template = doc.createElement('template');
  template.innerHTML = html;
  const allowed = new Set('p h2 h3 h4 ul ol li blockquote pre code strong em a img figure figcaption br hr table thead tbody tr th td del sup sub'.split(' '));
  const discard = new Set('script style iframe object embed form input button textarea select svg math link meta base audio video source'.split(' '));
  function copy(source, target) {
    for (const child of source.childNodes) {
      if (child.nodeType === 3) { target.append(doc.createTextNode(child.textContent)); continue; }
      if (child.nodeType !== 1) continue;
      const tag = child.tagName.toLowerCase();
      if (discard.has(tag)) continue;
      if (!allowed.has(tag)) { copy(child, target); continue; }
      const element = doc.createElement(tag);
      if (tag === 'a') {
        const href = child.getAttribute('href');
        const url = href && safeURL(href, base);
        if (!url) { copy(child, target); continue; }
        element.href = url;
        element.target = '_blank';
        element.rel = 'noopener noreferrer';
      }
      if (tag === 'img') {
        const src = child.getAttribute('src');
        const url = src && safeURL(src, base, true);
        if (!url) continue;
        element.src = url;
        element.alt = child.getAttribute('alt') || '';
        element.loading = 'lazy';
        element.decoding = 'async';
        element.referrerPolicy = 'no-referrer';
      }
      copy(child, element);
      target.append(element);
    }
  }
  const fragment = doc.createDocumentFragment();
  copy(template.content, fragment);
  return fragment;
}

export class BlogReader {
  constructor(root) {
    this.root = root;
    this.posts = [];
    this.query = '';
    this.selected = null;
    this.hasData = false;
    root.innerHTML = `<div class="blog-toolbar"><button class="classic-button" data-blog="back" hidden>← All posts</button><button class="classic-button" data-blog="refresh">Refresh</button><a class="classic-button" href="${BLOG_HOME}" target="_blank" rel="noopener noreferrer">Open blog ↗</a></div><div class="blog-search"><label for="blog-query">Find a post</label><input id="blog-query" type="search" placeholder="Title, topic, or tag" maxlength="120" autocomplete="off"></div><p class="blog-status" role="status" aria-live="polite">Connecting to Charles’s blog…</p><div class="blog-view"></div>`;
    this.status = root.querySelector('.blog-status');
    this.view = root.querySelector('.blog-view');
    root.addEventListener('input', event => {
      if (event.target.id === 'blog-query') { this.query = event.target.value; this.renderList(); }
    });
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-blog]');
      if (!button) return;
      if (button.dataset.blog === 'refresh') this.load();
      if (button.dataset.blog === 'back') { this.selected = null; this.render(); this.view.querySelector('button')?.focus(); }
      if (button.dataset.blog === 'post') { this.selected = button.dataset.post; this.render(); this.view.querySelector('h1')?.focus(); }
    });
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw && raw.length <= MAX_FEED_SIZE) {
        const cached = JSON.parse(raw);
        this.posts = validateFeed(cached.feed);
        this.cachedAt = cached.at;
        this.hasData = true;
      }
    } catch { /* Storage may be blocked or from an obsolete feed. */ }
    this.render();
    this.load();
  }

  async load() {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    const timer = setTimeout(() => controller.abort(), 12000);
    const refresh = this.root.querySelector('[data-blog="refresh"]');
    refresh.disabled = true;
    this.root.setAttribute('aria-busy', 'true');
    this.status.textContent = this.hasData ? 'Checking for new posts…' : 'Connecting to Charles’s blog…';
    try {
      const response = await fetch(FEED_URL, {signal: controller.signal, cache: 'no-cache', credentials: 'omit'});
      if (!response.ok) throw new Error('Feed unavailable');
      const raw = await response.text();
      if (raw.length > MAX_FEED_SIZE) throw new Error('Feed too large');
      const feed = JSON.parse(raw);
      const posts = validateFeed(feed);
      if (this.controller !== controller || this.destroyed) return;
      this.posts = posts;
      this.hasData = true;
      this.cachedAt = new Date().toISOString();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({at: this.cachedAt, feed})); } catch { /* Reading still works. */ }
      this.render();
      this.status.textContent = `${posts.length} ${posts.length === 1 ? 'post' : 'posts'} · Updated just now`;
    } catch {
      if (this.controller !== controller || this.destroyed) return;
      this.render();
      const date = this.cachedAt && !Number.isNaN(Date.parse(this.cachedAt)) ? new Date(this.cachedAt).toLocaleString() : 'a previous visit';
      this.status.textContent = this.hasData ? `Couldn’t refresh. Showing saved posts from ${date}.` : 'Couldn’t connect. Try Refresh, or open the standalone blog.';
    } finally {
      clearTimeout(timer);
      if (this.controller === controller && !this.destroyed) {
        refresh.disabled = false;
        this.root.removeAttribute('aria-busy');
      }
    }
  }

  render() {
    const post = this.posts.find(item => item.id === this.selected);
    if (!post) this.selected = null;
    this.root.querySelector('[data-blog="back"]').hidden = !post;
    this.root.querySelector('.blog-search').hidden = Boolean(post);
    if (!post) { this.renderList(); return; }
    const article = document.createElement('article');
    article.className = 'blog-article';
    const title = document.createElement('h1');
    title.tabIndex = -1;
    title.textContent = post.title;
    const meta = document.createElement('p');
    meta.className = 'blog-meta';
    meta.textContent = this.metadata(post);
    const body = document.createElement('div');
    body.className = 'blog-prose';
    body.append(articleFragment(post.html, post.url));
    const original = document.createElement('a');
    original.className = 'classic-button';
    original.href = post.url;
    original.target = '_blank';
    original.rel = 'noopener noreferrer';
    original.textContent = 'Read on the blog ↗';
    article.append(title, meta, original, body);
    this.view.replaceChildren(article);
    this.root.closest('.window-content')?.scrollTo?.({top: 0});
  }

  metadata(post) {
    return `${new Date(post.date).toLocaleDateString('en', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'})} · ${post.reading_minutes} min read${post.tags.length ? ' · ' + post.tags.join(', ') : ''}`;
  }

  renderList() {
    const terms = this.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const found = this.posts.filter(post => terms.every(term => `${post.title} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase().includes(term)));
    this.view.replaceChildren();
    if (!found.length) {
      const empty = document.createElement('p');
      empty.className = 'blog-empty';
      empty.textContent = this.query.trim() ? 'No matching posts. Try another topic.' : this.hasData ? 'No posts published yet. Check back soon.' : 'Posts will appear here when the connection is ready.';
      this.view.append(empty);
      return;
    }
    const list = document.createElement('ul');
    list.className = 'blog-post-list';
    found.forEach(post => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.className = 'blog-post';
      button.dataset.blog = 'post';
      button.dataset.post = post.id;
      const title = document.createElement('strong');
      title.textContent = post.title;
      const meta = document.createElement('span');
      meta.className = 'blog-meta';
      meta.textContent = this.metadata(post);
      const excerpt = document.createElement('span');
      excerpt.className = 'blog-excerpt';
      excerpt.textContent = post.excerpt;
      button.append(title, meta, excerpt);
      li.append(button);
      list.append(li);
    });
    this.view.append(list);
  }

  destroy() { this.destroyed = true; this.controller?.abort(); }
}

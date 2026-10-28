import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {BLOG_HOME, validateFeed, articleFragment, BlogReader} from '../blog-reader.js';
const post = {id:'hello', title:'Hello research', html:'<p>A readable article.</p>', url:BLOG_HOME+'posts/hello/', date:'2026-10-28T02:00:00.000Z', excerpt:'Notes from building', tags:['Design'], reading_minutes:2};
const feed = {version:1, posts:[post]};
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
function environment() {
  const dom = new JSDOM('<main class="blog-app"></main>', {url:'https://charlesyi.net'});
  globalThis.document=dom.window.document;
  globalThis.localStorage=dom.window.localStorage;
  return dom;
}
test('feed rejects duplicates, foreign links and malformed entries', () => {
  assert.equal(validateFeed(feed)[0].title, post.title);
  for (const bad of [{version:2,posts:[]},{version:1,posts:[post,post]}, {version:1,posts:[{...post,url:'https://other.example/'}]}, {version:1,posts:[{...post,date:'invalid'}]}]) assert.throws(()=>validateFeed(bad));
});
test('article retains useful content while removing active HTML and presentation', () => {
  const dom=environment();
  const box=document.createElement('div');
  box.append(articleFragment('<style>body{display:none}</style><script>alert(1)</script><iframe src="https://example.com"></iframe><p id="x" style="color:red" onclick="bad()">Text <strong>bold</strong><a href="javascript:alert(1)">unsafe</a><a href="./next/">safe</a><img src="https://example.com/p.png" onerror="bad()"><img src="data:text/html,bad"></p>',post.url));
  assert.equal(box.querySelectorAll('script,style,iframe,[style],[onclick],[onerror],[id]').length,0);
  assert.equal(box.querySelectorAll('a').length,1);
  assert.equal(box.querySelector('a').href,post.url+'next/');
  assert.equal(box.querySelector('a').rel,'noopener noreferrer');
  assert.equal(box.querySelectorAll('img').length,1);
  assert.match(box.textContent,/Text boldunsafesafe/);
  dom.window.close();
});
test('reader fetches, searches, opens articles, returns and keeps cached posts offline', async () => {
  const dom=environment();
  globalThis.fetch=async ()=>({ok:true,text:async()=>JSON.stringify(feed)});
  const reader=new BlogReader(document.querySelector('main'));
  await settle();
  assert.match(reader.status.textContent,/1 post/);
  const input=document.querySelector('input');
  input.value='missing'; input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  assert.match(reader.view.textContent,/No matching posts/);
  input.value='Design'; input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  reader.view.querySelector('button').click();
  assert.equal(reader.view.querySelector('h1').textContent,post.title);
  assert.match(reader.view.textContent,/A readable article/);
  document.querySelector('[data-blog="back"]').click();
  assert.ok(reader.view.querySelector('button'));
  reader.destroy();
  globalThis.fetch=async()=>{throw new Error('Offline');};
  const offline=new BlogReader(document.querySelector('main'));
  await settle();
  assert.match(offline.status.textContent,/Showing saved posts/);
  assert.ok(offline.view.querySelector('button'));
  offline.destroy(); dom.window.close();
});
test('first visit handles unavailable feed without an empty broken window', async () => {
  const dom=environment();
  globalThis.fetch=async()=>({ok:false});
  const reader=new BlogReader(document.querySelector('main'));
  await settle();
  assert.match(reader.status.textContent,/Couldn’t connect/);
  assert.equal(document.querySelector('[data-blog="refresh"]').disabled,false);
  assert.equal(document.querySelector('.blog-toolbar a').href,BLOG_HOME);
  reader.destroy(); dom.window.close();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {FloppyAssistant} from '../floppy-assistant.js';

function setup({hidden=false, blocked=false, motion=true, random=()=>0}={}) {
  const dom=new JSDOM('<div id="screen-stage"><main id="desktop"><button class="desktop-icon" data-open="studies">Research</button><button class="desktop-icon" data-open="blog">Blog</button><aside></aside></main></div><button id="toggle"></button><button id="reading">Current reading</button>',{url:'https://charlesyi.net',pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  if(hidden) w.localStorage.setItem('charles-floppy-hidden-v1','1');
  if(blocked) Object.defineProperty(w,'localStorage',{get(){throw Error('Blocked');}});
  const timers=new Map(),frames=new Map(); let serial=0,clock=0,ready=true,lastApp,opens=0;
  w.setTimeout=(callback,delay)=>{timers.set(++serial,{callback,delay});return serial;};
  w.clearTimeout=id=>timers.delete(id);
  w.requestAnimationFrame=callback=>{frames.set(++serial,callback);return serial;};
  w.cancelAnimationFrame=id=>frames.delete(id);
  const rect=(x,y,width,height)=>({x,y,left:x,top:y,right:x+width,bottom:y+height,width,height});
  d.querySelector('#screen-stage').getBoundingClientRect=()=>rect(0,0,1000,700);
  [...d.querySelectorAll('.desktop-icon')].forEach((el,i)=>el.getBoundingClientRect=()=>rect(700,100+i*150,80,60));
  d.elementFromPoint=(x,y)=>[...d.querySelectorAll('.desktop-icon')].find(el=>{const r=el.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;})||d.body;
  const root=d.querySelector('aside');
  root.getBoundingClientRect=()=>rect(parseFloat(root.style.left)||0,parseFloat(root.style.top)||0,72,92);
  Object.defineProperty(root,'offsetWidth',{value:72}); Object.defineProperty(root,'offsetHeight',{value:92});
  const assistant=new FloppyAssistant(root,d.querySelector('#toggle'),id=>{lastApp=id;opens++;},()=>ready,()=>motion,random);
  assistant.position(null,d.querySelector('#desktop'));
  const advance=delay=>{for(const [id,t] of [...timers]) if(t.delay===delay){timers.delete(id);t.callback();}};
  const animate=ms=>{for(let i=0;i<ms;i+=100){clock+=100;for(const [id,callback] of [...frames]){frames.delete(id);callback(clock);}}};
  return {dom,d,w,assistant,timers,frames,advance,animate,get lastApp(){return lastApp;},get opens(){return opens;},setReady(v){ready=v;},setMotion(v){motion=v;}};
}

test('Floppy walks silently, stays in the screen, and offers the nearby app only when clicked',()=>{
  const s=setup();s.d.querySelector('#reading').focus();
  const before=s.assistant.root.style.left;s.assistant.start();s.advance(6000);s.animate(2000);
  assert.notEqual(s.assistant.root.style.left,before);assert.equal(s.assistant.root.classList.contains('walking'),true);
  assert.equal(s.assistant.invitation.hidden,true);
  s.animate(20000);
  assert.equal(s.assistant.invitation.hidden,true);
  s.assistant.button.click();
  assert.match(s.assistant.invitation.textContent,/Research in progress/);
  assert.equal(s.d.activeElement.id,'reading');assert.equal(s.opens,0);
  const r=s.assistant.root.getBoundingClientRect();assert.ok(r.left>=12&&r.right<=988&&r.top>=46&&r.bottom<=628);
  s.d.querySelector('[data-floppy="open"]').click();assert.equal(s.lastApp,'studies');assert.equal(s.assistant.invitation.hidden,true);
  s.dom.window.close();
});

test('hover pauses walking and reduced motion stops it while keeping manual conversation available',()=>{
  const s=setup();s.assistant.start();s.advance(6000);s.animate(2000);
  s.assistant.root.dispatchEvent(new s.w.Event('pointerenter'));const left=s.assistant.root.style.left;s.animate(1000);assert.equal(s.assistant.root.style.left,left);
  assert.equal(s.assistant.root.classList.contains('noticed'),true);assert.equal(s.assistant.invitation.hidden,true);
  s.assistant.root.dispatchEvent(new s.w.Event('pointerleave'));s.animate(1000);assert.notEqual(s.assistant.root.style.left,left);
  s.setMotion(false);s.assistant.motionChanged();assert.equal(s.frames.size,0);assert.ok(![...s.timers.values()].some(t=>t.delay===6000));
  s.assistant.button.click();assert.equal(s.assistant.invitation.hidden,false);s.d.querySelector('[data-floppy="next"]').click();assert.match(s.assistant.invitation.textContent,/work folder/);
  s.dom.window.close();
});

test('Later quiets the companion, focused controls stay readable, and opening another app delays roaming',()=>{
  const s=setup();s.assistant.button.click();s.d.querySelector('[data-floppy="later"]').focus();s.advance(10000);assert.equal(s.assistant.invitation.hidden,false);
  s.d.querySelector('[data-floppy="later"]').click();assert.equal(s.assistant.invitation.hidden,true);assert.equal(s.d.activeElement,s.assistant.button);
  assert.ok([...s.timers.values()].some(t=>t.delay===60000));
  s.assistant.appOpened();assert.ok([...s.timers.values()].some(t=>t.delay===30000));
  s.dom.window.close();
});

test('outside clicks dismiss speech without moving focus, and arriving at Blog gives one silent nudge',()=>{
  const s=setup();s.assistant.button.click();s.d.querySelector('#reading').focus();s.d.querySelector('#reading').click();
  assert.equal(s.assistant.invitation.hidden,true);assert.equal(s.d.activeElement.id,'reading');
  s.assistant.lastVisited='studies';s.assistant.wander();s.animate(20000);
  assert.equal(s.assistant.lastVisited,'blog');assert.equal(s.assistant.root.classList.contains('blog-nudge'),true);
  assert.equal(s.assistant.invitation.hidden,true);s.advance(800);assert.equal(s.assistant.root.classList.contains('blog-nudge'),false);
  s.dom.window.close();
});

test('hidden preference persists; showing restores roaming; unavailable storage and sleeping desktop are safe',()=>{
  const s=setup();s.assistant.toggleVisibility();assert.equal(s.w.localStorage.getItem('charles-floppy-hidden-v1'),'1');assert.equal(s.timers.size,0);
  const reload=setup({hidden:true});reload.assistant.start();assert.equal(reload.timers.size,0);reload.assistant.toggleVisibility();assert.equal(reload.assistant.root.hidden,false);assert.equal(reload.timers.size,1);
  const blocked=setup({blocked:true});blocked.setReady(false);blocked.assistant.start();blocked.advance(6000);assert.equal(blocked.frames.size,0);
  blocked.setReady(true);blocked.advance(3000);assert.equal(blocked.frames.size,1);
  blocked.assistant.button.click();blocked.d.querySelector('[data-floppy="open"]').click();assert.equal(blocked.lastApp,'blog');
  for(const instance of [s,reload,blocked])instance.dom.window.close();
});


test('random moods include wandering, bouncing, shy, looking around and dozing without consecutive repeats or speech',()=>{
  let seed=17;
  const s=setup({random:()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}});
  const seen=new Set();let previous;
  for(let i=0;i<60;i++){
    s.assistant.chooseMotion();
    assert.notEqual(s.assistant.mood,previous);
    previous=s.assistant.mood;seen.add(previous);
    assert.equal(s.assistant.invitation.hidden,true);
  }
  assert.deepEqual([...seen].sort(),['bounce','nap','peek','shy','wander']);s.dom.window.close();
});

test('DVD motion reflects off screen edges, changes its muted color, pauses on hover, and ends',()=>{
  const s=setup();s.assistant.stopWalking();s.assistant.bounce();
  s.animate(2000);
  assert.ok(parseFloat(s.assistant.root.style.left)>20);
  assert.ok(s.assistant.root.style.getPropertyValue('--floppy-plastic'));
  s.assistant.root.dispatchEvent(new s.w.Event('pointerenter'));
  const frozen=[s.assistant.root.style.left,s.assistant.root.style.top];s.animate(2000);
  assert.deepEqual([s.assistant.root.style.left,s.assistant.root.style.top],frozen);
  s.assistant.root.dispatchEvent(new s.w.Event('pointerleave'));
  for(let i=0;i<30;i++){
    s.animate(500);const r=s.assistant.root.getBoundingClientRect();
    assert.ok(r.left>=12&&r.right<=988&&r.top>=46&&r.bottom<=628);
    assert.equal(s.assistant.invitation.hidden,true);
  }
  s.animate(12000);assert.equal(s.frames.size,0);assert.equal(s.assistant.mood,'still');s.dom.window.close();
});

function hover(s,pointerType='mouse') {
  const event=new s.w.MouseEvent('pointerenter',{clientX:460,clientY:345});
  Object.defineProperty(event,'pointerType',{value:pointerType});
  s.assistant.root.dispatchEvent(event);
}

test('shy mood makes one short dodge, stays catchable afterwards, and never evades touch or an actual press',()=>{
  const s=setup();s.assistant.stopWalking();s.assistant.moveTo(400,300);s.assistant.setMood('shy');
  hover(s);s.advance(220);s.animate(1000);
  assert.notEqual(s.assistant.root.style.left,'400px');assert.equal(s.assistant.mood,'still');
  assert.ok([...s.timers.values()].some(t=>t.delay===18000));assert.equal(s.assistant.invitation.hidden,true);
  s.assistant.button.click();assert.equal(s.assistant.invitation.hidden,false);s.dom.window.close();
  for(const input of ['touch','pen','press','keyboard']){
    const t=setup();t.assistant.stopWalking();t.assistant.moveTo(400,300);t.assistant.setMood('shy');
    hover(t,input==='press'||input==='keyboard'?'mouse':input);
    if(input==='press')t.assistant.button.dispatchEvent(new t.w.Event('pointerdown',{bubbles:true}));
    if(input==='keyboard')t.assistant.button.focus();
    t.advance(220);t.animate(1000);assert.equal(t.assistant.root.style.left,'400px');
    t.assistant.button.click();assert.equal(t.assistant.invitation.hidden,false);t.dom.window.close();
  }
});

// These little stages draw in whole pixels. Each returns the spot and pose for
// the real desktop assistant; the canvas only draws scenery and props.
const clamp = n => Math.max(0, Math.min(1, n));
const mix = (a, b, t) => a + (b - a) * t;
const beat = t => Math.floor(t * 16) % 2;
const ease = t => { t = clamp(t); return t*t*(3-2*t); };
const gait = ['stride', 'pass', 'step', 'rise'];
const worldNames = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
const travel = (s, from, to, y = s.floor) => {
  const x = mix(from, to, ease(s.t)) * s.w;
  const footfall = Math.floor(Math.abs(x-from*s.w)/4);
  return {x, y: y - (footfall%2), pose: gait[footfall%4], facing: to-from};
};
const work = (s, x, pose = 'offer') => ({x: s.w * x, y: s.floor, pose, facing: 1});

function stage(canvas, t, visiting, toy, age) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const floor = Math.round(h * .69);
  function box(color, x, y, width, height) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(width), Math.ceil(height));
  }
  function line(color, x, y, endX, endY, size = 1) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(endX - x), Math.abs(endY - y))));
    for (let i = 0; i <= steps; i++) box(color, mix(x, endX, i / steps), mix(y, endY, i / steps), size, size);
  }
  function wall(sky, ground) {
    box(sky, 0, 0, w, h);
    box(ground, 0, floor, w, h - floor);
  }
  function hills(sky, far, near, ground) {
    wall(sky, ground);
    for (let x = 25; x < w; x += 100) {
      const y = Math.round(h * (.15 + (x % 3) * .045));
      box('#e5e7d6', x, y, 18, 2); box('#e5e7d6', x + 4, y - 2, 8, 2);
    }
    for (let x = 0; x < w; x += 3) {
      const hill = 7 + Math.round(5 * Math.sin(x / 28) + 3 * Math.cos(x / 13));
      box(far, x, floor - hill - 5, 3, hill + 5);
      const ridge = 3 + Math.floor(3 * Math.sin(x / 17));
      box(near, x, floor - ridge, 3, ridge + 1);
    }
  }
  function stars() {
    box('#202940', 0, 0, w, h);
    for (let i = 0; i < w / 5; i++) {
      const x = (i * 83 + 11) % w, y = (i * 37 + 5) % h;
      box(i % 4 ? '#969db7' : '#f0e4b9', x, y, i % 4 ? 1 : 2, 1);
      if (i % 11 === 0) { box('#cccee0', x - 1, y, 4, 1); box('#cccee0', x, y - 1, 1, 3); }
    }
  }
  function disc(color, x, y, r) {
    for (let j = -r; j <= r; j++) {
      const half = Math.floor(Math.sqrt(r * r - j * j));
      box(color, x - half, y + j, 2 * half + 1, 1);
    }
  }
  function sheet(x, y, color = '#fff8d8') {
    box('#343746', x, y, 13, 10); box(color, x + 1, y + 1, 11, 8);
    box('#7b7a76', x + 3, y + 3, 7, 1); box('#7b7a76', x + 3, y + 6, 5, 1);
  }
  return {w, h, floor, t, visiting, toy, age, box, line, wall, hills, stars, disc, sheet};
}

const scenes = {
  research: ['Take Floppy for a swim', s => {
    const y = Math.max(19, Math.round(s.h * .36));
    s.wall('#e3dccc', '#75abb4');
    for (let row = -2; row < y - 3; row += 9) {
      s.box('#d5cfbf', 0, row, s.w, 1);
      for (let x = row % 2 ? 0 : 10; x < s.w; x += 21) s.box('#d5cfbf', x, row, 1, 9);
    }
    s.disc('#ab6c59', s.w * .12, y - 12, 6); s.disc('#e3dccc', s.w * .12, y - 12, 3);
    s.box('#eee3c5', s.w * .12 - 1, y - 18, 3, 3); s.box('#eee3c5', s.w * .12 - 1, y - 8, 3, 3);
    s.box('#bda987', 0, y - 3, s.w, 3);
    for (let x = 0; x < s.w; x += 16) s.box('#f5edda', x, y - 3, 14, 2);
    s.box('#5e9daa', 0, y, s.w, s.h - y);
    s.box('#a8d4cd', 0, y, s.w, 2);
    for (let row = y + 5; row < s.h; row += 10) {
      for (let x = (row * 7) % 31 - 30; x < s.w; x += 31) {
        const drift = Math.round(3 * Math.sin(s.t * 14 + row));
        s.box('#83b9c0', x + drift, row, 8, 1); s.box('#83b9c0', x + 8 + drift, row - 1, 3, 1);
      }
    }
    const ladder = s.w - 22;
    for (const x of [ladder, ladder + 10]) {
      s.box('#496778', x, y - 9, 3, 29); s.box('#e3e2cb', x, y - 10, 2, 28);
      s.box('#496778', x + 2, y - 11, 3, 2);
    }
    for (let i = 3; i < 20; i += 5) s.box('#d9ded3', ladder + 2, y + i, 10, 2);
    if (s.toy.aim != null) {
      const x=s.toy.aim*s.w;
      for(const dir of [-1,1]) s.line('#f9eed0',x+dir*5,y-5,x+dir*2,y-2);
    }
    const swim = Math.sin(s.t * Math.PI);
    const ball = s.toy.cue;
    const ms = ball ? Math.max(0,s.age-ball.start) : 0;
    const swimTo = ball ? ease((ms-170)/1320) : 0;
    const side = ball ? Math.sign(ball.to-ball.from)||1 : (s.t < .5 ? 1 : -1);
    const x = s.w * (ball ? mix(ball.from, ball.to, swimTo) : .24+.48*swim);
    const kick = Math.sin(s.age/145);
    const surface = y+4+kick;
    if (s.visiting) {
      for (let i=0;i<3;i++) {
        const wake=x-side*(6+i*5);
        s.box('#d9eee2',wake,y+4+(i%2)*2,5-i,1);
      }
      if (s.t < .10) for (const dir of [-1,1]) {
        const p = s.t/.10;
        s.box('#eef4de', x+dir*(7+19*p),y-2-Math.sin(p*Math.PI)*10,2,3);
      }
    }
    if (ball) {
      const flight=clamp(ms/490), nudge=ease((ms-1230)/620);
      const bx=mix(ball.launch,ball.to,flight)*s.w+side*(6+8*nudge);
      const by=y-2-4*flight*(1-flight)*Math.min(18,y-5)-Math.sin(nudge*Math.PI)*4;
      const ripple=clamp((ms-490)/620);
      if(ripple>0 && ripple<1) {
        for(const dir of [-1,1]) s.box('#d8ebe1',bx+dir*(6+12*ripple)-2,y+3,5,1);
      }
      s.disc('#584d55',bx,by,5); s.disc('#f5deab',bx,by,4);
      s.box('#b76d60',bx-1,by-3,3,7); s.box('#759aa9',bx+2,by-2,2,4);
    }
    return {x, y:surface, pose:kick>0?'paddle':'glide', facing:side, water:true};
  }],
  studies: ['Water the seed plot with Floppy', s => {
    s.hills('#d6dec4', '#a0b597', '#728c6f', '#b59065');
    const barn = s.w * .12;
    s.box('#925e4f', barn, s.floor - 15, 24, 15);
    for (let i = 0; i < 9; i++) s.box('#53586a', barn - 2 + i, s.floor - 15 - i, 28 - i * 2, 1);
    s.box('#654b44', barn + 9, s.floor - 9, 7, 9);
    for (let row = s.floor + 9; row < s.h; row += 10) {
      s.box('#987753', 0, row, s.w, 2);
      for (let x = row % 12; x < s.w; x += 19) s.box('#cba879', x, row + 2, 6, 1);
    }
    s.box('#e7d6ad', barn + 3, s.floor - 11, 4, 4);
    for (let x = s.w * .64; x < s.w; x += 10) {
      s.box('#a79473', x, s.floor - 9, 2, 8); s.box('#cbbd95', x, s.floor - 6, 10, 2);
    }
    const seed=s.toy.cue, ms=seed ? Math.max(0,s.age-seed.start) : 0;
    const actor=travel(s,.26,.77);
    const plantX=i=>.31+i*.072;
    let side=1, watering=s.visiting;
    if(seed) {
      side=Math.sign(plantX(seed.index)-seed.from)||1;
      const to=plantX(seed.index)-side*17/s.w;
      actor.x=mix(seed.from,to,ease(ms/900))*s.w;
      actor.facing=side;
      watering=s.visiting && ms>=900 && ms<2080;
      actor.pose=ms<900?gait[Math.floor(ms/110)%4]:watering?'offer':'lookout';
      if(ms>=1300) s.toy.garden.add(seed.index);
    }
    for (let i=0;i<7;i++) {
      const x=s.w*plantX(i), y=s.floor+4;
      const flower=s.toy.garden.has(i);
      const sprout=seed ? s.toy.sprouts.has(i) || flower : s.t>i/8+.02 || flower;
      if(s.visiting && !seed && sprout) s.toy.sprouts.add(i);
      if(s.toy.aim===i || (seed?.index===i && s.toy.aim==null)) {
        s.box('#70674e',x+7,y-9,1,8);s.box('#eee2ad',x+8,y-9,5,3);
      }
      s.box('#785c47',x-6,y,12,2);
      s.box('#4a7352',x,y-(sprout?8:2),2,sprout?8:2);
      if(sprout) {
        s.line('#54734c',x,y-3,x-4,y-7,2);
        if(!flower) continue;
        const petal=['#d3a252','#b76e69','#9293ba'][i%3];
        s.box(petal,x-2,y-10,6,3);s.box(petal,x,y-12,2,6);s.box('#f2d99b',x,y-10,2,2);
      }
    }
    if(s.visiting) {
      const hand=actor.x+side*8, tip=hand+side*11;
      s.box('#597b83',side>0?hand:hand-6,s.floor-10,7,6);
      s.line('#597b83',hand+side*5,s.floor-7,tip,s.floor-(watering?9:13),2);
      if(watering)for(let i=0;i<3;i++)s.box('#c1e4df',tip+side*i,s.floor-8+(i*3+Math.floor(s.age/100))%10,1,2);
    }
    return actor;
  }],
  welcome: ['Send planet Floppy around the Sun', s => {
    s.stars();
    const cx = s.w / 2, cy = s.h * .51;
    const sunRadius = Math.max(5, Math.min(15, Math.floor(s.h * .12)));
    const outerX = s.w * .47 - 4, outerY = s.h * .43;
    // Orbital lanes are compressed to fit a Finder window. Floppy takes
    // Earth's lane for one revolution and leaves Earth there on its return.
    const planets = [
      {lane: .06, color: '#b0a69b', r: 2, angle: .3, speed: 2.1},
      {lane: .16, color: '#dfbf86', r: 3, angle: 2.3, speed: 1.5},
      {lane: .34, color: '#87b9be', r: 4, angle: 3.3, speed: 1},
      {lane: .47, color: '#c77e67', r: 3, angle: .9, speed: .73},
      {lane: .60, color: '#cba385', r: 6, angle: 5.8, speed: .32},
      {lane: .74, color: '#c6b78b', r: 5, angle: 3.6, speed: .24},
      {lane: .87, color: '#8dbab4', r: 3, angle: 1.8, speed: .16},
      {lane: 1, color: '#718fb9', r: 3, angle: 4.8, speed: .12}
    ];
    const cue=s.toy.cue, chosen=cue?.index ?? 2;
    const blend=cue ? ease((s.age-cue.start)/620) : 1;
    const lanes=planets.map(p=>p.lane);
    const orbit=mix(cue?.fromLane ?? lanes[2],lanes[chosen],blend);
    const ellipse = lane => ({rx:mix(sunRadius+6,outerX,lane),ry:mix(sunRadius+3,outerY,lane)});
    const bodies = planets.map((planet, i) => {
      const {rx,ry}=ellipse(planet.lane);
      const samples=Math.max(40,Math.ceil(rx*1.6));
      for(let j=0;j<samples;j++) {
        const a=2*Math.PI*j/samples;
        s.box(i===s.toy.aim?'#bcb7a0':i===chosen?'#778399':'#354057',cx+rx*Math.cos(a),cy+ry*Math.sin(a),1,1);
      }
      const a=planet.angle+2*Math.PI*(s.age/6200)*planet.speed;
      return {...planet,i,x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)};
    });
    const a=planets[2].angle+2*Math.PI*s.age/6200;
    const {rx,ry}=ellipse(orbit);
    const guest={x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a),pose:'glide',facing:-Math.sin(a),planet:true,orbit};
    s.toy.rings=lanes.map(lane=>({...ellipse(lane),cx,cy,lane}));
    s.disc('#995e53', cx, cy, sunRadius + 1);
    s.disc('#e8aa57', cx, cy, sunRadius);
    s.disc('#f4cd79', cx - 1, cy - 1, Math.max(2, sunRadius - 2));
    s.box('#ffe5a1', cx - sunRadius * .5, cy - 3, sunRadius * .7, 2);
    for (const planet of bodies) {
      if(planet.i===chosen && s.visiting) continue;
      s.disc(planet.color, planet.x, planet.y, planet.r);
      s.box('#eee0b8', planet.x - planet.r / 2, planet.y - planet.r / 2, 2, 1);
      if (planet.i === 2) s.box('#679482', planet.x - 1, planet.y, 4, 2);
      if (planet.i === 4) s.box('#997967', planet.x - 5, planet.y + 1, 10, 2);
      if (planet.i === 5) s.line('#d6caa4', planet.x - 9, planet.y + 3, planet.x + 9, planet.y - 3);
    }
    guest.depth=.91+.12*Math.sin(a);
    if(s.visiting && chosen===5) s.line('#efe2b1',guest.x-10,guest.y+4,guest.x+11,guest.y-4,2);
    return guest;
  }],
  about: ['Trace a constellation with Floppy', s => {
    s.stars(); s.box('#394557', 0, s.floor + 1, s.w, s.h);
    const tx = s.w * .37;
    s.line('#c2bca2', tx, s.floor - 14, tx - 8, s.floor, 2); s.line('#c2bca2', tx, s.floor - 14, tx + 7, s.floor, 2);
    s.line('#91a9b4', tx - 9, s.floor - 12, tx + 8, s.floor - 21, 4);
    const dots = [[.52,.33],[.60,.20],[.69,.29],[.76,.15],[.83,.22]];
    dots.forEach(([x,y], i) => {
      if (i && s.t >= i / 6) s.line('#75899c', s.w*dots[i-1][0],s.h*dots[i-1][1],s.w*x,s.h*y);
      s.box('#f1dda1', s.w*x,s.h*y,2,2);
    });
    return work(s,.31,s.t<.18?'reach':s.t>.8?'waveUp':beat(s.t)?'lookout':'lookAcross');
  }],
  blog: ['Print a page with Floppy', s => {
    s.wall('#d6d0bb','#938774'); const x = s.w*.5, y=s.floor;
    s.box('#535c67',x-15,y-17,36,17); s.box('#adb2a6',x-17,y-14,40,8);
    s.box('#424955',x-10,y-16,27,2); s.box('#eee6cc',x-7,y-18-12*s.t,20,5+12*s.t);
    for(let i=0;i<Math.floor(5*s.t);i++) s.box('#656a70',x-4,y-18-i*2,13,1);
    const turn=s.t*Math.PI*10, handX=x-19+4*Math.cos(turn), handY=y-10+5*Math.sin(turn);
    s.line('#4b525a',x-16,y-9,handX,handY,2);s.disc('#6c625b',handX,handY,2);
    for(let i=0;i<3;i++) s.sheet(s.w*.73+i*2,y-9-i);
    return work(s,.5-31/s.w,handY<y-11?'reach':handY>y-8?'brace':'offer');
  }],
  hackathon: ['Launch a test rocket with Floppy', s => {
    s.hills('#c8d7d3','#a0b1ad','#798f8e','#838582');
    const x=s.w*.68, lift=clamp((s.t-.38)/.62), y=s.floor-3-lift*lift*(s.h+20);
    s.box('#5f6570',x-14,s.floor-3,28,3);
    s.box('#c66f55',x-3,y-22,6,5);s.box('#e7e0c6',x-4,y-17,8,14);s.box('#668b96',x-2,y-15,4,4);
    s.line('#aa5c50',x-4,y-6,x-7,y,2);s.line('#aa5c50',x+3,y-6,x+5,y,2);
    if(lift) {
      s.box('#e5b45e',x-2,y-3,4,6+beat(s.t)*3);
      const puff=clamp(lift*2.3);
      if(puff<1) for(const dir of [-1,1]) for(let i=0;i<3;i++)
        s.disc(i%2?'#dcdacb':'#b3b5ad',x+dir*(6+i*5+puff*17),s.floor-2-i*(1+puff),Math.max(1,Math.round(4*(1-puff))));
    }
    s.box('#52616a',s.w*.35,s.floor-7,14,7);s.box('#a2554e',s.w*.35+4,s.floor-9,4,2);
    return work(s,.35-8/s.w,s.t<.26?'reach':s.t<.40?'brace':s.t<.76?'lookout':'waveUp');
  }],
  updates: ['Tune the antenna with Floppy', s => {
    s.hills('#b4c5cb','#8ea3a7','#6b8687','#828f7a');
    const x=s.w*.56,y=s.floor;
    s.line('#52646a',x-7,y,x,y-28,2);s.line('#52646a',x+7,y,x,y-28,2);
    s.line('#e1ddbf',x-11,y-29,x+9,y-21,3);s.line('#65657a',x,y-24,x+7,y-32,2);
    for(let i=0;i<=Math.floor(s.t*4);i++){const k=4+i*4;s.line('#f4e4ae',x+10+k,y-26-k,x+13+k,y-23-k);}
    return work(s,.56-17/s.w,beat(s.t)?'reach':'lookout');
  }],
  sherlock: ['Follow the footprints with Floppy', s => {
    s.hills('#bab7a9','#a6a797','#838983','#b6ac92');
    for(let i=0;i<13;i++)s.box('#726b5e',s.w*(.19+i*.045),s.floor+3+i%2*3,3,2);
    const x=s.w*.80; s.disc('#c69852',x,s.floor-3,4);s.disc('#b6ac92',x,s.floor-3,2);s.box('#c69852',x+3,s.floor-4,8,2);s.box('#c69852',x+9,s.floor-2,2,3);
    const a=travel(s,.17,.74);return {...a,pose:beat(s.t)?'lookout':'step'};
  }],
  panels: ['Paint the swatches with Floppy', s => {
    s.wall('#dbd5c4','#a19883'); const colors=['#7975a2','#719296','#a5a1a0','#c59c79','#b4b995'];
    for(let i=0;i<5;i++){
      const x=s.w*(.18+i*.13), width=s.w*.105;
      s.box('#858278',x,s.floor-22,width,22);s.box('#ece6cf',x+1,s.floor-21,width-2,20);
      s.box(colors[i],x+2,s.floor-2-Math.floor(17*clamp(s.t*5-i)),width-4,1+Math.floor(17*clamp(s.t*5-i)));
    }
    const a=travel(s,.15,.77);
    if (s.visiting) s.box('#655e58',a.x+8,s.floor-15,2,10);
    if (s.visiting) s.box('#a76f58',a.x+5,s.floor-18,10,4);
    return {...a,pose:'reach'};
  }],
  scrapbook: ['Stamp the album with Floppy', s => {
    s.wall('#c7b79a','#aa9276');
    s.box('#756550',s.w*.16,s.floor-21,s.w*.68,28);s.box('#efe3bf',s.w*.17,s.floor-23,s.w*.66,28);
    s.box('#c7b993',s.w*.5,s.floor-23,1,28);
    for(let i=0;i<6;i++){
      const x=s.w*(.23+i*.095),y=s.floor-14+i%2*3;
      s.box('#cbbf9c',x-1,y-1,12,12);
      if(s.t>(i+.3)/6){s.box('#fcf0d3',x,y,10,10);s.box(i%2?'#7c9b8b':'#a97873',x+1,y+1,8,8);s.disc('#e6d28c',x+5,y+5,2);}
    }
    return {...travel(s,.18,.71),pose:beat(s.t)?'brace':'reach'};
  }],
  info: ['Examine a slide with Floppy', s => {
    s.wall('#c6d1c9','#91968c'); const x=s.w*.49,y=s.floor;
    s.box('#47565c',x-11,y-3,26,3);s.box('#65777a',x+5,y-24,4,21);s.box('#3b4b54',x-9,y-11,22,3);
    s.line('#516675',x-8,y-15,x,y-28,5);s.box('#d5e3ce',x-6+5*s.t,y-13,8,2);
    const lens=s.w*.74;s.disc('#566970',lens,y-13,15);s.disc('#e3e5bd',lens,y-13,13);
    for(let i=0;i<6;i++)s.disc('#849a77',lens-8+(i*7+Math.round(s.t*3))%16,y-21+i*3,2);
    return work(s,.49-14/s.w,'lookout');
  }],
  note: ['Fold and launch a paper plane with Floppy', s => {
    s.wall('#e4dbad','#bcb184'); const a=work(s,.26,'offer');
    const p=clamp((s.t-.26)/.74),x=a.x+9+p*s.w*.50,y=s.floor-10-12*Math.sin(p*Math.PI);
    if(!p)s.sheet(x,y-5);else{
      for(let i=0;i<15;i++)s.box(i%3?'#fff7d8':'#cec6ac',x+i,y+i*.18,1,Math.max(1,7-i/2));
      s.line('#888b8c',x,y+8,x+15,y+3);
    }
    return {...a,pose:p?'waveUp':'brace'};
  }],
  future: ['Build a bridge with Floppy', s => {
    s.hills('#c6d7d0','#91aca2','#759389','#859b79');
    const start=s.w*.27,end=s.w*.74;s.box('#749faa',start,s.floor,end-start,s.h);
    for(let i=0;i<12;i++){
      const x=mix(start,end,i/12), n=(end-start)/12;
      if(i>Math.floor(s.t*12))break;
      s.box('#755d50',x,s.floor-3,n,4);s.box('#ceb489',x,s.floor-3,n-1,2);
      if(i%3===0)s.box('#776854',x,s.floor,3,10);
    }
    return {...travel(s,.24,.73),pose:beat(s.t)?'brace':'offer'};
  }],
  resume: ['Climb the ridge with Floppy', s => {
    s.wall('#c9d8d4','#70847f');
    for(let x=0;x<s.w;x+=2){
      const y=s.floor-Math.max(0,1-Math.abs(x/s.w-.72)*1.8)*s.h*.32;
      s.box('#89a29a',x,y,2,s.h-y);s.box('#dce0c8',x,y,2,2);
    }
    const a=travel(s,.22,.72);a.y=s.floor-(1-Math.abs(a.x/s.w-.72)*1.8)*s.h*.32;
    const flag=s.w*.75;s.box('#525e62',flag,s.floor-s.h*.32-12,2,14);
    if(s.t>.82)s.box('#b77059',flag+2,s.floor-s.h*.32-12,9,5);
    return {...a,pose:s.t>.82?'waveUp':a.pose};
  }],
  contact: ['Deliver a letter with Floppy', s => {
    s.hills('#d2d9c6','#a8b59b','#859c83','#b3a488');
    const x=s.w*.77, y=s.floor;
    s.box('#7d6955',x+7,y-14,3,14);s.box('#566c80',x,y-24,19,12);s.box('#40526b',x-1,y-21,6,9);
    s.box('#a45c52',x+12,y-(s.t>.83?30:21),2,s.t>.83?11:2);s.box('#bb6e58',x+13,y-(s.t>.83?30:21),5,3);
    const a=travel(s,.20,.73);
    if(s.visiting && s.t<.85){s.sheet(a.x+7,a.y-13);s.line('#a38c76',a.x+8,a.y-12,a.x+13,a.y-8);s.line('#a38c76',a.x+13,a.y-8,a.x+18,a.y-12);}
    return {...a,pose:s.t>.78?'offer':a.pose};
  }],
  help: ['Signal from the lighthouse with Floppy', s => {
    s.wall('#8698ad','#5f8596'); const x=s.w*.31,y=s.floor;
    s.box('#cfbd9c',x-12,y-25,20,26);s.box('#aa6859',x-12,y-16,20,6);
    s.box('#465563',x-15,y-28,26,3);s.box('#dbc486',x-9,y-35,14,7);s.box('#565a68',x-12,y-37,20,2);
    const beamY=y-36+Math.round(Math.sin(s.t*7)*9);
    for(let i=0;i<3;i++)s.line('#e4d4a0',x+5,y-32,x+s.w*.48,beamY+i*3);
    return work(s,.31-23/s.w,beat(s.t)?'waveUp':'waveOut');
  }],
  reroute: ['Switch the tracks with Floppy', s => {
    s.hills('#d4dac6','#a7b59d','#8d9d80','#a99876'); const y=s.floor+2;
    s.line('#665f58',0,y,s.w,y,2);s.line('#dfcaaa',0,y+3,s.w,y+3);
    s.line('#685f58',s.w*.48,y,s.w*.83,y+16,2);
    const x=s.w*(.06+.77*s.t),drop=Math.max(0,(x/s.w-.48)/.35)*16;
    s.box('#a26554',x,y-8+drop,18,7);s.box('#657d7e',x+9,y-14+drop,7,7);
    for(const d of [4,14])s.disc('#3d454b',x+d,y+drop,2);
    s.line('#555f62',s.w*.48,y-2,s.w*.48+(s.t>.45?4:-4),y-12,2);
    return work(s,.44, s.t>.45?'waveUp':'offer');
  }],
  sound: ['Play the xylophone with Floppy', s => {
    s.wall('#bfc5c4','#92978f');const colors=['#a16b62','#be8a65','#c5ae72','#8aa486','#7b9ca0','#8d87a9'];
    s.box('#605d5c',s.w*.18,s.floor-4,s.w*.64,5);
    const strike=Math.min(5,Math.floor(s.t*6)),phase=s.t*6-strike;
    const tap=Math.sin(clamp(phase/.5)*Math.PI);
    for(let i=0;i<6;i++) {
      const x=s.w*(.20+i*.10), sunk=i===strike&&phase<.22?1:0;
      s.box(colors[i],x,s.floor-9+i*.6+sunk,s.w*.076,8);
      if(s.visiting&&i===strike&&phase<.35)s.box('#eee4c7',x+1,s.floor-8+i*.6+sunk,s.w*.076-2,1);
    }
    const keyX=s.w*(.235+strike*.10), tipY=s.floor-10+strike*.6-7*(1-tap);
    const a=travel(s,.18,.68);
    if(s.visiting) { s.line('#675d58',a.x+6,s.floor-12,keyX,tipY);s.disc('#e6d1a0',keyX,tipY,2); }
    if(s.t>0){const x=keyX+phase*6,y=s.floor-17-phase*9;s.disc('#52606b',x,y,2);s.box('#52606b',x+1,y-6,1,6);s.box('#52606b',x+2,y-6,3,1);}
    return {...a,pose:tap>.55?'offer':'reach'};
  }],
  evaluation: ['Balance the scales with Floppy', s => {
    s.wall('#d3d0bc','#a79f87');const x=s.w*.57,y=s.floor;
    const settle=Math.max(0,s.t-.46);
    const tilt=s.t<.46?4:Math.round(4*Math.cos(settle*26)*Math.exp(-settle*7));s.box('#636963',x-1,y-23,3,23);s.box('#74746a',x-10,y-2,21,3);
    s.line('#695e50',x-22,y-24+tilt,x+22,y-24-tilt,2);
    for(const side of [-1,1]){
      const px=x+22*side,py=y-24-side*tilt;
      s.line('#706e64',px,py,px-7,py+12);s.line('#706e64',px,py,px+7,py+12);s.box('#a88c58',px-8,py+12,17,3);
      if(side===1||s.t>.46)s.box('#7d8c9c',px-3,py+6,6,6);
    }
    return work(s,.57-36/s.w,s.t>.5?'lookout':'offer');
  }]
};

// Three landscapes are point-and-play toys. The others share a small film
// controller: the playhead directly winds both Floppy and the scenery.
const details = {
  research: ['Toss a ball', 'Toss a beach ball for Floppy'],
  studies: ['Water a seedling', 'Choose a seedling for Floppy to water'],
  welcome: ['Pick an orbit', 'Choose an orbit for planet Floppy'],
  about: ['Star chart'], blog: ['Printing press'], hackathon: ['Launch pad'],
  updates: ['Radio tower'], sherlock: ['Key hunt'], panels: ['Paint samples'],
  scrapbook: ['Stamp album'], info: ['Under the lens'], note: ['Paper plane'],
  future: ['Bridge works'], resume: ['Summit trail'], contact: ['Mail route'],
  help: ['Lighthouse'], reroute: ['Branch line'], sound: ['Xylophone'], evaluation: ['Balance scales']
};

export function mountWindowScene(win, floppy, activate) {
  const document = win.ownerDocument, view = document.defaultView, id = win.dataset.id;
  const [label, draw] = scenes[id], [caption, tool] = details[id];
  const slot = win.querySelector('.scene-slot');
  slot.innerHTML = `<button type="button" class="scene-play"><canvas aria-hidden="true"></canvas></button>
    <div class="scene-controls" role="group" aria-label="Scene controls">
      <span class="sr-only scene-feedback" role="status"></span>
      <button type="button" class="scene-transport"><i aria-hidden="true"></i><span></span></button>
      <span class="scene-caption"></span>
      <input type="range" class="scene-film" min="0" max="100" step="1" value="0" aria-label="Scene playhead">
    </div>`;
  const button=slot.querySelector('.scene-play'), canvas=button.firstElementChild;
  const transport=slot.querySelector('.scene-transport'), text=transport.lastElementChild;
  const film=slot.querySelector('.scene-film'), hint=slot.querySelector('.scene-caption');
  const feedback=slot.querySelector('.scene-feedback');
  const toy={garden:new Set(), sprouts:new Set(), cue:null, aim:null};
  let played=false, timer, progress=0, age=0, actor, mode='idle', onStage=false;
  let choice='', keyboardTurn=0;
  if(tool) button.setAttribute('aria-description','Click a spot, or press Enter to choose the next target.');
  film.title='Drag to wind the scene, or use the arrow keys.';
  function controls(next=mode) {
    mode=next;
    const manual=!floppy.motion() || floppy.root?.hidden;
    const action=manual?'Step':mode==='playing'?'Pause':mode==='paused'?'Resume':played?'Replay':'Play';
    transport.dataset.transport=action.toLowerCase();
    button.setAttribute('aria-label',tool || (action==='Play'?label:action+' scene: '+caption));
    text.textContent=action;
    transport.setAttribute('aria-label',action+' · '+label);
    hint.textContent = id==='welcome' && toy.aim!=null ? worldNames[toy.aim]+' orbit'
      : id==='studies' && toy.aim!=null ? 'Seedling '+(toy.aim+1)+' of 7' : choice || caption;
    button.title=tool || (action+' · '+caption);
  }
  controls();
  function paint(t, visiting=false, clock=t*6200) {
    progress=t; age=clock; onStage=visiting;
    const r=button.getBoundingClientRect();
    // A DOM-less renderer can use the slot geometry as its drawing surface.
    const box=r.width && r.height ? r : slot.getBoundingClientRect();
    const unit=Math.max(1,Math.min(3,box.height/68,box.width/175));
    const width=Math.max(1,Math.round(box.width/unit)), height=Math.max(1,Math.round(box.height/unit));
    if(canvas.width!==width || canvas.height!==height) {canvas.width=width;canvas.height=height;}
    actor=draw(stage(canvas,t,visiting,toy,clock));
    const value=String(Math.round(t*100));
    if(film.value!==value) film.value=value;
    const size=actor.planet?Math.max(21,Math.min(52,unit*17*(actor.depth??1))):Math.max(32,Math.min(80,unit*26+10));
    return {...actor,size,x:box.left+actor.x*box.width/width,y:box.top+actor.y*box.height/height};
  }
  function visible() {
    if(!win.isConnected || !win.classList.contains('active') || slot.clientHeight<64 || slot.clientWidth<140) return false;
    const r=slot.getBoundingClientRect(), frame=win.closest('#screen-stage').getBoundingClientRect();
    const viewport=slot.parentElement.getBoundingClientRect();
    return r.top>=Math.max(viewport.top,frame.top+29)-2 && r.bottom<=Math.min(viewport.bottom,frame.bottom)+2;
  }
  const scene={paint,visible,playback:controls,leave() {
    onStage=false;
    if(slot.clientHeight>=64 && slot.clientWidth>=140) paint(progress,false,age);
    controls('idle');
  }};
  function visit(invited=false, stillAt) {
    if(!visible()) return false;
    if(floppy.visitScene(scene,invited,stillAt)) { played=true; return true; }
    return false;
  }
  function seek(t) {
    played=true;
    if(floppy.scene===scene) floppy.sceneControl('seek',t);
    else if(!visit(true,t)) {paint(t);controls();}
  }
  function prepare() {
    if(!win.classList.contains('active')) activate();
    view.clearTimeout(timer);
    return visible();
  }
  function toggle() {
    if(!prepare()) return;
    if(!floppy.motion() || floppy.root?.hidden) {
      seek(progress>=.999?0:Math.min(1,progress+.125));
    } else if(floppy.scene===scene) {
      floppy.sceneControl(mode==='playing'?'pause':'resume');
    } else {
      toy.cue=null;choice='';visit(true);
    }
  }
  function pointerChoice(event) {
    const rect=button.getBoundingClientRect();
    if(!rect.width || !rect.height) return null;
    const px=clamp((event.clientX-rect.left)/rect.width), py=clamp((event.clientY-rect.top)/rect.height);
    if(id==='research') return Math.max(.10,Math.min(.90,Math.round(px*100)/100));
    if(id==='studies') return Math.round(6*clamp((px-.31)/.432));
    const rings=toy.rings;
    if(!rings) return null;
    const dx=px*canvas.width-rings[0].cx, dy=py*canvas.height-rings[0].cy;
    // Pick the nearest ring along the ray from the Sun through the pointer.
    const distance=r=>Math.abs(1-1/(Math.hypot(dx/r.rx,dy/r.ry)||.001));
    return rings.indexOf(rings.reduce((a,b)=>distance(a)<=distance(b)?a:b));
  }
  function aim(value) {
    if(toy.aim===value) return;
    toy.aim=value;
    controls();
    if(visible()) paint(progress,onStage,age);
  }
  function interact(event) {
    if(!tool) {toggle();return;}
    if(!prepare()) return;
    button.focus({preventScroll:true});
    const target=event.detail ? pointerChoice(event) : null;
    if(target==null) toy.aim=null;
    const active=floppy.scene===scene;
    const manual=!floppy.motion() || floppy.root?.hidden;
    const start=manual?(active?age:3100)-2300:active?age:0;
    if(id==='research') {
      const to=target ?? [.75,.28,.57][keyboardTurn++%3];
      const from=active&&actor?actor.x/canvas.width:.24;
      toy.cue={start,from,to,launch:to>.5 ? .18 : .82};
      choice='Fetch the ball!';
    } else if(id==='studies') {
      const index=target ?? keyboardTurn++%7;
      toy.cue={start,index,from:active&&actor?actor.x/canvas.width:.26};
      choice='Seedling '+(index+1)+' of 7';
    } else {
      const rings=toy.rings;
      if(!rings) return;
      const index=target ?? ((toy.cue?.index??2)+1)%8;
      toy.cue={start,index,fromLane:active&&actor?actor.orbit:rings[2].lane};
      choice=worldNames[index]+' orbit';
    }
    feedback.textContent=choice;
    if(manual) {
      if(active) floppy.sceneControl('seek',progress);
      else if(!visit(true,.5)) {played=true;paint(.5,false,3100);}
    } else if(active) floppy.sceneControl('interact');
    else visit(true);
    controls();
  }
  function refresh() {
    view.clearTimeout(timer);
    const room=slot.clientHeight>=64 && slot.clientWidth>=140;
    slot.classList.toggle('revealed',room);
    if(floppy.scene===scene && !visible()) floppy.finishMood();
    if(!room) {played=false;progress=0;age=0;choice='';toy.cue=null;toy.aim=null;return;}
    controls();
    if(floppy.scene===scene && mode==='paused') floppy.sceneControl('redraw');
    else if(!floppy.motion() && !played) paint(1);
    else paint(progress,floppy.scene===scene && onStage,age);
    if(!played && visible() && floppy.motion() && !floppy.root?.hidden) timer=view.setTimeout(()=>visit(),620);
  }
  if(tool) {
    button.addEventListener('pointermove',e=>{if(e.pointerType==='mouse' && !e.buttons) aim(pointerChoice(e));});
    button.addEventListener('pointerleave',()=>aim(null));
  }
  button.addEventListener('click',interact);
  transport.addEventListener('click',toggle);
  film.addEventListener('input',()=>{const t=Number(film.value)/100;if(prepare())seek(t);});
  const observer=new view.ResizeObserver(refresh);
  observer.observe(slot);
  floppy.root?.addEventListener('floppyvisibilitychange',refresh);
  slot.parentElement.addEventListener('scroll',refresh,{passive:true});
  const frame=win.closest('#screen-stage');
  frame.addEventListener('scroll',refresh,{passive:true});
  return {refresh,destroy(){
    view.clearTimeout(timer);observer.disconnect();
    floppy.root?.removeEventListener('floppyvisibilitychange',refresh);
    frame.removeEventListener('scroll',refresh);
    slot.parentElement.removeEventListener('scroll',refresh);
    if(floppy.scene===scene) floppy.finishMood();
  }};
}

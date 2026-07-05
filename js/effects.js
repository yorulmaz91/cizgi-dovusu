/* ============================================================
   EFEKTLER — parçacıklar, patlamalar, hayaletler, mürekkep modu
   ve ekran geneli durum (sarsıntı, vuruş durması, zaman, flaş)
   ============================================================ */
import {rnd} from './utils.js';
import {GROUND} from './render.js';

/* mürekkep modu — fatality'de tersine döner */
export let INK='#1A1A1A', PAPER='#F5F4F0';
export function setInverted(on){INK=on?'#F2F1ED':'#1A1A1A';PAPER=on?'#161616':'#F5F4F0';}

/* ekran geneli efekt durumu: sarsıntı, vuruş durması, zaman ölçeği, beyaz flaş */
export const screenFx={shake:0,hitstop:0,timeScale:1,flashT:0};

export let particles=[];
export function spark(x,y,n=8,pow=1){ // mürekkep sıçraması
  for(let i=0;i<n;i++)particles.push({
    x,y,vx:rnd(-220,220)*pow,vy:rnd(-260,60)*pow,
    life:rnd(.25,.55),t:0,r:rnd(1.5,4)
  });
}
export function floatText(x,y,txt){particles.push({x,y,vx:0,vy:-70,life:.7,t:0,txt});}
export function floatBig(x,y,txt){particles.push({x,y,vx:0,vy:-40,life:.65,t:0,txt,big:1,rot:rnd(-.16,.16)});}
export let bursts=[]; // çizgi roman patlama yıldızları
export function burst(x,y,r,txt){
  bursts.push({x,y,r,t:0,life:.35,seed:Math.random()*7});
  if(txt)floatBig(x,y-r-14,txt);
}
export let ghosts=[]; // ardıl görüntüler (dash izleri)
export function dust(x,y,dir){ // toz bulutu
  particles.push({x,y,vx:-dir*40+rnd(-12,12),vy:rnd(-34,-10),life:rnd(.3,.5),t:0,r:rnd(2,4.5),smoke:1});
}
export function drawMiniBolt(g,x,y){
  g.save();g.globalAlpha=.55;g.strokeStyle=INK;g.lineWidth=1.6;g.lineCap='round';
  g.beginPath();g.moveTo(x,y);
  let cx=x,cy=y;
  for(let i=0;i<3;i++){cx+=rnd(-9,9);cy+=rnd(4,9);g.lineTo(cx,cy);}
  g.stroke();g.restore();
}
export function drawStunMark(f){ // sersemleme yıldızcıkları
  particles.push({x:f.x+rnd(-18,18),y:f.y-118+rnd(-8,8),vx:rnd(-20,20),vy:-30,life:.5,t:0,txt:'✦'});
}

/* ardıl görüntüler (dash hayaletleri) — dövüş sahnesinde dövüşçülerden önce çizilir */
export function drawGhosts(g,dt){
  ghosts=ghosts.filter(gh=>{
    gh.t+=dt||.016;if(gh.t>gh.life)return false;
    g.save();g.globalAlpha=(1-gh.t/gh.life)*.16;
    g.strokeStyle=INK;g.lineWidth=3;g.lineCap='round';
    g.beginPath();g.arc(gh.x,GROUND-92,20,0,7);g.stroke();
    g.beginPath();
    g.moveTo(gh.x,GROUND-72);g.lineTo(gh.x,GROUND-46);
    g.moveTo(gh.x,GROUND-46);g.lineTo(gh.x-12,GROUND-4);
    g.moveTo(gh.x,GROUND-46);g.lineTo(gh.x+12,GROUND-4);
    g.stroke();g.restore();return true;
  });
}

/* patlama yıldızları */
export function drawBursts(g,dt){
  bursts=bursts.filter(b=>{
    b.t+=dt||.016;if(b.t>b.life)return false;
    const k=b.t/b.life, r=b.r*(1+k*.6);
    g.save();g.globalAlpha=1-k;g.translate(b.x,b.y);g.rotate(b.seed);
    g.fillStyle=PAPER;g.strokeStyle=INK;g.lineWidth=2;g.lineJoin='round';
    g.beginPath();
    const n=9;
    for(let i=0;i<n*2;i++){
      const a=i*Math.PI/n, rr=i%2?r*.45:r;
      g[i?'lineTo':'moveTo'](Math.cos(a)*rr,Math.sin(a)*rr);
    }
    g.closePath();g.fill();g.stroke();
    g.restore();return true;
  });
}

/* parçacıklar (mürekkep damlaları / duman / yazılar) */
export function drawParticles(g,dt){
  particles=particles.filter(p=>{
    p.t+=dt||.016;if(p.t>p.life)return false;
    p.x+=p.vx*(dt||.016);p.y+=p.vy*(dt||.016);p.vy+=400*(dt||.016)*(p.txt?0:1);
    const a=1-p.t/p.life;
    g.globalAlpha=p.smoke?a*.4:a;
    if(p.txt){
      g.save();g.translate(p.x,p.y);
      if(p.rot)g.rotate(p.rot);
      g.font=p.big?'700 34px Space Grotesk':'700 17px Space Grotesk';
      g.textAlign='center';
      if(p.big){g.strokeStyle=PAPER;g.lineWidth=6;g.lineJoin='round';g.strokeText(p.txt,0,0);}
      g.fillStyle=INK;g.fillText(p.txt,0,0);
      g.restore();
    }
    else{g.fillStyle=INK;g.beginPath();g.arc(p.x,p.y,p.r,0,7);g.fill();}
    g.globalAlpha=1;return true;
  });
}

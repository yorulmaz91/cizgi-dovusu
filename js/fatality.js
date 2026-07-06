/* ============================================================
   FATALITY — kazanan karaktere göre bitirme sahneleri
   (ekran bu sırada negatife döner, zaman yavaşlar)
   ============================================================ */
import {rnd,lerp} from './utils.js';
import {GROUND,drawBolt} from './render.js';
import {INK,screenFx,setInverted,spark,floatText,particles} from './effects.js';
import {game} from './main.js';
import * as sfx from './audio.js';

export function updateFatality(dt){
  const F=game.fatal;F.t+=dt;
  const w=F.w,l=F.l,id=w.ch.id;
  if(id==='golge'){
    if(F.t<1.2){const k=(F.t%0.4)/0.4;w.x=lerp(l.x-140*w.facing,l.x+140*w.facing,k);if(k>.45&&k<.55)spark(l.x,l.y-70,3);}
    else w.x=l.x-90*w.facing;
    if(F.t>1.3&&!F.shade){F.shade={y:0,a:1};screenFx.shake=8;}
    if(F.shade){F.shade.y+=dt*60;F.shade.a-=dt*.5;}
    if(F.t>3)endFatality();
  }
  if(id==='beton'){
    if(F.t<0.5)w.x=lerp(w.x,l.x-70*w.facing,dt*8);
    if(F.t>0.6&&!F.slam){F.slam=true;screenFx.shake=18;spark(l.x,GROUND,22,1.5);}
    if(F.slam){F.sink=Math.min(52,(F.sink||0)+dt*70);l.y=GROUND+F.sink;}
    if(F.t>1.5&&F.t<2.6){
      const hop=Math.abs(Math.sin((F.t-1.5)*9));
      w.x=l.x;w.y=GROUND-hop*40;
      const si=Math.floor((F.t-1.5)*3);
      if(hop<.1&&!F['st'+si]){F['st'+si]=1;screenFx.shake=10;spark(l.x,GROUND,8);}
    }else if(F.t>=2.6)w.y=GROUND;
    if(F.t>3.2)endFatality();
  }
  if(id==='volt'){
    [0.3,0.8,1.3].forEach((m,i)=>{
      if(F.t>m&&!F['b'+i]){F['b'+i]=1;F.xray=.22;screenFx.shake=12;screenFx.flashT=.1;}
    });
    if(F.xray>0)F.xray-=dt;
    if(F.t>1.8&&!F.smoke)F.smoke=1;
    if(F.smoke&&Math.random()<.3)particles.push({x:l.x+rnd(-10,10),y:l.y-rnd(20,100),vx:rnd(-10,10),vy:-40,life:.8,t:0,r:rnd(3,7),smoke:1});
    if(F.t>3)endFatality();
  }
  if(id==='kalem'){ // TEMİZ SAYFA: silgi tepeden inerek rakibi baştan aşağı siler
    if(F.t<.5)w.x=lerp(w.x,l.x-72*w.facing,dt*8);
    else{
      F.eraseY=(F.eraseY??(l.y-170))+dt*80;             // silgi çizgisi aşağı iner
      w.x=l.x-72*w.facing+Math.sin(F.t*16)*9;           // sürtme sallanışı
      if(Math.random()<.6)particles.push({x:l.x+rnd(-26,26),y:(F.eraseY)+rnd(-6,6),vx:rnd(-20,20),vy:rnd(10,45),life:rnd(.4,.8),t:0,r:rnd(1.5,3),smoke:1}); // kırıntılar
      if(Math.random()<.2)screenFx.shake=3;
      if(F.eraseY>GROUND-6&&!F.bitti){F.bitti=1;l.hidden=true;} // tamamen silindi
    }
    if(F.t>3.1)endFatality();
  }
}
function endFatality(){
  screenFx.timeScale=1;setInverted(false);
  sfx.fatalityEnd();
  const F=game.fatal;
  F.l.setState('ko');F.l.y=GROUND+(F.sink||0);
  game.fatal=null;game.finishing=false;
  floatText(F.w.x,F.w.y-170,F.w.ch.fatalName);
  game.fatalLoser=F.l;game.fatalWinner=F.w;
  game.endRound();
}
export function drawFatalityFx(g){
  const F=game.fatal;if(!F)return;
  const l=F.l,id=F.w.ch.id;
  F.w.draw(g);
  if(id==='kalem'&&F.eraseY!=null){
    // kurban yalnızca silgi çizgisinin ALTINDAN itibaren çizilir (üstü silinmiş)
    if(!l.hidden){
      g.save();g.beginPath();
      g.rect(l.x-100,F.eraseY,200,GROUND+60-F.eraseY);
      g.clip();F.l.draw(g);g.restore();
      g.save();g.strokeStyle=INK;g.globalAlpha=.5;g.lineWidth=2;
      g.setLineDash([5,4]);
      g.beginPath();g.moveTo(l.x-56,F.eraseY);g.lineTo(l.x+56,F.eraseY);g.stroke();
      g.restore();
    }
  }else F.l.draw(g);
  if(id==='golge'&&F.shade&&F.shade.a>0){
    g.save();g.globalAlpha=Math.max(0,F.shade.a);
    g.strokeStyle=INK;g.lineWidth=4;g.lineCap='round';
    const y=l.y-F.shade.y;
    g.beginPath();g.arc(l.x,y-108,14,0,7);g.stroke();
    g.beginPath();g.moveTo(l.x,y-94);g.lineTo(l.x,y-56);
    g.moveTo(l.x,y-86);g.lineTo(l.x-20,y-62);g.moveTo(l.x,y-86);g.lineTo(l.x+20,y-62);
    g.moveTo(l.x,y-56);g.lineTo(l.x-16,y-22);g.moveTo(l.x,y-56);g.lineTo(l.x+16,y-22);
    g.stroke();g.restore();
  }
  if(id==='volt'&&F.xray>0){
    drawBolt(g,l.x,0,l.x,l.y-110);
    g.save();g.strokeStyle=INK;g.lineWidth=3;g.lineCap='round';
    const y=l.y;
    g.beginPath();g.arc(l.x,y-100,13,0,7);g.stroke();
    g.beginPath();
    for(let i=0;i<4;i++){g.moveTo(l.x-11,y-80+i*9);g.lineTo(l.x+11,y-80+i*9);}
    g.moveTo(l.x,y-88);g.lineTo(l.x,y-40);
    g.moveTo(l.x,y-40);g.lineTo(l.x-13,y-4);g.moveTo(l.x,y-40);g.lineTo(l.x+13,y-4);
    g.stroke();g.restore();
  }
  if(id==='beton'){
    g.save();g.strokeStyle=INK;g.lineWidth=2;
    for(let i=0;i<5;i++){g.beginPath();g.moveTo(l.x,GROUND);g.lineTo(l.x+(i-2)*46,GROUND+16+Math.abs(i-2)*6);g.stroke();}
    g.restore();
  }
}

/* ============================================================
   ÇİZGİ DÖVÜŞÜ v2 — siyah-beyaz karikatür stili
   Klavye: ← → hareket · Z yumruk · X tekme · C blok · V skil
   ANA MODÜL — oyun akışı (sahne yönetimi) + ana döngü
   ============================================================ */
import {rnd} from './utils.js';
import {ctx,VW,VH,drawBG} from './render.js';
import {keys} from './input.js';
import {CHARS} from './characters.js';
import {Fighter} from './fighter.js';
import {PAPER,screenFx,setInverted,burst,drawGhosts,drawBursts,drawParticles} from './effects.js';
import {updateFatality,drawFatalityFx} from './fatality.js';
import {drawHUD,centerText,drawSelect,drawVS,drawResult,armResultLock,resetResultLock} from './ui.js';

/* ---------------- oyun akışı ---------------- */
export const game={
  scene:'select',selIdx:0,selCd:0,
  p1:null,p2:null,round:1,wins:[0,0],timer:60,
  splash:null,splashT:0,finishing:false,finishT:0,fatal:null,
  start(chIdx){
    const pc=CHARS[chIdx];
    let ei=Math.floor(Math.random()*CHARS.length);
    if(ei===chIdx)ei=(ei+1)%CHARS.length;
    this.pCh=pc;this.eCh=CHARS[ei];
    this.wins=[0,0];this.round=1;
    this.newRound();
    this.scene='vs';this.splashT=0;
  },
  rematch(){
    Object.keys(keys).forEach(k=>keys[k]=0);
    this.wins=[0,0];this.round=1;
    this.newRound();
    this.scene='vs';this.splashT=0;
  },
  newRound(){
    this.p1=new Fighter(this.pCh,VW*0.28,1,false);
    this.p2=new Fighter(this.eCh,VW*0.72,-1,true);
    this.timer=60;this.finishing=false;this.fatal=null;
    this.splash='ROUND '+this.round;this.splashT=0;
  },
  finishHim(winner,loser){
    this.finishing=true;this.finishT=0;
    loser.setState('hit');loser.stun=99;
    burst(loser.x,loser.y-80,42,'K.O.!');
    screenFx.shake=14;
    this.fatalWinner=winner;this.fatalLoser=loser;
  },
  doFatality(){
    this.fatal={t:0,w:this.fatalWinner,l:this.fatalLoser};
    this.fatal.w.setState('fatalP');this.fatal.l.setState('fatalV');
    screenFx.timeScale=.4;setInverted(true);
  },
  koFinish(){
    this.fatalLoser.setState('ko');this.finishing=false;
    this.endRound();
  },
  endRound(){
    const pWon=this.fatalLoser===this.p2;
    this.wins[pWon?0:1]++;
    this.splash=pWon?'KAZANDIN':'KAYBETTİN';this.splashT=0;
    setTimeout(()=>{
      if(this.wins[0]>=2||this.wins[1]>=2){this.scene='result';}
      else{this.round++;this.newRound();}
    },1900);
  }
};

/* ---------------- ana döngü ---------------- */
let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  let dt=Math.min(.033,(now-last)/1000);last=now;

  if(screenFx.hitstop>0){screenFx.hitstop-=dt;dt=0;}
  dt*=screenFx.timeScale;

  const g=ctx;
  g.save();
  if(screenFx.shake>0){screenFx.shake=Math.max(0,screenFx.shake-40*.016);g.translate(rnd(-screenFx.shake,screenFx.shake),rnd(-screenFx.shake,screenFx.shake));}

  if(game.scene==='select'){drawSelect(g,.016);document.getElementById('controls').classList.add('on');}
  else if(game.scene==='vs')drawVS(g,.016);
  else if(game.scene==='result'){drawResult(g);armResultLock();}
  else if(game.scene==='fight'){
    resetResultLock();keys.any=0;
    drawBG(g);
    if(game.fatal){
      updateFatality(dt);
      drawFatalityFx(g);
    }else{
      if(!game.finishing){
        game.timer-=dt;
        if(game.timer<=0){
          const l=game.p1.hp<=game.p2.hp?game.p1:game.p2;
          game.finishHim(l===game.p1?game.p2:game.p1,l);
          game.koFinish();
        }
        game.p1.update(dt,game.p2);
        game.p2.update(dt,game.p1);
      }else{
        game.finishT+=dt;
        const winnerIsPlayer=game.fatalWinner===game.p1;
        if(winnerIsPlayer&&keys.special){game.doFatality();keys.special=0;}
        if(!winnerIsPlayer&&game.finishT>1&&!game.fatal){Math.random()<.7?game.doFatality():game.koFinish();}
        if(game.finishT>2.5&&!game.fatal)game.koFinish();
      }
      // ardıl görüntüler (dash hayaletleri)
      drawGhosts(g,dt);
      game.p1.draw(g);game.p2.draw(g);
      if(game.finishing&&!game.fatal){
        centerText(g,'BİTİR ONU!',42,VH*0.33,
          game.fatalWinner===game.p1?'SKİL tuşuna bas → FATALITY':'');
      }
    }
    drawHUD(g);
    if(game.splash&&game.splashT<1.4){
      game.splashT+=.016;
      centerText(g,game.splash,44,VH*0.4,game.splashT<.7?'':'DÖVÜŞ!');
    }
  }

  // patlama yıldızları + parçacıklar (her sahnede çizilir)
  drawBursts(g,dt);
  drawParticles(g,dt);
  if(screenFx.flashT>0){screenFx.flashT-=dt||.016;g.fillStyle=PAPER;g.globalAlpha=screenFx.flashT*6;g.fillRect(0,0,VW,VH);g.globalAlpha=1;}
  g.restore();
}
requestAnimationFrame(loop);

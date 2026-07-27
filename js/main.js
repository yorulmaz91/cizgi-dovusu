/* ============================================================
   ÇİZGİ DÖVÜŞÜ v2 — siyah-beyaz karikatür stili
   Klavye: ← → hareket · Z yumruk · X tekme · C blok · V skil
   ANA MODÜL — oyun akışı (sahne yönetimi) + ana döngü
   ============================================================ */
import {rnd} from './utils.js';
import {ctx,VW,VH,drawBG} from './render.js';
import {keys,tap} from './input.js';
import {CHARS} from './characters.js';
import {Fighter} from './fighter.js';
import {PAPER,screenFx,setInverted,burst,drawGhosts,drawBursts,drawParticles} from './effects.js';
import {updateFatality,drawFatalityFx} from './fatality.js';
import {drawHUD,centerText,drawSelect,drawDifficulty,drawVS,drawResult,drawTrainPanel,armResultLock,resetResultLock} from './ui.js';
import {loadSprites,spriteTick} from './sprites.js';
import * as sfx from './audio.js';

/* ---------------- oyun akışı ---------------- */
export const game={
  scene:'select',selIdx:0,selCd:0,movePanel:false,
  selCharIdx:0,diffIdx:1,difficulty:'normal',
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
    sfx.koBlast();
    this.fatalWinner=winner;this.fatalLoser=loser;
  },
  doFatality(){
    this.fatal={t:0,w:this.fatalWinner,l:this.fatalLoser};
    this.fatal.w.setState('fatalP');this.fatal.l.setState('fatalV');
    screenFx.timeScale=.4;setInverted(true);
    sfx.fatalityStart();
  },
  koFinish(){
    this.fatalLoser.setState('ko');this.finishing=false;
    this.endRound();
  },
  /* ---------------- antrenman modu ---------------- */
  startTraining(chIdx){
    this.pCh=CHARS[chIdx];this.eCh=CHARS[(chIdx+1)%CHARS.length];
    this.wins=[0,0];
    this.p1=new Fighter(this.pCh,VW*0.32,1,false);
    this.p2=new Fighter(this.eCh,VW*0.64,-1,true);
    this.finishing=false;this.fatal=null;
    this.trainState='serbest';this.trainIdx=0;this.trainPanel=true;this.trainT=0;
    const self=this;
    this.p2.ai=()=>{ // kukla: AI kapalı, yalnız seçili duruşu tutar
      const s=self.trainState;
      return {left:0,right:0,up:0,down:(s==='crouch'||s==='crouchblock')?1:0,
              punch:0,kick:0,block:(s==='block'||s==='crouchblock')?1:0,special:0};
    };
    const b=document.getElementById('trnDummy');if(b)b.textContent='KUKLA: SERBEST';
    this.scene='training';this.splash='ANTRENMAN';this.splashT=0;
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
/* kayıtlı zorluk tercihini yükle */
try{const z=localStorage.getItem('cd-zorluk');if(['kolay','normal','zor'].includes(z))game.difficulty=z;}catch(e){}

/* ---------------- antrenman düğmeleri (test sayfalarında olmayabilir) ---------------- */
const DUMMY_DURUM=[['serbest','SERBEST'],['block','AYAKTA BLOK'],['crouchblock','ÇÖMELİK BLOK'],['crouch','ÇÖMELME']];
const trnUI=document.getElementById('trainUI');
const trnDummy=document.getElementById('trnDummy');
if(trnDummy)trnDummy.addEventListener('click',()=>{
  game.trainIdx=((game.trainIdx||0)+1)%DUMMY_DURUM.length;
  game.trainState=DUMMY_DURUM[game.trainIdx][0];
  trnDummy.textContent='KUKLA: '+DUMMY_DURUM[game.trainIdx][1];
});
const trnList=document.getElementById('trnList');
if(trnList)trnList.addEventListener('click',()=>{game.trainPanel=!game.trainPanel;});
/* GÖSTERİ: tekme + yumruk zincirlerini yavaş çekimde otomatik oynatır
   (tuş ritmi gerekmez — animasyonları izlemek için) */
const trnDemo=document.getElementById('trnDemo');
if(trnDemo)trnDemo.addEventListener('click',()=>{
  if(game.scene!=='training')return;
  game.demo={sira:['k','p','ck','cp'],i:0,bekle:.2};
});
/* SPRITE PİLOTU anahtarı: açıkken oyuncu sprite karelerle çizilir (salt görsel) */
const trnSprite=document.getElementById('trnSprite');
if(trnSprite)trnSprite.addEventListener('click',()=>{
  game.spriteOn=!game.spriteOn;
  if(game.spriteOn)loadSprites(); // kareler ilk açılışta bir kez yüklenir
  trnSprite.textContent='SPRITE: '+(game.spriteOn?'AÇIK':'KAPALI');
});
const trnExit=document.getElementById('trnExit');
if(trnExit)trnExit.addEventListener('click',()=>{
  game.scene='select';game.selCd=.3;
  game.demo=null;screenFx.timeScale=1; // gösteri yarıda kaldıysa hızı geri al
});

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

  if(trnUI)trnUI.classList.toggle('on',game.scene==='training');
  if(game.scene==='select'){drawSelect(g,.016);document.getElementById('controls').classList.add('on');}
  else if(game.scene==='difficulty')drawDifficulty(g,.016);
  else if(game.scene==='training'){
    resetResultLock();keys.any=0;
    drawBG(g);
    // GÖSTERİ sürücüsü: zinciri kendisi basar, ağır çekimde oynar
    if(game.demo){
      const d=game.demo,p=game.p1;
      screenFx.timeScale=.42;
      if(p.state==='attack'){if(p.chain&&p.chain[p.chainIdx+1])p.queued=1;}
      else if(!p.busy()){
        d.bekle-=dt;
        if(d.bekle<=0){
          if(d.i<d.sira.length){
            p.x=Math.max(80,Math.min(VW-80,game.p2.x-p.facing*95)); // hep menzilde
            const kalem=d.sira[d.i++];
            if(kalem==='ck')p.startSingle(p.ch.moves.ck,'k',false);      // çömelik tekme
            else if(kalem==='cp')p.startSingle(p.ch.moves.cp,'p',false); // aparkat (fırlatır)
            else p.startChain(kalem);
            d.bekle=.6;
          }else{game.demo=null;screenFx.timeScale=1;}
        }
      }
    }
    game.p1.spritePilot=!!game.spriteOn; // sprite pilotu yalnız antrenman oyuncusunda
    spriteTick(dt); // sprite bekleme saati: ağır çekimde yavaşlar, hitstop'ta donar
    game.p1.update(dt,game.p2);
    game.p2.update(dt,game.p1);
    // kukla canı: son vuruştan ~1 sn sonra ikisi de tazelenir (K.O. yok)
    if(game.p2.hp<game.p2.maxHp||game.p1.hp<game.p1.maxHp)game.trainT+=dt;else game.trainT=0;
    if(game.trainT>1&&!['hit','stagger','crumple','down','getup','thrown'].includes(game.p2.state)){
      game.p2.hp=game.p2.maxHp;game.p1.hp=game.p1.maxHp;game.trainT=0;
    }
    drawGhosts(g,dt);
    game.p1.draw(g);game.p2.draw(g);
    drawHUD(g);
    if(game.trainPanel)drawTrainPanel(g);
    if(game.splash&&game.splashT<1.4){
      game.splashT+=.016;
      centerText(g,game.splash,44,VH*0.4,'kukla vurmaz · canlar tazelenir · GÖSTERİ: zinciri kendisi oynatır');
    }
  }
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
  tap.on=false; // tuval dokunuşu yalnız işlendiği karede geçerli
}
requestAnimationFrame(loop);

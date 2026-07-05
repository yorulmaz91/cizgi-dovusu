/* ============================================================
   DÖVÜŞÇÜ — fizik, durum makinesi, vuruş zincirleri, skiller, AI
   ============================================================ */
import {clamp,lerp,rnd} from './utils.js';
import {keys} from './input.js';
import {VW,GROUND,drawFighter} from './render.js';
import {screenFx,spark,burst,floatText,floatBig,dust,drawStunMark,ghosts} from './effects.js';
import {computePose} from './poses.js';
import {game} from './main.js';
import * as sfx from './audio.js';

/* AI zorluk ayarları: hasar çarpanı, saldırılar arası insan duraksaması (sn),
   zincirin devamını basma / blok / skil kullanma olasılıkları */
export const DIFFS={
  kolay :{dmg:.6,pauseMin:.5, pauseMax:1,  chain:.25,block:.15,special:.2},
  normal:{dmg:.8,pauseMin:.25,pauseMax:.6, chain:.6, block:.3, special:.35},
  zor   :{dmg:1, pauseMin:.05,pauseMax:.15,chain:.85,block:.5, special:.6}
};

export class Fighter{
  constructor(ch,x,facing,isAI){
    this.ch=ch;this.x=x;this.y=GROUND;this.facing=facing;this.isAI=isAI;
    this.hp=ch.hp;this.maxHp=ch.hp;
    this.state='idle';this.st=0;this.vx=0;this.vy=0;this.airMove=false;
    this.cd=0;this.blockHeld=false;this.walkPhase=0;
    this.dead=false;this.stun=0;this.combo=0;this.comboT=0;
    this.juggle=0;this.kvx=0;
    this.aiT=0;this.fx={};this.aiPause=0;this.aiChainAt=-1;this.aiChainGo=false;
  }
  setState(s){this.state=s;this.st=0;}
  busy(){return ['attack','special','hit','ko','fatalP','fatalV','jump'].includes(this.state);}
  grounded(){return this.y>=GROUND-0.5;}
  startChain(t){
    this.chain=this.ch.moves[t];
    this.chainIdx=0;this.mv=this.chain[0];this.mvKind=t;
    this.queued=0;this.hitDone=false;this.vx=0;
    this.setState('attack');
    sfx.whoosh();if(this.mv.launch)sfx.rise();
  }
  startSingle(mv,kind,air){
    this.chain=[mv];this.chainIdx=0;this.mv=mv;this.mvKind=kind;
    this.queued=0;this.hitDone=false;this.airMove=!!air;
    if(!air)this.vx=0;
    this.setState('attack');
    sfx.whoosh();if(mv.launch)sfx.rise();
  }
  update(dt,foe){
    this.st+=dt;this.cd=Math.max(0,this.cd-dt);
    this.comboT-=dt;if(this.comboT<=0)this.combo=0;

    /* --- yerçekimi & iniş --- */
    if(!this.grounded()||this.vy<0){
      this.vy+=1600*dt;this.y+=this.vy*dt;
      if(this.y>=GROUND){
        this.y=GROUND;this.vy=0;this.juggle=0;
        for(let i=0;i<4;i++)dust(this.x+rnd(-12,12),GROUND-2,Math.sign(rnd(-1,1)));
        if(this.state==='jump')this.setState('idle');
        if(this.state==='attack'&&this.airMove){this.airMove=false;this.setState('idle');}
      }
    }

    /* --- vuruş savrulması: ışınlanma değil, birkaç karede sönen kayma --- */
    if(this.kvx){
      this.x=clamp(this.x+this.kvx*dt,60,VW-60);
      this.kvx*=Math.max(0,1-dt*12);
      if(Math.abs(this.kvx)<2)this.kvx=0;
    }

    if(this.stun>0){this.stun-=dt;return;}
    if(this.state==='ko'||this.state==='fatalV')return;

    const inp=this.isAI?this.ai(dt,foe):keys;

    /* --- havada: sürüklenme + hava saldırıları --- */
    if(this.state==='jump'){
      this.vx=(inp.right-inp.left)*this.ch.speed*0.9;
      this.x=clamp(this.x+this.vx*dt,60,VW-60);
      if(inp.punch)this.startSingle(this.ch.moves.jp,'p',true);
      else if(inp.kick)this.startSingle(this.ch.moves.jk,'k',true);
    }

    /* --- saldırı zinciri --- */
    if(this.state==='attack'){
      const mv=this.mv;
      // sıradaki hamleyi kuyruğa al (aktif pencereden sonra basılırsa)
      if(this.st>mv.t1&&this.chain[this.chainIdx+1]){
        if((this.mvKind==='p'&&inp.punch)||(this.mvKind==='k'&&inp.kick))this.queued=1;
      }
      // hamle ileri atılımı (yer / hava)
      if(mv.lunge&&this.st<mv.t1)
        this.x=clamp(this.x+this.facing*mv.lunge*dt,60,VW-60);
      if(mv.airlunge&&this.st<mv.t1)
        this.x=clamp(this.x+this.facing*mv.airlunge*dt,60,VW-60);
      // vuruş penceresi (dikey mesafe de kontrol edilir)
      if(this.st>=mv.t0&&this.st<=mv.t1&&!this.hitDone){
        if(Math.abs(foe.x-this.x)<mv.range+28
          &&Math.abs(foe.y-this.y)<110
          &&Math.sign(foe.x-this.x)===this.facing){
          this.hitDone=true;
          this.landHit(foe,mv,this.chainIdx===this.chain.length-1);
        }
      }
      // hamle bitti: zincirle veya bitir
      if(this.st>=mv.dur){
        if(this.queued){
          this.chainIdx++;this.mv=this.chain[this.chainIdx];
          this.st=0;this.queued=0;this.hitDone=false;
          sfx.whoosh();
        }else if(this.airMove&&!this.grounded())this.setState('jump');
        else{this.airMove=false;this.setState('idle');}
      }
    }
    if(this.state==='hit'&&this.st>=.32&&this.grounded())this.setState('idle');
    if(this.state==='special'&&this.st>=this.specDur())this.setState('idle');

    if(!this.busy()&&this.state!=='crouch'){
      this.facing=foe.x>this.x?1:-1;
      this.blockHeld=!!inp.block;
      if(this.blockHeld){this.setStateIf('block');this.vx=0;}
      else{
        if(this.state==='block')this.setState('idle');
        if(inp.down){this.setState('crouch');this.vx=0;}
        else if(inp.up&&this.grounded()){
          this.vy=-640;this.setState('jump');
          for(let i=0;i<3;i++)dust(this.x+rnd(-10,10),GROUND-2,this.facing);
        }
        else{
          this.vx=(inp.right-inp.left)*this.ch.speed;
          if(this.vx!==0){
            this.setStateIf('walk');this.walkPhase+=dt*9;
            if(Math.random()<dt*8)dust(this.x-this.facing*12,this.y-2,this.facing);
          }
          else this.setStateIf('idle');
          if(inp.punch)this.startChain('p');
          else if(inp.kick)this.startChain('k');
          else if(inp.special&&this.cd<=0){this.startSpecial(foe);}
        }
      }
    }else if(this.state==='crouch'){
      // çömelme: kalk veya çömelme saldırısı
      this.facing=foe.x>this.x?1:-1;this.vx=0;
      if(inp.punch)this.startSingle(this.ch.moves.cp,'p',false);
      else if(inp.kick)this.startSingle(this.ch.moves.ck,'k',false);
      else if(!inp.down)this.setState('idle');
    }else if(this.state!=='attack'&&this.state!=='jump')this.vx=0;

    if(this.state!=='attack'&&this.state!=='jump')
      this.x=clamp(this.x+this.vx*dt,60,VW-60);

    this.updateSpecial(dt,foe);
  }
  setStateIf(s){if(this.state!==s)this.setState(s);}
  landHit(foe,mv,finisher){
    let dmg=mv.dmg,kb=mv.kb,ky=mv.ky;
    if(this.isAI)dmg*=(DIFFS[game.difficulty]||DIFFS.normal).dmg; // zorluk çarpanı
    if(foe.state==='block'&&foe.facing!==this.facing){
      dmg*=0.15;kb*=0.4;
      spark(foe.x+this.facing*20,foe.y-70,5,.5);
      burst(foe.x+this.facing*24,foe.y-72,10);
      floatText(foe.x,foe.y-125,'BLOK');
      sfx.block();
    }else{
      // juggle: havadaki rakibe her ardışık vuruş öncekinin %80'i kadar
      if(!foe.grounded()){dmg*=Math.pow(.8,foe.juggle);foe.juggle++;}
      foe.setState('hit');foe.stun=mv.stun||.18;
      this.combo++;this.comboT=1.2;
      spark(foe.x+this.facing*10,foe.y+ky,10);
      const SFX=dmg>=14?['GÜMM!','KRAK!']:dmg>=9?['GÜM!','ÇAT!']:['PAT!','ŞAK!'];
      burst(foe.x+this.facing*14,foe.y+ky,12+dmg*1.5,SFX[Math.floor(Math.random()*SFX.length)]);
      floatText(foe.x,foe.y-135,'-'+Math.round(dmg));
      if(finisher&&mv.name)floatBig(this.x,this.y-165,mv.name.toUpperCase()+'!');
      else if(this.combo>=3)floatBig(this.x,this.y-160,this.combo+' KOMBO!');
      if(mv.stun)for(let i=0;i<3;i++)drawStunMark(foe);
      if(mv.launch){foe.vy=-mv.launch;foe.y-=3;floatBig(foe.x,foe.y-150,'HAVADA!');}
      sfx.hit(dmg,this.mvKind);
      // hitstop hasarla ölçeklenir: hafif ~40ms, en ağır ~110ms
      screenFx.hitstop=clamp(.03+dmg*.004,.04,.11);
      screenFx.shake=Math.min(10,4+dmg*.4);
    }
    foe.hp=Math.max(0,foe.hp-dmg);
    foe.kvx=this.facing*kb*1.44; // eski anlık itmeyle aynı toplam mesafe, kayarak
    if(foe.hp<=0&&!game.finishing)game.finishHim(this,foe);
  }
  specDur(){return this.ch.id==='golge'?.55:this.ch.id==='beton'?.7:.9;}
  startSpecial(foe){
    this.setState('special');this.cd=this.ch.specCd;this.fx={};
    if(this.ch.id==='golge'){this.fx.sx=this.x;this.fx.tx=foe.x+this.facing*70;}
    sfx.whoosh();
  }
  updateSpecial(dt,foe){
    if(this.state!=='special')return;
    const t=this.st/this.specDur(),id=this.ch.id;
    if(id==='golge'){
      this.x=lerp(this.fx.sx,this.fx.tx,Math.min(1,t*1.6));
      ghosts.push({x:this.x,t:0,life:.26});
      if(t>.62&&!this.fx.hit){this.fx.hit=true;this.facing=foe.x>this.x?1:-1;this.landHit(foe,{dmg:17,kb:260,ky:-60,name:'Gölge Geçişi'},true);}
    }
    if(id==='beton'){
      if(t>.55&&!this.fx.hit){
        this.fx.hit=true;screenFx.shake=14;spark(this.x+this.facing*40,GROUND,16,1.3);
        for(let i=0;i<10;i++)dust(this.x+this.facing*40+rnd(-70,70),GROUND-2,Math.sign(rnd(-1,1)));
        burst(this.x+this.facing*44,GROUND-8,26);
        if(Math.abs(foe.x-this.x)<190){this.landHit(foe,{dmg:20,kb:320,ky:-20},false);floatBig(foe.x,foe.y-150,'DEPREM!');}
      }
    }
    if(id==='volt'){
      [0.25,0.5,0.75].forEach((mark,i)=>{
        if(t>mark&&!this.fx['b'+i]){
          this.fx['b'+i]=true;
          if(Math.abs(foe.x-this.x)<240){
            this.fx.boltX=foe.x;this.fx.boltT=.12;
            this.landHit(foe,{dmg:6,kb:40,ky:-70,stun:.25},false);
          }else{this.fx.boltX=this.x+this.facing*200;this.fx.boltT=.12;}
        }
      });
      if(this.fx.boltT>0)this.fx.boltT-=dt;
    }
  }
  ai(dt,foe){
    const D=DIFFS[game.difficulty]||DIFFS.normal;
    this.aiT-=dt;this.aiPause=Math.max(0,this.aiPause-dt);
    const d=foe.x-this.x, ad=Math.abs(d), inp={left:0,right:0,up:0,down:0,punch:0,kick:0,block:0,special:0};

    /* saldırı sürerken tek karar: zincirin devamını bas ya da basma (zorluğa göre) */
    if(this.state==='attack'){
      if(this.chain&&this.chain[this.chainIdx+1]&&this.st>this.mv.t1){
        if(this.aiChainAt!==this.chainIdx){this.aiChainAt=this.chainIdx;this.aiChainGo=Math.random()<D.chain;}
        if(this.aiChainGo)inp[this.mvKind==='p'?'punch':'kick']=1;
      }
      return inp;
    }

    if(this.aiT<=0){
      this.aiT=rnd(.15,.3);this.aiPlan=null;this.aiJumped=0;this.aiChainAt=-1;
      const atkOk=this.aiPause<=0; // duraksama bitmeden yeni saldırı planı yok
      if(foe.busy()&&ad<110&&Math.random()<D.block)this.aiPlan='block';
      else if(atkOk&&ad<80&&Math.random()<.18)this.aiPlan='crouchP';
      else if(atkOk&&ad<210&&ad>110&&Math.random()<.15)this.aiPlan='jumpK';
      else if(atkOk&&ad<90){const r=Math.random();this.aiPlan=r<.4?'punch':r<.7?'kick':(this.cd<=0&&Math.random()<D.special?'special':'punch');}
      else if(atkOk&&ad<230&&this.cd<=0&&Math.random()<D.special*.5)this.aiPlan='special';
      else if(!atkOk&&ad<90)this.aiPlan=Math.random()<.4?'retreat':null; // bekle / açıl
      else this.aiPlan=Math.random()<.85?'chase':'retreat';
      if(['punch','kick','crouchP','jumpK','special'].includes(this.aiPlan))
        this.aiPause=rnd(D.pauseMin,D.pauseMax); // insan gibi nefes payı
    }
    if(this.aiPlan==='chase')d>0?inp.right=1:inp.left=1;
    if(this.aiPlan==='retreat')d>0?inp.left=1:inp.right=1;
    if(this.aiPlan==='block')inp.block=1;
    if(this.aiPlan==='punch'){inp.punch=1;this.aiPlan=null;}   // basılı tutma yok:
    if(this.aiPlan==='kick'){inp.kick=1;this.aiPlan=null;}     // tek karelik basış
    if(this.aiPlan==='special'){inp.special=1;this.aiPlan=null;}
    if(this.aiPlan==='crouchP'){inp.down=1;inp.punch=1;}
    if(this.aiPlan==='jumpK'){
      if(this.grounded()&&this.state!=='jump'&&!this.aiJumped){inp.up=1;this.aiJumped=1;}
      else if(!this.grounded()){inp.kick=1;d>0?inp.right=1:inp.left=1;}
    }
    return inp;
  }
  /* poz hesabı poses.js'te, çizim render.js'te */
  pose(){return computePose(this);}
  draw(g){drawFighter(g,this);}
}

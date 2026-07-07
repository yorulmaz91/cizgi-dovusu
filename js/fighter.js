/* ============================================================
   DÖVÜŞÇÜ — fizik, durum makinesi, vuruş zincirleri, skiller, AI
   ============================================================ */
import {clamp,lerp,rnd} from './utils.js';
import {keys} from './input.js';
import {VW,GROUND,drawFighter} from './render.js';
import {screenFx,spark,burst,floatText,floatBig,dust,drawStunMark,ghosts,streak} from './effects.js';
import {computePose} from './poses.js';
import {game} from './main.js';
import * as sfx from './audio.js';

/* AI zorluk ayarları: hasar çarpanı, saldırılar arası insan duraksaması (sn),
   zincirin devamını basma / blok / skil olasılıkları,
   low: alçak vuruş kullanma sıklığı, read: gelen vuruşun yüksekliğini doğru okuma */
export const DIFFS={
  kolay :{dmg:.6,pauseMin:.5, pauseMax:1,  chain:.25,block:.15,special:.2, low:.08,read:.2, throw:.1, tbreak:.1, punish:.05},
  normal:{dmg:.8,pauseMin:.25,pauseMax:.6, chain:.6, block:.3, special:.35,low:.18,read:.5, throw:.25,tbreak:.3, punish:.25},
  zor   :{dmg:1, pauseMin:.05,pauseMax:.15,chain:.85,block:.5, special:.6, low:.3, read:.85,throw:.45,tbreak:.55,punish:.6}
};
const THROW_RANGE=48; // fırlatma menzili (belge 2.2)

export class Fighter{
  constructor(ch,x,facing,isAI){
    this.ch=ch;this.x=x;this.y=GROUND;this.facing=facing;this.isAI=isAI;
    this.hp=ch.hp;this.maxHp=ch.hp;
    this.state='idle';this.st=0;this.vx=0;this.vy=0;this.airMove=false;
    this.cd=0;this.blockHeld=false;this.walkPhase=0;
    this.dead=false;this.stun=0;this.combo=0;this.comboT=0;
    this.juggle=0;this.kvx=0;this.invuln=0;this.otg=0;this.whiffed=false;
    this.pPrev=false;this.kPrev=false;this.tPrev=false;this.pBuf=0;this.kBuf=0;this.pend=null; // YUM+TEK toleransı + FIRLAT
    this.thrFoe=null;this.thrHit=false;this.thrEscape=false;this.thrEscT=0;
    this.erasedLimb=null;this.erasedT=0;this.hidden=false; // KALEM: silinen uzuv
    this.armorT=0; // BETON süper zırh görsel ipucu
    this.poseS=null;this.poseClk=0;this.turnT=0;this.ileriGeri=1;this.bakis=0;this.landT=0;this.landK=0; // poz eritme (insansı geçiş) + dönüş esnemesi
    this.aiT=0;this.fx={};this.aiPause=0;this.aiChainAt=-1;this.aiChainGo=false;this.aiBlockLow=false;
  }
  setState(s){this.state=s;this.st=0;}
  busy(){return ['attack','special','hit','stagger','crumple','down','getup','throwing','thrown','ko','fatalP','fatalV','jump'].includes(this.state);}
  grounded(){return this.y>=GROUND-0.5;}
  startChain(t){
    this.chain=this.ch.moves[t];
    this.chainIdx=0;this.mv=this.chain[0];this.mvKind=t;
    this.queued=0;this.hitDone=false;this.whiffed=false;this.vx=0;
    this.setState('attack');
    sfx.whoosh();if(this.mv.launch)sfx.rise();
  }
  startSingle(mv,kind,air){
    this.chain=[mv];this.chainIdx=0;this.mv=mv;this.mvKind=kind;
    this.queued=0;this.hitDone=false;this.whiffed=false;this.airMove=!!air;
    if(!air)this.vx=0;
    this.setState('attack');
    sfx.whoosh();if(mv.launch)sfx.rise();
  }
  update(dt,foe){
    this.st+=dt;this.cd=Math.max(0,this.cd-dt);
    this.invuln=Math.max(0,this.invuln-dt);
    this.turnT=Math.max(0,this.turnT-dt); // dönüş esnemesi sayacı
    this.landT=Math.max(0,this.landT-dt);  // iniş yaylanması sayacı
    // bakış: rakip havadaysa baş onu göz ucuyla izler (yalnız sakin durumlarda, görsel)
    const bakisHedef=(this.state==='idle'||this.state==='walk')?-Math.min(.3,Math.max(0,this.y-foe.y)/500):0;
    this.bakis=(this.bakis||0)+(bakisHedef-(this.bakis||0))*Math.min(1,dt*8);
    this.comboT-=dt;if(this.comboT<=0)this.combo=0;
    this.armorT=Math.max(0,this.armorT-dt);
    // silinen uzuv 2 sn sonra geri belirir
    if(this.erasedT>0){
      this.erasedT-=dt;
      if(this.erasedT<=0){this.erasedLimb=null;spark(this.x,this.y-70,4,.4);}
    }

    /* --- yerçekimi & iniş (fırlatılan rakibi fırlatan taşır) --- */
    if(this.state!=='thrown'&&(!this.grounded()||this.vy<0)){
      this.vy+=1600*dt;this.y+=this.vy*dt;
      if(this.y>=GROUND){
        const inisVy=this.vy; // iniş şiddeti → görsel diz yaylanması
        this.y=GROUND;this.vy=0;this.juggle=0;
        this.landT=.2;this.landK=Math.min(1,Math.max(0,inisVy)/950);
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

    /* --- fırlatılıyorken: sadece kaçış girdisi dinlenir --- */
    if(this.state==='thrown'){
      if(!this.isAI){
        const pE=!!keys.punch&&!this.pPrev, kE=!!keys.kick&&!this.kPrev, tE=!!keys.throw&&!this.tPrev;
        this.pPrev=!!keys.punch;this.kPrev=!!keys.kick;this.tPrev=!!keys.throw;
        this.pBuf=pE?.1:Math.max(0,this.pBuf-dt);
        this.kBuf=kE?.1:Math.max(0,this.kBuf-dt);
        if(this.st<.2&&(tE||(this.pBuf>0&&this.kBuf>0)))this.thrEscape=true; // FIRLAT tuşu da kırar
      }else if(this.thrEscT&&this.st>=this.thrEscT)this.thrEscape=true;
      return;
    }
    /* --- fırlatıyorken: animasyonu sürdür --- */
    if(this.state==='throwing'){this.updateThrow(dt);return;}

    const inp=this.isAI?this.ai(dt,foe):keys;
    /* tuş kenarları + 80ms tamponlar (YUM+TEK fırlatma toleransı) */
    const pEdge=!!inp.punch&&!this.pPrev, kEdge=!!inp.kick&&!this.kPrev, tEdge=!!inp.throw&&!this.tPrev;
    this.pPrev=!!inp.punch;this.kPrev=!!inp.kick;this.tPrev=!!inp.throw;
    this.pBuf=pEdge?.1:Math.max(0,this.pBuf-dt);
    this.kBuf=kEdge?.1:Math.max(0,this.kBuf-dt);

    /* --- havada: sürüklenme + hava saldırıları --- */
    if(this.state==='jump'){
      this.vx=(inp.right-inp.left)*this.ch.speed*0.9;
      this.x=clamp(this.x+this.vx*dt,60,VW-60);
      if(inp.punch&&this.canUse('p'))this.startSingle(this.ch.moves.jp,'p',true);
      else if(inp.kick&&this.canUse('k'))this.startSingle(this.ch.moves.jk,'k',true);
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
      // alçak hamleler zeminde iz çizgisi bırakır (görsel dil)
      if(mv.height==='low'&&this.st>=mv.t0-.05&&this.st<mv.t1&&Math.random()<dt*30)
        streak(this.x+this.facing*rnd(16,mv.range*.8),GROUND-2,this.facing,10);
      // dönen topuk: dönüş hız çizgileri (kafa hizasında)
      if(mv.anim==='spinhook'&&this.st>=mv.t0-.12&&this.st<mv.t1&&Math.random()<dt*40)
        streak(this.x+this.facing*rnd(-10,70),this.y-rnd(95,140),this.facing,20);
      // vuruş penceresi (dikey mesafe de kontrol edilir)
      if(this.st>=mv.t0&&this.st<=mv.t1&&!this.hitDone){
        if(Math.abs(foe.x-this.x)<mv.range+28
          &&Math.abs(foe.y-this.y)<110
          &&Math.sign(foe.x-this.x)===this.facing
          &&foe.invuln<=0
          &&!(foe.state==='down'&&foe.otg>=1)){ // yerdekine en fazla 1 vuruş
          const foeLow=foe.state==='crouch'||foe.state==='crouchblock';
          if((mv.height||'mid')==='high'&&foeLow){
            // ÜST vuruş çömelmiş rakibin kafasının üstünden geçer
            if(!this.whiffed){
              this.whiffed=true;
              for(let i=0;i<3;i++)streak(foe.x+rnd(-12,12),foe.y-126-i*7,this.facing,16);
            }
          }else{
            this.hitDone=true;
            this.landHit(foe,mv,this.chainIdx===this.chain.length-1);
          }
        }
      }
      // hamle bitti: zincirle veya bitir
      if(this.st>=mv.dur){
        if(this.queued){
          this.chainIdx++;this.mv=this.chain[this.chainIdx];
          this.st=0;this.queued=0;this.hitDone=false;this.whiffed=false;
          sfx.whoosh();
        }else if(this.airMove&&!this.grounded())this.setState('jump');
        else{this.airMove=false;this.setState('idle');}
      }
    }
    if(this.state==='hit'&&this.st>=.32&&this.grounded())this.setState('idle');
    /* --- tepki durumları zaman çizelgesi --- */
    if(this.state==='stagger'&&this.st>=.45&&this.grounded())this.setState('idle');
    if(this.state==='crumple'&&this.st>=.55){this.setState('down');this.otg=0;}
    if(this.state==='down'&&this.st>=.6){this.setState('getup');this.invuln=.4;} // kalkarken dokunulmaz
    if(this.state==='getup'&&this.st>=.4)this.setState('idle');
    if(this.state==='special'&&this.st>=this.specDur())this.setState('idle');

    if(!this.busy()&&this.state!=='crouch'){
      const onceF=this.facing;
      this.facing=foe.x>this.x?1:-1;
      if(this.facing!==onceF)this.turnT=.14; // yön değişti: küçük dönüş esnemesi (görsel)
      this.blockHeld=!!inp.block;
      if(this.blockHeld){this.setStateIf(inp.down?'crouchblock':'block');this.vx=0;}
      else{
        if(this.state==='block'||this.state==='crouchblock')this.setState('idle');
        if(inp.down){this.setState('crouch');this.vx=0;}
        else if(inp.up&&this.grounded()){
          this.vy=-640;this.setState('jump');
          for(let i=0;i<3;i++)dust(this.x+rnd(-10,10),GROUND-2,this.facing);
        }
        else{
          this.vx=(inp.right-inp.left)*this.ch.speed;
          if(this.vx!==0){
            this.setStateIf('walk');
            this.walkPhase+=dt*(4+this.ch.speed/32); // adım ritmi karakter hızına bağlı (ayak kayması azalır)
            this.ileriGeri=(this.vx*this.facing>0)?1:-1; // 1 ileri · -1 geri çekilme
            if(Math.random()<dt*8)dust(this.x-this.facing*12,this.y-2,this.facing);
          }
          else this.setStateIf('idle');
          const yakin=Math.abs(foe.x-this.x)<=THROW_RANGE;
          if(tEdge){ // FIRLAT tuşu: tek dokunuşla fırlatma dener (dokunmatik ana yol)
            this.pend=null;this.pBuf=this.kBuf=0;
            if(this.canUse('p')&&this.canUse('k'))this.tryThrow(foe);
          }
          else if(this.pBuf>0&&this.kBuf>0){ // YUM+TEK (kısa tolerans içinde ikisi) = fırlatma
            this.pBuf=this.kBuf=0;this.pend=null;
            if(this.canUse('p')&&this.canUse('k'))this.tryThrow(foe); // silinmiş uzuvla kavrama yok
          }
          else if(this.pend){ // yakın mesafede ikinci tuş için kısa bekleme
            this.pend.t-=dt;
            if(this.pend.t<=0){const kk=this.pend.k;this.pend=null;if(this.canUse(kk))this.startChain(kk);}
          }
          else if(inp.punch||inp.kick){
            const kind=inp.punch?'p':'k';
            const taze=(kind==='p'&&pEdge)||(kind==='k'&&kEdge);
            if(yakin&&taze)this.pend={k:kind,t:.1}; // fırlatma toleransı (~100ms)
            else if(this.canUse(kind))this.startChain(kind);
          }
          else if(inp.special&&this.cd<=0){this.startSpecial(foe);}
        }
      }
    }else if(this.state==='crouch'){
      // çömelme: blokla, kalk veya çömelme saldırısı
      const onceF=this.facing;
      this.facing=foe.x>this.x?1:-1;this.vx=0;
      if(this.facing!==onceF)this.turnT=.14;
      if(inp.block)this.setState('crouchblock');
      else if(inp.punch&&this.canUse('p'))this.startSingle(this.ch.moves.cp,'p',false);
      else if(inp.kick&&this.canUse('k'))this.startSingle(this.ch.moves.ck,'k',false);
      else if(!inp.down)this.setState('idle');
    }else if(this.state!=='attack'&&this.state!=='jump')this.vx=0;

    if(this.state!=='attack'&&this.state!=='jump')
      this.x=clamp(this.x+this.vx*dt,60,VW-60);

    this.updateSpecial(dt,foe);
  }
  setStateIf(s){if(this.state!==s)this.setState(s);}
  /* silinmiş uzuvla saldırı yok: kol silindiyse yumruk, bacak silindiyse tekme kilitli */
  canUse(kind){
    if(!this.erasedLimb||this.erasedT<=0)return true;
    const tip=this.erasedLimb[0]; // 'a' kol, 'l' bacak
    return kind==='p'?tip!=='a':tip!=='l';
  }
  landHit(foe,mv,finisher){
    let dmg=mv.dmg,kb=mv.kb,ky=mv.ky,rc=null;
    if(this.isAI)dmg*=(DIFFS[game.difficulty]||DIFFS.normal).dmg; // zorluk çarpanı
    /* counter hit: rakip kendi saldırısının hazırlık/aktif karelerindeyken vurulursa */
    const counter=foe.state==='attack'&&foe.mv&&foe.st<=foe.mv.t1;
    if(counter)dmg*=1.3; // ses de hasara bağlı olduğundan otomatik tok çıkar
    /* blok tablosu: ayakta blok ÜST+ORTA keser (ALÇAK yer);
       çömelik blok ALÇAK keser (ORTA yer). ÜST'ün çömelene ıskası vuruş penceresinde. */
    const h=mv.height||'mid';
    const blocked=foe.facing!==this.facing&&(
      (foe.state==='block'&&h!=='low')||
      (foe.state==='crouchblock'&&h==='low'));
    if(blocked){
      dmg*=0.15;kb*=0.4;
      spark(foe.x+this.facing*20,foe.y-70,5,.5);
      burst(foe.x+this.facing*24,foe.y-72,10);
      floatText(foe.x,foe.y-125,'BLOK');
      sfx.block();
      // belge 2.5: ZOR AI bloklanan AĞIR hamleyi cezalandırır (hemen cevap planlar)
      if(foe.isAI&&mv.dur>=.38&&Math.random()<(DIFFS[game.difficulty]||DIFFS.normal).punish){
        foe.aiPause=0;foe.aiT=0;
      }
    }else{
      // juggle: havadaki rakibe her ardışık vuruş öncekinin %80'i kadar
      if(!foe.grounded()){dmg*=Math.pow(.8,foe.juggle);foe.juggle++;}
      const otg=foe.state==='down';
      if(counter)floatBig(foe.x,foe.y-172,'KARŞI!');
      if(otg){
        foe.otg=(foe.otg||0)+1; // yerde en fazla 1 vuruş; durumunu değiştirmez
      }else{
        // counter bazı hamlelerde tepkiyi yükseltir (örn. Kanca → crumple)
        rc=foe.grounded()?((counter&&mv.counterReaction)||mv.reaction||'flinch'):'flinch';
        /* BETON süper zırhı: zırhlı hamlenin hazırlık+aktif karelerinde
           flinch/stagger yemez, hamleyi tamamlar (launch/knockdown/crumple DELER) */
        const zirh=foe.state==='attack'&&foe.mv&&foe.mv.armor&&foe.st<=foe.mv.t1
          &&(rc==='flinch'||rc==='stagger');
        if(zirh){
          foe.armorT=.22;kb*=.3;rc=null; // durum değişmez, itiş çok azalır
          floatText(foe.x,foe.y-150,'ZIRH!');
        }
        else if(rc==='stagger'){foe.setState('stagger');foe.stun=0;}
        else if(rc==='crumple'){foe.setState('crumple');foe.stun=0;}
        else if(rc==='knockdown'){foe.setState('down');foe.otg=0;foe.stun=0;}
        else{foe.setState('hit');foe.stun=mv.stun||.18;} // flinch + launch
      }
      this.combo++;this.comboT=1.2;
      spark(foe.x+this.facing*10,foe.y+ky,10);
      const SFX=dmg>=14?['GÜMM!','KRAK!']:dmg>=9?['GÜM!','ÇAT!']:['PAT!','ŞAK!'];
      burst(foe.x+this.facing*14,foe.y+ky,12+dmg*1.5,SFX[Math.floor(Math.random()*SFX.length)]);
      floatText(foe.x,foe.y-135,'-'+Math.round(dmg));
      if(finisher&&mv.name)floatBig(this.x,this.y-165,mv.name.toUpperCase()+'!');
      else if(this.combo>=3)floatBig(this.x,this.y-160,this.combo+' KOMBO!');
      if(mv.stun)for(let i=0;i<3;i++)drawStunMark(foe);
      if(mv.launch&&!otg){foe.vy=-mv.launch;foe.y-=3;floatBig(foe.x,foe.y-150,'HAVADA!');}
      if(rc==='knockdown')floatBig(foe.x,foe.y-150,'YERDE!');
      sfx.hit(dmg,this.mvKind);
      // hitstop hasarla ölçeklenir: hafif ~40ms, en ağır ~110ms
      screenFx.hitstop=clamp(.03+dmg*.004,.04,.11);
      screenFx.shake=Math.min(10,4+dmg*.4);
    }
    foe.hp=Math.max(0,foe.hp-dmg);
    foe.kvx=this.facing*kb*1.44; // eski anlık itmeyle aynı toplam mesafe, kayarak
    if(rc==='stagger')foe.kvx*=1.6; // sendeleme: 2-3 adım geriye
    if(foe.hp<=0&&!game.finishing&&game.scene==='fight')game.finishHim(this,foe); // antrenmanda K.O. yok
    return blocked?'blocked':(foe.state==='down'&&!rc?'otg':'hit'); // KALEM skili temiz isabeti ayırt eder
  }
  /* ---------- fırlatma (belge 2.2): blok işlemez, kaçış YUM+TEK ---------- */
  tryThrow(foe){
    const yakin=Math.abs(foe.x-this.x)<=THROW_RANGE&&Math.abs(foe.y-this.y)<40;
    const tutulur=['idle','walk','block','crouchblock','crouch'].includes(foe.state)
      &&foe.grounded()&&foe.invuln<=0;
    if(!yakin||!tutulur){ // boşa kapış: kısa, cezalandırılabilir uzanma
      this.startSingle({name:'Kapış',anim:'palm',dur:.34,t0:9,t1:9,range:0,dmg:0,kb:0,ky:-60},'p',false);
      return;
    }
    this.setState('throwing');this.thrFoe=foe;this.thrHit=false;
    foe.setState('thrown');foe.thrEscape=false;foe.thrEscT=0;foe.thrBy=this;
    this.vx=0;this.kvx=0;foe.vx=0;foe.vy=0;foe.kvx=0;
    this.facing=foe.x>this.x?1:-1;foe.facing=-this.facing;
    foe.x=clamp(this.x+this.facing*36,60,VW-60);foe.y=GROUND;
    if(foe.isAI){ // AI kaçış zarını fırlatma anında atar (zorluğa göre)
      const D=DIFFS[game.difficulty]||DIFFS.normal;
      if(Math.random()<D.tbreak)foe.thrEscT=rnd(.05,.14);
    }else floatText(foe.x,foe.y-155,'KIR: YUM+TEK!');
    sfx.whoosh();
  }
  updateThrow(dt){
    const v=this.thrFoe;if(!v){this.setState('idle');return;}
    const f=this.facing,T=this.st,id=this.ch.id;
    /* kaçış penceresi (~ilk 10 kare): itişip ayrılırlar */
    if(T<.2&&v.thrEscape){
      floatBig((this.x+v.x)/2,GROUND-160,'KIRILDI!');
      spark((this.x+v.x)/2,GROUND-80,8);
      sfx.block();
      this.kvx=-f*400;v.kvx=f*400;
      this.endThrow(v);v.setState('idle');
      return;
    }
    const mul=this.isAI?(DIFFS[game.difficulty]||DIFFS.normal).dmg:1;
    if(id==='golge'){ // ense kavrama → arkaya savurma (yön değişir)
      if(T>=.2&&T<.5){
        const k=(T-.2)/.3;
        v.x=clamp(this.x+f*lerp(36,-52,k),60,VW-60);
        v.y=GROUND-Math.sin(k*Math.PI)*74;
      }
      if(T>=.5&&!this.thrHit){
        this.thrHit=true;
        v.x=clamp(this.x-f*52,60,VW-60);v.y=GROUND;
        this.throwImpact(v,10*mul,'down');
      }
      if(T>=.62){this.endThrow(v);}
    }
    if(id==='beton'){ // judo kalça atışı: kaldır → yere çak
      if(T>=.2&&T<.5){const k=(T-.2)/.3;v.x=clamp(this.x+f*lerp(36,14,k),60,VW-60);v.y=GROUND-k*84;}
      if(T>=.5&&T<.58){const k=(T-.5)/.08;v.x=clamp(this.x+f*lerp(14,40,k),60,VW-60);v.y=GROUND-84*(1-k);}
      if(T>=.58&&!this.thrHit){
        this.thrHit=true;
        v.x=clamp(this.x+f*40,60,VW-60);v.y=GROUND;
        screenFx.shake=13;
        for(let i=0;i<8;i++)dust(v.x+rnd(-30,30),GROUND-2,Math.sign(rnd(-1,1)));
        this.throwImpact(v,16*mul,'down');
      }
      if(T>=.8){this.endThrow(v);}
    }
    if(id==='kalem'){ // sayfa çevirme: kaldır, sayfa gibi çevir, öne kapakla
      if(T>=.2&&T<.5){const k=(T-.2)/.3;v.x=clamp(this.x+f*lerp(36,18,k),60,VW-60);v.y=GROUND-Math.sin(k*Math.PI*.5)*95;}
      if(T>=.5&&T<.6){const k=(T-.5)/.1;v.x=clamp(this.x+f*lerp(18,78,k),60,VW-60);v.y=GROUND-95*(1-k);}
      if(T>=.6&&!this.thrHit){
        this.thrHit=true;
        v.x=clamp(this.x+f*78,60,VW-60);v.y=GROUND;
        for(let i=0;i<6;i++)dust(v.x+rnd(-24,24),GROUND-2,Math.sign(rnd(-1,1)));
        this.throwImpact(v,12*mul,'down');
      }
      if(T>=.78){this.endThrow(v);}
    }
    if(id==='volt'){ // tut + elektrik ver + it (yıkmaz, sersemletir)
      if(T>=.2&&T<.55){
        v.x=clamp(this.x+f*36,60,VW-60);v.y=GROUND;
        if(Math.random()<dt*22)drawStunMark(v);
        if(Math.random()<dt*14)spark(v.x+rnd(-8,8),v.y-rnd(30,100),2,.4);
      }
      if(T>=.55&&!this.thrHit){
        this.thrHit=true;
        this.throwImpact(v,8*mul,'stun');
        v.kvx=f*430;
      }
      if(T>=.7){this.endThrow(v);}
    }
  }
  throwImpact(v,dmg,tepki){
    spark(v.x,v.y-60,12);
    burst(v.x,v.y-64,14+dmg);
    floatText(v.x,v.y-135,'-'+Math.round(dmg));
    floatBig(this.x,this.y-170,this.ch.throwName.toUpperCase()+'!');
    if(tepki==='down'){v.setState('down');v.otg=0;v.stun=0;}
    else{v.setState('hit');v.stun=.6;for(let i=0;i<4;i++)drawStunMark(v);}
    v.hp=Math.max(0,v.hp-dmg);
    sfx.hit(dmg,'k');
    screenFx.hitstop=clamp(.03+dmg*.004,.04,.11);
    screenFx.shake=Math.min(10,4+dmg*.4);
    if(v.hp<=0&&!game.finishing&&game.scene==='fight')game.finishHim(this,v); // antrenmanda K.O. yok
  }
  endThrow(v){
    this.thrFoe=null;if(v)v.thrBy=null;
    this.setState('idle');
  }
  specDur(){return this.ch.id==='golge'?.55:this.ch.id==='beton'?.7:this.ch.id==='kalem'?.62:.9;}
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
      if(t>.62&&!this.fx.hit){this.fx.hit=true;this.facing=foe.x>this.x?1:-1;this.landHit(foe,{dmg:17,kb:260,ky:-60,name:'Gölge Geçişi',height:'mid',reaction:'stagger'},true);}
    }
    if(id==='beton'){
      if(t>.55&&!this.fx.hit){
        this.fx.hit=true;screenFx.shake=14;spark(this.x+this.facing*40,GROUND,16,1.3);
        for(let i=0;i<10;i++)dust(this.x+this.facing*40+rnd(-70,70),GROUND-2,Math.sign(rnd(-1,1)));
        burst(this.x+this.facing*44,GROUND-8,26);
        if(Math.abs(foe.x-this.x)<190){this.landHit(foe,{dmg:20,kb:320,ky:-20,height:'low',reaction:'knockdown'},false);floatBig(foe.x,foe.y-150,'DEPREM!');}
      }
    }
    if(id==='kalem'){
      // silgi savuruşu: temiz isabette rastgele bir uzvu 2 saniyeliğine siler
      if(t>.45&&!this.fx.hit){
        this.fx.hit=true;
        if(Math.abs(foe.x-this.x)<110&&Math.sign(foe.x-this.x)===this.facing){
          const sonuc=this.landHit(foe,{dmg:6,kb:140,ky:-60,name:'Silgi Darbesi',height:'mid',reaction:'flinch'},false);
          if(sonuc==='hit'){
            const uzuvlar=['aL','aR','lL','lR'];
            foe.erasedLimb=uzuvlar[Math.floor(Math.random()*uzuvlar.length)];
            foe.erasedT=2;
            floatBig(foe.x,foe.y-155,'SİLİNDİ!');
            for(let i=0;i<9;i++)dust(foe.x+rnd(-16,16),foe.y-rnd(30,110),Math.sign(rnd(-1,1))); // silgi kırıntıları
            sfx.erase();
          }
        }
      }
    }
    if(id==='volt'){
      [0.25,0.5,0.75].forEach((mark,i)=>{
        if(t>mark&&!this.fx['b'+i]){
          this.fx['b'+i]=true;
          if(Math.abs(foe.x-this.x)<240){
            this.fx.boltX=foe.x;this.fx.boltT=.12;
            this.landHit(foe,{dmg:6,kb:40,ky:-70,stun:.25,height:'mid',reaction:'flinch'},false);
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
      if(foe.busy()&&ad<110&&Math.random()<D.block){
        this.aiPlan='block';
        // zorluğa göre gelen vuruşun yüksekliğini oku: ALÇAK geliyorsa çömelik blok
        const fmv=foe.state==='attack'?foe.mv:null;
        const gelenLow=!!(fmv&&fmv.height==='low');
        this.aiBlockLow=Math.random()<D.read?gelenLow:Math.random()<.35;
      }
      else if(atkOk&&ad<=THROW_RANGE+4&&Math.random()<D.throw*((foe.state==='block'||foe.state==='crouchblock')?1:.4))this.aiPlan='throw';
      else if(atkOk&&ad<80&&Math.random()<D.low)this.aiPlan=Math.random()<.5?'crouchP':'crouchK';
      else if(atkOk&&ad<80&&Math.random()<.12)this.aiPlan='crouchP';
      else if(atkOk&&ad<210&&ad>110&&Math.random()<.15)this.aiPlan='jumpK';
      else if(atkOk&&ad<90){const r=Math.random();this.aiPlan=r<.4?'punch':r<.7?'kick':(this.cd<=0&&Math.random()<D.special?'special':'punch');}
      else if(atkOk&&ad<230&&this.cd<=0&&Math.random()<D.special*.5)this.aiPlan='special';
      else if(!atkOk&&ad<90)this.aiPlan=Math.random()<.4?'retreat':null; // bekle / açıl
      else this.aiPlan=Math.random()<.85?'chase':'retreat';
      if(['punch','kick','crouchP','crouchK','jumpK','special','throw'].includes(this.aiPlan))
        this.aiPause=rnd(D.pauseMin,D.pauseMax); // insan gibi nefes payı
    }
    if(this.aiPlan==='chase')d>0?inp.right=1:inp.left=1;
    if(this.aiPlan==='retreat')d>0?inp.left=1:inp.right=1;
    if(this.aiPlan==='block'){inp.block=1;if(this.aiBlockLow)inp.down=1;}
    if(this.aiPlan==='punch'){inp.punch=1;this.aiPlan=null;}   // basılı tutma yok:
    if(this.aiPlan==='kick'){inp.kick=1;this.aiPlan=null;}     // tek karelik basış
    if(this.aiPlan==='special'){inp.special=1;this.aiPlan=null;}
    if(this.aiPlan==='throw'){inp.punch=1;inp.kick=1;this.aiPlan=null;} // YUM+TEK aynı kare
    if(this.aiPlan==='crouchP'){inp.down=1;inp.punch=1;}
    if(this.aiPlan==='crouchK'){inp.down=1;inp.kick=1;} // alçak tekme
    if(this.aiPlan==='jumpK'){
      if(this.grounded()&&this.state!=='jump'&&!this.aiJumped){inp.up=1;this.aiJumped=1;}
      else if(!this.grounded()){inp.kick=1;d>0?inp.right=1:inp.left=1;}
    }
    return inp;
  }
  /* ---------- poz eritme: insansı geçişler ----------
     Hedef poz (poses.js) her karede anında uygulanmaz; çizilen poz hedefe
     doğru üstel hızla eritilir. Böylece duruş değişimleri (idle→walk,
     saldırı→idle, yere düşüş...) ışınlanma yerine akış gibi görünür.
     Hamle süreleri/hasarlar DEĞİŞMEZ — salt görsel katman. */
  pozHizi(){ // erime hızı (1/sn): vuruş anı keskin kalır, geçişler yumuşar
    const s=this.state;
    if(s==='attack')return this.mv&&this.st<this.mv.t0?26:55; // hazırlık akıcı, patlama anlık
    if(s==='hit'||s==='stagger'||s==='crumple'||s==='thrown')return 32; // darbe kamçı gibi
    if(s==='down')return 20;
    if(s==='walk')return 19; // adım ritmi diri kalsın (sönmesin)
    return 13; // idle/walk/blok/zıplama vb. geçişleri
  }
  pose(){
    const hedef=computePose(this);
    const now=performance.now();
    let pdt=this.poseClk?Math.min(.05,(now-this.poseClk)/1000):0;
    this.poseClk=now;
    if(screenFx.hitstop>0)pdt=0;else pdt*=(screenFx.timeScale||1); // vuruş donması pozu da dondurur
    if(!this.poseS||this.state==='fatalP'||this.state==='fatalV'){this.poseS=hedef;return hedef;}
    const S=this.poseS,a=1-Math.exp(-this.pozHizi()*pdt);
    for(const k of ['lean','head','dip','hipShift'])S[k]+=((hedef[k]||0)-S[k])*a;
    for(const k of ['aL','aR','lL','lR']){
      S[k][0]+=(hedef[k][0]-S[k][0])*a;
      S[k][1]+=(hedef[k][1]-S[k][1])*a;
    }
    return S;
  }
  /* poz hesabı poses.js'te, çizim render.js'te */
  draw(g){drawFighter(g,this);}
}

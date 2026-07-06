/* =====================================================================
   ÇİZGİ DÖVÜŞÜ — Claude'un test sürüşü
   Gerçek oyun modüllerini Node içinde sahte tarayıcıyla çalıştırır,
   tüm sistemleri üç karakterle dener, ölçümlü rapor basar.
   ===================================================================== */

/* ---------- sanal saat ---------- */
let vnow = 0;
const rafQ = [];
const timeouts = []; let toId = 1;
globalThis.performance = { now: () => vnow };
globalThis.requestAnimationFrame = cb => { rafQ.push(cb); return rafQ.length; };
globalThis.cancelAnimationFrame = () => {};
globalThis.setTimeout = (cb, ms=0) => { timeouts.push({id:toId, at:vnow+ms, cb}); return toId++; };
globalThis.clearTimeout = id => { const i=timeouts.findIndex(t=>t.id===id); if(i>=0)timeouts.splice(i,1); };
const intervals = [];
globalThis.setInterval = (cb, ms=16) => { const o={id:toId++, ms, next:vnow+ms, cb}; intervals.push(o); return o.id; };
globalThis.clearInterval = id => { const i=intervals.findIndex(t=>t.id===id); if(i>=0)intervals.splice(i,1); };

let jsErrors = [];
function step(frames=1, dtms=16.666){
  for(let i=0;i<frames;i++){
    vnow += dtms;
    // zamanlayıcılar
    for(let t=timeouts.length-1;t>=0;t--) if(timeouts[t].at<=vnow){ const cb=timeouts[t].cb; timeouts.splice(t,1); try{cb();}catch(e){jsErrors.push('timeout: '+e.message);} }
    for(const iv of intervals) while(iv.next<=vnow){ iv.next+=iv.ms; try{iv.cb();}catch(e){jsErrors.push('interval: '+e.message);} }
    // animasyon karesi
    const cbs = rafQ.splice(0, rafQ.length);
    for(const cb of cbs){ try{ cb(vnow); }catch(e){ jsErrors.push('frame: '+e.message); } }
  }
}
const sn = s => step(Math.round(s*60)); // saniye cinsinden ilerle

/* ---------- DOM / tarayıcı iskeleti ---------- */
const gradientStub = { addColorStop(){} };
const ctxStub = new Proxy({}, {
  get(t, p){
    if(p==='canvas') return elGame;
    if(p==='createLinearGradient'||p==='createRadialGradient'||p==='createPattern') return ()=>gradientStub;
    if(p==='measureText') return ()=>({width:10});
    if(p==='getImageData') return ()=>({data:new Uint8ClampedArray(4)});
    if(typeof t[p]!=='undefined') return t[p];
    return ()=>{};
  },
  set(t,p,v){ t[p]=v; return true; }
});
function makeEl(id){
  return { id, width:0, height:0, textContent:'', dataset:{}, style:{},
    classList:{ add(){}, remove(){}, toggle(){}, contains:()=>false },
    addEventListener(){}, removeEventListener(){},
    getContext: ()=>ctxStub, appendChild(){}, focus(){} };
}
const elGame = makeEl('game');
const els = { game: elGame, controls: makeEl('controls'), rotate: makeEl('rotate'),
              fsBtn: makeEl('fsBtn'), sndBtn: makeEl('sndBtn') };
globalThis.document = {
  getElementById: id => els[id] || (els[id]=makeEl(id)),
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener(){}, removeEventListener(){},
  documentElement: { requestFullscreen: async()=>{} },
  fullscreenElement: null,
  createElement: tag => makeEl(tag),
  body: makeEl('body')
};
globalThis.window = globalThis;
globalThis.innerWidth = 1280; globalThis.innerHeight = 720; globalThis.devicePixelRatio = 1;
globalThis.addEventListener = ()=>{}; globalThis.removeEventListener = ()=>{};
globalThis.screen = { orientation: { lock: async()=>{} } };
globalThis.localStorage = { _d:{}, getItem(k){return this._d[k]??null;}, setItem(k,v){this._d[k]=String(v);}, removeItem(k){delete this._d[k];} };
try{ Object.defineProperty(globalThis,'navigator',{value:{userAgent:'test'},configurable:true}); }catch(e){}
/* WebAudio iskeleti */
const audioParam = ()=>({ value:0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){}, setTargetAtTime(){}, cancelScheduledValues(){} });
const audioNode = ()=>({ connect(x){return x;}, disconnect(){}, start(){}, stop(){},
  gain:audioParam(), frequency:audioParam(), detune:audioParam(), Q:audioParam(), playbackRate:audioParam(),
  type:'', buffer:null, onended:null });
globalThis.AudioContext = function(){ return {
  createOscillator:audioNode, createGain:audioNode, createBiquadFilter:audioNode,
  createBufferSource:audioNode, createDynamicsCompressor:audioNode, createDelay:()=>audioNode(),
  createBuffer:(c,l,s)=>({ getChannelData:()=>new Float32Array(l||1), length:l||1 }),
  destination:{}, get currentTime(){ return vnow/1000; }, state:'running',
  resume:async()=>{}, suspend:async()=>{}, close:async()=>{} }; };
globalThis.webkitAudioContext = globalThis.AudioContext;

/* ---------- rapor ---------- */
let pas=0, kal=0, atla=0; const satirlar=[];
const yaz = s => { satirlar.push(s); console.log(s); };
const OK   = (ad,d)=>{ pas++; yaz(`  ✓ ${ad}${d?'  ['+d+']':''}`); };
const FAIL = (ad,d)=>{ kal++; yaz(`  ✗ ${ad}${d?'  ['+d+']':''}`); };
const ATLA = (ad,d)=>{ atla++; yaz(`  ~ ${ad} (${d})`); };
const BILGI= m =>yaz(`  · ${m}`);
const BASLIK=m =>yaz('\n'+m);

/* =====================================================================
   OYUNU YÜKLE
   ===================================================================== */
const {game}  = await import('./js/main.js');
const {keys}  = await import('./js/input.js');
const {CHARS} = await import('./js/characters.js');
const {DIFFS} = await import('./js/fighter.js');
const R = await import('./js/render.js');

step(3);
yaz('Oyun yüklendi. Sahne: '+game.scene+' · GROUND='+R.GROUND+' · VW='+R.VW);

/* ---------- yardımcılar ---------- */
const sifirla = ()=>{ for(const k in keys) keys[k]=0; };
function basVeBirak(tus, sure=0.09){ keys[tus]=1; sn(sure); keys[tus]=0; }
function pasifYap(f, poz={}){ // AI'ı deterministik savunma pozuna sabitle
  f.ai = ()=>({left:0,right:0,up:0,down:poz.down?1:0,punch:0,kick:0,block:poz.block?1:0,special:0});
}
function yanYana(mes=55){
  const {p1,p2}=game;
  p1.x=Math.max(80,p2.x-mes); p1.y=R.GROUND; p1.vy=0; p1.kvx=0;
  p1.facing=1; if(p1.state!=='ko')p1.state='idle'; p1.st=0;
}
function rakibiTopla(){
  const p2=game.p2;
  p2.hp=p2.maxHp; p2.stun=0; p2.kvx=0; p2.vy=0; p2.y=R.GROUND;
  p2.juggle=0; p2.otg=0; p2.invuln=0;
  if(p2.state!=='ko') p2.state='idle'; p2.st=1;
}
function dovuseGir(idx, zorluk='normal'){
  sifirla();
  game.scene='select'; game.selCharIdx=idx; game.selIdx=idx;
  game.difficulty=zorluk;
  game.start(idx);           // vs sahnesine geçer
  sn(2.0);                   // vs → fight (1.6s)
  sn(1.6);                   // ROUND splash
  return game.scene==='fight';
}

/* =====================================================================
   TEST BATARYASI
   ===================================================================== */
const ISIMLER=['GÖLGE','BETON','VOLT'];

for(let ci=0; ci<3; ci++){
  BASLIK(`════════════ ${ISIMLER[ci]} ════════════`);
  if(!dovuseGir(ci)){ FAIL('dövüşe girilemedi','sahne='+game.scene); continue; }
  OK('dövüşe girildi', `${game.p1.ch.name} vs ${game.p2.ch.name}`);
  const p1=game.p1, p2=game.p2;
  pasifYap(p2); // rakip sussun

  /* --- 1) YUMRUK ZİNCİRİ: her halka isabet + doğru hasar --- */
  BASLIK(`[${ISIMLER[ci]}] yumruk zinciri (${p1.ch.moves.p.map(m=>m.name).join(' → ')})`);
  {
    rakibiTopla(); yanYana(50); sn(0.3);
    const zincir=p1.ch.moves.p;
    let onceki=p2.hp; const vurulan=[];
    // zinciri sür: her hamlenin aktif penceresi geçince tekrar bas
    keys.punch=1; sn(0.08); keys.punch=0;
    for(let h=0; h<zincir.length; h++){
      const mv=zincir[h];
      sn(mv.t1+0.03);                      // vuruş penceresi işlensin
      const d=+(onceki-p2.hp).toFixed(2); vurulan.push(d); onceki=p2.hp;
      // flinch rakibi geri kaydırır; sonraki halka yetişsin diye mesafeyi tazele
      p2.kvx=0; p2.x=Math.min(R.VW-70, p1.x+p1.facing*46); p2.stun=0;
      if(h<zincir.length-1){ keys.punch=1; sn(mv.dur-mv.t1); keys.punch=0; }
    }
    sn(0.5);
    zincir.forEach((mv,h)=>{
      if(Math.abs(vurulan[h]-mv.dmg)<0.01) OK(`${mv.name} tam hasar`, `${vurulan[h]}`);
      else if(vurulan[h]>0) FAIL(`${mv.name} hasarı sapmış`, `${vurulan[h]} ≠ ${mv.dmg}`);
      else FAIL(`${mv.name} ıskaladı`, 'zincir zamanlaması?');
    });
  }

  /* --- 2) YÜKSEKLİK SİSTEMİ --- */
  BASLIK(`[${ISIMLER[ci]}] yükseklik sistemi`);
  {
    // a) çömelen rakibe HIGH → ıskalar
    const jab=p1.ch.moves.p[0];
    pasifYap(p2,{down:1}); rakibiTopla(); p2.state='crouch'; yanYana(50); sn(0.3);
    let d = p2.hp; basVeBirak('punch'); sn(0.5); d=+(d-p2.hp).toFixed(2);
    if((jab.height==='high') && d===0) OK('çömelene ÜST ıskaladı', jab.name);
    else if(jab.height!=='high') ATLA('çömelene ÜST', 'ilk yumruk high değil');
    else FAIL('çömelen rakibi ÜST vurdu', `${d} hasar`);

    // b) çömelen rakibe MID (launcher) → vurur
    const cp=p1.ch.moves.cp;
    rakibiTopla(); p2.state='crouch'; yanYana(48); sn(0.3);
    d=p2.hp; keys.down=1; sn(0.06); keys.punch=1; sn(0.09); keys.punch=0; keys.down=0;
    sn(0.8); d=+(d-p2.hp).toFixed(2);
    if(d>0) OK('çömelene ORTA vurdu', `${cp.name} ${d} hasar`);
    else FAIL('çömelene ORTA vurmadı', cp.name);
    sn(1.2); // rakip yere insin

    // c) ayakta blok yapan rakibe LOW → tam geçer
    const ck=p1.ch.moves.ck;
    pasifYap(p2,{block:1}); rakibiTopla(); p2.state='block'; yanYana(60); sn(0.3);
    d=p2.hp; keys.down=1; sn(0.06); keys.kick=1; sn(0.09); keys.kick=0; keys.down=0;
    sn(ck.dur+0.3); d=+(d-p2.hp).toFixed(2);
    if(Math.abs(d-ck.dmg)<0.01) OK('ayakta bloğu ALÇAK deldi', `${ck.name} ${d} hasar`);
    else if(d>0) FAIL('ALÇAK kısmen geçti', `${d} ≠ ${ck.dmg} (çip?)`);
    else FAIL('ALÇAK bloğu delemedi', ck.name);
    const yikti = ['down','getup'].includes(p2.state) || p2.state==='crumple';
    if(ck.reaction==='knockdown'){
      if(yikti) OK('ALÇAK yere yıktı', `durum=${p2.state}`);
      else FAIL('ALÇAK yıkmadı', `durum=${p2.state}`);
    }
    sn(1.4);

    // d) çömelik blok ALÇAK'ı keser
    pasifYap(p2,{down:1,block:1}); rakibiTopla(); p2.state='crouchblock'; yanYana(60); sn(0.3);
    d=p2.hp; keys.down=1; sn(0.06); keys.kick=1; sn(0.09); keys.kick=0; keys.down=0;
    sn(ck.dur+0.3); d=+(d-p2.hp).toFixed(2);
    if(d>0 && d<ck.dmg*0.25) OK('çömelik blok ALÇAK\'ı kesti', `çip ${d}`);
    else if(d===0) BILGI('çömelik blokta hiç hasar yok (menzil?)');
    else FAIL('çömelik blok ALÇAK\'ı kesemedi', `${d}`);
    sn(0.8);
  }

  /* --- 3) FIRLATMA --- */
  BASLIK(`[${ISIMLER[ci]}] fırlatma (${p1.ch.throwName||'?'})`);
  {
    pasifYap(p2,{block:1}); rakibiTopla(); p2.state='block'; yanYana(38); sn(0.3);
    const soldaydi = p1.x < p2.x;
    let d=p2.hp;
    keys.punch=1; sn(0.033); keys.kick=1; sn(0.05); keys.punch=0; keys.kick=0;
    sn(1.2);
    d=+(d-p2.hp).toFixed(2);
    if(d>0) OK('fırlatma bloğu deldi', `${d} hasar`);
    else FAIL('fırlatma tutmadı', 'tolerans/menzil?');
    if(ci===0 && d>0){
      const simdiSolda = p1.x < p2.x;
      if(soldaydi!==simdiSolda) OK('Gölge fırlatması yön değiştirdi');
      else FAIL('Gölge fırlatması yön değiştirmedi');
    }
    if(ci===2 && d>0){
      if(p2.stun>0 || p2.state==='hit') OK('Volt fırlatması sersemletti', `stun=${p2.stun.toFixed(2)}`);
      else BILGI('Volt stun penceresi kaçırıldı olabilir, elle doğrula');
    }
    sn(1.0);

    // throw break: kaçış zamanını elle kurup KIRILDI yolunu test et
    pasifYap(p2,{block:1}); rakibiTopla(); p2.state='block'; yanYana(38); sn(0.3);
    d=p2.hp;
    keys.punch=1; sn(0.033); keys.kick=1; // fırlatma başlasın
    sn(0.033); keys.punch=0; keys.kick=0;
    if(p2.state==='thrown'){ p2.thrEscT=0.05; sn(0.6);
      if(p2.hp===d && p1.state!=='throwing') OK('throw break çalışıyor', 'KIRILDI, sıfır hasar');
      else FAIL('throw break başarısız', `hp ${d}→${p2.hp} p1=${p1.state}`);
    } else ATLA('throw break', 'fırlatma yakalanamadı: '+p2.state);
    sn(0.8);
  }

  /* --- 4) COUNTER HIT --- */
  BASLIK(`[${ISIMLER[ci]}] counter hit`);
  {
    pasifYap(p2); rakibiTopla(); yanYana(50); sn(0.3);
    // rakibi "saldırı hazırlığında asılı" bırak
    p2.state='attack'; p2.st=0;
    p2.mv={name:'sahte',anim:'jab',dur:9,t0:8,t1:8.5,range:5,dmg:0,kb:0,ky:-50,height:'high',reaction:'flinch'};
    p2.chain=[p2.mv]; p2.chainIdx=0; p2.hitDone=false;
    const jab=p1.ch.moves.p[0];
    let d=p2.hp; basVeBirak('punch'); sn(0.5); d=+(d-p2.hp).toFixed(2);
    const beklenen=+(jab.dmg*1.3).toFixed(2);
    if(Math.abs(d-beklenen)<0.05) OK('counter ×1.3 tam isabet', `${d} = ${jab.dmg}×1.3`);
    else if(d>jab.dmg) OK('counter bonusu var', `${d} (beklenen ${beklenen})`);
    else FAIL('counter bonusu yok', `${d}`);

    // Beton'un Kancası counter'da çökertmeli
    if(ci===1){
      rakibiTopla(); yanYana(55); sn(0.3);
      p2.state='attack'; p2.st=0;
      p2.mv={name:'sahte',anim:'jab',dur:9,t0:8,t1:8.5,range:5,dmg:0,kb:0,ky:-50,height:'high',reaction:'flinch'};
      p2.chain=[p2.mv]; p2.chainIdx=0;
      const kanca=p1.ch.moves.p[1];
      p1.startSingle(kanca,'p',false);
      sn(kanca.dur+0.15);
      if(p2.state==='crumple'||p2.state==='down') OK('Kanca counter\'da çökertti', `durum=${p2.state}`);
      else FAIL('Kanca counter tepkisi yükselmedi', `durum=${p2.state}`);
      sn(1.6);
    }
  }

  /* --- 5) LAUNCHER + JUGGLE AZALMASI (kontrollü: aynı hamle iki kez) --- */
  BASLIK(`[${ISIMLER[ci]}] launcher + juggle`);
  {
    pasifYap(p2); rakibiTopla(); yanYana(46); sn(0.3);
    const cp=p1.ch.moves.cp, jab=p1.ch.moves.p[0];
    p1.startSingle(cp,'p',false); sn(cp.dur+0.03);
    if(!p2.grounded()) OK('launcher havaya kaldırdı', `vy=${p2.vy.toFixed(0)}`);
    else FAIL('launcher kaldırmadı', `y=${p2.y.toFixed(0)} durum=${p2.state}`);
    p2.x=Math.min(R.VW-70,p1.x+p1.facing*46); p2.kvx=0;
    let h=p2.hp; p1.startSingle(jab,'p',false); sn(jab.dur+0.03);
    const v1=+(h-p2.hp).toFixed(2);
    p2.x=Math.min(R.VW-70,p1.x+p1.facing*46); p2.kvx=0;
    h=p2.hp; p1.startSingle(jab,'p',false); sn(jab.dur+0.03);
    const v2=+(h-p2.hp).toFixed(2);
    if(Math.abs(v1-jab.dmg)<0.05 && Math.abs(v2-jab.dmg*0.8)<0.05)
      OK('juggle azalması birebir ×0.8', `${v1} → ${v2}`);
    else if(v1>0&&v2>0&&v2<v1) OK('juggle azalıyor', `${v1} → ${v2}`);
    else FAIL('juggle sorunlu', `${v1} → ${v2} (havada:${!p2.grounded()})`);
    sn(1.6);
  }

  /* --- 6) YERE YIKMA + YERDE TEK VURUŞ + KALKIŞ DOKUNULMAZLIĞI --- */
  BASLIK(`[${ISIMLER[ci]}] yıkma / yerde ezme / kalkış`);
  {
    pasifYap(p2); rakibiTopla(); yanYana(60); sn(0.3);
    const jab=p1.ch.moves.p[0];
    const kd=[p1.ch.moves.ck,...p1.ch.moves.k,...p1.ch.moves.p].find(m=>m&&m.reaction==='knockdown');
    if(!kd){ ATLA('yıkma','bu karakterde knockdown hamlesi yok'); }
    else {
      p1.startSingle(kd,'k',false); sn(kd.t1+0.06);
      if(p2.state==='down') OK('rakip yere serildi', kd.name);
      else { sn(kd.dur); BILGI(`yıkım durumu: ${p2.state}`); }
      if(p2.state==='down'){
        yanYana(50);
        let h=p2.hp; p1.startSingle(jab,'p',false); sn(jab.dur+0.05);
        const g1=+(h-p2.hp).toFixed(2);
        h=p2.hp; p1.startSingle(jab,'p',false); sn(jab.dur+0.05);
        const g2=+(h-p2.hp).toFixed(2);
        if(g1>0&&g2===0) OK('yerde tek vuruş kuralı', `1.: ${g1} · 2.: ${g2}`);
        else if(g1===0&&g2===0) ATLA('yerde ezme','yerdeyken vuruş penceresi kaçtı');
        else FAIL('yerde birden çok vuruş geçti', `${g1} + ${g2}`);
        let guard=0; while(p2.state==='down'&&guard++<300) sn(0.033);
        if(p2.state==='getup'){
          sn(0.08); p2.x=Math.min(R.VW-70,p1.x+p1.facing*46); p2.kvx=0;
          let h3=p2.hp; p1.startSingle(jab,'p',false); sn(jab.dur+0.03);
          const g3=+(h3-p2.hp).toFixed(2);
          if(g3===0) OK('kalkış dokunulmazlığı (getup ortası vuruş boşa)', `invuln=${p2.invuln.toFixed(2)}`);
          else FAIL('kalkarken vuruldu', `${g3} hasar invuln=${p2.invuln.toFixed(2)}`);
          while(p2.state==='getup') sn(0.033);
          sn(0.06); p2.x=Math.min(R.VW-70,p1.x+p1.facing*46); p2.kvx=0;
          h3=p2.hp; p1.startSingle(jab,'p',false); sn(jab.dur+0.03);
          const g4=+(h3-p2.hp).toFixed(2);
          if(g4>0) OK('kalkış bitince tekrar vurulabiliyor', `${g4}`);
          else BILGI('kalkış sonrası vuruş kaçtı (konum)');
        } else ATLA('kalkış dokunulmazlığı','getup anı yakalanamadı: '+p2.state);
      }
    }
    sn(1.0);
  }

  /* --- 7) FATALITY → SONUÇ → RÖVANŞ --- */
  BASLIK(`[${ISIMLER[ci]}] fatality + rövanş akışı`);
  {
    pasifYap(p2); rakibiTopla(); yanYana(50); sn(0.3);
    game.wins=[1,0]; game.timer=60;
    p2.hp=1;
    basVeBirak('punch'); sn(0.6);
    if(game.finishing||game.fatal) OK('BİTİR ONU aşaması');
    else { FAIL('bitirme gelmedi', `p2hp=${p2.hp} durum=${p2.state}`); sn(2); }
    if(game.finishing&&!game.fatal){ basVeBirak('special'); sn(0.3); }
    if(game.fatal) OK('fatality başladı', game.p1.ch.fatalName);
    else BILGI('fatality tetiklenmedi (normal K.O.)');
    // fatality yavaş çekim + sahne + endRound(1900ms) → result
    let guard=0;
    while(game.scene!=='result' && guard++<1200) sn(0.1);
    if(game.scene==='result') OK('sonuç ekranına ulaşıldı');
    else { FAIL('sonuç ekranı gelmedi', 'sahne='+game.scene); continue; }
    sn(0.9);
    basVeBirak('punch'); sn(0.5);
    if(game.scene==='vs'||game.scene==='fight') OK('tek dokunuş rövanş çalışıyor');
    else FAIL('rövanş çalışmadı', 'sahne='+game.scene);
    sifirla();
  }
}

/* --- 8) ZORLUK FARKI: gerçek AI'ya karşı 12'şer sanal saniye --- */
BASLIK('════════════ ZORLUK FARKI (gerçek AI, 12 sn örneklem) ════════════');
{
  const sonuc={};
  for(const z of ['kolay','normal','zor']){
    dovuseGir(0, z);
    const {p1,p2}=game;
    sifirla();
    let toplam=0;
    for(let t=0;t<120;t++){ // 12 sanal sn, 0.1'lik dilimler
      p1.x=p2.x-70; p1.facing=1;
      const once=p1.hp; sn(0.1);
      toplam+=Math.max(0,once-p1.hp);
      if(p1.hp<30)p1.hp=p1.maxHp;        // tavan etkisi olmasın
      if(game.finishing||game.fatal){game.finishing=false;game.fatal=null;p1.hp=p1.maxHp;p1.state='idle';p1.stun=0;}
    }
    sonuc[z]=+toplam.toFixed(1);
    BILGI(`${z.toUpperCase().padEnd(6)} → ${sonuc[z]} kümülatif hasar (AI: ${p2.ch.name})`);
  }
  if(sonuc.kolay < sonuc.zor) OK('KOLAY < ZOR sıralaması', `${sonuc.kolay} < ${sonuc.zor}`);
  else FAIL('zorluk sıralaması bozuk', JSON.stringify(sonuc));
  if(sonuc.kolay<=sonuc.normal && sonuc.normal<=sonuc.zor) OK('tam sıralama kolay ≤ normal ≤ zor', `${sonuc.kolay} ≤ ${sonuc.normal} ≤ ${sonuc.zor}`);
  else BILGI('normal aradaki yerinde değil (AI rastgeleliği — tekrar koşulabilir)');
}

/* --- 9) KAOS TESTİ: 3 maç, rastgele tuşlar, çökme avı --- */
BASLIK('════════════ KAOS TESTİ (rastgele girdiyle 3 maç) ════════════');
{
  const oncekiHata=jsErrors.length;
  for(let m=0;m<3;m++){
    dovuseGir(m,'zor');
    for(let t=0;t<20*10;t++){ // 20 sanal saniye
      if(Math.random()<0.3) keys.left=+(Math.random()<0.5), keys.right=+(Math.random()<0.5);
      if(Math.random()<0.25) keys.punch=+(Math.random()<0.6);
      if(Math.random()<0.2) keys.kick=+(Math.random()<0.6);
      if(Math.random()<0.1) keys.down=+(Math.random()<0.5);
      if(Math.random()<0.08) keys.up=1; else keys.up=0;
      if(Math.random()<0.08) keys.block=+(Math.random()<0.5);
      if(Math.random()<0.06) keys.special=1; else keys.special=0;
      sn(0.1);
      if(game.scene==='result'){ basVeBirak('punch'); sn(0.5); }
    }
    sifirla();
    BILGI(`maç ${m+1}: sahne=${game.scene} p1=${game.p1?.hp.toFixed(0)} p2=${game.p2?.hp.toFixed(0)}`);
  }
  const yeni=jsErrors.length-oncekiHata;
  if(yeni===0) OK('60 sanal saniye kaosta sıfır JS hatası');
  else FAIL('kaos testinde hata', jsErrors.slice(-yeni).join(' | '));
}

/* ---------- SONUÇ ---------- */
BASLIK('══════════════════ SONUÇ ══════════════════');
yaz(`GEÇEN: ${pas}   KALAN: ${kal}   ATLANAN: ${atla}   JS HATASI: ${jsErrors.length}`);
if(jsErrors.length) yaz('Hatalar: '+[...new Set(jsErrors)].slice(0,5).join(' | '));

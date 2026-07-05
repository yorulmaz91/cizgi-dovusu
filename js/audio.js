/* ============================================================
   SES — Web Audio API ile tamamen prosedürel efektler
   (harici ses dosyası yok; AudioContext mobil autoplay engeli
   yüzünden İLK kullanıcı dokunuşunda/tuşunda başlatılır)
   ============================================================ */
import {clamp} from './utils.js';

let ctx=null, master=null, noiseBuf=null;
let enabled=true;
try{enabled=localStorage.getItem('cd-ses')!=='0';}catch(e){}

function ensureCtx(){
  if(!ctx){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    ctx=new AC();
    master=ctx.createGain();
    master.gain.value=enabled?1:0;
    master.connect(ctx.destination);
    // 0.5 sn'lik beyaz gürültü tamponu (vuruş çıtırtısı / whoosh / patlama için)
    noiseBuf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*0.5),ctx.sampleRate);
    const d=noiseBuf.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  }
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
}
/* mobil autoplay engeli: ses ancak bir kullanıcı hareketiyle açılabilir */
addEventListener('pointerdown',ensureCtx);
addEventListener('keydown',ensureCtx);

const ready=()=>enabled&&ctx&&ctx.state==='running';

/* hızlı atak + üstel sönümlü kazanç zarfı */
function env(vol,t0,dur){
  const g=ctx.createGain();
  g.gain.setValueAtTime(vol,t0);
  g.gain.exponentialRampToValueAtTime(0.001,t0+dur);
  g.connect(master);
  return g;
}
function osc(type,f0,t0){
  const o=ctx.createOscillator();
  o.type=type;o.frequency.setValueAtTime(f0,t0);
  return o;
}
function noise(){
  const s=ctx.createBufferSource();
  s.buffer=noiseBuf;s.loop=true;
  return s;
}

/* ---------------- efektler ---------------- */

/* vuruş: hasar arttıkça (ağır karakter) daha PES, hafifse daha TİZ */
export function hit(dmg,kind){
  if(!ready())return;
  const t=ctx.currentTime;
  const f0=clamp(240-dmg*9,60,220);
  const o=osc('sine',f0,t);
  o.frequency.exponentialRampToValueAtTime(Math.max(35,f0*0.3),t+0.12);
  o.connect(env(clamp(0.45+dmg*0.02,0.45,0.85),t,0.18));
  o.start(t);o.stop(t+0.2);
  // temas çıtırtısı (tekmede biraz daha sert)
  const n=noise();
  const bp=ctx.createBiquadFilter();bp.type='bandpass';
  bp.frequency.value=clamp(2600-dmg*90,700,2400);bp.Q.value=0.8;
  n.connect(bp);bp.connect(env(kind==='k'?0.3:0.22,t,0.09));
  n.start(t);n.stop(t+0.1);
}

/* saldırı savurması: süpürülen bant geçiren gürültü */
export function whoosh(){
  if(!ready())return;
  const t=ctx.currentTime;
  const n=noise();
  const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.6;
  bp.frequency.setValueAtTime(300,t);
  bp.frequency.exponentialRampToValueAtTime(1400,t+0.13);
  const g=ctx.createGain();
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(0.15,t+0.05);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.16);
  n.connect(bp);bp.connect(g);g.connect(master);
  n.start(t);n.stop(t+0.18);
}

/* blok: kısa metalik "tink" (iki tiz parsiyel) */
export function block(){
  if(!ready())return;
  const t=ctx.currentTime;
  for(const[f,v,d]of[[1900,0.16,0.07],[2850,0.09,0.05]]){
    const o=osc('triangle',f,t);
    o.connect(env(v,t,d));
    o.start(t);o.stop(t+d+0.02);
  }
}

/* uppercut / launcher: yükselen ton */
export function rise(){
  if(!ready())return;
  const t=ctx.currentTime;
  const o=osc('sawtooth',180,t);
  o.frequency.exponentialRampToValueAtTime(760,t+0.28);
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1200;
  o.connect(lp);lp.connect(env(0.14,t,0.3));
  o.start(t);o.stop(t+0.32);
}

/* K.O. patlaması: bas gümleme + sönen gürültü dalgası */
export function koBlast(){
  if(!ready())return;
  const t=ctx.currentTime;
  const o=osc('sine',150,t);
  o.frequency.exponentialRampToValueAtTime(28,t+0.5);
  o.connect(env(0.7,t,0.6));
  o.start(t);o.stop(t+0.65);
  const n=noise();
  const lp=ctx.createBiquadFilter();lp.type='lowpass';
  lp.frequency.setValueAtTime(3200,t);
  lp.frequency.exponentialRampToValueAtTime(220,t+0.45);
  n.connect(lp);lp.connect(env(0.45,t,0.5));
  n.start(t);n.stop(t+0.55);
}

/* fatality: bas drop + kalp atışı (sahne bitene dek sürer) */
let heartId=null;
export function fatalityStart(){
  if(!ready())return;
  const t=ctx.currentTime;
  const o=osc('sine',170,t);
  o.frequency.exponentialRampToValueAtTime(24,t+1.1);
  o.connect(env(0.55,t,1.3));
  o.start(t);o.stop(t+1.35);
  const beat=()=>{ // lub-dub
    if(!ready())return;
    const b=ctx.currentTime;
    for(const[dt,v]of[[0,0.5],[0.16,0.3]]){
      const ho=osc('sine',58,b+dt);
      ho.frequency.exponentialRampToValueAtTime(40,b+dt+0.1);
      ho.connect(env(v,b+dt,0.14));
      ho.start(b+dt);ho.stop(b+dt+0.16);
    }
  };
  beat();
  clearInterval(heartId);
  heartId=setInterval(beat,850);
}
export function fatalityEnd(){clearInterval(heartId);heartId=null;}

/* ---------------- ses aç/kapa ayarı ---------------- */
export function toggleSound(){
  enabled=!enabled;
  try{localStorage.setItem('cd-ses',enabled?'1':'0');}catch(e){}
  if(master)master.gain.value=enabled?1:0;
  if(!enabled)fatalityEnd();
  return enabled;
}
const sndBtn=document.getElementById('sndBtn');
const syncBtn=()=>{sndBtn.textContent=enabled?'🔊':'🔇';sndBtn.title=enabled?'Sesi kapat':'Sesi aç';};
sndBtn.addEventListener('click',()=>{toggleSound();syncBtn();});
syncBtn();

/* ============================================================
   SPRITE DENETÇİSİ — node tools/denetci.mjs [kare.png ...]
   Argümansız: assets/sprites/k1'deki TÜM kareleri denetler.
   Kontroller (STIL.md standartlarına göre):
   1) Taban Y tutarlılığı (en alt opak satır = 241 ± 1)
   2) Boy toleransı (duruş kareleri hedef±3; hiçbir kare 242'yi aşamaz)
   3) Siluet çıktıları (düz siyah kopyalar + kontakt sayfası —
      %TEMP%/cd-siluet altına; İNSAN GÖZÜ değerlendirir)
   4) S/B dışı piksel taraması (kanal farkı >14, alfa>200 — punch/walk
      kaynaklarında Δ≈10'luk algılanamaz ton kayması ölçüldü ve tolere
      edildi; eşik gerçek renk kaçaklarını yakalayacak bantta)
   5) Ardışık kare bbox sıçraması (bilinen pivot ofsetleriyle
      düzeltilmiş merkez; >70px UYARI, 40-70px bilgi)
   +) Soluk içerik: alfa 1-40 bandında kalan içerik oranı (ince
      çizgilerin küçültmede görünmez kalması — STIL.md'deki artefakt)
   ============================================================ */
import {PNG} from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KOK=path.resolve(import.meta.dirname,'..');
const KAYNAK=path.join(KOK,'assets','sprites','k1');
const TABAN_Y=241, TABAN_TOL=1, BOY_TOL=3, BOY_MAKS=242;
const ESIK=10; // bbox/siluet için alfa eşiği (soluk içerik dahil edilir)

/* bilinen setler: sıra + oyundaki pivot ofsetleri + duruş kareleri */
const SETLER=[
  {ad:'bekleme',kareler:['bekleme-0','bekleme-1','bekleme-2'],ofset:[0,0,0],durus:[0,1,2],hedef:240},
  {ad:'tekme',kareler:['tekme-0','tekme-1','tekme-2','tekme-3'],ofset:[0,0,0,0],durus:[0],hedef:240},
  {ad:'walk',kareler:['walk_1','walk_2','walk_3'],ofset:[-89,14,75],durus:[0,2],hedef:238},
  {ad:'punch',kareler:['punch_1','punch_2','punch_3'],ofset:[0,-13,37],durus:[0],hedef:240},
  {ad:'hit',kareler:['hit_1','hit_2'],ofset:[0,0],durus:[0,1],hedef:240},
  {ad:'block',kareler:['block_1','block_2'],ofset:[0,1],durus:[0],hedef:240},
];

function olc(dosya){
  const p=PNG.sync.read(fs.readFileSync(dosya));
  const {width:W,height:H,data:D}=p;
  let minX=W,maxX=-1,minY=H,maxY=-1,renkli=0,opak=0,soluk=0,gorunur=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=(y*W+x)*4,a=D[i+3];
    if(a===0)continue;
    gorunur++;
    if(a>ESIK){
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
    }
    if(a>=1&&a<=40)soluk++;
    if(a>200){opak++;
      const r=D[i],g=D[i+1],b=D[i+2];
      if(Math.max(Math.abs(r-g),Math.abs(g-b),Math.abs(r-b))>14)renkli++;
    }
  }
  return {png:p,W,H,minX,maxX,minY,maxY,boy:maxY-minY+1,en:maxX-minX+1,
          merkezX:(minX+maxX)/2,renkli,opak,soluk,gorunur};
}

function siluet(o,hedefDosya){
  const s=new PNG({width:o.W,height:o.H});
  for(let i=0;i<o.W*o.H;i++){
    if(o.png.data[i*4+3]>ESIK){s.data[i*4]=0;s.data[i*4+1]=0;s.data[i*4+2]=0;s.data[i*4+3]=255;}
  }
  fs.writeFileSync(hedefDosya,PNG.sync.write(s));
  return s;
}

/* ---- akış ---- */
const argDosyalar=process.argv.slice(2);
const dosyalar=argDosyalar.length
  ?argDosyalar.map(a=>path.resolve(a))
  :fs.readdirSync(KAYNAK).filter(f=>f.endsWith('.png')).sort().map(f=>path.join(KAYNAK,f));

const siluetDizin=path.join(os.tmpdir(),'cd-siluet');
fs.mkdirSync(siluetDizin,{recursive:true});

let uyari=0,hata=0;
const rapor=new Map(); // ad(uzantısız) → ölçüm
console.log('═══ SPRITE DENETİM RAPORU — '+dosyalar.length+' kare ═══');
for(const d of dosyalar){
  const ad=path.basename(d,'.png');
  const o=olc(d);
  rapor.set(ad,o);
  const notlar=[];
  // 1) taban
  if(Math.abs(o.maxY-TABAN_Y)>TABAN_TOL){notlar.push('✗ TABAN: en alt opak satır '+o.maxY+' (beklenen '+TABAN_Y+'±'+TABAN_TOL+')');hata++;}
  // 2) boy
  if(o.boy>BOY_MAKS){notlar.push('✗ BOY: '+o.boy+' > '+BOY_MAKS+' (tuval taşması riski)');hata++;}
  // 4) renk
  if(o.renkli>0){
    const oran=100*o.renkli/o.opak;
    if(oran>1){notlar.push('⚠ RENK: opak piksellerin %'+oran.toFixed(2)+'i S/B dışı ('+o.renkli+' px)');uyari++;}
    else notlar.push('· renk: %'+oran.toFixed(2)+' ('+o.renkli+' px, kenar kalıntısı — tolere)');
  }
  // +) soluk içerik
  const solukOran=100*o.soluk/o.gorunur;
  if(solukOran>2.5){notlar.push('⚠ SOLUK: görünür içeriğin %'+solukOran.toFixed(1)+'i alfa≤40 (ince çizgiler görünmez kalabilir — STIL.md artefaktı)');uyari++;}
  // 3) siluet
  siluet(o,path.join(siluetDizin,ad+'-siluet.png'));
  console.log((notlar.some(n=>n.startsWith('✗'))?'✗ ':notlar.some(n=>n.startsWith('⚠'))?'⚠ ':'✓ ')
    +ad+' — '+o.en+'x'+o.boy+' taban='+o.maxY
    +(notlar.length?'\n    '+notlar.join('\n    '):''));
}
// 2b) duruş boyu hedef kontrolü + 5) set içi bbox sıçraması
for(const s of SETLER){
  const eksik=s.kareler.filter(k=>!rapor.has(k));
  if(eksik.length===s.kareler.length)continue; // bu set denetim dışı
  console.log('--- set: '+s.ad);
  s.kareler.forEach((k,i)=>{
    const o=rapor.get(k);if(!o)return;
    if(s.durus.includes(i)&&Math.abs(o.boy-s.hedef)>BOY_TOL){
      console.log('    ⚠ '+k+': duruş boyu '+o.boy+' (hedef '+s.hedef+'±'+BOY_TOL+')');uyari++;
    }
  });
  for(let i=1;i<s.kareler.length;i++){
    const a=rapor.get(s.kareler[i-1]),b=rapor.get(s.kareler[i]);
    if(!a||!b)continue;
    const fark=Math.abs((b.merkezX+s.ofset[i])-(a.merkezX+s.ofset[i-1]));
    if(fark>70){console.log('    ⚠ '+s.kareler[i-1]+'→'+s.kareler[i]+': düzeltilmiş merkez sıçraması '+fark.toFixed(0)+'px (>70)');uyari++;}
    else if(fark>40)console.log('    · '+s.kareler[i-1]+'→'+s.kareler[i]+': merkez kayması '+fark.toFixed(0)+'px (hamle uzanımı — bilgi)');
  }
}
/* siluet kontakt sayfası (siyah figürler beyaz zeminde, insan gözü için) */
{
  const adlar=[...rapor.keys()];
  const TW=354,TH=244,pad=4,sutun=6;
  const satir=Math.ceil(adlar.length/sutun);
  const k=new PNG({width:sutun*(TW/2+pad)+pad,height:satir*(TH/2+pad)+pad});
  k.data.fill(255);
  adlar.forEach((ad,n)=>{
    const o=rapor.get(ad);
    const bx=pad+(n%sutun)*(TW/2+pad),by=pad+Math.floor(n/sutun)*(TH/2+pad);
    for(let y=0;y<TH/2;y++)for(let x=0;x<TW/2;x++){
      const a=o.png.data[((y*2)*TW+x*2)*4+3];
      if(a>ESIK){const di=((by+y)*k.width+bx+x)*4;k.data[di]=0;k.data[di+1]=0;k.data[di+2]=0;}
    }
  });
  fs.writeFileSync(path.join(siluetDizin,'_kontakt.png'),PNG.sync.write(k));
}
console.log('═══ ÖZET: '+dosyalar.length+' kare · '+hata+' hata · '+uyari+' uyarı ═══');
console.log('siluetler (insan gözü değerlendirmesi): '+siluetDizin);
process.exit(hata?1:0);

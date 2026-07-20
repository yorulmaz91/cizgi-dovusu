/* ============================================================
   SPRITE KESİCİ (tek seferlik araç) — node tools/sprite-kes.mjs
   Kök dizindeki sprite şeritlerini karelere böler:
     bekleme-serit.png  → assets/sprites/k1/bekleme-0..2.png
     yan-tekme-serit.png→ assets/sprites/k1/tekme-0..3.png

   Adımlar:
   1) Kenarlardan flood-fill → YALNIZ arka plana bağlı beyaz şeffaflaşır
      (karakterin pantolonu/teni de beyaz; içerideki beyazlar OPAK kalır)
   2) Zemin çizgisi temizliği (tekme şeridinde figürlerin altındaki çizgi)
   3) Beyaz boşluk sütunlarından kare bölme + sıkı kırpma (bbox)
   4) Tekme 3. karesi aynalanır (tüm kareler SAĞA bakar)
   5) Gard karesi 240px boyuna gelecek şekilde şerit bazında ölçek
      (alan-ortalamalı küçültme, premultiply ile saçaksız kenar)
   6) Taban hizası: ayak ağırlık merkezi tuval ortasına, alt kenara 2px
      — TÜM kareler AYNI tuval boyutunda (oyunda çizim tek satır olur)
   Kontrol: siyah zemine bindirilmiş kontrol sayfası %TEMP%'e yazılır
   (şeffaflık deliği olsa siyah görünür).
   ============================================================ */
import {PNG} from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KOK=path.resolve(import.meta.dirname,'..');
const CIKTI=path.join(KOK,'assets','sprites','k1');
const HEDEF_GARD=240;          // gard figürünün çıktı yüksekliği (px)
const BEYAZ=245;               // arka plan beyazı eşiği (pantolon grisi ~232 güvende)

function oku(p){return PNG.sync.read(fs.readFileSync(p));}

/* 1) kenardan flood-fill → arka plan maskesi (1=arka plan) */
function arkaPlanMaskesi(png){
  const {width:W,height:H,data:D}=png;
  const mask=new Uint8Array(W*H);
  const beyazsi=i=>D[i*4+3]<16||(D[i*4]>=BEYAZ&&D[i*4+1]>=BEYAZ&&D[i*4+2]>=BEYAZ);
  const kuyruk=[];
  const ekle=(x,y)=>{const i=y*W+x;if(!mask[i]&&beyazsi(i)){mask[i]=1;kuyruk.push(i);}};
  for(let x=0;x<W;x++){ekle(x,0);ekle(x,H-1);}
  for(let y=0;y<H;y++){ekle(0,y);ekle(W-1,y);}
  while(kuyruk.length){
    const i=kuyruk.pop(),x=i%W,y=(i-x)/W;
    if(x>0)ekle(x-1,y);if(x<W-1)ekle(x+1,y);
    if(y>0)ekle(x,y-1);if(y<H-1)ekle(x,y+1);
  }
  return mask;
}

/* 2) zemin çizgisi: alt üçtebirlik bölgede TEK PARÇA halinde genişliğin
   %40'ından uzun kesintisiz dolu satırlar aranır (figür satırları parçalıdır,
   toplamı uzun olsa da tek parçası kısadır — uzatılmış tekme bacağı ~%30);
   üstünde 14px içinde figür OLMAYAN sütunlarda bant pikselleri silinir
   (ayağın bastığı sütunlar korunur — küçük temas parçası doğal durur) */
function zeminCizgisiTemizle(png,mask){
  const {width:W,height:H}=png;
  const enUzunParca=y=>{ // satırdaki en uzun kesintisiz figür dizisi
    let enUzun=0,su=0;
    for(let x=0;x<W;x++){if(!mask[y*W+x]){su++;if(su>enUzun)enUzun=su;}else su=0;}
    return enUzun;
  };
  const satirDolu=new Array(H).fill(0);
  for(let y=Math.floor(H*0.6);y<H;y++)satirDolu[y]=enUzunParca(y);
  let silinen=0;
  for(let y=Math.floor(H*0.6);y<H;y++){
    if(satirDolu[y]<=W*0.4)continue;
    // bandı komşu yarı-dolu satırlarla genişlet (çizginin yumuşak kenarları)
    let ust=y,alt=y;
    while(ust>Math.floor(H*0.6)&&satirDolu[ust-1]>W*0.3)ust--;
    while(alt<H-1&&satirDolu[alt+1]>W*0.3)alt++;
    for(let x=0;x<W;x++){
      let figurVar=false;
      for(let yy=Math.max(0,ust-14);yy<ust;yy++)if(!mask[yy*W+x]){figurVar=true;break;}
      if(figurVar)continue;
      for(let yy=ust;yy<=Math.min(H-1,alt+2);yy++){
        const i=yy*W+x;
        if(!mask[i]){mask[i]=1;silinen++;}
      }
    }
    y=alt; // bandı atla
  }
  return silinen;
}

/* 3) boş sütunlardan kare bölme (dolu sütun: ≥3 figür pikseli) */
function kareBol(png,mask,beklenen){
  const {width:W,height:H}=png;
  const sutunDolu=new Array(W).fill(0);
  for(let x=0;x<W;x++)for(let y=0;y<H;y++)if(!mask[y*W+x])sutunDolu[x]++;
  const gruplar=[];let bas=-1;
  for(let x=0;x<=W;x++){
    const dolu=x<W&&sutunDolu[x]>=3;
    if(dolu&&bas<0)bas=x;
    if(!dolu&&bas>=0){gruplar.push([bas,x-1]);bas=-1;}
  }
  // küçük boşlukları birleştir, kırıntıları at
  const birlesik=[];
  for(const g of gruplar){
    const son=birlesik[birlesik.length-1];
    if(son&&g[0]-son[1]<12)son[1]=g[1];else birlesik.push([...g]);
  }
  const kareler=birlesik.filter(g=>g[1]-g[0]>=30);
  if(kareler.length!==beklenen)
    throw new Error(`kare sayısı ${kareler.length}, beklenen ${beklenen} — gruplar: ${JSON.stringify(birlesik)}`);
  return kareler;
}

/* bbox içinde kırpıp RGBA + alfa üret (arka plan → şeffaf) */
function kirp(png,mask,x0,x1){
  const {width:W,height:H,data:D}=png;
  let minY=H,maxY=-1,minX=x1,maxX=x0;
  for(let y=0;y<H;y++)for(let x=x0;x<=x1;x++)if(!mask[y*W+x]){
    if(y<minY)minY=y;if(y>maxY)maxY=y;
    if(x<minX)minX=x;if(x>maxX)maxX=x;
  }
  const w=maxX-minX+1,h=maxY-minY+1;
  const out=new PNG({width:w,height:h});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const si=((y+minY)*W+(x+minX)),di=(y*w+x)*4;
    if(mask[si]){out.data[di+3]=0;continue;}
    out.data[di]=D[si*4];out.data[di+1]=D[si*4+1];out.data[di+2]=D[si*4+2];out.data[di+3]=255;
  }
  return out;
}

function aynala(png){
  const {width:W,height:H,data:D}=png;
  const out=new PNG({width:W,height:H});
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const s=(y*W+x)*4,d=(y*W+(W-1-x))*4;
    out.data[d]=D[s];out.data[d+1]=D[s+1];out.data[d+2]=D[s+2];out.data[d+3]=D[s+3];
  }
  return out;
}

/* 5) alan-ortalamalı küçültme (premultiply → saçaksız kenar) */
function olcekle(png,oran){
  if(Math.abs(oran-1)<0.01)return png;
  const {width:W,height:H,data:D}=png;
  const w=Math.max(1,Math.round(W*oran)),h=Math.max(1,Math.round(H*oran));
  const out=new PNG({width:w,height:h});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const sx0=x/oran,sx1=(x+1)/oran,sy0=y/oran,sy1=(y+1)/oran;
    let r=0,g=0,b=0,a=0,alan=0;
    for(let sy=Math.floor(sy0);sy<Math.min(H,Math.ceil(sy1));sy++)
      for(let sx=Math.floor(sx0);sx<Math.min(W,Math.ceil(sx1));sx++){
        const k=(Math.min(sx+1,sx1)-Math.max(sx,sx0))*(Math.min(sy+1,sy1)-Math.max(sy,sy0));
        if(k<=0)continue;
        const i=(sy*W+sx)*4,al=D[i+3]/255;
        r+=D[i]*al*k;g+=D[i+1]*al*k;b+=D[i+2]*al*k;a+=al*k;alan+=k;
      }
    const di=(y*w+x)*4;
    if(a>0.001){
      out.data[di]=Math.round(r/a);out.data[di+1]=Math.round(g/a);out.data[di+2]=Math.round(b/a);
      out.data[di+3]=Math.round(255*a/alan);
    }
  }
  return out;
}

/* 6) ayak ağırlık merkezi: alt %5'lik banttaki opak piksellerin ortalama x'i */
function ayakMerkezi(png){
  const {width:W,height:H,data:D}=png;
  const bant=Math.max(6,Math.round(H*0.05));
  let top=0,say=0;
  for(let y=H-bant;y<H;y++)for(let x=0;x<W;x++){
    const a=D[(y*W+x)*4+3];
    if(a>60){top+=x*a;say+=a;}
  }
  return say?top/say:W/2;
}

/* ---- akış ---- */
const isler=[
  {dosya:'bekleme-serit.png',ad:'bekleme',beklenen:3,aynali:[]},
  {dosya:'yan-tekme-serit.png',ad:'tekme',beklenen:4,aynali:[2]}, // 3. kare sola bakıyor
];
fs.mkdirSync(CIKTI,{recursive:true});
const tum=[];
for(const is_ of isler){
  const png=oku(path.join(KOK,is_.dosya));
  const mask=arkaPlanMaskesi(png);
  const silinen=zeminCizgisiTemizle(png,mask);
  const kareler=kareBol(png,mask,is_.beklenen);
  console.log(`${is_.dosya}: ${png.width}x${png.height}, zemin çizgisi ${silinen}px silindi, ${kareler.length} kare`);
  is_.parcalar=kareler.map(([x0,x1],i)=>{
    let k=kirp(png,mask,x0,x1);
    if(is_.aynali.includes(i))k=aynala(k);
    return k;
  });
  // şerit ölçeği: gard karesi (0. kare) HEDEF_GARD boyuna
  const oran=HEDEF_GARD/is_.parcalar[0].height;
  is_.parcalar=is_.parcalar.map(p=>olcekle(p,oran));
  is_.parcalar.forEach((p,i)=>tum.push({ad:`${is_.ad}-${i}`,png:p,ayak:ayakMerkezi(p)}));
  console.log(`  ölçek ×${oran.toFixed(3)} → kareler: ${is_.parcalar.map(p=>p.width+'x'+p.height).join(', ')}`);
}

/* ortak tuval: ayak merkezi ortada, taban altta (2px pay) */
let yarim=0,maxH=0;
for(const t of tum){
  yarim=Math.max(yarim,t.ayak,t.png.width-t.ayak);
  maxH=Math.max(maxH,t.png.height);
}
const TW=2*Math.ceil(yarim)+8,TH=maxH+4;
console.log(`ortak tuval: ${TW}x${TH} (taban alttan 2px, ayak merkezi x=${TW/2})`);
for(const t of tum){
  const out=new PNG({width:TW,height:TH});
  const ox=Math.round(TW/2-t.ayak),oy=TH-t.png.height-2;
  for(let y=0;y<t.png.height;y++)for(let x=0;x<t.png.width;x++){
    const s=(y*t.png.width+x)*4,d=((y+oy)*TW+(x+ox))*4;
    for(let c=0;c<4;c++)out.data[d+c]=t.png.data[s+c];
  }
  fs.writeFileSync(path.join(CIKTI,t.ad+'.png'),PNG.sync.write(out));
  console.log(`  ${t.ad}.png yazıldı (ayak merkezi ${t.ayak.toFixed(1)} → ${TW/2})`);
}

/* kontrol sayfası: kareleri SİYAH zemine bindir — şeffaflık deliği siyah görünür */
const KN=tum.length,pad=6;
const sayfa=new PNG({width:KN*(TW+pad)+pad,height:TH+2*pad});
sayfa.data.fill(0);
for(let i=0;i<sayfa.width*sayfa.height;i++)sayfa.data[i*4+3]=255; // opak siyah
tum.forEach((t,k)=>{
  const kare=PNG.sync.read(PNG.sync.write((()=>{const o=new PNG({width:TW,height:TH});
    const ox=Math.round(TW/2-t.ayak),oy=TH-t.png.height-2;
    for(let y=0;y<t.png.height;y++)for(let x=0;x<t.png.width;x++){
      const s=(y*t.png.width+x)*4,d=((y+oy)*TW+(x+ox))*4;
      for(let c=0;c<4;c++)o.data[d+c]=t.png.data[s+c];
    }return o;})()));
  const bx=pad+k*(TW+pad);
  for(let y=0;y<TH;y++)for(let x=0;x<TW;x++){
    const s=(y*TW+x)*4,a=kare.data[s+3]/255,d=((y+pad)*sayfa.width+(bx+x))*4;
    sayfa.data[d]=Math.round(kare.data[s]*a);
    sayfa.data[d+1]=Math.round(kare.data[s+1]*a);
    sayfa.data[d+2]=Math.round(kare.data[s+2]*a);
  }
});
const kontrolYolu=path.join(os.tmpdir(),'sprite-kontrol.png');
fs.writeFileSync(kontrolYolu,PNG.sync.write(sayfa));
console.log(`kontrol sayfası (siyah zemin): ${kontrolYolu}`);

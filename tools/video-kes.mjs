/* ============================================================
   VİDEO → SPRITE ŞERİDİ — node tools/video-kes.mjs [video.mp4]
   Yeni boru hattı: video kareleri → çevrim analizi → 8 anahtar
   kare → bilinen temizlik/hizalama → ONAY BEKLEYEN aday setler.
   (Onaydan önce OYUNA BAĞLANMAZ; adaylar kökteki video-aday/
   klasörüne yazılır — Pages beyaz listesi dışıdır, yayınlanmaz.)

   Adımlar:
   1) ffmpeg (ffmpeg-static, yalnız tools bağımlılığı) tüm kareleri
      %TEMP%/cd-video-kare altına çıkarır.
   2) Kare metrikleri (mürekkep kutusu W/H, doluluk) → bbox W
      serisinin OTOKORELASYONUYLA yürüyüş çevrim periyodu T bulunur;
      H'nin en az "nefes aldığı" (std düşük) T uzunluklu segment
      seçilir (uçlar hariç). Alternatif aday: çakışmayan 2. en iyi.
   3) Segment içinde faz çapası = en geniş adım (temas anı); 8 kare
      çevrime eşit aralıkla dağıtılır (temas/geçiş fazları doğal
      örtülür).
   4) Temizlik (bilinen aile, video kirine kalibreli): gri tonlama,
      beyaz eşiği = köşe fonu ölçümünden, siyah eşiği 64, kenardan
      flood-fill şeffaflık (iç beyazlar opak).
   5) Hizalama (mevcut sprite standardı): segment medyan boyu → 238,
      354×244 tuval, taban alttan 2px, ayak-merkezi x=177; taban
      bandı kümeleri ölçülüp manifest'e yazılır (pivot ofset önerisi
      raporda — kesin kalibrasyon bağlama görevinde).
   ============================================================ */
import {PNG} from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require_=createRequire(import.meta.url);
const FFMPEG=require_('ffmpeg-static');

const KOK=path.resolve(import.meta.dirname,'..');
const VIDEO=path.resolve(process.argv[2]||path.join(KOK,'video_walk.mp4'));
const KARE_DIZIN=path.join(os.tmpdir(),'cd-video-kare');
const ADAY=path.join(KOK,'video-aday');
const HEDEF_BOY=238,TW=354,TH=244,MERKEZ=177;

/* ---- 1) kare çıkarma ---- */
if(fs.existsSync(KARE_DIZIN))fs.rmSync(KARE_DIZIN,{recursive:true,force:true});
fs.mkdirSync(KARE_DIZIN,{recursive:true});
execFileSync(FFMPEG,['-i',VIDEO,'-vsync','0',path.join(KARE_DIZIN,'kare_%04d.png')],{stdio:'ignore'});
const dosyalar=fs.readdirSync(KARE_DIZIN).filter(f=>f.endsWith('.png')).sort();
console.log('çıkarılan kare: '+dosyalar.length);

/* ---- 2) metrikler ---- */
const M=[];
for(const d of dosyalar){
  const p=PNG.sync.read(fs.readFileSync(path.join(KARE_DIZIN,d)));
  const {width:W,height:H,data:D}=p;
  let minX=W,maxX=-1,minY=H,maxY=-1,ink=0;
  for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){
    const i=(y*W+x)*4,v=(D[i]+D[i+1]+D[i+2])/3;
    if(v<180){ink++;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
  }
  M.push({d,w:maxX-minX+1,h:maxY-minY+1,ink});
}
const N=M.length;
const ort=a=>a.reduce((t,v)=>t+v,0)/a.length;
const std=a=>{const m=ort(a);return Math.sqrt(ort(a.map(v=>(v-m)*(v-m))));};

/* çevrim periyodu: W serisi otokorelasyonu (gecikme 12..48) */
const Ws=M.map(m=>m.w),Wm=ort(Ws),Wn=Ws.map(v=>v-Wm);
let enT=24,enR=-1e9;
for(let lag=12;lag<=48;lag++){
  let r=0,n=0;
  for(let t=0;t+lag<N;t++){r+=Wn[t]*Wn[t+lag];n++;}
  r/=n;
  if(r>enR){enR=r;enT=lag;}
}
const T=enT;
console.log('çevrim periyodu ≈ '+T+' kare ('+(T/24).toFixed(2)+' sn)');

/* stabil segment: H std en düşük (uçlarda 12 kare pay) */
const skorlar=[];
for(let s=12;s+T<N-12;s++){
  const Hs=M.slice(s,s+T).map(m=>m.h);
  const Is=M.slice(s,s+T).map(m=>m.ink);
  skorlar.push({s,skor:std(Hs)+0.3*std(Is)/ort(Is)*100});
}
skorlar.sort((a,b)=>a.skor-b.skor);
const seg1=skorlar[0];
const seg2=skorlar.find(k=>Math.abs(k.s-seg1.s)>=T)||skorlar[1];
console.log('seçilen segment: kare '+seg1.s+'-'+(seg1.s+T)+' ('+(seg1.s/24).toFixed(2)+'-'+((seg1.s+T)/24).toFixed(2)+' sn), H-std='+seg1.skor.toFixed(2));
console.log('alternatif aday: kare '+seg2.s+'-'+(seg2.s+T)+' ('+(seg2.s/24).toFixed(2)+'-'+((seg2.s+T)/24).toFixed(2)+' sn), H-std='+seg2.skor.toFixed(2));

/* 8 anahtar kare: faz çapası = segmentteki en geniş adım (temas) */
function sekizSec(s){
  let c0=s,enW=-1;
  for(let t=s;t<s+T;t++)if(M[t].w>enW){enW=M[t].w;c0=t;}
  return Array.from({length:8},(_,i)=>s+((c0-s+Math.round(i*T/8))%T));
}
const sec1=sekizSec(seg1.s),sec2=sekizSec(seg2.s);

/* ---- 4) temizlik (kalibrasyonlu) ---- */
const ornekKare=PNG.sync.read(fs.readFileSync(path.join(KARE_DIZIN,M[seg1.s].d)));
let fonMin=255;
for(const[cx,cy]of[[30,30],[ornekKare.width-90,30],[30,ornekKare.height-90],[ornekKare.width-90,ornekKare.height-90]]){
  for(let y=cy;y<cy+60;y++)for(let x=cx;x<cx+60;x++){
    const i=(y*ornekKare.width+x)*4,v=(ornekKare.data[i]+ornekKare.data[i+1]+ornekKare.data[i+2])/3;
    if(v<fonMin)fonMin=v;
  }
}
const BEYAZ=Math.max(200,Math.round(fonMin-6)),SIYAH=64;
console.log('temizlik kalibrasyonu: köşe fonu min='+fonMin.toFixed(0)+' → beyaz eşiği '+BEYAZ+', siyah eşiği '+SIYAH);

function temizle(png){
  const {width:W,height:H,data:D}=png;
  // gri tonlama + eşikler
  const gri=new Uint8Array(W*H);
  for(let i=0;i<W*H;i++){
    let v=(D[i*4]+D[i*4+1]+D[i*4+2])/3;
    if(v>=BEYAZ)v=255;else if(v<=SIYAH)v=0;
    gri[i]=v;
  }
  // kenardan flood-fill: fona bağlı beyaz → şeffaf (iç beyazlar opak)
  const mask=new Uint8Array(W*H);
  const kuyruk=[];
  const ekle=(x,y)=>{const i=y*W+x;if(!mask[i]&&gri[i]===255){mask[i]=1;kuyruk.push(i);}};
  for(let x=0;x<W;x++){ekle(x,0);ekle(x,H-1);}
  for(let y=0;y<H;y++){ekle(0,y);ekle(W-1,y);}
  while(kuyruk.length){
    const i=kuyruk.pop(),x=i%W,y=(i-x)/W;
    if(x>0)ekle(x-1,y);if(x<W-1)ekle(x+1,y);
    if(y>0)ekle(x,y-1);if(y<H-1)ekle(x,y+1);
  }
  const out=new PNG({width:W,height:H});
  for(let i=0;i<W*H;i++){
    if(mask[i]){out.data[i*4+3]=0;continue;}
    out.data[i*4]=gri[i];out.data[i*4+1]=gri[i];out.data[i*4+2]=gri[i];out.data[i*4+3]=255;
  }
  return out;
}

/* alan-ortalamalı ölçek + tuvale yerleştirme (mevcut standart) */
function olcekle(png,oran){
  const w=Math.max(1,Math.round(png.width*oran)),h=Math.max(1,Math.round(png.height*oran));
  const out=new PNG({width:w,height:h});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    let r=0,a=0,alan=0;
    const sy0=y/oran,sy1=(y+1)/oran,sx0=x/oran,sx1=(x+1)/oran;
    for(let sy=Math.floor(sy0);sy<Math.min(png.height,Math.ceil(sy1));sy++)
      for(let sx=Math.floor(sx0);sx<Math.min(png.width,Math.ceil(sx1));sx++){
        const k=(Math.min(sx+1,sx1)-Math.max(sx,sx0))*(Math.min(sy+1,sy1)-Math.max(sy,sy0));
        if(k<=0)continue;
        const i=(sy*png.width+sx)*4,al=png.data[i+3]/255;
        r+=png.data[i]*al*k;a+=al*k;alan+=k;
      }
    const d=(y*w+x)*4;
    if(a>0.001){
      const v=Math.round(r/a);
      out.data[d]=v;out.data[d+1]=v;out.data[d+2]=v;
      out.data[d+3]=Math.round(255*a/alan);
    }
  }
  return out;
}
function kirp(png){
  const {width:W,height:H,data:D}=png;
  let minX=W,maxX=-1,minY=H,maxY=-1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(D[(y*W+x)*4+3]>10){
    if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
  const w=maxX-minX+1,h=maxY-minY+1;
  const out=new PNG({width:w,height:h});
  PNG.bitblt(png,out,minX,minY,w,h,0,0);
  return out;
}
function ayakMerkezi(png){
  const {width:W,height:H,data:D}=png;
  const bant=Math.max(6,Math.round(H*0.05));
  let top=0,say=0;
  for(let y=H-bant;y<H;y++)for(let x=0;x<W;x++){
    const a=D[(y*W+x)*4+3];if(a>60){top+=x*a;say+=a;}
  }
  return say?top/say:W/2;
}
function tabanKumeleri(png){
  const {width:W,height:H,data:D}=png;
  const sutun=[];
  for(let x=0;x<W;x++){let k=0;for(let y=H-14;y<H;y++)if(D[(y*W+x)*4+3]>60)k++;sutun.push(k);}
  const kum=[];let bas=-1;
  for(let x=0;x<=W;x++){
    const dolu=x<W&&sutun[x]>0;
    if(dolu&&bas<0)bas=x;
    if(!dolu&&bas>=0){if(x-bas>=5){let t=0,n=0;for(let m=bas;m<x;m++){t+=m*sutun[m];n+=sutun[m];}kum.push(+(t/n).toFixed(1));}bas=-1;}
  }
  return kum;
}

/* ---- 5) setleri işle ve yaz ---- */
fs.rmSync(ADAY,{recursive:true,force:true});
fs.mkdirSync(path.join(ADAY,'secili'),{recursive:true});
fs.mkdirSync(path.join(ADAY,'alternatif'),{recursive:true});
function setIsle(idxler,klasor,onek){
  const temizler=idxler.map(i=>kirp(temizle(PNG.sync.read(fs.readFileSync(path.join(KARE_DIZIN,M[i].d))))));
  const medyanH=temizler.map(t=>t.height).sort((a,b)=>a-b)[4];
  const oran=HEDEF_BOY/medyanH;
  const bilgi=[];
  temizler.forEach((t,n)=>{
    const k=olcekle(t,oran);
    const ayak=ayakMerkezi(k);
    const tuval=new PNG({width:TW,height:TH});
    const ox=Math.round(MERKEZ-ayak),oy=TH-k.height-2;
    for(let y=0;y<k.height;y++)for(let x=0;x<k.width;x++){
      const tx=x+ox,ty=y+oy;
      if(tx<0||ty<0||tx>=TW||ty>=TH)continue;
      const s=(y*k.width+x)*4,d=(ty*TW+tx)*4;
      for(let c=0;c<4;c++)tuval.data[d+c]=k.data[s+c];
    }
    fs.writeFileSync(path.join(klasor,onek+'_'+(n+1)+'.png'),PNG.sync.write(tuval));
    bilgi.push({kare:onek+'_'+(n+1),videoKare:idxler[n],boy:k.height,tabanKumeleri:tabanKumeleri(tuval)});
  });
  console.log(onek+': medyan boy '+medyanH+' → ölçek ×'+oran.toFixed(3));
  return {oran,bilgi};
}
const s1=setIsle(sec1,path.join(ADAY,'secili'),'yuru8');
const s2=setIsle(sec2,path.join(ADAY,'alternatif'),'alt8');
fs.writeFileSync(path.join(ADAY,'manifest.json'),JSON.stringify({
  video:path.basename(VIDEO),fps:24,cevrimKare:T,
  secili:{baslangic:seg1.s,sn:[+(seg1.s/24).toFixed(2),+((seg1.s+T)/24).toFixed(2)],kareler:sec1,olcek:+s1.oran.toFixed(4),bilgi:s1.bilgi},
  alternatif:{baslangic:seg2.s,sn:[+(seg2.s/24).toFixed(2),+((seg2.s+T)/24).toFixed(2)],kareler:sec2,olcek:+s2.oran.toFixed(4),bilgi:s2.bilgi},
  temizlik:{beyazEsik:BEYAZ,siyahEsik:SIYAH,fonMin:+fonMin.toFixed(0)},
},null,1));

/* kompozitler: onay için — seçili set, alternatif set, önce/sonra */
function kompozit(klasor,onek,hedef){
  const K=Array.from({length:8},(_,i)=>PNG.sync.read(fs.readFileSync(path.join(klasor,onek+'_'+(i+1)+'.png'))));
  const s=new PNG({width:8*(TW/2+4)+4,height:TH/2+8});
  for(let i=0;i<s.width*s.height;i++){s.data[i*4]=235;s.data[i*4+1]=235;s.data[i*4+2]=232;s.data[i*4+3]=255;}
  K.forEach((k,n)=>{
    const bx=4+n*(TW/2+4);
    for(let y=0;y<TH/2;y++)for(let x=0;x<TW/2;x++){
      const si=((y*2)*TW+x*2)*4,a=k.data[si+3]/255,d=((y+4)*s.width+bx+x)*4;
      s.data[d]=Math.round(k.data[si]*a+235*(1-a));
      s.data[d+1]=Math.round(k.data[si+1]*a+235*(1-a));
      s.data[d+2]=Math.round(k.data[si+2]*a+232*(1-a));
    }
  });
  fs.writeFileSync(hedef,PNG.sync.write(s));
}
kompozit(path.join(ADAY,'secili'),'yuru8',path.join(ADAY,'kompozit-secili.png'));
kompozit(path.join(ADAY,'alternatif'),'alt8',path.join(ADAY,'kompozit-alternatif.png'));
console.log('adaylar: '+ADAY+' (secili/, alternatif/, kompozitler, manifest.json)');

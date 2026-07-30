/* ============================================================
   DÜZGÜN IZGARA ŞERİT KESİCİ — node tools/serit-kes.mjs
   Hazır (şeffaf zeminli, eşit hücreli) sprite şeritlerini oyunun
   standart tuvaline hizalar. Video hattından farkı: kare seçimi/
   temizlik YOK — şerit zaten kare kare hazır gelir; burada yalnız
   HİZALAMA yapılır (mevcut sprite standardıyla birebir aynı):
     354x244 tuval · taban alttan 2px (y=241) · ayak-merkezi x=177
     · figür boyu 240 (idle6 referansı) · TEK ORAN (nefes korunur)
   Kullanım: node tools/serit-kes.mjs <serit.png> <kareSayisi> <onek>
   Örn: node tools/serit-kes.mjs char1_idle_34_8kare.png 8 idle34
   ============================================================ */
import {PNG} from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KOK=path.resolve(import.meta.dirname,'..');
const CIKTI=path.join(KOK,'assets','sprites','k1');
const TW=354,TH=244,MERKEZ=177,HEDEF_BOY=240,ALT_PAY=2;

const [seritYol,kareSayisiS,onek]=process.argv.slice(2);
if(!seritYol||!kareSayisiS||!onek){
  console.log('kullanım: node tools/serit-kes.mjs <serit.png> <kareSayisi> <onek>');
  process.exit(1);
}
const KARE=parseInt(kareSayisiS);
const serit=PNG.sync.read(fs.readFileSync(path.resolve(seritYol)));
const {width:SW,height:SH,data:SD}=serit;
if(SW%KARE!==0)throw new Error('şerit genişliği ('+SW+') kare sayısına ('+KARE+') tam bölünmüyor');
const HW=SW/KARE;
console.log('şerit '+SW+'x'+SH+' → '+KARE+' hücre × '+HW+'x'+SH);

/* hücreleri kırp (alfa>10 sınır kutusu) */
const parcalar=[];
for(let i=0;i<KARE;i++){
  const cx0=i*HW;
  let x0=1e9,x1=-1,y0=1e9,y1=-1;
  for(let y=0;y<SH;y++)for(let x=cx0;x<cx0+HW;x++)if(SD[(y*SW+x)*4+3]>10){
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
  }
  if(x1<0)throw new Error('hücre '+(i+1)+' boş');
  const w=x1-x0+1,h=y1-y0+1;
  const p=new PNG({width:w,height:h});
  PNG.bitblt(serit,p,x0,y0,w,h,0,0);
  parcalar.push(p);
}

/* alan-ortalamalı küçültme (premultiply — saçaksız kenar) */
function olcekle(png,oran){
  const w=Math.max(1,Math.round(png.width*oran)),h=Math.max(1,Math.round(png.height*oran));
  const out=new PNG({width:w,height:h});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const sx0=x/oran,sx1=(x+1)/oran,sy0=y/oran,sy1=(y+1)/oran;
    let r=0,g=0,b=0,a=0,alan=0;
    for(let sy=Math.floor(sy0);sy<Math.min(png.height,Math.ceil(sy1));sy++)
      for(let sx=Math.floor(sx0);sx<Math.min(png.width,Math.ceil(sx1));sx++){
        const k=(Math.min(sx+1,sx1)-Math.max(sx,sx0))*(Math.min(sy+1,sy1)-Math.max(sy,sy0));
        if(k<=0)continue;
        const i=(sy*png.width+sx)*4,al=png.data[i+3]/255;
        r+=png.data[i]*al*k;g+=png.data[i+1]*al*k;b+=png.data[i+2]*al*k;a+=al*k;alan+=k;
      }
    const d=(y*w+x)*4;
    if(a>0.001){
      out.data[d]=Math.round(r/a);out.data[d+1]=Math.round(g/a);out.data[d+2]=Math.round(b/a);
      out.data[d+3]=Math.round(255*a/alan);
    }
  }
  return out;
}
function ayakMerkezi(png){ // taban bandının alfa-ağırlıklı x'i (mevcut standart)
  const {width:W,height:H,data:D}=png;
  const bant=Math.max(6,Math.round(H*0.05));
  let top=0,say=0;
  for(let y=H-bant;y<H;y++)for(let x=0;x<W;x++){
    const a=D[(y*W+x)*4+3];if(a>60){top+=x*a;say+=a;}
  }
  return say?top/say:W/2;
}

/* TEK ORAN: medyan boydan — kareler arası boy farkı (nefes) korunur */
const boylar=parcalar.map(p=>p.height).slice().sort((a,b)=>a-b);
const medyan=boylar[Math.floor(KARE/2)];
const oran=HEDEF_BOY/medyan;
console.log('medyan boy '+medyan+' → tek ölçek ×'+oran.toFixed(4));

const bilgi=[];
parcalar.forEach((p,i)=>{
  const k=olcekle(p,oran);
  const ayak=ayakMerkezi(k);
  const t=new PNG({width:TW,height:TH});
  const ox=Math.round(MERKEZ-ayak),oy=TH-k.height-ALT_PAY;
  for(let y=0;y<k.height;y++)for(let x=0;x<k.width;x++){
    const tx=x+ox,ty=y+oy;
    if(tx<0||ty<0||tx>=TW||ty>=TH)continue;
    const s=(y*k.width+x)*4,d=(ty*TW+tx)*4;
    for(let c=0;c<4;c++)t.data[d+c]=k.data[s+c];
  }
  fs.writeFileSync(path.join(CIKTI,onek+'_'+(i+1)+'.png'),PNG.sync.write(t));
  bilgi.push({kare:onek+'_'+(i+1),boy:k.height,en:k.width,ayak:+ayak.toFixed(1)});
  console.log('  '+onek+'_'+(i+1)+'.png: '+k.width+'x'+k.height+' (ayak merkezi '+ayak.toFixed(1)+' → '+MERKEZ+')');
});

/* kontrol kompoziti (açık zemin) */
{
  const s=new PNG({width:KARE*(TW/2+4)+4,height:TH/2+8});
  for(let i=0;i<s.width*s.height;i++){s.data[i*4]=235;s.data[i*4+1]=235;s.data[i*4+2]=232;s.data[i*4+3]=255;}
  for(let n=0;n<KARE;n++){
    const k=PNG.sync.read(fs.readFileSync(path.join(CIKTI,onek+'_'+(n+1)+'.png')));
    const bx=4+n*(TW/2+4);
    for(let y=0;y<TH/2;y++)for(let x=0;x<TW/2;x++){
      const si=((y*2)*TW+x*2)*4,a=k.data[si+3]/255,d=((y+4)*s.width+bx+x)*4;
      s.data[d]=Math.round(k.data[si]*a+235*(1-a));
      s.data[d+1]=Math.round(k.data[si+1]*a+235*(1-a));
      s.data[d+2]=Math.round(k.data[si+2]*a+232*(1-a));
    }
  }
  const yol=path.join(os.tmpdir(),onek+'-kontrol.png');
  fs.writeFileSync(yol,PNG.sync.write(s));
  console.log('kontrol: '+yol);
}

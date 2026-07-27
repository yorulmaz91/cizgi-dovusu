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

/* 0) filigran temizliği: üst bandı (figürlerin üstünde kalan bölge) beyaza
   boya — "AI-Generated" rozeti gibi arka plana bağlı OLMAYAN köşe damgaları
   flood-fill'e takılmadan yok olur */
function ustBandiBeyazla(png,yMax){
  const {width:W,data:D}=png;
  for(let y=0;y<Math.min(yMax,png.height);y++)for(let x=0;x<W;x++){
    const i=(y*W+x)*4;D[i]=D[i+1]=D[i+2]=255;D[i+3]=255;
  }
}

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

/* 3b) bileşen bölme: figürler yatayda iç içe geçtiğinde (walk şeridinde
   3. karenin öne uzanan ayağı 4. kareye değecek kadar yakın) sütun kesme
   çalışmaz. Her figür tek bağlı mürekkep kütlesidir: 8-komşuluklu bileşen
   etiketleme ile en büyük N bileşen figür sayılır, kırıntılar yatayda en
   yakın figüre iliştirilir */
function bilesenBol(png,mask,beklenen){
  const {width:W,height:H}=png;
  const et=new Int32Array(W*H).fill(-1);
  const boyut=[],ortX=[];
  let id=0;
  for(let s=0;s<W*H;s++){
    if(mask[s]||et[s]>=0)continue;
    const kuyruk=[s];et[s]=id;let n=0,topX=0;
    while(kuyruk.length){
      const i=kuyruk.pop(),x=i%W,y=(i-x)/W;
      n++;topX+=x;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=W||ny>=H)continue;
        const j=ny*W+nx;
        if(!mask[j]&&et[j]<0){et[j]=id;kuyruk.push(j);}
      }
    }
    boyut.push(n);ortX.push(topX/n);id++;
  }
  const sirali=[...boyut.keys()].sort((a,b)=>boyut[b]-boyut[a]);
  if(sirali.length<beklenen)
    throw new Error(`bileşen sayısı ${sirali.length} < beklenen ${beklenen} (figürler birbirine değiyor olabilir)`);
  const figurler=sirali.slice(0,beklenen);
  // güvenlik: "figür" seçilen bileşenlerden biri cüceyse iki figür birleşmiş demektir
  const enB=boyut[figurler[0]];
  for(const f of figurler)if(boyut[f]<enB*0.05)
    throw new Error(`şüpheli bölme: bileşen boyutları ${figurler.map(f=>boyut[f]).join(', ')} — iki figür birleşmiş olabilir`);
  figurler.sort((a,b)=>ortX[a]-ortX[b]);
  /* kırıntı iliştirme: ağırlık merkezi yanıltır (hız çizgileri iki figürün
     arasında kalabilir) — figür piksellerinden ızgara BFS ile her kırıntı,
     mürekkebi kendine EN YAKIN figüre yapışır */
  const figSet=new Set(figurler);
  const sahip=new Int32Array(W*H).fill(-1);
  const dist=new Int32Array(W*H).fill(-1);
  let dalga=[];
  for(let i=0;i<W*H;i++)if(et[i]>=0&&figSet.has(et[i])){sahip[i]=et[i];dist[i]=0;dalga.push(i);}
  while(dalga.length){
    const yeni=[];
    for(const i of dalga){
      const x=i%W,y=(i-x)/W;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=W||ny>=H)continue;
        const j=ny*W+nx;
        if(dist[j]<0){dist[j]=dist[i]+1;sahip[j]=sahip[i];yeni.push(j);}
      }
    }
    dalga=yeni;
  }
  const grup=new Map(figurler.map(f=>[f,new Set([f])]));
  const enIyi=new Map(); // kırıntı id → {d:en yakın mesafe, f:figür}
  for(let i=0;i<W*H;i++){
    const e=et[i];
    if(e<0||figSet.has(e))continue;
    const k=enIyi.get(e);
    if(!k||dist[i]<k.d)enIyi.set(e,{d:dist[i],f:sahip[i]});
  }
  for(const [uydu,k] of enIyi)grup.get(k.f).add(uydu);
  return {et,figurler,grup};
}

/* bileşen kümesini kırpıp RGBA + alfa üret (küme dışı → şeffaf) */
function kirpBilesen(png,et,ids){
  const {width:W,height:H,data:D}=png;
  let minY=H,maxY=-1,minX=W,maxX=-1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(ids.has(et[y*W+x])){
    if(y<minY)minY=y;if(y>maxY)maxY=y;if(x<minX)minX=x;if(x>maxX)maxX=x;
  }
  const w=maxX-minX+1,h=maxY-minY+1;
  const out=new PNG({width:w,height:h});
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const s=((y+minY)*W+(x+minX)),di=(y*w+x)*4;
    if(ids.has(et[s])){
      out.data[di]=D[s*4];out.data[di+1]=D[s*4+1];out.data[di+2]=D[s*4+2];out.data[di+3]=255;
    }
  }
  return out;
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

/* kafa genişliği tahmini: üst %12'lik banttaki en uzun yatay opak dizi —
   kareler arası çizim ölçeği tutarlılığını denetlemek için (tanı çıktısı) */
function kafaGenisligi(png){
  const {width:W,height:H,data:D}=png;
  let enUzun=0;
  for(let y=0;y<H*0.12;y++){
    let su=0;
    for(let x=0;x<W;x++){
      if(D[(y*W+x)*4+3]>60){su++;if(su>enUzun)enUzun=su;}else su=0;
    }
  }
  return enUzun;
}

/* ---- akış ----
   kullan: şeritten yalnız bu kareler alınır (walk 4. kare = 3.'nün kopyası)
   ustTemizle: bu satıra kadar üst bant beyazlanır (filigran)
   esitle: bu karelerin KENDİ kutusu hedefe ölçeklenir (aynı poz ailesi,
           kaynakta farklı büyüklükte çizilmişler); diğerleri 0. karenin oranını alır
   adlar: çıktı dosya adları (varsayılan: ad-indeks) */
const isler=[
  {dosya:'bekleme-serit.png',ad:'bekleme',beklenen:3,aynali:[]},
  {dosya:'yan-tekme-serit.png',ad:'tekme',beklenen:4,aynali:[2]}, // 3. kare sola bakıyor
  {dosya:'walk_raw.png',ad:'walk',beklenen:4,aynali:[],kullan:[0,1,2],
   ustTemizle:140,hedef:238,esitle:[0,2],adlar:['walk_1','walk_2','walk_3'],
   bolme:'bilesen',  // kareler yatayda iç içe: sütun yerine bileşen bölme
   nester:[1116]},   // 3-4. karelerin ayak uçları x≈1104-1128'de birleşik (y 678-700,
                     // ölçüldü) — 2px'lik dikey kesik bileşenleri ayırır, kayıp görünmez
  {dosya:'punch_raw.png',ad:'punch',beklenen:4,aynali:[],kullan:[0,1,2],
   ustTemizle:140,hedef:240,adlar:['punch_1','punch_2','punch_3'],
   bolme:'bilesen',  // 3. karedeki hız çizgileri gövdeden kopuk: en-yakın-mürekkep
                     // kırıntı iliştirmesi onları F3'ün yumruğuna yapıştırır
   nester:[362,654]},// F1-F2 ayak ucu köprüsü x≈354-378 (y 687-709) ve F2-F3
                     // köprüsü x≈652-656 (y 635-699) — ikisi de yalnız ayak hizasında
];
fs.mkdirSync(CIKTI,{recursive:true});
const tum=[];
for(const is_ of isler){
  const png=oku(path.join(KOK,is_.dosya));
  if(is_.ustTemizle)ustBandiBeyazla(png,is_.ustTemizle);
  const mask=arkaPlanMaskesi(png);
  const silinen=zeminCizgisiTemizle(png,mask);
  // neşter: birbirine değen figürleri ayıran 2px'lik dikey kesikler
  if(is_.nester)for(const nx of is_.nester)
    for(let y=0;y<png.height;y++){mask[y*png.width+nx]=1;if(nx+1<png.width)mask[y*png.width+nx+1]=1;}
  let parcalar;
  if(is_.bolme==='bilesen'){
    const {et,figurler,grup}=bilesenBol(png,mask,is_.beklenen);
    parcalar=figurler.map(f=>kirpBilesen(png,et,grup.get(f)));
  }else{
    const kareler=kareBol(png,mask,is_.beklenen);
    parcalar=kareler.map(([x0,x1])=>kirp(png,mask,x0,x1));
  }
  console.log(`${is_.dosya}: ${png.width}x${png.height}, zemin çizgisi ${silinen}px silindi, ${parcalar.length} kare (${is_.bolme==='bilesen'?'bileşen':'sütun'} bölme)`);
  parcalar=parcalar.map((k,i)=>is_.aynali.includes(i)?aynala(k):k);
  if(is_.kullan)parcalar=is_.kullan.map(i=>parcalar[i]);
  // şerit ölçeği: 0. kare hedef boya; esitle'dekiler kendi kutusundan hedefe
  const hedef=is_.hedef||HEDEF_GARD;
  const oranTemel=hedef/parcalar[0].height;
  parcalar=parcalar.map((p,j)=>
    olcekle(p,(is_.esitle&&is_.esitle.includes(j))?hedef/p.height:oranTemel));
  parcalar.forEach((p,j)=>tum.push({ad:(is_.adlar&&is_.adlar[j])||`${is_.ad}-${j}`,png:p,ayak:ayakMerkezi(p)}));
  console.log(`  temel ölçek ×${oranTemel.toFixed(3)} → kareler: ${parcalar.map(p=>p.width+'x'+p.height).join(', ')}`);
  console.log(`  kafa genişlikleri (ölçek tutarlılık tanısı): ${parcalar.map(p=>kafaGenisligi(p)).join(', ')}`);
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

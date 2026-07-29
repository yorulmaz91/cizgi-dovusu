/* ============================================================
   PARÇA KESİCİ v2 — node tools/parca-kes.mjs
   GERÇEK PARÇA SAYFALARINDAN kaplama parçaları keser:
   parca_pro.jpg + parca_normal.jpg (kökte; JPG → bilinen hat
   kuralıyla jpg-temizle'den geçer). Frankenstein dönemi kapandı —
   eski tek-kare kesimleri assets/arsiv/parca-frankenstein/ altında.

   Kaynak seçimi (sabit):
   - KAFA: parca_normal'ın tek kafası (boyun payıyla)
   - GÖVDE: parca_pro kafasız manken — kuşak uçlarının hemen
     altından yatay neşter (altKes), omuz soket işareti beyaz
     doldurulur (beyazDoldur elipsi), boyun payı korunur
   - ÜST KOL: parca_pro yatay düz parça (uç halkaları sınır dışı)
   - ÖN KOL+BANT+YUMRUK: parca_pro bükük kol, dirsekten kesilip
     kemik eksenine rektifiye
   - UYLUK: parca_normal soldaki kumaş dokulu parça (halkalar dışarıda)
   - İNCİK+AYAK: parca_normal sağdaki temiz parça

   Her parça kemik eksenine REKTİFİYE (eklem-1 çapada, pay1/pay2
   örtüşme). KİMLİK KARARI uygulandı: sabitK kafa büyütmesi YOK —
   kafa da kemik ölçeğiyle çizilir (gerçekçi oran, kimlik_v1 esas).
   ============================================================ */
import {PNG} from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {jpgOkuTemizle} from './jpg-temizle.mjs';

const KOK=path.resolve(import.meta.dirname,'..');
const CIKTI=path.join(KOK,'assets','sprites','k1','parca');
/* çıkış ölçeği: 2816'lık sayfa piksellerinden oyun ölçeğine yakın parçaya —
   konturlar (~4-6px) çıktıda ~1px kalır, çalışma anı k'sı ~0.2'ye çıkar
   (aşırı küçültmede çizgilerin hayalete dönmesini önler) */
const OLCEK=0.22;

/* kaynak sayfalardaki ölçülmüş koordinatlar (2816x1536 kaynak px) */
const PARCALAR=[
  {ad:'kafa',  kaynak:'parca_normal',J1:[859,486],J2:[922,134],
   W:300,eksenX:150,pay1:26,pay2:20,xAyna:true}, // J1=boyun (çapa), yukarı kemik
  {ad:'govde', kaynak:'parca_pro',J1:[1422,915],J2:[1408,260],
   W:380,eksenX:190,pay1:265,pay2:50,xAyna:true, // pay1: kuşak ucu altına dek (yatay neşter)
   beyazDoldur:[{cx:1341,cy:380,rx:52,ry:44}]},  // omuz soket işareti (dar elips: kontur ısırığı olmasın)
  {ad:'ust_kol',kaynak:'parca_pro',J1:[465,605],J2:[971,605],
   W:200,eksenX:100,pay1:16,pay2:16},            // uç halkaları sınır dışında kalır
  {ad:'on_kol',kaynak:'parca_pro',J1:[1844,641],J2:[2189,627],
   W:170,eksenX:85,pay1:25,pay2:290},            // pay2: bant + yumruk dahil
  {ad:'uyluk',kaynak:'parca_normal',J1:[444,660],J2:[422,1400],
   W:250,eksenX:125,pay1:10,pay2:14},
  {ad:'incik',kaynak:'parca_normal',J1:[2394,855],J2:[2365,1387],
   W:210,eksenX:60,pay1:10,pay2:125},            // eksen solda: ayak burnu + taban tam sığar
];

const kaynaklar=new Map();
function kaynakAl(ad){
  if(!kaynaklar.has(ad)){
    const j=path.join(KOK,ad+'.jpg');
    kaynaklar.set(ad,fs.existsSync(j)?jpgOkuTemizle(j)
      :PNG.sync.read(fs.readFileSync(path.join(KOK,ad+'.png'))));
  }
  return kaynaklar.get(ad);
}
function ornekle(png,x,y){ // çift doğrusal; sayfalar opak → alfa=arka plan beyazı değilse
  const {width:SW,height:SH,data:SD}=png;
  const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;
  let v=0,w0=0;
  for(const[dx,dy,w]of[[0,0,(1-fx)*(1-fy)],[1,0,fx*(1-fy)],[0,1,(1-fx)*fy],[1,1,fx*fy]]){
    const xx=x0+dx,yy=y0+dy;
    if(xx<0||yy<0||xx>=SW||yy>=SH){v+=255*w;w0+=w;continue;}
    v+=SD[(yy*SW+xx)*4]*w;w0+=w;
  }
  return v/w0;
}

fs.mkdirSync(CIKTI,{recursive:true});
const manifest={};
const sablon=[];
for(const P of PARCALAR){
  const kpng=kaynakAl(P.kaynak);
  // beyaz doldurma (soket işareti gibi kapalı bölgeler)
  if(P.beyazDoldur)for(const e of P.beyazDoldur){
    for(let y=Math.floor(e.cy-e.ry);y<=e.cy+e.ry;y++)for(let x=Math.floor(e.cx-e.rx);x<=e.cx+e.rx;x++){
      if(((x-e.cx)/e.rx)**2+((y-e.cy)/e.ry)**2<=1){
        const i=(y*kpng.width+x)*4;
        kpng.data[i]=255;kpng.data[i+1]=255;kpng.data[i+2]=255;
      }
    }
  }
  const dx=P.J2[0]-P.J1[0],dy=P.J2[1]-P.J1[1];
  const L=Math.hypot(dx,dy);
  const u=[dx/L,dy/L],n=[-u[1],u[0]];
  const W=Math.round(P.W*OLCEK),H=Math.round((L+P.pay1+P.pay2)*OLCEK);
  const out=new PNG({width:W,height:H});
  const SS=3; // 3x3 süperörnekleme (alan ortalaması — çizgi kaybolmasın)
  for(let py=0;py<H;py++)for(let px=0;px<W;px++){
    let v=0,ak=0;
    for(let oy=0;oy<SS;oy++)for(let ox=0;ox<SS;ox++){
      const t=(py+(oy+.5)/SS)/OLCEK-P.pay1,s=(px+(ox+.5)/SS)/OLCEK-P.eksenX;
      const sx=P.J1[0]+u[0]*t+n[0]*s,sy=P.J1[1]+u[1]*t+n[1]*s;
      const vv=ornekle(kpng,sx,sy);
      v+=vv;ak+=(vv>=250?0:1);
    }
    v/=SS*SS;ak/=SS*SS;
    const d=(py*W+px)*4;
    if(ak<=0.15){out.data[d+3]=0;} // hücre ağırlıkla sayfa zemini → şeffaf
    else{
      const g=Math.round(Math.min(255,v));
      out.data[d]=g;out.data[d+1]=g;out.data[d+2]=g;
      out.data[d+3]=Math.round(255*Math.min(1,ak*1.4)); // kenarda yumuşak alfa
    }
  }
  fs.writeFileSync(path.join(CIKTI,P.ad+'.png'),PNG.sync.write(out));
  manifest[P.ad]={dosya:P.ad+'.png',w:W,h:H,capaX:+(P.eksenX*OLCEK).toFixed(1),
    capaY:+(P.pay1*OLCEK).toFixed(1),kemikArt:+(L*OLCEK).toFixed(1),xAyna:!!P.xAyna};
  sablon.push({ad:P.ad,w:W,h:H,eksenX:+(P.eksenX*OLCEK).toFixed(1),pay1:+(P.pay1*OLCEK).toFixed(1),L:+(L*OLCEK).toFixed(1),kaynak:P.kaynak});
  console.log(P.ad+' ('+P.kaynak+'): '+W+'x'+H+' kemik='+(L*OLCEK).toFixed(1)+'px çapa=('+(P.eksenX*OLCEK).toFixed(1)+','+(P.pay1*OLCEK).toFixed(1)+')');
}
fs.writeFileSync(path.join(CIKTI,'manifest.json'),JSON.stringify(manifest));

/* PARCA_SABLON.md güncelle (gerçek sayfa dönemi) */
const md=`# PARCA_SABLON.md — İskelet Kaplama Parça Şablonu (v2: gerçek sayfa)

Kaplama parçaları Gemini parça sayfalarından kesilir:
parca_pro.jpg + parca_normal.jpg (kökte; JPG'ler bilinen hat kuralıyla
jpg-temizle'den geçer). Frankenstein dönemi (tek-kare kesim) kapandı;
eski parçalar assets/arsiv/parca-frankenstein/ altında.

## Sözleşme

- Her parça kemik ekseni DİKEY (eklem-1 üstte) rektifiye kesilir.
- Çapa noktası = (eksenX, pay1): parçanın eklem-1'e oturduğu piksel.
- pay1/pay2: eklemlerin ötesine örtüşme payı (eklemde boşluk yok).
- Çalışma anında parça kemik uzunluğuna TEK TİP ölçeklenir
  (k = oyunKemik / kemikArt) ve kemik açısıyla döner.
- KİMLİK KARARI: sabitK kafa büyütmesi YOK — kafa da kemik ölçeğiyle,
  gerçekçi oran (kimlik_v1.png esas).
- Arka uzuvlar ön uzuv görsellerini paylaşır (gövde altında çizilir).

## Mevcut parçalar (ölçülmüş)

| Parça | Kaynak | Piksel boyutu | Çapa (eksenX, pay1) | Kemik boyu (art px) | Oyun kemiği |
|---|---|---|---|---|---|
${sablon.map(s=>'| '+s.ad+' | '+s.kaynak+' | '+s.w+'×'+s.h+' | ('+s.eksenX+', '+s.pay1+') | '+s.L+' | '+(
  {kafa:'boyun→tepe (20)',govde:'kalça→omuz (~26)',ust_kol:'omuz→dirsek (18)',
   on_kol:'dirsek→bilek (17, bant+yumruk dahil)',uyluk:'kalça→diz (22)',incik:'diz→ayak (20, ayak dahil)'}[s.ad])+' |').join('\n')}

## Z-ORDER (çizim sırası — bakış yönüne göre aynalanır)

arka uyluk → arka incik → arka üst kol → arka ön kol →
GÖVDE → ön uyluk → ön incik → KAFA → ön üst kol → ön ön kol

## Yeni sayfa istenirse (Gemini)

- Image A = kimlik_v1.png (resmî kimlik), saf beyaz zemin
- Parçalar birbirine DEĞMESİN, uç halkası/soket işareti OLMASIN
  (varsa araçta beyazDoldur/sınır dışı bırakma ile temizlenir)
- Eklem kesişimleri düz, efekt çizgisi yok, çizgi kalınlığı tutarlı
`;
fs.writeFileSync(path.join(KOK,'PARCA_SABLON.md'),md);
console.log('manifest.json + PARCA_SABLON.md yazıldı');

/* kontrol sayfası: parçalar yan yana (gri zemin) + KIRMIZI çapa işareti */
{
  const K=PARCALAR.map(p=>PNG.sync.read(fs.readFileSync(path.join(CIKTI,p.ad+'.png'))));
  const OL=0.5; // kontrol küçültmesi
  const W=K.reduce((t,k)=>t+Math.ceil(k.width*OL)+10,10);
  const H=Math.max(...K.map(k=>Math.ceil(k.height*OL)))+20;
  const s=new PNG({width:W,height:H});
  for(let i=0;i<W*H;i++){s.data[i*4]=120;s.data[i*4+1]=120;s.data[i*4+2]=120;s.data[i*4+3]=255;}
  let bx=10;
  PARCALAR.forEach((P,pi)=>{
    const k=K[pi],w=Math.ceil(k.width*OL),h=Math.ceil(k.height*OL);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const si=((Math.min(k.height-1,y/OL|0))*k.width+Math.min(k.width-1,x/OL|0))*4;
      const a=k.data[si+3]/255,d=((y+10)*W+bx+x)*4;
      s.data[d]=Math.round(k.data[si]*a+120*(1-a));
      s.data[d+1]=Math.round(k.data[si+1]*a+120*(1-a));
      s.data[d+2]=Math.round(k.data[si+2]*a+120*(1-a));
    }
    // çapa: kırmızı artı
    const ax=bx+Math.round(P.eksenX*OL),ay=10+Math.round(P.pay1*OL);
    for(let t=-4;t<=4;t++){
      for(const[xx,yy]of[[ax+t,ay],[ax,ay+t]]){
        if(xx>=0&&yy>=0&&xx<W&&yy<H){const d=(yy*W+xx)*4;s.data[d]=255;s.data[d+1]=0;s.data[d+2]=0;}
      }
    }
    bx+=w+10;
  });
  fs.writeFileSync(path.join(os.tmpdir(),'parca2-kontrol.png'),PNG.sync.write(s));
  console.log('kontrol: '+path.join(os.tmpdir(),'parca2-kontrol.png'));
}

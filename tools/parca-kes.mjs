/* ============================================================
   PARÇA KESİCİ — node tools/parca-kes.mjs
   punch_1 (gard) karesinden iskelet kaplama parçalarını keser.
   Her parça kemik eksenine göre REKTİFİYE edilir (kemik dikey,
   eklem-1 üstte): çalışma anında parça, kemiğin gerçek açısıyla
   döndürülüp eklem-1'e çapalanır. Parça sınırları eklem
   bölgelerinde ve örtüşme payıyla (pay1/pay2) kesilir.
   Çıktı: assets/sprites/k1/parca/*.png + manifest.json +
   PARCA_SABLON.md (Gemini A-pose parça sayfası şablonu).
   GEÇİCİ KAPLAMA: tek kareden kesim — her açıda mükemmel durmaz;
   kalıcısı A-pose parça sayfasından gelecek (şablon hazır).
   Arka uzuvlar ön uzuvların görsellerini paylaşır (gövde altında
   çizildikleri için kesim kusurları gizlenir).
   ============================================================ */
import {PNG} from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KOK=path.resolve(import.meta.dirname,'..');
const CIKTI=path.join(KOK,'assets','sprites','k1','parca');

/* Parça tanımları — kaynak kare + o karede ölçülen eklemler (kaynak px).
   Gard pozunda yumruklar yüzün/göğsün önünde olduğu için kafa walk_1'den
   (eller aşağıda), gövde punch_3'ten (yumruk kolu uzakta, sırt açık)
   kesilir; uzuvlar punch_1'in tam görünür ÖN kol/bacağından.
   W genişlik, eksenX kemiğin parça içindeki x'i, pay1/pay2 örtüşme. */
const PARCALAR=[
  {ad:'kafa',  kaynak:'walk_1', J1:[186,40], J2:[190,5],  W:56,eksenX:28,pay1:8, pay2:6},
  {ad:'govde', kaynak:'punch_3',J1:[182,112],J2:[195,40], W:56,eksenX:34,pay1:16,pay2:6},
  {ad:'ust_kol',kaynak:'punch_1',J1:[177,55],J2:[210,83], W:28,eksenX:14,pay1:12,pay2:8},
  {ad:'on_kol', kaynak:'punch_1',J1:[210,83],J2:[223,57], W:32,eksenX:16,pay1:8, pay2:24}, // el dahil
  {ad:'uyluk', kaynak:'punch_1',J1:[190,112],J2:[233,163],W:36,eksenX:18,pay1:14,pay2:10},
  {ad:'incik', kaynak:'punch_1',J1:[233,163],J2:[237,218],W:56,eksenX:22,pay1:10,pay2:20}, // ayak dahil
];

const kaynaklar=new Map();
function kaynakAl(ad){
  if(!kaynaklar.has(ad))
    kaynaklar.set(ad,PNG.sync.read(fs.readFileSync(path.join(KOK,'assets','sprites','k1',ad+'.png'))));
  return kaynaklar.get(ad);
}
function ornekle(png,x,y){ // çift doğrusal, premultiply
  const {width:SW,height:SH,data:SD}=png;
  const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;
  let r=0,g=0,b=0,a=0;
  for(const[dx,dy,w]of[[0,0,(1-fx)*(1-fy)],[1,0,fx*(1-fy)],[0,1,(1-fx)*fy],[1,1,fx*fy]]){
    const xx=x0+dx,yy=y0+dy;
    if(xx<0||yy<0||xx>=SW||yy>=SH)continue;
    const i=(yy*SW+xx)*4,al=SD[i+3]/255;
    r+=SD[i]*al*w;g+=SD[i+1]*al*w;b+=SD[i+2]*al*w;a+=al*w;
  }
  return a>0.004?[r/a,g/a,b/a,a*255]:[0,0,0,0];
}

fs.mkdirSync(CIKTI,{recursive:true});
const manifest={};
const sablon=[];
for(const P of PARCALAR){
  const dx=P.J2[0]-P.J1[0],dy=P.J2[1]-P.J1[1];
  const L=Math.hypot(dx,dy);
  const u=[dx/L,dy/L],n=[-u[1],u[0]];
  const H=Math.round(L+P.pay1+P.pay2);
  const out=new PNG({width:P.W,height:H});
  const kpng=kaynakAl(P.kaynak);
  for(let py=0;py<H;py++)for(let px=0;px<P.W;px++){
    const t=py-P.pay1,s=px-P.eksenX;
    const sx=P.J1[0]+u[0]*t+n[0]*s,sy=P.J1[1]+u[1]*t+n[1]*s;
    const[r,g,b,a]=ornekle(kpng,sx,sy);
    const d=(py*P.W+px)*4;
    out.data[d]=Math.round(r);out.data[d+1]=Math.round(g);
    out.data[d+2]=Math.round(b);out.data[d+3]=Math.round(a);
  }
  fs.writeFileSync(path.join(CIKTI,P.ad+'.png'),PNG.sync.write(out));
  /* çalışma anı alanları: capa=(birincil eklemin parça içi pikseli);
     xAyna: kemiği yukarı bakan parçalar (kafa/gövde) çalışma anında ~180°
     döner — dokunun sağ-sol aynasını düzeltir; sabitK: kemik uzunluğundan
     bağımsız sabit ölçek (kafa: oyunun koca kafa kimliği korunur) */
  manifest[P.ad]={dosya:P.ad+'.png',w:P.W,h:H,capaX:P.eksenX,capaY:P.pay1,
    kemikArt:+L.toFixed(1),
    xAyna:(P.ad==='kafa'||P.ad==='govde'),
    ...(P.ad==='kafa'?{sabitK:0.9}:{})};
  sablon.push({ad:P.ad,w:P.W,h:H,eksenX:P.eksenX,pay1:P.pay1,L:+L.toFixed(1),kaynak:P.kaynak});
  console.log(P.ad+' ('+P.kaynak+'): '+P.W+'x'+H+' kemik='+L.toFixed(1)+'px çapa=('+P.eksenX+','+P.pay1+')');
}
fs.writeFileSync(path.join(CIKTI,'manifest.json'),JSON.stringify(manifest));

/* Gemini A-pose parça sayfası şablonu (ölçülmüş değerlerle) */
const md=`# PARCA_SABLON.md — İskelet Kaplama Parça Şablonu

Geçici kaplama punch_1 (gard) karesinden kesildi; kalıcısı Gemini'nin
A-POSE PARÇA SAYFASINDAN gelecek. Bu şablon o sayfanın sözleşmesidir:
aynı adlar, aynı çapa mantığı — sayfa gelince tools/parca-kes.mjs
koordinatları güncellenip yeniden kesilir, oyun kodu DEĞİŞMEZ.

## Sözleşme

- Her parça kemik ekseni DİKEY (eklem-1 üstte) rektifiye kesilir.
- Çapa noktası = (eksenX, pay1): parçanın eklem-1'e oturduğu piksel.
- pay1/pay2: eklemlerin ötesine örtüşme payı (eklemde boşluk görünmesin).
- Çalışma anında parça, kemik uzunluğuna TEK TİP ölçeklenir
  (k = oyunKemik / kemikArt) ve kemik açısıyla döner.
- Arka uzuvlar (geçici kaplamada) ön uzuv görsellerini paylaşır;
  A-pose sayfasında ayrı arka parçalar gelirse adlar: ust_kol_arka,
  on_kol_arka, uyluk_arka, incik_arka.

## Mevcut parçalar (punch_1 kesimi, ölçülmüş)

| Parça | Piksel boyutu | Çapa (eksenX, pay1) | Kemik boyu (art px) | Oyun kemiği |
|---|---|---|---|---|
${sablon.map(s=>'| '+s.ad+' | '+s.w+'×'+s.h+' | ('+s.eksenX+', '+s.pay1+') | '+s.L+' | '+(
  {kafa:'boyun→tepe (20)',govde:'kalça→omuz (~26)',ust_kol:'omuz→dirsek (18)',
   on_kol:'dirsek→bilek (17, el dahil)',uyluk:'kalça→diz (22)',incik:'diz→ayak (20, ayak dahil)'}[s.ad])+' |').join('\n')}

## Z-ORDER (çizim sırası — bakış yönüne göre aynalanır)

arka incik → arka uyluk → arka üst kol → arka ön kol →
GÖVDE → ön uyluk → ön incik → KAFA → ön üst kol → ön ön kol

## A-pose sayfası için istek listesi (Gemini)

- Tek sayfa, saf beyaz zemin, karakter kimliği (STIL.md) birebir
- A-pose: kollar ~45° açık, bacaklar omuz genişliğinde — uzuvlar
  gövdeyi KAPATMASIN (temiz kesim için)
- Parça sınırlarında (dirsek/diz/omuz/kalça) düz kesişim, kıvrım yok
- Efekt çizgisi yok, gölge yok; çizgi kalınlığı 2-3px (354 ölçeğinde)
`;
fs.writeFileSync(path.join(KOK,'PARCA_SABLON.md'),md);
console.log('manifest.json + PARCA_SABLON.md yazıldı');

/* kontrol sayfası: parçalar yan yana, gri zemin */
{
  const dosyalar=PARCALAR.map(p=>p.ad+'.png');
  const K=dosyalar.map(d=>PNG.sync.read(fs.readFileSync(path.join(CIKTI,d))));
  const W=K.reduce((t,k)=>t+k.width+8,8),H=Math.max(...K.map(k=>k.height))+16;
  const s=new PNG({width:W,height:H});
  for(let i=0;i<W*H;i++){s.data[i*4]=120;s.data[i*4+1]=120;s.data[i*4+2]=120;s.data[i*4+3]=255;}
  let bx=8;
  for(const k of K){
    for(let y=0;y<k.height;y++)for(let x=0;x<k.width;x++){
      const si=(y*k.width+x)*4,a=k.data[si+3]/255,d=((y+8)*W+bx+x)*4;
      s.data[d]=Math.round(k.data[si]*a+120*(1-a));
      s.data[d+1]=Math.round(k.data[si+1]*a+120*(1-a));
      s.data[d+2]=Math.round(k.data[si+2]*a+120*(1-a));
    }
    bx+=k.width+8;
  }
  fs.writeFileSync(path.join(os.tmpdir(),'parca-kontrol.png'),PNG.sync.write(s));
  console.log('kontrol: '+path.join(os.tmpdir(),'parca-kontrol.png'));
}

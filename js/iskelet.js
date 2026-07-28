/* ============================================================
   İSKELET GÖRÜNÜMÜ (prototip) — computePose eklem açılarından
   HACİMLİ kukla çizer: kapsül uzuvlar (uyluk/incik/üst kol/ön
   kol), yamuk gövde, mevcut kafa. Eklem noktaları kapsüllerin
   yuvarlak uçlarıyla örtüşür (karton bebek boşluğu yok).
   Görsel dil bilerek kaba: saf siyah dolgu + uzuv ekseni boyunca
   kalın beyaz iç çizgi — SANAT DEĞİL HAREKET HİSSİ test ediliyor.
   Eklem konumları render.js drawFighter ile BİREBİR aynı zincirden
   türetilir (aynı computePose verisi, aynı seg matematiği); hamle
   süreleri/hasarlar/hitbox'lara dokunulmaz — salt çizim katmanı.
   Kapsam (prototip): GÖLGE + idle/yürüme/yer yumruk zinciri
   (aparkat hariç)/yan tekme (yeop)/hit — kalanı vektöre düşer.
   ============================================================ */
import {INK,PAPER} from './effects.js';
import {drawHead} from './render.js';

/* bu durum iskelet prototipinde kapsanıyor mu? */
function kapsam(f){
  if(f.state==='idle'||f.state==='walk')return true;
  if(f.state==='hit'&&f.grounded())return true;
  if(f.state==='attack'&&f.mv){
    if(f.mv.anim==='yeop')return true;
    if(f.mvKind==='p'&&!f.airMove&&f.mv.anim!=='upper')return true;
  }
  return false;
}

/* kapsül: iki eklem arasını dolduran yuvarlatılmış parça +
   eksen boyunca beyaz iç çizgi (kaba stil) */
function kapsul(g,x1,y1,x2,y2,r){
  const a=Math.atan2(y2-y1,x2-x1);
  g.fillStyle=INK;
  g.beginPath();
  g.arc(x1,y1,r,a+Math.PI/2,a-Math.PI/2);
  g.arc(x2,y2,r,a-Math.PI/2,a+Math.PI/2);
  g.closePath();g.fill();
  g.strokeStyle=PAPER;g.lineWidth=2;g.lineCap='round';
  g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
}

/* true dönerse çizim yapıldı; kapsam dışıysa false → vektör devam eder */
export function drawIskelet(g,ftr,ground){
  if(!kapsam(ftr))return false;
  const p=ftr.pose(),f=ftr.facing;
  const hipY=ftr.y-46+p.dip, hip=[ftr.x+(p.hipShift||0)*f,hipY];
  const seg=(x,y,a,len)=>[x+Math.sin(a)*len*f,y+Math.cos(a)*len];
  g.save();

  // zemin gölgesi (vektörle aynı dil)
  if(ftr.state!=='ko'){
    const alt=ground-ftr.y;
    g.fillStyle=INK==='#1A1A1A'?'rgba(0,0,0,.08)':'rgba(255,255,255,.08)';
    g.beginPath();g.ellipse(ftr.x,ground+4,Math.max(12,30-alt*0.07),5,0,0,7);g.fill();
  }

  // omurga eklemleri (drawFighter ile birebir)
  const omur=p.omur||0;
  const bel=[hip[0]+Math.sin(p.lean)*13*f,hip[1]-Math.cos(p.lean)*13];
  const nk=[bel[0]+(Math.sin(p.lean+omur)*13+(p.reach||0))*f,bel[1]-Math.cos(p.lean+omur)*13];

  // bacaklar: uyluk + incik kapsülleri + basit ayak (silinen uzuv atlanır)
  const htw=p.hipTw||0;
  for(const[leg,side,adL]of[[p.lL,1,'lL'],[p.lR,-1,'lR']]){
    if(ftr.erasedLimb===adL&&ftr.erasedT>0)continue;
    const hx=adL==='lR'?(-2+7*htw):(2-3*htw);
    const hy=adL==='lR'?-3*htw:1.5*htw;
    const anc=[hip[0]+hx*f,hip[1]+hy];
    const kn=seg(anc[0],anc[1],leg[0],22);
    const ft=seg(kn[0],kn[1],leg[0]-leg[1]*side,20);
    kapsul(g,anc[0],anc[1],kn[0],kn[1],7);      // uyluk
    kapsul(g,kn[0],kn[1],ft[0],ft[1],5.5);      // incik
    kapsul(g,ft[0],ft[1],ft[0]+10*f,ft[1]+2,4.5); // ayak (burun ileri)
  }

  // gövde: kalça→bel→omuz kapsülleri (yamuk hacim: altta dar, omuzda geniş)
  kapsul(g,hip[0],hip[1],bel[0],bel[1],9);
  kapsul(g,bel[0],bel[1],nk[0],nk[1],10.5);

  // kollar: üst kol + ön kol kapsülleri + yumru el (silinen uzuv atlanır)
  const tw=p.twist||0,prof=p.profil||0;
  for(const[arm,side,adA]of[[p.aL,1,'aL'],[p.aR,-1,'aR']]){
    if(ftr.erasedLimb===adA&&ftr.erasedT>0)continue;
    const sx=(adA==='aR'?(-3+9*tw):(3-4*tw))*(1-.55*prof)+prof*3;
    const om=[nk[0]+sx*f,nk[1]+3-(adA==='aR'?2.5*tw:0)];
    const el=seg(om[0],om[1],arm[0],18);
    const hn=seg(el[0],el[1],arm[0]+arm[1]*side,17);
    kapsul(g,om[0],om[1],el[0],el[1],5.5);      // üst kol
    kapsul(g,el[0],el[1],hn[0],hn[1],4.5);      // ön kol
    g.fillStyle=INK;g.beginPath();g.arc(hn[0],hn[1],5.5,0,7);g.fill(); // el
    g.strokeStyle=PAPER;g.lineWidth=2;
    g.beginPath();g.arc(hn[0],hn[1],2.2,0,7);g.stroke();
  }

  // koca kafa + yüz: mevcut kafa yapısı aynen (kimlik korunur)
  const R=22;
  const hd=[nk[0]+Math.sin(p.lean+omur+(p.head||0))*(R-2)*f,nk[1]-Math.cos(p.lean+omur+(p.head||0))*(R-2)];
  drawHead(g,ftr,hd[0],hd[1],R,f,p.profil||0);

  g.restore();
  return true;
}

/* ============================================================
   SPRITE PİLOTU — antrenman modunda oyuncuyu önceden kesilmiş
   sprite kareleriyle çizer (Karakter 1 / tekvando kesimi).
   Vektör yolu, hamle süreleri, hitbox'lar DEĞİŞMEZ — salt çizim
   katmanı: anahtar kapalıyken oyun bugünkü haliyle birebir aynı.
   Kareler tools/sprite-kes.mjs ile kesilir → assets/sprites/k1/
   (tüm kareler SAĞA bakar, taban alttan 2px, ayak merkezi ortada).
   ============================================================ */
const YOL='assets/sprites/k1/';
const GARD_H=240;    // gard figürünün kesimdeki boyu (px) — ölçek referansı
const CIZIM_BOY=122; // oyundaki hedef boy (vektör çöp adam ~120px)
const K={bekleme:[],tekme:[],yurume:[],yumruk:[],hit:[],blok:[]};
let baslatildi=false,hazir=0,toplam=0,hata=false,nesil=0;

/* kareleri bir kez yükle (anahtar ilk açıldığında çağrılır);
   bir kare yüklenemezse (404/ağ) sonraki açılışta baştan dener —
   sessiz kilitlenme yok, sprite gelmezse vektör çizim sürer.
   nesil sayacı: yeniden denemede ESKİ denemenin gecikmiş onload'ları
   sayaçları bozmasın (aksi halde hazir taşar ve anahtar kalıcı ölür) */
export function loadSprites(){
  if(baslatildi&&!hata)return;
  baslatildi=true;hata=false;hazir=0;toplam=0;
  const bu=++nesil;
  const al=(dizi,i,ad)=>{
    const im=new Image();toplam++;
    im.onload=()=>{if(bu===nesil)hazir++;};
    im.onerror=()=>{if(bu===nesil){hata=true;console.warn('sprite yüklenemedi: '+YOL+ad);}};
    im.src=YOL+ad;
    dizi[i]=im;
  };
  for(let i=0;i<3;i++)al(K.bekleme,i,'bekleme-'+i+'.png');
  for(let i=0;i<4;i++)al(K.tekme,i,'tekme-'+i+'.png');
  for(let i=0;i<3;i++)al(K.yurume,i,'walk_'+(i+1)+'.png');
  for(let i=0;i<3;i++)al(K.yumruk,i,'punch_'+(i+1)+'.png');
  for(let i=0;i<2;i++)al(K.hit,i,'hit_'+(i+1)+'.png');
  for(let i=0;i<2;i++)al(K.blok,i,'block_'+(i+1)+'.png');
}
export function spriteHazir(){return baslatildi&&toplam>0&&hazir===toplam;}

/* oyun saati: ana döngü ölçekli dt gönderir — bekleme döngüsü ve nefes
   GÖSTERİ ağır çekiminde yavaşlar, hitstop'ta (dt=0) donar */
let saat=0;
export function spriteTick(dt){saat+=dt;}

/* YÜRÜME HİZALAMASI (pivot ayak sabitleme):
   Kareler ayak ağırlık-merkezine ortalanınca fazlar arası göreli ayak
   kayması siliniyordu (basılı ayak "yapışık" okunuyordu). Ölçüm: basılı
   (pivot) ayak üç karenin hücresinde 248.3 → 151.4 → 85.1 px'te
   (gövdeye göre geriye süpürülür — doğru mekanik). Hücre ofsetiyle pivot
   üç karede AYNI x'e getirilir (referans: üç pivotun ortalaması 161.6).
   PNG'lere dokunulmaz: ofset çizim anında, yerel uzayda uygulanır —
   sola yürüyüşte scale(-1,1) ile kendiliğinden aynalanır. */
const YURU_OFSET=[-89,14,75];   // tuval px; pivot_i + ofset_i ≈ 159.3 sabit
                                // (kareler kırıntı temizliğiyle yeniden kesilince yeniden ölçüldü)
const YURU_YOL_PER_KARE=72;     // kare başına kat edilen yol (ekran px) — sayı büyüdükçe
                                // tempo yavaşlar; telefon denemesiyle seçildi (2026-07)
let yuruKay=0;                  // test/ayar kancası: faz kaydırma (ekran px)
export function spriteYuruKaydir(px){yuruKay=px;}

/* YUMRUK HİZALAMASI: bu şeritte pivot ARKA AYAK. Ölçüm (taban bandı,
   alfa ağırlıklı): arka ayak hücrede 125.6 / 139.1 / 88.4 px'te.
   Referans = punch_1 (gard) — ofseti 0 olduğu için idle→yumruk geçişinde
   figür yerinden oynamaz; coil ve impact kareleri arka ayağı gard'ın
   arka ayağına sabitler, kare 3'ün ileri hamlesi serbestçe öne taşar. */
const YUMRUK_OFSET=[0,-13,37];  // tuval px; arka_ayak_i + ofset_i ≈ 125.6 sabit

/* HIT/BLOK HİZALAMASI (gard-referans standardı, 1. kare = 0):
   ölçüm — dört karede arka topuk 123.0-123.9 px (≤1px oynama): bu şeritler
   ayak-merkezi yerleşimiyle zaten pivot-hizalı gelmiş; ofsetler ölçülen
   kalan farkı sabitler */
const HIT_OFSET=[0,0];
const BLOK_OFSET=[0,1];

/* kare seçimi: yeop (Gölge Yan Tekme) + yumruk + yürüme + hit/blok sprite'lı.
   yeop: hazırlık → kare 1-2, aktif → kare 3 (uzanım), toparlanma → kare 4;
   yumruk: 1→2→3→2→1 — hazırlık coil, AKTİF PENCERE impact (hitbox ile aynı an,
   mevcut hamle verisi t0/t1 esas alınır), toparlanma coil→gard;
   hit (yerde): hitstun %60 impact → stagger; stagger durumu → stagger karesi;
   blok: gard sabit, emilimde (kvx sönene dek) emilim karesi;
   yürüme: 3 kare döngü; diğer tüm durumlar → bekleme döngüsü (3 kare ~600ms) */
function kareSec(f){
  if(f.state==='attack'&&f.mv&&f.mv.anim==='yeop'){
    const mv=f.mv;
    if(f.st<mv.t0*0.5)return{im:K.tekme[0],bob:0};
    if(f.st<mv.t0)return{im:K.tekme[1],bob:0};
    if(f.st<=mv.t1+0.02)return{im:K.tekme[2],bob:0};
    return{im:K.tekme[3],bob:0};
  }
  if(f.state==='attack'&&f.mvKind==='p'&&!f.airMove&&f.mv&&f.mv.anim!=='upper'){
    const mv=f.mv,st=f.st;
    let i;
    if(st<mv.t0*0.3)i=0;                      // gard → coil girişi
    else if(st<mv.t0)i=1;                     // hazırlık: coil
    else if(st<=mv.t1+0.02)i=2;               // AKTİF: impact — hitbox penceresi [t0,t1] tamamen burada
    else if(st<mv.t1+(mv.dur-mv.t1)*0.6)i=1;  // toparlanma: coil
    else i=0;                                 // gard
    return{im:K.yumruk[i],bob:0,of:YUMRUK_OFSET[i]};
  }
  // darbe tepkisi (yalnız yerde — hava/juggle seti ileride, şimdilik bekleme düşer):
  // hitstun'un ilk %60'ı impact, kalanı stagger karesi. Toplam süre mevcut
  // veriden türetilir: st ileri sayar, stun geri sayar → toplam ≈ st+stun
  // (görsel taban 0.32 sn — fighter.js'teki hit çıkış eşiği), veri DEĞİŞMEDİ
  if(f.state==='hit'&&f.grounded()){
    const toplam=Math.max(.32,f.st+Math.max(0,f.stun||0));
    const i=f.st<toplam*0.6?0:1;
    return{im:K.hit[i],bob:0,of:HIT_OFSET[i]};
  }
  if(f.state==='stagger'&&f.grounded())return{im:K.hit[1],bob:0,of:HIT_OFSET[1]}; // sendeleme = stagger karesi
  // blok: gard sabit; darbe emilince geri itiş (kvx) sönene dek emilim karesi
  // (~0.2 sn, bloklanan hamlenin itişiyle ölçeklenir — ayrı blockstun verisi yok)
  if(f.state==='block')
    return Math.abs(f.kvx||0)>=2
      ?{im:K.blok[1],bob:0,of:BLOK_OFSET[1]}
      :{im:K.blok[0],bob:0,of:BLOK_OFSET[0]};
  if(f.state==='walk'){
    // kare = kat edilen yolun fonksiyonu: tempo hıza orantılı (kare başına
    // ADIM_EKRAN/3 px yol), geri çekilirken yol azaldığı için döngü
    // kendiliğinden tersine döner, hitstop/ağır çekimde donar, duvarda durur
    const yol=((f.x+yuruKay)*f.facing)/YURU_YOL_PER_KARE;
    const i=((Math.floor(yol)%3)+3)%3;
    return{im:K.yurume[i],bob:0,of:YURU_OFSET[i]};
  }
  return{im:K.bekleme[Math.floor(saat/0.2)%3],bob:Math.sin(saat*2*Math.PI/1.2)*1.5}; // hafif nefes
}

/* true dönerse çizim yapıldı; yüklenmediyse false → vektör çizim devam eder */
export function drawSprite(g,ftr,ground,ink){
  if(!spriteHazir())return false;
  const {im,bob,of}=kareSec(ftr);
  if(!im||!im.naturalWidth)return false;
  const s=CIZIM_BOY/GARD_H,w=im.naturalWidth*s,h=im.naturalHeight*s;
  // zemin gölgesi (vektörle aynı dil; havada küçülür)
  if(ftr.state!=='ko'){
    const alt=ground-ftr.y;
    g.fillStyle=ink==='#1A1A1A'?'rgba(0,0,0,.08)':'rgba(255,255,255,.08)';
    g.beginPath();g.ellipse(ftr.x,ground+4,Math.max(12,30-alt*0.07),5,0,0,7);g.fill();
  }
  g.save();
  g.translate(ftr.x,ftr.y+6+bob);   // taban: vektör ayakkabı hizası (~y+5)
  if(ftr.facing===-1)g.scale(-1,1); // kareler SAĞA bakar; sola dönükte aynala
  g.drawImage(im,-w/2+(of||0)*s,-h+2*s,w,h); // hücre ofseti yerel uzayda: yönle birlikte aynalanır; 2px alt payı düş
  g.restore();
  return true;
}

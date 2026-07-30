/* ============================================================
   SPRITE GÖRÜNÜMÜ — GÖLGE karakteri önceden kesilmiş sprite
   kareleriyle çizilir (TÜM modlarda: dövüş + antrenman); diğer
   karakterler vektör kalır. Anahtar globaldir, localStorage'da
   kalıcıdır, varsayılanı AÇIK. Sprite'ı olmayan durumlar (çömelme,
   hava, fırlatma, özel, fatality...) vektör çizime düşer.
   Vektör yolu, hamle süreleri, hitbox'lar DEĞİŞMEZ — salt çizim.
   Kareler tools/sprite-kes.mjs ile kesilir → assets/sprites/k1/
   (tüm kareler SAĞA bakar, taban alttan 2px, ayak merkezi ortada).
   ============================================================ */
const YOL='assets/sprites/k1/';

/* global görünüm modu: 'sprite' (varsayılan) · 'sprite34' (3/4 açı bekleme
   TESTİ — yalnız idle farklı, kalan hamleler profil setiyle aynı) ·
   'iskelet' (prototip) · 'vektor'. localStorage 'cd-sprite':
   '1'=sprite, '3'=sprite34, '2'=iskelet, '0'=vektör (geriye uyumlu) */
let mod='sprite';
try{
  const k=localStorage.getItem('cd-sprite');
  if(k==='0')mod='vektor';else if(k==='2')mod='iskelet';else if(k==='3')mod='sprite34';
}catch(e){}
const KAYIT={sprite:'1',sprite34:'3',iskelet:'2',vektor:'0'};
export function gorunum(){return mod;}
export function gorunumAyarla(m){
  mod=KAYIT[m]?m:'sprite';
  try{localStorage.setItem('cd-sprite',KAYIT[mod]);}catch(e){}
  if(mod==='sprite'||mod==='sprite34')loadSprites();
}
/* bu dövüşçü hangi görünümle çizilmeli? (karakter bazlı: yalnız GÖLGE) */
export function spriteUygun(f){return (mod==='sprite'||mod==='sprite34')&&f.ch&&f.ch.id==='golge';}
export function iskeletUygun(f){return mod==='iskelet'&&f.ch&&f.ch.id==='golge';}
const GARD_H=240;    // gard figürünün kesimdeki boyu (px) — ölçek referansı
const CIZIM_BOY=122; // oyundaki hedef boy (vektör çöp adam ~120px)
const K={bekleme:[],tekme:[],yurume:[],yumruk:[],hit:[],blok:[],idle34:[]};
let baslatildi=false,hazir=0,toplam=0,hata=false,nesil=0;

/* kareleri bir kez yükle (anahtar ilk açıldığında çağrılır);
   bir kare yüklenemezse (404/ağ) sonraki açılışta baştan dener —
   sessiz kilitlenme yok, sprite gelmezse vektör çizim sürer.
   nesil sayacı: yeniden denemede ESKİ denemenin gecikmiş onload'ları
   sayaçları bozmasın (aksi halde hazir taşar ve anahtar kalıcı ölür) */
export function loadSprites(){
  if(typeof Image==='undefined')return; // Node test iskeleti: Image yok → vektör yolu
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
  for(let i=0;i<6;i++)al(K.bekleme,i,'idle6_'+(i+1)+'.png'); // videodan 6 karelik nefes çevrimi
  for(let i=0;i<4;i++)al(K.tekme,i,'tekme-'+i+'.png');
  for(let i=0;i<8;i++)al(K.yurume,i,'walk8_'+(i+1)+'.png'); // videodan 8 karelik çevrim
  for(let i=0;i<6;i++)al(K.yumruk,i,'punch6_'+(i+1)+'.png'); // videodan 6 karelik yumruk olayı
  for(let i=0;i<2;i++)al(K.hit,i,'hit_'+(i+1)+'.png');
  for(let i=0;i<2;i++)al(K.blok,i,'block_'+(i+1)+'.png');
  for(let i=0;i<8;i++)al(K.idle34,i,'idle34_'+(i+1)+'.png'); // 3/4 açı bekleme (TEST)
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
/* 8 karelik VİDEO çevrimi (video_walk.mp4 → alternatif set, onaylı):
   basılı ayak zinciri tuvalde 193.9→130.2 kayar (tek duruş fazı; ayak
   değişimi döngü sarmalında — 17 karelik periyot bir ADIM). Ofsetler
   basılı ayağı hücrede sabitler (referans: zincir ortalaması 166.6). */
const YURU_OFSET=[-27,-20,-14,-11,-11,21,27,36]; // tuval px, 8 kare
const YURU_YOL_PER_KARE=27;     // his ayarı (15 de hızlı bulundu → 27 = eski 3-kare hissi).
                                // NOT: tempo arayışı GEÇİCİ — kalıcı çözüm, sıradaki
                                // pakette walk döngüsünün 12-16 kareye genişletilip
                                // çevrim süresinin video kaynağına eşitlenmesi.
                                // 27 o zamana kadar köprü değer.
let yuruKay=0;                  // test/ayar kancası: faz kaydırma (ekran px)
export function spriteYuruKaydir(px){yuruKay=px;}

/* YUMRUK HİZALAMASI (video 6-kare, gard-referanslı): ölçümde altı
   karenin taban kümesi 176.4-177.3 bandında (<1px) — video sabit
   duruştan vuruyor, kareler kendiliğinden hizalı → ofsetler ölçülmüş
   SIFIRLAR (ileride ayar gerekirse dizi hazır). */
const YUMRUK_OFSET=[0,0,0,0,0,0]; // tuval px, 6 kare

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
   yürüme: 8 kare yol-senkron döngü; bekleme: 6 karelik video nefesi
   (~4 sn çevrim); diğer tüm durumlar → vektör */
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
    let i; // 6 faz: gard→coil→uzanım-başı→IMPACT→geri çekiş→gard-dönüş
    if(st<mv.t0*0.35)i=0;
    else if(st<mv.t0*0.75)i=1;
    else if(st<mv.t0)i=2;
    else if(st<=mv.t1+0.02)i=3;               // AKTİF: IMPACT — hitbox penceresi [t0,t1] tamamen burada
    else if(st<mv.t1+(mv.dur-mv.t1)*0.55)i=4;
    else i=5;
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
    const i=((Math.floor(yol)%8)+8)%8; // 8 karelik çevrim; geri yürüyüş = ters sıra (yol azalır)
    return{im:K.yurume[i],bob:0,of:YURU_OFSET[i]};
  }
  if(f.state==='idle'){
    // SPRITE 3/4 TESTİ: 8 kare @12fps (60fps'te kare başına 5 oyun karesi);
    // modulo döngü kesintisiz — 8'den 1'e geçişte duraklama yok
    if(mod==='sprite34')
      return{im:K.idle34[((Math.floor(saat*12)%8)+8)%8],bob:0};
    // 6 karelik video nefesi: ~4.08 sn çevrim → kare başına 0.68 sn.
    // Yapay dikey bob KALDIRILDI — nefes hareketi karelerin içinde
    return{im:K.bekleme[Math.floor(saat/0.68)%6],bob:0};
  }
  return null; // sprite'ı olmayan durum (çömelme, hava, fırlatma...) → vektör çizim
}

/* true dönerse çizim yapıldı; yüklenmediyse/eşlenmemiş durumdaysa false → vektör */
export function drawSprite(g,ftr,ground,ink){
  if(!spriteHazir())return false;
  const sec=kareSec(ftr);
  if(!sec)return false;
  const {im,bob,of}=sec;
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

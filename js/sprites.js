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
const K={bekleme:[],tekme:[],yurume:[]};
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
const YURU_OFSET=[-87,10,76];   // tuval px; pivot_i + ofset_i ≈ 161.6 sabit
const ADIM_EKRAN=83;            // bir çevrimde kat edilen yol (ekran px) = 163.2 tuval × ölçek
let yuruKay=0;                  // test/ayar kancası: faz kaydırma (ekran px)
export function spriteYuruKaydir(px){yuruKay=px;}

/* kare seçimi: yeop (Gölge Yan Tekme) + yürüme sprite'lı — pilot bilerek dar.
   yeop: hazırlık → kare 1-2, aktif → kare 3 (uzanım), toparlanma → kare 4;
   yürüme: 3 kare döngü; diğer tüm durumlar → bekleme döngüsü (3 kare ~600ms) */
function kareSec(f){
  if(f.state==='attack'&&f.mv&&f.mv.anim==='yeop'){
    const mv=f.mv;
    if(f.st<mv.t0*0.5)return{im:K.tekme[0],bob:0};
    if(f.st<mv.t0)return{im:K.tekme[1],bob:0};
    if(f.st<=mv.t1+0.02)return{im:K.tekme[2],bob:0};
    return{im:K.tekme[3],bob:0};
  }
  if(f.state==='walk'){
    // kare = kat edilen yolun fonksiyonu: tempo hıza orantılı (kare başına
    // ADIM_EKRAN/3 px yol), geri çekilirken yol azaldığı için döngü
    // kendiliğinden tersine döner, hitstop/ağır çekimde donar, duvarda durur
    const yol=((f.x+yuruKay)*f.facing)/(ADIM_EKRAN/3);
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

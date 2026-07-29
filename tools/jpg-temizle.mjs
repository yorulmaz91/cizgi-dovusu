/* ============================================================
   JPG → TEMİZ PNG ÇEVİRİCİ — KALICI HAT KURALI:
   Üretim hattına giren her JPG bu adımdan geçer; hat her zaman
   PNG işler (sprite-kes.mjs .jpg kaynakları otomatik buradan okur).
   Temizlik: gri tonlamaya indir (JPEG renk gürültüsü atılır),
   parlaklık >= beyazEsik → saf beyaz (kontur çevresindeki sivrisinek
   gürültüsü / ringing silinir), <= siyahEsik → saf siyah (siyah içi
   blok dalgalanması sabitlenir), arası korunur (tarama/ara ton).
   Eşikler kimlik_v1.jpg ölçümüyle kalibre edildi: uzak arka plan
   min 251; artık bandı 236-251'de kümeleniyor; sanat ara tonları
   daha koyuda → beyazEsik=240 güvenli.
   Kullanım: node tools/jpg-temizle.mjs girdi.jpg [cikti.png]
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import {PNG} from 'pngjs';
import jpeg from 'jpeg-js';

export function jpgOkuTemizle(dosya,{beyazEsik=240,siyahEsik=64}={}){
  const j=jpeg.decode(fs.readFileSync(dosya),{useTArray:true});
  const out=new PNG({width:j.width,height:j.height});
  for(let i=0;i<j.width*j.height;i++){
    let v=Math.round((j.data[i*4]+j.data[i*4+1]+j.data[i*4+2])/3);
    if(v>=beyazEsik)v=255;else if(v<=siyahEsik)v=0;
    out.data[i*4]=v;out.data[i*4+1]=v;out.data[i*4+2]=v;out.data[i*4+3]=255;
  }
  return out;
}

/* CLI */
if(process.argv[1]&&import.meta.url.endsWith(path.basename(process.argv[1]))){
  const girdi=process.argv[2];
  if(!girdi){console.log('kullanım: node tools/jpg-temizle.mjs girdi.jpg [cikti.png]');process.exit(1);}
  const cikti=process.argv[3]||girdi.replace(/\.jpe?g$/i,'.png');
  const png=jpgOkuTemizle(path.resolve(girdi));
  fs.writeFileSync(path.resolve(cikti),PNG.sync.write(png));
  console.log('yazıldı: '+cikti+' ('+png.width+'x'+png.height+')');
}

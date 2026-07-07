/* ============================================================
   GİRDİLER — klavye + dokunmatik butonlar + tam ekran düğmesi
   Klavye: ← → hareket · Z yumruk · X tekme · C blok · V skil
   ============================================================ */
import {cvs,resize} from './render.js';

export const keys={left:0,right:0,up:0,down:0,punch:0,kick:0,block:0,special:0,throw:0,any:0};
const KEYMAP={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down',z:'punch',x:'kick',c:'block',v:'special'};
addEventListener('keydown',e=>{const k=KEYMAP[e.key];if(k)keys[k]=1;keys.any=1;});
addEventListener('keyup',e=>{const k=KEYMAP[e.key];if(k)keys[k]=0;});
document.querySelectorAll('.cbtn').forEach(b=>{
  const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=1;keys.any=1;b.classList.add('held');});
  b.addEventListener('pointerup',()=>{keys[k]=0;b.classList.remove('held');});
  b.addEventListener('pointercancel',()=>{keys[k]=0;b.classList.remove('held');});
  b.addEventListener('pointerleave',()=>{keys[k]=0;b.classList.remove('held');});
});
/* tuval üstü dokunuşlar (seçim ekranı düğmeleri için); her kare sonunda main.js temizler */
export const tap={x:0,y:0,on:false};
cvs.addEventListener('pointerdown',e=>{keys.any=1;tap.x=e.clientX;tap.y=e.clientY;tap.on=true;});

/* ---------------- tam ekran ---------------- */
const fsBtn=document.getElementById('fsBtn');
fsBtn.addEventListener('click',async()=>{
  try{
    if(!document.fullscreenElement){
      await document.documentElement.requestFullscreen({navigationUI:'hide'});
      // yatay kilit dene (Android Chrome'da çalışır)
      if(screen.orientation&&screen.orientation.lock){
        try{await screen.orientation.lock('landscape');}catch(e){}
      }
    }else{
      await document.exitFullscreen();
    }
  }catch(e){/* önizleme pencereleri tam ekrana izin vermeyebilir */}
});
document.addEventListener('fullscreenchange',()=>{
  fsBtn.textContent=document.fullscreenElement?'✕':'⛶';
  setTimeout(resize,100);
});
